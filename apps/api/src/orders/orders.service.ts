import { Injectable, Logger, BadRequestException, NotFoundException, ConflictException, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CartService } from '../cart/cart.service';
import { CouponsService } from '../coupons/coupons.service';
import { PaymentsService } from '../payments/payments.service';
import { OutboxService } from '../integrations/outbox.service';

const ALLOWED_STATUS_TRANSITIONS: Record<string, string[]> = {
  PENDING_PAYMENT: ['PAID', 'CANCELLED'],
  PAID: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['ACCEPTED', 'CANCELLED'],
  ACCEPTED: ['PREPARING', 'CANCELLED'],
  PREPARING: ['READY'],
  READY: ['OUT_FOR_DELIVERY'],
  OUT_FOR_DELIVERY: ['DELIVERED'],
  DELIVERED: ['COMPLETED'],
  CANCELLED: ['REFUND_PENDING', 'REFUNDED'],
  REFUND_PENDING: ['REFUNDED'],
  REFUNDED: [],
  COMPLETED: []
};

@Injectable()
export class OrdersService implements OnModuleInit, OnModuleDestroy {
  private logger = new Logger(OrdersService.name);
  private timeoutTimer: NodeJS.Timeout | null = null;

  constructor(
    private prisma: PrismaService,
    private cartService: CartService,
    private couponsService: CouponsService,
    private paymentsService: PaymentsService,
    private outboxService: OutboxService
  ) {}

  onModuleInit() {
    // Start automated kitchen timeout sweep daemon (runs every 60 seconds)
    this.timeoutTimer = setInterval(() => {
      this.checkKitchenTimeouts().catch((err) => {
        this.logger.error(`Error during kitchen timeout sweep: ${err.message}`);
      });
    }, 60000);
  }

  onModuleDestroy() {
    if (this.timeoutTimer) {
      clearInterval(this.timeoutTimer);
    }
  }

  async quoteCheckout(params: {
    userId?: string;
    sessionToken?: string;
    orderType: string;
    couponCode?: string;
    tip?: number;
  }) {
    const cart = await this.cartService.getOrCreateCart(params.userId, params.sessionToken);
    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    const restaurant = await this.prisma.restaurant.findFirst();
    const minOrder = restaurant?.minimumOrder ?? 15.00;
    const taxRate = restaurant?.taxRate ?? 0.0825;
    const standardDeliveryFee = restaurant?.deliveryFee ?? 4.99;
    const freeDeliveryThreshold = restaurant?.freeDeliveryThreshold ?? 45.00;

    const subtotal = cart.subtotal;
    const minimumMet = subtotal >= minOrder;

    let discount = 0;
    if (params.couponCode) {
      const couponResult = await this.couponsService.validateCoupon(params.couponCode, subtotal);
      if (couponResult) {
        discount = couponResult.discount;
      }
    }

    const discountedSubtotal = Math.max(0, subtotal - discount);
    const tax = Number((discountedSubtotal * taxRate).toFixed(2));

    let deliveryFee = 0;
    const freeDeliveryThresholdMet = subtotal >= freeDeliveryThreshold;
    if (params.orderType === 'DELIVERY') {
      deliveryFee = freeDeliveryThresholdMet ? 0 : standardDeliveryFee;
    }

    const tip = Number((params.tip || 0).toFixed(2));
    const total = Number((discountedSubtotal + tax + deliveryFee + tip).toFixed(2));

    return {
      subtotal,
      discount,
      tax,
      deliveryFee,
      tip,
      total,
      currency: 'USD',
      minimumMet,
      freeDeliveryThresholdMet,
      itemCount: cart.itemCount
    };
  }

  async createOrder(params: {
    userId?: string;
    sessionToken?: string;
    orderType: string;
    deliveryAddressText?: string;
    deliverySlot: string;
    couponCode?: string;
    tip?: number;
    specialInstructions?: string;
    guestName?: string;
    guestEmail?: string;
    guestPhone?: string;
  }) {
    const quote = await this.quoteCheckout({
      userId: params.userId,
      sessionToken: params.sessionToken,
      orderType: params.orderType,
      couponCode: params.couponCode,
      tip: params.tip
    });

    if (!quote.minimumMet) {
      throw new BadRequestException(`Order subtotal must be at least $15.00`);
    }

    const cart = await this.cartService.getOrCreateCart(params.userId, params.sessionToken);

    let customerName = params.guestName || 'Valued Customer';
    let customerEmail = params.guestEmail || 'guest@mylaporeexpress.com';
    let customerPhone = params.guestPhone || '(925) 238-3736';

    if (params.userId) {
      const user = await this.prisma.user.findUnique({ where: { id: params.userId } });
      if (user) {
        customerName = user.name;
        customerEmail = user.email;
        customerPhone = user.phone || customerPhone;
      }
    }

    const count = await this.prisma.order.count();
    const orderNumber = `MYL-${new Date().getFullYear()}-${1000 + count + 1}`;

    const order = await this.prisma.order.create({
      data: {
        orderNumber,
        userId: params.userId || null,
        guestName: customerName,
        guestEmail: customerEmail,
        guestPhone: customerPhone,
        status: 'PENDING_PAYMENT',
        orderType: params.orderType,
        deliveryAddressText: params.deliveryAddressText || 'Pickup at Mylapore Express Kitchen',
        deliverySlot: params.deliverySlot,
        subtotal: quote.subtotal,
        discount: quote.discount,
        tax: quote.tax,
        deliveryFee: quote.deliveryFee,
        tip: quote.tip,
        total: quote.total,
        paymentStatus: 'REQUIRES_PAYMENT_METHOD',
        notes: params.specialInstructions || null,
        items: {
          create: cart.items.map((item) => ({
            menuItemId: item.menuItemId,
            name: item.name,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            optionsSummary: [
              item.variantName,
              item.spiceLevel ? `Spice: ${item.spiceLevel}` : null,
              item.specialInstructions
            ].filter(Boolean).join(' · ')
          }))
        },
        history: {
          create: {
            status: 'PENDING_PAYMENT',
            note: 'Order placed, awaiting customer payment'
          }
        }
      },
      include: {
        items: true,
        history: true
      }
    });

    // Create payment intent
    const paymentIntent = await this.paymentsService.createIntentForOrder(order.id);

    // Clear cart after successful checkout order creation
    await this.prisma.cartItem.deleteMany({
      where: { cartId: cart.id }
    });

    // Emit outbox event
    await this.outboxService.emitEvent('ORDER_CREATED', 'ORDER', order.id, {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      total: order.total,
      guestEmail: order.guestEmail,
      deliverySlot: order.deliverySlot
    });

    return {
      order: this.formatOrder(order),
      paymentIntent
    };
  }

  async getOrderByIdOrNumber(idOrNumber: string, userId?: string) {
    const order = await this.prisma.order.findFirst({
      where: {
        OR: [{ id: idOrNumber }, { orderNumber: idOrNumber }]
      },
      include: {
        items: {
          include: { menuItem: true }
        },
        history: {
          orderBy: { createdAt: 'asc' }
        },
        payments: true,
        refunds: true
      }
    });

    if (!order) {
      throw new NotFoundException(`Order ${idOrNumber} not found`);
    }

    return this.formatOrder(order);
  }

  async listOrders(params: { userId?: string; status?: string }) {
    const where: any = {};
    if (params.userId) {
      where.userId = params.userId;
    }
    if (params.status) {
      where.status = params.status;
    }

    const orders = await this.prisma.order.findMany({
      where,
      include: {
        items: true,
        history: {
          orderBy: { createdAt: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return orders.map((o) => this.formatOrder(o));
  }

  async advanceStatus(orderId: string, nextStatus: string, note?: string, updatedBy = 'STAFF') {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const allowed = ALLOWED_STATUS_TRANSITIONS[order.status] || [];
    if (!allowed.includes(nextStatus)) {
      throw new ConflictException(
        `Invalid status transition from "${order.status}" to "${nextStatus}". Allowed: [${allowed.join(', ')}]`
      );
    }

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: { status: nextStatus },
      include: {
        items: true,
        history: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    await this.prisma.orderStatusHistory.create({
      data: {
        orderId,
        status: nextStatus,
        note: note || `Status advanced to ${nextStatus}`,
        createdBy: updatedBy
      }
    });

    // Emit outbox event
    await this.outboxService.emitEvent('ORDER_STATUS_CHANGED', 'ORDER', orderId, {
      id: orderId,
      orderNumber: updated.orderNumber,
      status: nextStatus,
      total: updated.total,
      guestEmail: updated.guestEmail,
      deliverySlot: updated.deliverySlot
    });

    return this.formatOrder(updated);
  }

  async rescheduleOrder(orderId: string, newSlot: string, reason?: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');

    // Only orders in PENDING_PAYMENT, PAID, CONFIRMED, or ACCEPTED are eligible
    const eligibleStatuses = ['PENDING_PAYMENT', 'PAID', 'CONFIRMED', 'ACCEPTED'];
    if (!eligibleStatuses.includes(order.status)) {
      throw new BadRequestException(
        `Order ${order.orderNumber} cannot be rescheduled because it has already reached "${order.status}". Meal preparation has commenced.`
      );
    }

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: { deliverySlot: newSlot },
      include: { items: true, history: true }
    });

    await this.prisma.orderStatusHistory.create({
      data: {
        orderId,
        status: order.status,
        note: `Delivery slot rescheduled from "${order.deliverySlot}" to "${newSlot}" (${reason || 'Customer requested'})`,
        createdBy: 'CUSTOMER_PORTAL'
      }
    });

    return this.formatOrder(updated);
  }

  async cancelOrder(orderId: string, reason: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { payments: true }
    });
    if (!order) throw new NotFoundException('Order not found');

    if (['DELIVERED', 'COMPLETED', 'CANCELLED', 'REFUNDED'].includes(order.status)) {
      throw new BadRequestException(`Order cannot be cancelled in status: ${order.status}`);
    }

    // Determine refund entitlement percentage
    let refundPercentage = 1.0; // 100%
    if (order.status === 'ACCEPTED') {
      refundPercentage = 0.5; // 50%
    } else if (['PREPARING', 'READY', 'OUT_FOR_DELIVERY'].includes(order.status)) {
      refundPercentage = 0.0; // 0%
      throw new BadRequestException(
        `Order is in "${order.status}". Ingredients have been blast-chilled and dispatched; cancellation is no longer possible.`
      );
    }

    const refundAmount = Number((order.total * refundPercentage).toFixed(2));

    await this.prisma.order.update({
      where: { id: orderId },
      data: { status: 'CANCELLED' }
    });

    await this.prisma.orderStatusHistory.create({
      data: {
        orderId,
        status: 'CANCELLED',
        note: `Order cancelled. Reason: ${reason}. Refund entitlement: ${(refundPercentage * 100)}% ($${refundAmount.toFixed(2)})`,
        createdBy: 'CUSTOMER_PORTAL'
      }
    });

    // Emit outbox event
    await this.outboxService.emitEvent('ORDER_STATUS_CHANGED', 'ORDER', orderId, {
      id: orderId,
      orderNumber: order.orderNumber,
      status: 'CANCELLED',
      total: order.total,
      guestEmail: order.guestEmail,
      deliverySlot: order.deliverySlot
    });

    if (refundAmount > 0 && order.paymentStatus === 'SUCCEEDED') {
      await this.paymentsService.executeRefund(order.id, refundAmount, reason);
    }

    return this.getOrderByIdOrNumber(order.id);
  }

  /**
   * Kitchen Operational Control (E04-04):
   * Auto-cancel and 100% refund orders that exceed the 15-minute kitchen acceptance SLA.
   */
  async checkKitchenTimeouts(): Promise<{ checked: number; timedOutCount: number }> {
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    const stuckOrders = await this.prisma.order.findMany({
      where: {
        status: 'CONFIRMED',
        updatedAt: { lte: fifteenMinutesAgo }
      }
    });

    if (stuckOrders.length === 0) {
      return { checked: 0, timedOutCount: 0 };
    }

    this.logger.warn(`[Kitchen Operations Alert] Found ${stuckOrders.length} order(s) exceeding 15m acceptance timeout. Initiating auto-cancellation & 100% refund...`);

    for (const order of stuckOrders) {
      try {
        await this.cancelOrder(
          order.id,
          'Kitchen acceptance SLA timeout exceeded (15 minutes). Automatic full refund initiated to guarantee customer trust.'
        );
        this.logger.log(`Auto-refunded timed out order ${order.orderNumber}`);
      } catch (err: any) {
        this.logger.error(`Failed to auto-cancel timed out order ${order.orderNumber}: ${err.message}`);
      }
    }

    return { checked: stuckOrders.length, timedOutCount: stuckOrders.length };
  }

  private formatOrder(order: any) {
    const canReschedule = ['PENDING_PAYMENT', 'PAID', 'CONFIRMED', 'ACCEPTED'].includes(order.status);
    const canCancel = ['PENDING_PAYMENT', 'PAID', 'CONFIRMED', 'ACCEPTED'].includes(order.status);

    return {
      ...order,
      canReschedule,
      canCancel
    };
  }
}
