import type {
  CaseLibrarySummaryStats,
  CaseLibraryActivityItem,
  CaseLibraryMetrics,
  CaseLibraryTableParams,
  CaseLibraryTableResponse,
  CaseLibraryRecord,
  ArchiveFacetsResponse,
  CaseLibraryPageBootstrapResponse,
  SourceSyncResult,
  SourceProviderStatus,
  BatchEnrichmentResult,
  BatchReplayResult,
  EligibilityRefreshResult,
  DoctrineOverviewResponse,
  DashboardOverviewResponse,
  IncidentsOverviewResponse,
  ThreatMatrixOverviewResponse,
} from './types';
import { MOCK_CASES, MOCK_SUMMARY_STATS, MOCK_ACTIVITY, MOCK_METRICS } from './mock';
import { applyTableParams } from './selectors';

// ─── Config ───────────────────────────────────────────────────────────────────

const API_BASE = '/api/backend';

// Set to true to use local mock data instead of the real backend.
const USE_MOCK = false;
let dashboardFetchCount = 0;
const DASHBOARD_OVERVIEW_TTL_MS = 30_000;
const PAGE_BOOTSTRAP_TTL_MS = 30_000;
const INCIDENTS_OVERVIEW_TTL_MS = 15_000;
const dashboardOverviewCache = new Map<
  '24h' | '7d' | '30d',
  { expiresAt: number; data: DashboardOverviewResponse }
>();
const dashboardOverviewRequests = new Map<
  '24h' | '7d' | '30d',
  Promise<DashboardOverviewResponse>
>();
let incidentsOverviewCache: { expiresAt: number; data: IncidentsOverviewResponse } | null = null;
let incidentsOverviewRequest: Promise<IncidentsOverviewResponse> | null = null;
let pageBootstrapCache: { expiresAt: number; data: CaseLibraryPageBootstrapResponse } | null = null;
let pageBootstrapRequest: Promise<CaseLibraryPageBootstrapResponse> | null = null;

function invalidatePageBootstrap(): void {
  pageBootstrapCache = null;
}

function apiUrl(path: string): URL {
  return new URL(`${API_BASE}${path}`, window.location.origin);
}

function waitForSharedRequest<T>(request: Promise<T>, signal?: AbortSignal): Promise<T> {
  if (!signal) return request;
  if (signal.aborted) {
    return Promise.reject(new DOMException('The operation was aborted.', 'AbortError'));
  }

  return new Promise<T>((resolve, reject) => {
    const handleAbort = () => reject(new DOMException('The operation was aborted.', 'AbortError'));
    signal.addEventListener('abort', handleAbort, { once: true });
    request
      .then(resolve, reject)
      .finally(() => signal.removeEventListener('abort', handleAbort));
  });
}

async function fetchJsonWithDashboardLog<T>(url: string, init?: RequestInit): Promise<T> {
  const started = performance.now();
  const response = await fetch(url, init);
  const text = await response.text();
  const elapsed = Math.round(performance.now() - started);
  dashboardFetchCount += 1;
  console.info(
    `[dashboard:data] fetch=${dashboardFetchCount} url=${url} status=${response.status} bytes=${text.length} ms=${elapsed}`,
  );
  if (!response.ok) throw new Error(`dashboard fetch failed: ${response.status}`);
  return JSON.parse(text) as T;
}

async function errorMessage(response: Response, fallback: string): Promise<string> {
  const text = await response.text().catch(() => '');
  if (!text) return `${fallback}: ${response.status}`;
  try {
    const body = JSON.parse(text) as { error?: string; detail?: string };
    return body.error ?? body.detail ?? `${fallback}: ${response.status}`;
  } catch {
    return text;
  }
}

// ─── Summary ──────────────────────────────────────────────────────────────────

export async function fetchSummaryStats(): Promise<CaseLibrarySummaryStats> {
  if (USE_MOCK) {
    await tick();
    return MOCK_SUMMARY_STATS;
  }
  const res = await fetch(`${API_BASE}/case-library/summary`);
  if (!res.ok) throw new Error(`summary fetch failed: ${res.status}`);
  return res.json() as Promise<CaseLibrarySummaryStats>;
}

// ─── Cases ────────────────────────────────────────────────────────────────────

export async function fetchCases(params: CaseLibraryTableParams): Promise<CaseLibraryTableResponse> {
  if (USE_MOCK) {
    await tick();
    return applyTableParams(MOCK_CASES, params);
  }

  const url = apiUrl('/case-library');

  if (params.search)         url.searchParams.set('search',         params.search);
  if (params.severity)       url.searchParams.set('severity',       params.severity);
  if (params.type)           url.searchParams.set('type',           params.type);
  if (params.source)         url.searchParams.set('source',         params.source);
  if (params.chainSystem)    url.searchParams.set('chainSystem',    params.chainSystem);
  if (params.replayStatus)   url.searchParams.set('replayStatus',   params.replayStatus);
  if (params.doctrineStatus) url.searchParams.set('doctrineStatus', params.doctrineStatus);
  if (params.status)         url.searchParams.set('status',         params.status);
  if (params.priorityBand)   url.searchParams.set('priorityBand',   params.priorityBand);
  if (params.ingestedFrom)   url.searchParams.set('ingestedFrom',   params.ingestedFrom);
  if (params.ingestedTo)     url.searchParams.set('ingestedTo',     params.ingestedTo);
  if (params.updatedFrom)    url.searchParams.set('updatedFrom',    params.updatedFrom);
  if (params.updatedTo)      url.searchParams.set('updatedTo',      params.updatedTo);

  url.searchParams.set('page',     String(params.page));
  url.searchParams.set('pageSize', String(params.pageSize));
  url.searchParams.set('sortBy',   params.sortBy);
  url.searchParams.set('sortDir',  params.sortDir);

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`cases fetch failed: ${res.status}`);
  return res.json() as Promise<CaseLibraryTableResponse>;
}

export async function fetchCase(caseId: string): Promise<CaseLibraryRecord> {
  const res = await fetch(`${API_BASE}/case-library/${encodeURIComponent(caseId)}`);
  if (!res.ok) throw new Error(`case fetch failed: ${res.status}`);
  return res.json() as Promise<CaseLibraryRecord>;
}

export async function fetchArchiveFacets(): Promise<ArchiveFacetsResponse> {
  if (USE_MOCK) {
    await tick();
    return facetsFromCases(MOCK_CASES);
  }

  const res = await fetch(`${API_BASE}/case-library/archive/facets`);
  if (!res.ok) throw new Error(`archive facets fetch failed: ${res.status}`);
  return res.json() as Promise<ArchiveFacetsResponse>;
}

// ─── Activity ─────────────────────────────────────────────────────────────────

export async function fetchActivity(limit = 25): Promise<CaseLibraryActivityItem[]> {
  if (USE_MOCK) {
    await tick();
    return MOCK_ACTIVITY;
  }
  const url = apiUrl('/case-library/activity');
  url.searchParams.set('limit', String(limit));
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`activity fetch failed: ${res.status}`);
  return res.json() as Promise<CaseLibraryActivityItem[]>;
}

// ─── Provider status ─────────────────────────────────────────────────────────

export async function fetchProviderStatus(): Promise<SourceProviderStatus[]> {
  const res = await fetch(`${API_BASE}/case-library/provider-status`);
  if (!res.ok) throw new Error(`provider-status fetch failed: ${res.status}`);
  return res.json() as Promise<SourceProviderStatus[]>;
}

// ─── Metrics ──────────────────────────────────────────────────────────────────

export async function fetchMetrics(): Promise<CaseLibraryMetrics> {
  if (USE_MOCK) {
    await tick();
    return MOCK_METRICS;
  }
  const res = await fetch(`${API_BASE}/case-library/metrics`);
  if (!res.ok) throw new Error(`metrics fetch failed: ${res.status}`);
  return res.json() as Promise<CaseLibraryMetrics>;
}

// ─── Sync sources ─────────────────────────────────────────────────────────────

export async function triggerSync(): Promise<SourceSyncResult | void> {
  if (USE_MOCK) {
    await delay(900);
    return;
  }
  const res = await fetch('/api/case-library/sync-sources', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      autoNormalize:        true,
      autoClassify:         true,
      autoEnrichDoctrine:   true,
      autoRunReplay:        true,
      lookbackDays:         7,
      maxResultsPerSource:  100,
    }),
  });
  if (!res.ok) throw new Error(await errorMessage(res, 'Sync Sources failed'));
  invalidatePageBootstrap();
  return res.json() as Promise<SourceSyncResult>;
}

// ─── Ingest case ──────────────────────────────────────────────────────────────

export async function ingestCase(payload?: unknown): Promise<void> {
  if (USE_MOCK) {
    await delay(600);
    return;
  }
  const res = await fetch(`${API_BASE}/case-library/ingest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload ?? {}),
  });
  if (!res.ok) throw new Error(`ingest failed: ${res.status}`);
  invalidatePageBootstrap();
}

// ─── Doctrine enrichment ──────────────────────────────────────────────────────

export async function enrichDoctrine(caseId: string): Promise<CaseLibraryRecord> {
  const res = await fetch(`/api/case-library/${encodeURIComponent(caseId)}/enrich-doctrine`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error(await errorMessage(res, 'Doctrine enrichment failed'));
  invalidatePageBootstrap();
  return res.json() as Promise<CaseLibraryRecord>;
}

export async function fetchPageBootstrap(): Promise<CaseLibraryPageBootstrapResponse> {
  if (pageBootstrapCache && pageBootstrapCache.expiresAt > Date.now()) {
    return pageBootstrapCache.data;
  }
  if (!pageBootstrapRequest) {
    pageBootstrapRequest = fetch(`${API_BASE}/case-library/page-bootstrap`, { cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) throw new Error(await errorMessage(response, 'Case Library panels failed'));
        return response.json() as Promise<CaseLibraryPageBootstrapResponse>;
      })
      .then((data) => {
        pageBootstrapCache = { expiresAt: Date.now() + PAGE_BOOTSTRAP_TTL_MS, data };
        return data;
      })
      .finally(() => {
        pageBootstrapRequest = null;
      });
  }
  return pageBootstrapRequest;
}

export async function batchEnrichDoctrine(limit = 50): Promise<BatchEnrichmentResult> {
  const url = apiUrl('/case-library/enrich-doctrine/batch');
  url.searchParams.set('limit', String(limit));
  const res = await fetch(url.toString(), { method: 'POST' });
  if (!res.ok) throw new Error(`batch enrich-doctrine failed: ${res.status}`);
  invalidatePageBootstrap();
  return res.json() as Promise<BatchEnrichmentResult>;
}

// ─── Replay ───────────────────────────────────────────────────────────────────

export async function runReplay(caseId: string): Promise<CaseLibraryRecord> {
  const res = await fetch(`/api/case-library/${encodeURIComponent(caseId)}/run-replay`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error(await errorMessage(res, 'Validation failed'));
  invalidatePageBootstrap();
  return res.json() as Promise<CaseLibraryRecord>;
}

export async function batchRunReplay(limit = 50): Promise<BatchReplayResult> {
  const params = new URLSearchParams({ limit: String(limit) });
  const res = await fetch(`/api/case-library/replay/batch?${params.toString()}`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error(await errorMessage(res, 'Batch validation failed'));
  invalidatePageBootstrap();
  return res.json() as Promise<BatchReplayResult>;
}

export async function refreshReplayEligibility(): Promise<EligibilityRefreshResult> {
  const res = await fetch('/api/case-library/replay/refresh-eligibility', {
    method: 'POST',
  });
  if (!res.ok) throw new Error(await errorMessage(res, 'Validation eligibility refresh failed'));
  invalidatePageBootstrap();
  return res.json() as Promise<EligibilityRefreshResult>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

// Minimal simulated latency so loading states are visible in mock mode.
function tick(): Promise<void> {
  return delay(120);
}

function sourceValue(source: string): string {
  const known: Record<string, string> = {
    'GitHub Advisories': 'github_advisories',
    'NVD CVE': 'nvd_cve',
    'CISA KEV': 'cisa_kev',
    'De.Fi REKT': 'defi_rekt',
    OSV: 'osv',
  };
  return known[source] ?? source.toLowerCase().replaceAll('.', '').replaceAll('/', '_').replaceAll('-', '_').replaceAll(' ', '_');
}

function labelFor(value: string): string {
  const known: Record<string, string> = {
    github_advisories: 'GitHub Advisories',
    nvd_cve: 'NVD CVE',
    cisa_kev: 'CISA KEV',
    defi_rekt: 'De.Fi REKT',
    osv: 'OSV',
  };
  return known[value] ?? value.replaceAll('_', ' ').replaceAll('-', ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function optionsFrom(values: Iterable<string>, source = false) {
  const counts = new Map<string, number>();
  for (const raw of values) {
    if (!raw) continue;
    const value = source ? sourceValue(raw) : raw;
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([value, count]) => ({ value, label: labelFor(value), count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

function facetsFromCases(cases: CaseLibraryRecord[]): ArchiveFacetsResponse {
  const sourceValues: string[] = [];
  for (const c of cases) {
    const sources = new Set([c.source, ...(c.sources ?? []), ...(c.sourceRefs ?? []).map((ref) => ref.source)]);
    sourceValues.push(...sources);
  }
  return {
    sources:          optionsFrom(sourceValues, true),
    severities:       optionsFrom(cases.map((c) => c.severity)),
    types:            optionsFrom(cases.map((c) => c.type)),
    chains:           optionsFrom(cases.map((c) => c.chainSystem)),
    replayStatuses:   optionsFrom(cases.map((c) => c.replayStatus)),
    doctrineStatuses: optionsFrom(cases.map((c) => c.doctrineStatus)),
    caseStatuses:     optionsFrom(cases.map((c) => c.status)),
  };
}

export async function fetchDoctrineOverview(): Promise<DoctrineOverviewResponse> {
  if (USE_MOCK) {
    await tick();
    return {
      totalDoctrineTags: 0,
      totalDoctrineCoveredCases: 0,
      totalReplayedDoctrineCases: 0,
      doctrineCoveragePct: 0,
      replayCoverageByDoctrineTag: [],
      rows: [],
    };
  }
  const res = await fetch(`${API_BASE}/case-library/doctrine/overview`);
  if (!res.ok) throw new Error(`doctrine overview fetch failed: ${res.status}`);
  return res.json() as Promise<DoctrineOverviewResponse>;
}

export async function fetchThreatMatrixOverview(): Promise<ThreatMatrixOverviewResponse> {
  if (USE_MOCK) {
    await tick();
    return {
      activeThreatFamilies: 0,
      criticalExposure: 0,
      replayGaps: 0,
      highestThreatScore: 0,
      rows: [],
    };
  }
  const res = await fetch(`${API_BASE}/case-library/threat-matrix/overview`);
  if (!res.ok) throw new Error(`threat matrix overview fetch failed: ${res.status}`);
  return res.json() as Promise<ThreatMatrixOverviewResponse>;
}

export async function fetchDashboardOverview(
  criticalWindow: '24h' | '7d' | '30d' = '7d',
  signal?: AbortSignal,
): Promise<DashboardOverviewResponse> {
  if (signal?.aborted) {
    throw new DOMException('The operation was aborted.', 'AbortError');
  }
  const cached = dashboardOverviewCache.get(criticalWindow);
  if (cached && cached.expiresAt > Date.now()) return cached.data;

  const url = apiUrl('/case-library/dashboard/overview');
  url.searchParams.set('criticalWindow', criticalWindow);
  let request = dashboardOverviewRequests.get(criticalWindow);
  if (!request) {
    request = fetchJsonWithDashboardLog<DashboardOverviewResponse>(url.toString())
      .then((data) => {
        dashboardOverviewCache.set(criticalWindow, {
          expiresAt: Date.now() + DASHBOARD_OVERVIEW_TTL_MS,
          data,
        });
        return data;
      })
      .finally(() => {
        dashboardOverviewRequests.delete(criticalWindow);
      });
    dashboardOverviewRequests.set(criticalWindow, request);
  }
  return waitForSharedRequest(request, signal);
}

export async function fetchIncidentsOverview(signal?: AbortSignal): Promise<IncidentsOverviewResponse> {
  if (signal?.aborted) {
    throw new DOMException('The operation was aborted.', 'AbortError');
  }

  const now = Date.now();
  if (incidentsOverviewCache && incidentsOverviewCache.expiresAt > now) {
    return incidentsOverviewCache.data;
  }

  if (!incidentsOverviewRequest) {
    incidentsOverviewRequest = fetchJsonWithDashboardLog<IncidentsOverviewResponse>(
      `${API_BASE}/incidents/overview`,
    )
      .then((data) => {
        incidentsOverviewCache = {
          expiresAt: Date.now() + INCIDENTS_OVERVIEW_TTL_MS,
          data,
        };
        return data;
      })
      .finally(() => {
        incidentsOverviewRequest = null;
      });
  }

  return waitForSharedRequest(incidentsOverviewRequest, signal);
}
