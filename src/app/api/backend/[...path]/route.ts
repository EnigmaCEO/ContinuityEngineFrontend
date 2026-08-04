import type { NextRequest } from "next/server";

const UPSTREAM_API_BASE =
  process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

const MAX_REQUEST_BODY_BYTES = 5 * 1024 * 1024;
const UPSTREAM_TIMEOUT_MS = 120_000;
const SESSION_COOKIE_NAME = "sce_session_id";
const SESSION_COOKIE_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;
const UNSAFE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const FORWARDED_REQUEST_HEADERS = [
  "accept",
  "accept-language",
  "content-type",
  "cookie",
  "if-modified-since",
  "if-none-match",
  "range",
  "user-agent",
  "x-sce-session",
];

const FORWARDED_RESPONSE_HEADERS = [
  "accept-ranges",
  "cache-control",
  "content-disposition",
  "content-range",
  "content-type",
  "etag",
  "last-modified",
  "location",
  "retry-after",
  "set-cookie",
  "vary",
  "www-authenticate",
];

type ProxyContext = {
  params: Promise<{ path: string[] }>;
};

function upstreamUrl(path: string[], request: NextRequest): URL {
  const upstream = new URL(UPSTREAM_API_BASE);
  if (upstream.protocol !== "http:" && upstream.protocol !== "https:") {
    throw new Error("Unsupported upstream API protocol");
  }
  const basePath = upstream.pathname.replace(/\/$/, "");
  const encodedPath = path.map((segment) => encodeURIComponent(segment)).join("/");
  upstream.pathname = `${basePath}/${encodedPath}`;
  upstream.search = request.nextUrl.search;
  return upstream;
}

function requestHeaders(request: NextRequest): Headers {
  const forwarded = new Headers();
  for (const name of FORWARDED_REQUEST_HEADERS) {
    const value = request.headers.get(name);
    if (value) forwarded.set(name, value);
  }
  return forwarded;
}

function responseHeaders(upstream: Response): Headers {
  const forwarded = new Headers();
  for (const name of FORWARDED_RESPONSE_HEADERS) {
    const value = upstream.headers.get(name);
    if (value) forwarded.set(name, value);
  }
  forwarded.set("X-Content-Type-Options", "nosniff");
  return forwarded;
}

function migrateLegacySession(
  headers: Headers,
  request: NextRequest,
  path: string[],
  upstream: Response,
): void {
  if (!upstream.ok || path.join("/") !== "saas/me") return;
  if (request.cookies.has(SESSION_COOKIE_NAME)) return;

  const legacyToken = request.headers.get("x-sce-session");
  if (!legacyToken || !/^[A-Za-z0-9._:-]{1,512}$/.test(legacyToken)) return;

  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  headers.append(
    "Set-Cookie",
    `${SESSION_COOKIE_NAME}=${legacyToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_COOKIE_MAX_AGE_SECONDS}${secure}`,
  );
}

function protectAuthenticatedResponse(headers: Headers, request: NextRequest): void {
  if (request.cookies.has(SESSION_COOKIE_NAME) || request.headers.has("x-sce-session")) {
    headers.set("Cache-Control", "no-store, private");
  }
}

function isSameOriginMutation(request: NextRequest): boolean {
  if (!UNSAFE_METHODS.has(request.method)) return true;
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).origin === request.nextUrl.origin;
  } catch {
    return false;
  }
}

async function proxy(request: NextRequest, context: ProxyContext): Promise<Response> {
  const { path } = await context.params;
  if (!isSameOriginMutation(request)) {
    return Response.json({ detail: "Cross-origin mutation rejected." }, { status: 403 });
  }

  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (Number.isFinite(declaredLength) && declaredLength > MAX_REQUEST_BODY_BYTES) {
    return Response.json({ detail: "Request body is too large." }, { status: 413 });
  }

  const hasBody = request.method !== "GET" && request.method !== "HEAD";

  try {
    const body = hasBody ? await request.arrayBuffer() : undefined;
    if (body && body.byteLength > MAX_REQUEST_BODY_BYTES) {
      return Response.json({ detail: "Request body is too large." }, { status: 413 });
    }
    const upstreamResponse = await fetch(upstreamUrl(path, request), {
      method: request.method,
      headers: requestHeaders(request),
      body,
      cache: "no-store",
      redirect: "manual",
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });

    const headers = responseHeaders(upstreamResponse);
    migrateLegacySession(headers, request, path, upstreamResponse);
    protectAuthenticatedResponse(headers, request);

    return new Response(upstreamResponse.body, {
      status: upstreamResponse.status,
      statusText: upstreamResponse.statusText,
      headers,
    });
  } catch (error) {
    const timedOut = error instanceof DOMException && error.name === "TimeoutError";
    return Response.json(
      { detail: timedOut ? "The SCE API request timed out." : "The SCE API is temporarily unavailable." },
      { status: timedOut ? 504 : 502 },
    );
  }
}

export const GET = proxy;
export const HEAD = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
