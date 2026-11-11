import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { CurrentUser } from '../common/current-user.decorator';
import { RegisterSchema, LoginSchema } from '@mylapore/validation';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new customer account' })
  @ApiResponse({ status: 201, description: 'Customer registered successfully' })
  async register(@Body() body: any) {
    const validated = RegisterSchema.parse(body);
    return this.authService.register(validated);
  }

  @Post('login')
  @ApiOperation({ summary: 'Customer or Staff Login' })
  @ApiResponse({ status: 200, description: 'Authenticated successfully with JWT' })
  async login(@Body() body: any) {
    const validated = LoginSchema.parse(body);
    return this.authService.login(validated);
  }

  @Post('session-token')
  @ApiOperation({ summary: 'Create signed Agentforce session JWT token for restricted agent actions' })
  @ApiResponse({ status: 201, description: 'Signed session token with immutable claims' })
  async createSessionToken(@Body() body: { userId?: string; guestEmail?: string; guestName?: string; scopes?: string[] }) {
    return this.authService.createAgentSessionToken(body);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get profile of current authenticated user' })
  async getMe(@CurrentUser('id') userId: string) {
    return this.authService.getProfile(userId);
  }
}
