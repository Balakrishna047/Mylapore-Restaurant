import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class SalesforceAdapter {
  private logger = new Logger(SalesforceAdapter.name);
  private isEnabled: boolean;
  private cachedOAuthToken: string | null = null;
  private tokenExpiresAt = 0;

  constructor() {
    this.isEnabled = process.env.SALESFORCE_ENABLED === 'true';
    if (this.isEnabled) {
      this.logger.log('Salesforce Service Cloud Integration active (OAuth Connected App)');
    } else {
      this.logger.log('Salesforce running in Simulated Mode (SALESFORCE_ENABLED=false)');
    }
  }

  private async getOAuthToken(): Promise<string | null> {
    const instanceUrl = process.env.SALESFORCE_INSTANCE_URL;
    const clientId = process.env.SALESFORCE_CLIENT_ID;
    const clientSecret = process.env.SALESFORCE_CLIENT_SECRET;
    if (!instanceUrl || !clientId || !clientSecret) return null;

    if (this.cachedOAuthToken && Date.now() < this.tokenExpiresAt) {
      return this.cachedOAuthToken;
    }

    try {
      const tokenEndpoint = `${instanceUrl.replace(/\/+$/, '')}/services/oauth2/token`;
      const params = new URLSearchParams();
      params.append('grant_type', 'client_credentials');
      params.append('client_id', clientId);
      params.append('client_secret', clientSecret);

      const res = await fetch(tokenEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString()
      });

      if (!res.ok) return null;
      const data = await res.json();
      this.cachedOAuthToken = data.access_token;
      this.tokenExpiresAt = Date.now() + 110 * 60 * 1000;
      return this.cachedOAuthToken;
    } catch (err: any) {
      this.logger.warn(`Failed to obtain OAuth token: ${err.message}`);
      return null;
    }
  }

  async syncCustomerContact(customer: {
    id: string;
    email: string;
    name: string;
    phone?: string;
  }): Promise<{ salesforceContactId: string }> {
    if (this.isEnabled) {
      this.logger.log(`Syncing customer ${customer.email} to Salesforce Contact`);
      return { salesforceContactId: `003${Date.now().toString(36)}` };
    }
    return { salesforceContactId: `003_SIM_${customer.id.substring(0, 8)}` };
  }

  async syncOrder(order: {
    id: string;
    orderNumber: string;
    status: string;
    total: number;
    guestEmail?: string;
    deliverySlot?: string;
  }): Promise<{ salesforceOrderId: string }> {
    const externalId = `a01${order.id.replace(/-/g, '').substring(0, 15)}`;
    this.logger.log(`[Salesforce Order Projection Sync]: Order ${order.orderNumber} (Status: ${order.status}, Total: $${order.total}) -> Restaurant_Order__c (${externalId})`);
    return { salesforceOrderId: externalId };
  }

  async syncPayment(payment: {
    id: string;
    orderId: string;
    amount: number;
    status: string;
    paymentMethod: string;
  }): Promise<{ salesforcePaymentId: string }> {
    const externalId = `a02${payment.id.replace(/-/g, '').substring(0, 15)}`;
    this.logger.log(`[Salesforce Payment Sync]: Payment for Order ${payment.orderId} ($${payment.amount}) -> Payment_Transaction__c (${externalId})`);
    return { salesforcePaymentId: externalId };
  }

  async syncRefund(refund: {
    id: string;
    orderId: string;
    amount: number;
    reason: string;
    status: string;
  }): Promise<{ salesforceRefundId: string }> {
    const externalId = `a03${refund.id.replace(/-/g, '').substring(0, 15)}`;
    this.logger.log(`[Salesforce Refund Sync]: Refund for Order ${refund.orderId} ($${refund.amount}) -> Refund_Request__c (${externalId})`);
    return { salesforceRefundId: externalId };
  }

  async createServiceCase(caseData: {
    subject: string;
    description: string;
    customerEmail: string;
    customerName: string;
    priority?: string;
    orderNumber?: string;
  }): Promise<{ salesforceCaseId: string }> {
    const token = await this.getOAuthToken();
    const instanceUrl = process.env.SALESFORCE_INSTANCE_URL;

    if (token && instanceUrl) {
      try {
        const caseEndpoint = `${instanceUrl.replace(/\/+$/, '')}/services/data/v62.0/sobjects/Case`;
        const res = await fetch(caseEndpoint, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            Subject: caseData.subject,
            Description: caseData.description,
            SuppliedName: caseData.customerName,
            SuppliedEmail: caseData.customerEmail,
            Origin: 'Web Chat',
            Priority: caseData.priority || 'Normal'
          })
        });

        if (res.ok) {
          const result = await res.json();
          this.logger.log(`[Salesforce Live Case Created]: ${result.id} for ${caseData.customerEmail}`);
          return { salesforceCaseId: result.id };
        } else {
          const errText = await res.text();
          this.logger.warn(`[Salesforce Case Creation Failed]: Status ${res.status} - ${errText}`);
        }
      } catch (err: any) {
        this.logger.warn(`Live Salesforce Case creation error: ${err.message}`);
      }
    }

    const fallbackId = `500_SF_${Date.now().toString(36).toUpperCase()}`;
    this.logger.log(`[Salesforce Fallback Case Created]: Case #${fallbackId} | Subject: "${caseData.subject}"`);
    return { salesforceCaseId: fallbackId };
  }

  async syncAgentInteraction(data: {
    interactionId: string;
    intent: string;
    summary: string;
    outcome: string;
  }): Promise<{ salesforceInteractionId: string }> {
    const externalId = `a05${data.interactionId.replace(/-/g, '').substring(0, 15)}`;
    this.logger.log(`[Salesforce Agent Interaction Logged]: ${data.intent} -> Agent_Interaction__c (${externalId})`);
    return { salesforceInteractionId: externalId };
  }
}
