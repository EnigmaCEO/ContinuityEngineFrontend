import type { Metadata } from "next";
import type React from "react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Sagitta Defense Research - Public-Surface Authority Intelligence",
  description:
    "Sagitta Defense research methodology for public-surface authority intelligence across protocols, treasuries, and on-chain systems.",
};

const BG = "#080a0e";
const SURFACE = "rgba(10,12,18,0.92)";
const TEXT = "#E2E8F0";
const TEXT_MUTED = "rgba(203,213,225,0.72)";
const TEXT_FAINT = "rgba(148,163,184,0.58)";
const PURPLE = "#8B5CF6";
const PURPLE_FAINT = "rgba(139,92,246,0.18)";
const PURPLE_FAINTEST = "rgba(139,92,246,0.07)";
const GOLD = "#D4AF37";
const GOLD_DIM = "rgba(212,175,55,0.72)";
const GOLD_FAINT = "rgba(212,175,55,0.16)";
const BORDER = "rgba(212,175,55,0.14)";

const COVERAGE_ITEMS = [
  "Owner/admin paths",
  "Proxy and upgrade authority",
  "Multisig and timelock visibility",
  "Treasury and vault control paths",
  "Oracle authority and fallback evidence",
  "Shared-owner or role concentration",
  "Unresolved public evidence gaps",
  "Threat-family relevance from the SCE Case Library",
];

const METHODOLOGY_STEPS = [
  "Map public assets",
  "Resolve owner/admin/proxy/timelock paths where possible",
  "Identify shared authority or concentration patterns",
  "Separate observed owner evidence from verified controls",
  "Connect relevant threat families",
  "Publish only with responsible framing",
];

const NOT_ITEMS = [
  "Not smart contract audits",
  "Not exploit claims",
  "Not invasive testing",
  "Not private key, custody, or signing access",
  "Not certification that a protocol is safe or defended",
];

const STATUS_CHIPS = [
  "Protocol selection",
  "Public-data only",
  "Disclosure posture required",
  "No findings public yet",
];

export default function ResearchPage() {
  return (
    <div style={{ background: BG, color: TEXT, minHeight: "100vh", fontFamily: "var(--font-geist-sans), Arial, sans-serif" }}>
      <section style={{
        padding: "84px max(40px, 5vw) 72px",
        borderBottom: `1px solid ${BORDER}`,
        background: "linear-gradient(135deg, rgba(139,92,246,0.1) 0%, rgba(8,10,14,0) 48%)",
      }}>
        <div style={{ maxWidth: 900 }}>
          <div style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.18em",
            color: PURPLE,
            textTransform: "uppercase",
            marginBottom: 18,
          }}>
            Public research methodology
          </div>
          <h1 style={{
            margin: "0 0 18px",
            fontSize: "clamp(36px, 5vw, 64px)",
            fontWeight: 900,
            lineHeight: 1.03,
            letterSpacing: "-0.02em",
            color: TEXT,
          }}>
            Sagitta Defense Research
          </h1>
          <p style={{ margin: "0 0 18px", maxWidth: 680, fontSize: "clamp(17px, 2vw, 22px)", lineHeight: 1.45, color: TEXT }}>
            Public-surface authority intelligence for protocols, treasuries, and on-chain systems.
          </p>
          <p style={{ margin: 0, maxWidth: 680, fontSize: 15, lineHeight: 1.75, color: TEXT_MUTED }}>
            Sagitta Defense research notes apply SCE's public-surface methodology to real protocols using verified public data, responsible disclosure posture, and non-hostile analysis.
          </p>
        </div>
      </section>

      <main style={{ padding: "64px max(40px, 5vw) 80px" }}>
        <section style={{ maxWidth: 1120, margin: "0 auto 72px" }}>
          <SectionHeader eyebrow="Scope" title="What research notes cover" />
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 230px), 1fr))",
            gap: 14,
          }}>
            {COVERAGE_ITEMS.map((item) => (
              <InfoCard key={item}>{item}</InfoCard>
            ))}
          </div>
        </section>

        <section style={{ maxWidth: 1120, margin: "0 auto 72px" }}>
          <SectionHeader eyebrow="Methodology" title="How the analysis works" />
          <div style={{ display: "grid", gap: 12 }}>
            {METHODOLOGY_STEPS.map((step, index) => (
              <div key={step} style={{
                display: "grid",
                gridTemplateColumns: "44px minmax(0, 1fr)",
                gap: 16,
                alignItems: "start",
                padding: "18px 20px",
                borderRadius: 8,
                border: `1px solid ${PURPLE_FAINT}`,
                background: index % 2 === 0 ? PURPLE_FAINTEST : "rgba(255,255,255,0.02)",
              }}>
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  border: `1px solid ${GOLD_FAINT}`,
                  background: "rgba(212,175,55,0.08)",
                  color: GOLD_DIM,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  fontWeight: 800,
                }}>
                  {String(index + 1).padStart(2, "0")}
                </div>
                <p style={{ margin: 0, fontSize: 14, lineHeight: 1.65, color: TEXT_MUTED }}>{step}</p>
              </div>
            ))}
          </div>
        </section>

        <section style={{ maxWidth: 1120, margin: "0 auto 72px" }}>
          <SectionHeader eyebrow="Boundaries" title="What research notes are not" />
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 260px), 1fr))",
            gap: 14,
          }}>
            {NOT_ITEMS.map((item) => (
              <InfoCard key={item} accent="gold">{item}</InfoCard>
            ))}
          </div>
        </section>

        <section style={{
          maxWidth: 1120,
          margin: "0 auto 72px",
          padding: "28px",
          borderRadius: 8,
          border: `1px solid ${PURPLE_FAINT}`,
          background: "linear-gradient(135deg, rgba(139,92,246,0.08) 0%, rgba(10,12,18,0.92) 62%)",
        }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))", gap: 28, alignItems: "start" }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.16em", color: GOLD, textTransform: "uppercase", marginBottom: 12 }}>
                Research Note 001
              </div>
              <h2 style={{ margin: "0 0 14px", fontSize: "clamp(24px, 3vw, 34px)", fontWeight: 850, color: TEXT }}>
                Research Note 001 — In Preparation
              </h2>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.72, color: TEXT_MUTED }}>
                The first note is in protocol selection. Protocol not selected. No findings will be published until public data review, factual checks, disclosure posture, and brand/legal review are complete.
              </p>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {STATUS_CHIPS.map((chip) => (
                <span key={chip} style={{
                  padding: "8px 12px",
                  borderRadius: 6,
                  border: `1px solid ${GOLD_FAINT}`,
                  background: "rgba(212,175,55,0.07)",
                  color: GOLD_DIM,
                  fontSize: 12,
                  fontWeight: 700,
                  lineHeight: 1.35,
                }}>
                  {chip}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section style={{
          maxWidth: 1120,
          margin: "0 auto 72px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))",
          gap: 24,
          alignItems: "center",
          padding: "28px",
          borderRadius: 8,
          border: `1px solid ${BORDER}`,
          background: SURFACE,
        }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.16em", color: PURPLE, textTransform: "uppercase", marginBottom: 12 }}>
              Sample method
            </div>
            <h2 style={{ margin: "0 0 12px", fontSize: 24, fontWeight: 800, color: TEXT }}>
              See the sample Defense Review
            </h2>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.72, color: TEXT_MUTED, maxWidth: 700 }}>
              SCE resolved owner paths across mapped testnet assets, detected shared-owner concentration, and separated observed owner evidence from verified controls.
            </p>
          </div>
          <a href="/sample-review.pdf" target="_blank" rel="noopener noreferrer" style={primaryButtonStyle}>
            View sample Defense Review
          </a>
        </section>

        <section style={{
          maxWidth: 1120,
          margin: "0 auto",
          padding: "30px",
          borderRadius: 8,
          border: `1px solid ${PURPLE_FAINT}`,
          background: "rgba(139,92,246,0.05)",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))",
          gap: 24,
          alignItems: "center",
        }}>
          <div>
            <h2 style={{ margin: "0 0 8px", fontSize: 22, fontWeight: 800, color: TEXT }}>
              Ready for a private review?
            </h2>
            <p style={{ margin: 0, fontSize: 13, lineHeight: 1.65, color: TEXT_MUTED }}>
              If you want this methodology applied to your own protocol before publication, request a Sagitta Defense Review.
            </p>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
            <a href="mailto:sce@sagitta.systems?subject=SCE%20Defense%20Review%20Request" style={primaryButtonStyle}>
              Request Defense Review
            </a>
            <a href="/sample-review.pdf" target="_blank" rel="noopener noreferrer" style={secondaryButtonStyle}>
              View sample report
            </a>
          </div>
        </section>
      </main>

      <footer style={{
        padding: "20px max(40px, 5vw)",
        borderTop: `1px solid ${BORDER}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 12,
      }}>
        <Link href="/" style={{ fontSize: 12, color: TEXT_FAINT, textDecoration: "none" }}>
          Back to home
        </Link>
        <span style={{ fontSize: 11, color: TEXT_FAINT }}>Research Note 001 is not published.</span>
      </footer>
    </div>
  );
}

function SectionHeader({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "0.16em",
        color: PURPLE,
        textTransform: "uppercase",
        marginBottom: 10,
      }}>
        {eyebrow}
      </div>
      <h2 style={{ margin: 0, fontSize: "clamp(24px, 3vw, 34px)", fontWeight: 850, color: TEXT, lineHeight: 1.15 }}>
        {title}
      </h2>
    </div>
  );
}

function InfoCard({ children, accent = "purple" }: { children: string; accent?: "purple" | "gold" }) {
  const color = accent === "gold" ? GOLD_DIM : PURPLE;
  const border = accent === "gold" ? GOLD_FAINT : PURPLE_FAINT;
  const background = accent === "gold" ? "rgba(212,175,55,0.05)" : PURPLE_FAINTEST;

  return (
    <div style={{
      minHeight: 74,
      padding: "18px 18px",
      borderRadius: 8,
      border: `1px solid ${border}`,
      background,
      display: "flex",
      alignItems: "flex-start",
      gap: 12,
    }}>
      <span style={{
        width: 18,
        height: 18,
        borderRadius: 5,
        border: `1px solid ${border}`,
        color,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        fontSize: 12,
        fontWeight: 800,
        marginTop: 1,
      }}>
        -
      </span>
      <span style={{ fontSize: 14, lineHeight: 1.55, color: TEXT_MUTED }}>{children}</span>
    </div>
  );
}

const primaryButtonStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "12px 20px",
  borderRadius: 8,
  background: GOLD,
  color: "#111827",
  textDecoration: "none",
  fontWeight: 800,
  fontSize: 14,
  whiteSpace: "nowrap",
};

const secondaryButtonStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "12px 20px",
  borderRadius: 8,
  border: `1px solid ${PURPLE_FAINT}`,
  background: "rgba(139,92,246,0.08)",
  color: PURPLE,
  textDecoration: "none",
  fontWeight: 700,
  fontSize: 14,
  whiteSpace: "nowrap",
};
