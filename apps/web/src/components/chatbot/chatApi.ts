import { ChatDisplayBlock, CategoryButton, MenuItemCardData, MenuItemDetailData } from './chat.types';

const CHAT_SESSION_KEY = 'mylapore_chat_session_token';
const FALLBACK_API = 'https://mylapore-express-api.onrender.com/api/v1';

function getApiBases(): string[] {
  if (typeof window === 'undefined') {
    return [FALLBACK_API];
  }
  return ['/api/v1', FALLBACK_API];
}

export function getStoredChatSessionToken(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem(CHAT_SESSION_KEY) || localStorage.getItem(CHAT_SESSION_KEY);
}

export function storeChatSessionToken(token: string) {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(CHAT_SESSION_KEY, token);
  localStorage.setItem(CHAT_SESSION_KEY, token);
}

export function clearChatSessionToken() {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(CHAT_SESSION_KEY);
  localStorage.removeItem(CHAT_SESSION_KEY);
}

async function requestWithRetry<T>(endpoint: string, options: RequestInit = {}, retries = 2): Promise<T> {
  const bases = getApiBases();
  let lastError: any = null;

  for (const base of bases) {
    const url = `${base}${endpoint}`;
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const res = await fetch(url, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            ...(options.headers || {})
          }
        });

        if (res.status === 423) {
          throw new Error('A turn is already processing. Please wait.');
        }

        if (!res.ok) {
          const errBody = await res.json().catch(() => ({}));
          throw new Error(errBody.message || `API error: ${res.status} ${res.statusText}`);
        }

        return await res.json();
      } catch (err: any) {
        lastError = err;
        if (err.message?.includes('already processing')) {
          throw err;
        }
        if (attempt < retries) {
          await new Promise((r) => setTimeout(r, 800 * (attempt + 1)));
        }
      }
    }
  }

  throw lastError || new Error(`Failed to request ${endpoint}`);
}

export interface InitSessionResponse {
  sessionToken: string;
  sessionId: string;
  status: string;
  outletId: string;
  welcomeMessage: string;
  displayBlocks: ChatDisplayBlock[];
}

export interface TurnResponse {
  turnId: string;
  turnNumber: number;
  turnToken: string;
  agentText: string;
  displayBlocks: ChatDisplayBlock[];
}

export const chatApi = {
  async initSession(outletId?: string): Promise<InitSessionResponse> {
    const existingToken = getStoredChatSessionToken();
    const data = await requestWithRetry<InitSessionResponse>('/chat/session', {
      method: 'POST',
      body: JSON.stringify({
        sessionToken: existingToken || undefined,
        outletId: outletId || 'outlet-mylapore-001'
      })
    });

    if (data.sessionToken) {
      storeChatSessionToken(data.sessionToken);
    }
    return data;
  },

  async sendTurn(message: string, sessionToken: string): Promise<TurnResponse> {
    return requestWithRetry<TurnResponse>('/chat/turn', {
      method: 'POST',
      headers: {
        'x-chat-session-token': sessionToken
      },
      body: JSON.stringify({ message })
    });
  },

  async getDisplayBlocks(turnId: string): Promise<ChatDisplayBlock[]> {
    return requestWithRetry<ChatDisplayBlock[]>(`/chat/display/${turnId}`, {
      method: 'GET'
    });
  },

  async getSimpleMenuCategories(): Promise<CategoryButton[]> {
    return requestWithRetry<CategoryButton[]>('/chat/simple-menu/categories', {
      method: 'GET'
    });
  },

  async getSimpleMenuItems(categorySlug?: string, query?: string): Promise<MenuItemCardData[]> {
    const params = new URLSearchParams();
    if (categorySlug) params.append('categorySlug', categorySlug);
    if (query) params.append('query', query);
    return requestWithRetry<MenuItemCardData[]>(`/chat/simple-menu/items?${params.toString()}`, {
      method: 'GET'
    });
  }
};
