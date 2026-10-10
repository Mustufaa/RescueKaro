const BROWSER_API_BASE_URL = "/api/v1";

// Browser requests stay on the frontend origin and use the Next.js API rewrite.
// Server requests can reach the backend directly inside the Compose network.
const SERVER_API_BASE_URL =
  process.env.API_INTERNAL_BASE_URL || "http://localhost:8080/api/v1";

export const API_BASE_URL = BROWSER_API_BASE_URL;

export const BACKEND_ORIGIN = (() => {
  try {
    return new URL(API_BASE_URL,typeof window!=="undefined"?window.location.origin:"http://localhost:3000").origin;
  } catch {
    return "";
  }
})();
let csrfToken = "";

type ApiEnvelope<T> = { data: T; meta?: { requestId?: string } };
type ApiErrorBody = {
  error?: {
    code?: string;
    message?: string;
    fields?: Record<string, string>;
    requestId?: string;
  };
};

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
    public readonly fields?: Record<string, string>,
    public readonly requestId?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(url: string, init?: RequestInit, retry=true): Promise<T> {
  const headers = new Headers(init?.headers);
  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const method = (init?.method || "GET").toUpperCase();
  if (typeof document !== "undefined" && !["GET", "HEAD", "OPTIONS"].includes(method) && !headers.has("X-XSRF-TOKEN")) {
    const csrf = csrfToken || document.cookie.split("; ").find((entry) => entry.startsWith("XSRF-TOKEN="))?.split("=").slice(1).join("=");
    if (csrf) headers.set("X-XSRF-TOKEN", decodeURIComponent(csrf));
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      headers,
      credentials: "include",
    });
  } catch (error) {
    // Browsers report network, DNS, TLS, and CORS failures as an opaque
    // TypeError. Give callers a useful message without hiding the URL they
    // need to check when configuring the API proxy.
    if (error instanceof TypeError) {
      throw new ApiError(
        `Could not reach the RescueKaro API at ${url}. Check that the backend is running and that the frontend API proxy can reach it.`,
        0,
        "API_UNREACHABLE",
      );
    }
    throw error;
  }

  if(response.status===401 && retry && url.includes("/api/v1/") && !/\/auth\/(login|register|refresh|logout|otp)/.test(url)){
    try{
      const base=url.slice(0,url.indexOf("/api/v1/")+7);
      await request(`${base}/auth/refresh`,{method:"POST"},false);
      return request<T>(url,init,false);
    }catch{ /* The original response carries the useful authentication error. */ }
  }

  if (response.status === 204) return undefined as T;

  const body = (await response.json().catch(() => undefined)) as
    | ApiEnvelope<T>
    | ApiErrorBody
    | T
    | undefined;

  if (url.endsWith("/auth/csrf") && body && typeof body === "object" && "data" in body) {
    const token = (body as ApiEnvelope<{ token?: string }>).data?.token;
    if (token) csrfToken = token;
  }

  if (!response.ok) {
    const details = body as ApiErrorBody | undefined;
    throw new ApiError(
      details?.error?.message || "The request could not be completed.",
      response.status,
      details?.error?.code,
      details?.error?.fields,
      details?.error?.requestId,
    );
  }

  if (body && typeof body === "object" && "data" in body) {
    return (body as ApiEnvelope<T>).data;
  }

  return body as T;
}

export function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const baseUrl = typeof window === "undefined" ? SERVER_API_BASE_URL : BROWSER_API_BASE_URL;
  return request<T>(`${baseUrl.replace(/\/$/, "")}${normalizedPath}`, init);
}

export function backendRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const origin = typeof window === "undefined"
    ? new URL(SERVER_API_BASE_URL).origin
    : BACKEND_ORIGIN;
  return request<T>(`${origin}${normalizedPath}`, init);
}
