// Cliente HTTP único do app. Centraliza base URL, x-user-id, JSON,
// timeout e conversão de non-2xx em ApiError. Nenhuma tela deve chamar
// `fetch` diretamente.

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, path: string) {
    super(`${path} failed: ${status}`);
    this.name = "ApiError";
    this.status = status;
  }
}

export type ApiFetchOptions = {
  method?: "GET" | "POST" | "DELETE" | "PUT" | "PATCH";
  body?: unknown;
  userId?: string;
  baseUrl?: string;
  signal?: AbortSignal;
  timeoutMs?: number;
};

const DEFAULT_TIMEOUT_MS = 15_000;

export function apiBaseUrl(): string {
  return process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3001";
}

export async function apiFetch<T>(
  path: string,
  {
    method = "GET",
    body,
    userId,
    baseUrl,
    signal,
    timeoutMs = DEFAULT_TIMEOUT_MS,
  }: ApiFetchOptions = {},
): Promise<T> {
  const base = baseUrl ?? apiBaseUrl();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${base}${path}`, {
      method,
      headers: {
        Accept: "application/json",
        ...(userId ? { "x-user-id": userId } : {}),
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: signal ?? controller.signal,
    });

    if (!res.ok) {
      throw new ApiError(res.status, path);
    }
    if (res.status === 204) {
      return undefined as T;
    }
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}
