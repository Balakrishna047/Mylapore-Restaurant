import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { DisplayBlockService } from './display-block.service';
import { SalesforceAgentService } from './salesforce-agent.service';
import { SessionLockGuard } from './session-lock.guard';

@Module({
  imports: [PrismaModule],
  controllers: [ChatController],
  providers: [ChatService, DisplayBlockService, SalesforceAgentService, SessionLockGuard],
  exports: [ChatService, DisplayBlockService, SalesforceAgentService]
})
export class ChatModule {}
