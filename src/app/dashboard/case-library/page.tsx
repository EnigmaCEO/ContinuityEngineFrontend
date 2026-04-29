"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import type {
  CaseLibrarySummaryStats,
  CaseLibraryActivityItem,
  CaseLibraryMetrics,
  CaseLibraryRecord,
  BatchReplayResult,
} from "@/lib/case-library/types";
import type { CaseLibraryTableSortKey, CaseSeverity  } from "@/lib/case-library/types";
import {
  fetchSummaryStats, fetchCases, fetchActivity, fetchMetrics, triggerSync,
  batchRunReplay,
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
import { AlertTriangle, RefreshCw, Archive, LayoutDashboard, ChevronLeft, Play, Loader2 } from "lucide-react";

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
  // ── Data state ──────────────────────────────────────────────────────────────
  const [summary,       setSummary]       = useState<CaseLibrarySummaryStats | null>(null);
  const [cases,         setCases]         = useState<CaseLibraryRecord[]>([]);
  const [caseTotal,     setCaseTotal]     = useState(0);
  const [activity,      setActivity]      = useState<CaseLibraryActivityItem[]>([]);
  const [metrics,       setMetrics]       = useState<CaseLibraryMetrics | null>(null);
  const [selectedCase,  setSelectedCase]  = useState<CaseLibraryRecord | null>(null);

  // ── Loading / error state ───────────────────────────────────────────────────
  const [summaryLoading,  setSummaryLoading]  = useState(true);
  const [tableLoading,    setTableLoading]    = useState(true);
  const [activityLoading, setActivityLoading] = useState(true);
  const [metricsLoading,  setMetricsLoading]  = useState(true);
  const [error,           setError]           = useState<string | null>(null);
  const [syncing,         setSyncing]         = useState(false);

  // ── Batch replay state ──────────────────────────────────────────────────────
  const [batchReplaying,    setBatchReplaying]    = useState(false);
  const [batchReplayResult, setBatchReplayResult] = useState<BatchReplayResult | null>(null);
  const [batchLimit,        setBatchLimit]        = useState<25 | 50 | 100>(50);

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
  const seenTypes   = useRef(new Set<string>());
  const seenSources = useRef(new Set<string>());
  const seenChains  = useRef(new Set<string>());
  const [liveTypes,   setLiveTypes]   = useState<string[]>([]);
  const [liveSources, setLiveSources] = useState<string[]>([]);
  const [liveChains,  setLiveChains]  = useState<string[]>([]);

  // ── Load summary + activity + metrics once on mount ────────────────────────
  const loadMeta = useCallback(async () => {
    setError(null);
    setSummaryLoading(true);
    setActivityLoading(true);
    setMetricsLoading(true);
    try {
      const [s, a, m] = await Promise.all([
        fetchSummaryStats(),
        fetchActivity(),
        fetchMetrics(),
      ]);
      setSummary(s);
      setActivity(a);
      setMetrics(m);
    } catch (e) {
      setError((e as Error).message ?? "Failed to load case library data.");
    } finally {
      setSummaryLoading(false);
      setActivityLoading(false);
      setMetricsLoading(false);
    }
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
  
      let typesChanged = false;
      let sourcesChanged = false;
      let chainsChanged = false;
  
      for (const c of res.items) {
        if (c.type && !seenTypes.current.has(c.type)) {
          seenTypes.current.add(c.type);
          typesChanged = true;
        }
  
        if (c.chainSystem && !seenChains.current.has(c.chainSystem)) {
          seenChains.current.add(c.chainSystem);
          chainsChanged = true;
        }
  
        const allSources = c.sources && c.sources.length > 0
          ? Array.from(new Set([c.source, ...c.sources]))
          : [c.source];
  
        for (const s of allSources) {
          if (s && !seenSources.current.has(s)) {
            seenSources.current.add(s);
            sourcesChanged = true;
          }
        }
      }
  
      if (typesChanged) setLiveTypes([...seenTypes.current].sort());
      if (sourcesChanged) setLiveSources([...seenSources.current].sort());
      if (chainsChanged) setLiveChains([...seenChains.current].sort());
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
              uniqueTypes={liveTypes}
              uniqueSources={liveSources}
              uniqueChains={liveChains}
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
              Highest-severity vulnerabilities and incidents prioritized for replay validation, doctrine coverage, and operator review.
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
