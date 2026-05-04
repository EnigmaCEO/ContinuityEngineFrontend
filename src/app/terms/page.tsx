import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service — Sagitta Continuity Engine",
  description: "Terms of service for Sagitta Continuity Engine. Zero-custody. Public-surface only.",
};

const BG = "#080a0e";
const TEXT = "#E2E8F0";
const TEXT_MUTED = "rgba(203,213,225,0.72)";
const TEXT_FAINT = "rgba(148,163,184,0.58)";
const PURPLE = "#8B5CF6";
const BORDER = "rgba(212,175,55,0.14)";

const SECTIONS = [
  {
    heading: "Scope of service",
    body: "Sagitta Continuity Engine provides public-surface continuity intelligence, authority-risk review, control recommendations, verification tracking, and Defense Review reports for Web3 protocols, DAOs, and related systems. All reviews are conducted using publicly accessible data and information explicitly provided by the client. SCE does not take custody of keys, funds, contracts, wallets, treasury assets, or protocol authority.",
  },
  {
    heading: "Zero-custody commitment",
    body: "SCE will never request private keys, seed phrases, signing credentials, multisig access, wallet control, contract ownership, upgrade authority, or any form of custody or control over protocol contracts, wallets, or treasury assets. Any communication claiming to represent SCE and requesting such access should be treated as fraudulent and reported immediately to hello@sagitta.systems.",
  },
  {
    heading: "Client responsibilities",
    body: "Clients are responsible for providing accurate, complete, and current information for review, including contract addresses, chain/network details, documentation links, repository links, governance information, admin/multisig/timelock evidence, and other relevant materials. Clients remain solely responsible for evaluating, implementing, and maintaining any controls, remediations, governance actions, or operational changes recommended by SCE.",
  },
  {
    heading: "Public-surface review only",
    body: "Defense Reviews are public-surface reviews unless a separate written agreement states otherwise. SCE reviews public metadata, public blockchain data, public documentation, and operator-provided evidence. SCE does not access private systems, private repositories, internal infrastructure, signing systems, wallets, or non-public operational environments unless separately agreed in writing.",
  },
  {
    heading: "No guarantee of completeness",
    body: "Defense Review reports are based on publicly available data and operator-provided evidence at the time of review. SCE does not warrant that any review is exhaustive or that it identifies all vulnerabilities, risks, misconfigurations, governance issues, authority paths, or continuity gaps present in a protocol. Reviews reflect a point-in-time assessment. Protocol state changes after delivery are not covered unless included in a new or continuing engagement.",
  },
  {
    heading: "Control verification and \"Defended\" status",
    body: "A control may be marked verified only when sufficient evidence has been provided or observed through public sources, as determined by SCE's review process. \"Defended\" status applies only to controls that have been verified against submitted evidence or publicly accessible data. It does not mean the protocol is immune from attack, free of risk, fully audited, or guaranteed safe. SCE may rely on the accuracy of client-provided evidence. If submitted evidence is inaccurate, incomplete, outdated, or misleading, related findings, controls, verification status, or reports may also be affected.",
  },
  {
    heading: "No emergency response guarantee",
    body: "Unless separately agreed in writing, SCE Defense Review services do not constitute 24/7 monitoring, managed security services, emergency incident response, exploit recovery, transaction execution, or operational control. SCE may help identify authority risks, continuity gaps, evidence requirements, recommended controls, and response considerations, but clients remain responsible for executing their own operational, governance, security, and legal responses.",
  },
  {
    heading: "No professional advice",
    body: "SCE reports and outputs are informational and operational in nature. They do not constitute legal, financial, investment, insurance, compliance, or formal security audit advice. Clients should consult qualified legal, financial, compliance, cybersecurity, smart contract audit, or other professional advisors before relying on SCE outputs for regulated, financial, or high-risk decisions.",
  },
  {
    heading: "Limitation of liability",
    body: "To the maximum extent permitted by law, SCE and Sagitta are not liable for losses, exploits, incidents, vulnerabilities, governance failures, smart contract failures, oracle failures, treasury losses, market losses, operational disruptions, or third-party actions that occur before, during, or after a review engagement. Use of SCE outputs does not transfer risk to SCE and does not establish any guarantee of protocol safety, continuity, solvency, or performance.",
  },
  {
    heading: "Permitted use",
    body: "Defense Review reports and SCE outputs may be used internally by the client for audit readiness, grant applications, investor diligence, partner diligence, operational planning, governance preparation, and control tracking. Redistribution, publication, quotation, or public use of SCE reports, screenshots, findings, ratings, marks, or branding requires prior written approval from Sagitta unless expressly permitted in the engagement terms.",
  },
  {
    heading: "Confidentiality of reports",
    body: "SCE will not intentionally publish client Defense Review reports without permission. Clients are responsible for controlling distribution of reports once delivered to them. Public protocol data may still appear in SCE's general public-surface intelligence systems, case library, threat-family mapping, or research outputs, provided client-specific private communications or non-public submitted materials are not disclosed without permission.",
  },
  {
    heading: "Fees and engagement terms",
    body: "Fees, scope, delivery timelines, covered assets, and review limits are determined by the applicable proposal, invoice, written agreement, or service description. The Starter Defense Review covers up to 5 public contracts or assets unless otherwise agreed. Larger protocols, multi-chain systems, evidence-heavy reviews, or follow-up verification work may require custom scope and pricing.",
  },
  {
    heading: "Changes to terms",
    body: "These terms may be updated from time to time. Continued use of SCE services after an update constitutes acceptance of the revised terms. Questions about these terms can be directed to hello@sagitta.systems.",
  },
];

export default function TermsPage() {
  return (
    <div style={{ background: BG, color: TEXT, minHeight: "100vh", fontFamily: "var(--font-geist-sans), Arial, sans-serif" }}>

      {/* Header */}
      <div style={{ padding: "64px max(40px, 5vw) 48px", borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", color: PURPLE, textTransform: "uppercase", marginBottom: 16 }}>
          Legal
        </div>
        <h1 style={{ margin: "0 0 12px", fontSize: "clamp(28px, 3.5vw, 48px)", fontWeight: 900, lineHeight: 1.08, letterSpacing: "-0.02em", color: TEXT }}>
          Terms of Service
        </h1>
        <p style={{ margin: 0, fontSize: 13, color: TEXT_FAINT }}>
          Last updated: May 2026 &nbsp;·&nbsp; Sagitta Continuity Engine
        </p>
      </div>

      {/* Body */}
      <div style={{ maxWidth: 760, padding: "56px max(40px, 5vw) 80px" }}>
        <p style={{ margin: "0 0 48px", fontSize: 15, lineHeight: 1.78, color: TEXT_MUTED }}>
          By requesting a Defense Review, accessing the SCE portal, or engaging with Sagitta Continuity Engine
          in any capacity, you agree to the following terms. Please read them carefully.
        </p>

        {SECTIONS.map((section, i) => (
          <div key={section.heading} style={{ marginBottom: i < SECTIONS.length - 1 ? 40 : 0 }}>
            <h2 style={{ margin: "0 0 10px", fontSize: 17, fontWeight: 700, color: TEXT }}>{section.heading}</h2>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.78, color: TEXT_MUTED }}>{section.body}</p>
          </div>
        ))}
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
          <Link href="/status" style={{ color: TEXT_FAINT, textDecoration: "none" }}>Status</Link>
        </div>
      </div>
    </div>
  );
}
