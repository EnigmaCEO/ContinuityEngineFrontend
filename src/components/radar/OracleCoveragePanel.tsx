"use client";

import { useState } from "react";
import type { OracleCoverageItem, OracleCoveragePurpose, OracleCoverageSummary } from "@/lib/radar/types";

const GROUPS: Array<{ purpose: OracleCoveragePurpose; label: string }> = [
  { purpose: "sagitta_dependency", label: "Sagitta Dependencies" },
  { purpose: "technical_smoke", label: "Technical Smoke" },
  { purpose: "oracle_reference", label: "Oracle References" },
  { purpose: "pending_ecosystem", label: "Pending Ecosystem" },
  { purpose: "commercial_priority", label: "Commercial Priority" },
];

export function OracleCoveragePanel({
  items,
  summary,
  error,
}: {
  items: OracleCoverageItem[];
  summary: OracleCoverageSummary | null;
  error: string | null;
}) {
  const activeTabs = GROUPS.filter(({ purpose }) => items.some((i) => i.purpose === purpose));
  const [activeTab, setActiveTab] = useState(0);
  const currentGroup = activeTabs[activeTab] ?? null;
  const currentRows = currentGroup ? items.filter((i) => i.purpose === currentGroup.purpose) : [];

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
          ORACLE COVERAGE
        </div>
        <div style={{ fontSize: 11, color: "rgba(203,213,225,0.7)", lineHeight: 1.5 }}>
          Configured dependencies, references, and pending targets. Alerts fire only for enabled feeds whose doctrine thresholds are crossed.
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
          Oracle coverage is temporarily unavailable. {error}
        </div>
      ) : null}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10 }}>
        <SummaryCard label="Sagitta Dependencies" value={String(summary?.activeDependencyFeeds ?? 0)} />
        <SummaryCard label="Active Feeds" value={String(summary?.enabledOnchainFeeds ?? 0)} />
        <SummaryCard label="Reference Sources" value={String(summary?.referenceOnlySources ?? 0)} />
        <SummaryCard label="Pending Ecosystem" value={String(summary?.pendingEcosystemItems ?? 0)} />
        <SummaryCard label="Providers Covered" value={String(summary?.providersCovered.length ?? 0)} />
        <SummaryCard label="Active Dependency Alerts" value={String(summary?.activeDependencyAlertCount ?? 0)} />
      </div>

      {summary?.latestDependencyAlert ? (
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
          <div style={{ fontSize: 9, color: "rgba(148,163,184,0.7)", letterSpacing: "0.08em" }}>LATEST DEPENDENCY ALERT</div>
          <div style={{ fontSize: 11, color: "#E2E8F0", fontWeight: 700 }}>{summary.latestDependencyAlert.summary}</div>
          <div style={{ fontSize: 10, color: "rgba(148,163,184,0.72)" }}>
            {humanizeStatus(summary.latestDependencyAlert.severity)} · {summary.latestDependencyAlert.chain ?? "Unknown chain"} · {summary.latestDependencyAlert.asset ?? "Unknown asset"}
          </div>
        </div>
      ) : null}

      {activeTabs.length > 0 ? (
        <div style={{ display: "grid", gap: 0 }}>
          <div style={{ display: "flex", gap: 0, overflowX: "auto", borderBottom: "1px solid rgba(148,163,184,0.12)" }}>
            {activeTabs.map(({ purpose, label }, index) => {
              const count = items.filter((i) => i.purpose === purpose).length;
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
                    transition: "color 0.12s",
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
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#E2E8F0" }}>
                    {item.pair}{item.chain ? ` on ${item.chain}` : ""}
                  </div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <MiniBadge label={humanizeStatus(item.provider)} color="#D4AF37" />
                    <MiniBadge label={humanizeStatus(item.status)} color={coverageStatusColor(item.status)} />
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 8 }}>
                  <Field label="Provider" value={humanizeStatus(item.provider)} />
                  <Field label="Chain" value={item.chain ?? "—"} />
                  <Field label="Asset Class" value={humanizeStatus(item.assetClass)} />
                  <Field label="Doctrine Class" value={formatDoctrineClass(item.doctrineClass, item.assetClass)} />
                  <Field label="Doctrine Mode" value={formatDoctrineThresholdSource(item.doctrineThresholdSource)} />
                  <Field label="Commercial Value" value={humanizeStatus(item.commercialValueTier)} />
                  <Field label="Chainlink Risk" value={humanizeStatus(item.chainlinkMarketRiskCategory)} />
                  <Field label="Can Alert" value={item.canAlert ? "Yes" : "No"} />
                  <Field label="Can Reference Compare" value={item.canReferenceCompare ? "Yes" : "No"} />
                  <Field label="Warning Threshold" value={formatDuration(item.warningAfterSeconds)} />
                  <Field label="Critical Threshold" value={formatDuration(item.criticalAfterSeconds)} />
                  <Field label="Latest Status" value={item.latestStatus ? humanizeStatus(item.latestStatus) : "n/a"} />
                  <Field label="Latest Checked" value={formatDateTime(item.lastCheckedAt)} />
                  <Field label="Latest Alert" value={item.latestAlertId ?? "None"} />
                  <Field label="Metadata" value={humanizeStatus(item.officialMetadataStatus)} />
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

function humanizeStatus(value: string): string {
  return value.replace(/[_-]/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function coverageStatusColor(value: OracleCoverageItem["status"]): string {
  if (value === "active") return "#22C55E";
  if (value === "enabled" || value === "reference_only") return "#38BDF8";
  if (value === "pending") return "#D4AF37";
  if (value === "unavailable") return "#F97316";
  return "#94A3B8";
}

function formatDoctrineClass(
  value: OracleCoverageItem["doctrineClass"],
  assetClass: OracleCoverageItem["assetClass"],
): string {
  if (!value) {
    return assetClass === "stablecoin" ? "Stablecoin" : "n/a";
  }
  if (value === "stablecoin_dependency") return "Stablecoin";
  if (value === "commodity_backed_dependency") return "Commodity-backed";
  return "Volatile reference";
}

function formatDoctrineThresholdSource(value: OracleCoverageItem["doctrineThresholdSource"]): string {
  if (!value) return "n/a";
  return value === "default" ? "Default doctrine" : "Custom override";
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
