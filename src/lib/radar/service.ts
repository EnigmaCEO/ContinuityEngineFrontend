import type {
  BridgeCoverageResponse,
  OracleActivationDiagnosticsResult,
  OracleCoverageItem,
  OraclePilotDrillReport,
  OracleReadinessReport,
  OracleCoverageSummary,
  RadarAlert,
  RadarClient,
  RadarClientEntitlementSummary,
  RadarDailyBrief,
  RadarDailyBriefRecord,
  RadarDeliveryDestination,
  RadarLiveDelivery,
  RadarLiveObjectsStatus,
  RadarLiveDeliveryStatus,
  RadarRuntimeStatus,
  RadarSignalQualitySnapshot,
  RadarSocialDeliveryRecord,
  RadarWatchlist,
  RadarWatchlistMatch,
} from "@/lib/radar/types";

const API_BASE = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchJsonWithRetry<T>(
  input: string,
  init: RequestInit,
  errorLabel: string,
  options: {
    retries?: number;
    allow404?: boolean;
  } = {},
): Promise<T | null> {
  const retries = options.retries ?? 2;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await fetch(input, {
        ...init,
        cache: "no-store",
      });

      if (options.allow404 && response.status === 404) {
        return null;
      }

      if (response.ok) {
        return (await response.json()) as T;
      }

      if (response.status >= 500 && attempt < retries) {
        await delay(150 * (attempt + 1));
        continue;
      }

      throw new Error(`${errorLabel}: ${response.status}`);
    } catch (error) {
      if (attempt < retries) {
        await delay(150 * (attempt + 1));
        continue;
      }
      throw error;
    }
  }

  throw new Error(`${errorLabel}: exhausted retries`);
}

type FetchRadarAlertsOptions = {
  status?: string;
  severity?: string;
  monitorType?: string;
  visibility?: string;
  limit?: number;
};

export async function fetchRadarAlerts(options: FetchRadarAlertsOptions = {}): Promise<RadarAlert[]> {
  const url = new URL(`${API_BASE}/v1/sce/radar/alerts`);
  if (options.status) url.searchParams.set("status", options.status);
  if (options.severity) url.searchParams.set("severity", options.severity);
  if (options.monitorType) url.searchParams.set("monitor_type", options.monitorType);
  if (options.visibility) url.searchParams.set("visibility", options.visibility);
  if (options.limit) url.searchParams.set("limit", String(options.limit));

  const headers: HeadersInit = {};
  if (process.env.SCE_ADMIN_API_KEY) {
    headers["X-SCE-Admin-Key"] = process.env.SCE_ADMIN_API_KEY;
  }

  const response = await fetch(url.toString(), {
    cache: "no-store",
    headers,
  });
  if (!response.ok) {
    throw new Error(`Radar alerts fetch failed: ${response.status}`);
  }
  return response.json() as Promise<RadarAlert[]>;
}

export async function fetchRadarRuntimeStatus(): Promise<RadarRuntimeStatus> {
  const response = await fetch(`${API_BASE}/v1/sce/radar/runtime/status`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Radar runtime status fetch failed: ${response.status}`);
  }
  return response.json() as Promise<RadarRuntimeStatus>;
}

export async function fetchRadarLiveObjectsStatus(): Promise<RadarLiveObjectsStatus> {
  const response = await fetch(`${API_BASE}/v1/sce/radar/live-objects/status`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Radar live objects status fetch failed: ${response.status}`);
  }
  return response.json() as Promise<RadarLiveObjectsStatus>;
}

export async function fetchRadarOracleActivationDiagnostics(adminKey = ""): Promise<OracleActivationDiagnosticsResult> {
  const headers: HeadersInit = adminKey ? { "X-SCE-Admin-Key": adminKey } : {};
  return (await fetchJsonWithRetry<OracleActivationDiagnosticsResult>(
    `${API_BASE}/v1/sce/radar/live-objects/oracles/activation-diagnostics`,
    { headers },
    "Oracle activation diagnostics fetch failed",
  )) as OracleActivationDiagnosticsResult;
}

export async function fetchRadarOracleCoverage(adminKey = ""): Promise<OracleCoverageItem[]> {
  const headers: HeadersInit = adminKey ? { "X-SCE-Admin-Key": adminKey } : {};
  return (await fetchJsonWithRetry<OracleCoverageItem[]>(
    `${API_BASE}/v1/sce/radar/oracles/coverage`,
    { headers },
    "Oracle coverage fetch failed",
  )) as OracleCoverageItem[];
}

export async function fetchRadarOracleCoverageSummary(adminKey = ""): Promise<OracleCoverageSummary> {
  const headers: HeadersInit = adminKey ? { "X-SCE-Admin-Key": adminKey } : {};
  return (await fetchJsonWithRetry<OracleCoverageSummary>(
    `${API_BASE}/v1/sce/radar/oracles/coverage/summary`,
    { headers },
    "Oracle coverage summary fetch failed",
  )) as OracleCoverageSummary;
}

export async function fetchRadarBridgeCoverage(adminKey = ""): Promise<BridgeCoverageResponse> {
  const headers: HeadersInit = adminKey ? { "X-SCE-Admin-Key": adminKey } : {};
  return (await fetchJsonWithRetry<BridgeCoverageResponse>(
    `${API_BASE}/v1/sce/radar/bridges/coverage`,
    { headers },
    "Bridge coverage fetch failed",
  )) as BridgeCoverageResponse;
}

export async function fetchRadarOracleReadiness(adminKey = ""): Promise<OracleReadinessReport> {
  const headers: HeadersInit = adminKey ? { "X-SCE-Admin-Key": adminKey } : {};
  return (await fetchJsonWithRetry<OracleReadinessReport>(
    `${API_BASE}/v1/sce/radar/oracles/readiness`,
    { headers },
    "Oracle readiness fetch failed",
  )) as OracleReadinessReport;
}

export async function fetchRadarLatestOraclePilotDrill(adminKey = ""): Promise<OraclePilotDrillReport | null> {
  const headers: HeadersInit = adminKey ? { "X-SCE-Admin-Key": adminKey } : {};
  return await fetchJsonWithRetry<OraclePilotDrillReport>(
    `${API_BASE}/v1/sce/radar/oracles/pilot-drill/latest`,
    { headers },
    "Oracle pilot drill fetch failed",
    { allow404: true },
  );
}

export async function fetchRadarSignalQuality(adminKey = ""): Promise<RadarSignalQualitySnapshot> {
  const headers: HeadersInit = adminKey ? { "X-SCE-Admin-Key": adminKey } : {};
  const url = new URL(`${API_BASE}/v1/sce/radar/signals/quality`);
  url.searchParams.set("monitor_type", "oracle");
  return (await fetchJsonWithRetry<RadarSignalQualitySnapshot>(
    url.toString(),
    { headers },
    "Radar signal quality fetch failed",
  )) as RadarSignalQualitySnapshot;
}

export async function fetchRadarBridgeSignalQuality(adminKey = ""): Promise<RadarSignalQualitySnapshot> {
  const headers: HeadersInit = adminKey ? { "X-SCE-Admin-Key": adminKey } : {};
  const url = new URL(`${API_BASE}/v1/sce/radar/signals/quality`);
  url.searchParams.set("monitor_type", "bridge");
  return (await fetchJsonWithRetry<RadarSignalQualitySnapshot>(
    url.toString(),
    { headers },
    "Bridge signal quality fetch failed",
  )) as RadarSignalQualitySnapshot;
}

export async function fetchRadarDailyBrief(hours = 24): Promise<RadarDailyBrief> {
  const url = new URL(`${API_BASE}/v1/sce/radar/daily-brief`);
  url.searchParams.set("hours", String(hours));

  const response = await fetch(url.toString(), { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Radar daily brief fetch failed: ${response.status}`);
  }
  return response.json() as Promise<RadarDailyBrief>;
}

export async function fetchLatestRadarDailyBriefRecord(): Promise<RadarDailyBriefRecord | null> {
  const response = await fetch(`${API_BASE}/v1/sce/radar/daily-briefs/latest`, { cache: "no-store" });
  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw new Error(`Radar latest daily brief fetch failed: ${response.status}`);
  }
  return response.json() as Promise<RadarDailyBriefRecord>;
}

export async function fetchRadarClients(): Promise<RadarClient[]> {
  const headers: HeadersInit = {};
  if (process.env.SCE_ADMIN_API_KEY) {
    headers["X-SCE-Admin-Key"] = process.env.SCE_ADMIN_API_KEY;
  }
  const response = await fetch(`${API_BASE}/v1/sce/radar/clients?limit=100`, {
    cache: "no-store",
    headers,
  });
  if (!response.ok) {
    throw new Error(`Radar clients fetch failed: ${response.status}`);
  }
  return response.json() as Promise<RadarClient[]>;
}

export async function fetchRadarClientEntitlementSummary(
  clientId: string,
): Promise<RadarClientEntitlementSummary> {
  const headers: HeadersInit = {};
  if (process.env.SCE_ADMIN_API_KEY) {
    headers["X-SCE-Admin-Key"] = process.env.SCE_ADMIN_API_KEY;
  }
  const response = await fetch(`${API_BASE}/v1/sce/radar/clients/${clientId}/entitlements`, {
    cache: "no-store",
    headers,
  });
  if (!response.ok) {
    throw new Error(`Radar entitlement summary fetch failed: ${response.status}`);
  }
  return response.json() as Promise<RadarClientEntitlementSummary>;
}

export async function fetchRadarWatchlists(): Promise<RadarWatchlist[]> {
  const headers: HeadersInit = {};
  if (process.env.SCE_ADMIN_API_KEY) {
    headers["X-SCE-Admin-Key"] = process.env.SCE_ADMIN_API_KEY;
  }
  const response = await fetch(`${API_BASE}/v1/sce/radar/watchlists?limit=100`, {
    cache: "no-store",
    headers,
  });
  if (!response.ok) {
    throw new Error(`Radar watchlists fetch failed: ${response.status}`);
  }
  return response.json() as Promise<RadarWatchlist[]>;
}

export async function fetchRadarWatchlistMatches(options: {
  status?: string;
  watchlistId?: string;
  limit?: number;
} = {}): Promise<RadarWatchlistMatch[]> {
  const headers: HeadersInit = {};
  if (process.env.SCE_ADMIN_API_KEY) {
    headers["X-SCE-Admin-Key"] = process.env.SCE_ADMIN_API_KEY;
  }
  const url = new URL(`${API_BASE}/v1/sce/radar/watchlist-matches`);
  if (options.status) url.searchParams.set("status", options.status);
  if (options.watchlistId) url.searchParams.set("watchlist_id", options.watchlistId);
  if (options.limit) url.searchParams.set("limit", String(options.limit));
  const response = await fetch(url.toString(), { cache: "no-store", headers });
  if (!response.ok) {
    throw new Error(`Radar watchlist matches fetch failed: ${response.status}`);
  }
  return response.json() as Promise<RadarWatchlistMatch[]>;
}

export async function fetchRadarDeliveryDestinations(): Promise<RadarDeliveryDestination[]> {
  const headers: HeadersInit = {};
  if (process.env.SCE_ADMIN_API_KEY) {
    headers["X-SCE-Admin-Key"] = process.env.SCE_ADMIN_API_KEY;
  }
  const response = await fetch(`${API_BASE}/v1/sce/radar/delivery-destinations?limit=100`, {
    cache: "no-store",
    headers,
  });
  if (!response.ok) {
    throw new Error(`Radar delivery destinations fetch failed: ${response.status}`);
  }
  return response.json() as Promise<RadarDeliveryDestination[]>;
}

export async function fetchRadarLiveDeliveries(options: {
  status?: RadarLiveDeliveryStatus;
  matchId?: string;
  limit?: number;
} = {}): Promise<RadarLiveDelivery[]> {
  const headers: HeadersInit = {};
  if (process.env.SCE_ADMIN_API_KEY) {
    headers["X-SCE-Admin-Key"] = process.env.SCE_ADMIN_API_KEY;
  }
  const url = new URL(`${API_BASE}/v1/sce/radar/live-deliveries`);
  if (options.status) url.searchParams.set("status", options.status);
  if (options.matchId) url.searchParams.set("match_id", options.matchId);
  if (options.limit) url.searchParams.set("limit", String(options.limit));
  const response = await fetch(url.toString(), { cache: "no-store", headers });
  if (!response.ok) {
    throw new Error(`Radar live deliveries fetch failed: ${response.status}`);
  }
  return response.json() as Promise<RadarLiveDelivery[]>;
}

export async function fetchRadarDailyBriefSocialDeliveries(
  briefId: string,
): Promise<RadarSocialDeliveryRecord[]> {
  const headers: HeadersInit = {};
  if (process.env.SCE_ADMIN_API_KEY) {
    headers["X-SCE-Admin-Key"] = process.env.SCE_ADMIN_API_KEY;
  }

  const response = await fetch(`${API_BASE}/v1/sce/radar/daily-briefs/${briefId}/social/deliveries`, {
    cache: "no-store",
    headers,
  });
  if (response.status === 404) {
    return [];
  }
  if (!response.ok) {
    throw new Error(`Radar daily brief social delivery fetch failed: ${response.status}`);
  }
  return response.json() as Promise<RadarSocialDeliveryRecord[]>;
}
