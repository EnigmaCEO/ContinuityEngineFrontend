import type { Metadata } from "next";
import Link from "next/link";
import NavBar from "@/app/NavBar";

export const metadata: Metadata = {
  title: "Resource Hub — Sagitta Continuity Engine",
  description: "Guides, playbooks, incident readiness materials, and research updates from the Sagitta Continuity Engine.",
};

const BG = "#080a0e";
const TEXT = "#E2E8F0";
const TEXT_MUTED = "rgba(203,213,225,0.72)";
const TEXT_FAINT = "rgba(148,163,184,0.58)";
const PURPLE = "#8B5CF6";
const PURPLE_FAINT = "rgba(139,92,246,0.18)";
const PURPLE_GRADIENT_TEXT: React.CSSProperties = {
  background: "linear-gradient(90deg, #d8b4fe 0%, #a855f7 40%, #7c3aed 100%)",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  backgroundClip: "text",
};

const SECTIONS = [
  {
    id: "guides",
    label: "Guides & Playbooks",
    description: "Operational playbooks for incident response, authority-risk triage, and continuity execution across common Web3 failure scenarios.",
    items: [
      "Admin Key Compromise — Response Playbook",
      "Oracle Drift — Detection and Containment",
      "Governance Freeze — Emergency Continuity Steps",
      "Treasury Path Failure — Isolation and Recovery",
      "Bridge Exploit — Triage and Communication Guide",
    ],
  },
  {
    id: "incident-readiness",
    label: "Incident Readiness",
    description: "Pre-incident checklists, authority-surface review templates, and continuity posture assessments for protocol teams.",
    items: [
      "Pre-Incident Authority Surface Checklist",
      "Continuity Posture Self-Assessment",
      "Critical Role Inventory Template",
      "Emergency Contact and Signatory Map",
      "Incident Communication Framework",
    ],
  },
  {
    id: "research",
    label: "Research & Updates",
    description: "Ongoing analysis of Web3 incident patterns, threat-family evolution, and continuity doctrine updates from the SCE team.",
    items: [
      "Q1 2026 — Web3 Incident Threat Family Report",
      "Admin Key Concentration Risk: 2025 Review",
      "Oracle Manipulation Patterns — Case Study Series",
      "Governance Attack Surface Analysis",
      "SCE Doctrine Update — Treasury Continuity v2",
    ],
  },
];

export default function ResourcesPage() {
  return (
    <div style={{ background: BG, color: TEXT, minHeight: "100vh", fontFamily: "var(--font-geist-sans), Arial, sans-serif" }}>
      <NavBar />

      {/* Header */}
      <section style={{
        paddingTop: 80,
        paddingBottom: 64,
        paddingLeft: "max(40px, 5vw)",
        paddingRight: "max(40px, 5vw)",
        borderBottom: `1px solid ${PURPLE_FAINT}`,
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", color: PURPLE, textTransform: "uppercase", marginBottom: 20 }}>
          Resource Hub
        </div>
        <h1 style={{ margin: "0 0 16px", fontSize: "clamp(32px, 4vw, 56px)", fontWeight: 900, lineHeight: 1.05, letterSpacing: "-0.02em", color: TEXT }}>
          Continuity <span style={PURPLE_GRADIENT_TEXT}>intelligence</span>,<br />ready when you need it.
        </h1>
        <p style={{ margin: 0, maxWidth: 520, fontSize: 15, lineHeight: 1.75, color: TEXT_MUTED }}>
          Guides, playbooks, readiness checklists, and research from the Sagitta Continuity Engine team.
          Built for protocol operators who cannot afford to improvise under pressure.
        </p>
      </section>

      {/* Sections */}
      <div style={{ paddingLeft: "max(40px, 5vw)", paddingRight: "max(40px, 5vw)", paddingBottom: 96 }}>
        {SECTIONS.map((section, i) => (
          <section key={section.id} id={section.id} style={{
            paddingTop: 64,
            paddingBottom: 48,
            borderBottom: i < SECTIONS.length - 1 ? `1px solid ${PURPLE_FAINT}` : "none",
          }}>
            <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,2fr)", gap: "0 64px", alignItems: "start" }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.16em", color: PURPLE, textTransform: "uppercase", marginBottom: 12 }}>
                  0{i + 1}
                </div>
                <h2 style={{ margin: "0 0 16px", fontSize: "clamp(20px, 2.2vw, 28px)", fontWeight: 800, lineHeight: 1.15, color: TEXT }}>
                  {section.label}
                </h2>
                <p style={{ margin: 0, fontSize: 13, lineHeight: 1.72, color: TEXT_MUTED }}>
                  {section.description}
                </p>
              </div>
              <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 12, marginTop: 4 }}>
                {section.items.map((item) => (
                  <li key={item} style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    padding: "16px 20px",
                    borderRadius: 12,
                    border: `1px solid ${PURPLE_FAINT}`,
                    background: "rgba(139,92,246,0.04)",
                    fontSize: 14,
                    color: TEXT_MUTED,
                  }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={PURPLE} strokeWidth="2" style={{ flexShrink: 0 }}>
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                    </svg>
                    <span style={{ flex: 1 }}>{item}</span>
                    <span style={{ fontSize: 11, color: PURPLE, fontWeight: 600, whiteSpace: "nowrap" }}>Coming soon</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        ))}
      </div>

      {/* CTA */}
      <section style={{
        padding: "48px max(40px, 5vw)",
        borderTop: `1px solid ${PURPLE_FAINT}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 24,
        background: "rgba(139,92,246,0.04)",
      }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: TEXT, marginBottom: 6 }}>Need a Defense Review first?</div>
          <div style={{ fontSize: 13, color: TEXT_FAINT }}>Get your protocol surface mapped and authority risks identified before an incident.</div>
        </div>
        <a href="mailto:hello@sagitta.systems?subject=SCE%20Defense%20Review%20Request" style={{
          padding: "12px 24px",
          borderRadius: 10,
          background: "#D4AF37",
          color: "#111827",
          textDecoration: "none",
          fontWeight: 800,
          fontSize: 14,
          whiteSpace: "nowrap",
        }}>
          Request Defense Review →
        </a>
      </section>

      {/* Footer bar */}
      <div style={{ padding: "20px max(40px, 5vw)", borderTop: `1px solid rgba(212,175,55,0.14)`, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <Link href="/" style={{ fontSize: 12, color: TEXT_FAINT, textDecoration: "none" }}>← Back to home</Link>
        <span style={{ fontSize: 11, color: TEXT_FAINT }}>© {new Date().getFullYear()} Sagitta. Public-surface continuity intelligence.</span>
      </div>
    </div>
  );
}
