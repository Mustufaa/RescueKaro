import { NextRequest } from "next/server";
import { createHmac } from "node:crypto";
import { isIP } from "node:net";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const excludedHeaders = new Set(["connection", "host", "content-length", "transfer-encoding", "keep-alive", "upgrade", "proxy-authorization", "proxy-authenticate", "te", "trailer", "forwarded", "x-forwarded-for", "x-forwarded-host", "x-forwarded-proto", "x-real-ip"]);

function clientIp(request: NextRequest) {
  const forwarded = (request.headers.get("x-forwarded-for") || "").split(",").map(ip => ip.trim()).filter(Boolean);
  // Cloud Run appends its own proxy address after the client address.
  const candidate = forwarded.length > 1 ? forwarded[forwarded.length - 2] : undefined;
  return candidate && isIP(candidate) ? candidate : "127.0.0.1";
}

async function proxy(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const configured = process.env.API_INTERNAL_BASE_URL ||
    (process.env.NODE_ENV === "production" ? "" : "http://localhost:8080");
  let base: URL;
  try {
    base = new URL(configured);
    if (!["http:", "https:"].includes(base.protocol) || base.username || base.password || base.search || base.hash ||
        (base.pathname !== "/" && base.pathname !== "/api/v1" && base.pathname !== "/api/v1/")) throw new Error("Invalid API origin");
  } catch {
    return Response.json({ error: { code: "API_CONFIGURATION_ERROR", message: "The API connection is not configured." } }, { status: 503 });
  }
  const { path } = await context.params;
  if (!path?.length || path.some(part => !part || part === "." || part === ".." || part.includes("/")))
    return Response.json({ error: { code: "INVALID_PATH", message: "Invalid API path." } }, { status: 400 });
  const target = new URL(`/api/v1/${path.map(encodeURIComponent).join("/")}${request.nextUrl.search}`, base.origin);
  const headers = new Headers();
  request.headers.forEach((value, key) => {
    if (!excludedHeaders.has(key.toLowerCase()) && !key.toLowerCase().startsWith("x-rk-client-ip")) headers.set(key, value);
  });
  const proxySecret = process.env.API_PROXY_IP_SECRET || "";
  if (process.env.NODE_ENV === "production" && proxySecret.length < 32)
    return Response.json({ error: { code: "API_CONFIGURATION_ERROR", message: "The API proxy is not configured." } }, { status: 503 });
  if (proxySecret.length >= 32) {
    const ip = clientIp(request);
    const time = Math.floor(Date.now() / 1000).toString();
    headers.set("X-RK-Client-IP", ip);
    headers.set("X-RK-Client-IP-Time", time);
    headers.set("X-RK-Client-IP-Signature", createHmac("sha256", proxySecret).update(`${ip}|${time}`).digest("hex"));
  }
  headers.set("Accept-Encoding", "identity");
  const method = request.method.toUpperCase();
  try {
    const upstream = await fetch(target, {
      method,
      headers,
      body: method === "GET" || method === "HEAD" ? undefined : await request.arrayBuffer(),
      redirect: "manual",
      cache: "no-store",
      signal: AbortSignal.timeout(30000),
    });
    const responseHeaders = new Headers();
    upstream.headers.forEach((value, key) => {
      if (!excludedHeaders.has(key.toLowerCase()) && key.toLowerCase() !== "set-cookie") responseHeaders.set(key, value);
    });
    for (const cookie of upstream.headers.getSetCookie()) responseHeaders.append("Set-Cookie", cookie);
    responseHeaders.set("Cache-Control", "no-store");
    return new Response(method === "HEAD" || upstream.status === 204 || upstream.status === 304 ? null : upstream.body,
      { status: upstream.status, headers: responseHeaders });
  } catch {
    return Response.json({ error: { code: "API_UNAVAILABLE", message: "The API is temporarily unavailable. Please try again." } },
      { status: 502, headers: { "Cache-Control": "no-store" } });
  }
}

export const GET = proxy;
export const HEAD = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
export const OPTIONS = proxy;
