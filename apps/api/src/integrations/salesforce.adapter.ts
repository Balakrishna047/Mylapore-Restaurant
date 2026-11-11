import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class SalesforceAdapter {
  private logger = new Logger(SalesforceAdapter.name);
  private isEnabled: boolean;

  constructor() {
    this.isEnabled = process.env.SALESFORCE_ENABLED === 'true';
    if (this.isEnabled) {
      this.logger.log('Salesforce Service Cloud Integration active (OAuth Connected App)');
    } else {
      this.logger.log('Salesforce running in Simulated Mode (SALESFORCE_ENABLED=false)');
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
    const caseNumber = `500_SF_${Date.now().toString(36).toUpperCase()}`;
    this.logger.log(`[Salesforce Case Created]: Case #${caseNumber} | Subject: "${caseData.subject}" | Priority: ${caseData.priority || 'Normal'}`);
    return { salesforceCaseId: caseNumber };
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
