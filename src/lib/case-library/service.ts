import type {
  CaseLibrarySummaryStats,
  CaseLibraryActivityItem,
  CaseLibraryMetrics,
  CaseLibraryTableParams,
  CaseLibraryTableResponse,
  CaseLibraryRecord,
  SourceSyncResult,
  BatchEnrichmentResult,
  BatchReplayResult,
  DoctrineOverviewResponse,
  ThreatMatrixOverviewResponse,
} from './types';
import { MOCK_CASES, MOCK_SUMMARY_STATS, MOCK_ACTIVITY, MOCK_METRICS } from './mock';
import { applyTableParams } from './selectors';

// ─── Config ───────────────────────────────────────────────────────────────────

const API_BASE = 'http://127.0.0.1:8000';

// Set to true to use local mock data instead of the real backend.
const USE_MOCK = false;

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

  const url = new URL(`${API_BASE}/case-library`);

  if (params.search)         url.searchParams.set('search',         params.search);
  if (params.severity)       url.searchParams.set('severity',       params.severity);
  if (params.type)           url.searchParams.set('type',           params.type);
  if (params.source)         url.searchParams.set('source',         params.source);
  if (params.chainSystem)    url.searchParams.set('chainSystem',    params.chainSystem);
  if (params.replayStatus)   url.searchParams.set('replayStatus',   params.replayStatus);
  if (params.doctrineStatus) url.searchParams.set('doctrineStatus', params.doctrineStatus);
  if (params.status)         url.searchParams.set('status',         params.status);
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

// ─── Activity ─────────────────────────────────────────────────────────────────

export async function fetchActivity(limit = 25): Promise<CaseLibraryActivityItem[]> {
  if (USE_MOCK) {
    await tick();
    return MOCK_ACTIVITY;
  }
  const url = new URL(`${API_BASE}/case-library/activity`);
  url.searchParams.set('limit', String(limit));
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`activity fetch failed: ${res.status}`);
  return res.json() as Promise<CaseLibraryActivityItem[]>;
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
  const res = await fetch(`${API_BASE}/case-library/sync-sources`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sourceTypes:          ['cisa_kev', 'nvd_cve', 'github_advisories', 'defi_rekt'],
      autoNormalize:        true,
      autoClassify:         true,
      autoEnrichDoctrine:   true,
      autoRunReplay:        true,
      lookbackDays:         7,
      maxResultsPerSource:  100,
    }),
  });
  if (!res.ok) throw new Error(`sync failed: ${res.status}`);
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
}

// ─── Doctrine enrichment ──────────────────────────────────────────────────────

export async function enrichDoctrine(caseId: string): Promise<CaseLibraryRecord> {
  const res = await fetch(`${API_BASE}/case-library/${caseId}/enrich-doctrine`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error(`enrich-doctrine failed: ${res.status}`);
  return res.json() as Promise<CaseLibraryRecord>;
}

export async function batchEnrichDoctrine(limit = 50): Promise<BatchEnrichmentResult> {
  const url = new URL(`${API_BASE}/case-library/enrich-doctrine/batch`);
  url.searchParams.set('limit', String(limit));
  const res = await fetch(url.toString(), { method: 'POST' });
  if (!res.ok) throw new Error(`batch enrich-doctrine failed: ${res.status}`);
  return res.json() as Promise<BatchEnrichmentResult>;
}

// ─── Replay ───────────────────────────────────────────────────────────────────

export async function runReplay(caseId: string): Promise<CaseLibraryRecord> {
  const res = await fetch(`${API_BASE}/case-library/${caseId}/run-replay`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error(`run-replay failed: ${res.status}`);
  return res.json() as Promise<CaseLibraryRecord>;
}

export async function batchRunReplay(limit = 50): Promise<BatchReplayResult> {
  const url = new URL(`${API_BASE}/case-library/replay/batch`);
  url.searchParams.set('limit', String(limit));
  const res = await fetch(url.toString(), { method: 'POST' });
  if (!res.ok) throw new Error(`batch replay failed: ${res.status}`);
  return res.json() as Promise<BatchReplayResult>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

// Minimal simulated latency so loading states are visible in mock mode.
function tick(): Promise<void> {
  return delay(120);
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
