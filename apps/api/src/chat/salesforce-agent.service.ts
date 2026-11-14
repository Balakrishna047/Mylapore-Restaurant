import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class SalesforceAgentService {
  private readonly logger = new Logger(SalesforceAgentService.name);
  private cachedToken: { accessToken: string; expiresAt: number; instanceUrl: string } | null = null;
  private agentSessions = new Map<string, string>();

  private isConfigured(): boolean {
    return (
      process.env.SALESFORCE_ENABLED === 'true' &&
      !!process.env.SALESFORCE_CLIENT_ID &&
      !!(process.env.SALESFORCE_CLIENT_SECRET || process.env.SALESFORCE_PASSWORD)
    );
  }

  async getAccessToken(): Promise<{ accessToken: string; instanceUrl: string } | null> {
    if (!this.isConfigured()) return null;

    if (this.cachedToken && Date.now() < this.cachedToken.expiresAt - 60000) {
      return this.cachedToken;
    }

    try {
      const loginUrl =
        process.env.SALESFORCE_INSTANCE_URL ||
        process.env.SALESFORCE_LOGIN_URL ||
        'https://login.salesforce.com';
      const tokenEndpoint = `${loginUrl.replace(/\/+$/, '')}/services/oauth2/token`;

      const params = new URLSearchParams();
      if (process.env.SALESFORCE_CLIENT_SECRET) {
        params.append('grant_type', 'client_credentials');
        params.append('client_id', process.env.SALESFORCE_CLIENT_ID!);
        params.append('client_secret', process.env.SALESFORCE_CLIENT_SECRET!);
      } else if (process.env.SALESFORCE_PASSWORD) {
        params.append('grant_type', 'password');
        params.append('client_id', process.env.SALESFORCE_CLIENT_ID!);
        params.append('client_secret', process.env.SALESFORCE_CLIENT_SECRET || '');
        params.append(
          'username',
          process.env.SALESFORCE_RUN_AS_USER || process.env.SALESFORCE_USERNAME || ''
        );
        params.append(
          'password',
          `${process.env.SALESFORCE_PASSWORD}${process.env.SALESFORCE_SECURITY_TOKEN || ''}`
        );
      }

      const res = await fetch(tokenEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString()
      });

      if (!res.ok) {
        const errText = await res.text();
        this.logger.warn(`Salesforce OAuth token request failed (${res.status}): ${errText}`);
        return null;
      }

      const data = await res.json();
      const instanceUrl = data.instance_url || process.env.SALESFORCE_INSTANCE_URL || loginUrl;
      const expiresIn = data.expires_in ? Number(data.expires_in) * 1000 : 3600000;

      this.cachedToken = {
        accessToken: data.access_token,
        instanceUrl,
        expiresAt: Date.now() + expiresIn
      };

      return this.cachedToken;
    } catch (err: any) {
      this.logger.error(`Error acquiring Salesforce OAuth token: ${err.message}`);
      return null;
    }
  }

  async sendAgentTurn(sessionToken: string, userQuery: string): Promise<string | null> {
    const auth = await this.getAccessToken();
    if (!auth) return null;

    const agentId = process.env.SALESFORCE_AGENT_ID || '0XxgK000002YIJ7SAO';

    try {
      let sfSessionId = this.agentSessions.get(sessionToken);
      if (!sfSessionId) {
        const sessionRes = await fetch(
          `${auth.instanceUrl}/services/data/v60.0/connect/agent/${agentId}/sessions`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${auth.accessToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ externalSessionKey: sessionToken })
          }
        );

        if (sessionRes.ok) {
          const sData = await sessionRes.json();
          sfSessionId = sData.sessionId || sData.id;
          if (sfSessionId) {
            this.agentSessions.set(sessionToken, sfSessionId);
          }
        }
      }

      const turnEndpoint = sfSessionId
        ? `${auth.instanceUrl}/services/data/v60.0/connect/agent/${agentId}/sessions/${sfSessionId}/turns`
        : `${auth.instanceUrl}/services/data/v60.0/connect/agent/${agentId}/turns`;

      const turnRes = await fetch(turnEndpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${auth.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: userQuery })
      });

      if (!turnRes.ok) {
        this.logger.warn(`Agentforce Agent API turn returned ${turnRes.status}`);
        return null;
      }

      const turnData = await turnRes.json();
      const agentText = turnData.agentText || turnData.message || turnData.response?.text;
      return agentText || null;
    } catch (err: any) {
      this.logger.error(`Error in Salesforce Agentforce turn: ${err.message}`);
      return null;
    }
  }
}
