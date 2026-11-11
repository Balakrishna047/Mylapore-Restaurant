import { Controller, Post, Body, Headers, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { OptionalJwtAuthGuard } from '../common/jwt-auth.guard';
import { CurrentUser } from '../common/current-user.decorator';
import { CheckoutQuoteSchema, CreateOrderRequestSchema } from '@mylapore/validation';

@ApiTags('Checkout')
@Controller('checkout')
export class CheckoutController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('quote')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Calculate verified server-side totals, tax, and delivery fee' })
  @ApiHeader({ name: 'x-session-token', required: false })
  async getQuote(
    @Body() body: any,
    @CurrentUser('id') userId?: string,
    @Headers('x-session-token') sessionToken?: string
  ) {
    const validated = CheckoutQuoteSchema.parse(body);
    return this.ordersService.quoteCheckout({
      userId,
      sessionToken: sessionToken || 'guest_default',
      orderType: validated.orderType,
      couponCode: validated.couponCode,
      tip: validated.tip
    });
  }

  @Post('create-intent')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Create order in PENDING_PAYMENT state and generate Stripe PaymentIntent' })
  @ApiHeader({ name: 'x-session-token', required: false })
  async createIntent(
    @Body() body: any,
    @CurrentUser('id') userId?: string,
    @Headers('x-session-token') sessionToken?: string
  ) {
    const validated = CreateOrderRequestSchema.parse(body);
    return this.ordersService.createOrder({
      userId,
      sessionToken: sessionToken || 'guest_default',
      orderType: validated.orderType,
      deliveryAddressText: validated.deliveryAddressText,
      deliverySlot: validated.deliverySlot,
      couponCode: validated.couponCode,
      tip: validated.tip,
      specialInstructions: validated.specialInstructions,
      guestName: validated.guestName,
      guestEmail: validated.guestEmail,
      guestPhone: validated.guestPhone
    });
  }
}
