import { Module, Global } from '@nestjs/common';
import { SalesforceAdapter } from './salesforce.adapter';
import { OutboxService } from './outbox.service';
import { SalesforceWebhookController } from './salesforce-webhook.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Global()
@Module({
  imports: [PrismaModule],
  controllers: [SalesforceWebhookController],
  providers: [SalesforceAdapter, OutboxService],
  exports: [SalesforceAdapter, OutboxService]
})
export class IntegrationsModule {}
