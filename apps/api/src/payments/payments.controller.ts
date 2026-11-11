import { Controller, Post, Body, Headers, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('stripe-webhook')
  @HttpCode(200)
  @ApiOperation({ summary: 'Stripe webhook listener with cryptographic signature verification' })
  async handleWebhook(
    @Body() body: any,
    @Headers('stripe-signature') signature: string
  ) {
    return this.paymentsService.handleWebhook(body, signature || 'mock_sig');
  }

  @Post('test-confirm')
  @ApiOperation({ summary: 'Dev endpoint to simulate successful payment confirmation' })
  async testConfirm(@Body('paymentIntentId') paymentIntentId: string) {
    await this.paymentsService.confirmOrderPayment(paymentIntentId);
    return { success: true, message: 'Simulated payment confirmation executed' };
  }
}
