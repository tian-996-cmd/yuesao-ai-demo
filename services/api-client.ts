import { apiBaseUrl } from '@/lib/runtime-mode';

const TOKEN_KEY = 'jiazheng-v1-access-token';
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}

export const tokenStore = {
  get() {
    return typeof window === 'undefined'
      ? null
      : sessionStorage.getItem(TOKEN_KEY);
  },
  set(token: string) {
    sessionStorage.setItem(TOKEN_KEY, token);
  },
  clear() {
    if (typeof window !== 'undefined') sessionStorage.removeItem(TOKEN_KEY);
  },
};

export async function apiRequest<T>(path: string, init: RequestInit = {}) {
  const token = tokenStore.get();
  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');
  if (init.body) headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers,
  });
  if (response.status === 204) return undefined as T;
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401) tokenStore.clear();
    const error = (
      data as { error?: { code?: string; message?: string; details?: unknown } }
    ).error;
    throw new ApiError(
      response.status,
      error?.code ?? 'REQUEST_FAILED',
      error?.message ?? '请求失败',
      error?.details,
    );
  }
  return data as T;
}
