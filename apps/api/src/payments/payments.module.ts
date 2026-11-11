import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { StripeAdapter } from './stripe.adapter';

@Module({
  controllers: [PaymentsController],
  providers: [PaymentsService, StripeAdapter],
  exports: [PaymentsService, StripeAdapter]
})
export class PaymentsModule {}
