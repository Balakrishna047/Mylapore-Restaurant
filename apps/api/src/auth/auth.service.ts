import { Injectable, BadRequestException, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService
  ) {}

  async register(data: { email: string; password: string; name: string; phone?: string }) {
    const existing = await this.prisma.user.findUnique({
      where: { email: data.email.toLowerCase().trim() }
    });
    if (existing) {
      throw new ConflictException('An account with this email address already exists');
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: data.email.toLowerCase().trim(),
        passwordHash,
        name: data.name.trim(),
        phone: data.phone?.trim(),
        role: 'CUSTOMER'
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        createdAt: true
      }
    });

    const token = this.generateToken(user);
    return { user, token };
  }

  async login(data: { email: string; password: string }) {
    const user = await this.prisma.user.findUnique({
      where: { email: data.email.toLowerCase().trim() }
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(data.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const profile = {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role,
      createdAt: user.createdAt
    };

    const token = this.generateToken(profile);
    return { user: profile, token };
  }

  async createAgentSessionToken(params: {
    userId?: string;
    guestEmail?: string;
    guestName?: string;
    scopes?: string[];
  }) {
    const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const payload = {
      sub: params.userId || `guest_${Math.random().toString(36).substring(2, 8)}`,
      sessionId,
      aud: 'mylapore-agentforce-gateway',
      iss: 'mylapore-express-api',
      email: params.guestEmail || (params.userId ? (await this.prisma.user.findUnique({ where: { id: params.userId } }))?.email : 'guest@mylaporeexpress.com'),
      name: params.guestName || 'Mylapore Customer',
      scopes: params.scopes || ['agent:menu:search', 'agent:order:status', 'agent:support:create'],
      role: 'AGENT_SESSION'
    };

    const token = this.jwtService.sign(payload, { expiresIn: '2h' });
    return {
      sessionToken: token,
      sessionId,
      expiresIn: 7200,
      scopes: payload.scopes
    };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        createdAt: true,
        addresses: true
      }
    });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return user;
  }

  private generateToken(user: { id: string; email: string; role: string; name: string }) {
    const payload = { sub: user.id, email: user.email, role: user.role, name: user.name };
    return this.jwtService.sign(payload);
  }
}
