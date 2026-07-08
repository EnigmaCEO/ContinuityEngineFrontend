"use client";

import { useState } from "react";

import type {
  BridgeCoverageItem,
  BridgeCoveragePurpose,
  BridgeCoverageSummary,
} from "@/lib/radar/types";

const GROUPS: Array<{ purpose: BridgeCoveragePurpose; label: string }> = [
  { purpose: "sagitta_dependency", label: "Sagitta Dependencies" },
  { purpose: "technical_smoke", label: "Technical Smoke" },
  { purpose: "commercial_priority", label: "Commercial Priority" },
  { purpose: "pending_ecosystem", label: "Pending Ecosystem" },
  { purpose: "backlog", label: "Backlog" },
];

export function BridgeCoveragePanel({
  items,
  summary,
  error,
}: {
  items: BridgeCoverageItem[];
  summary: BridgeCoverageSummary | null;
  error: string | null;
}) {
  const activeTabs = GROUPS.filter(({ purpose }) => items.some((item) => item.purpose === purpose));
  const [activeTab, setActiveTab] = useState(0);
  const currentGroup = activeTabs[activeTab] ?? null;
  const currentRows = currentGroup ? items.filter((item) => item.purpose === currentGroup.purpose) : [];

  return (
    <section
      style={{
        background: "linear-gradient(180deg, rgba(15,18,28,0.96), rgba(8,10,14,0.96))",
        border: "1px solid rgba(212,175,55,0.12)",
        borderRadius: 10,
        padding: 16,
        display: "grid",
        gap: 14,
      }}
    >
      <div>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", color: "#D4AF37", marginBottom: 4 }}>
          BRIDGE COVERAGE
        </div>
        <div style={{ fontSize: 11, color: "rgba(203,213,225,0.7)", lineHeight: 1.5 }}>
          Bridge coverage rows are registry entries. Pending, disabled, blocked, and backlog rows are not active monitoring. Alerts require a live route monitor and crossed doctrine thresholds.
        </div>
      </div>

      {error ? (
        <div
          style={{
            borderRadius: 8,
            border: "1px solid rgba(249,115,22,0.25)",
            background: "rgba(24,12,8,0.88)",
            padding: "12px 14px",
            color: "#FDBA74",
            fontSize: 11,
            lineHeight: 1.6,
          }}
        >
          Bridge coverage is temporarily unavailable. {error}
        </div>
      ) : null}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10 }}>
        <SummaryCard label="Sagitta Routes" value={String(summary?.sagittaDependencyRoutes ?? 0)} />
        <SummaryCard label="Active Routes" value={String(summary?.activeRoutes ?? 0)} />
        <SummaryCard label="Enabled Routes" value={String(summary?.enabledRoutes ?? 0)} />
        <SummaryCard label="Pending Routes" value={String(summary?.pendingRoutes ?? 0)} />
        <SummaryCard label="Providers Covered" value={String(summary?.providersCovered.length ?? 0)} />
        <SummaryCard label="Active Bridge Alerts" value={String(summary?.activeBridgeAlerts ?? 0)} />
      </div>

      {summary?.latestBridgeAlert ? (
        <div
          style={{
            borderRadius: 8,
            border: "1px solid rgba(148,163,184,0.12)",
            background: "rgba(8,10,16,0.55)",
            padding: "10px 12px",
            display: "grid",
            gap: 4,
          }}
        >
          <div style={{ fontSize: 9, color: "rgba(148,163,184,0.7)", letterSpacing: "0.08em" }}>LATEST BRIDGE ALERT</div>
          <div style={{ fontSize: 11, color: "#E2E8F0", fontWeight: 700 }}>{summary.latestBridgeAlert.summary}</div>
          <div style={{ fontSize: 10, color: "rgba(148,163,184,0.72)" }}>
            {humanize(summary.latestBridgeAlert.severity)} | {summary.latestBridgeAlert.route ?? "Unknown route"} | {summary.latestBridgeAlert.asset ?? "Unknown asset"}
          </div>
        </div>
      ) : null}

      {activeTabs.length > 0 ? (
        <div style={{ display: "grid", gap: 0 }}>
          <div style={{ display: "flex", gap: 0, overflowX: "auto", borderBottom: "1px solid rgba(148,163,184,0.12)" }}>
            {activeTabs.map(({ purpose, label }, index) => {
              const count = items.filter((item) => item.purpose === purpose).length;
              const isActive = index === activeTab;
              return (
                <button
                  key={purpose}
                  type="button"
                  onClick={() => setActiveTab(index)}
                  style={{
                    flexShrink: 0,
                    fontSize: 11,
                    fontWeight: isActive ? 700 : 500,
                    padding: "9px 14px",
                    border: "none",
                    borderBottom: isActive ? "2px solid #D4AF37" : "2px solid transparent",
                    background: "transparent",
                    color: isActive ? "#F5E7A1" : "rgba(148,163,184,0.6)",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    letterSpacing: "0.04em",
                  }}
                >
                  {label}
                  <span
                    style={{
                      marginLeft: 5,
                      fontSize: 9,
                      fontWeight: 700,
                      padding: "1px 5px",
                      borderRadius: 9,
                      background: isActive ? "rgba(212,175,55,0.2)" : "rgba(148,163,184,0.14)",
                      color: isActive ? "#D4AF37" : "rgba(148,163,184,0.7)",
                    }}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <div style={{ display: "grid", gap: 8, paddingTop: 12 }}>
            {currentRows.map((item) => (
              <div
                key={item.id}
                style={{
                  borderRadius: 8,
                  border: "1px solid rgba(148,163,184,0.12)",
                  background: "rgba(15,23,42,0.5)",
                  padding: "12px 14px",
                  display: "grid",
                  gap: 8,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#E2E8F0" }}>{item.routeName}</div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <MiniBadge label={humanize(item.provider)} color="#D4AF37" />
                    <MiniBadge label={humanize(item.status)} color={bridgeStatusColor(item.status)} />
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 8 }}>
                  <Field label="Provider" value={humanize(item.provider)} />
                  <Field label="Route" value={`${item.sourceChain} -> ${item.destinationChain}`} />
                  <Field label="Asset" value={item.asset} />
                  <Field label="Purpose" value={humanize(item.purpose)} />
                  <Field label="Route Class" value={humanize(item.routeClass)} />
                  <Field label="Commercial Value" value={humanize(item.commercialValueTier)} />
                  <Field label="Can Alert" value={item.canAlert ? "Yes" : "No"} />
                  <Field label="Can Broadcast" value={item.canBroadcast ? "Yes" : "No"} />
                  <Field label="Message Type" value={humanize(item.messageType)} />
                  <Field label="Expected Settlement" value={formatDuration(item.expectedSettlementSeconds)} />
                  <Field label="Watch After" value={formatDuration(item.watchAfterSeconds)} />
                  <Field label="Warning After" value={formatDuration(item.warningAfterSeconds)} />
                  <Field label="Critical After" value={formatDuration(item.criticalAfterSeconds)} />
                  <Field label="Metadata" value={humanize(item.metadataStatus)} />
                  <Field label="Latest Status" value={item.latestStatus ? humanize(item.latestStatus) : "n/a"} />
                  <Field label="Latest Checked" value={formatDateTime(item.latestCheckedAt)} />
                  <Field label="Latest Success" value={formatDateTime(item.latestSuccessAt)} />
                  <Field label="Latest Alert" value={item.latestAlertId ?? "None"} />
                </div>
                {item.notes ? (
                  <div style={{ fontSize: 10, color: "rgba(148,163,184,0.72)", lineHeight: 1.6 }}>{item.notes}</div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        borderRadius: 8,
        border: "1px solid rgba(148,163,184,0.12)",
        background: "rgba(8,10,16,0.55)",
        padding: "10px 12px",
      }}
    >
      <div style={{ fontSize: 9, color: "rgba(148,163,184,0.72)", letterSpacing: "0.08em", marginBottom: 4 }}>
        {label.toUpperCase()}
      </div>
      <div style={{ fontSize: 16, color: "#E2E8F0", fontWeight: 700 }}>{value}</div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 9, color: "rgba(148,163,184,0.72)", letterSpacing: "0.08em", marginBottom: 3 }}>
        {label.toUpperCase()}
      </div>
      <div style={{ fontSize: 11, color: "#CBD5E1", lineHeight: 1.5, overflowWrap: "anywhere" }}>{value}</div>
    </div>
  );
}

function MiniBadge({ label, color }: { label: string; color: string }) {
  return (
    <span
      style={{
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: "0.08em",
        color,
        border: `1px solid ${color}40`,
        background: `${color}12`,
        borderRadius: 999,
        padding: "3px 8px",
      }}
    >
      {label}
    </span>
  );
}

function humanize(value: string): string {
  return value.replace(/[_-]/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function bridgeStatusColor(value: BridgeCoverageItem["status"]): string {
  if (value === "active") return "#22C55E";
  if (value === "enabled") return "#38BDF8";
  if (value === "pending") return "#D4AF37";
  if (value === "blocked") return "#F97316";
  if (value === "backlog") return "#A78BFA";
  return "#94A3B8";
}

function formatDuration(value: number | null | undefined): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return "n/a";
  if (value < 60) return `${value}s`;
  const minutes = Math.floor(value / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) return "Never";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Never";
  return date.toLocaleString();
}
