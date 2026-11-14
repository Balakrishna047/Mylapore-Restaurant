import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Headers,
  UseGuards,
  Query,
  BadRequestException
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { SessionLockGuard } from './session-lock.guard';

class CreateSessionDto {
  sessionToken?: string;
  outletId?: string;
}

class ExecuteTurnDto {
  message!: string;
  turnToken?: string;
}

@ApiTags('Chat BFF')
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('session')
  @ApiOperation({
    summary: 'Initialize or resume an anonymous guest chat session',
    operationId: 'chatCreateSession'
  })
  @ApiResponse({ status: 200, description: 'Session created or resumed with greeting' })
  async createSession(@Body() body: CreateSessionDto) {
    return this.chatService.createOrResumeSession(body?.sessionToken, body?.outletId);
  }

  @Post('turn')
  @UseGuards(SessionLockGuard)
  @ApiOperation({
    summary: 'Execute a conversational turn with Agentforce & Grounded Backend',
    operationId: 'chatExecuteTurn'
  })
  @ApiHeader({
    name: 'x-chat-session-token',
    required: true,
    description: 'Active session token'
  })
  @ApiResponse({ status: 200, description: 'Agent turn completed with verified display blocks' })
  @ApiResponse({ status: 423, description: 'Session is currently processing another turn' })
  async executeTurn(
    @Headers('x-chat-session-token') sessionToken: string,
    @Body() body: ExecuteTurnDto
  ) {
    if (!sessionToken) {
      throw new BadRequestException('Header x-chat-session-token is required');
    }
    return this.chatService.executeTurn(sessionToken, body.message);
  }

  @Get('display/:turnId')
  @ApiOperation({
    summary: 'Retrieve verified immutable display blocks for a specific turn',
    operationId: 'chatGetDisplayBlocks'
  })
  @ApiResponse({ status: 200, description: 'Display blocks array' })
  async getDisplayBlocks(@Param('turnId') turnId: string) {
    return this.chatService.getDisplayBlocksByTurn(turnId);
  }

  @Get('simple-menu/categories')
  @ApiOperation({
    summary: 'Direct simple menu category retrieval',
    operationId: 'chatGetSimpleMenuCategories'
  })
  @ApiResponse({ status: 200, description: 'Categories list' })
  async getSimpleMenuCategories() {
    return this.chatService.getSimpleMenuCategories();
  }

  @Get('simple-menu/items')
  @ApiOperation({
    summary: 'Direct simple menu item retrieval with filters',
    operationId: 'chatGetSimpleMenuItems'
  })
  @ApiResponse({ status: 200, description: 'Menu items list' })
  async getSimpleMenuItems(
    @Query('categorySlug') categorySlug?: string,
    @Query('query') query?: string
  ) {
    return this.chatService.getSimpleMenuItems(categorySlug, query);
  }
}
