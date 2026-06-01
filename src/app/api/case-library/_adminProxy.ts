import { type NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

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
  const sessionToken = req.headers.get("x-sce-session");
  if (!sessionToken) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const adminKey = process.env.SCE_ADMIN_API_KEY ?? process.env.SCE_DASHBOARD_ADMIN_API_KEY;
  if (!adminKey?.trim()) {
    return NextResponse.json(
      { error: "Dashboard admin key is not configured. Set SCE_ADMIN_API_KEY on the web service." },
      { status: 500 },
    );
  }

  const meRes = await fetch(`${API_BASE}/saas/me`, {
    headers: { "X-SCE-Session": sessionToken },
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
