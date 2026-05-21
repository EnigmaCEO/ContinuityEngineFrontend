"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import type {
  CaseLibrarySummaryStats,
  CaseLibraryActivityItem,
  CaseLibraryMetrics,
  CaseLibraryRecord,
  ArchiveFacetOption,
  ArchiveFacetsResponse,
  BatchReplayResult,
  EligibilityRefreshResult,
} from "@/lib/case-library/types";
import type { CaseLibraryTableSortKey, CaseSeverity  } from "@/lib/case-library/types";
import {
  fetchSummaryStats, fetchCases, fetchActivity, fetchMetrics, triggerSync,
  batchRunReplay, refreshReplayEligibility, fetchArchiveFacets,
} from "@/lib/case-library/service";
import { CLR } from "@/lib/case-library/utils";
import { CaseLibraryHeader }       from "@/components/case-library/CaseLibraryHeader";
import { CaseLibrarySummaryCards } from "@/components/case-library/CaseLibrarySummaryCards";
import { CaseLibraryFilters }      from "@/components/case-library/CaseLibraryFilters";
import type { FilterState }        from "@/components/case-library/CaseLibraryFilters";
import { CaseLibraryTable }        from "@/components/case-library/CaseLibraryTable";
import { CaseLibraryMetricsPanel } from "@/components/case-library/CaseLibraryMetricsPanel";
import { CaseLibraryActivityFeed } from "@/components/case-library/CaseLibraryActivityFeed";
import { CasePreviewDrawer }       from "@/components/case-library/CasePreviewDrawer";
import { useSession } from "@/components/layout/SessionContext";
import { AlertTriangle, RefreshCw, Archive, LayoutDashboard, ChevronLeft, Play, Loader2, Zap } from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 25;

const SORT_OPTIONS: { value: CaseLibraryTableSortKey; label: string }[] = [
  { value: 'ingestedAt', label: 'Newest Ingested' },
  { value: 'updatedAt',  label: 'Recently Updated' },
  { value: 'severity',   label: 'Severity' },
  { value: 'source',     label: 'Source' },
  { value: 'cveCount',   label: 'CVE Count' },
  { value: 'title',      label: 'Title' },
];

const EMPTY_FILTERS: FilterState = {
  search: "", severity: "", type: "", source: "",
  chainSystem: "", replayStatus: "", doctrineStatus: "", status: "",
  ingestedFrom: "", ingestedTo: "", datePreset: "",
};

const STATIC_SEVERITIES: ArchiveFacetOption[] = [
  { value: "critical", label: "Critical", count: 0 },
  { value: "high", label: "High", count: 0 },
  { value: "medium", label: "Medium", count: 0 },
  { value: "low", label: "Low", count: 0 },
];

const STATIC_REPLAY_STATUSES: ArchiveFacetOption[] = [
  { value: "available", label: "Available", count: 0 },
  { value: "missing", label: "Missing", count: 0 },
  { value: "passed", label: "Passed", count: 0 },
  { value: "failed", label: "Failed", count: 0 },
  { value: "pending", label: "Pending", count: 0 },
];

const STATIC_DOCTRINE_STATUSES: ArchiveFacetOption[] = [
  { value: "linked", label: "Linked", count: 0 },
  { value: "pending", label: "Pending", count: 0 },
  { value: "updated", label: "Updated", count: 0 },
  { value: "none", label: "None", count: 0 },
];

const STATIC_CASE_STATUSES: ArchiveFacetOption[] = [
  { value: "ingested", label: "Ingested", count: 0 },
  { value: "normalized", label: "Normalized", count: 0 },
  { value: "classified", label: "Classified", count: 0 },
  { value: "replay_ready", label: "Replay Ready", count: 0 },
  { value: "doctrine_tagged", label: "Doctrine Tagged", count: 0 },
  { value: "verified", label: "Verified", count: 0 },
  { value: "needs_review", label: "Needs Review", count: 0 },
  { value: "raw_ingested", label: "Raw Ingested", count: 0 },
  { value: "failed_normalization", label: "Failed Normalization", count: 0 },
  { value: "failed_classification", label: "Failed Classification", count: 0 },
];

function titleLabel(value: string): string {
  return value.replaceAll("_", " ").replaceAll("-", " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function sourceValue(source: string): string {
  const known: Record<string, string> = {
    "GitHub Advisories": "github_advisories",
    "NVD CVE": "nvd_cve",
    "CISA KEV": "cisa_kev",
    "De.Fi REKT": "defi_rekt",
  };
  return known[source] ?? source.toLowerCase().replaceAll(".", "").replaceAll("/", "_").replaceAll("-", "_").replaceAll(" ", "_");
}

function sourceLabel(value: string): string {
  const known: Record<string, string> = {
    github_advisories: "GitHub Advisories",
    nvd_cve: "NVD CVE",
    cisa_kev: "CISA KEV",
    defi_rekt: "De.Fi REKT",
  };
  return known[value] ?? titleLabel(value);
}

function fallbackOptions(values: Iterable<string>, labeler = titleLabel): ArchiveFacetOption[] {
  const counts = new Map<string, number>();
  for (const value of values) {
    if (!value) continue;
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([value, count]) => ({ value, label: labeler(value), count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

// ─── Error banner ─────────────────────────────────────────────────────────────

function ErrorBanner({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "10px 14px", borderRadius: 7,
      background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <AlertTriangle size={14} style={{ color: CLR.red, flexShrink: 0 }} />
        <span style={{ fontSize: 11.5, color: "#FCA5A5" }}>{message}</span>
      </div>
      <button onClick={onRetry} style={{
        display: "flex", alignItems: "center", gap: 5,
        background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.35)",
        borderRadius: 5, padding: "5px 10px", cursor: "pointer",
        fontSize: 10.5, color: CLR.red, fontWeight: 600,
      }}>
        <RefreshCw size={10} /> Retry
      </button>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CaseLibraryPage() {
  const me = useSession();
  const canManageSources = me?.permissions.canManageSources ?? false;

  // ── Data state ──────────────────────────────────────────────────────────────
  const [summary,       setSummary]       = useState<CaseLibrarySummaryStats | null>(null);
  const [cases,         setCases]         = useState<CaseLibraryRecord[]>([]);
  const [caseTotal,     setCaseTotal]     = useState(0);
  const [activity,      setActivity]      = useState<CaseLibraryActivityItem[]>([]);
  const [metrics,       setMetrics]       = useState<CaseLibraryMetrics | null>(null);
  const [facets,        setFacets]        = useState<ArchiveFacetsResponse | null>(null);
  const [selectedCase,  setSelectedCase]  = useState<CaseLibraryRecord | null>(null);

  // ── Loading / error state ───────────────────────────────────────────────────
  const [summaryLoading,  setSummaryLoading]  = useState(true);
  const [tableLoading,    setTableLoading]    = useState(true);
  const [activityLoading, setActivityLoading] = useState(true);
  const [metricsLoading,  setMetricsLoading]  = useState(true);
  const [facetsLoading,   setFacetsLoading]   = useState(true);
  const [error,           setError]           = useState<string | null>(null);
  const [syncing,         setSyncing]         = useState(false);

  // ── Batch replay state ──────────────────────────────────────────────────────
  const [batchReplaying,    setBatchReplaying]    = useState(false);
  const [batchReplayResult, setBatchReplayResult] = useState<BatchReplayResult | null>(null);
  const [batchLimit,        setBatchLimit]        = useState<25 | 50 | 100>(50);

  // ── Eligibility refresh state ────────────────────────────────────────────────
  const [eligRefreshing,  setEligRefreshing]  = useState(false);
  const [eligResult,      setEligResult]      = useState<EligibilityRefreshResult | null>(null);
  const [eligError,       setEligError]       = useState<string | null>(null);

  // Ref tracking selected case so loadCases can refresh it without a stale closure
  const selectedCaseRef = useRef<CaseLibraryRecord | null>(null);

  // ── Filter / table state ────────────────────────────────────────────────────
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [page,    setPage]    = useState(1);
  const [sortBy,  setSortBy]  = useState<CaseLibraryTableSortKey>("ingestedAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  // ── Live filter option accumulator ──────────────────────────────────────────
  // Collects unique type/source/chain values seen across page loads without
  // requiring a separate API endpoint.
  const [fallbackTypes,   setFallbackTypes]   = useState<ArchiveFacetOption[]>([]);
  const [fallbackSources, setFallbackSources] = useState<ArchiveFacetOption[]>([]);
  const [fallbackChains,  setFallbackChains]  = useState<ArchiveFacetOption[]>([]);

  // ── Load summary + activity + metrics once on mount ────────────────────────
  const loadMeta = useCallback(async () => {
    setError(null);
    setSummaryLoading(true);
    setActivityLoading(true);
    setMetricsLoading(true);
    setFacetsLoading(true);
    const [s, a, m, f] = await Promise.allSettled([
      fetchSummaryStats(),
      fetchActivity(),
      fetchMetrics(),
      fetchArchiveFacets(),
    ]);

    if (s.status === "fulfilled") setSummary(s.value);
    else setError(s.reason?.message ?? "Failed to load summary data.");

    if (a.status === "fulfilled") setActivity(a.value);
    else setError(a.reason?.message ?? "Failed to load activity data.");

    if (m.status === "fulfilled") setMetrics(m.value);
    else setError(m.reason?.message ?? "Failed to load metrics data.");

    if (f.status === "fulfilled") {
      setFacets(f.value);
    } else {
      console.error("[Case Library] Archive facets fetch failed; current page options will be used as fallback.", f.reason);
    }

    setSummaryLoading(false);
    setActivityLoading(false);
    setMetricsLoading(false);
    setFacetsLoading(false);
  }, []);

  useEffect(() => { selectedCaseRef.current = selectedCase; }, [selectedCase]);
  useEffect(() => {
    void Promise.resolve().then(() => loadMeta());
  }, [loadMeta]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  function handleFilterChange(patch: Partial<FilterState>) {
    setFilters((f) => ({ ...f, ...patch }));
    setPage(1);
  }

  function handleFilterReset() {
    setFilters(EMPTY_FILTERS);
    setPage(1);
  }

  function handleSort(key: CaseLibraryTableSortKey) {
    if (sortBy === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortBy(key); setSortDir("desc"); }
    setPage(1);
  }

  function handleSortSelect(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value as CaseLibraryTableSortKey;
    setSortBy(val);
    setSortDir("desc");
    setPage(1);
  }

  async function handleSync() {
    setSyncing(true);
    try {
      await triggerSync();
      await loadMeta();
      await loadCases();
    } catch (e) {
      setError((e as Error).message ?? "Sync failed.");
    } finally {
      setSyncing(false);
    }
  }

  async function handleBatchReplay() {
    setBatchReplaying(true);
    setBatchReplayResult(null);
    try {
      const result = await batchRunReplay(batchLimit);
      setBatchReplayResult(result);
      await Promise.all([loadMeta(), loadCases()]);
    } catch (e) {
      setError((e as Error).message ?? "Batch replay failed.");
    } finally {
      setBatchReplaying(false);
    }
  }

  async function handleRefreshEligibility() {
    setEligRefreshing(true);
    setEligResult(null);
    setEligError(null);
    try {
      const result = await refreshReplayEligibility();
      setEligResult(result);
      await Promise.all([loadMeta(), loadCases()]);
    } catch (e) {
      setEligError((e as Error).message ?? "Eligibility refresh failed.");
    } finally {
      setEligRefreshing(false);
    }
  }

  function handleIngest() {
    console.info("[Case Library] Ingest Case triggered — modal stub");
  }

  function handleExport() {
    console.info("[Case Library] Export triggered — stub");
  }

  function handleRowClick(c: CaseLibraryRecord) {
    setSelectedCase(c);
  }

  // ── View mode ─────────────────────────────────────────────────────────────────
  const [viewMode, setViewMode] = useState<"overview" | "archive" | "critical">("overview");

  // ── Derived state ────────────────────────────────────────────────────────────
  const effectiveFilters = useMemo<FilterState>(() => {
    if (viewMode === "critical") {
      return { ...filters, severity: "critical" as CaseSeverity };
    }
    return filters;
  }, [viewMode, filters]);
  
  const hasAnyFilter = (
    !!effectiveFilters.search || !!effectiveFilters.severity || !!effectiveFilters.type ||
    !!effectiveFilters.source || !!effectiveFilters.chainSystem || !!effectiveFilters.replayStatus ||
    !!effectiveFilters.doctrineStatus || !!effectiveFilters.status ||
    !!effectiveFilters.ingestedFrom || !!effectiveFilters.ingestedTo
  );

  // ── Load case table whenever filter/sort/page changes ─────────────────────
  const loadCases = useCallback(async () => {
    setTableLoading(true);
    try {
      const res = await fetchCases({
        search: effectiveFilters.search || undefined,
        severity: effectiveFilters.severity || undefined,
        type: effectiveFilters.type || undefined,
        source: effectiveFilters.source || undefined,
        chainSystem: effectiveFilters.chainSystem || undefined,
        replayStatus: effectiveFilters.replayStatus || undefined,
        doctrineStatus: effectiveFilters.doctrineStatus || undefined,
        status: effectiveFilters.status || undefined,
        ingestedFrom: effectiveFilters.ingestedFrom || undefined,
        ingestedTo: effectiveFilters.ingestedTo || undefined,
        page,
        pageSize: PAGE_SIZE,
        sortBy,
        sortDir,
      });
  
      setCases(res.items);
      setCaseTotal(res.total);
  
      const current = selectedCaseRef.current;
      if (current) {
        const updated = res.items.find((r) => r.caseId === current.caseId);
        if (updated) setSelectedCase(updated);
      }
  
      setFallbackTypes(fallbackOptions(res.items.map((c) => c.type)));
      setFallbackChains(fallbackOptions(res.items.map((c) => c.chainSystem)));
      const pageSources: string[] = [];
      for (const c of res.items) {
        const allSources = new Set([c.source, ...(c.sources ?? []), ...(c.sourceRefs ?? []).map((ref) => ref.source)]);
        for (const s of allSources) pageSources.push(sourceValue(s));
      }
      setFallbackSources(fallbackOptions(pageSources, sourceLabel));
    } catch (e) {
      setError((e as Error).message ?? "Failed to load cases.");
    } finally {
      setTableLoading(false);
    }
  }, [
    effectiveFilters.search,
    effectiveFilters.severity,
    effectiveFilters.type,
    effectiveFilters.source,
    effectiveFilters.chainSystem,
    effectiveFilters.replayStatus,
    effectiveFilters.doctrineStatus,
    effectiveFilters.status,
    effectiveFilters.ingestedFrom,
    effectiveFilters.ingestedTo,
    page,
    sortBy,
    sortDir,
  ]);
  
  useEffect(() => { loadCases(); }, [loadCases]);

  const archiveTypes = facets?.types.length ? facets.types : fallbackTypes;
  const archiveSources = facets?.sources.length ? facets.sources : fallbackSources;
  const archiveChains = facets?.chains.length ? facets.chains : fallbackChains;
  const archiveSeverities = facets?.severities.length ? facets.severities : STATIC_SEVERITIES;
  const archiveReplayStatuses = facets?.replayStatuses.length ? facets.replayStatuses : STATIC_REPLAY_STATUSES;
  const archiveDoctrineStatuses = facets?.doctrineStatuses.length ? facets.doctrineStatuses : STATIC_DOCTRINE_STATUSES;
  const archiveCaseStatuses = facets?.caseStatuses.length ? facets.caseStatuses : STATIC_CASE_STATUSES;

  // ── Render ────────────────────────────────────────────────────────────────────


  return (
    <div style={{
      display: "flex", flexDirection: "column", minHeight: "100%",
      padding: "20px 18px 28px", background: CLR.bg, gap: 16,
    }}>
      {/* Header */}
      <CaseLibraryHeader
        stats={summary}
        syncing={syncing}
        canManageSources={canManageSources}
        onSync={handleSync}
        onIngest={handleIngest}
        onExport={handleExport}
      />

      {error && (
        <ErrorBanner message={error} onRetry={() => { loadMeta(); loadCases(); }} />
      )}

      {/* ── View mode tabs ─────────────────────────────────────────────────── */}
      <div style={{
        display: "flex", alignItems: "center", gap: 4,
        borderBottom: `1px solid ${CLR.border}`, paddingBottom: 0,
      }}>
        {(["overview", "archive", "critical"] as const).map((mode) => {
          const active = viewMode === mode;
          return (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "8px 16px", cursor: "pointer",
                background: "transparent", border: "none", outline: "none",
                borderBottom: active ? `2px solid ${CLR.gold}` : "2px solid transparent",
                marginBottom: -1,
                fontSize: 11, fontWeight: active ? 700 : 500,
                letterSpacing: "0.08em", textTransform: "uppercase" as const,
                color: active ? CLR.gold : CLR.muted,
                transition: "color 0.15s, border-color 0.15s",
              }}
            >
              {mode === "overview" ? (
                <>
                  <LayoutDashboard size={12} /> Overview
                </>
              ) : mode === "archive" ? (
                <>
                  <Archive size={12} /> Archive
                </>
              ) : (
                <>
                  <AlertTriangle size={12} /> Critical Cases
                </>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Overview ──────────────────────────────────────────────────────── */}
      {viewMode === "overview" && (
        <>
          <CaseLibrarySummaryCards stats={summary} loading={summaryLoading} />
          <CaseLibraryMetricsPanel metrics={metrics} loading={metricsLoading} />
          <CaseLibraryActivityFeed items={activity} loading={activityLoading} />
        </>
      )}

      {/* ── Archive ───────────────────────────────────────────────────────── */}
      {viewMode === "archive" && (
        <section
          id="global-case-archive"
          style={{
            background: CLR.surface, border: `1px solid rgba(212,175,55,0.28)`,
            borderRadius: 8, overflow: "visible",
            display: "flex", flexDirection: "column",
          }}
        >
          {/* Archive header */}
          <div style={{
            padding: "16px 20px 14px",
            borderBottom: `1px solid rgba(212,175,55,0.22)`,
            background: "rgba(212,175,55,0.03)",
            display: "flex", alignItems: "flex-start",
            justifyContent: "space-between", gap: 12,
          }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                <Archive size={15} style={{ color: CLR.gold }} />
                <span style={{
                  fontSize: 12, fontWeight: 700, letterSpacing: "0.12em",
                  color: CLR.gold, textTransform: "uppercase" as const,
                }}>
                  Global Case Archive
                </span>
                <span style={{
                  fontSize: 9, fontWeight: 700, letterSpacing: "0.1em",
                  color: CLR.gold, background: "rgba(212,175,55,0.12)",
                  border: "1px solid rgba(212,175,55,0.3)", borderRadius: 4,
                  padding: "2px 7px", textTransform: "uppercase" as const,
                }}>
                  {tableLoading ? "…" : `${caseTotal.toLocaleString()} records`}
                </span>
              </div>
              <p style={{ fontSize: 10.5, color: "rgba(148,163,184,0.75)", margin: 0, lineHeight: "1.5" }}>
                Browse normalized cases by date, source, severity, CVE, replay state, and doctrine status.
              </p>
            </div>

            {/* Sort + replay + back controls */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0, flexWrap: "wrap" as const }}>
              {canManageSources && (
                <>
              {/* Refresh Replay Eligibility */}
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <button
                  onClick={handleRefreshEligibility}
                  disabled={eligRefreshing || batchReplaying}
                  title="Re-run doctrine enrichment on linked cases with replay_eligibility=false"
                  style={{
                    display: "flex", alignItems: "center", gap: 5,
                    background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.3)",
                    borderRadius: 5, padding: "4px 10px",
                    cursor: eligRefreshing || batchReplaying ? "not-allowed" : "pointer",
                    fontSize: 10, color: "#8B5CF6", height: 27, fontWeight: 600,
                    opacity: eligRefreshing ? 0.7 : 1,
                  }}
                >
                  {eligRefreshing
                    ? <Loader2 size={10} style={{ animation: "spin 1s linear infinite" }} />
                    : <Zap size={10} />}
                  {eligRefreshing ? "Refreshing…" : "Refresh Eligibility"}
                </button>
                {eligResult && !eligRefreshing && (
                  <span style={{ fontSize: 9.5, color: "#8B5CF6" }}>
                    ✓ {eligResult.updated} updated
                  </span>
                )}
                {eligError && !eligRefreshing && (
                  <span style={{ fontSize: 9.5, color: CLR.red }}>{eligError}</span>
                )}
              </div>

              <div style={{ width: 1, height: 18, background: CLR.border }} />

              {/* Compact Batch Replay */}
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <select
                  value={batchLimit}
                  onChange={(e) => setBatchLimit(Number(e.target.value) as 25 | 50 | 100)}
                  disabled={batchReplaying}
                  style={{
                    background: "rgba(10,12,18,0.9)", border: `1px solid rgba(16,185,129,0.25)`,
                    borderRadius: 5, padding: "3px 6px", fontSize: 10,
                    color: "#10B981", cursor: "pointer", outline: "none", height: 27,
                  }}
                >
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <button
                  onClick={handleBatchReplay}
                  disabled={batchReplaying}
                  title="Run batch replay for eligible cases"
                  style={{
                    display: "flex", alignItems: "center", gap: 5,
                    background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)",
                    borderRadius: 5, padding: "4px 10px", cursor: batchReplaying ? "not-allowed" : "pointer",
                    fontSize: 10, color: "#10B981", height: 27, fontWeight: 600,
                    opacity: batchReplaying ? 0.7 : 1,
                  }}
                >
                  {batchReplaying
                    ? <Loader2 size={10} style={{ animation: "spin 1s linear infinite" }} />
                    : <Play size={10} />}
                  {batchReplaying ? "Running…" : "Batch Replay"}
                </button>
                {batchReplayResult && !batchReplaying && (
                  <span style={{ fontSize: 9.5, color: "#10B981" }}>
                    ✓ {batchReplayResult.replayed}
                  </span>
                )}
              </div>

              <div style={{ width: 1, height: 18, background: CLR.border }} />

                </>
              )}

              <span style={{ fontSize: 9.5, color: CLR.muted, letterSpacing: "0.07em" }}>SORT</span>
              <select
                value={sortBy}
                onChange={handleSortSelect}
                style={{
                  background: "rgba(10,12,18,0.9)", border: `1px solid ${CLR.border}`,
                  borderRadius: 5, padding: "4px 8px", fontSize: 10.5,
                  color: CLR.text, cursor: "pointer", outline: "none", height: 27,
                }}
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <button
                onClick={() => setSortDir((d) => d === "asc" ? "desc" : "asc")}
                title={sortDir === "desc" ? "Descending — click to reverse" : "Ascending — click to reverse"}
                style={{
                  background: "rgba(255,255,255,0.04)", border: `1px solid ${CLR.border}`,
                  borderRadius: 5, padding: "4px 8px", cursor: "pointer",
                  fontSize: 10, color: CLR.muted, height: 27,
                }}
              >
                {sortDir === "desc" ? "↓" : "↑"}
              </button>
              <button
                onClick={() => setViewMode("overview")}
                style={{
                  display: "flex", alignItems: "center", gap: 5,
                  background: "rgba(255,255,255,0.04)", border: `1px solid ${CLR.border}`,
                  borderRadius: 5, padding: "4px 10px", cursor: "pointer",
                  fontSize: 10, color: CLR.muted, height: 27,
                }}
              >
                <ChevronLeft size={11} /> Overview
              </button>
            </div>
          </div>

          {/* Filters */}
          <div style={{
            padding: "12px 20px",
            borderBottom: `1px solid ${CLR.border}`,
            background: "rgba(0,0,0,0.15)",
          }}>
            <CaseLibraryFilters
              filters={filters}
              onChange={handleFilterChange}
              onReset={handleFilterReset}
              uniqueTypes={archiveTypes}
              uniqueSources={archiveSources}
              uniqueChains={archiveChains}
              severities={archiveSeverities}
              replayStatuses={archiveReplayStatuses}
              doctrineStatuses={archiveDoctrineStatuses}
              caseStatuses={archiveCaseStatuses}
              facetsLoading={facetsLoading}
            />
          </div>

          {/* Table */}
          <CaseLibraryTable
            cases={cases}
            total={caseTotal}
            page={page}
            pageSize={PAGE_SIZE}
            sortBy={sortBy}
            sortDir={sortDir}
            loading={tableLoading}
            hasAnyFilter={hasAnyFilter}
            onSort={handleSort}
            onPageChange={setPage}
            onRowClick={handleRowClick}
          />
        </section>
      )}

      {/* ── Critical ───────────────────────────────────────────────────────── */}
      {viewMode === "critical" && (
        <section
          id="global-case-archive"
          style={{
            background: CLR.surface, border: `1px solid rgba(212,175,55,0.28)`,
            borderRadius: 8, overflow: "visible",
            display: "flex", flexDirection: "column",
          }}
        >
          {/* Critical header */}
          <div style={{
            padding: "16px 20px 14px",
            borderBottom: `1px solid rgba(212,175,55,0.22)`,
            background: "rgba(212,175,55,0.03)",
            display: "flex", alignItems: "flex-start",
            justifyContent: "space-between", gap: 12,
          }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                <Archive size={15} style={{ color: CLR.gold }} />
                <span style={{
                  fontSize: 12, fontWeight: 700, letterSpacing: "0.12em",
                  color: CLR.gold, textTransform: "uppercase" as const,
                }}>
                  Critical Cases
                </span>
                <span style={{
                  fontSize: 9, fontWeight: 700, letterSpacing: "0.1em",
                  color: CLR.gold, background: "rgba(212,175,55,0.12)",
                  border: "1px solid rgba(212,175,55,0.3)", borderRadius: 4,
                  padding: "2px 7px", textTransform: "uppercase" as const,
                }}>
                  {tableLoading ? "…" : `${caseTotal.toLocaleString()} records`}
                </span>
              </div>
              <p style={{ fontSize: 10.5, color: "rgba(148,163,184,0.75)", margin: 0, lineHeight: "1.5" }}>
              Highest-severity vulnerabilities and incidents prioritized for case-indexed coverage, doctrine coverage, and operator review.
              </p>
            </div>

            
          </div>

          {/* Table */}
          <CaseLibraryTable
            cases={cases}
            total={caseTotal}
            page={page}
            pageSize={PAGE_SIZE}
            sortBy={sortBy}
            sortDir={sortDir}
            loading={tableLoading}
            hasAnyFilter={hasAnyFilter}
            onSort={handleSort}
            onPageChange={setPage}
            onRowClick={handleRowClick}
          />
        </section>
      )}

      {/* Case preview drawer — available in both modes */}
      {selectedCase && (
        <CasePreviewDrawer
          key={`${selectedCase.caseId}:${selectedCase.updatedAt}`}
          record={selectedCase}
          onClose={() => setSelectedCase(null)}
          onRefresh={() => { loadMeta(); loadCases(); }}
        />
      )}
    </div>
  );
}
