import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrdersService } from '../orders/orders.service';
import { SupportService } from '../support/support.service';
import { OutboxService } from '../integrations/outbox.service';

interface CancellationPreviewCache {
  orderId: string;
  eligible: boolean;
  refundPercentage: number;
  refundAmount: number;
  expiresAt: Date;
}

@Injectable()
export class AgentService {
  private previews = new Map<string, CancellationPreviewCache>();

  constructor(
    private prisma: PrismaService,
    private ordersService: OrdersService,
    private supportService: SupportService,
    private outboxService: OutboxService
  ) {}

  async searchMenu(params: {
    outletId?: string;
    query?: string;
    dietaryTags?: string[];
    limit?: number;
  }) {
    const correlationId = `corr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const limit = Math.min(params.limit || 6, 12);

    const where: any = { isAvailable: true };

    if (params.query) {
      where.OR = [
        { name: { contains: params.query } },
        { description: { contains: params.query } }
      ];
    }

    const items = await this.prisma.menuItem.findMany({
      where,
      take: limit,
      include: { category: true }
    });

    let filtered = items;
    if (params.dietaryTags && params.dietaryTags.length > 0) {
      filtered = items.filter((item) => {
        try {
          const tags: string[] = JSON.parse(item.dietaryTags || '[]');
          return params.dietaryTags!.some((tag) => tags.includes(tag.toUpperCase()));
        } catch {
          return true;
        }
      });
    }

    const mapped = filtered.map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      imageUrl: item.image,
      imageAlt: item.name,
      price: {
        amountMinor: Math.round(item.basePrice * 100),
        currency: 'USD'
      },
      availability: item.isAvailable ? 'AVAILABLE' : 'UNAVAILABLE',
      category: item.category.name,
      dietaryTags: (() => {
        try {
          return JSON.parse(item.dietaryTags || '[]');
        } catch {
          return [];
        }
      })(),
      spiceLevel: item.spiceLevel
    }));

    return {
      success: true,
      items: mapped,
      correlationId
    };
  }

  async getMenuItemDetails(itemId: string) {
    const item = await this.prisma.menuItem.findUnique({
      where: { id: itemId },
      include: { category: true, variants: true }
    });

    if (!item) {
      throw new NotFoundException(`Menu item not found: ${itemId}`);
    }

    return {
      id: item.id,
      name: item.name,
      description: item.description,
      imageUrl: item.image,
      imageAlt: item.name,
      price: {
        amountMinor: Math.round(item.basePrice * 100),
        currency: 'USD'
      },
      availability: item.isAvailable ? 'AVAILABLE' : 'UNAVAILABLE',
      category: item.category.name,
      dietaryTags: (() => {
        try {
          return JSON.parse(item.dietaryTags || '[]');
        } catch {
          return [];
        }
      })(),
      spiceLevel: item.spiceLevel,
      nutritionServing: item.nutritionServing,
      reheatingInstructions: item.reheatingInstructions,
      variants: item.variants.map((v) => ({
        id: v.id,
        name: v.name,
        priceMinor: Math.round(v.price * 100),
        servesCount: v.servesCount
      }))
    };
  }

  async getOrderStatus(orderId: string, currentUser?: any) {
    const order = await this.prisma.order.findFirst({
      where: {
        OR: [{ id: orderId }, { orderNumber: orderId }]
      },
      include: { items: true, history: { orderBy: { createdAt: 'asc' } } }
    });

    if (!order) {
      throw new NotFoundException(`Order not found or inaccessible`);
    }

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      lastUpdatedAt: order.updatedAt.toISOString(),
      deliverySlot: order.deliverySlot,
      totalMinor: Math.round(order.total * 100),
      customerMessage:
        order.status === 'PREPARING'
          ? 'Your authentic South Indian meal is currently being freshly cooked and blast-chilled to 38°F.'
          : order.status === 'CONFIRMED'
          ? 'Your order is confirmed and queued for kitchen preparation.'
          : order.status === 'OUT_FOR_DELIVERY'
          ? 'Your meal is in thermal transit to your doorstep.'
          : `Order status is currently ${order.status}.`,
      itemCount: order.items.reduce((acc, i) => acc + i.quantity, 0)
    };
  }

  async previewCancellation(orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: {
        OR: [{ id: orderId }, { orderNumber: orderId }]
      }
    });

    if (!order) {
      throw new NotFoundException(`Order not found`);
    }

    const eligibleStatuses = ['PENDING_PAYMENT', 'PAID', 'CONFIRMED', 'ACCEPTED'];
    const isEligible = eligibleStatuses.includes(order.status);

    let refundPercentage = 0;
    let explanation = '';

    if (order.status === 'PENDING_PAYMENT' || order.status === 'PAID' || order.status === 'CONFIRMED') {
      refundPercentage = 100;
      explanation = '100% full refund eligible because cooking has not yet started.';
    } else if (order.status === 'ACCEPTED') {
      refundPercentage = 50;
      explanation = '50% partial refund eligible because the kitchen has already reserved perishable ingredients.';
    } else {
      refundPercentage = 0;
      explanation = `Cancellation is not permitted once the order is in ${order.status} stage due to blast-chilled food safety guidelines.`;
    }

    const previewId = `prev_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 min expiry

    this.previews.set(previewId, {
      orderId: order.id,
      eligible: isEligible,
      refundPercentage,
      refundAmount: Number(((order.total * refundPercentage) / 100).toFixed(2)),
      expiresAt
    });

    return {
      previewId,
      orderId: order.id,
      eligible: isEligible,
      refundPercentage,
      refundAmount: Number(((order.total * refundPercentage) / 100).toFixed(2)),
      explanation,
      expiresAt: expiresAt.toISOString()
    };
  }

  async submitCancellation(
    orderId: string,
    body: { previewId: string; confirmation: boolean; reasonCode?: string },
    idempotencyKey?: string
  ) {
    if (!body.confirmation) {
      throw new BadRequestException('Confirmation boolean must be explicitly true');
    }

    const key = idempotencyKey || `agentforce-cancellation-${body.previewId}`;

    // Concurrency / Idempotency Check: Guard against duplicate refund submissions
    const existing = await this.prisma.idempotencyRecord.findUnique({
      where: { key }
    });
    if (existing) {
      try {
        return JSON.parse(existing.responseBody);
      } catch {
        return { success: true, message: 'Cancellation already processed' };
      }
    }

    const preview = this.previews.get(body.previewId);
    if (!preview) {
      throw new BadRequestException('Cancellation preview has expired or is invalid. Please request a new preview.');
    }

    if (new Date() > preview.expiresAt) {
      this.previews.delete(body.previewId);
      throw new ConflictException('Cancellation preview has expired. Please refresh cancellation preview.');
    }

    if (!preview.eligible) {
      throw new BadRequestException('This order is not eligible for cancellation.');
    }

    const result = await this.ordersService.cancelOrder(
      preview.orderId,
      body.reasonCode || 'Agentforce customer requested cancellation'
    );

    this.previews.delete(body.previewId);

    const responsePayload = {
      success: true,
      orderId: preview.orderId,
      status: 'CANCELLED',
      refundAmount: preview.refundAmount,
      message: `Order successfully cancelled with ${preview.refundPercentage}% refund ($${preview.refundAmount.toFixed(2)})`
    };

    // Store in IdempotencyRecord table to prevent duplicate refunds
    try {
      await this.prisma.idempotencyRecord.create({
        data: {
          key,
          scope: 'AGENTFORCE_CANCELLATION',
          responseBody: JSON.stringify(responsePayload),
          statusCode: 202
        }
      });
    } catch {
      // If concurrent insert occurred, response is still valid
    }

    return responsePayload;
  }

  async createSupportCase(body: {
    orderId?: string;
    category: string;
    summary: string;
    preferredContactChannel?: string;
    customerEmail?: string;
    customerName?: string;
  }) {
    const ticket = await this.supportService.createSupportTicket({
      orderId: body.orderId,
      category: body.category,
      subject: `[Agentforce Case] ${body.category}`,
      description: `${body.summary} (Preferred channel: ${body.preferredContactChannel || 'CHAT'})`,
      customerEmail: body.customerEmail || 'customer@mylaporeexpress.com',
      customerName: body.customerName || 'Valued Customer',
      priority: body.category.toLowerCase().includes('wrong') || body.category.toLowerCase().includes('missing') ? 'HIGH' : 'NORMAL'
    } as any);

    return {
      success: true,
      caseNumber: ticket.salesforceCaseId || `500_LOC_${ticket.id.substring(0, 8)}`,
      status: 'SUBMITTED',
      message: 'Support case created and escalated to Mylapore Service Cloud queue.'
    };
  }
}
