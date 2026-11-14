import { ChatService } from './chat.service';
import { DisplayBlockService } from './display-block.service';

describe('ChatService (Chat BFF)', () => {
  let chatService: ChatService;
  let mockPrisma: any;
  let displayBlockService: DisplayBlockService;

  beforeEach(() => {
    mockPrisma = {
      chatSession: {
        findUnique: jest.fn(),
        create: jest.fn().mockImplementation((args) => Promise.resolve({
          id: 'sess-123',
          sessionToken: args.data.sessionToken,
          outletId: args.data.outletId,
          status: 'ACTIVE',
          turns: []
        }))
      },
      chatTurn: {
        create: jest.fn().mockImplementation((args) => Promise.resolve({
          id: 'turn-123',
          ...args.data
        })),
        update: jest.fn().mockResolvedValue({ id: 'turn-123', status: 'COMPLETED' }),
        findFirst: jest.fn().mockResolvedValue(null)
      },
      chatDisplayBlock: {
        create: jest.fn().mockImplementation((args) => Promise.resolve({
          id: 'block-123',
          ...args.data,
          createdAt: new Date(),
          expiresAt: new Date()
        })),
        findMany: jest.fn().mockResolvedValue([])
      },
      menuCategory: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'cat-1',
            name: 'Breakfast Tiffins',
            slug: 'breakfast-tiffins',
            icon: '🥞',
            _count: { menuItems: 3 }
          }
        ]),
        findUnique: jest.fn()
      },
      menuItem: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'item-1',
            slug: 'mysore-masala-dosa',
            name: 'Mysore Masala Dosa',
            description: 'Crispy fermented crepe with spicy red chutney',
            basePrice: 12.99,
            image: '/images/dishes/dosa.jpg',
            dietaryTags: JSON.stringify(['VEGETARIAN', 'VEGAN']),
            spiceLevel: 'MEDIUM',
            allergens: JSON.stringify([]),
            ingredients: JSON.stringify(['Rice', 'Lentils', 'Potato', 'Ghee']),
            nutritionServing: '1 dosa',
            reheatingInstructions: 'Heat on skillet for 2 mins',
            isBlastChilled: true,
            category: { name: 'Breakfast Tiffins' }
          }
        ]),
        findUnique: jest.fn()
      }
    };

    displayBlockService = new DisplayBlockService(mockPrisma);
    chatService = new ChatService(mockPrisma, displayBlockService);
  });

  it('should initialize a new guest session with deterministic welcome message and categories', async () => {
    const session = await chatService.createOrResumeSession();

    expect(session.sessionToken).toBeDefined();
    expect(session.welcomeMessage).toContain('Namaskaram');
    expect(session.displayBlocks).toHaveLength(1);
    expect(session.displayBlocks[0].type).toBe('category_buttons');
  });

  it('should execute a turn for dish detail inquiry and return verified display blocks', async () => {
    mockPrisma.chatSession.findUnique.mockResolvedValue({
      id: 'sess-123',
      sessionToken: 'test-token',
      status: 'ACTIVE',
      turns: []
    });

    const turn = await chatService.executeTurn('test-token', 'Tell me about Mysore Masala Dosa ingredients and details');

    expect(turn.turnId).toBe('turn-123');
    expect(turn.agentText).toContain('Mysore Masala Dosa');
    expect(turn.displayBlocks).toHaveLength(1);
    expect(turn.displayBlocks[0].type).toBe('menu_item_detail');
    expect(turn.displayBlocks[0].payload.name).toBe('Mysore Masala Dosa');
    expect(turn.displayBlocks[0].payload.priceFormatted).toBe('$12.99');
  });

  it('should search dishes on dietary filter inquiry (vegan)', async () => {
    mockPrisma.chatSession.findUnique.mockResolvedValue({
      id: 'sess-123',
      sessionToken: 'test-token',
      status: 'ACTIVE',
      turns: []
    });

    const turn = await chatService.executeTurn('test-token', 'Show me vegan options');

    expect(turn.agentText).toContain('VEGAN');
    expect(turn.displayBlocks).toHaveLength(1);
    expect(turn.displayBlocks[0].type).toBe('menu_item_list');
    expect(turn.displayBlocks[0].payload.items).toHaveLength(1);
  });
});
