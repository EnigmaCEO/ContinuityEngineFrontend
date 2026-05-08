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

export async function POST(req: NextRequest) {
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
    return NextResponse.json({ error: "Source sync requires SCE operator access." }, { status: 403 });
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    payload = {};
  }

  const syncRes = await fetch(`${API_BASE}/case-library/sync-sources`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-SCE-Admin-Key": adminKey.trim(),
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  const text = await syncRes.text();
  if (!syncRes.ok) {
    const detail = text ? await readError(new Response(text, { status: syncRes.status })) : syncRes.statusText;
    return NextResponse.json(
      { error: `Sync Sources failed upstream [${syncRes.status}]: ${detail}` },
      { status: syncRes.status },
    );
  }

  return new NextResponse(text, {
    status: syncRes.status,
    headers: { "Content-Type": syncRes.headers.get("content-type") ?? "application/json" },
  });
}
