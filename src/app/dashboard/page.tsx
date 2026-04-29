"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
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
  fetchActivity,
  fetchCases,
  fetchDoctrineOverview,
  fetchMetrics,
  fetchSummaryStats,
  fetchThreatMatrixOverview,
} from "@/lib/case-library/service";
import type {
  CaseLibraryActivityItem,
  CaseLibraryRecord,
  CaseLibraryMetrics,
  CaseLibraryTableParams,
  CaseLibrarySummaryStats,
  DoctrineOverviewResponse,
  ThreatMatrixOverviewResponse,
} from "@/lib/case-library/types";
import { fetchAccessRequests, fetchAccounts, fetchUsers } from "@/lib/saas/service";

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

type CriticalIntelligence = {
  timeframe: "24h" | "7d" | "30d";
  criticalCount: number;
  highCount: number;
  seriousTotal: number;
  replayableCount: number;
  defendedCount: number;
  defenseReadinessPct: number;
  criticalReplayMissing: number;
  highReplayMissing: number;
  topThreatFamily: string | null;
  latestSeriousCases: CaseLibraryRecord[];
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

function defenseStatus(caseItem: CaseLibraryRecord): { label: string; color: string } {
  if (caseItem.replayStatus === "passed") return { label: "DEFENDED", color: "#22C55E" };
  if (caseItem.replayEligibility === true) return { label: "REPLAYABLE", color: GOLD };
  if (caseItem.replayEligibility === false) return { label: "NOT REPLAYABLE", color: "rgba(148,163,184,0.85)" };
  return { label: "REPLAY MISSING", color: "#EF4444" };
}

function isoWindowStart(timeframe: "24h" | "7d" | "30d"): string {
  const now = new Date();
  const start = new Date(now);
  if (timeframe === "24h") start.setHours(now.getHours() - 24);
  if (timeframe === "7d") start.setDate(now.getDate() - 7);
  if (timeframe === "30d") start.setDate(now.getDate() - 30);
  return start.toISOString();
}

function toDateInputValue(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function caseTimestamp(caseItem: CaseLibraryRecord): string | null {
  return caseItem.ingestedAt || caseItem.updatedAt || null;
}

function compareRecentCases(a: CaseLibraryRecord, b: CaseLibraryRecord): number {
  return new Date(caseTimestamp(b) ?? 0).getTime() - new Date(caseTimestamp(a) ?? 0).getTime();
}

function isOperatorRole(role: string | null | undefined): boolean {
  return role === "super_admin" || role === "sce_operator";
}

function toActivityTitle(item: CaseLibraryActivityItem): string {
  if (item.category === "sync") return "SYNC";
  if (item.category === "replay") return "REPLAY";
  if (item.category === "doctrine") return "DOCTRINE";
  if (item.category === "error") return "ERROR";
  return item.category.toUpperCase();
}

function toneForSeverity(severity?: string): string {
  if (severity === "critical" || severity === "high") return "#EF4444";
  if (severity === "medium") return GOLD;
  return "#22C55E";
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
        <Link href={href} style={{ textDecoration: "none" }}>
          {actionNode}
        </Link>
      ) : (
        actionNode
      )}
    </div>
  );
}

function MetricCell({
  label,
  value,
  helper,
  data,
  color,
}: {
  label: string;
  value: string;
  helper: string;
  data: number[];
  color: string;
}) {
  return (
    <div>
      <div style={{ fontSize: 8.5, color: MUTED, letterSpacing: "0.08em", marginBottom: 2 }}>
        {label}
      </div>
      <div style={{ fontSize: 16, fontWeight: 700, color: TEXT, lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ fontSize: 9, color: MUTED, marginTop: 3, minHeight: 24 }}>{helper}</div>
      <div style={{ marginTop: 6 }}>
        <Sparkline data={data} color={color} w={88} h={20} />
      </div>
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
  const role = me?.currentRole ?? null;
  const isOperator = isOperatorRole(role);
  const [criticalWindow, setCriticalWindow] = useState<"24h" | "7d" | "30d">("7d");

  const [summary, setSummary] = useState<Loadable<CaseLibrarySummaryStats>>(loadable());
  const [metrics, setMetrics] = useState<Loadable<CaseLibraryMetrics>>(loadable());
  const [doctrine, setDoctrine] = useState<Loadable<DoctrineOverviewResponse>>(loadable());
  const [threats, setThreats] = useState<Loadable<ThreatMatrixOverviewResponse>>(loadable());
  const [activity, setActivity] = useState<Loadable<CaseLibraryActivityItem[]>>(loadable());
  const [criticalIntel, setCriticalIntel] = useState<Loadable<CriticalIntelligence>>(loadable());
  const [adminCounts, setAdminCounts] = useState<Loadable<AdminCounts>>({
    data: null,
    loading: isOperator,
    error: false,
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const [summaryResult, metricsResult, doctrineResult, threatsResult, activityResult] =
        await Promise.allSettled([
          fetchSummaryStats(),
          fetchMetrics(),
          fetchDoctrineOverview(),
          fetchThreatMatrixOverview(),
          fetchActivity(8),
        ]);

      if (cancelled) return;

      setSummary({
        data: summaryResult.status === "fulfilled" ? summaryResult.value : null,
        loading: false,
        error: summaryResult.status === "rejected",
      });
      setMetrics({
        data: metricsResult.status === "fulfilled" ? metricsResult.value : null,
        loading: false,
        error: metricsResult.status === "rejected",
      });
      setDoctrine({
        data: doctrineResult.status === "fulfilled" ? doctrineResult.value : null,
        loading: false,
        error: doctrineResult.status === "rejected",
      });
      setThreats({
        data: threatsResult.status === "fulfilled" ? threatsResult.value : null,
        loading: false,
        error: threatsResult.status === "rejected",
      });
      setActivity({
        data: activityResult.status === "fulfilled" ? activityResult.value : null,
        loading: false,
        error: activityResult.status === "rejected",
      });

    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadCriticalIntel() {
      setCriticalIntel((current) => ({ data: current.data, loading: true, error: false }));

      const baseParams: Pick<CaseLibraryTableParams, "page" | "pageSize" | "sortBy" | "sortDir" | "ingestedFrom"> = {
        ingestedFrom: toDateInputValue(isoWindowStart(criticalWindow)),
        page: 1,
        pageSize: 100,
        sortBy: "ingestedAt",
        sortDir: "desc",
      };

      try {
        const [criticalCases, highCases] = await Promise.all([
          fetchCases({ ...baseParams, severity: "critical" }),
          fetchCases({ ...baseParams, severity: "high" }),
        ]);

        if (cancelled) return;

        const seriousCases = [...criticalCases.items, ...highCases.items].sort(compareRecentCases);
        const seriousTotal = criticalCases.total + highCases.total;
        const replayableCount = seriousCases.filter(
          (item) =>
            item.replayEligibility === true ||
            item.replayStatus === "available" ||
            item.replayStatus === "passed" ||
            item.replayStatus === "pending",
        ).length;
        const defendedCount = seriousCases.filter((item) => item.replayStatus === "passed").length;
        const criticalReplayMissing = criticalCases.items.filter((item) => item.replayStatus !== "passed").length;
        const highReplayMissing = highCases.items.filter((item) => item.replayStatus !== "passed").length;

        setCriticalIntel({
          data: {
            timeframe: criticalWindow,
            criticalCount: criticalCases.total,
            highCount: highCases.total,
            seriousTotal,
            replayableCount,
            defendedCount,
            defenseReadinessPct: seriousTotal > 0 ? (defendedCount / seriousTotal) * 100 : 0,
            criticalReplayMissing,
            highReplayMissing,
            topThreatFamily: threats.data?.rows?.[0]?.threatFamily ?? null,
            latestSeriousCases: seriousCases.sort(compareSeriousCases).slice(0, 5),
          },
          loading: false,
          error: false,
        });
      } catch {
        if (cancelled) return;
        setCriticalIntel({ data: null, loading: false, error: true });
      }
    }

    void loadCriticalIntel();
    return () => {
      cancelled = true;
    };
  }, [criticalWindow, threats.data]);

  useEffect(() => {
    if (!isOperator) return;
  
    let cancelled = false;
  
    async function loadCounts() {
      setAdminCounts({ data: null, loading: true, error: false });
  
      const [accountsResult, usersResult, requestsResult] = await Promise.allSettled([
        fetchAccounts(),
        fetchUsers(),
        fetchAccessRequests(),
      ]);
  
      if (cancelled) return;
  
      if (
        accountsResult.status === "fulfilled" &&
        usersResult.status === "fulfilled" &&
        requestsResult.status === "fulfilled"
      ) {
        setAdminCounts({
          data: {
            accounts: accountsResult.value.length,
            users: usersResult.value.length,
            accessRequests: requestsResult.value.length,
          },
          loading: false,
          error: false,
        });
        return;
      }
  
      setAdminCounts({ data: null, loading: false, error: true });
    }
  
    queueMicrotask(() => {
      void loadCounts();
    });
  
    return () => {
      cancelled = true;
    };
  }, [isOperator]);

  const portalSignals = useMemo(() => {
    const signals = [summary, metrics, doctrine, threats, activity];
    const online = signals.filter((item) => item.data && !item.error).length;
    return {
      online,
      total: signals.length,
      reachable: online > 0,
    };
  }, [summary, metrics, doctrine, threats, activity]);

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

  const threatSegments = useMemo(() => {
    const rows = threats.data?.rows ?? [];
    const critical = rows.filter((row) => row.criticalCount > 0).length;
    const high = rows.filter((row) => row.highCount > 0 && row.criticalCount === 0).length;
    const replayGap = rows.filter((row) => row.replayMissing > 0).length;
    const covered = rows.filter((row) => row.replayMissing === 0 && row.caseCount > 0).length;
    const segments = [
      { label: "Critical", count: critical, color: "#EF4444" },
      { label: "High", count: high, color: "#F97316" },
      { label: "Replay Gap", count: replayGap, color: GOLD },
      { label: "Covered", count: covered, color: "#22C55E" },
    ].filter((item) => item.count > 0);

    return segments.length > 0 ? segments : [{ label: "Unavailable", count: 1, color: "rgba(148,163,184,0.7)" }];
  }, [threats.data]);

  const threatPaths = useMemo(() => {
    const total = threatSegments.reduce((sum, item) => sum + item.count, 0) || 1;
    let cursor = -90;
    return threatSegments.map((segment) => {
      const start = cursor;
      const end = cursor + (segment.count / total) * 360;
      cursor = end;
      return { ...segment, path: donutArcPath(start, end, 48, 48, 36, 22) };
    });
  }, [threatSegments]);

  const doctrineRows = doctrine.data?.rows ?? [];
  const topDoctrineTags = doctrineRows.slice(0, 3);
  const topThreatFamily = threats.data?.rows?.[0];
  const criticalSpark = [
    criticalIntel.data?.criticalCount ?? 0,
    criticalIntel.data?.highCount ?? 0,
    criticalIntel.data?.replayableCount ?? 0,
    criticalIntel.data?.defendedCount ?? 0,
  ];
  const accountName = me?.activeAccount?.name ?? "No active account";
  const membershipSummary = !me?.memberships?.length
    ? "No memberships"
    : me.memberships.length === 1
      ? "1 membership"
      : `${me.memberships.length} memberships`;

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
          padding: "28px 20px 32px",
          minHeight: 220,
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
              `radial-gradient(ellipse 90% 160% at 50% 120%, rgba(42,31,74,0.48) 0%, rgba(32,24,58,0.3) 30%, rgba(18,14,32,0.16) 55%, transparent 72%)`,
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              `radial-gradient(ellipse 50% 60% at 50% 90%, rgba(65,47,112,0.24) 0%, transparent 60%)`,
            pointerEvents: "none",
          }}
        />

        <div style={{ position: "relative", zIndex: 1 }}>
          <h1
            style={{
              margin: 0,
              fontSize: 42,
              fontWeight: 800,
              letterSpacing: "0.28em",
              color: GOLD,
              textShadow: "0 0 30px rgba(212,175,55,0.55), 0 0 60px rgba(212,175,55,0.2)",
              lineHeight: 1,
            }}
          >
            SCE PORTAL
          </h1>
          <p
            style={{
              margin: "6px 0 14px",
              fontSize: 10.5,
              letterSpacing: "0.55em",
              color: "rgba(212,175,55,0.55)",
            }}
          >
            LIVE COMMAND OVERVIEW
          </p>

          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              border: "1px solid rgba(212,175,55,0.28)",
              borderRadius: 4,
              padding: "4px 14px",
              background: "rgba(0,0,0,0.3)",
            }}
          >
            <span
              style={{
                fontSize: 8.5,
                letterSpacing: "0.18em",
                color: "rgba(212,175,55,0.65)",
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

      <div style={{ flex: 1, padding: "0 14px 18px", display: "grid", gap: 10, alignContent: "start" }}>
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
                gridTemplateColumns: "1fr 1fr",
                gap: "10px 14px",
              }}
            >
              <MetricCell
                label="PORTAL API"
                value={portalSignals.reachable ? "REACHABLE" : "UNAVAILABLE"}
                helper={`${portalSignals.online} / ${portalSignals.total} live modules responding`}
                data={[0, 1, 2, portalSignals.online]}
                color="#22C55E"
              />
              <MetricCell
                label="LIVE DATA"
                value={summary.error || metrics.error ? "PARTIAL" : "ONLINE"}
                helper={summary.data?.lastSyncAt ? `Last sync ${formatRelativeTime(summary.data.lastSyncAt)}` : "Waiting for case sync data"}
                data={[1, 2, 2, summary.data?.activeRecords ?? 0].map((v) => Number(v))}
                color="#8B5CF6"
              />
              <MetricCell
                label="SESSION"
                value={me?.sessionMode === "dev_placeholder" ? "DEV MODE" : "ACTIVE"}
                helper={accountName}
                data={[1, 1, 2, me?.memberships?.length ?? 0]}
                color="#3B82F6"
              />
              <MetricCell
                label="ACCOUNT ROLE"
                value={role ? role.replace("_", " ").toUpperCase() : "UNASSIGNED"}
                helper={membershipSummary}
                data={[1, 2, 1, isOperator ? 3 : 2]}
                color="#F97316"
              />
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
                    <span style={{ fontSize: 9.5, color: MUTED }}>Replay validated</span>
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
              <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                <svg viewBox="0 0 96 96" width={90} height={90} style={{ flexShrink: 0 }}>
                  {threatPaths.map((segment) => (
                    <path key={segment.label} d={segment.path} fill={segment.color} stroke="#080a0e" strokeWidth="1.5" />
                  ))}
                  <text x="48" y="45" textAnchor="middle" fontSize="16" fontWeight="800" fill={TEXT}>
                    {formatCount(threats.data.activeThreatFamilies)}
                  </text>
                  <text x="48" y="58" textAnchor="middle" fontSize="7.5" fill={MUTED} letterSpacing="0.1em">
                    ACTIVE
                  </text>
                </svg>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                    <span style={{ fontSize: 10.5, color: "#CBD5E1" }}>Critical exposure</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#EF4444" }}>{formatCount(threats.data.criticalExposure)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                    <span style={{ fontSize: 10.5, color: "#CBD5E1" }}>Replay gaps</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: GOLD }}>{formatCount(threats.data.replayGaps)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                    <span style={{ fontSize: 10.5, color: "#CBD5E1" }}>Highest score</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: TEXT }}>{formatCount(threats.data.highestThreatScore)}</span>
                  </div>
                  <div style={{ fontSize: 9.5, color: MUTED, marginTop: 4 }}>
                    {topThreatFamily ? `${topThreatFamily.threatFamily} currently leads the matrix.` : "No threat families available."}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div style={{ fontSize: 9.5, fontWeight: 600, letterSpacing: "0.13em", color: GOLD, textTransform: "uppercase" }}>
          Account Operations
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.15fr 1fr",
            gap: 10,
            marginBottom: 10,
          }}
        >
          <div style={CARD}>
            <SectionHead icon={FolderOpen} title="Critical Intelligence" action="VIEW LIBRARY" href="/dashboard/case-library" />
            <LoadingOrUnavailable
              loading={summary.loading || criticalIntel.loading}
              error={summary.error || criticalIntel.error}
            />
            {!summary.loading && !criticalIntel.loading && !summary.error && !criticalIntel.error ? (
              <div style={{ display: "grid", gap: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                  <div style={{ fontSize: 10, color: MUTED }}>
                    Recent critical and high issues with replay-based defense readiness.
                  </div>
                  <div style={{ display: "inline-flex", gap: 6, padding: 3, borderRadius: 6, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(212,175,55,0.12)" }}>
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
                            borderRadius: 4,
                            padding: "5px 9px",
                            fontSize: 9,
                            fontWeight: 700,
                            letterSpacing: "0.08em",
                            color: active ? "#080a0e" : "#CBD5E1",
                            background: active ? GOLD : "transparent",
                          }}
                        >
                          {window.toUpperCase()}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                    gap: 10,
                  }}
                >
                  <div>
                    <div style={{ fontSize: 8.5, color: MUTED, letterSpacing: "0.08em" }}>CRITICAL</div>
                    <div style={{ marginTop: 4, fontSize: 18, fontWeight: 800, color: TEXT }}>
                      {formatCount(criticalIntel.data?.criticalCount)}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 8.5, color: MUTED, letterSpacing: "0.08em" }}>HIGH</div>
                    <div style={{ marginTop: 4, fontSize: 18, fontWeight: 800, color: "#F97316" }}>
                      {formatCount(criticalIntel.data?.highCount)}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 8.5, color: MUTED, letterSpacing: "0.08em" }}>REPLAYABLE</div>
                    <div style={{ marginTop: 4, fontSize: 18, fontWeight: 800, color: GOLD }}>
                      {formatCount(criticalIntel.data?.replayableCount)}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 8.5, color: MUTED, letterSpacing: "0.08em" }}>DEFENDED %</div>
                    <div style={{ marginTop: 4, fontSize: 18, fontWeight: 800, color: "#22C55E" }}>
                      {formatPct(criticalIntel.data?.defenseReadinessPct)}
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gap: 12,
                  }}
                >
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 10,
                      alignItems: "start",
                    }}
                  >
                    <div
                      style={{
                        border: "1px solid rgba(212,175,55,0.1)",
                        borderRadius: 8,
                        padding: "10px 12px",
                        background: "rgba(255,255,255,0.02)",
                      }}
                    >
                      <div style={{ display: "grid", gap: 8 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                          <span style={{ fontSize: 9, color: MUTED, letterSpacing: "0.08em" }}>DEFENSE READINESS</span>
                          <span style={{ fontSize: 11, color: "#22C55E", fontWeight: 700 }}>
                            {formatPct(criticalIntel.data?.defenseReadinessPct)}
                          </span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                          <span style={{ fontSize: 9, color: MUTED, letterSpacing: "0.08em" }}>CRITICAL REPLAY GAP</span>
                          <span style={{ fontSize: 11, fontWeight: 700, color: "#EF4444" }}>
                            {formatCount(criticalIntel.data?.criticalReplayMissing)}
                          </span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                          <span style={{ fontSize: 9, color: MUTED, letterSpacing: "0.08em" }}>HIGH REPLAY GAP</span>
                          <span style={{ fontSize: 11, fontWeight: 700, color: "#F97316" }}>
                            {formatCount(criticalIntel.data?.highReplayMissing)}
                          </span>
                        </div>
                      </div>
                      <div style={{ marginTop: 8 }}>
                        <Sparkline
                          data={criticalSpark}
                          color={GOLD}
                          w={150}
                          h={24}
                        />
                      </div>
                    </div>

                    <div
                      style={{
                        border: "1px solid rgba(212,175,55,0.1)",
                        borderRadius: 8,
                        padding: "10px 12px",
                        background: "rgba(255,255,255,0.02)",
                      }}
                    >
                      <div style={{ display: "grid", gap: 8 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                          <span style={{ fontSize: 9, color: MUTED, letterSpacing: "0.08em" }}>TOP THREAT FAMILY</span>
                          <span style={{ fontSize: 10, color: "#CBD5E1", fontWeight: 600, textAlign: "right" }}>
                            {criticalIntel.data?.topThreatFamily ?? "Unavailable"}
                          </span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                          <span style={{ fontSize: 9, color: MUTED, letterSpacing: "0.08em" }}>LAST SYNC</span>
                          <span style={{ fontSize: 10, color: "#CBD5E1", fontWeight: 600 }}>
                            {formatRelativeTime(summary.data?.lastSyncAt)}
                          </span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                          <span style={{ fontSize: 9, color: MUTED, letterSpacing: "0.08em" }}>SERIOUS CASES</span>
                          <span style={{ fontSize: 10, color: TEXT, fontWeight: 700 }}>
                            {formatCount(criticalIntel.data?.seriousTotal)}
                          </span>
                        </div>
                        <div style={{ display: "grid", gap: 6, marginTop: 2 }}>
                          <Link
                            href="/dashboard/case-library"
                            style={{ textDecoration: "none", fontSize: 9, color: "rgba(212,175,55,0.72)", letterSpacing: "0.08em" }}
                          >
                            VIEW SERIOUS CASES
                          </Link>
                          <Link
                            href="/dashboard/threat-matrix"
                            style={{ textDecoration: "none", fontSize: 9, color: "rgba(212,175,55,0.72)", letterSpacing: "0.08em" }}
                          >
                            OPEN THREAT MATRIX
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "grid", gap: 8 }}>
                    <div style={{ fontSize: 9, color: MUTED, letterSpacing: "0.08em" }}>LATEST SERIOUS ISSUES</div>
                    {(criticalIntel.data?.latestSeriousCases?.length ?? 0) > 0 ? (
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: 12,
                          alignItems: "start",
                        }}
                      >
                        {[...(criticalIntel.data?.latestSeriousCases ?? [])]
                          .sort(compareSeriousCases)
                          .slice(0, 4)
                          .map((item) => {
                          const status = defenseStatus(item);
                          return (
                            <div
                              key={item.caseId}
                              style={{
                                display: "grid",
                                gap: 7,
                                padding: "10px 0",
                                borderTop: "1px solid rgba(212,175,55,0.06)",
                              }}
                            >
                              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start" }}>
                                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                                  <StatusPill label={item.severity === "critical" ? "CRITICAL" : "HIGH"} color={item.severity === "critical" ? "#EF4444" : "#F97316"} />
                                  <StatusPill label={status.label} color={status.color} />
                                </div>
                              </div>
                              <div style={{ fontSize: 11, fontWeight: 600, color: TEXT, lineHeight: 1.35 }}>
                                {item.title || item.caseId}
                              </div>
                              <div style={{ fontSize: 9.5, color: MUTED }}>
                                {[item.source || "Unknown source", formatRelativeTime(caseTimestamp(item)), item.caseId].filter(Boolean).join(" | ")}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div style={{ fontSize: 10.5, color: MUTED }}>
                        No critical or high issues observed in this window.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div style={CARD}>
                <SectionHead icon={Activity} title="Bridge Monitor" />
                <StatusPill label="PENDING PROJECT MAP" color={GOLD} />
                <div style={{ marginTop: 10, fontSize: 18, fontWeight: 800, color: TEXT, lineHeight: 1 }}>
                  Not configured
                </div>
                <div style={{ fontSize: 9.5, color: MUTED, marginTop: 4 }}>
                  Bridge monitoring will activate after account route mapping exists.
                </div>
              </div>

              <div style={CARD}>
                <SectionHead icon={Eye} title="Oracle Monitor" />
                <StatusPill label="PENDING PROJECT MAP" color={GOLD} />
                <div style={{ marginTop: 10, fontSize: 18, fontWeight: 800, color: TEXT, lineHeight: 1 }}>
                  Not configured
                </div>
                <div style={{ fontSize: 9.5, color: MUTED, marginTop: 4 }}>
                  Oracle monitoring depends on project feed configuration.
                </div>
              </div>
            </div>

            <div style={CARD}>
              <SectionHead icon={Cpu} title="Execution Adapters" action="ACCOUNT OPS" href="/dashboard/adapters" />
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
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
                  <div style={{ fontSize: 9, color: MUTED, letterSpacing: "0.08em" }}>ACCOUNT</div>
                  <div style={{ marginTop: 5, fontSize: 13, color: TEXT, fontWeight: 700 }}>{accountName}</div>
                  <div style={{ marginTop: 3, fontSize: 10, color: MUTED }}>{role ?? "No role"}</div>
                </div>
                <div
                  style={{
                    borderRadius: 8,
                    padding: "10px 12px",
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(212,175,55,0.08)",
                  }}
                >
                  <div style={{ fontSize: 9, color: MUTED, letterSpacing: "0.08em" }}>ADAPTER STATUS</div>
                  <div style={{ marginTop: 5, fontSize: 13, color: TEXT, fontWeight: 700 }}>Pending account configuration</div>
                  <div style={{ marginTop: 3, fontSize: 10, color: MUTED }}>No live adapter health endpoint yet</div>
                </div>
                <div
                  style={{
                    borderRadius: 8,
                    padding: "10px 12px",
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(212,175,55,0.08)",
                  }}
                >
                  <div style={{ fontSize: 9, color: MUTED, letterSpacing: "0.08em" }}>PROJECT MAP</div>
                  <div style={{ marginTop: 5, fontSize: 13, color: TEXT, fontWeight: 700 }}>Not configured</div>
                  <div style={{ marginTop: 3, fontSize: 10, color: MUTED }}>Pending account surface definition</div>
                </div>
                <div
                  style={{
                    borderRadius: 8,
                    padding: "10px 12px",
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(212,175,55,0.08)",
                  }}
                >
                  <div style={{ fontSize: 9, color: MUTED, letterSpacing: "0.08em" }}>REPORTS / AUDIT</div>
                  <div style={{ marginTop: 5, fontSize: 13, color: TEXT, fontWeight: 700 }}>No account audit records yet</div>
                  <div style={{ marginTop: 3, fontSize: 10, color: MUTED }}>No reports generated yet</div>
                </div>
              </div>
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
                    <Link href="/dashboard/settings" style={{ textDecoration: "none", fontSize: 9, color: "rgba(212,175,55,0.72)", letterSpacing: "0.08em" }}>
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
