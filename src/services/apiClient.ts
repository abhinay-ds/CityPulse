const LOCAL_API = 'http://127.0.0.1:8000';
const PRODUCTION_API = 'https://citypulse-1-ewb2.onrender.com';

/**
 * Resolve the API base at runtime. Vite env wins; otherwise local development
 * uses the local FastAPI server and deployed builds use the Render API.
 */
export function getApiBaseUrl(): string {
  const configured = import.meta.env.VITE_API_BASE_URL?.trim();
  if (configured) return configured.replace(/\/$/, '');

  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') return LOCAL_API;
  }

  return PRODUCTION_API;
}

export class ApiRequestError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(`${getApiBaseUrl()}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers || {}),
      },
      signal: controller.signal,
    });
    if (!response.ok) {
      let message = `Request failed (${response.status})`;
      try {
        const body = (await response.json()) as { error?: unknown; detail?: unknown };
        if (typeof body.error === 'string' && body.error.trim()) message = body.error;
        else if (typeof body.detail === 'string' && body.detail.trim()) message = body.detail;
      } catch {
        // Keep the status-based message when the body is not JSON.
      }
      throw new ApiRequestError(message, response.status);
    }
    return (await response.json()) as T;
  } finally {
    clearTimeout(timeout);
  }
}
