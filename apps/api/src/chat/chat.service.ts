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
      const timeoutPromise = new Promise<{ agentText: string; blocks: any[] }>((_, reject) => {
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

  private async processTurnIntent(
    sessionId: string,
    turnId: string,
    requestId: string,
    query: string
  ): Promise<{ agentText: string; blocks: any[] }> {
    const q = query.toLowerCase().trim();

    // 1. Direct Item Detail Intent Check
    // If the query contains the name or slug of an existing menu item
    const allItems = await this.prisma.menuItem.findMany({
      include: { category: true }
    });

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
        blocks: [detailBlock]
      };
    }

    // 2. Categories Intent
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
        blocks: [categoryBlock]
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
        blocks: [listBlock]
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
        blocks: [listBlock]
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
        blocks: [listBlock]
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
      blocks: [categoryBlock]
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
