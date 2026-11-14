import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { DisplayBlockService } from './display-block.service';
import { SessionLockGuard } from './session-lock.guard';

@Module({
  imports: [PrismaModule],
  controllers: [ChatController],
  providers: [ChatService, DisplayBlockService, SessionLockGuard],
  exports: [ChatService, DisplayBlockService]
})
export class ChatModule {}
