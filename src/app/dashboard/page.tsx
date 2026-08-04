"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import {
  Activity,
  AlertTriangle,
  BookOpen,
  Building2,
  Cpu,
  Eye,
  EyeOff,
  FolderOpen,
  LayoutDashboard,
  Network,
  Settings,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Zap,
  type LucideIcon,
} from "lucide-react";

import { useSession } from "@/components/layout/SessionContext";
import {
  fetchDashboardOverview,
  fetchIncidentsOverview,
} from "@/lib/case-library/service";
import type {
  CaseLibraryActivityItem,
  CaseLibraryMetrics,
  CaseLibrarySummaryStats,
  DashboardCriticalCase,
  DashboardCriticalIntelligence,
  DoctrineOverviewResponse,
  IncidentsOverviewResponse,
  ThreatMatrixOverviewResponse,
} from "@/lib/case-library/types";
import { fetchProjectAccountOverview } from "@/lib/project-map/service";
import type { ProjectAccountOverview } from "@/lib/project-map/types";
import { fetchAdminSummary } from "@/lib/saas/service";

const GOLD = "#D4AF37";
const PURPLE = "#2A1F4A";
const MUTED = "rgba(140,140,170,0.65)";
const TEXT = "#E2E8F0";
const CARD: CSSProperties = {
  background: "rgba(10,12,18,0.92)",
  border: "1px solid rgba(212,175,55,0.16)",
  borderRadius: 8,
  padding: "13px 15px",
};

type Loadable<T> = {
  data: T | null;
  loading: boolean;
  error: boolean;
};

type AdminCounts = {
  accounts: number;
  users: number;
  accessRequests: number;
};

function loadable<T>(): Loadable<T> {
  return { data: null, loading: true, error: false };
}

function sparklinePath(data: number[], w: number, h: number): string {
  const safe = data.length > 1 ? data : [0, ...(data.length ? data : [0])];
  const max = Math.max(...safe);
  const min = Math.min(...safe);
  const range = max - min || 1;
  const pad = h * 0.1;
  return safe
    .map((v, i) => ({
      x: (i / (safe.length - 1)) * w,
      y: pad + (h - pad * 2) * (1 - (v - min) / range),
    }))
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(" ");
}

function Sparkline({
  data,
  color,
  w = 88,
  h = 22,
}: {
  data: number[];
  color: string;
  w?: number;
  h?: number;
}) {
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} style={{ display: "block" }}>
      <path
        d={sparklinePath(data, w, h)}
        fill="none"
        stroke={color}
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function donutArcPath(startDeg: number, endDeg: number, cx: number, cy: number, or: number, ir: number): string {
  const rad = (deg: number) => (deg * Math.PI) / 180;
  const s = rad(startDeg);
  const e = rad(endDeg);
  const large = endDeg - startDeg > 180 ? 1 : 0;
  const f = (n: number) => n.toFixed(2);
  return [
    `M ${f(cx + or * Math.cos(s))} ${f(cy + or * Math.sin(s))}`,
    `A ${or} ${or} 0 ${large} 1 ${f(cx + or * Math.cos(e))} ${f(cy + or * Math.sin(e))}`,
    `L ${f(cx + ir * Math.cos(e))} ${f(cy + ir * Math.sin(e))}`,
    `A ${ir} ${ir} 0 ${large} 0 ${f(cx + ir * Math.cos(s))} ${f(cy + ir * Math.sin(s))}`,
    "Z",
  ].join(" ");
}

function formatCount(value: number | null | undefined): string {
  if (typeof value !== "number" || Number.isNaN(value)) return "Unavailable";
  return value.toLocaleString();
}

function formatPct(value: number | null | undefined): string {
  if (typeof value !== "number" || Number.isNaN(value)) return "Unavailable";
  return `${Math.round(value)}%`;
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) return "Unavailable";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unavailable";
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatRelativeTime(value: string | null | undefined): string {
  if (!value) return "Unavailable";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unavailable";
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.max(0, Math.round(diffMs / 60000));
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return `${Math.round(diffHr / 24)}d ago`;
}

function replayStatusForCase(caseItem: DashboardCriticalCase): { label: string; color: string } {
  if (caseItem.replayStatus === "passed") return { label: "CASE INDEXED", color: "#22C55E" };
  if (caseItem.replayEligibility === true) return { label: "READY FOR VALIDATION", color: GOLD };
  if (caseItem.replayEligibility === false) return { label: "NOT READY FOR VALIDATION", color: "rgba(148,163,184,0.85)" };
  return { label: "VALIDATION MISSING", color: "#EF4444" };
}

function caseTimestamp(caseItem: DashboardCriticalCase): string | null {
  return caseItem.ingestedAt || caseItem.updatedAt || null;
}

function compareRecentCases(a: DashboardCriticalCase, b: DashboardCriticalCase): number {
  return new Date(caseTimestamp(b) ?? 0).getTime() - new Date(caseTimestamp(a) ?? 0).getTime();
}

function formatIncidentDate(value: string | null | undefined): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function incidentSeverityColor(severity: string | null | undefined): string {
  if (severity === "critical") return "#EF4444";
  if (severity === "high") return "#F97316";
  if (severity === "medium") return GOLD;
  return "#22C55E";
}

function coveragePendingCount(data: IncidentsOverviewResponse | null): number | null {
  if (!data) return null;
  return Math.max(0, data.total_incidents - data.incidents_with_response_coverage);
}

function isOperatorRole(role: string | null | undefined): boolean {
  return role === "super_admin" || role === "sce_operator";
}

function toActivityTitle(item: CaseLibraryActivityItem): string {
  if (item.category === "sync") return "SYNC";
  if (item.category === "replay") return "VALIDATION";
  if (item.category === "doctrine") return "DOCTRINE";
  if (item.category === "error") return "ERROR";
  return item.category.toUpperCase();
}

function toneForSeverity(severity?: string): string {
  if (severity === "critical" || severity === "high") return "#EF4444";
  if (severity === "medium") return GOLD;
  return "#22C55E";
}

function formatFindingType(value: string): string {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatLabel(value: string | null | undefined): string {
  if (!value) return "Unavailable";
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function SectionHead({
  icon: Icon,
  title,
  action,
  href,
}: {
  icon: LucideIcon;
  title: string;
  action?: string;
  href?: string;
}) {
  const actionNode = action ? (
    <span
      style={{
        fontSize: 9,
        color: "rgba(212,175,55,0.65)",
        letterSpacing: "0.07em",
      }}
    >
      {action}
    </span>
  ) : null;

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 11,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
        <div
          style={{
            width: 18,
            height: 18,
            borderRadius: "50%",
            background: "rgba(212,175,55,0.1)",
            border: "1px solid rgba(212,175,55,0.28)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon size={9} style={{ color: GOLD }} />
        </div>
        <span
          style={{
            fontSize: 9.5,
            fontWeight: 600,
            letterSpacing: "0.13em",
            color: GOLD,
            textTransform: "uppercase",
          }}
        >
          {title}
        </span>
      </div>
      {href && action ? (
        <Link href={href} prefetch={false} style={{ textDecoration: "none" }}>
          {actionNode}
        </Link>
      ) : (
        actionNode
      )}
    </div>
  );
}

function StatusPill({ label, color }: { label: string; color: string }) {
  return (
    <span
      style={{
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: "0.08em",
        color,
        background: `${color}18`,
        border: `1px solid ${color}40`,
        borderRadius: 4,
        padding: "2px 7px",
      }}
    >
      {label}
    </span>
  );
}

function LoadingOrUnavailable({
  loading,
  error,
}: {
  loading: boolean;
  error: boolean;
}) {
  if (loading) return <div style={{ fontSize: 11, color: MUTED }}>Loading...</div>;
  if (error) return <div style={{ fontSize: 11, color: "#FCA5A5" }}>Unavailable</div>;
  return null;
}

export default function DashboardPage() {
  const me = useSession();
  const role = me?.effectiveRole ?? me?.currentRole ?? null;
  const realRole = me?.realRole ?? me?.currentRole ?? null;
  const isOperator = isOperatorRole(role);
  const renderCountRef = useRef(0);
  const dashboardLoadedRef = useRef(false);
  const projectLoadedRef = useRef(false);
  const incidentsLoadedRef = useRef(false);
  const [criticalWindow, setCriticalWindow] = useState<"24h" | "7d" | "30d">("7d");

  const [summary, setSummary] = useState<Loadable<CaseLibrarySummaryStats>>(loadable());
  const [metrics, setMetrics] = useState<Loadable<CaseLibraryMetrics>>(loadable());
  const [doctrine, setDoctrine] = useState<Loadable<DoctrineOverviewResponse>>(loadable());
  const [threats, setThreats] = useState<Loadable<ThreatMatrixOverviewResponse>>(loadable());
  const [activity, setActivity] = useState<Loadable<CaseLibraryActivityItem[]>>(loadable());
  const [criticalIntel, setCriticalIntel] = useState<Loadable<DashboardCriticalIntelligence>>(loadable());
  const [incidents, setIncidents] = useState<Loadable<IncidentsOverviewResponse>>(loadable());
  const [projectOverview, setProjectOverview] = useState<Loadable<ProjectAccountOverview>>(loadable());
  const [adminCounts, setAdminCounts] = useState<Loadable<AdminCounts>>({
    data: null,
    loading: isOperator,
    error: false,
  });

  renderCountRef.current += 1;
  console.info(`[dashboard:render] count=${renderCountRef.current} window=${criticalWindow}`);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    async function load() {
      if (dashboardLoadedRef.current) {
        setSummary((current) => ({ data: current.data, loading: true, error: false }));
        setMetrics((current) => ({ data: current.data, loading: true, error: false }));
        setDoctrine((current) => ({ data: current.data, loading: true, error: false }));
        setThreats((current) => ({ data: current.data, loading: true, error: false }));
        setActivity((current) => ({ data: current.data, loading: true, error: false }));
        setCriticalIntel((current) => ({ data: current.data, loading: true, error: false }));
      }
      try {
        const result = await fetchDashboardOverview(criticalWindow, controller.signal);
        if (cancelled) return;
        dashboardLoadedRef.current = true;
        setSummary({ data: result.summary, loading: false, error: false });
        setMetrics({ data: result.metrics, loading: false, error: false });
        setDoctrine({ data: result.doctrine, loading: false, error: false });
        setThreats({ data: result.threats, loading: false, error: false });
        setActivity({ data: result.activity, loading: false, error: false });
        setCriticalIntel({ data: result.criticalIntel, loading: false, error: false });
      } catch (error) {
        if (cancelled || (error instanceof DOMException && error.name === "AbortError")) return;
        setSummary({ data: null, loading: false, error: true });
        setMetrics({ data: null, loading: false, error: true });
        setDoctrine({ data: null, loading: false, error: true });
        setThreats({ data: null, loading: false, error: true });
        setActivity({ data: null, loading: false, error: true });
        setCriticalIntel({ data: null, loading: false, error: true });
      }
    }

    void load();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [criticalWindow]);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    async function loadIncidentsOverview() {
      if (incidentsLoadedRef.current) {
        setIncidents((current) => ({ data: current.data, loading: true, error: false }));
      }
      try {
        const overview = await fetchIncidentsOverview(controller.signal);
        if (cancelled) return;
        incidentsLoadedRef.current = true;
        setIncidents({ data: overview, loading: false, error: false });
      } catch (error) {
        if (cancelled || (error instanceof DOMException && error.name === "AbortError")) return;
        setIncidents({ data: null, loading: false, error: true });
      }
    }

    void loadIncidentsOverview();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadProjectOverview() {
      if (projectLoadedRef.current) {
        setProjectOverview((current) => ({ data: current.data, loading: true, error: false }));
      }
      try {
        const overview = await fetchProjectAccountOverview();
        if (cancelled) return;
        projectLoadedRef.current = true;
        setProjectOverview({ data: overview, loading: false, error: false });
      } catch {
        if (cancelled) return;
        setProjectOverview({ data: null, loading: false, error: true });
      }
    }

    void loadProjectOverview();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isOperator) return;
  
    let cancelled = false;
  
    async function loadCounts() {
      setAdminCounts({ data: null, loading: true, error: false });
      try {
        const counts = await fetchAdminSummary();
        if (cancelled) return;
        setAdminCounts({ data: counts, loading: false, error: false });
      } catch {
        if (cancelled) return;
        setAdminCounts({ data: null, loading: false, error: true });
      }
    }
  
    queueMicrotask(() => {
      void loadCounts();
    });
  
    return () => {
      cancelled = true;
    };
  }, [isOperator]);

  const portalSignals = useMemo(() => {
    const signals = [summary, metrics, doctrine, threats, activity, incidents];
    const online = signals.filter((item) => item.data && !item.error).length;
    return {
      online,
      total: signals.length,
      reachable: online > 0,
    };
  }, [summary, metrics, doctrine, threats, activity, incidents]);

  const recentActivity = useMemo(() => {
    const rows = activity.data ?? [];
    const filtered = rows.filter((item) =>
      item.category === "sync" || item.category === "replay" || item.category === "doctrine",
    );
    return (filtered.length > 0 ? filtered : rows).slice(0, 5);
  }, [activity.data]);

  const activitySpark = useMemo(() => {
    const rows = recentActivity.length > 0 ? recentActivity : activity.data ?? [];
    if (rows.length === 0) return [0, 0, 0, 0];
    return rows.map((item, index) => {
      const severity = item.severity;
      if (severity === "critical") return 10 - index;
      if (severity === "high") return 8 - index;
      if (severity === "medium") return 6 - index;
      return 4 - index;
    });
  }, [recentActivity, activity.data]);

  const THREAT_FAMILY_COLORS: Record<string, string> = {
    "Dependency / Supply Chain":      "#8B5CF6",
    "Admin Key / Access Control":     "#EF4444",
    "Frontend / DNS / Interface":     "#3B82F6",
    "Governance / Quorum / Timelock": "#F59E0B",
    "Bridge / Cross-chain":           "#06B6D4",
    "Oracle / Price Feed":            "#22C55E",
    "Keeper / Liveness":              "#F97316",
    "Stablecoin / Depeg":             "#EC4899",
    "Treasury / Accounting":          "#D4AF37",
    "DeFi Protocol Incident":         "#64748B",
    "Unknown / Unclassified":         "rgba(148,163,184,0.5)",
  };
  const FALLBACK_COLORS = ["#6366F1", "#14B8A6", "#A78BFA", "#34D399", "#FB923C"];

  const threatSegments = useMemo(() => {
    const rows = (threats.data?.rows ?? [])
      .filter((r) => r.caseCount > 0)
      .sort((a, b) => b.caseCount - a.caseCount);
    const total = rows.reduce((s, r) => s + r.caseCount, 0) || 1;
    const top5 = rows.slice(0, 5);
    const restCount = rows.slice(5).reduce((s, r) => s + r.caseCount, 0);
    const segments = top5.map((r, i) => ({
      label: r.threatFamily,
      count: r.caseCount,
      pct: Math.round((r.caseCount / total) * 100),
      color: THREAT_FAMILY_COLORS[r.threatFamily] ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length],
    }));
    if (restCount > 0) {
      segments.push({ label: "Other", count: restCount, pct: Math.round((restCount / total) * 100), color: "rgba(100,116,139,0.55)" });
    }
    return segments.length > 0 ? segments : [{ label: "No Data", count: 1, pct: 100, color: "rgba(148,163,184,0.35)" }];
  }, [threats.data]);

  const threatPaths = useMemo(() => {
    const total = threatSegments.reduce((sum, item) => sum + item.count, 0) || 1;
    let cursor = -90;
    return threatSegments.map((segment) => {
      const start = cursor;
      const end = cursor + (segment.count / total) * 360;
      cursor = end;
      return { ...segment, path: donutArcPath(start, end, 48, 48, 41, 28) };
    });
  }, [threatSegments]);

  const doctrineRows = doctrine.data?.rows ?? [];
  const topDoctrineTags = doctrineRows.slice(0, 3);
  const topThreatFamily = threats.data?.rows?.[0];
  const incidentData = incidents.data;
  const incidentCoveragePending = coveragePendingCount(incidentData);
  const criticalSpark = [
    criticalIntel.data?.criticalCount ?? 0,
    criticalIntel.data?.highCount ?? 0,
    criticalIntel.data?.replayableCount ?? 0,
    criticalIntel.data?.defendedCount ?? 0,
  ];
  const accountName = me?.activeAccount?.name ?? "No active account";
  const sessionMode = me?.sessionMode === "dev_placeholder" ? "Dev Mode" : formatLabel(me?.sessionMode ?? "Active");
  const membershipSummary = !me?.memberships?.length
    ? "No memberships"
    : me.memberships.length === 1
      ? "1 membership"
      : `${me.memberships.length} memberships`;
  const projectData = projectOverview.data;
  const hasProjects = (projectData?.projectCount ?? 0) > 0;
  const hasScanResults = (projectData?.findingCount ?? 0) > 0;
  const projectMapStatus = !hasProjects
    ? "Project Map not configured."
    : hasScanResults
      ? `${formatCount(projectData?.openFindingCount)} open findings`
      : "Project mapped - admin surface scan pending.";
  const authorityStatus = !hasProjects
    ? "Project Map not configured."
    : hasScanResults
      ? `${projectData?.highestSeverity?.toUpperCase() ?? "MAPPED"} authority risk`
      : "Admin surface scan pending.";
  const topFindingTypes = Object.entries(projectData?.findingTypeCounts ?? {}).slice(0, 3);

  function severityPriority(severity: string | null | undefined): number {
    const s = (severity ?? "").toLowerCase();
  
    if (s === "critical") return 0;
    if (s === "high") return 1;
    if (s === "medium") return 2;
    if (s === "low") return 3;
  
    return 99;
  }
  
  function compareSeriousCases(
    a: { severity?: string | null; ingestedAt?: string | null; updatedAt?: string | null },
    b: { severity?: string | null; ingestedAt?: string | null; updatedAt?: string | null },
  ): number {
    const severityDiff = severityPriority(a.severity) - severityPriority(b.severity);
  
    if (severityDiff !== 0) return severityDiff;
  
    const aTime = new Date(a.ingestedAt ?? a.updatedAt ?? 0).getTime();
    const bTime = new Date(b.ingestedAt ?? b.updatedAt ?? 0).getTime();
  
    return bTime - aTime;
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100%",
        background: "#080a0e",
      }}
    >
      <div
        style={{
          position: "relative",
          textAlign: "center",
          padding: "10px 20px 12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              `radial-gradient(ellipse 80% 120% at 50% 100%, rgba(42,31,74,0.35) 0%, rgba(18,14,32,0.12) 55%, transparent 72%)`,
            pointerEvents: "none",
          }}
        />

        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14 }}>
            <h1
              style={{
                margin: 0,
                fontSize: 22,
                fontWeight: 800,
                letterSpacing: "0.22em",
                color: GOLD,
                textShadow: "0 0 20px rgba(212,175,55,0.4)",
                lineHeight: 1,
              }}
            >
              SCE PORTAL
            </h1>
            <span
              style={{
                fontSize: 9,
                letterSpacing: "0.4em",
                color: "rgba(212,175,55,0.45)",
              }}
            >
              LIVE COMMAND OVERVIEW
            </span>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                border: "1px solid rgba(212,175,55,0.22)",
                borderRadius: 4,
                padding: "3px 10px",
                background: "rgba(0,0,0,0.28)",
              }}
            >
              <span
                style={{
                  fontSize: 8,
                  letterSpacing: "0.14em",
                  color: "rgba(212,175,55,0.55)",
                }}
              >
                COMMAND STATUS
              </span>
              <StatusPill
                label={portalSignals.reachable ? "LIVE DATA ONLINE" : "PARTIAL DATA"}
                color={portalSignals.reachable ? "#22C55E" : GOLD}
              />
            </div>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, padding: "0 14px 18px", display: "grid", gap: 10, alignContent: "start" }}>
        <div
          style={{
            alignItems: "center",
            background: "rgba(255,255,255,0.018)",
            border: "1px solid rgba(212,175,55,0.1)",
            borderRadius: 8,
            display: "flex",
            flexWrap: "wrap",
            gap: "8px 18px",
            justifyContent: "space-between",
            padding: "8px 12px",
          }}
        >
          {[
            { label: "Session Mode", value: sessionMode },
            { label: "Real Role", value: formatLabel(realRole) },
            { label: "Current Account", value: accountName },
            { label: "Memberships", value: membershipSummary },
          ].map((item) => (
            <div key={item.label} style={{ display: "flex", gap: 7, alignItems: "center", minWidth: 0 }}>
              <span style={{ color: MUTED, fontSize: 8.5, letterSpacing: "0.1em", textTransform: "uppercase", whiteSpace: "nowrap" }}>
                {item.label}
              </span>
              <span style={{ color: "rgba(226,232,240,0.82)", fontSize: 10.5, fontWeight: 650, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {item.value}
              </span>
            </div>
          ))}
        </div>

        <div style={{ fontSize: 9.5, fontWeight: 600, letterSpacing: "0.13em", color: GOLD, textTransform: "uppercase" }}>
          Global Intelligence
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: 10,
            marginBottom: 10,
          }}
        >
          <div style={CARD}>
            <SectionHead icon={Activity} title="System Health" action="LIVE STATUS" />
            <LoadingOrUnavailable loading={false} error={false} />
            <div
              style={{
                display: "grid",
                gap: 8,
              }}
            >
              {[
                {
                  label: "Portal API",
                  value: portalSignals.reachable ? "Reachable" : "Unavailable",
                  color: portalSignals.reachable ? "#22C55E" : GOLD,
                },
                {
                  label: "Live Data",
                  value: summary.error || metrics.error ? "Partial" : "Online",
                  color: summary.error || metrics.error ? GOLD : "#22C55E",
                },
                {
                  label: "Modules Responding",
                  value: `${portalSignals.online} / ${portalSignals.total}`,
                  color: TEXT,
                },
                {
                  label: "Last Sync",
                  value: summary.data?.lastSyncAt ? formatRelativeTime(summary.data.lastSyncAt) : "Waiting",
                  color: TEXT,
                },
              ].map((item) => (
                <div
                  key={item.label}
                  style={{
                    alignItems: "center",
                    borderTop: "1px solid rgba(212,175,55,0.06)",
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                    minHeight: 20,
                    paddingTop: 6,
                  }}
                >
                  <span style={{ color: MUTED, fontSize: 9, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                    {item.label}
                  </span>
                  <span style={{ color: item.color, fontSize: 11, fontWeight: 800, textAlign: "right" }}>
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div style={CARD}>
            <SectionHead icon={BookOpen} title="Doctrine Engine" action="OPEN" href="/dashboard/doctrine" />
            <LoadingOrUnavailable loading={doctrine.loading} error={doctrine.error} />
            {!doctrine.loading && !doctrine.error && doctrine.data ? (
              <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                <div
                  style={{
                    width: 62,
                    height: 62,
                    flexShrink: 0,
                    background: "rgba(212,175,55,0.06)",
                    border: "1px solid rgba(212,175,55,0.22)",
                    borderRadius: 8,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <svg viewBox="0 0 40 40" width={36} height={36}>
                    <polygon points="20,4 36,12 36,28 20,36 4,28 4,12" fill="none" stroke="rgba(212,175,55,0.5)" strokeWidth="1.2" />
                    <polygon points="20,4 36,12 20,20 4,12" fill="rgba(212,175,55,0.08)" stroke="rgba(212,175,55,0.3)" strokeWidth="0.8" />
                    <polygon points="4,12 20,20 20,36 4,28" fill="rgba(212,175,55,0.05)" stroke="rgba(212,175,55,0.2)" strokeWidth="0.8" />
                    <polygon points="36,12 20,20 20,36 36,28" fill="rgba(212,175,55,0.1)" stroke="rgba(212,175,55,0.25)" strokeWidth="0.8" />
                  </svg>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                    <span style={{ fontSize: 9.5, color: MUTED }}>Doctrine tags</span>
                    <span style={{ fontSize: 10.5, fontWeight: 600, color: TEXT }}>{formatCount(doctrine.data.totalDoctrineTags)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                    <span style={{ fontSize: 9.5, color: MUTED }}>Covered cases</span>
                    <span style={{ fontSize: 10.5, fontWeight: 600, color: TEXT }}>{formatCount(doctrine.data.totalDoctrineCoveredCases)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                    <span style={{ fontSize: 9.5, color: MUTED }}>Cases catalogued</span>
                    <span style={{ fontSize: 10.5, fontWeight: 600, color: "#22C55E" }}>{formatCount(doctrine.data.totalReplayedDoctrineCases)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                    <span style={{ fontSize: 9.5, color: MUTED }}>Coverage gaps</span>
                    <span style={{ fontSize: 10.5, fontWeight: 600, color: GOLD }}>
                      {formatCount(Math.max(0, doctrine.data.totalDoctrineCoveredCases - doctrine.data.totalReplayedDoctrineCases))}
                    </span>
                  </div>
                  <div style={{ marginTop: 4, display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {topDoctrineTags.length > 0 ? topDoctrineTags.map((row) => (
                      <span
                        key={row.tag}
                        style={{
                          fontSize: 8.5,
                          color: "rgba(212,175,55,0.82)",
                          border: "1px solid rgba(212,175,55,0.25)",
                          background: "rgba(212,175,55,0.08)",
                          borderRadius: 4,
                          padding: "2px 6px",
                        }}
                      >
                        {row.tag}
                      </span>
                    )) : (
                      <span style={{ fontSize: 9, color: MUTED }}>No doctrine tags yet</span>
                    )}
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          <div style={CARD}>
            <SectionHead icon={ShieldAlert} title="Threat Matrix" action="VIEW MATRIX" href="/dashboard/threat-matrix" />
            <LoadingOrUnavailable loading={threats.loading} error={threats.error} />
            {!threats.loading && !threats.error && threats.data ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ fontSize: 8, color: MUTED, letterSpacing: "0.07em" }}>THREAT-FAMILY COMPOSITION</div>
                <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                  <svg viewBox="0 0 96 96" width={112} height={112} style={{ flexShrink: 0 }}>
                    {threatPaths.map((segment) => (
                      <path key={segment.label} d={segment.path} fill={segment.color} stroke="#080a0e" strokeWidth="1.2" />
                    ))}
                    <text x="48" y="44" textAnchor="middle" fontSize="13" fontWeight="800" fill={TEXT}>
                      {threatSegments[0]?.pct ?? 0}%
                    </text>
                    <text x="48" y="55" textAnchor="middle" fontSize="5.5" fill={MUTED} letterSpacing="0.1em">
                      TOP FAMILY
                    </text>
                  </svg>
                  <div style={{ display: "flex", flexDirection: "column", gap: 7, flex: 1, minWidth: 0 }}>
                    {threatSegments.slice(0, 3).map((seg) => (
                      <div key={seg.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div style={{ width: 7, height: 7, borderRadius: "50%", background: seg.color, flexShrink: 0 }} />
                        <span style={{ fontSize: 10, color: "#CBD5E1", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, minWidth: 0 }}>
                          {seg.label}
                        </span>
                        <span style={{ fontSize: 11, fontWeight: 700, color: TEXT, flexShrink: 0 }}>{seg.pct}%</span>
                      </div>
                    ))}
                    {threatSegments.length > 3 && (
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div style={{ width: 7, height: 7, borderRadius: "50%", background: "rgba(100,116,139,0.55)", flexShrink: 0 }} />
                        <span style={{ fontSize: 10, color: MUTED, flex: 1 }}>Other families</span>
                        <span style={{ fontSize: 11, fontWeight: 700, color: MUTED, flexShrink: 0 }}>
                          {threatSegments.slice(3).reduce((s, seg) => s + seg.pct, 0)}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div style={{ fontSize: 9.5, color: MUTED }}>
                  {topThreatFamily
                    ? `${topThreatFamily.threatFamily} leads at ${threatSegments[0]?.pct ?? 0}% of cases.`
                    : "No threat families available."}
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div style={CARD}>
          <SectionHead icon={AlertTriangle} title="Incidents" action="OPEN INCIDENTS" href="/dashboard/incidents" />
          <LoadingOrUnavailable loading={incidents.loading} error={incidents.error} />
          {!incidents.loading && incidents.error ? (
            <div style={{ fontSize: 10.5, color: MUTED }}>
              Incidents overview unavailable.
            </div>
          ) : null}
          {!incidents.loading && !incidents.error && incidentData ? (
            <div style={{ display: "grid", gap: 8 }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
                  gap: 8,
                }}
              >
                {[
                  { label: "TOTAL INCIDENTS", value: incidentData.total_incidents, color: TEXT },
                  { label: "CRITICAL", value: incidentData.critical_incidents, color: "#EF4444" },
                  { label: "AWAITING VALIDATION", value: incidentData.incidents_awaiting_replay, color: GOLD },
                  { label: "CASE INDEXED", value: incidentData.replay_validated_incidents, color: "#22C55E" },
                  { label: "RESPONSE COVERAGE", value: incidentData.incidents_with_response_coverage, color: "#3B82F6" },
                ].map((item) => (
                  <div
                    key={item.label}
                    style={{
                      border: "1px solid rgba(212,175,55,0.1)",
                      borderRadius: 6,
                      padding: "7px 10px",
                      background: "rgba(255,255,255,0.02)",
                      minWidth: 0,
                    }}
                  >
                    <div style={{ fontSize: 8, color: MUTED, letterSpacing: "0.07em" }}>{item.label}</div>
                    <div style={{ marginTop: 4, fontSize: 15, fontWeight: 800, color: item.color, lineHeight: 1 }}>
                      {formatCount(item.value)}
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, paddingTop: 2 }}>
                <span style={{ fontSize: 8.5, color: MUTED }}>
                  Coverage Pending: <span style={{ color: "#F97316", fontWeight: 700 }}>{formatCount(incidentCoveragePending)}</span>
                </span>
                <Link href="/dashboard/incidents" prefetch={false} style={{ fontSize: 8.5, color: "rgba(212,175,55,0.72)", letterSpacing: "0.08em", textDecoration: "none" }}>
                  OPEN INCIDENTS →
                </Link>
              </div>
            </div>
          ) : null}
        </div>

        <div style={{ fontSize: 9.5, fontWeight: 600, letterSpacing: "0.13em", color: GOLD, textTransform: "uppercase" }}>
          Account Operations
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
            gap: 10,
            marginBottom: 10,
          }}
        >
          <div style={{ ...CARD, padding: "10px 12px" }}>
            <SectionHead icon={FolderOpen} title="Critical Intelligence" action="VIEW LIBRARY" href="/dashboard/case-library" />
            <LoadingOrUnavailable
              loading={summary.loading || criticalIntel.loading}
              error={summary.error || criticalIntel.error}
            />
            {!summary.loading && !criticalIntel.loading && !summary.error && !criticalIntel.error ? (
              <div style={{ display: "grid", gap: 0 }}>
                <div style={{ display: "inline-flex", gap: 3, padding: 2, borderRadius: 4, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(212,175,55,0.12)", marginBottom: 7, alignSelf: "start" }}>
                  {(["24h", "7d", "30d"] as const).map((window) => {
                    const active = criticalWindow === window;
                    return (
                      <button
                        key={window}
                        type="button"
                        onClick={() => setCriticalWindow(window)}
                        style={{
                          border: "none",
                          cursor: "pointer",
                          borderRadius: 3,
                          padding: "3px 6px",
                          fontSize: 8,
                          fontWeight: 700,
                          letterSpacing: "0.06em",
                          color: active ? "#080a0e" : "#CBD5E1",
                          background: active ? GOLD : "transparent",
                        }}
                      >
                        {window.toUpperCase()}
                      </button>
                    );
                  })}
                </div>
                {[
                  { label: "CRITICAL", value: formatCount(criticalIntel.data?.criticalCount), color: "#EF4444" },
                  { label: "HIGH", value: formatCount(criticalIntel.data?.highCount), color: "#F97316" },
                  { label: "READY FOR VALIDATION", value: formatCount(criticalIntel.data?.replayableCount), color: GOLD },
                  { label: "CASE-INDEXED %", value: formatPct(criticalIntel.data?.defenseReadinessPct), color: "#22C55E" },
                  { label: "TOP THREAT", value: criticalIntel.data?.topThreatFamily ?? "Unavailable", color: TEXT },
                ].map((item) => (
                  <div
                    key={item.label}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 8,
                      alignItems: "center",
                      borderTop: "1px solid rgba(212,175,55,0.06)",
                      padding: "5px 0",
                    }}
                  >
                    <span style={{ fontSize: 8.5, color: MUTED, letterSpacing: "0.07em", flexShrink: 0 }}>{item.label}</span>
                    <span style={{ fontSize: 10.5, fontWeight: 700, color: item.color, textAlign: "right", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "55%" }}>{item.value}</span>
                  </div>
                ))}
                <div style={{ display: "flex", flexDirection: "column", gap: 4, paddingTop: 7, borderTop: "1px solid rgba(212,175,55,0.06)", marginTop: 2 }}>
                  <Link href="/dashboard/case-library" prefetch={false} style={{ textDecoration: "none", fontSize: 8.5, color: "rgba(212,175,55,0.72)", letterSpacing: "0.07em" }}>
                    VIEW SERIOUS CASES →
                  </Link>
                  <Link href="/dashboard/threat-matrix" prefetch={false} style={{ textDecoration: "none", fontSize: 8.5, color: "rgba(212,175,55,0.72)", letterSpacing: "0.07em" }}>
                    OPEN THREAT MATRIX →
                  </Link>
                </div>
              </div>
            ) : null}
          </div>

          <div style={{ ...CARD, padding: "10px 12px" }}>
            <SectionHead icon={Building2} title="Project Map" action="OPEN MAP" href="/dashboard/project-map" />
            <LoadingOrUnavailable loading={projectOverview.loading} error={projectOverview.error} />
            {!projectOverview.loading && !projectOverview.error ? (
              <div style={{ display: "grid", gap: 0 }}>
                <div style={{ marginBottom: 7 }}>
                  <StatusPill label={hasProjects ? "ACCOUNT MAPPED" : "NOT CONFIGURED"} color={hasProjects ? "#22C55E" : GOLD} />
                </div>
                {[
                  { label: "PROJECTS", value: formatCount(projectData?.projectCount), color: TEXT },
                  { label: "ASSETS", value: formatCount(projectData?.assetCount), color: TEXT },
                  { label: "LAST SCAN", value: formatRelativeTime(projectData?.lastScanAt), color: TEXT },
                  { label: "OPEN FINDINGS", value: formatCount(projectData?.openFindingCount), color: toneForSeverity(projectData?.highestSeverity ?? undefined) },
                ].map((item) => (
                  <div
                    key={item.label}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 8,
                      alignItems: "center",
                      borderTop: "1px solid rgba(212,175,55,0.06)",
                      padding: "5px 0",
                    }}
                  >
                    <span style={{ fontSize: 8.5, color: MUTED, letterSpacing: "0.07em" }}>{item.label}</span>
                    <span style={{ fontSize: 10.5, fontWeight: 700, color: item.color }}>{item.value}</span>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <div style={{ ...CARD, padding: "10px 12px" }}>
            <SectionHead icon={ShieldAlert} title="Authority Risk" action="VIEW FINDINGS" href="/dashboard/project-map" />
            <LoadingOrUnavailable loading={projectOverview.loading} error={projectOverview.error} />
            {!projectOverview.loading && !projectOverview.error ? (
              <div style={{ display: "grid", gap: 0 }}>
                <div style={{ marginBottom: 7 }}>
                  <StatusPill label={projectData?.zeroCustodyStatus ? "READ-ONLY ANALYSIS" : "ZERO-CUSTODY UNKNOWN"} color={GOLD} />
                </div>
                {[
                  { label: "CRITICAL", value: formatCount(projectData?.criticalFindingCount), color: "#EF4444" },
                  { label: "HIGH", value: formatCount(projectData?.highFindingCount), color: "#F97316" },
                  { label: "HIGHEST-RISK ASSET", value: projectData?.highestRiskAssetName ?? projectData?.highestRiskProjectName ?? "Unavailable", color: TEXT },
                ].map((item) => (
                  <div
                    key={item.label}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 8,
                      alignItems: "center",
                      borderTop: "1px solid rgba(212,175,55,0.06)",
                      padding: "5px 0",
                    }}
                  >
                    <span style={{ fontSize: 8.5, color: MUTED, letterSpacing: "0.07em", flexShrink: 0 }}>{item.label}</span>
                    <span style={{ fontSize: 10.5, fontWeight: 700, color: item.color, textAlign: "right", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "55%" }}>{item.value}</span>
                  </div>
                ))}
                {topFindingTypes.length > 0 ? (
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap", paddingTop: 6 }}>
                    {topFindingTypes.map(([type, count]) => (
                      <span
                        key={type}
                        style={{
                          fontSize: 8,
                          color: "#F5E7A1",
                          border: "1px solid rgba(212,175,55,0.18)",
                          borderRadius: 3,
                          padding: "2px 5px",
                          background: "rgba(212,175,55,0.06)",
                        }}
                      >
                        {formatFindingType(type)} {count}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>

          <div style={{ ...CARD, padding: "10px 12px" }}>
            <SectionHead icon={Cpu} title="Execution Adapters" action="ACCOUNT OPS" href="/dashboard/adapters" />
            <div style={{ display: "grid", gap: 0 }}>
              {[
                { label: "ACCOUNT", value: accountName },
                { label: "ADAPTER STATUS", value: "Pending account configuration" },
                {
                  label: "PROJECT MAP",
                  value: projectOverview.loading
                    ? "Loading..."
                    : hasProjects
                      ? `${formatCount(projectData?.projectCount)} projects mapped`
                      : "Not configured",
                },
                { label: "REPORTS / AUDIT", value: "No audit records yet" },
              ].map((item) => (
                <div
                  key={item.label}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 8,
                    alignItems: "flex-start",
                    borderTop: "1px solid rgba(212,175,55,0.06)",
                    padding: "5px 0",
                  }}
                >
                  <span style={{ fontSize: 8.5, color: MUTED, letterSpacing: "0.07em", flexShrink: 0 }}>{item.label}</span>
                  <span style={{ fontSize: 10, fontWeight: 600, color: TEXT, textAlign: "right", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "58%" }}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ fontSize: 9.5, fontWeight: 600, letterSpacing: "0.13em", color: GOLD, textTransform: "uppercase" }}>
          {isOperator ? "SCE Operations" : "Verification & Audit"}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: isOperator ? "0.72fr 1fr" : "1fr",
            gap: 10,
          }}
        >
          <div style={CARD}>
            <SectionHead icon={ShieldCheck} title="Verification & Audit" action="VIEW AUDIT" href="/dashboard/audit" />
            <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
              <div style={{ flexShrink: 0 }}>
                <svg viewBox="0 0 96 96" width={96} height={96}>
                  <circle cx="48" cy="48" r="36" fill="none" stroke="rgba(212,175,55,0.12)" strokeWidth="8" />
                  <circle
                    cx="48"
                    cy="48"
                    r="36"
                    fill="none"
                    stroke={summary.data ? GOLD : "rgba(148,163,184,0.7)"}
                    strokeWidth="8"
                    strokeDasharray={`${(0.76 * 2 * Math.PI * 36).toFixed(2)} ${(0.24 * 2 * Math.PI * 36).toFixed(2)}`}
                    strokeLinecap="round"
                    transform="rotate(-90 48 48)"
                  />
                  <text x="48" y="45" textAnchor="middle" fontSize="11" fontWeight="800" fill={summary.data ? GOLD : "#94A3B8"}>
                    {me?.activeAccount ? "ACCOUNT" : "PENDING"}
                  </text>
                  <text x="48" y="57" textAnchor="middle" fontSize="6.5" fill={MUTED} letterSpacing="0.12em">
                    AUDIT
                  </text>
                </svg>
                <div style={{ textAlign: "center", fontSize: 8.5, color: MUTED, marginTop: 4 }}>
                  No account audit records yet
                </div>
                <div style={{ textAlign: "center", fontSize: 8.5, color: "rgba(212,175,55,0.7)", marginTop: 2 }}>
                  Reports pending account activity
                </div>
              </div>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  { label: "Current account", value: accountName },
                  { label: "Current role", value: role ?? "No role" },
                  { label: "Account status", value: me?.activeAccount?.status ?? "Unavailable" },
                  { label: "Membership context", value: membershipSummary },
                ].map((item) => (
                  <div key={item.label}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 4,
                        gap: 10,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div style={{ width: 6, height: 6, borderRadius: "50%", background: GOLD, flexShrink: 0 }} />
                        <span style={{ fontSize: 9, color: MUTED, letterSpacing: "0.06em" }}>{item.label.toUpperCase()}</span>
                      </div>
                      <span style={{ fontSize: 10.5, fontWeight: 700, color: TEXT, textAlign: "right" }}>{item.value}</span>
                    </div>
                    <div style={{ height: 3, background: "rgba(212,175,55,0.08)", borderRadius: 2 }}>
                      <div style={{ height: "100%", width: "100%", background: GOLD, borderRadius: 2, opacity: 0.35 }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {isOperator ? (
            <div style={CARD}>
              <SectionHead icon={Zap} title="Adversarial Operations" action="SCE OPS" />
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 10 }}>
                {[
                  {
                    key: "RED TEAM",
                    icon: Zap,
                    color: "#EF4444",
                    accent: "rgba(60,10,10,0.8)",
                    detail: "Coming next",
                    sub: "Offensive simulation",
                  },
                  {
                    key: "BLUE TEAM",
                    icon: Shield,
                    color: "#3B82F6",
                    accent: "rgba(10,20,60,0.8)",
                    detail: "Not configured",
                    sub: "Defensive posture",
                  },
                  {
                    key: "BLACK OPS",
                    icon: EyeOff,
                    color: "#A855F7",
                    accent: "rgba(10,8,25,0.9)",
                    detail: "Coming next",
                    sub: "Threat hunting",
                  },
                ].map((item) => (
                  <div
                    key={item.key}
                    style={{
                      borderRadius: 6,
                      padding: "12px 12px",
                      background: `linear-gradient(135deg, ${item.accent} 0%, rgba(5,5,10,0.92) 100%)`,
                      border: `1px solid ${item.color}22`,
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        background: `radial-gradient(ellipse 70% 50% at 50% 100%, ${item.color}20 0%, transparent 70%)`,
                        pointerEvents: "none",
                      }}
                    />
                    <div style={{ position: "relative" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                        <item.icon size={11} style={{ color: item.color }} />
                        <span style={{ fontSize: 9.5, fontWeight: 700, color: item.color, letterSpacing: "0.1em" }}>{item.key}</span>
                      </div>
                      <div style={{ fontSize: 9, color: MUTED, marginBottom: 10 }}>{item.sub}</div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: TEXT, lineHeight: 1 }}>{item.detail}</div>
                      <div style={{ fontSize: 9, color: MUTED, marginTop: 6 }}>Placeholder module only</div>
                    </div>
                  </div>
                ))}
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.1fr 0.9fr",
                  gap: 10,
                }}
              >
                <div
                  style={{
                    borderRadius: 8,
                    padding: "10px 12px",
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(212,175,55,0.08)",
                  }}
                >
                  <div style={{ fontSize: 9, color: MUTED, letterSpacing: "0.08em", marginBottom: 8 }}>
                    ADMIN / ACCOUNTS
                  </div>
                  <LoadingOrUnavailable loading={adminCounts.loading} error={adminCounts.error} />
                  {!adminCounts.loading && !adminCounts.error && adminCounts.data ? (
                    <div style={{ display: "grid", gap: 8 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                        <span style={{ fontSize: 10, color: MUTED }}>Accounts</span>
                        <span style={{ fontSize: 12, color: TEXT, fontWeight: 700 }}>{formatCount(adminCounts.data.accounts)}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                        <span style={{ fontSize: 10, color: MUTED }}>Users</span>
                        <span style={{ fontSize: 12, color: TEXT, fontWeight: 700 }}>{formatCount(adminCounts.data.users)}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                        <span style={{ fontSize: 10, color: MUTED }}>Access requests</span>
                        <span style={{ fontSize: 12, color: TEXT, fontWeight: 700 }}>{formatCount(adminCounts.data.accessRequests)}</span>
                      </div>
                    </div>
                  ) : null}
                </div>

                <div
                  style={{
                    borderRadius: 8,
                    padding: "10px 12px",
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(212,175,55,0.08)",
                  }}
                >
                  <div style={{ fontSize: 9, color: MUTED, letterSpacing: "0.08em", marginBottom: 8 }}>
                    SYSTEM SETTINGS
                  </div>
                  <div style={{ fontSize: 13, color: TEXT, fontWeight: 700 }}>Route available</div>
                  <div style={{ marginTop: 4, fontSize: 10, color: MUTED }}>Live settings status not configured</div>
                  <div style={{ marginTop: 8 }}>
                    <Link href="/dashboard/settings" prefetch={false} style={{ textDecoration: "none", fontSize: 9, color: "rgba(212,175,55,0.72)", letterSpacing: "0.08em" }}>
                      OPEN SETTINGS
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div
        style={{
          borderTop: "1px solid rgba(212,175,55,0.1)",
          padding: "10px 20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <svg viewBox="0 0 14 14" width={12} height={12}>
            <polygon points="7,1 13,7 7,13 1,7" fill="none" stroke="rgba(212,175,55,0.5)" strokeWidth="1.2" />
            <polygon points="7,4 10,7 7,10 4,7" fill="rgba(212,175,55,0.25)" />
          </svg>
          <span
            style={{
              fontSize: 9.5,
              letterSpacing: "0.28em",
              color: "rgba(212,175,55,0.45)",
            }}
          >
            PRESERVE • PROTECT • PERPETUATE
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div
            style={{
              width: 5,
              height: 5,
              borderRadius: "50%",
              background: portalSignals.reachable ? "#22C55E" : GOLD,
              boxShadow: portalSignals.reachable ? "0 0 4px #22C55E" : `0 0 4px ${GOLD}`,
            }}
          />
          <span style={{ fontSize: 9, color: "rgba(100,200,100,0.6)", letterSpacing: "0.04em" }}>
            Live where implemented. Honest placeholders elsewhere.
          </span>
        </div>
      </div>
    </div>
  );
}
