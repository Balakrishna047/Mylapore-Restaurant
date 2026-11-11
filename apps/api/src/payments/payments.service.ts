import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StripeAdapter } from './stripe.adapter';
import { OutboxService } from '../integrations/outbox.service';

@Injectable()
export class PaymentsService {
  private logger = new Logger(PaymentsService.name);

  constructor(
    private prisma: PrismaService,
    private stripeAdapter: StripeAdapter,
    private outboxService: OutboxService
  ) {}

  async createIntentForOrder(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId }
    });
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const amountInCents = Math.round(order.total * 100);
    const result = await this.stripeAdapter.createPaymentIntent({
      amountInCents,
      orderNumber: order.orderNumber,
      customerEmail: order.guestEmail || undefined
    });

    // Update order with payment intent ID and create Payment record
    await this.prisma.$transaction([
      this.prisma.order.update({
        where: { id: order.id },
        data: { stripePaymentIntentId: result.paymentIntentId }
      }),
      this.prisma.payment.upsert({
        where: { stripePaymentIntentId: result.paymentIntentId },
        create: {
          orderId: order.id,
          stripePaymentIntentId: result.paymentIntentId,
          amount: order.total,
          currency: result.currency.toUpperCase(),
          status: 'REQUIRES_PAYMENT_METHOD'
        },
        update: {
          amount: order.total
        }
      })
    ]);

    return result;
  }

  async handleWebhook(rawBody: any, signature: string) {
    let event: any;
    try {
      event = this.stripeAdapter.verifyWebhookSignature(rawBody, signature);
    } catch (err: any) {
      this.logger.error(`Webhook signature verification failed: ${err.message}`);
      throw new BadRequestException(`Webhook Error: ${err.message}`);
    }

    this.logger.log(`Received Stripe Webhook Event: ${event.type}`);

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;
      await this.confirmOrderPayment(paymentIntent.id, event.id);
    }

    return { received: true };
  }

  async confirmOrderPayment(paymentIntentId: string, rawEventId?: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { stripePaymentIntentId: paymentIntentId },
      include: { order: true }
    });

    if (!payment) {
      this.logger.warn(`No payment record found for Stripe Intent: ${paymentIntentId}`);
      return;
    }

    if (payment.status === 'SUCCEEDED' && payment.order.status !== 'PENDING_PAYMENT') {
      this.logger.log(`Payment already processed for order: ${payment.order.orderNumber}`);
      return;
    }

    await this.prisma.$transaction([
      this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'SUCCEEDED',
          rawEventId: rawEventId || null
        }
      }),
      this.prisma.order.update({
        where: { id: payment.orderId },
        data: {
          status: 'CONFIRMED',
          paymentStatus: 'SUCCEEDED'
        }
      }),
      this.prisma.orderStatusHistory.create({
        data: {
          orderId: payment.orderId,
          status: 'CONFIRMED',
          note: `Payment confirmed via Stripe (Intent: ${paymentIntentId})`,
          createdBy: 'STRIPE_WEBHOOK'
        }
      })
    ]);

    // Emit outbox events
    await this.outboxService.emitEvent('PAYMENT_CAPTURED', 'PAYMENT', payment.id, {
      id: payment.id,
      orderId: payment.orderId,
      amount: payment.amount,
      status: 'SUCCEEDED',
      paymentMethod: payment.paymentMethod
    });

    await this.outboxService.emitEvent('ORDER_STATUS_CHANGED', 'ORDER', payment.orderId, {
      id: payment.orderId,
      orderNumber: payment.order.orderNumber,
      status: 'CONFIRMED',
      total: payment.order.total,
      guestEmail: payment.order.guestEmail,
      deliverySlot: payment.order.deliverySlot
    });

    this.logger.log(`✅ Order ${payment.order.orderNumber} successfully confirmed!`);
  }

  async executeRefund(orderId: string, amount: number, reason: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { payments: true }
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const successfulPayment = order.payments.find((p) => p.status === 'SUCCEEDED');
    let stripeRefundId = null;

    if (successfulPayment && amount > 0) {
      const amountInCents = Math.round(amount * 100);
      const refundResult = await this.stripeAdapter.processRefund({
        paymentIntentId: successfulPayment.stripePaymentIntentId,
        amountInCents,
        reason
      });
      stripeRefundId = refundResult.refundId;
    }

    const refund = await this.prisma.refund.create({
      data: {
        orderId: order.id,
        paymentId: successfulPayment?.id || null,
        stripeRefundId,
        amount,
        reason,
        status: 'SUCCEEDED'
      }
    });

    await this.prisma.order.update({
      where: { id: order.id },
      data: {
        status: 'REFUNDED',
        paymentStatus: 'REFUNDED'
      }
    });

    await this.prisma.orderStatusHistory.create({
      data: {
        orderId: order.id,
        status: 'REFUNDED',
        note: `Refund of $${amount.toFixed(2)} processed (${reason})`,
        createdBy: 'SYSTEM'
      }
    });

    // Emit outbox events
    await this.outboxService.emitEvent('REFUND_ISSUED', 'REFUND', refund.id, {
      id: refund.id,
      orderId: order.id,
      amount,
      reason,
      status: 'SUCCEEDED'
    });

    return refund;
  }
}
