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

export async function fetchPortalDashboardBootstrap(
  criticalWindow: "24h" | "7d" | "30d",
  signal?: AbortSignal,
): Promise<PortalDashboardBootstrap> {
  const url = new URL("/api/backend/dashboard/bootstrap", window.location.origin);
  url.searchParams.set("criticalWindow", criticalWindow);
  const response = await fetch(url.toString(), {
    cache: "no-store",
    credentials: "include",
    signal,
  });
  if (!response.ok) {
    throw new Error(`Dashboard bootstrap failed: ${response.status}`);
  }
  return response.json() as Promise<PortalDashboardBootstrap>;
}
