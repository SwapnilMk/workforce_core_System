const getBaseUrl = () => {
  if (typeof window === 'undefined') {
    return `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api`;
  }
  return '/api';
};

export async function apiClient<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}${endpoint}`;

  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });

  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }

  return res.json() as Promise<T>;
}
