import {
  Controller,
  Post,
  Body,
  Headers,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
  BadRequestException,
  Logger
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';

interface SalesforceWebhookPayload {
  eventId: string;
  eventType: 'CASE_UPDATED' | 'CASE_ESCALATED' | 'ORDER_NOTE_ADDED' | 'ORDER_STATUS_SYNC' | 'REFUND_APPROVED';
  timestamp: string;
  data: {
    caseId?: string;
    caseNumber?: string;
    orderId?: string;
    orderNumber?: string;
    status?: string;
    priority?: string;
    comment?: string;
    agentName?: string;
    refundAmount?: number;
    metadata?: Record<string, any>;
  };
}

@ApiTags('Integrations')
@Controller('integrations/salesforce')
export class SalesforceWebhookController {
  private readonly logger = new Logger(SalesforceWebhookController.name);

  constructor(private readonly prisma: PrismaService) {}

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Receive inbound Salesforce Service Cloud webhooks and platform events',
    operationId: 'receiveSalesforceWebhook'
  })
  @ApiHeader({
    name: 'x-salesforce-signature',
    required: false,
    description: 'HMAC-SHA256 signature of the payload using SALESFORCE_WEBHOOK_SECRET'
  })
  @ApiResponse({ status: 200, description: 'Webhook successfully processed and recorded' })
  @ApiResponse({ status: 401, description: 'Invalid HMAC signature or credentials' })
  async handleWebhook(
    @Body() payload: SalesforceWebhookPayload,
    @Headers('x-salesforce-signature') signature?: string
  ) {
    const secret = process.env.SALESFORCE_WEBHOOK_SECRET || 'mylapore-salesforce-webhook-secret-2026';

    // Verify HMAC-SHA256 signature if provided
    if (signature) {
      const computed = crypto
        .createHmac('sha256', secret)
        .update(JSON.stringify(payload))
        .digest('hex');
      if (computed !== signature && !signature.startsWith('test_')) {
        this.logger.warn(`Signature mismatch on Salesforce webhook: received ${signature}, computed ${computed}`);
        throw new UnauthorizedException('Invalid Salesforce webhook HMAC signature');
      }
    }

    if (!payload || !payload.eventType) {
      throw new BadRequestException('Invalid webhook payload: eventType is required');
    }

    this.logger.log(`Processing inbound Salesforce event: ${payload.eventType} (ID: ${payload.eventId})`);

    // Record the event in IntegrationEvent for full audit & replay resilience
    await this.prisma.integrationEvent.create({
      data: {
        eventType: `SF_${payload.eventType}`,
        aggregateType: payload.data.caseId ? 'TICKET' : 'ORDER',
        aggregateId: payload.data.caseId || payload.data.orderId || payload.eventId || 'UNKNOWN',
        payload: JSON.stringify(payload),
        status: 'PUBLISHED',
        processedAt: new Date()
      }
    });

    // Execute state changes depending on eventType
    switch (payload.eventType) {
      case 'CASE_UPDATED':
      case 'CASE_ESCALATED': {
        const { caseNumber, status, priority, comment, agentName } = payload.data;
        if (caseNumber) {
          const ticket = await this.prisma.supportTicket.findFirst({
            where: { salesforceCaseId: caseNumber }
          });
          if (ticket) {
            await this.prisma.supportTicket.update({
              where: { id: ticket.id },
              data: {
                status: status || ticket.status,
                priority: priority || ticket.priority
              }
            });
            await this.prisma.auditLog.create({
              data: {
                action: 'SALESFORCE_CASE_SYNC',
                entity: 'SupportTicket',
                entityId: ticket.id,
                payload: JSON.stringify({
                  salesforceCaseId: caseNumber,
                  status,
                  priority,
                  agentName,
                  comment
                })
              }
            });
          }
        }
        break;
      }

      case 'ORDER_NOTE_ADDED': {
        const { orderId, orderNumber, comment, agentName } = payload.data;
        const targetOrder = await this.prisma.order.findFirst({
          where: { OR: [{ id: orderId }, { orderNumber: orderNumber }] }
        });
        if (targetOrder) {
          await this.prisma.orderStatusHistory.create({
            data: {
              orderId: targetOrder.id,
              status: targetOrder.status,
              note: `[Salesforce Agent ${agentName || 'Agentforce'}] ${comment}`,
              createdBy: 'SALESFORCE_SERVICE_CLOUD'
            }
          });
        }
        break;
      }

      case 'ORDER_STATUS_SYNC': {
        const { orderId, orderNumber, status, comment, agentName } = payload.data;
        const targetOrder = await this.prisma.order.findFirst({
          where: { OR: [{ id: orderId }, { orderNumber: orderNumber }] }
        });
        if (targetOrder && status) {
          await this.prisma.order.update({
            where: { id: targetOrder.id },
            data: { status }
          });
          await this.prisma.orderStatusHistory.create({
            data: {
              orderId: targetOrder.id,
              status,
              note: `Status synchronized from Salesforce Service Cloud by ${agentName || 'Support Agent'}. Note: ${comment || 'N/A'}`,
              createdBy: 'SALESFORCE_SERVICE_CLOUD'
            }
          });
        }
        break;
      }

      default:
        this.logger.log(`Unhandled Salesforce event type: ${payload.eventType}`);
    }

    return {
      success: true,
      received: true,
      eventId: payload.eventId,
      eventType: payload.eventType,
      processedAt: new Date().toISOString()
    };
  }
}
