import { Injectable, Logger } from '@nestjs/common';
import Stripe from 'stripe';

export interface CreatePaymentIntentResult {
  paymentIntentId: string;
  clientSecret: string;
  amount: number;
  currency: string;
}

@Injectable()
export class StripeAdapter {
  private stripe: Stripe | null = null;
  private logger = new Logger(StripeAdapter.name);

  constructor() {
    const key = process.env.STRIPE_SECRET_KEY;
    if (key && !key.startsWith('sk_test_mock')) {
      try {
        this.stripe = new Stripe(key, { apiVersion: '2024-12-18.acacia' as any });
        this.logger.log('Stripe client initialized in live/test mode');
      } catch (err) {
        this.logger.warn(`Stripe initialization warning: ${err.message}. Using simulated mode.`);
      }
    } else {
      this.logger.log('Stripe running in simulated development mode');
    }
  }

  async createPaymentIntent(params: {
    amountInCents: number;
    currency?: string;
    orderNumber: string;
    customerEmail?: string;
  }): Promise<CreatePaymentIntentResult> {
    const currency = params.currency || 'usd';

    if (this.stripe) {
      const intent = await this.stripe.paymentIntents.create({
        amount: params.amountInCents,
        currency,
        description: `Mylapore Express Order ${params.orderNumber}`,
        receipt_email: params.customerEmail,
        metadata: {
          orderNumber: params.orderNumber
        }
      });

      return {
        paymentIntentId: intent.id,
        clientSecret: intent.client_secret || '',
        amount: params.amountInCents / 100,
        currency
      };
    }

    // Simulated development mode
    const mockId = `pi_sim_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    return {
      paymentIntentId: mockId,
      clientSecret: `${mockId}_secret_${Math.random().toString(36).substring(7)}`,
      amount: params.amountInCents / 100,
      currency
    };
  }

  async processRefund(params: {
    paymentIntentId: string;
    amountInCents?: number;
    reason?: string;
  }): Promise<{ refundId: string; status: string }> {
    if (this.stripe && !params.paymentIntentId.startsWith('pi_sim_')) {
      const refund = await this.stripe.refunds.create({
        payment_intent: params.paymentIntentId,
        amount: params.amountInCents,
        reason: 'requested_by_customer'
      });
      return {
        refundId: refund.id,
        status: refund.status || 'succeeded'
      };
    }

    return {
      refundId: `re_sim_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      status: 'succeeded'
    };
  }

  verifyWebhookSignature(payload: string | Buffer, signature: string): any {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (this.stripe && webhookSecret && !webhookSecret.startsWith('whsec_mock')) {
      return this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    }

    // Simulated verified webhook payload in dev
    if (typeof payload === 'string') {
      try {
        return JSON.parse(payload);
      } catch {
        return { type: 'payment_intent.succeeded', data: { object: { id: 'pi_sim_verified' } } };
      }
    }
    return { type: 'payment_intent.succeeded', data: { object: { id: 'pi_sim_verified' } } };
  }
}
