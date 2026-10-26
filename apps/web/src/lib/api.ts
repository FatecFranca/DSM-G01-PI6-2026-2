import { useAuthStore } from "@/store/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3002/api";

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

type AuthStorage = {
  state?: {
    accessToken?: string | null;
    refreshToken?: string | null;
    user?: unknown;
  };
};

function readAuthStorage(): AuthStorage | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("sportarena-auth");
    return raw ? (JSON.parse(raw) as AuthStorage) : null;
  } catch {
    return null;
  }
}

function writeAuthTokens(accessToken: string, refreshToken: string) {
  const current = readAuthStorage() ?? {};
  const next = {
    ...current,
    state: {
      ...(current.state ?? {}),
      accessToken,
      refreshToken,
    },
  };
  localStorage.setItem("sportarena-auth", JSON.stringify(next));
  const state = useAuthStore.getState();
  if (state.user) {
    useAuthStore.setState({ accessToken, refreshToken });
  }
}

async function tryRefreshToken(): Promise<string | null> {
  const stored = readAuthStorage();
  const refreshToken = stored?.state?.refreshToken;
  if (!refreshToken) return null;

  const res = await fetch(`${API_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });
  if (!res.ok) return null;

  const data = (await res.json()) as {
    accessToken: string;
    refreshToken: string;
  };
  writeAuthTokens(data.accessToken, data.refreshToken);
  return data.accessToken;
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit & { token?: string; _retried?: boolean } = {}
): Promise<T> {
  const { token, _retried, ...init } = options;
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...init.headers,
  };
  if (token) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, { ...init, headers });

  if (res.status === 401 && token && !_retried && !path.startsWith("/auth/")) {
    const nextToken = await tryRefreshToken();
    if (nextToken) {
      return apiFetch<T>(path, { ...options, token: nextToken, _retried: true });
    }
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(
      Array.isArray(body.message)
        ? body.message.join(", ")
        : body.message ?? "Erro na requisição",
      res.status
    );
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}
