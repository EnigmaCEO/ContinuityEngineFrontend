import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy — Sagitta Continuity Engine",
  description: "Privacy policy for Sagitta Continuity Engine. Zero-custody. Public-surface only.",
};

const BG = "#080a0e";
const TEXT = "#E2E8F0";
const TEXT_MUTED = "rgba(203,213,225,0.72)";
const TEXT_FAINT = "rgba(148,163,184,0.58)";
const PURPLE = "#8B5CF6";
const BORDER = "rgba(212,175,55,0.14)";

const SECTIONS = [
  {
    heading: "What We Collect",
    body: "SCE operates on public-surface data. We do not request, collect, or store private keys, seed phrases, wallet credentials, signing authority, or control over contracts, wallets, upgrades, or funds.\n\nWhen you submit a Defense Review request, request access, contact us, or otherwise communicate with us, we may collect the information you provide, such as your name, email address, organization, role, project name, website, documentation links, repository links, contract addresses, chain or network information, and any notes or evidence links you choose to include.\n\nIf you access the SCE portal, we may process basic account and session information needed to authenticate users, maintain access controls, and operate the service.",
  },
  {
    heading: "How We Use Your Information",
    body: "We use submitted information to respond to inquiries, evaluate access requests, scope and deliver Defense Reviews, operate the SCE portal, maintain service records, communicate with you, and improve the reliability and security of SCE.\n\nWe do not sell your personal information. We may share limited information with service providers that help us operate SCE, such as hosting, authentication, email, database, security, logging, or infrastructure providers. These providers are used only to support operation of the service.",
  },
  {
    heading: "Public-Surface Protocol Data",
    body: "Protocol surface data processed by SCE may include contract addresses, public on-chain activity, public roles, public authority metadata, public documentation, repository links, governance information, and other publicly accessible technical information.\n\nSCE does not require private or permissioned system access. If you voluntarily provide evidence links, notes, or documentation for a review, SCE uses that information only for the service or access request associated with it.",
  },
  {
    heading: "Reports and Review Outputs",
    body: "Defense Review outputs may include mapped assets, authority-risk findings, relevant threat families, recommended controls, evidence status, reviewer notes, and next actions. These outputs are prepared for the requesting organization or authorized operators. SCE does not publish client reports without permission.",
  },
  {
    heading: "Data Retention",
    body: "We retain request, account, and review-related information for as long as needed to provide services, maintain records, resolve disputes, comply with legal obligations, and improve operational continuity. You may request deletion of your personal information by contacting us at hello@sagitta.systems. Some information may be retained where required for legitimate business, security, compliance, or record-keeping purposes.",
  },
  {
    heading: "Cookies and Tracking",
    body: "SCE does not use advertising trackers or behavioral profiling. Basic cookies or similar technologies may be used to maintain authenticated portal sessions, protect accounts, remember preferences, and support service security. If analytics are added in the future, they will be limited to operational or product analytics and will not be used for advertising profiling.",
  },
  {
    heading: "Security",
    body: "Access to submitted data is restricted to authorized SCE operators and approved service providers as needed to operate the service. We apply reasonable technical and organizational safeguards to protect information in transit and at rest. No system is perfectly secure. If you believe a security issue exists, contact us immediately at hello@sagitta.systems.",
  },
  {
    heading: "Zero-Custody Boundary",
    body: "SCE does not custody assets, control wallets, execute transactions on behalf of clients, or request signing credentials. SCE reviews public metadata and operator-provided evidence to help identify authority risks, continuity gaps, recommended controls, and verification status.",
  },
  {
    heading: "Your Requests",
    body: "You may contact us to request access to, correction of, or deletion of personal information you have provided. We may need to verify your identity before completing a request.",
  },
  {
    heading: "Contact",
    body: "Questions about this policy or requests related to your data can be directed to hello@sagitta.systems.",
  },
];

export default function PrivacyPage() {
  return (
    <div style={{ background: BG, color: TEXT, minHeight: "100vh", fontFamily: "var(--font-geist-sans), Arial, sans-serif" }}>

      {/* Header */}
      <div style={{ padding: "64px max(40px, 5vw) 48px", borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", color: PURPLE, textTransform: "uppercase", marginBottom: 16 }}>
          Legal
        </div>
        <h1 style={{ margin: "0 0 12px", fontSize: "clamp(28px, 3.5vw, 48px)", fontWeight: 900, lineHeight: 1.08, letterSpacing: "-0.02em", color: TEXT }}>
          Privacy Policy
        </h1>
        <p style={{ margin: 0, fontSize: 13, color: TEXT_FAINT }}>
          Last updated: May 2026 &nbsp;·&nbsp; Sagitta Continuity Engine
        </p>
      </div>

      {/* Body */}
      <div style={{ maxWidth: 760, padding: "56px max(40px, 5vw) 80px" }}>
        <p style={{ margin: "0 0 48px", fontSize: 15, lineHeight: 1.78, color: TEXT_MUTED }}>
          Sagitta Continuity Engine (&ldquo;SCE,&rdquo; &ldquo;we,&rdquo; &ldquo;us&rdquo;) is a zero-custody, public-surface continuity intelligence service.
          We are committed to handling only the limited information needed to operate SCE, respond to requests, and deliver approved services.
          This policy explains what we collect, how we use it, and how it is protected.
        </p>

        {SECTIONS.map((section, i) => (
          <div key={section.heading} style={{ marginBottom: i < SECTIONS.length - 1 ? 40 : 0 }}>
            <h2 style={{ margin: "0 0 10px", fontSize: 17, fontWeight: 700, color: TEXT }}>{section.heading}</h2>
            {section.body.split("\n\n").map((para, j) => (
              <p key={j} style={{ margin: j < section.body.split("\n\n").length - 1 ? "0 0 12px" : "0", fontSize: 14, lineHeight: 1.78, color: TEXT_MUTED }}>{para}</p>
            ))}
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
          <Link href="/terms" style={{ color: TEXT_FAINT, textDecoration: "none" }}>Terms</Link>
          <Link href="/status" style={{ color: TEXT_FAINT, textDecoration: "none" }}>Status</Link>
        </div>
      </div>
    </div>
  );
}
