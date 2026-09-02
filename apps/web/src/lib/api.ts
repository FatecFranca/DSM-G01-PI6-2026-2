const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3002/api";

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit & { token?: string } = {}
): Promise<T> {
  const { token, ...init } = options;
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...init.headers,
  };
  if (token) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, { ...init, headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(
      Array.isArray(body.message) ? body.message.join(", ") : body.message ?? "Erro na requisição",
      res.status
    );
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}
