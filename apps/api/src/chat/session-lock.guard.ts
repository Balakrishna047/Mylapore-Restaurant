import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const HTTP_STATUS_LOCKED = 423;

@Injectable()
export class SessionLockGuard implements CanActivate {
  // In-memory mutex map for low-latency concurrency control
  private static activeSessions = new Set<string>();

  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const sessionToken = request.headers['x-chat-session-token'] || request.body?.sessionToken;

    if (!sessionToken) {
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          error: 'Bad Request',
          message: 'Missing required x-chat-session-token header'
        },
        HttpStatus.BAD_REQUEST
      );
    }

    if (SessionLockGuard.activeSessions.has(sessionToken)) {
      throw new HttpException(
        {
          statusCode: HTTP_STATUS_LOCKED,
          error: 'Locked',
          message: 'A chat turn is already in progress for this session. Please wait.'
        },
        HTTP_STATUS_LOCKED
      );
    }

    // Check DB for any pending turn with status 'PROCESSING'
    const pendingTurn = await this.prisma.chatTurn.findFirst({
      where: {
        session: { sessionToken },
        status: 'PROCESSING'
      }
    });

    if (pendingTurn) {
      const ageMs = Date.now() - new Date(pendingTurn.createdAt).getTime();
      if (ageMs > 25000) {
        // Turn exceeded 25s deadline and was orphaned/interrupted: auto-fail and unlock
        await this.prisma.chatTurn.update({
          where: { id: pendingTurn.id },
          data: { status: 'FAILED' }
        });
        SessionLockGuard.activeSessions.delete(sessionToken);
      } else {
        throw new HttpException(
          {
            statusCode: HTTP_STATUS_LOCKED,
            error: 'Locked',
            message: 'A chat turn is currently processing in the background.'
          },
          HTTP_STATUS_LOCKED
        );
      }
    }

    return true;
  }

  static acquire(sessionToken: string) {
    SessionLockGuard.activeSessions.add(sessionToken);
  }

  static release(sessionToken: string) {
    SessionLockGuard.activeSessions.delete(sessionToken);
  }
}
