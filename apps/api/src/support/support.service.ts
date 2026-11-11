import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SalesforceAdapter } from '../integrations/salesforce.adapter';
import { OutboxService } from '../integrations/outbox.service';

@Injectable()
export class SupportService {
  private logger = new Logger(SupportService.name);

  constructor(
    private prisma: PrismaService,
    private salesforceAdapter: SalesforceAdapter,
    private outboxService: OutboxService
  ) {}

  async processChat(userMessage: string, orderNumberRef?: string, customerEmail?: string) {
    const text = userMessage.toLowerCase().trim();

    // 1. Order Status Enquiries
    const orderMatch = text.match(/myl-\d{4}-\d+/i) || (orderNumberRef ? [orderNumberRef] : null);
    if (orderMatch || text.includes('order') || text.includes('status') || text.includes('track')) {
      const orderNum = orderMatch ? orderMatch[0].toUpperCase() : null;
      if (orderNum) {
        const order = await this.prisma.order.findUnique({
          where: { orderNumber: orderNum },
          include: { items: true, history: true }
        });

        if (order) {
          const itemsSummary = order.items.map((i) => `${i.quantity}x ${i.name}`).join(', ');
          
          await this.outboxService.emitEvent('AGENT_INTERACTION', 'INTERACTION', `CHAT_${Date.now()}`, {
            intent: 'ORDER_TRACKING',
            summary: `Tracked status for order ${order.orderNumber} (${order.status})`,
            outcome: 'SUCCESS'
          });

          return {
            reply: `Here is the real-time status for Order **${order.orderNumber}**:\n\n` +
              `• **Current Stage**: **${order.status}**\n` +
              `• **Delivery Window**: ${order.deliverySlot}\n` +
              `• **Items**: ${itemsSummary}\n` +
              `• **Total**: $${order.total.toFixed(2)}\n\n` +
              (order.status === 'PREPARING'
                ? `Our chefs are currently preparing and blast-chilling your dishes to lock in authentic flavor!`
                : order.status === 'CONFIRMED'
                ? `Your order is confirmed and queued for the kitchen.`
                : `Need to reschedule or cancel? You can manage your order directly on your order tracking page.`),
            quickReplies: ['Track on Map', 'Reschedule Slot', 'Talk to Live Agent'],
            orderReference: order.orderNumber
          };
        }
      }
    }

    // 2. Blast Chilled & Freshness Questions
    if (text.includes('blast') || text.includes('chilled') || text.includes('reheat') || text.includes('preservative')) {
      return {
        reply: `🌟 **Mylapore Express Blast-Chilling Freshness Guarantee**:\n\n` +
          `• **No Preservatives**: All dishes are prepared using authentic cold-pressed oils, whole spices, and grandma's recipes with zero chemical preservatives.\n` +
          `• **Blast-Chilled at 38°F**: Immediately after cooking, food is rapidly brought down to 38°F to preserve aroma, texture, and nutritional vitality.\n` +
          `• **Reheating**: Keep refrigerated. Reheat thoroughly to 165°F on stovetop pan (3-4 mins for Potato Kara Kari or Poriyal) or microwave (90-120s for rice/curries).`,
        quickReplies: ['Browse Menu', 'View Curries', 'Customer Favorites']
      };
    }

    // 3. Dietary & Allergen Queries (Jain, Vegan, Gluten-Free)
    if (text.includes('jain') || text.includes('vegan') || text.includes('gluten') || text.includes('allergy') || text.includes('nut')) {
      return {
        reply: `🌿 **Authentic Dietary Accommodations at Mylapore Express**:\n\n` +
          `• **Jain Options**: Prepared strictly without onions, garlic, or root vegetables (Try our *Potato Kara Kari (Jain option)*, *Beans Usili*, *Vathal Kuzhambu*, *Puliyodarai*).\n` +
          `• **Vegan Dishes**: 100% plant-based made with cold-pressed sesame and groundnut oils (Try *South Indian Veg Kurma*, *Murungai Keerai Kootu*, *Chow Chow Kootu*).\n` +
          `• **Gluten-Free**: Marked clearly on each dish card. Note: Our kitchen handles wheat and sesame with strict cross-contamination protocols.`,
        quickReplies: ['View Jain Dishes', 'View Vegan Dishes', 'Allergen Information']
      };
    }

    // 4. Rescheduling & Cancellation Inquiries
    if (text.includes('reschedule') || text.includes('cancel') || text.includes('refund')) {
      return {
        reply: `⏱️ **Order Rescheduling & Cancellation Policy**:\n\n` +
          `• **Rescheduling**: Free up to 2 hours before your scheduled delivery window.\n` +
          `• **Cancellation**: \n` +
          `  - **100% Refund**: Before kitchen starts cooking (status: *CONFIRMED*).\n` +
          `  - **50% Refund**: When in *ACCEPTED* stage before active preparation.\n` +
          `  - **0% Refund**: Once *PREPARING* or *OUT_FOR_DELIVERY* due to food safety and perishability.`,
        quickReplies: ['Reschedule Order', 'Check Refund Status', 'Create Support Case']
      };
    }

    // 5. Default Agentforce Concierge Recommendation
    return {
      reply: `Vanakkam! 🙏 I am your **Mylapore Express AI Concierge**, powered by Salesforce Agentforce.\n\n` +
        `I can help you with:\n` +
        `• Recommending authentic South Indian dishes (*Potato Kara Kari*, *Vathal Kuzhambu*, *Bisi Bele Bath*)\n` +
        `• Checking order status and delivery slot tracking\n` +
        `• Answering Jain, Vegan, and allergen questions\n` +
        `• Reheating and blast-chilled freshness instructions\n` +
        `• Connecting you with a live customer support representative`,
      quickReplies: ['Order Status', 'Popular Dishes', 'Reheating Guide', 'Dietary Info']
    };
  }

  async createSupportTicket(data: {
    orderId?: string;
    customerName: string;
    customerEmail: string;
    customerPhone?: string;
    subject: string;
    description: string;
    priority?: string;
  }) {
    // 1. Sync or create Case in Salesforce Service Cloud
    const sfResult = await this.salesforceAdapter.createServiceCase({
      subject: data.subject,
      description: data.description,
      customerEmail: data.customerEmail,
      customerName: data.customerName,
      priority: data.priority
    });

    // 2. Persist in local PostgreSQL
    const ticket = await this.prisma.supportTicket.create({
      data: {
        orderId: data.orderId || null,
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        customerPhone: data.customerPhone || null,
        subject: data.subject,
        description: data.description,
        priority: data.priority || 'NORMAL',
        salesforceCaseId: sfResult.salesforceCaseId,
        sentiment: data.description.toLowerCase().includes('angry') || data.description.toLowerCase().includes('wrong') ? 'NEGATIVE' : 'NEUTRAL'
      }
    });

    // 3. Emit outbox event
    await this.outboxService.emitEvent('SUPPORT_CASE_CREATED', 'TICKET', ticket.id, {
      id: ticket.id,
      orderId: ticket.orderId,
      customerName: ticket.customerName,
      customerEmail: ticket.customerEmail,
      subject: ticket.subject,
      description: ticket.description,
      priority: ticket.priority,
      salesforceCaseId: sfResult.salesforceCaseId
    });

    return ticket;
  }
}
