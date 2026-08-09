export type OperationalState =
  | "operational"
  | "degraded"
  | "partial_outage"
  | "major_outage"
  | "unknown";

export type ComponentState = "operational" | "degraded" | "unavailable" | "unknown";

export type PublicOperationsStatus = {
  overall: OperationalState;
  generatedAt: string;
  lastSuccessfulRefreshAt?: string;
  stale: boolean;
  cacheAgeSeconds?: number;
  components: Array<{
    id: string;
    label: string;
    state: ComponentState;
    checkedAt: string;
    latencyMs?: number;
    message?: string;
  }>;
  errorCode?: string;
};

const OVERALL_STATES = new Set<OperationalState>([
  "operational",
  "degraded",
  "partial_outage",
  "major_outage",
  "unknown",
]);
const COMPONENT_STATES = new Set<ComponentState>([
  "operational",
  "degraded",
  "unavailable",
  "unknown",
]);
const MAX_STALE_DISPLAY_MS = 5 * 60 * 1000;
const LIVE_FRESHNESS_MS = 60 * 1000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isDate(value: unknown): value is string {
  return typeof value === "string" && Number.isFinite(Date.parse(value));
}

export function parseOperationsStatus(value: unknown, now = new Date()): PublicOperationsStatus | null {
  if (!isRecord(value) || !OVERALL_STATES.has(value.overall as OperationalState)) return null;
  if (!isDate(value.generatedAt) || typeof value.stale !== "boolean" || !Array.isArray(value.components)) return null;

  const components: PublicOperationsStatus["components"] = [];
  for (const candidate of value.components) {
    if (
      !isRecord(candidate) ||
      typeof candidate.id !== "string" ||
      typeof candidate.label !== "string" ||
      !COMPONENT_STATES.has(candidate.state as ComponentState) ||
      !isDate(candidate.checkedAt)
    ) {
      return null;
    }
    components.push({
      id: candidate.id,
      label: candidate.label,
      state: candidate.state as ComponentState,
      checkedAt: candidate.checkedAt,
      ...(typeof candidate.latencyMs === "number" && Number.isFinite(candidate.latencyMs)
        ? { latencyMs: Math.max(0, Math.round(candidate.latencyMs)) }
        : {}),
      ...(typeof candidate.message === "string" ? { message: candidate.message } : {}),
    });
  }

  if (components.length === 0 || new Set(components.map((component) => component.id)).size !== components.length) {
    return null;
  }

  const generatedAge = now.getTime() - Date.parse(value.generatedAt);
  if (!Number.isFinite(generatedAge) || generatedAge < -30_000) return null;

  let overall = value.overall as OperationalState;
  let stale = value.stale;
  if (generatedAge > LIVE_FRESHNESS_MS) stale = true;
  if (stale && overall === "operational") overall = "degraded";
  if (generatedAge > MAX_STALE_DISPLAY_MS) overall = "unknown";

  return {
    overall,
    generatedAt: value.generatedAt,
    ...(isDate(value.lastSuccessfulRefreshAt)
      ? { lastSuccessfulRefreshAt: value.lastSuccessfulRefreshAt }
      : {}),
    stale,
    ...(typeof value.cacheAgeSeconds === "number" && Number.isFinite(value.cacheAgeSeconds)
      ? { cacheAgeSeconds: Math.max(0, Math.round(value.cacheAgeSeconds)) }
      : {}),
    components,
    ...(typeof value.errorCode === "string" ? { errorCode: value.errorCode } : {}),
  };
}

export function unknownOperationsStatus(now = new Date()): PublicOperationsStatus {
  return {
    overall: "unknown",
    generatedAt: now.toISOString(),
    stale: false,
    components: [],
    errorCode: "STATUS_UNAVAILABLE_RETRY",
  };
}

function statusApiUrl(): string {
  const configured = process.env.SCE_SITE_ORIGIN?.trim().replace(/\/$/, "");
  if (configured) return `${configured}/api/backend/operations/status`;
  if (process.env.NODE_ENV === "production") {
    return "https://sce.sagitta.systems/api/backend/operations/status";
  }
  return `http://127.0.0.1:${process.env.PORT ?? "3000"}/api/backend/operations/status`;
}

export async function fetchOperationsStatus(): Promise<PublicOperationsStatus> {
  try {
    const response = await fetch(statusApiUrl(), {
      cache: "no-store",
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(7_000),
    });
    const payload: unknown = await response.json();
    return parseOperationsStatus(payload) ?? unknownOperationsStatus();
  } catch {
    return unknownOperationsStatus();
  }
}
