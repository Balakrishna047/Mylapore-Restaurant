import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { OptionalJwtAuthGuard, JwtAuthGuard } from '../common/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { CurrentUser } from '../common/current-user.decorator';
import { RescheduleOrderSchema, CancelOrderSchema } from '@mylapore/validation';

@ApiTags('Orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'List customer orders or filter by status' })
  async listOrders(
    @CurrentUser('id') userId?: string,
    @Query('status') status?: string
  ) {
    return this.ordersService.listOrders({ userId, status });
  }

  @Get(':idOrNumber')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Get order details, line items, and live tracking history' })
  async getOrder(
    @Param('idOrNumber') idOrNumber: string,
    @CurrentUser('id') userId?: string
  ) {
    return this.ordersService.getOrderByIdOrNumber(idOrNumber, userId);
  }

  @Post(':id/reschedule')
  @ApiOperation({ summary: 'Reschedule delivery time slot for an eligible order' })
  async rescheduleOrder(
    @Param('id') id: string,
    @Body() body: any
  ) {
    const validated = RescheduleOrderSchema.parse(body);
    return this.ordersService.rescheduleOrder(id, validated.newDeliverySlot, validated.reason);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel order and compute milestone-gated refund' })
  async cancelOrder(
    @Param('id') id: string,
    @Body() body: any
  ) {
    const validated = CancelOrderSchema.parse(body);
    return this.ordersService.cancelOrder(id, validated.reason);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'RESTAURANT_ADMIN', 'KITCHEN_MANAGER', 'DELIVERY_MANAGER')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Advance order state (Staff/Kitchen action)' })
  async advanceStatus(
    @Param('id') id: string,
    @Body('status') nextStatus: string,
    @Body('note') note?: string,
    @CurrentUser('name') userName?: string
  ) {
    return this.ordersService.advanceStatus(id, nextStatus, note, userName || 'STAFF');
  }
}
