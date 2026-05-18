const getBaseUrl = () => {
  if (typeof window === 'undefined') {
    return `${process.env.NEXT_PUBLIC_APP_URL}/api`;
  }
  return '/api';
};

export async function apiClient<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}${endpoint}`;

  const headers = new Headers(options?.headers);
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  // Forward cookies if calling from server-side environment (SSR/Prefetching)
  if (typeof window === 'undefined') {
    try {
      const { cookies } = await import('next/headers');
      const cookieStore = await cookies();
      const cookieString = cookieStore.toString();
      if (cookieString) {
        headers.set('Cookie', cookieString);
      }
    } catch (e) {
      console.warn('apiClient: cookies not available in this context', e);
    }
  }

  const res = await fetch(url, {
    ...options,
    headers
  });

  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }

  return res.json() as Promise<T>;
}
