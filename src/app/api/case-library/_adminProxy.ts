import { type NextRequest, NextResponse } from "next/server";

import {
  hasSessionCredentials,
  rejectCrossOriginMutation,
  upstreamSessionHeaders,
} from "@/app/api/_sessionAuth";

const API_BASE = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";
const MAX_REQUEST_BODY_BYTES = 1024 * 1024;

interface SaasMeResponse {
  permissions?: {
    canManageSources?: boolean;
  };
}

async function readError(res: Response): Promise<string> {
  const text = await res.text().catch(() => "");
  if (!text) return res.statusText || "Request failed";
  try {
    const body = JSON.parse(text) as { detail?: string; error?: string };
    return body.detail ?? body.error ?? text;
  } catch {
    return text;
  }
}

export async function proxyCaseLibraryAdminPost(
  req: NextRequest,
  upstreamPath: string,
  actionLabel: string,
): Promise<NextResponse> {
  const crossOriginResponse = rejectCrossOriginMutation(req);
  if (crossOriginResponse) return crossOriginResponse;

  if (!hasSessionCredentials(req)) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const declaredLength = Number(req.headers.get("content-length") ?? 0);
  if (Number.isFinite(declaredLength) && declaredLength > MAX_REQUEST_BODY_BYTES) {
    return NextResponse.json({ error: "Request body is too large." }, { status: 413 });
  }

  const adminKey = process.env.SCE_ADMIN_API_KEY ?? process.env.SCE_DASHBOARD_ADMIN_API_KEY;
  if (!adminKey?.trim()) {
    return NextResponse.json(
      { error: "Dashboard admin key is not configured. Set SCE_ADMIN_API_KEY on the web service." },
      { status: 500 },
    );
  }

  const meRes = await fetch(`${API_BASE}/saas/me`, {
    headers: upstreamSessionHeaders(req),
    cache: "no-store",
  });
  if (!meRes.ok) {
    return NextResponse.json({ error: await readError(meRes) }, { status: meRes.status });
  }

  const me = (await meRes.json()) as SaasMeResponse;
  if (!me.permissions?.canManageSources) {
    return NextResponse.json({ error: `${actionLabel} requires SCE operator access.` }, { status: 403 });
  }

  const body = await req.text().catch(() => "");
  if (new TextEncoder().encode(body).byteLength > MAX_REQUEST_BODY_BYTES) {
    return NextResponse.json({ error: "Request body is too large." }, { status: 413 });
  }
  const upstreamRes = await fetch(`${API_BASE}${upstreamPath}`, {
    method: "POST",
    headers: {
      ...(body ? { "Content-Type": req.headers.get("content-type") ?? "application/json" } : {}),
      "X-SCE-Admin-Key": adminKey.trim(),
    },
    ...(body ? { body } : {}),
    cache: "no-store",
  });

  const text = await upstreamRes.text();
  if (!upstreamRes.ok) {
    const detail = text ? await readError(new Response(text, { status: upstreamRes.status })) : upstreamRes.statusText;
    return NextResponse.json(
      { error: `${actionLabel} failed upstream [${upstreamRes.status}]: ${detail}` },
      { status: upstreamRes.status },
    );
  }

  return new NextResponse(text, {
    status: upstreamRes.status,
    headers: { "Content-Type": upstreamRes.headers.get("content-type") ?? "application/json" },
  });
}
