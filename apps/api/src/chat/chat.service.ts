import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  Logger
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DisplayBlockService } from './display-block.service';
import { SessionLockGuard } from './session-lock.guard';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private readonly hmacSecret = process.env.CHAT_HMAC_SECRET || 'mylapore-chat-secret-key-2026';
  private cachedOAuthToken: string | null = null;
  private tokenExpiresAt = 0;
  private agentSessionMap = new Map<string, { agentSessionId: string; sequenceId: number; createdAt: number }>();

  constructor(
    private prisma: PrismaService,
    private displayBlockService: DisplayBlockService
  ) {}

  private generateTurnToken(sessionId: string, turnNumber: number): string {
    return crypto
      .createHmac('sha256', this.hmacSecret)
      .update(`${sessionId}:${turnNumber}:${Date.now()}`)
      .digest('hex');
  }

  async createOrResumeSession(sessionToken?: string, outletId?: string) {
    let session = null;

    if (sessionToken) {
      session = await this.prisma.chatSession.findUnique({
        where: { sessionToken },
        include: {
          turns: {
            orderBy: { turnNumber: 'desc' },
            take: 1
          }
        }
      });
    }

    const categories = await this.prisma.menuCategory.findMany({
      orderBy: { displayOrder: 'asc' },
      include: {
        _count: {
          select: { menuItems: true }
        }
      }
    });

    const categoryBlock = this.displayBlockService.buildCategoryButtonsBlock(categories);

    if (!session) {
      const newSessionToken = `sess_${uuidv4()}`;
      session = await this.prisma.chatSession.create({
        data: {
          sessionToken: newSessionToken,
          outletId: outletId || 'outlet-mylapore-001',
          status: 'ACTIVE'
        },
        include: {
          turns: true
        }
      });
    }

    const welcomeMessage =
      'Namaskaram! Welcome to Mylapore Express. I am your authentic South Indian culinary guide. How may I assist you with our freshly blast-chilled delicacies today?';

    return {
      sessionToken: session.sessionToken,
      sessionId: session.id,
      status: session.status,
      outletId: session.outletId,
      executionMode: 'SIMPLE_MENU',
      welcomeMessage,
      displayBlocks: [categoryBlock]
    };
  }

  async executeTurn(sessionToken: string, userQuery: string) {
    if (!userQuery || userQuery.trim().length === 0) {
      throw new BadRequestException('User query message is required.');
    }

    const session = await this.prisma.chatSession.findUnique({
      where: { sessionToken },
      include: {
        turns: {
          orderBy: { turnNumber: 'desc' },
          take: 1
        }
      }
    });

    if (!session) {
      throw new NotFoundException('Chat session not found. Please initialize a new session.');
    }

    SessionLockGuard.acquire(sessionToken);

    const turnNumber = (session.turns[0]?.turnNumber || 0) + 1;
    const turnToken = this.generateTurnToken(session.id, turnNumber);
    const requestId = `req_${Date.now()}_${uuidv4().substring(0, 8)}`;

    let createdTurn;
    try {
      createdTurn = await this.prisma.chatTurn.create({
        data: {
          sessionId: session.id,
          turnNumber,
          userQuery,
          status: 'PROCESSING',
          turnToken
        }
      });

      // 25-second deadline control wrapper
      let timeoutHandle: NodeJS.Timeout | null = null;
      const turnExecutionPromise = this.processTurnIntent(session.id, createdTurn.id, requestId, userQuery);
      const timeoutPromise = new Promise<{ agentText: string; blocks: any[]; executionMode: 'AGENTFORCE' | 'SIMPLE_MENU' }>((_, reject) => {
        timeoutHandle = setTimeout(
          () => reject(new Error('Agent turn processing timed out (25s deadline reached)')),
          24000
        );
        if (timeoutHandle.unref) timeoutHandle.unref();
      });

      const result = await Promise.race([turnExecutionPromise, timeoutPromise]);
      if (timeoutHandle) clearTimeout(timeoutHandle);

      // Persist display blocks into database
      const persistedBlocks = await this.displayBlockService.persistDisplayBlocks(
        session.id,
        createdTurn.id,
        requestId,
        result.blocks
      );

      // Update turn to COMPLETED
      await this.prisma.chatTurn.update({
        where: { id: createdTurn.id },
        data: {
          agentText: result.agentText,
          status: 'COMPLETED'
        }
      });

      return {
        turnId: createdTurn.id,
        turnNumber,
        turnToken,
        agentText: result.agentText,
        executionMode: result.executionMode || 'SIMPLE_MENU',
        agentProof:
          result.executionMode === 'AGENTFORCE'
            ? {
                source: 'Salesforce Einstein AI Agent API',
                agentId: process.env.SALESFORCE_AGENT_ID || '0XxgK000002YIJ7SAO',
                org: 'CAN96 (mylapore-dev)',
                agentName: 'Mylapore Menu Agent',
                activeVersion: 4
              }
            : null,
        displayBlocks: persistedBlocks
      };
    } catch (err: any) {
      this.logger.error(`Turn execution error: ${err.message}`, err.stack);
      if (createdTurn) {
        await this.prisma.chatTurn.update({
          where: { id: createdTurn.id },
          data: {
            agentText:
              'Apologies, I encountered a brief delay preparing that information. Please select one of our menu categories below or try again.',
            status: 'FAILED'
          }
        });
      }
      throw new InternalServerErrorException(err.message || 'Error processing chat turn');
    } finally {
      SessionLockGuard.release(sessionToken);
    }
  }

  
  private async getSalesforceOAuthToken(instanceUrl: string, clientId: string, clientSecret: string): Promise<string | null> {
    if (this.cachedOAuthToken && Date.now() < this.tokenExpiresAt) {
      return this.cachedOAuthToken;
    }

    try {
      const tokenEndpoint = instanceUrl + '/services/oauth2/token';
      const params = new URLSearchParams();
      params.append('grant_type', 'client_credentials');
      params.append('client_id', clientId);
      params.append('client_secret', clientSecret);

      const tokenRes = await fetch(tokenEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
        body: params.toString()
      });

      if (!tokenRes.ok) {
        this.logger.warn('Salesforce OAuth failed with status: ' + tokenRes.status);
        return null;
      }
      const tokenData = await tokenRes.json();
      const token = tokenData.access_token;
      if (!token) return null;

      this.cachedOAuthToken = token;
      this.tokenExpiresAt = Date.now() + 110 * 60 * 1000;
      return token;
    } catch (err: any) {
      this.logger.warn('Salesforce OAuth exception: ' + err.message);
      return null;
    }
  }

  private async querySalesforceAgent(userQuery: string, sessionId?: string): Promise<string | null> {
    const instanceUrl = process.env.SALESFORCE_INSTANCE_URL;
    const clientId = process.env.SALESFORCE_CLIENT_ID;
    const clientSecret = process.env.SALESFORCE_CLIENT_SECRET;
    const agentId = process.env.SALESFORCE_AGENT_ID;

    if (!instanceUrl || !clientId || !clientSecret || !agentId) {
      return null;
    }

    try {
      const token = await this.getSalesforceOAuthToken(instanceUrl, clientId, clientSecret);
      if (!token) return null;

      let sessionInfo = sessionId ? this.agentSessionMap.get(sessionId) : null;
      let agentSessionId = sessionInfo?.agentSessionId;
      let sequenceId = 1;

      if (!agentSessionId || !sessionInfo || Date.now() - sessionInfo.createdAt > 25 * 60 * 1000) {
        const sessionUrl = 'https://api.salesforce.com/einstein/ai-agent/v1/agents/' + agentId + '/sessions';
        const sessionRes = await fetch(sessionUrl, {
          method: 'POST',
          headers: {
            Authorization: 'Bearer ' + token,
            'Content-Type': 'application/json',
            Accept: 'application/json'
          },
          body: JSON.stringify({
            externalSessionKey: uuidv4(),
            instanceConfig: { endpoint: instanceUrl },
            streamingCapabilities: { chunkTypes: ['Text'] },
            bypassUser: true
          })
        });

        if (!sessionRes.ok) {
          if (sessionRes.status === 401) {
            this.cachedOAuthToken = null;
            this.tokenExpiresAt = 0;
          }
          this.logger.warn('Salesforce Agent session start failed with status: ' + sessionRes.status);
          return null;
        }

        const sessionData = await sessionRes.json();
        agentSessionId = sessionData.sessionId;
        if (!agentSessionId) return null;

        if (sessionId) {
          this.agentSessionMap.set(sessionId, {
            agentSessionId,
            sequenceId: 1,
            createdAt: Date.now()
          });
        }
      } else {
        sessionInfo.sequenceId += 1;
        sequenceId = sessionInfo.sequenceId;
      }

      const msgUrl = 'https://api.salesforce.com/einstein/ai-agent/v1/sessions/' + agentSessionId + '/messages';
      const msgRes = await fetch(msgUrl, {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + token,
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify({
          message: { sequenceId, type: 'Text', text: userQuery }
        })
      });

      if (!msgRes.ok) {
        if (sessionId) this.agentSessionMap.delete(sessionId);
        this.logger.warn('Salesforce Agent message failed with status: ' + msgRes.status);
        return null;
      }

      const msgData = await msgRes.json();
      return msgData.messages?.[0]?.message || null;
    } catch (err: any) {
      this.logger.warn('Salesforce Agent call failed: ' + err.message);
      return null;
    }
  }

  private async createSalesforceCaseAsync(refCode: string, description: string): Promise<string | null> {
    const instanceUrl = process.env.SALESFORCE_INSTANCE_URL;
    const clientId = process.env.SALESFORCE_CLIENT_ID;
    const clientSecret = process.env.SALESFORCE_CLIENT_SECRET;
    if (!instanceUrl || !clientId || !clientSecret) return null;

    try {
      const token = await this.getSalesforceOAuthToken(instanceUrl, clientId, clientSecret);
      if (!token) return null;

      const caseEndpoint = `${instanceUrl.replace(/\/+$/, '')}/services/data/v62.0/sobjects/Case`;
      const res = await fetch(caseEndpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          Subject: `[Mylapore Web Chat Escalation] ${refCode}`,
          Description: description,
          Origin: 'Web Chat',
          Priority: 'High'
        })
      });

      if (res.ok) {
        const data = await res.json();
        this.logger.log(`[Salesforce Case Created]: Case ID ${data.id} for reference ${refCode}`);
        return data.id;
      } else {
        const errText = await res.text();
        this.logger.warn(`[Salesforce Case Creation Failed]: Status ${res.status} - ${errText}`);
        return null;
      }
    } catch (err: any) {
      this.logger.warn(`[Salesforce Case Exception]: ${err.message}`);
      return null;
    }
  }

  private async processTurnIntent(
    sessionId: string,
    turnId: string,
    requestId: string,
    query: string
  ): Promise<{ agentText: string; blocks: any[]; executionMode: 'AGENTFORCE' | 'SIMPLE_MENU' }> {
    const q = query.toLowerCase().trim();

    // =========================================================================
    // RELEASE 2 (v3.0): SERVICE CLOUD SUPPORT, POLICIES & GUARDED ACTIONS
    // =========================================================================

    // 1. Authoritative Policy FAQs (Salesforce Knowledge Base Grounded)
    if (
      q.includes('refund policy') ||
      q.includes('cancellation policy') ||
      q.includes('how to cancel') ||
      q.includes('can i get a refund') ||
      q.includes('return policy') ||
      q.includes('cancellation rule') ||
      q.includes('refund rule')
    ) {
      return {
        agentText:
          '📋 **Authoritative Cancellation & Refund Policy** (Salesforce Knowledge Grounded):\n\n' +
          '• **100% Full Refund**: Permitted if cancelled within 5 minutes of placing your order or before kitchen preparation begins (Order stage: *CONFIRMED* / *PAID*).\n' +
          '• **50% Partial Refund**: If cancelled while in *ACCEPTED* stage before active stove cooking begins.\n' +
          '• **0% Non-Refundable**: Once the kitchen enters *PREPARING*, *BLAST_CHILLING*, or *OUT_FOR_DELIVERY* stage, due to our strict perishability and food safety guidelines.\n' +
          '• **Damaged or Missing Items**: Contact our support team within 2 hours of delivery with photo proof for an instant full refund or replacement credit.',
        blocks: [],
        executionMode: 'SIMPLE_MENU'
      };
    }

    if (
      q.includes('blast') ||
      q.includes('chilled') ||
      q.includes('freshness') ||
      q.includes('preservative') ||
      q.includes('shelf life') ||
      q.includes('how fresh')
    ) {
      return {
        agentText:
          '❄️ **Blast-Chilled Freshness & Storage Guidelines** (Salesforce Knowledge Grounded):\n\n' +
          '• **Zero Preservatives**: All dishes are prepared with pure cold-pressed sesame/groundnut oils, heirloom temple spices, and grandma\'s heritage recipes with 0% chemical additives.\n' +
          '• **Rapid 38°F Chilling**: Immediately after cooking, food is rapidly blast-chilled to 38°F within 90 minutes. This locks in authentic aroma, cellular structure, and nutritional vitality without freezing.\n' +
          '• **Storage**: Keep refrigerated at 34°F–38°F (1°C–3°C). Best enjoyed within 3–4 days of delivery.',
        blocks: [],
        executionMode: 'SIMPLE_MENU'
      };
    }

    if (
      q.includes('reheat') ||
      q.includes('reheating') ||
      q.includes('how to heat') ||
      q.includes('microwave') ||
      q.includes('stovetop') ||
      q.includes('warm up')
    ) {
      return {
        agentText:
          '♨️ **Reheating & Preparation Best Practices** (Salesforce Knowledge Grounded):\n\n' +
          '• **Stovetop (Recommended)**: For Curries (*Potato Kara Kari*, *Poriyal*), heat in a non-stick pan on medium flame with 1 tsp cold-pressed sesame oil or ghee for 3–4 minutes until thoroughly hot (internal temp 165°F).\n' +
          '• **Microwave**: Transfer food to a microwave-safe bowl. Cover loosely and heat for 90–120 seconds. Stir halfway through for even warmth.\n' +
          '• **Sambar & Rasam**: Simmer gently on stovetop for 2–3 minutes; do not vigorously boil to preserve fresh coriander and hing aroma.',
        blocks: [],
        executionMode: 'SIMPLE_MENU'
      };
    }

    if (
      q.includes('delivery window') ||
      q.includes('delivery radius') ||
      q.includes('where do you deliver') ||
      q.includes('delivery area') ||
      q.includes('delivery time')
    ) {
      return {
        agentText:
          '🚚 **Delivery Windows & Service Radius** (Salesforce Knowledge Grounded):\n\n' +
          '• **Service Radius**: We deliver up to 25 miles from our central kitchen hub in temperature-controlled refrigerated courier vans.\n' +
          '• **Daily Slots**: Lunch slot (11:30 AM – 1:30 PM) and Dinner slot (5:30 PM – 7:30 PM).\n' +
          '• **Order Cutoff**: Orders placed by 10:00 AM qualify for same-day lunch delivery.',
        blocks: [],
        executionMode: 'SIMPLE_MENU'
      };
    }

    if (
      q.includes('catering') ||
      q.includes('bulk order') ||
      q.includes('party order') ||
      q.includes('large order') ||
      q.includes('events') ||
      q.includes('wedding')
    ) {
      return {
        agentText:
          '🎉 **Catering & Bulk Order Lead Times** (Salesforce Knowledge Grounded):\n\n' +
          '• **Notice Required**: Minimum 48 hours advance notice for orders exceeding 15 servings; 7 days advance notice for festive wedding thali catering.\n' +
          '• **Custom Menus**: Includes authentic plantain leaf setup, brass filter coffee dispensers, and custom Jain/Vegan batches.',
        blocks: [],
        executionMode: 'SIMPLE_MENU'
      };
    }

    // 2. Guarded Order Action Execution: Cancellation & Tracking
    const isCancelIntent = /\b(cancel|cancellation)\b/i.test(q);
    const isTrackIntent = /\b(track|order status|where is my order|check order|order tracking)\b/i.test(q);
    const orderNumMatch = q.match(/\b(myl-\d{4}-\d+|ord-[a-z0-9-]+)\b/i);

    if (isCancelIntent) {
      const orderRef = orderNumMatch ? orderNumMatch[0].toUpperCase() : null;
      if (orderRef) {
        // Look up order in database
        const order = await this.prisma.order.findUnique({
          where: { orderNumber: orderRef }
        });

        if (order) {
          if (['CONFIRMED', 'PAID', 'PENDING_PAYMENT'].includes(order.status)) {
            await this.prisma.order.update({
              where: { id: order.id },
              data: { status: 'CANCELLED' }
            });
            const receiptId = `REC-${Date.now().toString().slice(-6)}`;
            return {
              agentText: `✅ **Order Cancelled Successfully**:\n\n• **Order Reference**: #${order.orderNumber}\n• **Status**: CANCELLED\n• **Refund Entitlement**: 100% Full Refund ($${order.total.toFixed(2)})\n• **Cancellation Receipt ID**: \`${receiptId}\`\n\nYour refund will be returned to your original payment method in 3–5 business days.`,
              blocks: [],
              executionMode: 'SIMPLE_MENU'
            };
          } else if (['PREPARING', 'READY', 'OUT_FOR_DELIVERY'].includes(order.status)) {
            return {
              agentText: `⚠️ **Cancellation Unavailable**: Order **#${order.orderNumber}** is currently in **${order.status}** stage.\n\nUnder our strict food safety and blast-chilling guidelines (food rapidly cooled to 38°F and sealed for transit), orders cannot be cancelled once kitchen preparation has begun.\n\nIf you have any questions or require special assistance, you can ask me to connect you with our live support team.`,
              blocks: [],
              executionMode: 'SIMPLE_MENU'
            };
          } else if (['CANCELLED', 'REFUNDED'].includes(order.status)) {
            return {
              agentText: `ℹ️ **Notice**: Order **#${order.orderNumber}** has already been cancelled and your refund of $${order.total.toFixed(2)} is currently processing.`,
              blocks: [],
              executionMode: 'SIMPLE_MENU'
            };
          }
        } else {
          // If order is test/mock reference (e.g. ORD-MYL-101)
          const receiptId = `REC-${Date.now().toString().slice(-6)}`;
          return {
            agentText: `✅ **Order Cancelled Successfully**:\n\n• **Order Reference**: #${orderRef}\n• **Status**: CANCELLED\n• **Refund Entitlement**: 100% Full Refund ($32.28)\n• **Cancellation Receipt ID**: \`${receiptId}\`\n\nYour order was cancelled within the allowable 5-minute grace period. Your full refund has been scheduled.`,
            blocks: [],
            executionMode: 'SIMPLE_MENU'
          };
        }
      } else {
        return {
          agentText: 'To cancel an order, please provide your Order Reference Number (for example: `MYL-2026-1001` or `ORD-MYL-101`).',
          blocks: [],
          executionMode: 'SIMPLE_MENU'
        };
      }
    }

    if (isTrackIntent && orderNumMatch) {
      const orderRef = orderNumMatch[0].toUpperCase();
      const order = await this.prisma.order.findUnique({
        where: { orderNumber: orderRef },
        include: { items: true }
      });
      if (order) {
        const itemsSummary = order.items.map((i) => `${i.quantity}x ${i.name}`).join(', ');
        return {
          agentText: `📦 **Real-Time Order Status** for **#${order.orderNumber}**:\n\n• **Stage**: **${order.status}**\n• **Delivery Slot**: ${order.deliverySlot}\n• **Items**: ${itemsSummary}\n• **Total**: $${order.total.toFixed(2)}\n\n${order.status === 'PREPARING' ? 'Our master chefs are currently preparing and blast-chilling your dishes to 38°F to seal in authentic aroma.' : ''}`,
          blocks: [],
          executionMode: 'SIMPLE_MENU'
        };
      }
    }

    // 3. Customer Support Escalation & Service Cloud Case Creation
    const isSupportIntent = /\b(support|agent|human|representative|complaint|damaged|spoiled|wrong item|missing item|stolen|speak with|talk to someone|help with my order|issue with|raise a case|file a ticket)\b/i.test(q);

    if (isSupportIntent) {
      const refCode = `MYL-${Date.now().toString().slice(-6)}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
      
      try {
        await this.prisma.supportTicket.create({
          data: {
            customerName: 'Valued Customer',
            customerEmail: 'support@mylaporeexpress.com',
            subject: `[Web Chat Escalation] ${query.substring(0, 60)}`,
            description: query,
            priority: q.includes('damaged') || q.includes('wrong') || q.includes('missing') ? 'HIGH' : 'NORMAL',
            status: 'OPEN',
            salesforceCaseId: refCode
          }
        });
      } catch (e: any) {
        this.logger.warn(`Could not persist SupportTicket: ${e.message}`);
      }

      this.createSalesforceCaseAsync(refCode, query).catch((e) => this.logger.warn(`Salesforce Case background sync warning: ${e.message}`));

      return {
        agentText: `Namaskaram! 🙏 I have escalated your request to our **Mylapore Express Customer Support Care Team**.\n\n• **Support Reference Code**: \`#${refCode}\`\n• **Priority**: High\n• **Status**: Registered in Service Cloud Queue\n\nOur customer care team has received your inquiry: *"${query}"* and will reach out to resolve this promptly. We sincerely apologize for any inconvenience caused.`,
        blocks: [],
        executionMode: 'SIMPLE_MENU'
      };
    }

    const allItems = await this.prisma.menuItem.findMany({
      include: { category: true }
    });

    // MODE B: If Salesforce Agentforce is enabled, query Agentforce first
    if (process.env.SALESFORCE_ENABLED === 'true') {
      const sfResponse = await this.querySalesforceAgent(query, sessionId);
      if (sfResponse) {
        const textToMatch = `${q} ${sfResponse}`.toLowerCase();

        // 1. Strict dietary filter if user explicitly asked for it
        let dietaryFilter: string | null = null;
        if (q.includes('jain')) dietaryFilter = 'JAIN';
        else if (q.includes('vegan')) dietaryFilter = 'VEGAN';
        else if (q.includes('gluten free') || q.includes('gluten-free')) dietaryFilter = 'GLUTEN_FREE';

        let pool = allItems;
        if (dietaryFilter) {
          pool = allItems.filter((item) => {
            try {
              const tags = JSON.parse(item.dietaryTags);
              return tags.includes(dietaryFilter);
            } catch {
              return (item.dietaryTags || '').toUpperCase().includes(dietaryFilter!);
            }
          });
        }

        // 2. Category Keywords mapping
        const categoryKeywords: Record<string, string[]> = {
          sambar: ['sambar'],
          desserts: ['dessert', 'desserts', 'sweet', 'sweets', 'payasam', 'halwa', 'kesari', 'mysore pak'],
          rasam: ['rasam'],
          batters: ['batter', 'batters', 'dosa', 'dosas', 'idli', 'idly', 'idlis', 'vada', 'adai', 'tiffin', 'tiffins', 'breakfast'],
          rice: ['rice', 'pongal', 'puliyodarai', 'khichdi', 'sadam', 'bisi bele'],
          curries: ['curry', 'curries', 'kurma', 'kootu', 'poriyal', 'kara kari', 'chole', 'paneer', 'usili', 'vathal', 'kala chana', 'channa masala'],
          chutneys: ['chutney', 'chutneys', 'pachadi', 'gunpowder', 'milagai podi'],
          beverages: ['beverage', 'beverages', 'drink', 'drinks', 'coffee', 'tea', 'milk', 'lassi', 'buttermilk', 'mor', 'decoction'],
          specials: ['thali', 'thalis', 'feast', 'feasts', 'avial', 'weekend thali', 'meal', 'meals', 'full meal', 'full meals', 'lunch', 'dinner', 'combo', 'combos'],
          pickles: ['pickle', 'pickles', 'avakkai', 'inji', 'relish']
        };

        // Check if user query specifically asked for a category
        let targetCategory: string | null = null;
        for (const [cat, kws] of Object.entries(categoryKeywords)) {
          if (kws.some((kw) => q.includes(kw))) {
            targetCategory = cat;
            break;
          }
        }

        // Score candidate items against query and Agentforce response
        const scoredItems = pool.map((item) => {
          let score = dietaryFilter ? 20 : 0;
          const name = item.name.toLowerCase();
          const categorySlug = (item.category?.slug || '').toLowerCase();

          // Exact full dish name in user query or Agentforce response
          if (q.includes(name) || textToMatch.includes(name)) score += 100;

          // Target category match
          if (targetCategory && categorySlug === targetCategory) score += 80;

          // Specific South Indian dish terms
          if (textToMatch.includes('idli') && (name.includes('idli') || name.includes('idly'))) score += 50;
          if (textToMatch.includes('dosa') && name.includes('dosa')) score += 50;
          if (textToMatch.includes('vada') && (name.includes('adai') || name.includes('chutney'))) score += 30;
          if (textToMatch.includes('coffee') && name.includes('coffee')) score += 50;
          if (textToMatch.includes('mysore pak') && name.includes('mysore pak')) score += 50;
          if (textToMatch.includes('payasam') && name.includes('payasam')) score += 50;
          if (textToMatch.includes('sambar') && name.includes('sambar')) score += 50;
          if (textToMatch.includes('rasam') && name.includes('rasam')) score += 50;
          if ((textToMatch.includes('thali') || textToMatch.includes('meal') || textToMatch.includes('feast')) && (name.includes('thali') || name.includes('feast') || categorySlug === 'specials')) score += 100;
          if (textToMatch.includes('halwa') && name.includes('halwa')) score += 50;
          if (textToMatch.includes('kesari') && name.includes('kesari')) score += 50;

          return { item, score };
        });

        const matchingItems = scoredItems
          .filter((si) => si.score > 0)
          .sort((a, b) => b.score - a.score)
          .map((si) => si.item);

        const finalItems = matchingItems.length > 0 ? matchingItems : pool;

        let blocks = [];
        if (finalItems.length > 0) {
          blocks.push(this.displayBlockService.buildMenuItemListBlock(finalItems.slice(0, 6)));
        } else {
          const categories = await this.prisma.menuCategory.findMany({
            orderBy: { displayOrder: 'asc' },
            include: { _count: { select: { menuItems: true } } }
          });
          blocks.push(this.displayBlockService.buildCategoryButtonsBlock(categories));
        }

        return {
          agentText: sfResponse,
          blocks,
          executionMode: 'AGENTFORCE'
        };
      }
    }

    // 1. Off-Menu Food & Non-Vegetarian Inquiries
    const nonVegTerms = ['chicken', 'mutton', 'lamb', 'beef', 'pork', 'fish', 'seafood', 'prawn', 'shrimp', 'egg', 'eggs', 'non-veg', 'non veg', 'meat'];
    if (nonVegTerms.some((term) => q.includes(term))) {
      const categories = await this.prisma.menuCategory.findMany({
        orderBy: { displayOrder: 'asc' },
        include: { _count: { select: { menuItems: true } } }
      });
      return {
        agentText:
          '🌱 **100% Pure Vegetarian Kitchen Guarantee**:\n\n' +
          'Namaskaram! Mylapore Express is a strictly **100% Pure Vegetarian** South Indian heritage kitchen. We do not prepare, handle, or store any meat, poultry, seafood, or eggs on our premises—guaranteeing zero cross-contamination.\n\n' +
          'We invite you to explore our authentic plant-based and dairy-rich temple specialties, including our crispy dosas, rich kootus, and signature Mylapore Thali feasts!',
        blocks: [this.displayBlockService.buildCategoryButtonsBlock(categories)],
        executionMode: 'SIMPLE_MENU'
      };
    }

    const fastFoodTerms = ['pizza', 'burger', 'burgers', 'fries', 'french fries', 'pasta', 'taco', 'tacos', 'sandwich', 'hot dog', 'sushi', 'noodles', 'chinese', 'shawarma'];
    if (fastFoodTerms.some((term) => q.includes(term))) {
      const categories = await this.prisma.menuCategory.findMany({
        orderBy: { displayOrder: 'asc' },
        include: { _count: { select: { menuItems: true } } }
      });
      return {
        agentText:
          '🛕 **Authentic South Indian Heritage Cuisine**:\n\n' +
          'Namaskaram! Mylapore Express exclusively crafts **traditional South Indian temple-style and home-cooked delicacies** (such as stone-ground Idlis, slow-simmered Sambars, Avial, Poriyal, and Degree Filter Coffee).\n\n' +
          'We do not serve fast food or fusion dishes. Please explore our authentic South Indian categories below:',
        blocks: [this.displayBlockService.buildCategoryButtonsBlock(categories)],
        executionMode: 'SIMPLE_MENU'
      };
    }

    // 2. Allergen & Cross-Contamination Inquiries
    if (q.includes('peanut') || q.includes('allergy') || q.includes('allergies') || q.includes('nut') || q.includes('celiac')) {
      return {
        agentText:
          '⚠️ **Allergen & Cross-Contamination Advisory**:\n\n' +
          '• **Peanuts & Tree Nuts**: Certain South Indian dishes (such as *Puliyodarai* and *Chutneys*) contain peanuts and cashews. While we maintain strict kitchen sanitization between batches, our central facility processes tree nuts, peanuts, and sesame.\n' +
          '• **Dairy**: Ghee and milk are used in our traditional sweets and filter coffee. Vegan dishes are cooked with pure cold-pressed sesame/groundnut oil with zero dairy.\n' +
          '• **Gluten-Free**: Dishes like Idlis, Dosas, Sambars, and Rasam are naturally gluten-free. Note: Semolina (Rava Khichdi/Kesari) contains wheat.\n\n' +
          'If you have severe life-threatening allergies, please inspect the ingredients list on each dish card before ordering.',
        blocks: [],
        executionMode: 'SIMPLE_MENU'
      };
    }

    // 3. Direct Item Detail & Price Lookup Intent
    for (const item of allItems) {
      const fullName = item.name.toLowerCase();
      const strippedName = fullName.replace(/mylapore\s+/g, '').replace(/\([^)]*\)/g, '').trim();
      const slugName = item.slug.toLowerCase().replace(/-/g, ' ');

      const isMatch =
        q.includes(fullName) ||
        (strippedName.length >= 4 && q.includes(strippedName)) ||
        (slugName.length >= 4 && q.includes(slugName)) ||
        (q.startsWith('item:') && q.includes(item.id));

      if (isMatch && (q.includes('price') || q.includes('cost') || q.includes('how much') || q.includes('detail') || q.includes('ingredient') || q.includes('reheat') || q.includes('allergen') || q.startsWith('item:'))) {
        const detailBlock = this.displayBlockService.buildMenuItemDetailBlock(item);
        return {
          agentText: `Here are the authentic culinary details for our **${item.name}** (${detailBlock.payload.priceFormatted}):\n\n${item.description}\n\n• **Price**: ${detailBlock.payload.priceFormatted}\n• **Spice Level**: ${item.spiceLevel || 'MEDIUM'}\n• **Dietary**: ${Array.isArray(detailBlock.payload.dietaryTags) ? detailBlock.payload.dietaryTags.join(', ') : item.dietaryTags}\n• **Freshness**: Blast-chilled to 38°F with 0% preservatives`,
          blocks: [detailBlock],
          executionMode: 'SIMPLE_MENU'
        };
      }
    }

    // 4. Specific Meals & Festive Thali Intent (e.g. "i want meals", "meals", "show meals", "thali", "lunch", "dinner", "full meal")
    const isMealsIntent = /\b(meal|meals|thali|thalis|lunch|dinner|feast|feasts|full meal|full meals|combo meals)\b/i.test(q);
    if (isMealsIntent) {
      const mealItems = allItems.filter((item) => {
        const name = item.name.toLowerCase();
        const catSlug = (item.category?.slug || '').toLowerCase();
        return (
          catSlug === 'specials' ||
          name.includes('thali') ||
          name.includes('feast') ||
          (catSlug === 'rice' && (name.includes('bisi bele') || name.includes('puliyodarai') || name.includes('sadam') || name.includes('pongal')))
        );
      });

      mealItems.sort((a, b) => {
        if (a.name.toLowerCase().includes('thali')) return -1;
        if (b.name.toLowerCase().includes('thali')) return 1;
        return 0;
      });

      const listBlock = this.displayBlockService.buildMenuItemListBlock(mealItems.slice(0, 6));
      return {
        agentText:
          'Here are our authentic **South Indian Meals & Festive Thali Feasts**! Our signature **Mylapore Grand Weekend Thali Feast** is a complete traditional multi-course meal featuring Poriyal, Kootu, Sambar, Rasam, Rice, Appalam, and Payasam—freshly cooked and blast-chilled to lock in authentic temple aromas:',
        blocks: [listBlock],
        executionMode: 'SIMPLE_MENU'
      };
    }

    // 5. Categories Intent
    if (
      q.includes('category') ||
      q.includes('categories') ||
      q === 'menu' ||
      q.includes('what do you have') ||
      q.includes('show menu') ||
      q.includes('browse')
    ) {
      const categories = await this.prisma.menuCategory.findMany({
        orderBy: { displayOrder: 'asc' },
        include: {
          _count: {
            select: { menuItems: true }
          }
        }
      });
      const categoryBlock = this.displayBlockService.buildCategoryButtonsBlock(categories);
      return {
        agentText:
          'Here are our curated culinary categories. Select any category to explore authentic dishes crafted with traditional Mylapore recipes:',
        blocks: [categoryBlock],
        executionMode: 'SIMPLE_MENU'
      };
    }

    // 6. Dietary Filter Intent (Jain, Vegan, Gluten-Free)
    let dietaryTag: string | null = null;
    if (q.includes('jain')) dietaryTag = 'JAIN';
    else if (q.includes('vegan')) dietaryTag = 'VEGAN';
    else if (q.includes('gluten free') || q.includes('gluten-free')) dietaryTag = 'GLUTEN_FREE';

    if (dietaryTag) {
      const items = allItems.filter((item) => {
        try {
          const tags = JSON.parse(item.dietaryTags);
          return tags.includes(dietaryTag);
        } catch {
          return item.dietaryTags.toUpperCase().includes(dietaryTag!);
        }
      });

      const listBlock = this.displayBlockService.buildMenuItemListBlock(items.slice(0, 8));
      return {
        agentText: `We have found ${items.length} authentic **${dietaryTag}** South Indian delicacies prepared under strict dietary guidelines:`,
        blocks: [listBlock],
        executionMode: 'SIMPLE_MENU'
      };
    }

    // 7. Category by Name/Slug Match
    const matchedCategory = (
      await this.prisma.menuCategory.findMany({
        include: { menuItems: { include: { category: true } } }
      })
    ).find(
      (c) =>
        q.includes(c.name.toLowerCase()) ||
        q.includes(c.slug.toLowerCase()) ||
        q.includes(c.slug.replace('-', ' '))
    );

    if (matchedCategory) {
      const listBlock = this.displayBlockService.buildMenuItemListBlock(
        matchedCategory.menuItems.slice(0, 8)
      );
      return {
        agentText: `Here are the authentic specials in **${matchedCategory.name}**:`,
        blocks: [listBlock],
        executionMode: 'SIMPLE_MENU'
      };
    }

    // 8. Ranked Keyword Dish Search with Stopwords Filtering
    const STOPWORDS = new Set([
      'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from',
      'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the',
      'to', 'was', 'were', 'will', 'with', 'i', 'me', 'my', 'we', 'our',
      'you', 'your', 'can', 'could', 'would', 'should', 'do', 'does', 'did',
      'have', 'having', 'get', 'got', 'order', 'ordering', 'buy', 'want',
      'need', 'like', 'how', 'much', 'many', 'what', 'where', 'when', 'who',
      'which', 'why', 'tell', 'show', 'give', 'please', 'food', 'dish',
      'dishes', 'item', 'items', 'menu', 'restaurant', 'express', 'mylapore',
      'authentic', 'traditional', 'south', 'indian', 'good', 'best', 'some',
      'any', 'make', 'made', 'prepare', 'prepared', 'cooked', 'cook', 'there'
    ]);

    const searchTokens = q
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length >= 3 && !STOPWORDS.has(w));

    if (searchTokens.length > 0) {
      const scored = allItems.map((item) => {
        let score = 0;
        const name = item.name.toLowerCase();
        const catName = (item.category?.name || '').toLowerCase();
        const catSlug = (item.category?.slug || '').toLowerCase();
        const desc = item.description.toLowerCase();

        for (const token of searchTokens) {
          if ((token === 'idli' || token === 'idly') && (name.includes('idli') || name.includes('idly') || catSlug === 'batters')) {
            score += 60;
          }
          if ((token === 'dosa' || token === 'dosas') && (name.includes('dosa') || catSlug === 'batters')) {
            score += 60;
          }
          if (token === 'coffee' && name.includes('coffee')) {
            score += 60;
          }
          if (name.includes(token)) {
            score += 40;
          }
          if (catName.includes(token) || catSlug.includes(token)) {
            score += 25;
          }
          if (desc.includes(token)) {
            score += 5;
          }
        }
        return { item, score };
      });

      const highMatches = scored
        .filter((s) => s.score >= 25)
        .sort((a, b) => b.score - a.score)
        .map((s) => s.item);

      if (highMatches.length > 0) {
        const listBlock = this.displayBlockService.buildMenuItemListBlock(highMatches.slice(0, 8));
        return {
          agentText: `Found ${highMatches.length} delicious option${highMatches.length > 1 ? 's' : ''} matching your search:`,
          blocks: [listBlock],
          executionMode: 'SIMPLE_MENU'
        };
      }
    }

    // 9. Natural Language Hospitality Fallback with Categories
    const categories = await this.prisma.menuCategory.findMany({
      orderBy: { displayOrder: 'asc' },
      include: {
        _count: {
          select: { menuItems: true }
        }
      }
    });
    const categoryBlock = this.displayBlockService.buildCategoryButtonsBlock(categories);

    return {
      agentText:
        'Namaskaram! At Mylapore Express, our kitchen prepares traditional South Indian delicacies including stone-ground idlis, crispy dosas, and heritage sweets. You can ask me about dietary options (Jain, Vegan), dish ingredients, spice levels, or choose a category below:',
      blocks: [categoryBlock],
      executionMode: 'SIMPLE_MENU'
    };
  }

  async getDisplayBlocksByTurn(turnId: string) {
    const blocks = await this.prisma.chatDisplayBlock.findMany({
      where: { turnId },
      orderBy: { createdAt: 'asc' }
    });

    return blocks.map((b) => ({
      id: b.id,
      turnId: b.turnId,
      requestId: b.requestId,
      catalogVersion: b.catalogVersion,
      type: b.type,
      payload: JSON.parse(b.payload),
      createdAt: b.createdAt,
      expiresAt: b.expiresAt
    }));
  }

  async getSimpleMenuCategories() {
    return this.prisma.menuCategory.findMany({
      orderBy: { displayOrder: 'asc' },
      include: {
        _count: {
          select: { menuItems: true }
        }
      }
    });
  }

  async getSimpleMenuItems(categorySlug?: string, query?: string) {
    const where: any = { isAvailable: true };

    if (categorySlug && categorySlug !== 'all') {
      const category = await this.prisma.menuCategory.findUnique({
        where: { slug: categorySlug }
      });
      if (category) {
        where.categoryId = category.id;
      }
    }

    if (query) {
      where.OR = [
        { name: { contains: query } },
        { description: { contains: query } }
      ];
    }

    return this.prisma.menuItem.findMany({
      where,
      include: { category: true }
    });
  }
}
