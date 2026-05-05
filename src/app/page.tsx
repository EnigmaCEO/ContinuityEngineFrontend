import type React from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import NavBar from "./NavBar";
import TickerClient from "./TickerClient";

export const metadata: Metadata = {
  title: "Sagitta Continuity Engine — Web3 Protocol Continuity Intelligence",
  description:
    "SCE delivers Web3 continuity intelligence, authority-risk review, incident mapping, and client-ready defense reports for protocols, DAOs, and DeFi systems.",
};

const GOLD = "#D4AF37";
const GOLD_DIM = "rgba(212,175,55,0.72)";
const GOLD_FAINT = "rgba(212,175,55,0.16)";
const GOLD_FAINTEST = "rgba(212,175,55,0.08)";
const PURPLE = "#8B5CF6";
const PURPLE_DIM = "rgba(139,92,246,0.72)";
const PURPLE_FAINT = "rgba(139,92,246,0.18)";
const PURPLE_FAINTEST = "rgba(139,92,246,0.07)";
const TEXT = "#E2E8F0";
const TEXT_MUTED = "rgba(203,213,225,0.72)";
const TEXT_FAINT = "rgba(148,163,184,0.58)";
const BG = "#080a0e";
const SURFACE = "rgba(10,12,18,0.92)";
const PURPLE_GRADIENT_TEXT: React.CSSProperties = {
  background: "linear-gradient(90deg, #d8b4fe 0%, #a855f7 40%, #7c3aed 100%)",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  backgroundClip: "text",
};
const BORDER = "rgba(212,175,55,0.14)";



const CAPABILITIES = [
  {
    label: "Global Intelligence",
    body: "Continuously ingests public vulnerability feeds, advisory records, and Web3 incident reports into a normalized case archive.",
  },
  {
    label: "Incident Mapping",
    body: "Normalizes, classifies, and links real incidents to threat families, doctrine rules, and replay scenarios without manual triage.",
  },
  {
    label: "Protocol Surface Mapping",
    body: "Registers public contract addresses, proxies, oracles, keepers, and frontends as a zero-custody project surface.",
  },
  {
    label: "Authority Risk Review",
    body: "Deterministically scans admin surfaces: EOA owners, upgrade authorities, treasury controllers, mint and pause capabilities, proxy admins.",
  },
  {
    label: "Doctrine & Response Coverage",
    body: "Maps incidents to a doctrine brain. Tags recommended actions and continuity implications across oracle, bridge, governance, admin-key, and treasury scenarios.",
  },
  {
    label: "Controls & Verification",
    body: "Generates control recommendations from findings. Tracks evidence, verification status, and reviewer notes without requiring key custody.",
  },
  {
    label: "Defense Review Reports",
    body: "Assembles findings, threat families, controls, and verification status into a client-ready public-surface review report.",
  },
];

const LOOP_STEPS = [
  { n: "01", label: "Monitor incidents", body: "Live ingestion from CISA KEV, NVD, GitHub Advisories, and De.Fi REKT incident feeds." },
  { n: "02", label: "Map protocol surface", body: "Register public contract addresses, roles, and authority metadata for the protocol under review." },
  { n: "03", label: "Detect authority risks", body: "Deterministic admin-surface scan identifies EOA owners, missing timelocks, and role-concentration risks." },
  { n: "04", label: "Match threat families", body: "Project findings are mapped to global threat families: Admin Key, Governance, Bridge, Oracle, Treasury, and more." },
  { n: "05", label: "Recommend controls", body: "Control recommendations are generated from findings and aligned to doctrine coverage and replay outcomes." },
  { n: "06", label: "Track evidence", body: "Operators record public evidence: multisig addresses, timelock references, governance proposals, and policy notes." },
  { n: "07", label: "Produce defense review", body: "All data is assembled into a structured client-ready report with verification status and next actions." },
];

const WHO = [
  "Web3 protocols",
  "DAOs",
  "DeFi systems",
  "Treasury-heavy projects",
  "Infrastructure teams",
  "Teams preparing for audits, grants, integrations, or investor diligence",
];

const DELIVERABLES = [
  "Public-Surface Review report",
  "Mapped assets and contract registry",
  "Authority-risk findings by severity",
  "Relevant threat families and global context",
  "Recommended controls",
  "Evidence and verification status",
  "Next actions",
];

const TRUST_POINTS = [
  "SCE is zero-custody. No private keys, seed phrases, or signing credentials are ever requested.",
  "Reviews use public metadata and operator-provided public evidence only.",
  "SCE does not control contracts, wallets, keys, upgrades, or funds.",
  "\"Defended\" applies only after controls are explicitly verified against provided evidence.",
];

export default function HomePage() {
  return (
    <div style={{ background: BG, color: TEXT, minHeight: "100vh", fontFamily: "var(--font-geist-sans), Arial, sans-serif" }}>

      <NavBar />

      {/* HERO */}
      <section id="overview" className="hero-section" style={{
        scrollMarginTop: 96,
        position: "relative",
        minHeight: "calc(100vh - 96px)",
        overflow: "hidden",
        background: BG,
        display: "flex",
        flexDirection: "column",
      }}>

        {/* Hero illustration — absolute right bleed, vertically centered */}
        <div className="hero-illustration" style={{
          position: "absolute",
          right: 0,
          width: "70%",
          zIndex: 0,
          pointerEvents: "none",
        }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/hero-background.png"
            alt=""
            style={{ width: "100%", height: "auto", display: "block" }}
          />
          {/* Left-edge fade — hard protection for text legibility */}
          <div style={{
            position: "absolute",
            inset: 0,
            background: `linear-gradient(90deg, ${BG} 0%, rgba(8,10,14,0.92) 12%, rgba(8,10,14,0.55) 28%, rgba(8,10,14,0.15) 50%, transparent 70%)`,
          }} />
          {/* Bottom-edge fade */}
          <div style={{
            position: "absolute",
            left: 0, right: 0, bottom: 0,
            height: "38%",
            background: `linear-gradient(to top, ${BG} 0%, transparent 100%)`,
          }} />
          {/* Top-edge fade */}
          <div style={{
            position: "absolute",
            left: 0, right: 0, top: 0,
            height: "18%",
            background: `linear-gradient(to bottom, ${BG} 0%, transparent 100%)`,
          }} />
        </div>

        {/* Left copy — above image layer */}
        <div className="hero-copy" style={{
          position: "relative",
          zIndex: 1,
          flex: 1,
          display: "flex",
          alignItems: "center",
          paddingLeft: "max(40px, 5vw)",
          paddingRight: 0,
          paddingTop: 40,
          paddingBottom: 60,
        }}>
          <div style={{ maxWidth: 760 }}>

            {/* Eyebrow — only visible at ≤480px when nav wordmark is hidden */}
            <div className="hero-mobile-eyebrow" style={{
              display: "none",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.16em",
              color: PURPLE,
              marginBottom: 16,
              textTransform: "uppercase" as const,
            }}>
              Sagitta Continuity Engine
            </div>

            {/* Headline */}
            <h1 className="hero-h1" style={{
              margin: "0 0 32px",
              fontSize: "clamp(52px, 7.5vw, 92px)",
              fontWeight: 900,
              lineHeight: 0.97,
              letterSpacing: "-0.03em",
              color: TEXT,
            }}>
              Know what<br />
              <span style={{
                ...PURPLE_GRADIENT_TEXT,
              }}>breaks</span> before<br />
              it breaks you.
            </h1>

            {/* Subtext */}
            <p className="hero-subtext" style={{
              margin: "0 0 40px",
              maxWidth: 440,
              fontSize: "clamp(13px, 1.4vw, 15px)",
              color: TEXT_MUTED,
              lineHeight: 1.78,
            }}>
              Survival infrastructure for protocols when normal assumptions fail. SCE maps control risk,
              incident exposure, and authority gaps before a threat-matrix event becomes a public failure.
            </p>

            {/* CTAs */}
            <div className="hero-ctas" style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 32 }}>
              <a href="#defense-review" className="hero-cta-btn" style={{
                padding: "14px 24px",
                borderRadius: 8,
                background: GOLD,
                color: "#111827",
                textDecoration: "none",
                fontWeight: 800,
                fontSize: 14,
                display: "flex",
                alignItems: "center",
                gap: 8,
                whiteSpace: "nowrap" as const,
              }}>Request Defense Review &nbsp;→</a>
              <a href="#how-sce-works" className="hero-cta-btn" style={{
                padding: "14px 24px",
                borderRadius: 8,
                border: `1px solid rgba(255,255,255,0.16)`,
                color: TEXT,
                textDecoration: "none",
                fontWeight: 600,
                fontSize: 14,
                background: "rgba(255,255,255,0.04)",
                display: "flex",
                alignItems: "center",
                gap: 8,
                whiteSpace: "nowrap" as const,
              }}>Explore the Continuity Engine &nbsp;→</a>
            </div>

            {/* Trust line */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: TEXT_FAINT, fontSize: 13 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={PURPLE_DIM} strokeWidth="2" style={{ flexShrink: 0 }}>
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              Zero-custody. Public metadata only. No keys. No signing authority.
            </div>

          </div>
        </div>

        {/* Live Incidents Ticker — pinned to bottom of hero, always above fold */}
        <TickerClient />

      </section>

      {/* CONTINUITY MANDATE */}
      <section id="continuity-mandate" style={{
        scrollMarginTop: 96,
        position: "relative",
        minHeight: 680,
        overflow: "hidden",
        background: "#000",
        borderTop: `1px solid ${PURPLE_FAINT}`,
        borderBottom: `1px solid ${PURPLE_FAINT}`,
        display: "flex",
        alignItems: "center",
      }}>

        {/* Illustration — absolute right bleed, same pattern as hero */}
        <div className="mandate-illustration" style={{
          position: "absolute",
          right: 50,
          top: 0,
          bottom: 0,
          width: "50%",
          zIndex: 0,
          pointerEvents: "none",
          display: "flex",
          alignItems: "center",
        }}>
          <Image
            src="/section2-illustration.png"
            alt=""
            width={1024}
            height={768}
            style={{ width: "100%", height: "auto", display: "block", zIndex: 1, }}
          />
          {/* Left-edge fade — protects text legibility */}
          <div style={{
            position: "absolute",
            inset: 0,
            background: `linear-gradient(90deg, #000 0%, rgba(0,0,0,0.88) 10%, rgba(0,0,0,0.4) 30%, transparent 60%)`,
          }} />
          {/* Top fade */}
          <div style={{
            position: "absolute",
            left: 0, right: 0, top: 0,
            height: "20%",
            background: `linear-gradient(to bottom, #000 0%, transparent 100%)`,
          }} />
          {/* Bottom fade */}
          <div style={{
            position: "absolute",
            left: 0, right: 0, bottom: 0,
            height: "20%",
            background: `linear-gradient(to top, #000 0%, transparent 100%)`,
          }} />
        </div>

        {/* Copy — above illustration layer */}
        <div className="mandate-copy" style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          paddingTop: 100,
          paddingBottom: 100,
          paddingLeft: "max(40px, 5vw)",
          paddingRight: 40,
          maxWidth: 880,
        }}>
          <div style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.14em",
            textTransform: "uppercase" as const,
            color: PURPLE,
            marginBottom: 20,
          }}>
            The Continuity Mandate
          </div>

          <h2 style={{
            fontSize: "clamp(28px, 3.4vw, 46px)",
            fontWeight: 800,
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
            color: TEXT,
            margin: "0 0 20px",
          }}>
            Every protocol has a{" "}
            <span style={PURPLE_GRADIENT_TEXT}>threat matrix</span>
            . Most teams only see it after the incident.
          </h2>

          <div style={{ width: 248, height: 3, background: `linear-gradient(90deg, ${PURPLE}, transparent)`, borderRadius: 2, marginBottom: 24 }} />

          <p style={{ fontSize: 15, lineHeight: 1.7, color: TEXT_MUTED, marginBottom: 40, maxWidth: 460 }}>
            SCE exists for the moment assumptions stop being true. When a chain halts, an oracle drifts, governance freezes, a treasury path fails, or a critical authority surface becomes unsafe, continuity becomes authority.
          </p>

          {/* Feature cards 2×2 */}
          <div className="mandate-cards" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 28 }}>
            {[
              {
                icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#c4b5fd" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 3L4 6.5v5c0 5 3.6 9.7 8 11 4.4-1.3 8-6 8-11v-5L12 3z"/>
                    <polyline points="9 12 11 14 15 10"/>
                  </svg>
                ),
                label: "1. Authority Surfaces",
                body: "Upgrades, pause authority, treasury movement, admin roles, keepers, oracle control paths.",
              },
              {
                icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#c4b5fd" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="7"/>
                    <circle cx="12" cy="12" r="2.5"/>
                    <line x1="12" y1="2" x2="12" y2="5"/>
                    <line x1="12" y1="19" x2="12" y2="22"/>
                    <line x1="2" y1="12" x2="5" y2="12"/>
                    <line x1="19" y1="12" x2="22" y2="12"/>
                  </svg>
                ),
                label: "2. Threat Matrix Exposure",
                body: "Maps protocol surfaces to global exploit and failure patterns.",
              },
              {
                icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#c4b5fd" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="7" y="2" width="2.5" height="3" rx="0.5"/>
                    <rect x="11" y="2" width="2.5" height="3" rx="0.5"/>
                    <rect x="15" y="2" width="2.5" height="3" rx="0.5"/>
                    <path d="M7 5h10v9a1 1 0 01-1 1H8a1 1 0 01-1-1V5z"/>
                    <rect x="5" y="18" width="14" height="3" rx="1"/>
                    <line x1="12" y1="14" x2="12" y2="18"/>
                  </svg>
                ),
                label: "3. Continuity Doctrine",
                body: "Pause, degrade, evacuate, substitute, reconstitute.",
              },
              {
                icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#c4b5fd" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 3L4 6.5v5c0 5 3.6 9.7 8 11 4.4-1.3 8-6 8-11v-5L12 3z"/>
                    <circle cx="12" cy="12" r="3.5"/>
                    <polyline points="10.5 12 11.5 13 13.5 11"/>
                  </svg>
                ),
                label: "4. Verification Workflows",
                body: "Evidence requested, controls tracked, verification status maintained.",
              },
            ].map((item) => (
              <div key={item.label} style={{
                background: "rgba(0,0,0,0.6)",
                border: `1px solid ${PURPLE_FAINT}`,
                borderRadius: 12,
                padding: "20px",
                display: "flex",
                gap: 16,
                alignItems: "flex-start",
              }}>
                {/* Hexagonal glowing icon */}
                <div style={{
                  width: 52,
                  height: 52,
                  flexShrink: 0,
                  position: "relative",
                  filter: "drop-shadow(0 0 8px rgba(139,92,246,0.7))",
                }}>
                  <svg width="52" height="52" viewBox="0 0 52 52" fill="none" style={{ position: "absolute", inset: 0 }}>
                    <path d="M26 2 L48 14 L48 38 L26 50 L4 38 L4 14 Z" fill="rgba(139,92,246,0.12)" stroke="rgba(139,92,246,0.6)" strokeWidth="1.2"/>
                  </svg>
                  <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {item.icon}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: TEXT, marginBottom: 6 }}>{item.label}</div>
                  <div style={{ fontSize: 13, lineHeight: 1.55, color: TEXT_MUTED, marginBottom: 10 }}>{item.body}</div>
                  <div style={{ fontSize: 13, color: PURPLE }}>→</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            border: `1px solid rgba(139,92,246,0.22)`,
            borderRadius: 20,
            padding: "7px 14px",
            fontSize: 12,
            color: TEXT_MUTED,
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={PURPLE} strokeWidth="1.5">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/>
            </svg>
            Built for the moment your assumptions fail.
          </div>
        </div>
      </section>

      {/* WHY SCE VS. AN AUDIT */}
      <section id="why-sce-vs-audit" style={{
        scrollMarginTop: 96,
        position: "relative",
        overflow: "hidden",
        background: "#000",
        borderTop: `1px solid ${PURPLE_FAINT}`,
        borderBottom: `1px solid ${PURPLE_FAINT}`,
      }}>
        <div style={{
          paddingTop: 96,
          paddingBottom: 96,
          paddingLeft: "max(40px, 5vw)",
          paddingRight: "max(40px, 5vw)",
        }}>

          {/* Centered header */}
          <div style={{ textAlign: "center" as const, maxWidth: 680, margin: "0 auto 52px" }}>

            <div style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.14em",
              textTransform: "uppercase" as const,
              color: PURPLE,
              marginBottom: 18,
            }}>
              Not an audit replacement
            </div>

            <h2 style={{
              fontSize: "clamp(28px, 3.4vw, 46px)",
              fontWeight: 800,
              lineHeight: 1.08,
              letterSpacing: "-0.02em",
              color: TEXT,
              margin: "0 0 20px",
            }}>
              Why SCE vs. an audit
            </h2>

            <p style={{
              fontSize: "clamp(15px, 1.6vw, 18px)",
              fontWeight: 500,
              color: TEXT_MUTED,
              lineHeight: 1.55,
              margin: "0 0 28px",
            }}>
              Audits review code. SCE reviews whether the system can survive control failure.
            </p>

          </div>

          {/* Comparison cards — centered */}
          <div style={{ maxWidth: 880, margin: "0 auto 36px" }}>
            <div className="audit-comparison-row" style={{
              display: "flex",
              gap: 0,
              alignItems: "stretch",
            }}>

              {/* Left card — Traditional Audit */}
              <div className="audit-card" style={{
                flex: "1 1 280px",
                background: "rgba(10,12,18,0.85)",
                border: `1px solid rgba(148,163,184,0.13)`,
                borderRadius: 16,
                padding: "28px 28px 32px",
                display: "flex",
                flexDirection: "column" as const,
              }}>
                {/* Title row with inline icon */}
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                  <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: 9,
                    background: "rgba(148,163,184,0.07)",
                    border: `1px solid rgba(148,163,184,0.13)`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(148,163,184,0.6)" strokeWidth="1.8">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                      <line x1="16" y1="13" x2="8" y2="13"/>
                      <line x1="16" y1="17" x2="8" y2="17"/>
                    </svg>
                  </div>
                  <div style={{ fontSize: 17, fontWeight: 700, color: TEXT, lineHeight: 1.2 }}>
                    Traditional Audit
                  </div>
                </div>

                <div style={{ fontSize: 12, color: TEXT_FAINT, marginBottom: 20, lineHeight: 1.5, paddingLeft: 48 }}>
                  Code and implementation assurance
                </div>

                <div style={{ width: "100%", height: 1, background: "rgba(148,163,184,0.08)", marginBottom: 20 }} />

                <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 12, flex: 1 }}>
                  {[
                    "Code exploitability review",
                    "Contract-level vulnerabilities",
                    "Implementation flaws",
                    "Best once contracts are near final",
                  ].map((item) => (
                    <li key={item} style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 13, color: TEXT_MUTED, lineHeight: 1.55 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(148,163,184,0.45)" strokeWidth="2" style={{ flexShrink: 0, marginTop: 2 }}>
                        <polyline points="9 18 15 12 9 6"/>
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* VS divider */}
              <div className="audit-vs-divider" style={{
                display: "flex",
                flexDirection: "column" as const,
                alignItems: "center",
                justifyContent: "center",
                padding: "0 22px",
                flexShrink: 0,
                gap: 8,
              }}>
                <div className="audit-vs-line" style={{
                  flex: 1,
                  width: 1,
                  minHeight: 32,
                  background: `linear-gradient(180deg, transparent 0%, ${PURPLE_FAINT} 100%)`,
                }} />
                <div style={{
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  background: "rgba(0,0,0,0.95)",
                  border: `1px solid ${PURPLE_FAINT}`,
                  boxShadow: `0 0 0 4px rgba(139,92,246,0.07)`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 14,
                  fontWeight: 900,
                  letterSpacing: "0.1em",
                  color: TEXT,
                  flexShrink: 0,
                }}>
                  VS
                </div>
                <div className="audit-vs-line audit-vs-line-end" style={{
                  flex: 1,
                  width: 1,
                  minHeight: 32,
                  background: `linear-gradient(180deg, ${PURPLE_FAINT} 0%, transparent 100%)`,
                }} />
              </div>

              {/* Right card — Sagitta Continuity Engine */}
              <div className="audit-card" style={{
                flex: "1 1 280px",
                background: "rgba(0,0,0,0.7)",
                border: `1px solid ${PURPLE_FAINT}`,
                borderRadius: 16,
                padding: "28px 28px 32px",
                display: "flex",
                flexDirection: "column" as const,
                boxShadow: `0 0 0 1px rgba(139,92,246,0.05) inset, 0 0 40px rgba(139,92,246,0.08)`,
                position: "relative" as const,
                overflow: "hidden",
              }}>
                {/* Top accent glow line */}
                <div style={{
                  position: "absolute",
                  top: 0, left: 0, right: 0,
                  height: 2,
                  background: `linear-gradient(90deg, transparent 0%, rgba(139,92,246,0.5) 30%, ${PURPLE} 55%, transparent 100%)`,
                  borderRadius: "16px 16px 0 0",
                }} />

                {/* Title row with inline icon */}
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                  <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: 9,
                    background: PURPLE_FAINTEST,
                    border: `1px solid ${PURPLE_FAINT}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="1.8">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                      <polyline points="9 12 11 14 15 10"/>
                    </svg>
                  </div>
                  <div style={{ fontSize: 17, fontWeight: 700, color: TEXT, lineHeight: 1.2 }}>
                    Sagitta Continuity Engine
                  </div>
                </div>

                <div style={{ fontSize: 12, color: TEXT_FAINT, marginBottom: 20, lineHeight: 1.5, paddingLeft: 48 }}>
                  Continuity and control readiness
                </div>

                <div style={{ width: "100%", height: 1, background: PURPLE_FAINT, marginBottom: 20 }} />

                <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 12, flex: 1 }}>
                  {[
                    "Authority surface mapping",
                    "Treasury, oracle, governance, and admin-path risk",
                    "Emergency response and control verification",
                    "Best before launch and before capital scales",
                  ].map((item) => (
                    <li key={item} style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 13, color: TEXT_MUTED, lineHeight: 1.55 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={PURPLE} strokeWidth="2" style={{ flexShrink: 0, marginTop: 2 }}>
                        <polyline points="9 18 15 12 9 6"/>
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

            </div>
          </div>

          {/* Pill + CTA — centered column */}
          <div style={{ display: "flex", flexDirection: "column" as const, alignItems: "center", gap: 16 }}>
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "7px 16px",
              borderRadius: 20,
              border: `1px solid rgba(139,92,246,0.22)`,
              background: PURPLE_FAINTEST,
              fontSize: 12,
              color: TEXT_MUTED,
            }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={PURPLE_DIM} strokeWidth="1.8">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                <path d="M9 12l2 2 4-4"/>
              </svg>
              Complements audit work.
            </div>

            <a href="#sample-defense-review" style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              padding: "13px 28px",
              borderRadius: 10,
              background: GOLD,
              color: "#111827",
              textDecoration: "none",
              fontWeight: 800,
              fontSize: 14,
            }}>
              See Defense Review &nbsp;→
            </a>
          </div>

        </div>
      </section>

      {/* HOW SCE WORKS */}
      <section id="how-sce-works" style={{
        scrollMarginTop: 96,
        position: "relative",
        overflow: "hidden",
        background: "#000",
        borderTop: `1px solid ${PURPLE_FAINT}`,
        borderBottom: `1px solid ${PURPLE_FAINT}`,
      }}>
        {/* Illustration — absolute right bleed */}
        <div className="sce-works-illustration" style={{
          position: "absolute",
          right: 50,
          top: -50,
          bottom: 0,
          width: "52%",
          zIndex: 0,
          pointerEvents: "none",
          display: "flex",
          alignItems: "center",
        }}>
          <Image
            src="/section3-illustration.png"
            alt=""
            width={1200}
            height={900}
            style={{ width: "100%", height: "auto", display: "block", zIndex: 1, }}
          />
          {/* Left-edge fade */}
          <div style={{
            position: "absolute",
            inset: 0,
            background: `linear-gradient(90deg, #000 0%, rgba(0,0,0,0.85) 15%, rgba(0,0,0,0.35) 38%, transparent 65%)`,
          }} />
          {/* Top fade */}
          <div style={{
            position: "absolute",
            left: 0, right: 0, top: 0,
            height: "16%",
            background: `linear-gradient(to bottom, #000 0%, transparent 100%)`,
          }} />
          {/* Bottom fade */}
          <div style={{
            position: "absolute",
            left: 0, right: 0, bottom: 0,
            height: "16%",
            background: `linear-gradient(to top, #000 0%, transparent 100%)`,
          }} />
        </div>

        {/* Copy */}
        <div className="sce-works-copy" style={{
          position: "relative",
          zIndex: 1,
          paddingTop: 96,
          paddingBottom: 96,
          paddingLeft: "max(40px, 5vw)",
          paddingRight: 40,
          maxWidth: 760,
        }}>
          <div style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.14em",
            textTransform: "uppercase" as const,
            color: PURPLE,
            marginBottom: 20,
          }}>
            How SCE Works
          </div>

          <h2 style={{
            fontSize: "clamp(28px, 3.4vw, 46px)",
            fontWeight: 800,
            lineHeight: 1.08,
            letterSpacing: "-0.02em",
            color: TEXT,
            margin: "0 0 20px",
          }}>
            When the threat-matrix<br />
            event happens,{" "}
            <span style={PURPLE_GRADIENT_TEXT}>SCE is<br />already holding the map.</span>
          </h2>

          <div style={{ width: 248, height: 3, background: `linear-gradient(90deg, ${PURPLE}, transparent)`, borderRadius: 2, marginBottom: 40 }} />

          {/* 7-step list */}
          <div style={{ display: "grid", gap: 20, marginBottom: 40 }}>
            {[
              {
                n: 1,
                label: "Monitor incidents",
                body: "Continuously ingest SCE, Web, GitHub, advisories, and DeFi/REST feeds.",
                icon: (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#c4b5fd" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                  </svg>
                ),
              },
              {
                n: 2,
                label: "Map protocol surface",
                body: "Register public contracts, addresses, roles, and admin paths.",
                icon: (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#c4b5fd" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="3" width="20" height="4" rx="1"/><rect x="2" y="10" width="20" height="4" rx="1"/><rect x="2" y="17" width="20" height="4" rx="1"/>
                  </svg>
                ),
              },
              {
                n: 3,
                label: "Detect authority risks",
                body: "Determine admin-surface risks across EOAs, contracts, and policy.",
                icon: (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#c4b5fd" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                ),
              },
              {
                n: 4,
                label: "Match threat families",
                body: "Project findings are mapped to global threat families and tactics.",
                icon: (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#c4b5fd" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                ),
              },
              {
                n: 5,
                label: "Recommend controls",
                body: "Controls recommended are generated from findings and doctrine.",
                icon: (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#c4b5fd" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/>
                    <circle cx="8" cy="6" r="2" fill={BG}/><circle cx="16" cy="12" r="2" fill={BG}/><circle cx="10" cy="18" r="2" fill={BG}/>
                  </svg>
                ),
              },
              {
                n: 6,
                label: "Track evidence",
                body: "Capture, normalize, and link evidence across findings and reviews.",
                icon: (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#c4b5fd" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  </svg>
                ),
              },
              {
                n: 7,
                label: "Deliver defense review",
                body: "Send a SCE-structured report with verification status and next actions.",
                icon: (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#c4b5fd" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/>
                  </svg>
                ),
              },
            ].map((step) => (
              <div key={step.n} style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                {/* Number bubble */}
                <div style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  border: `1px solid ${PURPLE_FAINT}`,
                  background: PURPLE_FAINTEST,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  fontWeight: 700,
                  color: TEXT,
                  flexShrink: 0,
                  marginTop: 2,
                }}>{step.n}</div>
                {/* Hex icon */}
                <div style={{
                  width: 40,
                  height: 40,
                  flexShrink: 0,
                  position: "relative",
                  filter: "drop-shadow(0 0 6px rgba(139,92,246,0.55))",
                }}>
                  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" style={{ position: "absolute", inset: 0 }}>
                    <path d="M20 2 L36 11 L36 29 L20 38 L4 29 L4 11 Z" fill="rgba(139,92,246,0.1)" stroke="rgba(139,92,246,0.5)" strokeWidth="1"/>
                  </svg>
                  <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {step.icon}
                  </div>
                </div>
                {/* Text */}
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: TEXT, marginBottom: 3 }}>{step.label}</div>
                  <div style={{ fontSize: 13, color: TEXT_MUTED, lineHeight: 1.55 }}>{step.body}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom note */}
          <div style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 12,
            padding: "16px 18px",
            borderRadius: 12,
            border: `1px solid ${PURPLE_FAINT}`,
            background: "rgba(139,92,246,0.04)",
            maxWidth: 580,
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={PURPLE_DIM} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            <div>
              <div style={{ fontSize: 13, color: TEXT_MUTED, lineHeight: 1.55 }}>
                SCE does not monitor systems for comfort.
              </div>
              <div style={{ fontSize: 13, color: PURPLE, lineHeight: 1.55 }}>
                It maps what must survive when conditions break.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ECOSYSTEM COVERAGE — Built for multi-chain protocol defense */}
      <section id="ecosystem-coverage" style={{
        scrollMarginTop: 96,
        position: "relative",
        overflow: "hidden",
        background: "#000",
        borderTop: `1px solid ${PURPLE_FAINT}`,
        borderBottom: `1px solid ${PURPLE_FAINT}`,
      }}>
        <div style={{
          paddingTop: 96,
          paddingBottom: 80,
          paddingLeft: "max(40px, 5vw)",
          paddingRight: "max(40px, 5vw)",
        }}>

          {/* Centered header */}
          <div style={{ textAlign: "center" as const, margin: "0 auto 52px" }}>
            <div style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.14em",
              textTransform: "uppercase" as const,
              color: PURPLE,
              marginBottom: 18,
            }}>
              Ecosystem Coverage
            </div>

            <h2 style={{
              fontSize: "clamp(28px, 3.4vw, 46px)",
              fontWeight: 800,
              lineHeight: 1.08,
              letterSpacing: "-0.02em",
              color: TEXT,
              margin: "0 0 20px",
              whiteSpace: "nowrap" as const,
            }}>
              Built for multi-chain protocol defense
            </h2>

            <p style={{
              fontSize: "clamp(14px, 1.5vw, 17px)",
              fontWeight: 500,
              color: TEXT_MUTED,
              lineHeight: 1.6,
              margin: "0 0 24px",
              whiteSpace: "nowrap" as const,
            }}>
              Coverage begins with EVM authority-surface reviews and expands through chain-specific adapters.
            </p>
          </div>

          {/* Three cards */}
          <div className="ecosystem-cards" style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 16,
            maxWidth: 1100,
            margin: "0 auto 40px",
          }}>

            {/* Card 1 — Active now */}
            <div style={{
              background: "rgba(0,0,0,0.7)",
              border: `1px solid ${PURPLE_FAINT}`,
              borderRadius: 16,
              padding: "28px 24px 24px",
              display: "flex",
              flexDirection: "column" as const,
              position: "relative" as const,
              overflow: "hidden",
              boxShadow: `0 0 32px rgba(139,92,246,0.07)`,
            }}>
              {/* Top accent line */}
              <div style={{
                position: "absolute",
                top: 0, left: 0, right: 0,
                height: 2,
                background: `linear-gradient(90deg, transparent, rgba(139,92,246,0.6) 40%, ${PURPLE} 60%, transparent)`,
                borderRadius: "16px 16px 0 0",
              }} />

              {/* Icon + title */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: 9,
                  background: PURPLE_FAINTEST,
                  border: `1px solid ${PURPLE_FAINT}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="2" y1="12" x2="22" y2="12"/>
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                  </svg>
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: TEXT, lineHeight: 1.2 }}>Active now</div>
                </div>
                {/* Active status pill */}
                <div style={{
                  marginLeft: "auto",
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "3px 8px",
                  borderRadius: 10,
                  background: "rgba(34,197,94,0.1)",
                  border: "1px solid rgba(34,197,94,0.2)",
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", display: "inline-block", flexShrink: 0 }} />
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#22c55e", letterSpacing: "0.06em" }}>LIVE</span>
                </div>
              </div>

              <div style={{ fontSize: 12, color: TEXT_FAINT, marginBottom: 18, paddingLeft: 48 }}>
                EVM authority-surface reviews
              </div>

              <div style={{ width: "100%", height: 1, background: PURPLE_FAINT, marginBottom: 18 }} />

              <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 8, marginBottom: 14 }}>
                {[
                  "EVM",
                  "Ethereum-compatible deployments",
                  "Testnet & mainnet",
                  "Admin / owner paths",
                  "Proxy patterns",
                  "Treasury controls",
                  "Oracle surfaces",
                  "Governance / timelocks",
                ].map((chip) => (
                  <span key={chip} style={{
                    padding: "4px 10px",
                    borderRadius: 6,
                    border: `1px solid ${PURPLE_FAINT}`,
                    background: PURPLE_FAINTEST,
                    fontSize: 12,
                    color: TEXT_MUTED,
                    fontWeight: 500,
                    lineHeight: 1.4,
                  }}>{chip}</span>
                ))}
              </div>
              <div style={{ width: "100%", height: 1, background: PURPLE_FAINT, marginBottom: 14 }} />
              <div style={{ fontSize: 11, color: TEXT_FAINT, marginBottom: 10, fontWeight: 600 }}>EVM-compatible coverage targets</div>
              <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 6, marginBottom: 12 }}>
                {["Ethereum","Base","Arbitrum","Optimism","Polygon","Avalanche C-Chain","BNB Chain","Moonbeam"].map((chain) => (
                  <span key={chain} style={{
                    padding: "3px 8px",
                    borderRadius: 5,
                    border: `1px solid rgba(139,92,246,0.1)`,
                    background: "rgba(139,92,246,0.04)",
                    fontSize: 11,
                    color: TEXT_FAINT,
                    fontWeight: 500,
                  }}>{chain}</span>
                ))}
              </div>
              <div style={{ fontSize: 11, color: TEXT_FAINT, lineHeight: 1.55, fontStyle: "italic" }}>
                Active EVM coverage applies where public contract data, explorer records, or project-submitted details are available.
              </div>
            </div>

            {/* Card 2 — Expansion targets */}
            <div style={{
              background: "rgba(10,12,18,0.85)",
              border: `1px solid rgba(148,163,184,0.13)`,
              borderRadius: 16,
              padding: "28px 24px 24px",
              display: "flex",
              flexDirection: "column" as const,
            }}>
              {/* Icon + title */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: 9,
                  background: "rgba(148,163,184,0.07)",
                  border: `1px solid rgba(148,163,184,0.13)`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="rgba(148,163,184,0.7)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <circle cx="12" cy="12" r="6"/>
                    <circle cx="12" cy="12" r="2"/>
                  </svg>
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: TEXT, lineHeight: 1.2 }}>Expansion targets</div>
                {/* Planned pill */}
                <div style={{
                  marginLeft: "auto",
                  padding: "3px 8px",
                  borderRadius: 10,
                  background: "rgba(245,158,11,0.1)",
                  border: "1px solid rgba(245,158,11,0.2)",
                  fontSize: 10,
                  fontWeight: 700,
                  color: "#F59E0B",
                  letterSpacing: "0.06em",
                  whiteSpace: "nowrap" as const,
                }}>PLANNED</div>
              </div>

              <div style={{ fontSize: 12, color: TEXT_FAINT, marginBottom: 18, paddingLeft: 48 }}>
                Chain-specific adapters
              </div>

              <div style={{ width: "100%", height: 1, background: "rgba(148,163,184,0.08)", marginBottom: 18 }} />

              <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 8 }}>
                {[
                  "Solana",
                  "AO / Arweave",
                  "ICP",
                  "Cosmos",
                  "Bridges",
                  "Oracle networks",
                  "Ecosystem dashboards",
                ].map((chip) => (
                  <span key={chip} style={{
                    padding: "4px 10px",
                    borderRadius: 6,
                    border: `1px solid rgba(148,163,184,0.13)`,
                    background: "rgba(148,163,184,0.05)",
                    fontSize: 12,
                    color: TEXT_FAINT,
                    fontWeight: 500,
                    lineHeight: 1.4,
                  }}>{chip}</span>
                ))}
              </div>
            </div>

            {/* Card 3 — Grant / ecosystem fit */}
            <div style={{
              background: "rgba(0,0,0,0.7)",
              border: `1px solid ${PURPLE_FAINT}`,
              borderRadius: 16,
              padding: "28px 24px 24px",
              display: "flex",
              flexDirection: "column" as const,
            }}>
              {/* Icon + title */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: 9,
                  background: PURPLE_FAINTEST,
                  border: `1px solid ${PURPLE_FAINT}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: TEXT, lineHeight: 1.2 }}>Grant / ecosystem fit</div>
              </div>

              <div style={{ fontSize: 12, color: TEXT_FAINT, marginBottom: 18, paddingLeft: 48 }}>
                Infrastructure for builder readiness
              </div>

              <div style={{ width: "100%", height: 1, background: PURPLE_FAINT, marginBottom: 18 }} />

              <p style={{
                fontSize: 13,
                lineHeight: 1.7,
                color: TEXT_MUTED,
                margin: "0 0 20px",
                flex: 1,
              }}>
                SCE supports ecosystem-wide readiness programs — authority-risk mapping, control identification, and evidence preparation — before capital scales.
              </p>

              <a href="mailto:sce@sagitta.systems?subject=SCE%20Roadmap" style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                fontSize: 13,
                fontWeight: 600,
                color: PURPLE,
                textDecoration: "none",
                padding: "8px 0",
              }}>
                Discuss ecosystem coverage &nbsp;→
              </a>
            </div>

          </div>

          {/* Footer note */}
          <div style={{ display: "flex", justifyContent: "center" as const }}>
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 16px",
              borderRadius: 20,
              border: `1px solid rgba(139,92,246,0.22)`,
              background: PURPLE_FAINTEST,
              fontSize: 12,
              color: TEXT_MUTED,
            }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={PURPLE_DIM} strokeWidth="1.8">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                <path d="M9 12l2 2 4-4"/>
              </svg>
              Designed to support ecosystem-wide builder readiness programs.
            </div>
          </div>

        </div>
      </section>

      {/* SAMPLE DEFENSE REVIEW */}
      <section id="sample-defense-review" style={{
        scrollMarginTop: 96,
        position: "relative",
        overflow: "hidden",
        background: "#000",
        borderTop: `1px solid ${PURPLE_FAINT}`,
        borderBottom: `1px solid ${PURPLE_FAINT}`,
      }}>
        <div style={{
          paddingTop: 96,
          paddingBottom: 96,
          paddingLeft: "max(40px, 5vw)",
          paddingRight: "max(40px, 5vw)",
        }}>

          {/* Section header */}
          <div style={{ textAlign: "center" as const, maxWidth: 700, margin: "0 auto 56px" }}>
            <div style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.14em",
              textTransform: "uppercase" as const,
              color: GOLD_DIM,
              marginBottom: 18,
            }}>
              Sample Pre-Launch Defense Review
            </div>
            <h2 style={{
              fontSize: "clamp(28px, 3.4vw, 46px)",
              fontWeight: 800,
              lineHeight: 1.08,
              letterSpacing: "-0.02em",
              color: TEXT,
              margin: "0 0 20px",
            }}>
              What a Defense Review contains
            </h2>
            <p style={{
              fontSize: "clamp(15px, 1.6vw, 18px)",
              fontWeight: 500,
              color: TEXT_MUTED,
              lineHeight: 1.55,
              margin: "0 0 20px",
            }}>
              Demo report using Sagitta Protocol testnet deployment.
            </p>
            <p style={{ fontSize: 13, lineHeight: 1.8, color: TEXT_FAINT, margin: 0 }}>
              Shows report structure, authority-surface mapping, evidence workflow, control checks, and next actions. This is a sample Pre-Launch Defense Review — not a verified client result or a completed review.
            </p>
          </div>

          {/* Two-column layout */}
          <div className="sample-defense-row" style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 40,
            maxWidth: 1100,
            margin: "0 auto",
            alignItems: "start",
          }}>

            {/* LEFT — Mock report cover card */}
            <div style={{
              background: "rgba(0,0,0,0.75)",
              border: `1px solid ${PURPLE_FAINT}`,
              borderRadius: 20,
              overflow: "hidden",
              boxShadow: `0 0 0 1px rgba(139,92,246,0.04) inset, 0 8px 48px rgba(139,92,246,0.1)`,
              position: "relative" as const,
            }}>
              {/* Top accent line */}
              <div style={{
                position: "absolute",
                top: 0, left: 0, right: 0,
                height: 2,
                background: `linear-gradient(90deg, transparent 0%, rgba(212,175,55,0.55) 30%, ${GOLD} 55%, transparent 100%)`,
              }} />

              {/* Cover content */}
              <div style={{ padding: "40px 36px 32px" }}>

                {/* Org / logo mark */}
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 32,
                }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/icon.png" alt="" style={{ height: 32, width: "auto", display: "block", opacity: 0.85 }} />
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.08em", color: TEXT }}>SAGITTA</div>
                    <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.18em", color: GOLD_DIM, textTransform: "uppercase" as const }}>Continuity Engine</div>
                  </div>
                  {/* Sample badge */}
                  <div style={{
                    marginLeft: "auto",
                    padding: "3px 9px",
                    borderRadius: 10,
                    background: GOLD_FAINTEST,
                    border: `1px solid ${GOLD_FAINT}`,
                    fontSize: 9,
                    fontWeight: 700,
                    color: GOLD_DIM,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase" as const,
                  }}>SAMPLE PDF</div>
                </div>

                {/* Report label */}
                <div style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase" as const,
                  color: GOLD_DIM,
                  marginBottom: 12,
                }}>
                  Pre-Launch Defense Review
                </div>

                {/* Report title */}
                <div style={{
                  fontSize: "clamp(22px, 2.8vw, 32px)",
                  fontWeight: 900,
                  lineHeight: 1.1,
                  letterSpacing: "-0.02em",
                  color: TEXT,
                  marginBottom: 8,
                }}>
                  Pre-Launch<br />Continuity Review
                </div>

                <div style={{ width: 180, height: 2, background: `linear-gradient(90deg, ${GOLD}, transparent)`, borderRadius: 2, marginBottom: 28 }} />

                {/* Metadata rows */}
                <div style={{ display: "grid", gap: 10, marginBottom: 32 }}>
                  {[
                    { label: "Project", value: "Sagitta Protocol" },
                    { label: "Environment", value: "Testnet" },
                    { label: "Review Type", value: "Public-Surface" },
                    { label: "Coverage", value: "0/29 verified" },
                  ].map(({ label, value }) => (
                    <div key={label} style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                    }}>
                      <div style={{
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: "0.1em",
                        textTransform: "uppercase" as const,
                        color: TEXT_FAINT,
                        minWidth: 96,
                        flexShrink: 0,
                      }}>{label}</div>
                      <div style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: TEXT_MUTED,
                      }}>{value}</div>
                    </div>
                  ))}
                </div>

                {/* Divider */}
                <div style={{ width: "100%", height: 1, background: `rgba(212,175,55,0.1)`, marginBottom: 16 }} />

                {/* Report sections preview */}
                <div style={{ display: "grid", gap: 6, marginBottom: 4 }}>
                  {[
                    "1 -  Executive Summary",
                    "2 -  Review Scope & Assets",
                    "3 -  Severity Methodology",
                    "4 -  Authority Risk Findings",
                    "5 -  Relevant Threat Families",
                    "6 -  Recommended Controls",
                    "7 -  Verification Status",
                    "8 -  Next Actions",
                  ].map((item) => (
                    <div key={item} style={{
                      fontSize: 11,
                      color: TEXT_FAINT,
                      lineHeight: 1.5,
                      paddingLeft: 4,
                    }}>{item}</div>
                  ))}
                </div>
              </div>
            </div>

            {/* RIGHT — See the deliverable */}
            <div style={{ paddingTop: 8 }}>

              <div style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.14em",
                textTransform: "uppercase" as const,
                color: PURPLE,
                marginBottom: 14,
              }}>
                The report
              </div>

              <h3 style={{
                fontSize: "clamp(24px, 2.8vw, 36px)",
                fontWeight: 800,
                lineHeight: 1.1,
                letterSpacing: "-0.02em",
                color: TEXT,
                margin: "0 0 16px",
              }}>
                See the deliverable
              </h3>

              <p style={{
                fontSize: 14,
                lineHeight: 1.75,
                color: TEXT_MUTED,
                margin: "0 0 20px",
              }}>
                A structured review covering mapped assets, authority surfaces, threat-family relevance, control checks, and remediation priorities.
              </p>

              {/* Proof chips */}
              <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 8, marginBottom: 28 }}>
                {[
                  { label: "5 mapped assets" },
                  { label: "29 control checks" },
                  { label: "5 threat families" },
                  { label: "0 keys required" },
                ].map(({ label }) => (
                  <span key={label} style={{
                    padding: "5px 12px",
                    borderRadius: 6,
                    border: `1px solid ${GOLD_FAINT}`,
                    background: GOLD_FAINTEST,
                    fontSize: 12,
                    fontWeight: 600,
                    color: GOLD_DIM,
                    lineHeight: 1.4,
                  }}>{label}</span>
                ))}
              </div>

              {/* Checklist */}
              <div style={{ display: "grid", gap: 13, marginBottom: 32 }}>
                {[
                  "Mapped assets and authority surfaces",
                  "Threat-family relevance and risk summary",
                  "Evidence status and missing controls",
                  "Verification coverage",
                  "Findings, severity, and next actions",
                  "Executive summary for stakeholders",
                ].map((item) => (
                  <div key={item} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                    <div style={{
                      width: 20,
                      height: 20,
                      borderRadius: 6,
                      background: GOLD_FAINTEST,
                      border: `1px solid ${GOLD_FAINT}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      marginTop: 1,
                    }}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={GOLD_DIM} strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    </div>
                    <span style={{ fontSize: 14, color: TEXT_MUTED, lineHeight: 1.55 }}>{item}</span>
                  </div>
                ))}
              </div>

              {/* Trust strip */}
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 14px",
                borderRadius: 10,
                border: `1px solid ${PURPLE_FAINT}`,
                background: PURPLE_FAINTEST,
                marginBottom: 28,
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={PURPLE_DIM} strokeWidth="1.8" style={{ flexShrink: 0 }}>
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  <path d="M9 12l2 2 4-4"/>
                </svg>
                <span style={{ fontSize: 12, color: TEXT_FAINT }}>
                  Zero-custody · No keys · No signing authority
                </span>
              </div>

              {/* CTAs */}
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" as const, alignItems: "center" }}>
                <a href="/sample-review.pdf" target="_blank" rel="noopener noreferrer" style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "13px 24px",
                  borderRadius: 10,
                  background: GOLD,
                  color: "#111827",
                  textDecoration: "none",
                  fontWeight: 800,
                  fontSize: 14,
                }}>
                  View sample report &nbsp;→
                </a>
                <span style={{ fontSize: 12, color: TEXT_FAINT }}>
                  Demo PDF · Sagitta Protocol testnet
                </span>
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* FIRST SERVICE DOOR — Defense Review */}
      <section id="first-service-door" style={{
        scrollMarginTop: 96,
        position: "relative",
        background: "#000",
        borderTop: `1px solid ${PURPLE_FAINT}`,
        borderBottom: `1px solid ${PURPLE_FAINT}`,
        overflow: "hidden",
      }}>
        <div className="fsd-grid" style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 5fr) minmax(0, 7fr)",
          minHeight: 720,
        }}>
          {/* Left: copy + illustration */}
          <div className="fsd-left" style={{
            display: "flex",
            flexDirection: "column",
            paddingTop: 72,
            paddingLeft: "max(40px, 5vw)",
            paddingRight: 40,
          }}>
            {/* Eyebrow with dot + line */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 24,
            }}>
              <span style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.2em",
                textTransform: "uppercase" as const,
                color: PURPLE,
              }}>First Service Door</span>
              <span style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: PURPLE,
                flexShrink: 0,
              }} />
              <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${PURPLE}, transparent)` }} />
            </div>

            {/* Headline */}
            <h2 style={{
              margin: "0 0 16px",
              fontSize: "clamp(36px, 4.5vw, 60px)",
              fontWeight: 900,
              lineHeight: 1.0,
              letterSpacing: "-0.025em",
              color: TEXT,
            }}>
              SCE Defense Review
            </h2>

            {/* Colored subheadline */}
            <p style={{
              margin: "0 0 20px",
              fontSize: "clamp(18px, 2.2vw, 26px)",
              fontWeight: 800,
              lineHeight: 1.25,
              color: TEXT,
            }}>
              A{" "}
              <span style={PURPLE_GRADIENT_TEXT}>protocol survival</span>
              {" "}review<br />before the emergency.
            </p>

            <div style={{ width: 248, height: 3, background: `linear-gradient(90deg, ${PURPLE}, transparent)`, borderRadius: 2, marginBottom: 40 }} />

            {/* Description */}
            <p style={{
              margin: "0 0 32px",
              fontSize: 14,
              lineHeight: 1.72,
              color: TEXT_MUTED,
              maxWidth: 420,
            }}>
              Built on the Sagitta Continuity Engine, the Defense Review maps your public protocol surface against authority-risk patterns, global incident families, continuity doctrine, and evidence gaps.
            </p>

            {/* Illustration — fills the rest of the left column */}
            <div style={{ flex: 1, position: "relative", minHeight: 280, overflow: "hidden" }}>
              <Image
                src="/section4-illustration.png"
                alt=""
                width={900}
                height={507}
                style={{
                  width: "100%",
                  height: "auto",
                  display: "block",
                  position: "absolute",
                  bottom: 0,
                  left: -20,
                  zIndex: 2,
                }}
              />
              
            </div>
          </div>

          {/* Right: cards + CTAs */}
          <div className="fsd-right" style={{
            padding: "72px 40px 48px max(32px, 3vw)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            gap: 32,
          }}>
            {/* 3 cards */}
            <div className="fsd-cards" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, paddingTop: 120 }}>

              {/* Pricing card */}
              <div style={{
                background: "linear-gradient(135deg, rgba(167,139,250,0.95) 0%, rgba(139,92,246,0.7) 35%, rgba(88,28,135,0.4) 70%, rgba(40,10,80,0.2) 100%)",
                borderRadius: 20,
                padding: 1.5,
                boxShadow: "0 0 0 1px rgba(167,139,250,0.1), 0 8px 32px rgba(139,92,246,0.35), 0 0 80px rgba(139,92,246,0.18)",
                transform: "scale(1.03)",
                transformOrigin: "center top",
                zIndex: 1,
                position: "relative",
              }}>
              <div style={{
                borderRadius: 19,
                padding: "28px 22px",
                background: "linear-gradient(160deg, #0d0a1a 0%, #07050f 60%, #000 100%)",
                display: "flex",
                flexDirection: "column",
                position: "relative",
                height: "100%",
                boxSizing: "border-box" as const,
                overflow: "hidden",
              }}>
                {/* Top purple glow accent */}
                <div style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 2,
                  background: "linear-gradient(90deg, transparent 0%, rgba(167,139,250,0.9) 30%, rgba(139,92,246,1) 60%, transparent 100%)",
                  borderRadius: "19px 19px 0 0",
                }} />
                {/* Inner ambient glow */}
                <div style={{
                  position: "absolute",
                  top: -60,
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: 200,
                  height: 120,
                  background: "radial-gradient(ellipse, rgba(139,92,246,0.22) 0%, transparent 70%)",
                  pointerEvents: "none",
                }} />
                {/* Shield icon top-right */}
                <div style={{
                  position: "absolute",
                  top: 16,
                  right: 16,
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: "rgba(139,92,246,0.15)",
                  border: `1px solid rgba(139,92,246,0.3)`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.8">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    <polyline points="9 12 11 14 15 10"/>
                  </svg>
                </div>

                <div style={{ fontSize: 12, fontWeight: 600, color: TEXT_MUTED, marginBottom: 10, paddingRight: 40 }}>
                  Starter Defense Review
                </div>
                <div style={{ fontSize: 36, fontWeight: 900, color: PURPLE, lineHeight: 1, marginBottom: 4 }}>$3,000</div>
                <div style={{
                  height: 1,
                  background: `linear-gradient(90deg, rgba(139,92,246,0.3), transparent)`,
                  margin: "12px 0",
                }} />
                <div style={{ fontSize: 11, color: TEXT_FAINT, marginBottom: 14 }}>
                  Up to 5 public contracts or assets
                </div>
                <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 8, flex: 1 }}>
                  {[
                    "Public asset mapping",
                    "Authority-risk findings",
                    "Relevant threat-family mapping",
                    "Recommended controls",
                    "Evidence and verification tracking",
                    "Client-ready report",
                  ].map((item) => (
                    <li key={item} style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 12, color: TEXT_MUTED }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}>
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                        <polyline points="9 12 11 14 15 10"/>
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              </div>

              {/* What You Provide card */}
              <div style={{
                background: "linear-gradient(135deg, rgba(139,92,246,0.55) 0%, rgba(100,60,200,0.25) 45%, rgba(60,20,120,0.1) 100%)",
                borderRadius: 17,
                padding: 1,
              }}>
              <div style={{
                borderRadius: 16,
                padding: "24px 20px",
                background: "#000",
                display: "flex",
                flexDirection: "column",
                height: "100%",
                boxSizing: "border-box" as const,
              }}>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 20,
                }}>
                  <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: "0.14em", color: PURPLE, textTransform: "uppercase" as const }}>
                    What You Provide
                  </div>
                  <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: "rgba(139,92,246,0.12)",
                    border: `1px solid rgba(139,92,246,0.25)`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.8">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                    </svg>
                  </div>
                </div>
                <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 14, flex: 1 }}>
                  {[
                    { label: "Project name", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.8"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
                    { label: "Chain / network", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg> },
                    { label: "Explorer links", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.8"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg> },
                    { label: "Docs / repo", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.8"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg> },
                    { label: "Optional admin evidence", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.8"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> },
                  ].map(({ label, icon }) => (
                    <li key={label} style={{ display: "flex", gap: 10, alignItems: "center", fontSize: 12, color: TEXT_MUTED }}>
                      <span style={{ flexShrink: 0 }}>{icon}</span>
                      {label}
                    </li>
                  ))}
                </ul>
              </div>
              </div>

              {/* What You Receive card */}
              <div style={{
                background: "linear-gradient(135deg, rgba(139,92,246,0.55) 0%, rgba(100,60,200,0.25) 45%, rgba(60,20,120,0.1) 100%)",
                borderRadius: 17,
                padding: 1,
              }}>
              <div style={{
                borderRadius: 16,
                padding: "24px 20px",
                background: "#000",
                display: "flex",
                flexDirection: "column",
                height: "100%",
                boxSizing: "border-box" as const,
              }}>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 20,
                }}>
                  <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: "0.14em", color: PURPLE, textTransform: "uppercase" as const }}>
                    What You Receive
                  </div>
                  <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: "rgba(139,92,246,0.12)",
                    border: `1px solid rgba(139,92,246,0.25)`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.8">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                      <polyline points="9 12 11 14 15 10"/>
                    </svg>
                  </div>
                </div>
                <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 14, flex: 1 }}>
                  {[
                    "Mapped assets",
                    "Authority findings",
                    "Controls",
                    "Verification status",
                    "Next actions",
                  ].map((label) => (
                    <li key={label} style={{ display: "flex", gap: 10, alignItems: "center", fontSize: 12, color: TEXT_MUTED }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" style={{ flexShrink: 0 }}>
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                        <polyline points="9 12 11 14 15 10"/>
                      </svg>
                      {label}
                    </li>
                  ))}
                </ul>
              </div>
              </div>
            </div>

            {/* CTAs */}
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" as const }}>
              <a href="mailto:sce@sagitta.systems?subject=SCE%20Defense%20Review%20Request" style={{
                flex: 1,
                padding: "14px 24px",
                borderRadius: 10,
                background: GOLD,
                color: "#111827",
                textDecoration: "none",
                fontWeight: 800,
                fontSize: 14,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                whiteSpace: "nowrap" as const,
                minWidth: 200,
              }}>
                Request Defense Review &nbsp;→
              </a>
              <a href="#how-sce-works" style={{
                flex: 1,
                padding: "14px 24px",
                borderRadius: 10,
                border: `1px solid rgba(255,255,255,0.18)`,
                background: "rgba(255,255,255,0.04)",
                color: TEXT,
                textDecoration: "none",
                fontWeight: 600,
                fontSize: 14,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                whiteSpace: "nowrap" as const,
                minWidth: 160,
              }}>
                View How It Works &nbsp;→
              </a>
            </div>

            {/* Trust line */}
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
              <div style={{
                width: 34,
                height: 34,
                borderRadius: 8,
                border: `1px solid rgba(139,92,246,0.25)`,
                background: "rgba(139,92,246,0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={PURPLE_DIM} strokeWidth="1.8">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </div>
              <span style={{ fontSize: 12, color: TEXT_FAINT, lineHeight: 2.6 }}>
                Manual service. Powered internally by Sagitta Continuity Engine (SCE).
                No keys. No wallet access. No signing rights.
              </span>
            </div>

            {/* Proof asset callout */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 16px",
              borderRadius: 10,
              border: `1px solid ${GOLD_FAINT}`,
              background: GOLD_FAINTEST,
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={GOLD_DIM} strokeWidth="1.8" style={{ flexShrink: 0 }}>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
              <span style={{ fontSize: 12, color: TEXT_FAINT, lineHeight: 1.5 }}>
                Proof asset: sample Pre-Launch Defense Review available.{" "}
                <a href="/sample-review.pdf" target="_blank" rel="noopener noreferrer" style={{ color: GOLD_DIM, textDecoration: "underline", fontWeight: 600 }}>
                  Review the demo PDF before requesting a Defense Review.
                </a>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" style={{
        scrollMarginTop: 96,
        background: BG,
        borderTop: `1px solid ${BORDER}`,
        borderBottom: `1px solid ${BORDER}`,
        padding: "80px max(40px, 5vw) 88px",
      }}>
        {/* Section header */}
        <div style={{ maxWidth: 640, marginBottom: 56 }}>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 18,
          }}>
            <span style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.22em",
              textTransform: "uppercase" as const,
              color: PURPLE,
            }}>Questions Before Review</span>
            <div style={{ width: 32, height: 1, background: `linear-gradient(90deg, ${PURPLE}, transparent)` }} />
          </div>
          <h2 style={{
            margin: "0 0 16px",
            fontSize: "clamp(28px, 3.5vw, 44px)",
            fontWeight: 900,
            lineHeight: 1.1,
            letterSpacing: "-0.025em",
            color: TEXT,
          }}>
            Frequently asked questions
          </h2>
          <p style={{
            margin: 0,
            fontSize: 15,
            lineHeight: 1.7,
            color: TEXT_MUTED,
            maxWidth: 520,
          }}>
            Clear answers for teams evaluating an SCE Defense Review.
          </p>
        </div>

        {/* FAQ grid */}
        <div className="faq-grid" style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 16,
        }}>
          {[
            {
              q: "Is SCE a smart contract audit?",
              a: "No. SCE complements audits; it does not replace them. Audits review code, implementation flaws, and exploit paths. SCE reviews continuity and control readiness: authority surfaces, admin paths, treasury controls, oracle dependencies, governance and timelock posture, keeper and liveness assumptions, emergency procedures, and evidence coverage.",
            },
            {
              q: "Do you need access to our keys or wallets?",
              a: "No. Never. SCE does not request private keys, seed phrases, custody access, signing authority, or transaction approval rights.",
            },
            {
              q: "What do we need to provide?",
              a: "At minimum, provide contract addresses, deployment chain, project context, and any known admin, multisig, timelock, oracle, treasury, keeper, or governance configuration. Optional evidence can include policy documents, multisig screenshots, governance proposals, runbooks, emergency procedures, or links to public documentation.",
            },
            {
              q: "Is this useful before mainnet?",
              a: "Yes. Pre-launch testnet reviews are one of the strongest use cases. Authority patterns, timelocks, multisigs, oracle fallbacks, treasury controls, and emergency procedures are easier to improve before mainnet deployment and before capital scales.",
            },
            {
              q: "Which chains does SCE support?",
              a: "Active now: EVM and Ethereum-compatible deployments where public contract data, explorer records, or project-submitted details are available. Coverage targets: Ethereum, Base, Arbitrum, Optimism, Polygon, Avalanche C-Chain, BNB Chain, Moonbeam. Expansion targets: Solana, AO / Arweave, ICP, Cosmos, bridges, and oracle networks through future chain-specific adapters.",
            },
            {
              q: "What do we receive?",
              a: "You receive a structured Defense Review report covering mapped assets, control findings, threat-family relevance, evidence status, severity framing, and next actions. When evidence is submitted, SCE can generate an updated report showing improved verification coverage.",
            },
            {
              q: "Does SCE certify that our protocol is safe?",
              a: "No. SCE does not guarantee safety or certify that a protocol cannot fail. A Defense Review identifies public-surface continuity risks, missing evidence, and control gaps so teams can improve readiness and make better decisions.",
            },
            {
              q: "Who is this for?",
              a: "SCE Defense Reviews are built for protocol teams, DAOs, DeFi systems, treasury-heavy projects, grant programs, ecosystem foundations, and infrastructure teams that need a clearer view of control failure, authority concentration, oracle risk, treasury posture, and emergency readiness.",
            },
            {
              q: "How is this different from monitoring tools?",
              a: "Monitoring tools alert teams after signals appear. SCE focuses on readiness before failure: mapping control risk, linking findings to known threat families, identifying missing controls, and preparing evidence and procedures before an incident occurs.",
            },
            {
              q: "Can ecosystems or grant programs use SCE?",
              a: "Yes. SCE supports ecosystem-wide readiness programs — authority-risk mapping, control gap identification, and evidence preparation before mainnet.",
            },
          ].map(({ q, a }) => (
            <div key={q} style={{
              background: "linear-gradient(135deg, rgba(139,92,246,0.06) 0%, rgba(8,10,14,0) 100%)",
              border: `1px solid rgba(139,92,246,0.14)`,
              borderRadius: 14,
              padding: "24px 28px",
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}>
              <div style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 12,
              }}>
                <div style={{
                  flexShrink: 0,
                  width: 22,
                  height: 22,
                  borderRadius: 6,
                  background: "rgba(139,92,246,0.13)",
                  border: `1px solid rgba(139,92,246,0.28)`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginTop: 1,
                }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2.2">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                    <line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                </div>
                <p style={{
                  margin: 0,
                  fontSize: 14,
                  fontWeight: 700,
                  lineHeight: 1.4,
                  color: TEXT,
                }}>{q}</p>
              </div>
              <p style={{
                margin: "0 0 0 34px",
                fontSize: 13,
                lineHeight: 1.72,
                color: TEXT_MUTED,
              }}>{a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PRE-FOOTER CTA BANNER */}
      <section style={{ padding: "40px max(40px, 5vw)", background: BG, borderTop: `1px solid ${BORDER}` }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 32,
          padding: "28px 36px",
          borderRadius: 16,
          border: `1px solid ${PURPLE_FAINT}`,
          background: "linear-gradient(135deg, rgba(139,92,246,0.09) 0%, rgba(139,92,246,0.04) 60%, rgba(8,10,14,0) 100%)",
          boxShadow: `0 0 0 1px rgba(139,92,246,0.08) inset`,
          flexWrap: "wrap",
        }}>
          {/* Shield icon */}
          <div style={{
            width: 64,
            height: 64,
            flexShrink: 0,
            position: "relative",
            filter: "drop-shadow(0 0 14px rgba(139,92,246,0.6))",
          }}>
            <svg width="64" height="64" viewBox="0 0 64 64" fill="none" style={{ position: "absolute", inset: 0 }}>
              <path d="M32 4 L56 16 L56 48 L32 60 L8 48 L8 16 Z" fill="rgba(139,92,246,0.13)" stroke="rgba(139,92,246,0.55)" strokeWidth="1.2"/>
            </svg>
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#c4b5fd" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                <polyline points="9 12 11 14 15 10"/>
              </svg>
            </div>
          </div>

          {/* Headline */}
          <div style={{ flex: 1, minWidth: 240 }}>
            <p style={{ margin: 0, fontSize: "clamp(16px, 1.8vw, 22px)", fontWeight: 800, lineHeight: 1.3, color: TEXT }}>
              Do not wait for your incident<br />
              to reveal your{" "}
              <span style={PURPLE_GRADIENT_TEXT}>control gaps.</span>
            </p>
          </div>

          {/* Divider */}
          <div style={{ width: 1, alignSelf: "stretch", background: `rgba(139,92,246,0.25)`, flexShrink: 0 }} className="cta-divider" />

          {/* Buttons */}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", flexShrink: 0 }}>
            <a href="mailto:sce@sagitta.systems?subject=SCE%20Defense%20Review%20Request" style={{
              padding: "13px 22px",
              borderRadius: 10,
              background: "#D4AF37",
              color: "#111827",
              textDecoration: "none",
              fontWeight: 800,
              fontSize: 14,
              whiteSpace: "nowrap",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}>
              Request Defense Review &nbsp;→
            </a>
            <Link href="/login" style={{
              padding: "13px 22px",
              borderRadius: 10,
              border: `1px solid ${PURPLE_FAINT}`,
              background: "rgba(139,92,246,0.08)",
              color: PURPLE,
              textDecoration: "none",
              fontWeight: 700,
              fontSize: 14,
              whiteSpace: "nowrap",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}>
              Enter Portal &nbsp;→
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: `1px solid ${BORDER}`, background: BG }}>

        {/* Main footer grid */}
        <div className="footer-grid" style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 2.2fr) minmax(0, 1fr) minmax(0, 1fr) minmax(0, 2fr)",
          gap: "40px 32px",
          padding: "64px max(40px, 5vw) 48px",
          borderBottom: `1px solid ${BORDER}`,
        }}>

          {/* Brand column */}
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icon.png" alt="" style={{ height: 56, width: "auto", display: "block" }} />
              <div>
                <div style={{ fontSize: 20, fontWeight: 900, letterSpacing: "-0.01em", color: TEXT }}>SAGITTA</div>
                <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.2em", color: PURPLE, textTransform: "uppercase" as const }}>Continuity Engine</div>
              </div>
            </div>
            <p style={{ fontSize: 13, color: TEXT_MUTED, lineHeight: 1.7, marginBottom: 20, maxWidth: 280 }}>
              Survival infrastructure for protocols when normal assumptions fail.
            </p>
            <div style={{ width: 200, height: 2, background: `linear-gradient(90deg, ${PURPLE}, transparent)`, borderRadius: 2, marginBottom: 20 }} />
            <div style={{ display: "flex", alignItems: "flex-start", gap: 9 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={PURPLE_DIM} strokeWidth="1.8" style={{ flexShrink: 0, marginTop: 1 }}>
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              <span style={{ fontSize: 12, color: TEXT_FAINT, lineHeight: 1.65 }}>
                Zero-custody. Public-surface only.<br />No keys. No signing authority.
              </span>
            </div>
          </div>

          {/* Platform column */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", color: PURPLE, textTransform: "uppercase" as const, marginBottom: 20 }}>
              Platform
            </div>
            <div style={{ display: "grid", gap: 13 }}>
              {[
                { label: "Overview", href: "#overview" },
                { label: "Continuity Mandate", href: "#continuity-mandate" },
                { label: "How SCE Works", href: "#how-sce-works" },
                { label: "Defense Review", href: "#first-service-door" },
              ].map(({ label, href }) => (
                <a key={label} href={href} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: TEXT_MUTED, textDecoration: "none" }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={PURPLE} strokeWidth="2.5" style={{ flexShrink: 0 }}>
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                  {label}
                </a>
              ))}
            </div>
          </div>

          {/* Resources column */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", color: PURPLE, textTransform: "uppercase" as const, marginBottom: 20 }}>
              Resources
            </div>
            <div style={{ display: "grid", gap: 13 }}>
              {[
                { label: "Resource Hub", href: "/resources" },
                { label: "Guides & Playbooks", href: "/resources" },
                { label: "Incident Readiness", href: "/resources" },
                { label: "Research & Updates", href: "/resources" },
              ].map(({ label, href }) => (
                <a key={label} href={href} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: TEXT_MUTED, textDecoration: "none" }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={PURPLE} strokeWidth="2.5" style={{ flexShrink: 0 }}>
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                  {label}
                </a>
              ))}
            </div>
          </div>

          {/* Built For column */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", color: PURPLE, textTransform: "uppercase" as const, marginBottom: 20 }}>
              Built For
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {[
                {
                  label: "Protocol Teams",
                  sub: "Review pre-launch authority paths, admin roles, upgrade controls, and emergency procedures.",
                  icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={TEXT_MUTED} strokeWidth="1.6"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
                },
                {
                  label: "DAOs",
                  sub: "Map governance risk, quorum assumptions, signer rotation, and timelock posture.",
                  icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={TEXT_MUTED} strokeWidth="1.6"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
                },
                {
                  label: "DeFi Systems",
                  sub: "Review oracle dependencies, treasury movement, settlement paths, and keeper liveness.",
                  icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={TEXT_MUTED} strokeWidth="1.6"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>,
                },
                {
                  label: "Treasury-Heavy Projects",
                  sub: "Check multisig setup, spending rules, withdrawal paths, and reserve controls.",
                  icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={TEXT_MUTED} strokeWidth="1.6"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><line x1="12" y1="12" x2="12" y2="16"/><line x1="10" y1="14" x2="14" y2="14"/></svg>,
                },
                {
                  label: "Infrastructure Teams",
                  sub: "Map dependency risk, liveness assumptions, access control, and incident response readiness.",
                  icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={TEXT_MUTED} strokeWidth="1.6"><rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg>,
                },
                {
                  label: "Ecosystem / Grant Programs",
                  sub: "Support builder readiness, evidence hygiene, and pre-launch continuity standards across funded teams.",
                  icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={TEXT_MUTED} strokeWidth="1.6"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>,
                },
              ].map(({ label, sub, icon }) => (
                <div key={label} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <span style={{ flexShrink: 0, marginTop: 2 }}>{icon}</span>
                  <div>
                    <div style={{ fontSize: 13, color: TEXT_MUTED, fontWeight: 600, marginBottom: 2 }}>{label}</div>
                    <div style={{ fontSize: 11, color: TEXT_FAINT, lineHeight: 1.5 }}>{sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "18px max(40px, 5vw)",
          flexWrap: "wrap",
          gap: 12,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icon.png" alt="" style={{ height: 22, width: "auto", display: "block", opacity: 0.7 }} />
            <span style={{ fontSize: 12, color: TEXT_FAINT }}>
              © {new Date().getFullYear()} Sagitta. Public-surface continuity intelligence.
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 12, color: TEXT_FAINT }}>
            <Link href="/privacy" style={{ color: TEXT_FAINT, textDecoration: "none" }}>Privacy</Link>
            <span style={{ color: PURPLE_DIM }}>•</span>
            <Link href="/terms" style={{ color: TEXT_FAINT, textDecoration: "none" }}>Terms</Link>
            <span style={{ color: PURPLE_DIM }}>•</span>
            <Link href="/status" style={{ color: TEXT_FAINT, textDecoration: "none" }}>Status</Link>
          </div>
        </div>

      </footer>
    </div>
  );
}

function SectionLabel({ children, center }: { children: React.ReactNode; center?: boolean }) {
  return (
    <div style={{
      fontSize: 11,
      letterSpacing: "0.22em",
      color: GOLD_DIM,
      fontWeight: 700,
      textAlign: center ? "center" : "left",
    }}>
      {children}
    </div>
  );
}

function CapabilityCard({ label, body, accent }: { label: string; body: string; accent?: "gold" | "purple" }) {
  const accentColor = accent === "purple" ? PURPLE : GOLD;
  const accentFaint = accent === "purple" ? PURPLE_FAINT : GOLD_FAINT;
  const accentFaintest = accent === "purple" ? PURPLE_FAINTEST : GOLD_FAINTEST;
  return (
    <div style={{
      padding: "22px 20px",
      borderRadius: 14,
      border: `1px solid ${accentFaint}`,
      background: SURFACE,
      display: "grid",
      gap: 10,
      borderLeft: `3px solid ${accentColor}`,
    }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: TEXT }}>{label}</div>
      <div style={{ fontSize: 13, color: TEXT_MUTED, lineHeight: 1.65 }}>{body}</div>
      <div style={{ width: 20, height: 2, borderRadius: 1, background: accentFaintest }} />
    </div>
  );
}

function LoopStep({ n, label, body, last }: { n: string; label: string; body: string; last: boolean }) {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "48px 1fr",
      gap: "0 20px",
      paddingBottom: last ? 0 : 32,
      position: "relative",
    }}>
      {/* connector line */}
      {!last && (
        <div style={{
          position: "absolute",
          left: 23,
          top: 36,
          bottom: 0,
          width: 1,
          background: `linear-gradient(180deg, ${PURPLE_FAINT}, rgba(139,92,246,0.06))`,
        }} />
      )}
      <div style={{
        width: 48,
        height: 48,
        borderRadius: "50%",
        border: `1px solid ${PURPLE_FAINT}`,
        background: PURPLE_FAINTEST,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 11,
        fontWeight: 800,
        color: PURPLE_DIM,
        letterSpacing: "0.06em",
        flexShrink: 0,
        zIndex: 1,
        position: "relative",
      }}>{n}</div>
      <div style={{ paddingTop: 10, paddingBottom: 4 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: TEXT, marginBottom: 6 }}>{label}</div>
        <div style={{ fontSize: 13, color: TEXT_MUTED, lineHeight: 1.65 }}>{body}</div>
      </div>
    </div>
  );
}
