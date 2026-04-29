import type {
  CaseLibraryRecord,
  CaseLibraryTableParams,
  CaseLibraryTableResponse,
  CaseLibrarySummaryStats,
  CaseLibraryMetrics,
  CaseSeverity,
  LibraryMaturity,
  PipelineHealth,
} from './types';
import { CLR } from './utils';

// ─── Table: filter → sort → paginate ─────────────────────────────────────────

export function applyTableParams(
  cases: CaseLibraryRecord[],
  params: CaseLibraryTableParams,
): CaseLibraryTableResponse {
  const {
    search, severity, type, source, chainSystem,
    replayStatus, doctrineStatus,
    page, pageSize, sortBy, sortDir,
  } = params;

  const q = search?.toLowerCase() ?? '';

  const filtered = cases.filter((c) => {
    if (q && ![ c.caseId, c.title, c.type, c.source, c.chainSystem, c.summary ]
      .some((f) => f.toLowerCase().includes(q))) return false;
    if (severity     && c.severity      !== severity)      return false;
    if (type         && c.type          !== type)          return false;
    if (source       && c.source        !== source)        return false;
    if (chainSystem  && c.chainSystem   !== chainSystem)   return false;
    if (replayStatus && c.replayStatus  !== replayStatus)  return false;
    if (doctrineStatus && c.doctrineStatus !== doctrineStatus) return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    const av = String(a[sortBy] ?? '');
    const bv = String(b[sortBy] ?? '');
    const cmp = av < bv ? -1 : av > bv ? 1 : 0;
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const start = (page - 1) * pageSize;
  return {
    items:    sorted.slice(start, start + pageSize),
    page,
    pageSize,
    total:    filtered.length,
  };
}

// ─── Unique filter values from case list ─────────────────────────────────────

export function uniqueFilterValues(cases: CaseLibraryRecord[]) {
  return {
    types:   [...new Set(cases.map((c) => c.type))].sort(),
    sources: [...new Set(cases.map((c) => c.source))].sort(),
    chains:  [...new Set(cases.map((c) => c.chainSystem))].sort(),
  };
}

// ─── Derive summary stats from case array ────────────────────────────────────

export function computeSummaryStats(cases: CaseLibraryRecord[]): CaseLibrarySummaryStats {
  const n = cases.length || 1;
  const replayReady = cases.filter((c) =>
    c.replayStatus === 'available' || c.replayStatus === 'passed'
  ).length;
  const doctrineCovered = cases.filter((c) =>
    c.doctrineStatus === 'linked' || c.doctrineStatus === 'updated'
  ).length;
  const pendingReplayCount = cases.filter((c) =>
    c.replayStatus === 'missing' || c.replayStatus === 'pending'
  ).length;
  const pendingDoctrineCount = cases.filter((c) =>
    c.doctrineStatus === 'pending' || c.doctrineStatus === 'none'
  ).length;
  const pendingReviewCount = cases.filter((c) =>
    c.status === 'needs_review' || c.status === 'failed_normalization' || c.status === 'failed_classification'
  ).length;
  const failedIngestionCount = cases.filter((c) =>
    c.status === 'failed_normalization' || c.status === 'failed_classification'
  ).length;
  const replayCoveragePct = Math.round((replayReady / n) * 100);
  const doctrineLinkedPct = Math.round((doctrineCovered / n) * 100);

  const pipelineHealth: PipelineHealth = failedIngestionCount === 0 ? 'healthy' : 'partial';

  let libraryMaturity: LibraryMaturity = 'needs_enrichment';
  if (cases.length === 0) {
    libraryMaturity = 'raw';
  } else if (replayCoveragePct >= 80 && doctrineLinkedPct >= 80 && failedIngestionCount === 0) {
    libraryMaturity = 'verified';
  } else if (replayCoveragePct >= 50 && doctrineLinkedPct >= 50) {
    libraryMaturity = 'enriched';
  }

  const pendingActions =
    pendingReplayCount + pendingDoctrineCount + pendingReviewCount + failedIngestionCount;

  const healthStatus = pipelineHealth === 'healthy' ? 'healthy' : 'needs_review';

  return {
    activeRecords:            cases.length,
    activeRecordsDelta:       6,
    newCvesAdded:             12,
    healthStatus,
    pipelineHealth,
    libraryMaturity,
    normalizationSuccessRate: 100,
    syncUptimePct:            99.8,
    pendingActions,
    pendingReplayCount,
    pendingDoctrineCount,
    pendingReviewCount,
    failedIngestionCount,
    replayCoveragePct,
    doctrineLinkedPct,
    failedIngestions:         failedIngestionCount,
    lastSyncAt:               '2026-04-25T09:41:00Z',
  };
}

// ─── Derive metrics from case array ──────────────────────────────────────────

export function computeMetrics(cases: CaseLibraryRecord[]): CaseLibraryMetrics {
  const n = cases.length || 1;

  const severityMap = { critical: 0, high: 0, medium: 0, low: 0 };
  const sourceMap: Record<string, number> = {};
  const rp = { available: 0, missing: 0, passed: 0, failed: 0, pending: 0 };
  const dt = { linked: 0, updated: 0, pending: 0, none: 0 };

  for (const c of cases) {
    severityMap[c.severity]++;
    const countedSources = c.sources && c.sources.length > 0
      ? new Set([c.source, ...c.sources])
      : new Set([c.source]);
    for (const source of countedSources) {
      sourceMap[source] = (sourceMap[source] ?? 0) + 1;
    }
    rp[c.replayStatus]++;
    dt[c.doctrineStatus]++;
  }

  const sourceColors: Record<string, string> = {
    SlowMist: CLR.orange, ImmuneFi: CLR.blue, Manual: CLR.purple, Research: CLR.gold,
  };

  const sourceBreakdown = Object.entries(sourceMap)
    .sort((a, b) => b[1] - a[1])
    .map(([source, count]) => ({
      source,
      count,
      color: sourceColors[source] ?? CLR.muted,
    }));

  const replayReady = rp.available + rp.passed;
  const doctrineLnk = dt.linked + dt.updated;

  return {
    sourceBreakdown,
    severityDistribution: (Object.entries(severityMap) as [CaseSeverity, number][])
      .map(([severity, count]) => ({ severity, count })),
    replayStats: { ...rp, coveragePct: Math.round((replayReady / n) * 100) },
    doctrineStats: { ...dt, linkedPct: Math.round((doctrineLnk / n) * 100) },
    ingestionStats: {
      rawIngestsToday:   34,
      normalizedToday:   32,
      failedIngestions:  2,
      pendingReview:     4,
      avgProcessTimeSec: 1.4,
      lastSyncAt:        '2026-04-25T09:41:00Z',
    },
  };
}
