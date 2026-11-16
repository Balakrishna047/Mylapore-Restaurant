const rawApiUrl = process.env.API_URL || (process.env.NODE_ENV === 'production' ? 'https://mylapore-express-api.onrender.com' : 'http://localhost:4000');
const normalizedUrl = rawApiUrl.startsWith('http') ? rawApiUrl : `http://${rawApiUrl}:4000`;
const serverApiBase = normalizedUrl.endsWith('/api/v1') ? normalizedUrl : `${normalizedUrl.replace(/\/+$/, '')}/api/v1`;

const FALLBACK_API = 'https://mylapore-express-api.onrender.com/api/v1';

function getAuthHeader(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('mylapore_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function getSessionToken(): string {
  if (typeof window === 'undefined') return 'guest_default';
  let token = localStorage.getItem('mylapore_session_token');
  if (!token) {
    token = 'guest_' + Math.random().toString(36).substring(2, 12);
    localStorage.setItem('mylapore_session_token', token);
  }
  return token;
}

// In-memory cache for fast read operations
const apiCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL_MS = 25000; // 25 seconds fast cache

export function clearApiCache(prefix?: string) {
  if (!prefix) {
    apiCache.clear();
    return;
  }
  apiCache.forEach((_, key) => {
    if (key.startsWith(prefix)) apiCache.delete(key);
  });
}

// Resilient request client with automatic cold-start retry and direct fallback
async function request<T>(
  endpoint: string,
  options: RequestInit = {},
  retries = 1,
  useCache = false
): Promise<T> {
  const isGet = !options.method || options.method.toUpperCase() === 'GET';

  // Return from fast cache if valid
  if (isGet && useCache) {
    const cached = apiCache.get(endpoint);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.data as T;
    }
  }

  const headers = {
    'Content-Type': 'application/json',
    'x-session-token': getSessionToken(),
    ...getAuthHeader(),
    ...(options.headers || {})
  };

  const bases = typeof window === 'undefined'
    ? [serverApiBase]
    : ['/api/v1', FALLBACK_API];

  let lastError: any = null;

  for (const base of bases) {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const res = await fetch(`${base}${endpoint}`, {
          ...options,
          headers
        });

        // 502 / 503 / 504 are temporary gateway/cold-start states on free-tier containers
        if ([502, 503, 504].includes(res.status)) {
          if (attempt < retries) {
            await new Promise((resolve) => setTimeout(resolve, 800 * (attempt + 1)));
            continue;
          }
          lastError = new Error(`Backend service is warming up (${res.status}). Retrying...`);
          break; // Switch to direct API fallback
        }

        if (!res.ok) {
          let errMsg = `Request failed: ${res.status}`;
          try {
            const errData = await res.json();
            errMsg = errData.message || errMsg;
            if (Array.isArray(errMsg)) errMsg = errMsg.join(', ');
          } catch {}
          const error: any = new Error(errMsg);
          error.status = res.status;

          // Deterministic client errors (4xx) must NEVER be retried
          if (res.status >= 400 && res.status < 500) {
            throw error;
          }
          lastError = error;
          break;
        }

        const data = await res.json();
        if (isGet && useCache) {
          apiCache.set(endpoint, { data, timestamp: Date.now() });
        }
        return data as T;
      } catch (err: any) {
        lastError = err;
        // Never retry deterministic 4xx client errors (401, 403, 404, 400)
        if (err.status && err.status >= 400 && err.status < 500) {
          throw err;
        }
        if (attempt < retries) {
          await new Promise((resolve) => setTimeout(resolve, 600 * (attempt + 1)));
        }
      }
    }
  }

  throw lastError || new Error('Connection failed. Please try again.');
}

let keepAliveInterval: any = null;

export function warmUpApi() {
  if (typeof window === 'undefined') return;
  try {
    fetch('/api/v1/health').catch(() => {});
  } catch {}

  // Keep Render free services awake while user is browsing (every 4 min to beat 15 min sleep)
  if (!keepAliveInterval) {
    keepAliveInterval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        fetch('/api/v1/health').catch(() => {});
      }
    }, 240000);
  }
}

export const api = {
  // Restaurant Info
  getRestaurantInfo: () => request<any>('/restaurants/info'),

  // Menu
  getCategories: () => request<any[]>('/menu/categories', {}, 1, true),
  getMenuItems: (params?: { category?: string; dietary?: string; spiceLevel?: string; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.category) query.set('category', params.category);
    if (params?.dietary) query.set('dietary', params.dietary);
    if (params?.spiceLevel) query.set('spiceLevel', params.spiceLevel);
    if (params?.search) query.set('search', params.search);
    const qs = query.toString();
    return request<any[]>(`/menu/items${qs ? `?${qs}` : ''}`, {}, 1, true);
  },
  getMenuItem: (idOrSlug: string) => request<any>(`/menu/items/${idOrSlug}`, {}, 1, true),

  // Cart
  getCart: () => request<any>('/cart'),
  addToCart: (data: { menuItemId: string; quantity: number; variantId?: string; spiceLevel?: string; specialInstructions?: string }) =>
    request<any>('/cart/items', { method: 'POST', body: JSON.stringify(data) }),
  updateCartItem: (itemId: string, quantity: number) =>
    request<any>(`/cart/items/${itemId}`, { method: 'PUT', body: JSON.stringify({ quantity }) }),
  removeCartItem: (itemId: string) =>
    request<any>(`/cart/items/${itemId}`, { method: 'DELETE' }),

  // Checkout & Orders
  getQuote: (data: { orderType: string; couponCode?: string; tip?: number; deliveryAddressText?: string }) =>
    request<any>('/checkout/quote', { method: 'POST', body: JSON.stringify(data) }),
  createOrderIntent: (data: any) =>
    request<any>('/checkout/create-intent', { method: 'POST', body: JSON.stringify(data) }),
  getOrder: (idOrNumber: string) => request<any>(`/orders/${idOrNumber}`),
  listOrders: (status?: string) => request<any[]>(`/orders${status ? `?status=${status}` : ''}`),
  rescheduleOrder: (id: string, newDeliverySlot: string, reason?: string) =>
    request<any>(`/orders/${id}/reschedule`, { method: 'POST', body: JSON.stringify({ newDeliverySlot, reason }) }),
  cancelOrder: (id: string, reason: string) =>
    request<any>(`/orders/${id}/cancel`, { method: 'POST', body: JSON.stringify({ reason }) }),
  advanceOrderStatus: (id: string, status: string, note?: string) =>
    request<any>(`/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status, note }) }),

  // Auth
  login: (data: { email: string; password: string }) =>
    request<any>('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  register: (data: { email: string; password: string; name: string; phone?: string }) =>
    request<any>('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  getMe: () => request<any>('/auth/me'),

  // Support & Agentforce AI
  chat: (message: string, orderNumber?: string) =>
    request<any>('/support/chat', { method: 'POST', body: JSON.stringify({ message, orderNumber }) }),
  createSupportTicket: (data: any) =>
    request<any>('/support/tickets', { method: 'POST', body: JSON.stringify(data) }),

  // Admin & Operations
  getAdminDashboard: () => request<any>('/admin/dashboard'),
  toggleStock: async (itemId: string) => {
    clearApiCache('/menu');
    return request<any>(`/admin/inventory/${itemId}/toggle`, { method: 'PATCH' });
  },
  createMenuItem: async (data: any) => {
    clearApiCache('/menu');
    return request<any>('/admin/menu/items', { method: 'POST', body: JSON.stringify(data) });
  },
  updateMenuItem: async (id: string, data: any) => {
    clearApiCache('/menu');
    return request<any>(`/admin/menu/items/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
  },
  deleteMenuItem: async (id: string) => {
    clearApiCache('/menu');
    return request<any>(`/admin/menu/items/${id}`, { method: 'DELETE' });
  },
  getAuditLogs: () => request<any[]>('/admin/audit-logs'),

  // Simulated Payment confirmation helper
  confirmTestPayment: (paymentIntentId: string) =>
    request<any>('/payments/test-confirm', { method: 'POST', body: JSON.stringify({ paymentIntentId }) }),

  // Geolocation & Delivery Zones
  checkDeliveryLocation: (data: { zipCode?: string; latitude?: number; longitude?: number; address?: string }) =>
    request<any>('/delivery/check', { method: 'POST', body: JSON.stringify(data) }),
  getDeliveryZones: () => request<any[]>('/delivery/zones')
};
