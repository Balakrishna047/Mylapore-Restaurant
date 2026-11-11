import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SupportService } from './support.service';
import { OptionalJwtAuthGuard } from '../common/jwt-auth.guard';
import { CurrentUser } from '../common/current-user.decorator';
import { SupportMessageSchema } from '@mylapore/validation';

@ApiTags('Support & Agentforce')
@Controller('support')
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Post('chat')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Chat with Agentforce AI Concierge' })
  async chat(
    @Body() body: any,
    @CurrentUser('email') userEmail?: string
  ) {
    const validated = SupportMessageSchema.parse(body);
    return this.supportService.processChat(validated.message, validated.orderNumber, userEmail);
  }

  @Post('tickets')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Submit customer support ticket / Salesforce Service Case' })
  async createTicket(
    @Body() body: any,
    @CurrentUser('email') userEmail?: string,
    @CurrentUser('name') userName?: string
  ) {
    return this.supportService.createSupportTicket({
      orderId: body.orderId,
      customerName: body.customerName || userName || 'Customer',
      customerEmail: body.customerEmail || userEmail || 'customer@example.com',
      customerPhone: body.customerPhone,
      subject: body.subject || 'Order Support Request',
      description: body.description,
      priority: body.priority || 'NORMAL'
    });
  }
}
