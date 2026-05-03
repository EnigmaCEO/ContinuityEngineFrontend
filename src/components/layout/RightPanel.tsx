"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Bell, Settings } from "lucide-react";
import { fetchIncidentsOverview } from "@/lib/case-library/service";
import type { IncidentOverviewItem, IncidentsOverviewResponse } from "@/lib/case-library/types";
import type { SaasMeResponse } from "@/lib/saas/types";

const alerts = [
  {
    severity: "CRITICAL",
    color: "#EF4444",
    bg: "rgba(239,68,68,0.08)",
    label: "Bridge Anomaly Detected",
    source: "SigmaBridge",
    time: "14:35:21 UTC",
  },
  {
    severity: "HIGH",
    color: "#F97316",
    bg: "rgba(249,115,22,0.08)",
    label: "Unusual Transaction Pattern",
    source: "0xA8f3...7C21",
    time: "14:34:02 UTC",
  },
  {
    severity: "MEDIUM",
    color: "#D4AF37",
    bg: "rgba(212,175,55,0.08)",
    label: "Oracle Deviation Threshold",
    source: "Chainlink ETH/USD",
    time: "14:28:11 UTC",
  },
  {
    severity: "LOW",
    color: "#A855F7",
    bg: "rgba(168,85,247,0.08)",
    label: "Rate Limit Approaching",
    source: "API Gateway",
    time: "14:22:47 UTC",
  },
];

const feed = [
  { time: "14:37:15", label: "Policy signature verified",     source: "Doctrine Engine" },
  { time: "14:37:02", label: "Heartbeat: Bridge SigmaBridge", source: "Bridge Monitor" },
  { time: "14:36:58", label: "Oracle update: ETH/USD",        source: "Chainlink" },
  { time: "14:36:45", label: "Adapter sync complete",         source: "EVM Adapter" },
];

const S = {
  sectionTitle: {
    fontSize: 9.5,
    fontWeight: 600,
    letterSpacing: "0.14em",
    color: "#D4AF37",
  } as React.CSSProperties,
  viewAll: {
    fontSize: 8.5,
    color: "rgba(212,175,55,0.65)",
    letterSpacing: "0.06em",
    cursor: "pointer",
    textDecoration: "none",
  } as React.CSSProperties,
};

function incidentSeverityColor(severity: string | null | undefined): string {
  if (severity === "critical") return "#EF4444";
  if (severity === "high") return "#F97316";
  if (severity === "medium") return "#D4AF37";
  return "#22C55E";
}

function formatIncidentTime(value: string | null | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function RightPanel({ me }: { me: SaasMeResponse }) {
  const [incidents, setIncidents] = useState<IncidentsOverviewResponse | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchIncidentsOverview()
      .then((data) => {
        if (!cancelled) setIncidents(data);
      })
      .catch(() => { /* non-critical, right rail degrades gracefully */ });
    return () => { cancelled = true; };
  }, []);

  const recentIncidents: IncidentOverviewItem[] = incidents?.recent_incidents?.slice(0, 5) ?? [];

  const initials = me.user.name
    .split(/\s+/)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 2);

  return (
    <div
      style={{
        width: 316,
        minWidth: 316,
        background: "#0b0d12",
        borderLeft: "1px solid rgba(212,175,55,0.18)",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflowY: "auto",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "15px 16px",
          borderBottom: "1px solid rgba(212,175,55,0.12)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: "0.1em",
              color: "#D4AF37",
              lineHeight: 1.2,
            }}
          >
            SCE PORTAL
          </div>
          <div
            style={{
              fontSize: 9,
              color: "rgba(212,175,55,0.55)",
              letterSpacing: "0.06em",
              marginTop: 1,
            }}
          >
            Continuity Command v2.7.1
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Bell size={15} style={{ color: "rgba(212,175,55,0.65)" }} />
          <Settings size={15} style={{ color: "rgba(212,175,55,0.65)" }} />
          <div style={{ position: "relative" }}>
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: "50%",
                background: "rgba(212,175,55,0.15)",
                border: "1px solid rgba(212,175,55,0.4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 10,
                fontWeight: 700,
                color: "#D4AF37",
              }}
            >
              {initials || "SC"}
            </div>
            <div
              style={{
                position: "absolute",
                bottom: 0,
                right: 0,
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "#22C55E",
                border: "1.5px solid #0b0d12",
              }}
            />
          </div>
        </div>
      </div>

      {/* Live Alerts — max 4 */}
      <div
        style={{
          padding: "13px 16px",
          borderBottom: "1px solid rgba(212,175,55,0.1)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 10,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div
              style={{
                width: 4,
                height: 4,
                borderRadius: "50%",
                background: "#EF4444",
                boxShadow: "0 0 6px #EF4444",
              }}
            />
            <span style={S.sectionTitle}>LIVE ALERTS</span>
          </div>
          <span style={S.viewAll}>VIEW ALL</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div
            style={{
              background: "rgba(59,130,246,0.08)",
              border: "1px solid rgba(59,130,246,0.22)",
              borderRadius: 6,
              padding: "8px 10px",
              marginBottom: 4,
            }}
          >
            <div style={{ fontSize: 8.5, letterSpacing: "0.08em", color: "#93C5FD" }}>
              ACTIVE SESSION
            </div>
            <div style={{ fontSize: 10.5, color: "#E2E8F0", marginTop: 2 }}>
              {me.user.email}
            </div>
            <div style={{ fontSize: 9, color: "rgba(140,140,170,0.72)", marginTop: 2 }}>
              {me.activeAccount?.name ?? "No account"} · {me.currentRole ?? "unassigned"}
            </div>
          </div>
          {alerts.slice(0, 4).map((alert, i) => (
            <div
              key={i}
              style={{
                background: alert.bg,
                border: `1px solid ${alert.color}28`,
                borderRadius: 6,
                padding: "7px 10px",
                display: "flex",
                gap: 8,
                alignItems: "flex-start",
              }}
            >
              <div
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: alert.color,
                  marginTop: 3,
                  flexShrink: 0,
                  boxShadow: `0 0 5px ${alert.color}80`,
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    marginBottom: 2,
                  }}
                >
                  <span
                    style={{
                      fontSize: 8.5,
                      fontWeight: 700,
                      color: alert.color,
                      letterSpacing: "0.06em",
                    }}
                  >
                    {alert.severity}
                  </span>
                  <span
                    style={{
                      fontSize: 10.5,
                      color: "#E2E8F0",
                      fontWeight: 500,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {alert.label}
                  </span>
                </div>
                <div style={{ fontSize: 9, color: "rgba(140,140,170,0.7)" }}>
                  {alert.source} · {alert.time}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Incident Timeline — live recent incidents, max 5 */}
      <div
        style={{
          padding: "13px 16px",
          borderBottom: "1px solid rgba(212,175,55,0.1)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 10,
          }}
        >
          <span style={S.sectionTitle}>INCIDENT TIMELINE</span>
          <Link href="/dashboard/incidents" style={S.viewAll}>VIEW ALL</Link>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          {recentIncidents.length > 0 ? recentIncidents.map((item, i) => (
            <Link
              key={item.id}
              href={`/dashboard/incidents/${encodeURIComponent(item.id)}`}
              style={{ textDecoration: "none" }}
            >
              <div
                style={{
                  display: "flex",
                  gap: 9,
                  paddingBottom: 10,
                  position: "relative",
                }}
              >
                {i < recentIncidents.length - 1 && (
                  <div
                    style={{
                      position: "absolute",
                      left: 42,
                      top: 12,
                      bottom: 0,
                      width: 1,
                      background: "rgba(212,175,55,0.12)",
                    }}
                  />
                )}
                <span
                  style={{
                    fontSize: 9,
                    color: "rgba(140,140,170,0.65)",
                    fontFamily: "monospace",
                    minWidth: 40,
                    textAlign: "right",
                    flexShrink: 0,
                    paddingTop: 1,
                  }}
                >
                  {formatIncidentTime(item.published_discovered_date)}
                </span>
                <div
                  style={{
                    width: 9,
                    height: 9,
                    borderRadius: "50%",
                    background: incidentSeverityColor(item.severity),
                    flexShrink: 0,
                    marginTop: 2,
                    boxShadow: `0 0 5px ${incidentSeverityColor(item.severity)}60`,
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 10.5,
                      color: "#CBD5E1",
                      fontWeight: 500,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {item.title || item.id}
                  </div>
                  <div style={{ fontSize: 9, color: "rgba(140,140,170,0.6)" }}>
                    {item.source || "Unknown source"}
                  </div>
                </div>
              </div>
            </Link>
          )) : (
            <div style={{ fontSize: 10, color: "rgba(140,140,170,0.55)", paddingBottom: 8 }}>
              No recent incidents.
            </div>
          )}
        </div>
        <Link
          href="/dashboard/incidents"
          style={{
            display: "block",
            width: "100%",
            marginTop: 2,
            padding: "8px 0",
            background: "rgba(212,175,55,0.06)",
            border: "1px solid rgba(212,175,55,0.22)",
            borderRadius: 6,
            fontSize: 9.5,
            color: "rgba(212,175,55,0.75)",
            cursor: "pointer",
            letterSpacing: "0.1em",
            textDecoration: "none",
            textAlign: "center",
          }}
        >
          VIEW INCIDENT CENTER
        </Link>
      </div>

      {/* System Feed — max 4 */}
      <div style={{ padding: "13px 16px", flex: 1 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 10,
          }}
        >
          <span style={S.sectionTitle}>SYSTEM FEED</span>
          <span style={S.viewAll}>VIEW FULL FEED</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          {feed.slice(0, 4).map((item, i) => (
            <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
              <span
                style={{
                  fontSize: 9,
                  color: "rgba(140,140,170,0.6)",
                  fontFamily: "monospace",
                  minWidth: 42,
                  textAlign: "right",
                  flexShrink: 0,
                  paddingTop: 1,
                }}
              >
                {item.time}
              </span>
              <div
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  background: "rgba(212,175,55,0.5)",
                  marginTop: 4,
                  flexShrink: 0,
                }}
              />
              <div>
                <div style={{ fontSize: 10.5, color: "#94A3B8" }}>{item.label}</div>
                <div style={{ fontSize: 9, color: "rgba(140,140,170,0.55)" }}>
                  {item.source}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
