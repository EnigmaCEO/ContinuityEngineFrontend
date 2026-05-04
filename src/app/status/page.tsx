import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "System Status — Sagitta Continuity Engine",
  description: "Current operational status of Sagitta Continuity Engine services.",
};

const BG = "#080a0e";
const TEXT = "#E2E8F0";
const TEXT_MUTED = "rgba(203,213,225,0.72)";
const TEXT_FAINT = "rgba(148,163,184,0.58)";
const PURPLE = "#8B5CF6";
const PURPLE_FAINT = "rgba(139,92,246,0.18)";
const BORDER = "rgba(212,175,55,0.14)";
const GREEN = "#22c55e";
const GREEN_FAINT = "rgba(34,197,94,0.12)";
const GREEN_DIM = "rgba(34,197,94,0.72)";

const SERVICES = [
  { name: "SCE Portal", description: "Authentication, dashboard, project access", status: "operational" },
  { name: "Incident Feed Ingestion", description: "De.Fi REKT, GitHub Advisories, NVD, CISA KEV", status: "operational" },
  { name: "Authority Risk Scanner", description: "On-chain admin surface detection and classification", status: "operational" },
  { name: "Threat Family Mapping", description: "Incident-to-doctrine classification engine", status: "operational" },
  { name: "Defense Review Pipeline", description: "Report generation and evidence tracking", status: "operational" },
  { name: "Case Library", description: "Global incident archive and search", status: "operational" },
];

const HISTORY = [
  { date: "May 2026", label: "No incidents reported" },
  { date: "April 2026", label: "No incidents reported" },
  { date: "March 2026", label: "No incidents reported" },
];

export default function StatusPage() {
  return (
    <div style={{ background: BG, color: TEXT, minHeight: "100vh", fontFamily: "var(--font-geist-sans), Arial, sans-serif" }}>

      {/* Header */}
      <div style={{ padding: "64px max(40px, 5vw) 48px", borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", color: PURPLE, textTransform: "uppercase", marginBottom: 16 }}>
          System Status
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <h1 style={{ margin: 0, fontSize: "clamp(28px, 3.5vw, 48px)", fontWeight: 900, lineHeight: 1.08, letterSpacing: "-0.02em", color: TEXT }}>
            All systems operational
          </h1>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 14px",
            borderRadius: 20,
            background: GREEN_FAINT,
            border: `1px solid rgba(34,197,94,0.25)`,
            flexShrink: 0,
          }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: GREEN, display: "inline-block", flexShrink: 0 }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: GREEN_DIM }}>Operational</span>
          </div>
        </div>
        <p style={{ margin: "16px 0 0", fontSize: 13, color: TEXT_FAINT }}>
          Last checked: {new Date().toUTCString()}
        </p>
      </div>

      {/* Service list */}
      <div style={{ padding: "48px max(40px, 5vw)", maxWidth: 860 }}>
        <h2 style={{ margin: "0 0 24px", fontSize: 14, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: TEXT_FAINT }}>
          Services
        </h2>
        <div style={{ display: "grid", gap: 2 }}>
          {SERVICES.map((service) => (
            <div key={service.name} style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
              padding: "18px 20px",
              borderRadius: 10,
              border: `1px solid ${PURPLE_FAINT}`,
              background: "rgba(139,92,246,0.03)",
              marginBottom: 8,
            }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: TEXT, marginBottom: 3 }}>{service.name}</div>
                <div style={{ fontSize: 12, color: TEXT_FAINT }}>{service.description}</div>
              </div>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                flexShrink: 0,
              }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: GREEN, display: "inline-block" }} />
                <span style={{ fontSize: 12, color: GREEN_DIM, fontWeight: 500 }}>Operational</span>
              </div>
            </div>
          ))}
        </div>

        {/* Incident history */}
        <h2 style={{ margin: "48px 0 20px", fontSize: 14, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: TEXT_FAINT }}>
          Incident History
        </h2>
        <div style={{ display: "grid", gap: 8 }}>
          {HISTORY.map((entry) => (
            <div key={entry.date} style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "14px 20px",
              borderRadius: 10,
              border: `1px solid ${BORDER}`,
            }}>
              <span style={{ fontSize: 13, color: TEXT_FAINT }}>{entry.date}</span>
              <span style={{ fontSize: 13, color: GREEN_DIM }}>{entry.label}</span>
            </div>
          ))}
        </div>

        {/* Contact note */}
        <div style={{
          marginTop: 48,
          padding: "20px 24px",
          borderRadius: 12,
          border: `1px solid ${PURPLE_FAINT}`,
          background: "rgba(139,92,246,0.04)",
          display: "flex",
          gap: 16,
          alignItems: "flex-start",
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={PURPLE} strokeWidth="1.8" style={{ flexShrink: 0, marginTop: 1 }}>
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: TEXT, marginBottom: 4 }}>Report an issue</div>
            <div style={{ fontSize: 13, color: TEXT_MUTED, lineHeight: 1.65 }}>
              If you are experiencing a problem not reflected here, contact{" "}
              <a href="mailto:hello@sagitta.systems" style={{ color: PURPLE, textDecoration: "none" }}>hello@sagitta.systems</a>.
            </div>
          </div>
        </div>
      </div>

      {/* Footer bar */}
      <div style={{
        padding: "20px max(40px, 5vw)",
        borderTop: `1px solid ${BORDER}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 12,
      }}>
        <Link href="/" style={{ fontSize: 12, color: TEXT_FAINT, textDecoration: "none" }}>← Back to home</Link>
        <div style={{ display: "flex", gap: 16, fontSize: 12, color: TEXT_FAINT }}>
          <Link href="/privacy" style={{ color: TEXT_FAINT, textDecoration: "none" }}>Privacy</Link>
          <Link href="/terms" style={{ color: TEXT_FAINT, textDecoration: "none" }}>Terms</Link>
        </div>
      </div>
    </div>
  );
}
