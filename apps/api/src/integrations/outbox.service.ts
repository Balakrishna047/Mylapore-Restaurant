import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SalesforceAdapter } from './salesforce.adapter';

@Injectable()
export class OutboxService implements OnModuleInit, OnModuleDestroy {
  private logger = new Logger(OutboxService.name);
  private timer: NodeJS.Timeout | null = null;
  private isProcessing = false;

  constructor(
    private prisma: PrismaService,
    private salesforceAdapter: SalesforceAdapter
  ) {}

  onModuleInit() {
    this.logger.log('Starting Transactional Outbox worker daemon (interval: 15s)');
    // Initial run after short delay
    setTimeout(() => this.processPendingEvents(), 3000);
    this.timer = setInterval(() => this.processPendingEvents(), 15000);
  }

  onModuleDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  /**
   * Write an event to the Transactional Outbox.
   */
  async emitEvent(
    eventType: 'ORDER_CREATED' | 'ORDER_STATUS_CHANGED' | 'PAYMENT_CAPTURED' | 'REFUND_ISSUED' | 'SUPPORT_CASE_CREATED' | 'AGENT_INTERACTION',
    aggregateType: 'ORDER' | 'PAYMENT' | 'REFUND' | 'TICKET' | 'INTERACTION',
    aggregateId: string,
    payload: any
  ) {
    return this.prisma.integrationEvent.create({
      data: {
        eventType,
        aggregateType,
        aggregateId,
        payload: JSON.stringify(payload),
        status: 'PENDING',
        retryCount: 0,
        maxRetries: 5,
        nextRetryAt: new Date()
      }
    });
  }

  /**
   * Process pending outbox events with exponential backoff and idempotency.
   */
  async processPendingEvents(): Promise<number> {
    if (this.isProcessing) return 0;
    this.isProcessing = true;

    try {
      const now = new Date();
      const events = await this.prisma.integrationEvent.findMany({
        where: {
          status: 'PENDING',
          nextRetryAt: { lte: now }
        },
        take: 20,
        orderBy: { createdAt: 'asc' }
      });

      if (events.length === 0) {
        return 0;
      }

      this.logger.log(`[Outbox Worker] Sweeping ${events.length} pending integration events...`);

      for (const event of events) {
        try {
          const payload = JSON.parse(event.payload);

          // Route to Salesforce Adapter based on event type
          switch (event.eventType) {
            case 'ORDER_CREATED':
            case 'ORDER_STATUS_CHANGED':
              await this.salesforceAdapter.syncOrder({
                id: payload.id || event.aggregateId,
                orderNumber: payload.orderNumber,
                status: payload.status,
                total: payload.total,
                guestEmail: payload.guestEmail,
                deliverySlot: payload.deliverySlot
              });
              break;

            case 'PAYMENT_CAPTURED':
              await this.salesforceAdapter.syncPayment({
                id: payload.id || event.aggregateId,
                orderId: payload.orderId,
                amount: payload.amount,
                status: payload.status,
                paymentMethod: payload.paymentMethod
              });
              break;

            case 'REFUND_ISSUED':
              await this.salesforceAdapter.syncRefund({
                id: payload.id || event.aggregateId,
                orderId: payload.orderId,
                amount: payload.amount,
                reason: payload.reason,
                status: payload.status
              });
              break;

            case 'SUPPORT_CASE_CREATED':
              await this.salesforceAdapter.createServiceCase({
                subject: payload.subject,
                description: payload.description,
                customerEmail: payload.customerEmail,
                customerName: payload.customerName,
                priority: payload.priority,
                orderNumber: payload.orderNumber
              });
              break;

            case 'AGENT_INTERACTION':
              await this.salesforceAdapter.syncAgentInteraction({
                interactionId: event.aggregateId,
                intent: payload.intent || 'DISCOVERY',
                summary: payload.summary || '',
                outcome: payload.outcome || 'SUCCESS'
              });
              break;

            default:
              this.logger.warn(`Unknown outbox event type: ${event.eventType}`);
          }

          // Mark PUBLISHED
          await this.prisma.integrationEvent.update({
            where: { id: event.id },
            data: {
              status: 'PUBLISHED',
              processedAt: new Date()
            }
          });
        } catch (err: any) {
          const retries = event.retryCount + 1;
          const isDeadLetter = retries >= event.maxRetries;
          const backoffSeconds = Math.pow(2, retries) * 10; // 20s, 40s, 80s...
          const nextRetry = new Date(Date.now() + backoffSeconds * 1000);

          this.logger.error(
            `Failed processing event ${event.id} (attempt ${retries}/${event.maxRetries}): ${err?.message}`
          );

          await this.prisma.integrationEvent.update({
            where: { id: event.id },
            data: {
              retryCount: retries,
              status: isDeadLetter ? 'DEAD_LETTER' : 'PENDING',
              lastError: err?.message?.substring(0, 500) || 'Unknown error',
              nextRetryAt: nextRetry
            }
          });
        }
      }

      return events.length;
    } catch (e: any) {
      this.logger.error(`Error in outbox processing loop: ${e.message}`);
      return 0;
    } finally {
      this.isProcessing = false;
    }
  }
}
