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

  private async processTurnIntent(
    sessionId: string,
    turnId: string,
    requestId: string,
    query: string
  ): Promise<{ agentText: string; blocks: any[]; executionMode: 'AGENTFORCE' | 'SIMPLE_MENU' }> {
    const q = query.toLowerCase().trim();

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

    // 1. Direct Item Detail Intent Check
    // If the query contains the name or slug of an existing menu item

    const matchedItem = allItems.find(
      (item) =>
        q.includes(item.name.toLowerCase()) ||
        q.includes(item.slug.toLowerCase()) ||
        (q.startsWith('item:') && q.includes(item.id))
    );

    if (matchedItem && (q.includes('detail') || q.includes('ingredient') || q.includes('how') || q.includes('allergen') || q.includes('tell me about') || q.includes('price') || q.startsWith('item:'))) {
      const detailBlock = this.displayBlockService.buildMenuItemDetailBlock(matchedItem);
      return {
        agentText: `Here are the authentic culinary details for our **${matchedItem.name}** (${detailBlock.payload.priceFormatted}). Each batch is freshly prepared and blast-chilled to lock in authentic Mylapore temple flavors.`,
        blocks: [detailBlock],
        executionMode: 'SIMPLE_MENU'
      };
    }

    // 2. Specific Meals & Festive Thali Intent (e.g. "i want meals", "meals", "show meals", "thali", "lunch", "dinner", "full meal")
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

    // 3. Categories Intent
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

    // 3. Dietary Filter Intent (Jain, Vegan, Gluten-Free)
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

    // 4. Spice Level or Category Match
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

    // 5. Keyword Dish Search (e.g. "dosa", "idli", "coffee", "rice", "vada", "sambar", "halwa")
    const searchTerms = q.split(' ').filter((w) => w.length > 2);
    const searchMatches = allItems.filter((item) => {
      const text = `${item.name} ${item.description} ${item.ingredients}`.toLowerCase();
      return searchTerms.some((term) => text.includes(term));
    });

    if (searchMatches.length > 0) {
      const listBlock = this.displayBlockService.buildMenuItemListBlock(searchMatches.slice(0, 8));
      return {
        agentText: `Found ${searchMatches.length} delicious options matching your search:`,
        blocks: [listBlock],
        executionMode: 'SIMPLE_MENU'
      };
    }

    // 6. Natural Language Hospitality Fallback with Categories
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
