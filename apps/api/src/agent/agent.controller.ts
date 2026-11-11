import { Controller, Post, Get, Body, Param, Headers, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiHeader, ApiSecurity } from '@nestjs/swagger';
import { AgentService } from './agent.service';
import { AgentforceApiKeyGuard } from '../common/agentforce-api-key.guard';

@ApiTags('Agent Gateway')
@ApiSecurity('agentforce-key')
@ApiHeader({
  name: 'x-agentforce-api-key',
  required: true,
  description: 'Salesforce Agentforce Named Credential Secret Key'
})
@UseGuards(AgentforceApiKeyGuard)
@Controller('agent')
export class AgentController {
  constructor(private readonly agentService: AgentService) {}

  @Post('menu/search')
  @ApiOperation({
    summary: 'Search menu for the verified session outlet',
    operationId: 'agentforceSearchMenu'
  })
  @ApiResponse({ status: 200, description: 'Menu search results' })
  async searchMenu(
    @Body()
    body: {
      outletId?: string;
      query?: string;
      dietaryTags?: string[];
      limit?: number;
    }
  ) {
    return this.agentService.searchMenu(body);
  }

  @Get('menu/items/:itemId')
  @ApiOperation({
    summary: 'Get menu item details',
    operationId: 'agentforceGetMenuItemDetails'
  })
  @ApiResponse({ status: 200, description: 'Item details' })
  async getMenuItemDetails(@Param('itemId') itemId: string) {
    return this.agentService.getMenuItemDetails(itemId);
  }

  @Get('orders/:orderId')
  @ApiOperation({
    summary: 'Get order status for verified caller',
    operationId: 'agentforceGetOrderStatus'
  })
  @ApiResponse({ status: 200, description: 'Order status' })
  async getOrderStatus(@Param('orderId') orderId: string, @Request() req: any) {
    return this.agentService.getOrderStatus(orderId, req?.user);
  }

  @Post('orders/:orderId/cancellation-preview')
  @ApiOperation({
    summary: 'Preview order cancellation eligibility and consequences',
    operationId: 'agentforcePreviewCancellation'
  })
  @ApiResponse({ status: 200, description: 'Cancellation preview' })
  async previewCancellation(@Param('orderId') orderId: string) {
    return this.agentService.previewCancellation(orderId);
  }

  @Post('orders/:orderId/cancellation')
  @ApiOperation({
    summary: 'Submit confirmed cancellation request',
    operationId: 'agentforceSubmitCancellation'
  })
  @ApiHeader({ name: 'Idempotency-Key', required: false, description: 'Client-generated idempotency key' })
  @ApiResponse({ status: 202, description: 'Cancellation request accepted' })
  async submitCancellation(
    @Param('orderId') orderId: string,
    @Body() body: { previewId: string; confirmation: boolean; reasonCode?: string },
    @Headers('Idempotency-Key') idempotencyKey?: string
  ) {
    return this.agentService.submitCancellation(orderId, body, idempotencyKey);
  }

  @Post('support/cases')
  @ApiOperation({
    summary: 'Create support case via Agentforce',
    operationId: 'agentforceCreateSupportCase'
  })
  @ApiResponse({ status: 202, description: 'Support case submitted' })
  async createSupportCase(
    @Body()
    body: {
      orderId?: string;
      category: string;
      summary: string;
      preferredContactChannel?: string;
      customerEmail?: string;
      customerName?: string;
    }
  ) {
    return this.agentService.createSupportCase(body);
  }
}
