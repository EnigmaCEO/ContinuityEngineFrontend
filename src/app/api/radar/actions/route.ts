import { type NextRequest, NextResponse } from "next/server";

import type {
  LiveDeliveryRunResult,
  RadarClientCreateInput,
  RadarClientUpdateInput,
  RadarWatchlist,
  RadarWatchlistCreateInput,
  RadarWatchlistMatch,
  RadarDeliveryDestinationCreateInput,
  WatchlistMatchRunResult,
} from "@/lib/radar/types";

const API_BASE = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

const STATIC_ACTIONS = {
  "client-sample": { path: "/v1/sce/radar/clients/dev/sample", label: "Sample Radar client" },
  "oracle-sample": { path: "/v1/sce/radar/alerts/dev/oracle", label: "Oracle sample alert" },
  "bridge-sample": { path: "/v1/sce/radar/alerts/dev/bridge", label: "Bridge sample alert" },
  "run-chainlink": { path: "/v1/sce/radar/monitors/oracles/chainlink/run", label: "Chainlink staleness monitor" },
  "run-reference": { path: "/v1/sce/radar/monitors/oracles/reference-deviation/run", label: "Oracle reference check" },
  "run-oracle-pilot-drill": { path: "/v1/sce/radar/oracles/pilot-drill/run", label: "Oracle pilot drill" },
  "recompute-signal-quality": { path: "/v1/sce/radar/signals/quality/recompute?monitor_type=oracle", label: "Signal quality recompute" },
  "bridge-monitor": { path: "/v1/sce/radar/monitors/bridges/canonical", label: "Bridge Monitor" },
  "bridge-reconcile-stale": { path: "/v1/sce/radar/monitors/bridges/reconcile-stale", label: "Reconcile stale route alerts" },
  "run-bridge": { path: "/v1/sce/radar/monitors/bridges/run", label: "Legacy bridge route monitor" },
  "oracle-smoke": { path: "/v1/sce/radar/live-objects/oracles/smoke", label: "Oracle smoke check" },
  "cctp-smoke": { path: "/v1/sce/radar/live-objects/bridges/smoke", label: "CCTP route check" },
  "cctp-circle-verify": { path: "/v1/sce/radar/bridges/cctp/circle/verify", label: "Circle CCTP API verify" },
  "bridge-brief-preview": { path: "/v1/sce/radar/bridges/daily-brief/preview", label: "Bridge daily brief preview" },
  "public-alerts-preview": {
    path: "/v1/sce/radar/public-alerts/preview",
    label: "Unified public alert preview",
    method: "POST",
    body: { editorial: true },
  },
  "public-alerts-preview-fresh": {
    path: "/v1/sce/radar/public-alerts/preview/fresh",
    label: "Fresh unified public alert preview",
    method: "POST",
    body: { editorial: true },
  },
  "public-alerts-preview-approve": {
    path: "/v1/sce/radar/public-alerts/preview/approve",
    label: "Approve public preview",
    method: "POST",
  },
  "public-alerts-preview-revoke": {
    path: "/v1/sce/radar/public-alerts/preview/revoke",
    label: "Revoke public preview approval",
    method: "POST",
  },
  "public-alerts-preview-copy": {
    path: "/v1/sce/radar/public-alerts/preview/copy",
    label: "Copy public preview thread",
    method: "POST",
  },
  "public-alerts-preview-dry-run": {
    path: "/v1/sce/radar/public-alerts/preview/dry-run",
    label: "Dry run approved public preview thread",
    method: "POST",
  },
  "public-alerts-preview-send-approved": {
    path: "/v1/sce/radar/public-alerts/send-approved",
    label: "Send approved public preview thread",
    method: "POST",
  },
  "generate-brief": { path: "/v1/sce/radar/daily-briefs/generate?force_new_draft=true", label: "Daily brief" },
  "generate-broadcast-brief": { path: "/v1/sce/radar/daily-briefs/generate-broadcast?force_new_draft=true", label: "Broadcast brief" },
  "watchlist-sample-bridge": { path: "/v1/sce/radar/watchlists/dev/usdc-bridge", label: "USDC bridge watchlist seed" },
  "watchlist-sample-oracle": { path: "/v1/sce/radar/watchlists/dev/usdc-oracle", label: "USDC oracle watchlist seed" },
  "watchlist-match-all": { path: "/v1/sce/radar/watchlists/match-active-alerts", label: "Watchlist match-all" },
  "delivery-sample-discord": { path: "/v1/sce/radar/delivery-destinations/dev/discord", label: "Discord destination seed" },
  "delivery-sample-telegram": { path: "/v1/sce/radar/delivery-destinations/dev/telegram", label: "Telegram destination seed" },
  "delivery-sample-webhook": { path: "/v1/sce/radar/delivery-destinations/dev/webhook", label: "Webhook destination seed" },
  "deliver-pending": { path: "/v1/sce/radar/watchlist-matches/deliver-pending", label: "Deliver pending matches" },
  "bridge-drill-warning": { path: "/v1/sce/radar/bridges/drill", label: "Bridge Drill: Warning Delay", method: "POST", body: { scenario: "warning_delay" } },
  "bridge-drill-critical": { path: "/v1/sce/radar/bridges/drill", label: "Bridge Drill: Critical Delay", method: "POST", body: { scenario: "critical_delay" } },
  "bridge-drill-recovery": { path: "/v1/sce/radar/bridges/drill", label: "Bridge Drill: Recovery", method: "POST", body: { scenario: "recovery" } },
  "bridge-drill-healthy": { path: "/v1/sce/radar/bridges/drill", label: "Bridge Drill: Healthy", method: "POST", body: { scenario: "healthy" } },
} as const;

const DISTRIBUTION_ACTIONS = new Set(["publish-brief", "preview-twitter", "dry-run-twitter"]);
const CLIENT_PATCH_ACTIONS = new Set(["client-upgrade-pro", "client-downgrade-live", "client-suspend"]);

type StaticActionKey = keyof typeof STATIC_ACTIONS;

interface SaasMeResponse {
  permissions?: { canViewGlobalModules?: boolean };
}

interface BriefRecord {
  id: string;
  status: string;
}

interface RadarClientRecord {
  id: string;
}

interface OperatorAuthSuccess {
  adminHeaders: HeadersInit;
}

interface OperatorAuthFailure {
  response: NextResponse;
}

interface UpstreamErrorPayload {
  message: string;
  reason?: string;
  detail?: unknown;
}

interface ActionRequest {
  action?: string;
  payload?: Record<string, unknown>;
}

function extractErrorPayload(statusText: string, text: string): UpstreamErrorPayload {
  if (!text) {
    return { message: statusText || "Request failed" };
  }

  try {
    const body = JSON.parse(text) as { detail?: unknown; error?: unknown; reason?: unknown };
    if (body.detail && typeof body.detail === "object") {
      const detailObject = body.detail as Record<string, unknown>;
      return {
        message:
          typeof detailObject.detail === "string"
            ? detailObject.detail
            : typeof detailObject.message === "string"
              ? detailObject.message
              : typeof detailObject.reason === "string"
                ? detailObject.reason
                : text,
        reason: typeof detailObject.reason === "string" ? detailObject.reason : undefined,
        detail: detailObject,
      };
    }
    if (typeof body.detail === "string") {
      return { message: body.detail };
    }
    if (typeof body.error === "string") {
      return {
        message: body.error,
        reason: typeof body.reason === "string" ? body.reason : undefined,
      };
    }
  } catch {
    // Fall through to plain-text handling.
  }

  return { message: text };
}

function buildErrorResponse(label: string, status: number, error: UpstreamErrorPayload): NextResponse {
  return NextResponse.json(
    {
      error: `${label} failed [${status}]: ${error.message}`,
      reason: error.reason,
      detail: error.detail,
    },
    { status },
  );
}

async function proxyRequest(path: string, init: RequestInit, label: string): Promise<NextResponse> {
  const upstreamRes = await fetch(`${API_BASE}${path}`, {
    ...init,
    cache: "no-store",
  });
  const text = await upstreamRes.text();
  if (!upstreamRes.ok) {
    return buildErrorResponse(label, upstreamRes.status, extractErrorPayload(upstreamRes.statusText, text));
  }
  return new NextResponse(text, {
    status: upstreamRes.status,
    headers: { "Content-Type": upstreamRes.headers.get("content-type") ?? "application/json" },
  });
}

function getAdminHeaders(): HeadersInit {
  const adminKey = (process.env.SCE_ADMIN_API_KEY ?? process.env.SCE_DASHBOARD_ADMIN_API_KEY ?? "").trim();
  return adminKey ? { "X-SCE-Admin-Key": adminKey } : {};
}

async function authorizeOperator(req: NextRequest): Promise<OperatorAuthSuccess | OperatorAuthFailure> {
  const sessionToken = req.headers.get("x-sce-session");
  if (!sessionToken) {
    return {
      response: NextResponse.json({ error: "Authentication required." }, { status: 401 }),
    };
  }

  const meRes = await fetch(`${API_BASE}/saas/me`, {
    headers: { "X-SCE-Session": sessionToken },
    cache: "no-store",
  });
  if (!meRes.ok) {
    const text = await meRes.text().catch(() => "");
    return {
      response: NextResponse.json(
        { error: extractErrorPayload(meRes.statusText, text).message },
        { status: meRes.status },
      ),
    };
  }

  const me = (await meRes.json()) as SaasMeResponse;
  if (!me.permissions?.canViewGlobalModules) {
    return {
      response: NextResponse.json(
        { error: "Radar operator console requires global admin or operator access." },
        { status: 403 },
      ),
    };
  }

  return { adminHeaders: getAdminHeaders() };
}

async function fetchLatestBrief(adminHeaders: HeadersInit): Promise<BriefRecord | null | "error"> {
  const res = await fetch(`${API_BASE}/v1/sce/radar/daily-briefs/latest`, {
    headers: adminHeaders,
    cache: "no-store",
  });
  if (res.status === 404) return null;
  if (!res.ok) return "error";
  return (await res.json()) as BriefRecord;
}

async function fetchSampleClient(adminHeaders: HeadersInit): Promise<RadarClientRecord | null | "error"> {
  const res = await fetch(`${API_BASE}/v1/sce/radar/clients?limit=100`, {
    headers: adminHeaders,
    cache: "no-store",
  });
  if (!res.ok) return "error";
  const clients = (await res.json()) as RadarClientRecord[];
  return clients.find((client) => client.id === "dev-client") ?? clients[0] ?? null;
}

async function fetchClientWatchlists(
  clientId: string,
  adminHeaders: HeadersInit,
): Promise<RadarWatchlist[] | "error"> {
  const url = new URL(`${API_BASE}/v1/sce/radar/watchlists`);
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("limit", "200");
  const res = await fetch(url.toString(), {
    headers: adminHeaders,
    cache: "no-store",
  });
  if (!res.ok) return "error";
  return (await res.json()) as RadarWatchlist[];
}

async function fetchPendingMatches(
  clientId: string | null,
  watchlistId: string | null,
  adminHeaders: HeadersInit,
): Promise<RadarWatchlistMatch[] | "error"> {
  const url = new URL(`${API_BASE}/v1/sce/radar/watchlist-matches`);
  if (clientId) url.searchParams.set("client_id", clientId);
  if (watchlistId) url.searchParams.set("watchlist_id", watchlistId);
  url.searchParams.set("status", "pending_delivery");
  url.searchParams.set("limit", "200");
  const res = await fetch(url.toString(), {
    headers: adminHeaders,
    cache: "no-store",
  });
  if (!res.ok) return "error";
  return (await res.json()) as RadarWatchlistMatch[];
}

function parseJsonOrNull<T>(text: string): T | null {
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

async function runPreviewTwitterPipeline(adminHeaders: HeadersInit): Promise<NextResponse> {
  const post: RequestInit = { method: "POST", headers: adminHeaders, cache: "no-store" };

  await fetch(`${API_BASE}/v1/sce/radar/monitors/oracles/chainlink/run`, post);
  await fetch(`${API_BASE}/v1/sce/radar/monitors/oracles/reference-deviation/run`, post);
  await fetch(`${API_BASE}/v1/sce/radar/signals/quality/recompute?monitor_type=oracle`, post);

  const briefGenRes = await fetch(
    `${API_BASE}/v1/sce/radar/daily-briefs/generate-broadcast?force_new_draft=true`,
    post,
  );
  const briefGenText = await briefGenRes.text();
  if (!briefGenRes.ok) {
    return buildErrorResponse(
      "Generate broadcast brief",
      briefGenRes.status,
      extractErrorPayload(briefGenRes.statusText, briefGenText),
    );
  }
  const briefGen = parseJsonOrNull<{ dailyBriefId?: string; daily_brief_id?: string }>(briefGenText);
  const draftId = briefGen?.dailyBriefId ?? briefGen?.daily_brief_id;
  if (!draftId) {
    return NextResponse.json(
      { error: "Broadcast brief generated but returned no brief ID." },
      { status: 502 },
    );
  }

  const publishRes = await fetch(`${API_BASE}/v1/sce/radar/daily-briefs/${draftId}/publish`, post);
  if (!publishRes.ok) {
    const text = await publishRes.text();
    return buildErrorResponse(
      "Publish brief",
      publishRes.status,
      extractErrorPayload(publishRes.statusText, text),
    );
  }

  const previewRes = await fetch(
    `${API_BASE}/v1/sce/radar/daily-briefs/${draftId}/social/twitter/preview`,
    post,
  );
  const previewText = await previewRes.text();
  if (!previewRes.ok) {
    return buildErrorResponse(
      "Twitter preview",
      previewRes.status,
      extractErrorPayload(previewRes.statusText, previewText),
    );
  }
  return new NextResponse(previewText, {
    status: previewRes.status,
    headers: { "Content-Type": previewRes.headers.get("content-type") ?? "application/json" },
  });
}

async function handleDistributionAction(
  action: string,
  adminHeaders: HeadersInit,
): Promise<NextResponse> {
  if (action === "publish-brief") {
    const brief = await fetchLatestBrief(adminHeaders);
    if (brief === null) {
      return NextResponse.json(
        { error: "Generate a daily brief before publishing." },
        { status: 409 },
      );
    }
    if (brief === "error") {
      return NextResponse.json({ error: "Could not retrieve latest daily brief." }, { status: 502 });
    }
    if (brief.status !== "draft") {
      return NextResponse.json(
        { error: `No draft brief to publish. Latest brief is already "${brief.status}". Generate a new draft first.` },
        { status: 409 },
      );
    }
    return proxyRequest(
      `/v1/sce/radar/daily-briefs/${brief.id}/publish`,
      { method: "POST", headers: adminHeaders },
      "Publish brief",
    );
  }

  if (action === "preview-twitter") {
    return runPreviewTwitterPipeline(adminHeaders);
  }

  if (action === "dry-run-twitter") {
    const brief = await fetchLatestBrief(adminHeaders);
    if (brief === null || brief === "error" || brief.status !== "published") {
      return NextResponse.json(
        { error: "Publish a daily brief before running a Twitter dry run." },
        { status: 409 },
      );
    }
    return proxyRequest(
      `/v1/sce/radar/daily-briefs/${brief.id}/social/twitter/publish`,
      { method: "POST", headers: adminHeaders },
      "Twitter dry run",
    );
  }

  return NextResponse.json({ error: "Unknown distribution action." }, { status: 400 });
}

async function handleClientPatchAction(
  action: string,
  adminHeaders: HeadersInit,
): Promise<NextResponse> {
  const client = await fetchSampleClient(adminHeaders);
  if (client === "error") {
    return NextResponse.json({ error: "Could not retrieve Radar clients." }, { status: 502 });
  }
  if (client === null) {
    return NextResponse.json({ error: "Create a sample Radar client first." }, { status: 409 });
  }

  const patchBody =
    action === "client-upgrade-pro"
      ? { plan: "radar_pro" }
      : action === "client-downgrade-live"
        ? { plan: "radar_live" }
        : { status: "suspended" };

  return proxyRequest(
    `/v1/sce/radar/clients/${client.id}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...adminHeaders,
      },
      body: JSON.stringify(patchBody),
    },
    "Radar client update",
  );
}

async function handleCreateClientAction(
  payload: RadarClientCreateInput,
  adminHeaders: HeadersInit,
): Promise<NextResponse> {
  return proxyRequest(
    "/v1/sce/radar/clients",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...adminHeaders,
      },
      body: JSON.stringify(payload),
    },
    "Create Radar client",
  );
}

async function handleUpdateClientAction(
  payload: Record<string, unknown> | undefined,
  adminHeaders: HeadersInit,
): Promise<NextResponse> {
  const clientId = typeof payload?.clientId === "string" ? payload.clientId : "";
  if (!clientId) {
    return NextResponse.json({ error: "clientId is required." }, { status: 400 });
  }

  const patchPayload = {
    name: typeof payload?.name === "string" ? payload.name : undefined,
    status: typeof payload?.status === "string" ? payload.status : undefined,
    plan: typeof payload?.plan === "string" ? payload.plan : undefined,
    primaryContactEmail:
      typeof payload?.primaryContactEmail === "string" || payload?.primaryContactEmail === null
        ? (payload.primaryContactEmail as RadarClientUpdateInput["primaryContactEmail"])
        : undefined,
    telegramHandle:
      typeof payload?.telegramHandle === "string" || payload?.telegramHandle === null
        ? (payload.telegramHandle as RadarClientUpdateInput["telegramHandle"])
        : undefined,
    discordContact:
      typeof payload?.discordContact === "string" || payload?.discordContact === null
        ? (payload.discordContact as RadarClientUpdateInput["discordContact"])
        : undefined,
    notes:
      typeof payload?.notes === "string" || payload?.notes === null
        ? (payload.notes as RadarClientUpdateInput["notes"])
        : undefined,
    billingProvider:
      typeof payload?.billingProvider === "string" || payload?.billingProvider === null
        ? (payload.billingProvider as RadarClientUpdateInput["billingProvider"])
        : undefined,
  };

  return proxyRequest(
    `/v1/sce/radar/clients/${clientId}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...adminHeaders,
      },
      body: JSON.stringify(patchPayload),
    },
    "Update Radar client",
  );
}

async function handleCreateWatchlistAction(
  payload: RadarWatchlistCreateInput,
  adminHeaders: HeadersInit,
): Promise<NextResponse> {
  return proxyRequest(
    "/v1/sce/radar/watchlists",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...adminHeaders,
      },
      body: JSON.stringify(payload),
    },
    "Create Radar watchlist",
  );
}

async function handleCreateDestinationAction(
  payload: RadarDeliveryDestinationCreateInput,
  adminHeaders: HeadersInit,
): Promise<NextResponse> {
  return proxyRequest(
    "/v1/sce/radar/delivery-destinations",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...adminHeaders,
      },
      body: JSON.stringify(payload),
    },
    "Create Radar destination",
  );
}

async function handleMatchActiveAlertsAction(
  payload: Record<string, unknown> | undefined,
  adminHeaders: HeadersInit,
): Promise<NextResponse> {
  const clientId = typeof payload?.clientId === "string" ? payload.clientId : null;
  const watchlistId = typeof payload?.watchlistId === "string" ? payload.watchlistId : null;

  if (watchlistId) {
    return proxyRequest(
      `/v1/sce/radar/watchlists/${watchlistId}/match-active-alerts`,
      { method: "POST", headers: adminHeaders },
      "Match active alerts",
    );
  }

  if (!clientId) {
    return NextResponse.json(
      { error: "Select a client or watchlist before matching active alerts." },
      { status: 400 },
    );
  }

  const watchlists = await fetchClientWatchlists(clientId, adminHeaders);
  if (watchlists === "error") {
    return NextResponse.json({ error: "Could not retrieve client watchlists." }, { status: 502 });
  }

  const enabledWatchlists = watchlists.filter((watchlist) => watchlist.enabled);
  if (enabledWatchlists.length === 0) {
    return NextResponse.json(
      { error: "No enabled watchlists found for the selected client." },
      { status: 409 },
    );
  }

  const aggregate: WatchlistMatchRunResult = {
    watchlistsChecked: 0,
    alertsChecked: 0,
    matchesCreated: 0,
    matchesDeduped: 0,
    matchesSkipped: 0,
    errors: [],
  };

  for (const watchlist of enabledWatchlists) {
    const res = await fetch(`${API_BASE}/v1/sce/radar/watchlists/${watchlist.id}/match-active-alerts`, {
      method: "POST",
      headers: adminHeaders,
      cache: "no-store",
    });
    const text = await res.text();
    if (!res.ok) {
      const error = extractErrorPayload(res.statusText, text);
      aggregate.errors.push(`${watchlist.name}: ${error.message}`);
      continue;
    }

    const result = parseJsonOrNull<WatchlistMatchRunResult>(text);
    if (!result) {
      aggregate.errors.push(`${watchlist.name}: invalid matching response`);
      continue;
    }

    aggregate.watchlistsChecked += result.watchlistsChecked;
    aggregate.alertsChecked += result.alertsChecked;
    aggregate.matchesCreated += result.matchesCreated;
    aggregate.matchesDeduped += result.matchesDeduped;
    aggregate.matchesSkipped += result.matchesSkipped ?? 0;
    aggregate.errors.push(...result.errors);
  }

  return NextResponse.json(aggregate);
}

async function handleDeliverPendingMatchesAction(
  payload: Record<string, unknown> | undefined,
  adminHeaders: HeadersInit,
): Promise<NextResponse> {
  const clientId = typeof payload?.clientId === "string" ? payload.clientId : null;
  const watchlistId = typeof payload?.watchlistId === "string" ? payload.watchlistId : null;

  if (!clientId && !watchlistId) {
    return proxyRequest(
      "/v1/sce/radar/watchlist-matches/deliver-pending",
      { method: "POST", headers: adminHeaders },
      "Deliver pending matches",
    );
  }

  const matches = await fetchPendingMatches(clientId, watchlistId, adminHeaders);
  if (matches === "error") {
    return NextResponse.json({ error: "Could not retrieve pending watchlist matches." }, { status: 502 });
  }

  const aggregate: LiveDeliveryRunResult = {
    matchesChecked: 0,
    destinationsChecked: 0,
    deliveriesCreated: 0,
    deliveriesSent: 0,
    deliveriesSkipped: 0,
    deliveriesFailed: 0,
    errors: [],
  };

  for (const match of matches) {
    const res = await fetch(`${API_BASE}/v1/sce/radar/watchlist-matches/${match.id}/deliver`, {
      method: "POST",
      headers: adminHeaders,
      cache: "no-store",
    });
    const text = await res.text();
    if (!res.ok) {
      const error = extractErrorPayload(res.statusText, text);
      aggregate.errors.push(`match=${match.id}: ${error.message}`);
      continue;
    }

    const result = parseJsonOrNull<LiveDeliveryRunResult>(text);
    if (!result) {
      aggregate.errors.push(`match=${match.id}: invalid delivery response`);
      continue;
    }

    aggregate.matchesChecked += result.matchesChecked;
    aggregate.destinationsChecked += result.destinationsChecked;
    aggregate.deliveriesCreated += result.deliveriesCreated;
    aggregate.deliveriesSent += result.deliveriesSent;
    aggregate.deliveriesSkipped += result.deliveriesSkipped;
    aggregate.deliveriesFailed += result.deliveriesFailed;
    aggregate.errors.push(...result.errors);
  }

  return NextResponse.json(aggregate);
}

export async function GET(req: NextRequest) {
  const auth = await authorizeOperator(req);
  if ("response" in auth) {
    return auth.response;
  }

  const kind = req.nextUrl.searchParams.get("kind");
  const clientId = req.nextUrl.searchParams.get("clientId");

  if (kind === "client-entitlements") {
    if (!clientId) {
      return NextResponse.json({ error: "clientId is required." }, { status: 400 });
    }
    return proxyRequest(
      `/v1/sce/radar/clients/${clientId}/entitlements`,
      { method: "GET", headers: auth.adminHeaders },
      "Radar entitlement summary",
    );
  }

  return NextResponse.json({ error: `Unknown request kind: ${kind ?? "(missing)"}` }, { status: 400 });
}

export async function POST(req: NextRequest) {
  const auth = await authorizeOperator(req);
  if ("response" in auth) {
    return auth.response;
  }

  let body: ActionRequest;
  try {
    body = (await req.json()) as ActionRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const actionKey = body.action ?? "";

  if (DISTRIBUTION_ACTIONS.has(actionKey)) {
    return handleDistributionAction(actionKey, auth.adminHeaders);
  }

  if (CLIENT_PATCH_ACTIONS.has(actionKey)) {
    return handleClientPatchAction(actionKey, auth.adminHeaders);
  }

  if (actionKey === "create-client") {
    return handleCreateClientAction(body.payload as unknown as RadarClientCreateInput, auth.adminHeaders);
  }

  if (actionKey === "create-watchlist") {
    return handleCreateWatchlistAction(body.payload as unknown as RadarWatchlistCreateInput, auth.adminHeaders);
  }

  if (actionKey === "update-client") {
    return handleUpdateClientAction(body.payload, auth.adminHeaders);
  }

  if (actionKey === "create-destination") {
    return handleCreateDestinationAction(body.payload as unknown as RadarDeliveryDestinationCreateInput, auth.adminHeaders);
  }

  if (actionKey === "match-selected-watchlists") {
    return handleMatchActiveAlertsAction(body.payload, auth.adminHeaders);
  }

  if (actionKey === "deliver-selected-pending") {
    return handleDeliverPendingMatchesAction(body.payload, auth.adminHeaders);
  }

  if (actionKey === "oracle-diagnostics") {
    return proxyRequest(
      "/v1/sce/radar/live-objects/oracles/activation-diagnostics",
      { method: "GET", headers: auth.adminHeaders },
      "Oracle activation diagnostics",
    );
  }

  if (actionKey === "bridge-brief-preview") {
    return proxyRequest(
      "/v1/sce/radar/bridges/daily-brief/preview",
      { method: "GET", headers: auth.adminHeaders },
      "Bridge daily brief preview",
    );
  }

  if (actionKey === "bridge-activation-matrix") {
    return proxyRequest(
      "/v1/sce/radar/bridges/activation-matrix",
      { method: "GET", headers: auth.adminHeaders },
      "Bridge activation matrix",
    );
  }

  if (actionKey === "radar-readiness") {
    return proxyRequest(
      "/v1/sce/radar/readiness",
      { method: "GET", headers: auth.adminHeaders },
      "Radar readiness summary",
    );
  }

  if (actionKey === "lp-coverage") {
    return proxyRequest(
      "/v1/sce/radar/lp/coverage",
      { method: "GET", headers: auth.adminHeaders },
      "LP Radar coverage registry",
    );
  }

  if (actionKey === "lp-uniswap-v3-smoke") {
    return proxyRequest(
      "/v1/sce/radar/lp/uniswap-v3/smoke",
      { method: "POST", headers: auth.adminHeaders },
      "Uniswap v3 LP smoke check",
    );
  }

  if (actionKey === "lp-uniswap-v3-monitor") {
    return proxyRequest(
      "/v1/sce/radar/lp/uniswap-v3/monitor",
      { method: "POST", headers: auth.adminHeaders },
      "Uniswap v3 LP monitor",
    );
  }

  if (actionKey === "lp-aerodrome-smoke") {
    return proxyRequest(
      "/v1/sce/radar/lp/aerodrome/smoke",
      { method: "POST", headers: auth.adminHeaders },
      "Aerodrome LP smoke",
    );
  }

  if (actionKey === "lp-smoke") {
    return proxyRequest(
      "/v1/sce/radar/lp/smoke",
      { method: "POST", headers: auth.adminHeaders },
      "LP smoke (all providers)",
    );
  }

  if (actionKey === "lp-fresh-preview") {
    return proxyRequest(
      "/v1/sce/radar/lp/fresh-preview",
      { method: "POST", headers: auth.adminHeaders },
      "LP fresh intelligence preview",
    );
  }

  if (!(actionKey in STATIC_ACTIONS)) {
    return NextResponse.json(
      { error: `Unknown action: ${actionKey || "(missing)"}` },
      { status: 400 },
    );
  }

  const staticAction = STATIC_ACTIONS[actionKey as StaticActionKey] as {
    path: string;
    label: string;
    method?: string;
    body?: Record<string, unknown>;
  };
  const { path, label } = staticAction;
  const method = staticAction.method ?? "POST";
  const mergedBody = body.payload && method !== "GET"
    ? { ...(staticAction.body ?? {}), ...body.payload }
    : staticAction.body;
  const init: RequestInit = mergedBody
    ? {
        method,
        headers: { "Content-Type": "application/json", ...auth.adminHeaders },
        body: JSON.stringify(mergedBody),
      }
    : { method, headers: auth.adminHeaders };
  return proxyRequest(path, init, label);
}
