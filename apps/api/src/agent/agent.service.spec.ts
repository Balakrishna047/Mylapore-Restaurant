import { AgentService } from './agent.service';

describe('Agentforce Action Gateway & Restricted Actions', () => {
  let agentService: AgentService;
  let mockPrisma: any;
  let mockOrdersService: any;
  let mockSupportService: any;
  let mockOutboxService: any;

  beforeEach(() => {
    mockPrisma = {
      menuItem: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'item-1',
            name: 'Potato Kara Kari',
            description: 'Crispy roasted potato curry',
            image: '/images/dishes/potato-kara-kari.jpg',
            basePrice: 8.99,
            isAvailable: true,
            dietaryTags: JSON.stringify(['VEGETARIAN', 'VEGAN']),
            spiceLevel: 'MEDIUM',
            category: { name: 'Curries' }
          }
        ]),
        findUnique: jest.fn().mockResolvedValue({
          id: 'item-1',
          name: 'Potato Kara Kari',
          description: 'Crispy roasted potato curry',
          image: '/images/dishes/potato-kara-kari.jpg',
          basePrice: 8.99,
          isAvailable: true,
          dietaryTags: JSON.stringify(['VEGETARIAN', 'VEGAN']),
          spiceLevel: 'MEDIUM',
          nutritionServing: '1/2 cup (80 g)',
          reheatingInstructions: 'Reheat in pan for 3 mins',
          category: { name: 'Curries' },
          variants: [{ id: 'v-1', name: 'Regular (16 oz)', price: 8.99, servesCount: 1 }]
        })
      },
      order: {
        findFirst: jest.fn()
      }
    };

    mockOrdersService = {
      cancelOrder: jest.fn().mockResolvedValue({ status: 'CANCELLED' })
    };

    mockSupportService = {
      createSupportTicket: jest.fn().mockResolvedValue({
        id: 'ticket-123',
        salesforceCaseId: '500_SF_TEST1'
      })
    };

    mockOutboxService = {
      emitEvent: jest.fn().mockResolvedValue(true)
    };

    agentService = new AgentService(
      mockPrisma,
      mockOrdersService,
      mockSupportService,
      mockOutboxService
    );
  });

  describe('Menu Search Action', () => {
    it('should filter menu items by dietary tags and return minor integer price', async () => {
      const result = await agentService.searchMenu({
        query: 'Potato',
        dietaryTags: ['VEGAN'],
        limit: 5
      });

      expect(result.success).toBe(true);
      expect(result.items.length).toBe(1);
      expect(result.items[0].name).toBe('Potato Kara Kari');
      expect(result.items[0].price.amountMinor).toBe(899);
      expect(result.items[0].price.currency).toBe('USD');
      expect(result.correlationId).toBeDefined();
    });
  });

  describe('Cancellation Preview & Confirmation', () => {
    it('should generate a 100% refund preview for CONFIRMED orders', async () => {
      mockPrisma.order.findFirst.mockResolvedValue({
        id: 'order-101',
        orderNumber: 'MYL-2026-1001',
        status: 'CONFIRMED',
        total: 40.00
      });

      const preview = await agentService.previewCancellation('order-101');
      expect(preview.eligible).toBe(true);
      expect(preview.refundPercentage).toBe(100);
      expect(preview.refundAmount).toBe(40.00);
      expect(preview.previewId).toBeDefined();
      expect(preview.expiresAt).toBeDefined();
    });

    it('should submit cancellation successfully with valid previewId', async () => {
      mockPrisma.order.findFirst.mockResolvedValue({
        id: 'order-101',
        orderNumber: 'MYL-2026-1001',
        status: 'CONFIRMED',
        total: 40.00
      });

      const preview = await agentService.previewCancellation('order-101');
      const submission = await agentService.submitCancellation('order-101', {
        previewId: preview.previewId,
        confirmation: true,
        reasonCode: 'CUSTOMER_SCHEDULE_CONFLICT'
      });

      expect(submission.success).toBe(true);
      expect(submission.status).toBe('CANCELLED');
      expect(mockOrdersService.cancelOrder).toHaveBeenCalledWith('order-101', 'CUSTOMER_SCHEDULE_CONFLICT');
    });

    it('should reject cancellation submission if confirmation boolean is false', async () => {
      await expect(
        agentService.submitCancellation('order-101', {
          previewId: 'prev-fake',
          confirmation: false
        })
      ).rejects.toThrow('Confirmation boolean must be explicitly true');
    });
  });

  describe('Agentforce Support Case Escalation', () => {
    it('should route support case to Service Cloud adapter', async () => {
      const res = await agentService.createSupportCase({
        orderId: 'order-101',
        category: 'MISSING_ITEM',
        summary: 'Customer reports Rasam was missing from the package.',
        customerEmail: 'customer@example.com',
        customerName: 'Ananya S.'
      });

      expect(res.success).toBe(true);
      expect(res.caseNumber).toBe('500_SF_TEST1');
      expect(mockSupportService.createSupportTicket).toHaveBeenCalled();
    });
  });
});
