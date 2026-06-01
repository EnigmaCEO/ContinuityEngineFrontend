"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, ChevronLeft, ChevronRight, RefreshCw, Search, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import type {
  ArchiveFacetOption,
  CaseLibraryRecord,
  CaseLibraryTableSortKey,
  CaseSeverity,
  CaseStatus,
  DoctrineStatus,
  ReplayStatus,
} from "@/lib/case-library/types";
import { fetchArchiveFacets, fetchCases } from "@/lib/case-library/service";
import { CLR, doctrineColor, formatTs } from "@/lib/case-library/utils";
import { SeverityBadge } from "@/components/case-library/badges/SeverityBadge";
import { StatusBadge } from "@/components/case-library/badges/StatusBadge";

const PAGE_SIZE = 25;

type IncidentFilters = {
  search: string;
  severity: CaseSeverity | "";
  status: CaseStatus | "";
  source: string;
};

const EMPTY_FILTERS: IncidentFilters = {
  search: "",
  severity: "",
  status: "",
  source: "",
};

const STATIC_SEVERITIES: ArchiveFacetOption[] = [
  { value: "critical", label: "Critical", count: 0 },
  { value: "high", label: "High", count: 0 },
  { value: "medium", label: "Medium", count: 0 },
  { value: "low", label: "Low", count: 0 },
];

const STATIC_STATUSES: ArchiveFacetOption[] = [
  { value: "ingested", label: "Ingested", count: 0 },
  { value: "normalized", label: "Normalized", count: 0 },
  { value: "classified", label: "Classified", count: 0 },
  { value: "replay_ready", label: "Validation Ready", count: 0 },
  { value: "doctrine_tagged", label: "Doctrine Tagged", count: 0 },
  { value: "verified", label: "Verified", count: 0 },
  { value: "needs_review", label: "Needs Review", count: 0 },
];

function SelectFilter({
  value,
  onChange,
  options,
  placeholder,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  options: ArchiveFacetOption[];
  placeholder: string;
  disabled?: boolean;
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      disabled={disabled}
      style={{
        background: "rgba(10,12,18,0.9)",
        border: `1px solid ${CLR.border}`,
        borderRadius: 5,
        color: value ? CLR.text : CLR.muted,
        cursor: disabled ? "not-allowed" : "pointer",
        fontSize: 10.5,
        height: 29,
        minWidth: 118,
        outline: "none",
        padding: "4px 8px",
      }}
    >
      <option value="">{disabled ? `${placeholder} loading` : placeholder}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.count > 0 ? `${option.label} (${option.count})` : option.label}
        </option>
      ))}
    </select>
  );
}

function replayLabel(status: ReplayStatus): string {
  switch (status) {
    case "passed":
      return "Case Indexed";
    case "available":
      return "Awaiting Validation";
    case "failed":
      return "Validation Failed";
    case "pending":
      return "Validation Pending";
    default:
      return "No Validation";
  }
}

function replayColor(status: ReplayStatus): string {
  switch (status) {
    case "passed":
      return CLR.green;
    case "available":
      return CLR.blue;
    case "failed":
      return CLR.red;
    case "pending":
      return CLR.gold;
    default:
      return CLR.muted;
  }
}

function coverageLabel(status: DoctrineStatus): string {
  if (status === "linked" || status === "updated") return "Response Coverage";
  if (status === "pending") return "Coverage Pending";
  return "No Coverage";
}

function Pill({ label, color }: { label: string; color: string }) {
  return (
    <span
      style={{
        border: `1px solid ${color}38`,
        borderRadius: 4,
        background: `${color}18`,
        color,
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: "0.07em",
        padding: "2px 6px",
        textTransform: "uppercase",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
  );
}

function EmptyRows({ hasFilters }: { hasFilters: boolean }) {
  return (
    <tr>
      <td colSpan={8} style={{ padding: "52px 20px", textAlign: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
          <AlertTriangle size={30} style={{ color: "rgba(212,175,55,0.18)" }} />
          <div style={{ color: "rgba(148,163,184,0.75)", fontSize: 13, fontWeight: 700 }}>
            {hasFilters ? "No incidents match these filters" : "No incident records available"}
          </div>
          <div style={{ color: CLR.muted, fontSize: 10.5 }}>
            {hasFilters ? "Adjust severity, status, source, or search text." : "Run Case Library source sync to populate normalized intelligence."}
          </div>
        </div>
      </td>
    </tr>
  );
}

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 8 }, (_, idx) => (
        <tr key={idx} style={{ borderBottom: `1px solid rgba(212,175,55,0.06)` }}>
          {Array.from({ length: 8 }, (_, col) => (
            <td key={col} style={{ padding: "10px 12px" }}>
              <div
                style={{
                  height: 10,
                  width: col === 0 ? "82%" : "58%",
                  borderRadius: 3,
                  background: "rgba(255,255,255,0.05)",
                }}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

function tagsFor(caseRecord: CaseLibraryRecord): string[] {
  return [
    ...new Set([
      ...(caseRecord.tags ?? []),
      caseRecord.subsystem,
      caseRecord.type,
      ...(caseRecord.doctrineTags ?? []).slice(0, 2),
    ].filter(Boolean) as string[]),
  ].slice(0, 4);
}

function incidentDate(caseRecord: CaseLibraryRecord): string | undefined {
  return caseRecord.sourceRefs?.find((ref) => ref.observedAt)?.observedAt ?? caseRecord.ingestedAt;
}

export default function IncidentsPage() {
  const router = useRouter();
  const [records, setRecords] = useState<CaseLibraryRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<IncidentFilters>(EMPTY_FILTERS);
  const [facets, setFacets] = useState<{ sources: ArchiveFacetOption[]; severities: ArchiveFacetOption[]; statuses: ArchiveFacetOption[] }>({
    sources: [],
    severities: [],
    statuses: [],
  });
  const [loading, setLoading] = useState(true);
  const [facetsLoading, setFacetsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hasFilters = !!filters.search || !!filters.severity || !!filters.status || !!filters.source;

  const loadFacets = useCallback(async () => {
    setFacetsLoading(true);
    try {
      const response = await fetchArchiveFacets();
      setFacets({
        sources: response.sources,
        severities: response.severities.length ? response.severities : STATIC_SEVERITIES,
        statuses: response.caseStatuses.length ? response.caseStatuses : STATIC_STATUSES,
      });
    } finally {
      setFacetsLoading(false);
    }
  }, []);

  const loadIncidents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchCases({
        search: filters.search || undefined,
        severity: filters.severity || undefined,
        source: filters.source || undefined,
        status: filters.status || undefined,
        page,
        pageSize: PAGE_SIZE,
        sortBy: "ingestedAt" as CaseLibraryTableSortKey,
        sortDir: "desc",
      });
      setRecords(response.items);
      setTotal(response.total);
    } catch (err) {
      setError((err as Error).message ?? "Failed to load incidents.");
    } finally {
      setLoading(false);
    }
  }, [filters.search, filters.severity, filters.source, filters.status, page]);

  useEffect(() => {
    void loadFacets();
  }, [loadFacets]);

  useEffect(() => {
    void loadIncidents();
  }, [loadIncidents]);

  const visiblePages = useMemo(() => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, idx) => idx + 1);
    return Array.from(new Set([1, Math.max(1, page - 1), page, Math.min(totalPages, page + 1), totalPages])).sort((a, b) => a - b);
  }, [page, totalPages]);

  function updateFilters(patch: Partial<IncidentFilters>) {
    setFilters((current) => ({ ...current, ...patch }));
    setPage(1);
  }

  return (
    <div style={{ minHeight: "100%", background: CLR.bg, padding: "22px 18px 28px" }}>
      <header
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 16,
          marginBottom: 18,
          paddingBottom: 18,
          borderBottom: `1px solid ${CLR.border}`,
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
          <div
            style={{
              alignItems: "center",
              background: "rgba(249,115,22,0.1)",
              border: "1px solid rgba(249,115,22,0.35)",
              borderRadius: 8,
              display: "flex",
              height: 42,
              justifyContent: "center",
              width: 42,
            }}
          >
            <AlertTriangle size={20} style={{ color: CLR.orange }} />
          </div>
          <div>
            <div style={{ color: CLR.gold, fontSize: 9, fontWeight: 700, letterSpacing: "0.16em", marginBottom: 6 }}>
              GLOBAL INTELLIGENCE
            </div>
            <h1 style={{ color: CLR.text, fontSize: 20, fontWeight: 750, letterSpacing: "0.06em", margin: 0 }}>
              Incidents
            </h1>
            <p style={{ color: "rgba(140,140,170,0.78)", fontSize: 12, lineHeight: 1.55, margin: "7px 0 0", maxWidth: 650 }}>
              Normalized Case Library records presented as incident intelligence with case-indexed coverage and response coverage.
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            void loadFacets();
            void loadIncidents();
          }}
          style={{
            alignItems: "center",
            background: "rgba(255,255,255,0.04)",
            border: `1px solid ${CLR.border}`,
            borderRadius: 5,
            color: CLR.muted,
            cursor: "pointer",
            display: "flex",
            fontSize: 10.5,
            gap: 6,
            height: 30,
            padding: "5px 10px",
          }}
        >
          <RefreshCw size={12} />
          Refresh
        </button>
      </header>

      {error && (
        <div
          style={{
            alignItems: "center",
            background: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.3)",
            borderRadius: 7,
            color: "#FCA5A5",
            display: "flex",
            fontSize: 11,
            gap: 8,
            marginBottom: 12,
            padding: "10px 12px",
          }}
        >
          <AlertTriangle size={13} />
          {error}
        </div>
      )}

      <section style={{ background: CLR.surface, border: `1px solid rgba(212,175,55,0.22)`, borderRadius: 8, overflow: "hidden" }}>
        <div
          style={{
            alignItems: "center",
            background: "rgba(212,175,55,0.03)",
            borderBottom: `1px solid ${CLR.border}`,
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            justifyContent: "space-between",
            padding: "13px 16px",
          }}
        >
          <div>
            <div style={{ color: CLR.gold, fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}>
              Incident Queue
            </div>
            <div style={{ color: CLR.muted, fontSize: 10.5, marginTop: 3 }}>
              {loading ? "Loading records" : `${total.toLocaleString()} records`}
            </div>
          </div>

          <div style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 7 }}>
            <div style={{ position: "relative" }}>
              <Search size={11} style={{ color: CLR.muted, left: 8, position: "absolute", top: "50%", transform: "translateY(-50%)" }} />
              <input
                value={filters.search}
                onChange={(event) => updateFilters({ search: event.target.value })}
                placeholder="Search incidents"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: `1px solid ${CLR.border}`,
                  borderRadius: 5,
                  color: CLR.text,
                  fontSize: 10.5,
                  height: 29,
                  outline: "none",
                  padding: "4px 8px 4px 26px",
                  width: 210,
                }}
              />
            </div>
            <SelectFilter
              value={filters.severity}
              onChange={(value) => updateFilters({ severity: value as CaseSeverity | "" })}
              options={facets.severities}
              placeholder="Severity"
              disabled={facetsLoading && facets.severities.length === 0}
            />
            <SelectFilter
              value={filters.status}
              onChange={(value) => updateFilters({ status: value as CaseStatus | "" })}
              options={facets.statuses}
              placeholder="Status"
              disabled={facetsLoading && facets.statuses.length === 0}
            />
            <SelectFilter
              value={filters.source}
              onChange={(value) => updateFilters({ source: value })}
              options={facets.sources}
              placeholder="Source"
              disabled={facetsLoading && facets.sources.length === 0}
            />
            {hasFilters && (
              <button
                onClick={() => {
                  setFilters(EMPTY_FILTERS);
                  setPage(1);
                }}
                style={{
                  alignItems: "center",
                  background: "transparent",
                  border: `1px solid ${CLR.border}`,
                  borderRadius: 5,
                  color: CLR.muted,
                  cursor: "pointer",
                  display: "flex",
                  fontSize: 10,
                  gap: 4,
                  height: 29,
                  padding: "4px 9px",
                }}
              >
                <XCircle size={10} />
                Clear
              </button>
            )}
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ borderCollapse: "collapse", tableLayout: "fixed", width: "100%" }}>
            <colgroup>
              <col />
              <col style={{ width: 112 }} />
              <col style={{ width: 82 }} />
              <col style={{ width: 118 }} />
              <col style={{ width: 112 }} />
              <col style={{ width: 172 }} />
              <col style={{ width: 126 }} />
              <col style={{ width: 136 }} />
            </colgroup>
            <thead>
              <tr style={{ borderBottom: `1px solid ${CLR.border}`, height: 32 }}>
                {["Title", "Source", "Severity", "Status", "Published / Discovered", "Tags / Threat Family", "Case Indexed", "Response Coverage"].map((header) => (
                  <th
                    key={header}
                    style={{
                      color: CLR.muted,
                      fontSize: 8.5,
                      fontWeight: 700,
                      letterSpacing: "0.1em",
                      padding: "0 12px",
                      textAlign: "left",
                      textTransform: "uppercase",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <SkeletonRows />
              ) : records.length === 0 ? (
                <EmptyRows hasFilters={hasFilters} />
              ) : (
                records.map((record, idx) => {
                  const tagValues = tagsFor(record);
                  const displayDate = incidentDate(record);
                  return (
                    <tr
                      key={record.caseId}
                      onClick={() => router.push(`/dashboard/incidents/${encodeURIComponent(record.caseId)}`)}
                      style={{
                        background: idx % 2 !== 0 ? "rgba(255,255,255,0.012)" : "transparent",
                        borderBottom: "1px solid rgba(212,175,55,0.06)",
                        cursor: "pointer",
                      }}
                      onMouseEnter={(event) => {
                        event.currentTarget.style.background = "rgba(212,175,55,0.05)";
                      }}
                      onMouseLeave={(event) => {
                        event.currentTarget.style.background = idx % 2 !== 0 ? "rgba(255,255,255,0.012)" : "transparent";
                      }}
                    >
                      <td style={{ padding: "9px 12px" }}>
                        <div style={{ color: CLR.text, fontSize: 11.5, lineHeight: 1.35, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {record.title || "Untitled incident"}
                        </div>
                        <div style={{ color: CLR.muted, fontFamily: "var(--font-geist-mono,monospace)", fontSize: 9, marginTop: 3 }}>
                          {record.caseId}
                        </div>
                      </td>
                      <td style={{ color: CLR.muted, fontSize: 10.5, padding: "9px 12px" }}>{record.source || "Unknown"}</td>
                      <td style={{ padding: "9px 12px" }}>
                        <SeverityBadge severity={record.severity} />
                      </td>
                      <td style={{ padding: "9px 12px" }}>
                        <StatusBadge status={record.status} />
                      </td>
                      <td style={{ color: CLR.muted, fontFamily: "var(--font-geist-mono,monospace)", fontSize: 9.5, padding: "9px 12px" }}>
                        {displayDate ? formatTs(displayDate) : "Unavailable"}
                      </td>
                      <td style={{ padding: "9px 12px" }}>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                          {tagValues.length > 0 ? (
                            tagValues.map((tag) => (
                              <span
                                key={tag}
                                style={{
                                  background: "rgba(255,255,255,0.04)",
                                  border: `1px solid ${CLR.border}`,
                                  borderRadius: 4,
                                  color: CLR.muted,
                                  fontSize: 9,
                                  padding: "2px 5px",
                                }}
                              >
                                {tag}
                              </span>
                            ))
                          ) : (
                            <span style={{ color: "rgba(140,140,170,0.42)", fontSize: 10 }}>Unavailable</span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: "9px 12px" }}>
                        <Pill label={replayLabel(record.replayStatus)} color={replayColor(record.replayStatus)} />
                      </td>
                      <td style={{ padding: "9px 12px" }}>
                        <Pill label={coverageLabel(record.doctrineStatus)} color={doctrineColor(record.doctrineStatus)} />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div
          style={{
            alignItems: "center",
            borderTop: `1px solid ${CLR.border}`,
            display: "flex",
            justifyContent: "space-between",
            padding: "10px 14px",
          }}
        >
          <span style={{ color: CLR.muted, fontSize: 10 }}>
            Page {page} of {totalPages}
          </span>
          <div style={{ display: "flex", gap: 4 }}>
            <button
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={page === 1}
              style={pagerStyle(page === 1)}
            >
              <ChevronLeft size={11} />
            </button>
            {visiblePages.map((pageNumber) => (
              <button
                key={pageNumber}
                onClick={() => setPage(pageNumber)}
                style={pagerStyle(false, pageNumber === page)}
              >
                {pageNumber}
              </button>
            ))}
            <button
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              disabled={page === totalPages}
              style={pagerStyle(page === totalPages)}
            >
              <ChevronRight size={11} />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function pagerStyle(disabled: boolean, active = false): React.CSSProperties {
  return {
    alignItems: "center",
    background: active ? "rgba(212,175,55,0.15)" : "rgba(255,255,255,0.04)",
    border: active ? "1px solid rgba(212,175,55,0.5)" : `1px solid ${CLR.border}`,
    borderRadius: 4,
    color: active ? CLR.gold : disabled ? CLR.muted : CLR.text,
    cursor: disabled ? "default" : "pointer",
    display: "flex",
    fontSize: 10,
    fontWeight: active ? 700 : 400,
    justifyContent: "center",
    minWidth: 27,
    opacity: disabled ? 0.35 : 1,
    padding: "4px 8px",
  };
}
