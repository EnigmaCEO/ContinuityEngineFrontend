import type {
  DashboardOverviewResponse,
  IncidentsOverviewResponse,
} from "@/lib/case-library/types";
import type { ProjectAccountOverview } from "@/lib/project-map/types";

export interface PortalDashboardBootstrap {
  dashboard: DashboardOverviewResponse | null;
  incidents: IncidentsOverviewResponse | null;
  projects: ProjectAccountOverview | null;
  errors: Record<string, string>;
}

const BOOTSTRAP_TTL_MS = 30_000;
const bootstrapCache = new Map<string, { expiresAt: number; data: PortalDashboardBootstrap }>();
const bootstrapRequests = new Map<string, Promise<PortalDashboardBootstrap>>();

function waitForSharedRequest<T>(request: Promise<T>, signal?: AbortSignal): Promise<T> {
  if (!signal) return request;
  if (signal.aborted) return Promise.reject(new DOMException("The operation was aborted.", "AbortError"));
  return new Promise<T>((resolve, reject) => {
    const abort = () => reject(new DOMException("The operation was aborted.", "AbortError"));
    signal.addEventListener("abort", abort, { once: true });
    request.then(resolve, reject).finally(() => signal.removeEventListener("abort", abort));
  });
}

export async function fetchPortalDashboardBootstrap(
  criticalWindow: "24h" | "7d" | "30d",
  signal?: AbortSignal,
): Promise<PortalDashboardBootstrap> {
  const cached = bootstrapCache.get(criticalWindow);
  if (cached && cached.expiresAt > Date.now()) return cached.data;
  let request = bootstrapRequests.get(criticalWindow);
  if (request) return waitForSharedRequest(request, signal);

  const url = new URL("/api/backend/dashboard/bootstrap", window.location.origin);
  url.searchParams.set("criticalWindow", criticalWindow);
  request = fetch(url.toString(), {
    cache: "no-store",
    credentials: "include",
  })
    .then(async (response) => {
      if (!response.ok) throw new Error(`Dashboard bootstrap failed: ${response.status}`);
      const data = await response.json() as PortalDashboardBootstrap;
      bootstrapCache.set(criticalWindow, { expiresAt: Date.now() + BOOTSTRAP_TTL_MS, data });
      return data;
    })
    .finally(() => bootstrapRequests.delete(criticalWindow));
  bootstrapRequests.set(criticalWindow, request);
  return waitForSharedRequest(request, signal);
}
