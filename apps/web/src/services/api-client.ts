const DEFAULT_API_BASE_URL = "http://localhost:4000/api/v1";

const sanitizeBaseUrl = (value?: string) => {
  if (!value || value.trim().length === 0) {
    return DEFAULT_API_BASE_URL;
  }

  return value.replace(/\/$/, "");
};

const API_BASE_URL = sanitizeBaseUrl(import.meta.env.VITE_API_BASE_URL);

export interface ApiErrorPayload {
  error?: string;
  detail?: string;
}

export class ApiError extends Error {
  status: number;
  payload?: ApiErrorPayload;

  constructor(message: string, status: number, payload?: ApiErrorPayload) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

interface RequestConfig extends Omit<RequestInit, "body"> {
  body?: unknown;
}

async function request<TResponse>(
  path: string,
  config: RequestConfig = {}
): Promise<TResponse> {
  const url = `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
  const { body, headers, ...rest } = config;

  const response = await fetch(url, {
    method: config.method ?? (body ? "POST" : "GET"),
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
    ...rest,
  });

  const contentType = response.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");
  const payload = isJson ? await response.json().catch(() => null) : null;

  if (!response.ok) {
    const errorMessage =
      (payload && typeof payload === "object" && "error" in payload
        ? String((payload as ApiErrorPayload).error)
        : response.statusText) || "Request failed";

    throw new ApiError(errorMessage, response.status, payload ?? undefined);
  }

  if (!isJson) {
    return undefined as TResponse;
  }

  return payload as TResponse;
}

export const apiClient = {
  get: <TResponse>(path: string, config?: RequestConfig) =>
    request<TResponse>(path, { ...config, method: "GET" }),
  post: <TResponse>(
    path: string,
    body?: unknown,
    config?: RequestConfig
  ) => request<TResponse>(path, { ...config, method: "POST", body }),
};

export type ApiClient = typeof apiClient;
