import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class AgentforceApiKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKey =
      request.headers['x-agentforce-api-key'] ||
      (request.headers['authorization']?.startsWith('Bearer ')
        ? request.headers['authorization'].slice(7)
        : null);

    const validKey = process.env.AGENTFORCE_API_KEY || 'mylapore-agentforce-secret-key-2026';

    if (!apiKey || apiKey !== validKey) {
      throw new UnauthorizedException(
        'Unauthorized: Invalid or missing x-agentforce-api-key header for Agentforce External Service.'
      );
    }

    request.agentforceVerified = true;
    return true;
  }
}
