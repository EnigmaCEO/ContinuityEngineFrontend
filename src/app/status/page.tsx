import type { Metadata } from "next";
import Link from "next/link";

import {
  fetchOperationsStatus,
  type ComponentState,
  type OperationalState,
} from "@/lib/operations-status";

export const metadata: Metadata = {
  title: "System Status — Sagitta Continuity Engine",
  description: "Live operational status of Sagitta Continuity Engine services.",
};
export const dynamic = "force-dynamic";

const BG = "#080a0e";
const TEXT = "#E2E8F0";
const TEXT_MUTED = "rgba(203,213,225,0.72)";
const TEXT_FAINT = "rgba(148,163,184,0.7)";
const PURPLE = "#8B5CF6";
const PURPLE_FAINT = "rgba(139,92,246,0.18)";
const BORDER = "rgba(212,175,55,0.14)";

const OVERALL_PRESENTATION: Record<OperationalState, { label: string; copy: string; color: string; background: string }> = {
  operational: {
    label: "Operational",
    copy: "All monitored SCE components are responding within their expected contracts.",
    color: "#22c55e",
    background: "rgba(34,197,94,0.12)",
  },
  degraded: {
    label: "Degraded",
    copy: "SCE is operating with reduced readiness or stale dependency data.",
    color: "#f59e0b",
    background: "rgba(245,158,11,0.12)",
  },
  partial_outage: {
    label: "Partial outage",
    copy: "One or more SCE capabilities are currently unavailable.",
    color: "#f97316",
    background: "rgba(249,115,22,0.12)",
  },
  major_outage: {
    label: "Major outage",
    copy: "Core SCE services are currently unavailable.",
    color: "#ef4444",
    background: "rgba(239,68,68,0.12)",
  },
  unknown: {
    label: "Unknown",
    copy: "Current SCE status could not be verified.",
    color: "#94a3b8",
    background: "rgba(148,163,184,0.12)",
  },
};

const COMPONENT_PRESENTATION: Record<ComponentState, { label: string; color: string }> = {
  operational: { label: "Operational", color: "#22c55e" },
  degraded: { label: "Degraded", color: "#f59e0b" },
  unavailable: { label: "Unavailable", color: "#ef4444" },
  unknown: { label: "Unknown", color: "#94a3b8" },
};

function formatTimestamp(value: string): string {
  const date = new Date(value);
  return Number.isFinite(date.getTime())
    ? new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "medium", timeZone: "UTC" }).format(date) + " UTC"
    : "Not available";
}

export default async function StatusPage() {
  const status = await fetchOperationsStatus();
  const presentation = OVERALL_PRESENTATION[status.overall];

  return (
    <main
      data-overall-status={status.overall}
      data-status-stale={String(status.stale)}
      style={{ background: BG, color: TEXT, minHeight: "100vh", fontFamily: "var(--font-geist-sans), Arial, sans-serif" }}
    >
      <div style={{ padding: "64px max(40px, 5vw) 48px", borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", color: PURPLE, textTransform: "uppercase", marginBottom: 16 }}>
          System Status
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <h1 style={{ margin: 0, fontSize: "clamp(28px, 3.5vw, 48px)", fontWeight: 900, lineHeight: 1.08, letterSpacing: "-0.02em", color: TEXT }}>
            {presentation.label}
          </h1>
          <div
            role="status"
            aria-live="polite"
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 14px", borderRadius: 20, background: presentation.background, border: `1px solid ${presentation.color}55`, flexShrink: 0 }}
          >
            <span aria-hidden="true" style={{ width: 8, height: 8, borderRadius: "50%", background: presentation.color, display: "inline-block", flexShrink: 0 }} />
            <span style={{ fontSize: 12, fontWeight: 650, color: presentation.color }}>{presentation.label}</span>
          </div>
        </div>
        <p style={{ margin: "16px 0 0", fontSize: 15, lineHeight: 1.6, color: TEXT_MUTED }}>{presentation.copy}</p>
        <p style={{ margin: "10px 0 0", fontSize: 13, color: TEXT_FAINT }}>
          Last checked: <time dateTime={status.generatedAt}>{formatTimestamp(status.generatedAt)}</time>
        </p>
        {status.stale && status.lastSuccessfulRefreshAt && (
          <p role="status" style={{ margin: "12px 0 0", padding: "10px 14px", maxWidth: 620, border: "1px solid rgba(245,158,11,0.35)", borderRadius: 8, color: "#fbbf24", background: "rgba(245,158,11,0.08)", fontSize: 13 }}>
            Showing the last confirmed status from <time dateTime={status.lastSuccessfulRefreshAt}>{formatTimestamp(status.lastSuccessfulRefreshAt)}</time>.
          </p>
        )}
      </div>

      <div style={{ padding: "48px max(40px, 5vw)", maxWidth: 900 }}>
        <h2 style={{ margin: "0 0 24px", fontSize: 14, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: TEXT_FAINT }}>
          Monitored components
        </h2>
        {status.components.length > 0 ? (
          <div style={{ display: "grid", gap: 8 }}>
            {status.components.map((component) => {
              const componentPresentation = COMPONENT_PRESENTATION[component.state];
              return (
                <section
                  key={component.id}
                  data-component-id={component.id}
                  data-component-status={component.state}
                  aria-label={`${component.label}: ${componentPresentation.label}`}
                  style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 24, padding: "18px 20px", borderRadius: 10, border: `1px solid ${PURPLE_FAINT}`, background: "rgba(139,92,246,0.03)" }}
                >
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 650, color: TEXT, marginBottom: 5 }}>{component.label}</div>
                    {component.message && <div style={{ fontSize: 12, lineHeight: 1.55, color: TEXT_MUTED }}>{component.message}</div>}
                    <div style={{ marginTop: 7, fontSize: 11, color: TEXT_FAINT }}>
                      Checked <time dateTime={component.checkedAt}>{formatTimestamp(component.checkedAt)}</time>
                      {typeof component.latencyMs === "number" ? ` · ${component.latencyMs} ms` : ""}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, flexShrink: 0, color: componentPresentation.color }}>
                    <span aria-hidden="true" style={{ width: 7, height: 7, borderRadius: "50%", background: componentPresentation.color, display: "inline-block" }} />
                    <span style={{ fontSize: 12, fontWeight: 600 }}>{componentPresentation.label}</span>
                  </div>
                </section>
              );
            })}
          </div>
        ) : (
          <div data-component-status="unknown" role="status" style={{ padding: "20px", borderRadius: 10, border: `1px solid ${BORDER}`, color: TEXT_MUTED }}>
            Component details are not currently available.
          </div>
        )}

        <div style={{ marginTop: 48, padding: "20px 24px", borderRadius: 12, border: `1px solid ${PURPLE_FAINT}`, background: "rgba(139,92,246,0.04)", display: "flex", gap: 16, alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: TEXT, marginBottom: 4 }}>Report an issue</div>
            <div style={{ fontSize: 13, color: TEXT_MUTED, lineHeight: 1.65 }}>
              If you are experiencing a problem not reflected here, contact{" "}
              <a href="mailto:hello@sagitta.systems" style={{ color: PURPLE, textDecoration: "none" }}>hello@sagitta.systems</a>.
            </div>
          </div>
        </div>
      </div>

      <footer style={{ padding: "20px max(40px, 5vw)", borderTop: `1px solid ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <Link href="/" style={{ fontSize: 12, color: TEXT_FAINT, textDecoration: "none" }}>← Back to home</Link>
        <div style={{ display: "flex", gap: 16, fontSize: 12, color: TEXT_FAINT }}>
          <Link href="/privacy" style={{ color: TEXT_FAINT, textDecoration: "none" }}>Privacy</Link>
          <Link href="/terms" style={{ color: TEXT_FAINT, textDecoration: "none" }}>Terms</Link>
        </div>
      </footer>
    </main>
  );
}
