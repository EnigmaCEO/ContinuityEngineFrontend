import { type NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE_NAME = "sce_session_id";

export function upstreamSessionHeaders(request: NextRequest): Headers {
  const headers = new Headers();
  const cookieToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const legacyHeaderToken = request.headers.get("x-sce-session");

  if (cookieToken) {
    headers.set("Cookie", `${SESSION_COOKIE_NAME}=${cookieToken}`);
  } else if (legacyHeaderToken) {
    headers.set("X-SCE-Session", legacyHeaderToken);
  }

  return headers;
}

export function hasSessionCredentials(request: NextRequest): boolean {
  return Boolean(
    request.cookies.get(SESSION_COOKIE_NAME)?.value || request.headers.get("x-sce-session"),
  );
}

export function rejectCrossOriginMutation(request: NextRequest): NextResponse | null {
  const origin = request.headers.get("origin");
  if (!origin) return null;

  try {
    if (new URL(origin).origin === request.nextUrl.origin) return null;
  } catch {
    // Reject malformed origins below.
  }

  return NextResponse.json({ error: "Cross-origin mutation rejected." }, { status: 403 });
}
