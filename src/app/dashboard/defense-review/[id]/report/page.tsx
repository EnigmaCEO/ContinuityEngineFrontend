"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { fetchDefenseReview, updateDefenseReview } from "@/lib/defense-review/service";
import type { DefenseReview, DefenseReviewStatus } from "@/lib/defense-review/types";
import {
  fetchAdminSurfaceFindings,
  fetchProject,
  fetchProjectAssets,
  fetchProjectControls,
  fetchProjectRelevance,
} from "@/lib/project-map/service";
import type {
  AdminSurfaceFinding,
  AdminFindingSeverity,
  AdminFindingType,
  Project,
  ProjectAsset,
  ProjectControl,
  ProjectControlStatus,
  ProjectRelevance,
} from "@/lib/project-map/types";

// ─── Palette ────────────────────────────────────────────────────────────────
const GOLD = "#D4AF37";
const TEXT = "#E2E8F0";
const MUTED = "rgba(148,163,184,0.78)";
const SUBTLE = "rgba(148,163,184,0.45)";
const SEP = "rgba(212,175,55,0.15)";

// ─── Lookup maps ────────────────────────────────────────────────────────────
const SEV_COLOR: Record<AdminFindingSeverity, string> = {
  critical: "#EF4444",
  high: "#F97316",
  medium: "#EAB308",
  low: "#22C55E",
};

const FINDING_TYPE_LABEL: Record<AdminFindingType, string> = {
  owner_eoa: "Owner is EOA",
  proxy_admin: "Proxy Admin",
  upgrade_authority: "Upgrade Authority",
  treasury_authority: "Treasury Authority",
  mint_authority: "Mint Authority",
  pause_authority: "Pause Authority",
  role_concentration: "Role Concentration",
  missing_timelock: "Missing Timelock",
  unknown_admin: "Unknown Admin",
  multisig_detected: "Multisig Detected",
  timelock_detected: "Timelock Detected",
  // Treasury role probes
  treasury_movement_authority: "Treasury Movement Authority",
  treasury_allocation_authority: "Treasury Allocation Authority",
  treasury_emergency_freeze: "Treasury Emergency Freeze",
  treasury_role_concentration: "Treasury Role Concentration",
  treasury_timelock_required: "Treasury Timelock Required",
  // Vault role probes
  vault_deposit_withdrawal_authority: "Vault Deposit/Withdrawal Authority",
  vault_lock_parameter_authority: "Vault Lock Parameter Authority",
  vault_pause_authority: "Vault Pause Authority",
  vault_upgrade_authority: "Vault Upgrade Authority",
  vault_timelock_required: "Vault Timelock Required",
  // Escrow role probes
  escrow_settlement_authority: "Escrow Settlement Authority",
  escrow_batch_finalization: "Escrow Batch Finalization",
  escrow_fund_routing: "Escrow Fund Routing",
  escrow_keeper_dependency: "Escrow Keeper Dependency",
  escrow_role_concentration: "Escrow Role Concentration",
  // Reserve role probes
  reserve_custody_authority: "Reserve Custody Authority",
  reserve_rebalance_authority: "Reserve Rebalance Authority",
  reserve_insurance_parameter: "Reserve Insurance Parameter",
  reserve_role_concentration: "Reserve Role Concentration",
  // Oracle role probes
  oracle_price_feed_authority: "Oracle Price Feed Authority",
  oracle_stale_price_risk: "Oracle Stale Price Risk",
  oracle_fallback_authority: "Oracle Fallback Authority",
  oracle_update_authority: "Oracle Update Authority",
  oracle_manipulation_risk: "Oracle Manipulation Risk",
  // Keeper role probes
  keeper_trigger_authority: "Keeper Trigger Authority",
  keeper_execution_authority: "Keeper Execution Authority",
  keeper_failure_behavior: "Keeper Failure Behavior",
  keeper_continuity_risk: "Keeper Continuity Risk",
};

const CONTROL_STATUS_LABEL: Record<ProjectControlStatus, string> = {
  missing: "Missing",
  planned: "Planned",
  implemented: "Implemented",
  verified: "Verified",
  not_applicable: "N/A",
};

const CONTROL_STATUS_COLOR: Record<ProjectControlStatus, string> = {
  missing: "#EF4444",
  planned: "#F97316",
  implemented: "#3B82F6",
  verified: "#22C55E",
  not_applicable: SUBTLE,
};

const REVIEW_STATUS_LABEL: Record<DefenseReviewStatus, string> = {
  draft: "Draft",
  in_review: "In Review",
  report_ready: "Report Ready",
  delivered: "Delivered",
  closed: "Closed",
};

const REPORT_STATUS_LABEL: Record<string, string> = {
  not_generated: "Not Generated",
  draft: "Draft",
  ready: "Ready",
};

// ─── Finding evidence / remediation helpers ──────────────────────────────────
function _reportEvidenceRequired(finding: AdminSurfaceFinding): string[] {
  const ev = finding.evidence as Record<string, unknown>;
  if (Array.isArray(ev.evidenceRequired) && (ev.evidenceRequired as unknown[]).length > 0) {
    return ev.evidenceRequired as string[];
  }
  const act = finding.recommendedActions[0] ?? "";
  const prefix = "Evidence required: ";
  if (act.startsWith(prefix)) {
    return act.slice(prefix.length).replace(/\.$/, "").split(", ").filter(Boolean);
  }
  return [];
}

function _reportRemediation(finding: AdminSurfaceFinding): string {
  for (const act of finding.recommendedActions) {
    if (act.startsWith("Recommended remediation: ")) return act.slice("Recommended remediation: ".length);
    if (act.startsWith("Remediation: ")) return act.slice("Remediation: ".length);
  }
  return "";
}

// ─── Helpers ────────────────────────────────────────────────────────────────
function fmtDate(v?: string | null): string {
  if (!v) return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
}

function buildNextActions(
  findings: AdminSurfaceFinding[],
  controls: ProjectControl[],
): string[] {
  const actions: string[] = [];
  const crit = findings.filter((f) => f.severity === "critical");
  const high = findings.filter((f) => f.severity === "high");
  const missing = controls.filter((c) => c.status === "missing");
  const planned = controls.filter((c) => c.status === "planned");
  const unverified = controls.filter(
    (c) => c.status !== "verified" && c.status !== "not_applicable",
  );
  const verified = controls.filter((c) => c.status === "verified");

  if (crit.length > 0)
    actions.push(
      `Address ${crit.length} critical authority finding${crit.length > 1 ? "s" : ""} before deployment or continued operation.`,
    );
  if (high.length > 0)
    actions.push(
      `Review and remediate ${high.length} high-severity finding${high.length > 1 ? "s" : ""}.`,
    );
  if (controls.length === 0 && findings.length > 0)
    actions.push("Generate recommended controls from identified authority findings.");
  if (missing.length > 0)
    actions.push(
      `Implement ${missing.length} control${missing.length > 1 ? "s" : ""} currently marked as Missing.`,
    );
  if (planned.length > 0)
    actions.push(
      `Complete ${planned.length} planned control${planned.length > 1 ? "s" : ""} to progress toward verified coverage.`,
    );
  if (unverified.length > 0 && verified.length > 0)
    actions.push(
      `Verify ${unverified.length} remaining control${unverified.length > 1 ? "s" : ""} to strengthen coverage.`,
    );

  const hasTimelockIssue = findings.some((f) => f.findingType === "missing_timelock");
  if (hasTimelockIssue)
    actions.push(
      "Implement upgrade timelocks to provide a governance review window before upgrades take effect.",
    );

  const hasOwnerEOA = findings.some((f) => f.findingType === "owner_eoa");
  if (hasOwnerEOA)
    actions.push(
      "Transition owner accounts from externally-owned accounts (EOA) to a multisig or timelocked governance structure.",
    );

  const hasRoleConc = findings.some((f) => f.findingType === "role_concentration");
  if (hasRoleConc)
    actions.push(
      "Distribute concentrated admin roles across separate key holders or governance contracts.",
    );

  if (actions.length === 0 && verified.length > 0) {
    actions.push(
      "Maintain and periodically re-verify existing controls as the project evolves.",
    );
    actions.push(
      "Re-run the Admin Surface Scan after protocol upgrades, ownership changes, or dependency updates.",
    );
  }

  if (actions.length === 0) {
    actions.push(
      "Complete project configuration by adding public assets and running the Admin Surface Scan.",
    );
    actions.push("Generate controls after findings are available.");
  }

  return actions;
}

// ─── Sub-components ──────────────────────────────────────────────────────────
function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h2
      style={{
        margin: "0 0 16px 0",
        fontSize: 15,
        fontWeight: 700,
        letterSpacing: "0.06em",
        color: TEXT,
        paddingBottom: 8,
        borderBottom: `1px solid ${SEP}`,
        textTransform: "uppercase",
      }}
    >
      {children}
    </h2>
  );
}

function StatGrid({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
        gap: 12,
        marginBottom: 16,
      }}
    >
      {children}
    </div>
  );
}

function Stat({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color?: string;
}) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.03)",
        border: `1px solid ${SEP}`,
        borderRadius: 6,
        padding: "10px 14px",
      }}
    >
      <div style={{ fontSize: 10, color: SUBTLE, letterSpacing: "0.1em", marginBottom: 4 }}>
        {label.toUpperCase()}
      </div>
      <div style={{ fontSize: 24, fontWeight: 800, color: color ?? TEXT, lineHeight: 1 }}>
        {value}
      </div>
    </div>
  );
}

function Pill({
  label,
  color,
  bg,
}: {
  label: string;
  color: string;
  bg?: string;
}) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 8px",
        borderRadius: 3,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "0.08em",
        color,
        background: bg ?? `${color}22`,
        border: `1px solid ${color}44`,
      }}
    >
      {label.toUpperCase()}
    </span>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div
      style={{
        padding: "16px 0",
        color: SUBTLE,
        fontSize: 13,
        fontStyle: "italic",
      }}
    >
      {text}
    </div>
  );
}

function ReportSection({
  id,
  children,
}: {
  id?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      style={{
        marginBottom: 36,
        pageBreakInside: "avoid",
      }}
    >
      {children}
    </section>
  );
}

// ─── Report status action bar ────────────────────────────────────────────────
function ReportStatusBar({
  review,
  onUpdate,
  saving,
}: {
  review: DefenseReview;
  onUpdate: (reportStatus: string) => void;
  saving: boolean;
}) {
  const rs = review.reportStatus;
  const label = REPORT_STATUS_LABEL[rs] ?? rs;
  const labelColor =
    rs === "ready" ? "#22C55E" : rs === "draft" ? GOLD : SUBTLE;

  return (
    <div
      className="no-print"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "8px 12px",
        background: "rgba(212,175,55,0.06)",
        border: `1px solid ${SEP}`,
        borderRadius: 6,
        marginBottom: 24,
        flexWrap: "wrap",
      }}
    >
      <span style={{ fontSize: 11, color: MUTED }}>Report Status:</span>
      <span
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: labelColor,
          letterSpacing: "0.06em",
        }}
      >
        {label.toUpperCase()}
      </span>
      <div style={{ flex: 1 }} />
      {rs !== "draft" && (
        <ActionBtn
          onClick={() => onUpdate("draft")}
          disabled={saving}
          label="Mark Draft"
        />
      )}
      {rs !== "ready" && (
        <ActionBtn
          onClick={() => onUpdate("ready")}
          disabled={saving}
          label="Mark Ready"
          primary
        />
      )}
    </div>
  );
}

function ActionBtn({
  onClick,
  disabled,
  label,
  primary,
}: {
  onClick: () => void;
  disabled: boolean;
  label: string;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        background: disabled ? "rgba(148,163,184,0.1)" : primary ? GOLD : "transparent",
        color: disabled ? SUBTLE : primary ? "#0a0c12" : GOLD,
        border: primary ? "none" : `1px solid ${GOLD}55`,
        borderRadius: 4,
        padding: "4px 12px",
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "0.04em",
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      {label}
    </button>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────
export default function DefenseReviewReportPage() {
  const params = useParams();
  const reviewId = typeof params.id === "string" ? params.id : "";

  const [review, setReview] = useState<DefenseReview | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [assets, setAssets] = useState<ProjectAsset[]>([]);
  const [findings, setFindings] = useState<AdminSurfaceFinding[]>([]);
  const [relevance, setRelevance] = useState<ProjectRelevance | null>(null);
  const [controls, setControls] = useState<ProjectControl[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!reviewId) return;
    setLoading(true);
    fetchDefenseReview(reviewId)
      .then(async (rev) => {
        setReview(rev);
        const pid = rev.projectId;
        const [proj, ast, fnd, ctrl] = await Promise.all([
          fetchProject(pid).catch(() => null),
          fetchProjectAssets(pid).catch(() => []),
          fetchAdminSurfaceFindings(pid).catch(() => []),
          fetchProjectControls(pid).catch(() => []),
        ]);
        setProject(proj);
        setAssets(ast);
        setFindings(fnd);
        setControls(ctrl);
        fetchProjectRelevance(pid)
          .then(setRelevance)
          .catch(() => setRelevance(null));
      })
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : "Failed to load review"),
      )
      .finally(() => setLoading(false));
  }, [reviewId]);

  async function handleReportStatus(rs: string) {
    if (!review) return;
    setSaving(true);
    setStatusMsg("");
    try {
      const updated = await updateDefenseReview(review.id, { reportStatus: rs });
      setReview(updated);
      setStatusMsg(`Report marked as ${REPORT_STATUS_LABEL[rs] ?? rs}.`);
    } catch {
      setStatusMsg("Failed to update report status.");
    } finally {
      setSaving(false);
    }
  }

  // ── Derived ────────────────────────────────────────────────────────────────
  const openFindings = findings.filter((f) => f.status === "open");
  const criticalCount = openFindings.filter((f) => f.severity === "critical").length;
  const highCount = openFindings.filter((f) => f.severity === "high").length;
  const verifiedControls = controls.filter((c) => c.status === "verified");
  const controlCoverage =
    controls.length > 0 ? Math.round((verifiedControls.length / controls.length) * 100) : 0;
  const isDefended = verifiedControls.length > 0 && controls.length > 0 && controlCoverage === 100;

  const contractAssets = assets.filter(
    (a) => (a.assetType === "contract" || a.assetType === "proxy") && a.status !== "archived",
  );
  const frontendAssets = assets.filter(
    (a) => a.assetType === "frontend" && a.status !== "archived",
  );
  const websiteUrl: string | undefined = (() => {
    const v =
      contractAssets[0]?.metadata?.websiteUrl ??
      assets.find((a) => a.metadata?.websiteUrl)?.metadata?.websiteUrl;
    return typeof v === "string" ? v : undefined;
  })();
  const docsUrl: string | undefined = (() => {
    const v = assets.find((a) => a.metadata?.docsUrl)?.metadata?.docsUrl;
    return typeof v === "string" ? v : undefined;
  })();
  const repoUrl: string | undefined = (() => {
    const v = assets.find((a) => a.metadata?.repoUrl)?.metadata?.repoUrl;
    return typeof v === "string" ? v : undefined;
  })();

  const nextActions = buildNextActions(openFindings, controls);

  const findingsBySeverity = (["critical", "high", "medium", "low"] as AdminFindingSeverity[])
    .map((sev) => ({
      sev,
      items: openFindings.filter((f) => f.severity === sev),
    }))
    .filter((g) => g.items.length > 0);

  const controlsByStatus = (
    ["missing", "planned", "implemented", "verified"] as ProjectControlStatus[]
  )
    .map((st) => ({
      st,
      items: controls.filter((c) => c.status === st),
    }))
    .filter((g) => g.items.length > 0);

  // ── Render states ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ padding: "40px 24px", color: MUTED, fontSize: 13 }}>
        Loading report…
      </div>
    );
  }

  if (!review) {
    return (
      <div style={{ padding: "40px 24px" }}>
        <div
          style={{
            color: "#FCA5A5",
            fontSize: 13,
            marginBottom: 12,
          }}
        >
          {error || "Defense Review not found."}
        </div>
        <Link
          href="/dashboard/defense-review"
          style={{ color: GOLD, fontSize: 12 }}
        >
          ← All Reviews
        </Link>
      </div>
    );
  }

  // ── Full report ────────────────────────────────────────────────────────────
  return (
    <>
      {/* Print styles — scoped to this page */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: #0a0c12 !important; }
          .report-root { padding: 0 !important; }
          .report-container { box-shadow: none !important; }
        }
        @page { margin: 24mm 18mm; }
      `}</style>

      <div
        className="report-root"
        style={{ padding: "24px 20px 48px", background: "#0a0c12", minHeight: "100vh" }}
      >
        {/* ── Top nav bar (no-print) ─────────────────────────────────── */}
        <nav
          className="no-print"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 20,
            flexWrap: "wrap",
          }}
        >
          <NavChip href={`/dashboard/defense-review/${review.id}`} label="← Defense Review" />
          <NavChip href="/dashboard/project-map" label="Project Map" />
          <NavChip href="/dashboard/project-map" label="View Controls" />
          <NavChip href="/dashboard/threat-matrix" label="Relevant Threats" />
          <div style={{ flex: 1 }} />
          <button
            type="button"
            onClick={() => window.print()}
            style={{
              background: "transparent",
              border: `1px solid ${GOLD}44`,
              borderRadius: 4,
              color: GOLD,
              fontSize: 11,
              padding: "4px 12px",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Print / Save PDF
          </button>
        </nav>

        <div
          className="report-container"
          ref={printRef}
          style={{
            maxWidth: 880,
            margin: "0 auto",
          }}
        >
          {/* ── Report status action bar ───────────────────────────────── */}
          {statusMsg && (
            <div
              className="no-print"
              style={{
                marginBottom: 12,
                fontSize: 12,
                color: "#86EFAC",
                padding: "6px 12px",
                background: "rgba(34,197,94,0.08)",
                border: "1px solid rgba(34,197,94,0.2)",
                borderRadius: 5,
              }}
            >
              {statusMsg}
            </div>
          )}
          <ReportStatusBar
            review={review}
            onUpdate={handleReportStatus}
            saving={saving}
          />

          {/* ═══════════════════════════════════════════════════════════ */}
          {/* REPORT HEADER                                               */}
          {/* ═══════════════════════════════════════════════════════════ */}
          <ReportSection id="report-header">
            <div
              style={{
                borderBottom: `2px solid ${SEP}`,
                paddingBottom: 20,
                marginBottom: 20,
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  letterSpacing: "0.2em",
                  color: `${GOLD}99`,
                  marginBottom: 8,
                }}
              >
                SCE — PUBLIC-SURFACE REVIEW REPORT
              </div>
              <h1
                style={{
                  margin: "0 0 10px 0",
                  fontSize: 28,
                  fontWeight: 800,
                  color: TEXT,
                  lineHeight: 1.2,
                }}
              >
                {review.projectName}
              </h1>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: "6px 24px",
                  fontSize: 12,
                  color: MUTED,
                }}
              >
                <MetaRow label="Review ID" value={review.id} />
                <MetaRow
                  label="Review Status"
                  value={REVIEW_STATUS_LABEL[review.status]}
                />
                <MetaRow label="Created" value={fmtDate(review.createdAt)} />
                <MetaRow label="Last Updated" value={fmtDate(review.updatedAt)} />
                <MetaRow
                  label="Report Status"
                  value={REPORT_STATUS_LABEL[review.reportStatus] ?? review.reportStatus}
                  highlight={review.reportStatus === "ready"}
                />
                {project?.environment && (
                  <MetaRow label="Environment" value={project.environment} />
                )}
              </div>
            </div>
          </ReportSection>

          {/* ═══════════════════════════════════════════════════════════ */}
          {/* EXECUTIVE SUMMARY                                           */}
          {/* ═══════════════════════════════════════════════════════════ */}
          <ReportSection id="executive-summary">
            <SectionHeader>Executive Summary</SectionHeader>
            <p
              style={{
                fontSize: 14,
                color: TEXT,
                lineHeight: 1.7,
                margin: "0 0 20px 0",
              }}
            >
              This report reflects a public-surface review of{" "}
              <strong style={{ color: GOLD }}>{review.projectName}</strong> conducted by
              SCE. The analysis covers mapped public assets, authority risk findings derived
              from the Admin Surface Scanner, relevant global threat families, and recommended
              controls. SCE does not control this project, hold keys, or execute on-chain
              transactions.
            </p>

            <StatGrid>
              <Stat label="Assets Mapped" value={review.assetsCount} />
              <Stat
                label="Open Findings"
                value={openFindings.length || review.findingsCount}
              />
              <Stat
                label="Critical / High"
                value={`${criticalCount} / ${highCount}`}
                color={criticalCount > 0 ? "#EF4444" : TEXT}
              />
              <Stat
                label="Threat Families"
                value={
                  relevance
                    ? relevance.relevantThreatFamilies.length
                    : review.relevantThreatFamiliesCount
                }
              />
              <Stat label="Controls" value={review.controlsCount} />
              <Stat
                label="Verified"
                value={`${verifiedControls.length} / ${review.controlsCount}`}
                color={verifiedControls.length > 0 ? "#22C55E" : TEXT}
              />
            </StatGrid>

            {isDefended ? (
              <div
                style={{
                  padding: "10px 14px",
                  background: "rgba(34,197,94,0.06)",
                  border: "1px solid rgba(34,197,94,0.2)",
                  borderRadius: 6,
                  fontSize: 13,
                  color: "#86EFAC",
                }}
              >
                All generated controls are verified for current project metadata. Coverage: 100%.
              </div>
            ) : (
              <div
                style={{
                  padding: "10px 14px",
                  background: "rgba(212,175,55,0.05)",
                  border: `1px solid ${SEP}`,
                  borderRadius: 6,
                  fontSize: 13,
                  color: MUTED,
                }}
              >
                Control verification is{" "}
                <strong style={{ color: TEXT }}>{controlCoverage}%</strong> complete.
                {" "}
                {!isDefended &&
                  '"Defended" status applies only when controls are verified against current project metadata.'}
              </div>
            )}
          </ReportSection>

          {/* ═══════════════════════════════════════════════════════════ */}
          {/* REVIEW SCOPE                                                */}
          {/* ═══════════════════════════════════════════════════════════ */}
          <ReportSection id="review-scope">
            <SectionHeader>Review Scope</SectionHeader>

            <div
              style={{
                padding: "12px 16px",
                background: "rgba(212,175,55,0.04)",
                border: `1px solid ${SEP}`,
                borderRadius: 6,
                marginBottom: 16,
                fontSize: 13,
                color: MUTED,
                lineHeight: 1.6,
              }}
            >
              This is a zero-custody public-surface review. SCE analyzes only publicly
              available metadata: contract addresses, deployment chains, admin surface
              indicators, and documented protocol configurations. No private keys, signing
              credentials, mnemonics, or seed phrases are requested or stored at any point.
            </div>

            {project?.description && (
              <p style={{ fontSize: 13, color: MUTED, marginBottom: 12, lineHeight: 1.6 }}>
                {project.description}
              </p>
            )}

            {contractAssets.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <div
                  style={{
                    fontSize: 11,
                    color: SUBTLE,
                    letterSpacing: "0.08em",
                    marginBottom: 6,
                  }}
                >
                  MAPPED CONTRACTS / PROXIES
                </div>
                {contractAssets.map((a) => (
                  <div
                    key={a.id}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 10,
                      padding: "6px 0",
                      borderBottom: `1px solid ${SEP}`,
                      fontSize: 13,
                    }}
                  >
                    <Pill
                      label={a.assetType}
                      color={GOLD}
                    />
                    <div>
                      <span style={{ color: TEXT, fontWeight: 600 }}>{a.name}</span>
                      {a.address && (
                        <span style={{ color: MUTED, marginLeft: 8, fontFamily: "monospace", fontSize: 12 }}>
                          {a.address}
                        </span>
                      )}
                      {a.chain && (
                        <span style={{ color: SUBTLE, marginLeft: 8, fontSize: 11 }}>
                          {a.chain}
                          {a.network ? ` / ${a.network}` : ""}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {frontendAssets.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <div
                  style={{
                    fontSize: 11,
                    color: SUBTLE,
                    letterSpacing: "0.08em",
                    marginBottom: 6,
                  }}
                >
                  FRONTEND / INTERFACE
                </div>
                {frontendAssets.map((a) => (
                  <div key={a.id} style={{ fontSize: 13, color: MUTED, padding: "4px 0" }}>
                    <span style={{ color: TEXT }}>{a.name}</span>
                    {a.url && (
                      <span style={{ marginLeft: 8, color: SUBTLE, fontFamily: "monospace", fontSize: 12 }}>
                        {a.url}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {(websiteUrl || docsUrl || repoUrl) && (
              <div
                style={{
                  display: "flex",
                  gap: 16,
                  flexWrap: "wrap",
                  marginTop: 8,
                  fontSize: 12,
                }}
              >
                {websiteUrl && (
                  <span style={{ color: MUTED }}>
                    Website:{" "}
                    <span style={{ color: TEXT, fontFamily: "monospace" }}>
                      {websiteUrl}
                    </span>
                  </span>
                )}
                {docsUrl && (
                  <span style={{ color: MUTED }}>
                    Docs:{" "}
                    <span style={{ color: TEXT, fontFamily: "monospace" }}>
                      {docsUrl}
                    </span>
                  </span>
                )}
                {repoUrl && (
                  <span style={{ color: MUTED }}>
                    Repo:{" "}
                    <span style={{ color: TEXT, fontFamily: "monospace" }}>
                      {repoUrl}
                    </span>
                  </span>
                )}
              </div>
            )}

            {contractAssets.length === 0 && frontendAssets.length === 0 && (
              <EmptyState text="No mapped public assets. Add contract or frontend assets in the Project Map to populate scope." />
            )}
          </ReportSection>

          {/* ═══════════════════════════════════════════════════════════ */}
          {/* AUTHORITY FINDINGS                                          */}
          {/* ═══════════════════════════════════════════════════════════ */}
          <ReportSection id="authority-findings">
            <SectionHeader>Authority Risk Findings</SectionHeader>

            {findingsBySeverity.length === 0 ? (
              <EmptyState text="No open authority risk findings recorded. Run the Admin Surface Scan to identify findings." />
            ) : (
              <div style={{ display: "grid", gap: 6 }}>
                {findingsBySeverity.map(({ sev, items }) => (
                  <div key={sev}>
                    <div
                      style={{
                        fontSize: 10,
                        letterSpacing: "0.12em",
                        color: SEV_COLOR[sev],
                        fontWeight: 700,
                        marginBottom: 6,
                        marginTop: 4,
                      }}
                    >
                      {sev.toUpperCase()} ({items.length})
                    </div>
                    {items.map((f) => (
                      <FindingRow key={f.id} finding={f} />
                    ))}
                  </div>
                ))}
              </div>
            )}
          </ReportSection>

          {/* ═══════════════════════════════════════════════════════════ */}
          {/* RELEVANT THREAT FAMILIES                                   */}
          {/* ═══════════════════════════════════════════════════════════ */}
          <ReportSection id="threat-families">
            <SectionHeader>Relevant Threat Families</SectionHeader>

            {!relevance || relevance.relevantThreatFamilies.length === 0 ? (
              <EmptyState text="No relevant threat families mapped yet. Run the Admin Surface Scan and ensure findings are present to generate threat relevance." />
            ) : (
              <div style={{ display: "grid", gap: 10 }}>
                {relevance.relevantThreatFamilies.map((tf) => (
                  <div
                    key={tf.threatFamily}
                    style={{
                      padding: "12px 14px",
                      background: "rgba(255,255,255,0.02)",
                      border: `1px solid ${SEP}`,
                      borderRadius: 6,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        gap: 10,
                        marginBottom: 6,
                      }}
                    >
                      <span style={{ fontSize: 14, fontWeight: 700, color: TEXT }}>
                        {tf.threatFamily}
                      </span>
                      <span style={{ fontSize: 11, color: SUBTLE, whiteSpace: "nowrap" }}>
                        Relevance {tf.relevanceScore}
                      </span>
                    </div>
                    {tf.whyItMatters && (
                      <p style={{ fontSize: 13, color: MUTED, margin: "0 0 8px 0", lineHeight: 1.6 }}>
                        {tf.whyItMatters}
                      </p>
                    )}
                    <div
                      style={{
                        display: "flex",
                        gap: 16,
                        fontSize: 11,
                        color: SUBTLE,
                        flexWrap: "wrap",
                      }}
                    >
                      <span>Global cases: <strong style={{ color: TEXT }}>{tf.globalCaseCount}</strong></span>
                      <span>Critical: <strong style={{ color: tf.criticalCount > 0 ? "#EF4444" : TEXT }}>{tf.criticalCount}</strong></span>
                      <span>Replay validated: <strong style={{ color: TEXT }}>{tf.replayValidatedCount}</strong></span>
                    </div>
                    {tf.topRecommendedActions.length > 0 && (
                      <div style={{ marginTop: 8 }}>
                        <div style={{ fontSize: 10, color: SUBTLE, letterSpacing: "0.08em", marginBottom: 4 }}>
                          RECOMMENDED ACTIONS
                        </div>
                        <ul style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 3 }}>
                          {tf.topRecommendedActions.slice(0, 3).map((action, i) => (
                            <li key={i} style={{ fontSize: 12, color: MUTED, lineHeight: 1.5 }}>
                              {action}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </ReportSection>

          {/* ═══════════════════════════════════════════════════════════ */}
          {/* RECOMMENDED CONTROLS                                        */}
          {/* ═══════════════════════════════════════════════════════════ */}
          <ReportSection id="recommended-controls">
            <SectionHeader>Recommended Controls</SectionHeader>

            {controls.length === 0 ? (
              <EmptyState text="No controls generated. Generate controls from authority findings in the Project Map Controls tab." />
            ) : (
              <div style={{ display: "grid", gap: 6 }}>
                {controlsByStatus.map(({ st, items }) => (
                  <div key={st}>
                    <div
                      style={{
                        fontSize: 10,
                        letterSpacing: "0.1em",
                        color: CONTROL_STATUS_COLOR[st],
                        fontWeight: 700,
                        marginBottom: 6,
                        marginTop: 4,
                      }}
                    >
                      {CONTROL_STATUS_LABEL[st].toUpperCase()} ({items.length})
                    </div>
                    {items.map((c) => (
                      <ControlRow key={c.id} control={c} />
                    ))}
                  </div>
                ))}
                {controls.filter((c) => c.status === "not_applicable").length > 0 && (
                  <div style={{ fontSize: 11, color: SUBTLE, marginTop: 4 }}>
                    {controls.filter((c) => c.status === "not_applicable").length} control(s) marked Not Applicable
                  </div>
                )}
              </div>
            )}
          </ReportSection>

          {/* ═══════════════════════════════════════════════════════════ */}
          {/* VERIFICATION STATUS                                         */}
          {/* ═══════════════════════════════════════════════════════════ */}
          <ReportSection id="verification-status">
            <SectionHeader>Verification Status</SectionHeader>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                gap: 12,
                marginBottom: 16,
              }}
            >
              <Stat label="Controls Total" value={controls.length} />
              <Stat
                label="Verified"
                value={verifiedControls.length}
                color={verifiedControls.length > 0 ? "#22C55E" : TEXT}
              />
              <Stat
                label="Coverage"
                value={`${controlCoverage}%`}
                color={controlCoverage === 100 ? "#22C55E" : controlCoverage > 50 ? GOLD : TEXT}
              />
            </div>

            <div
              style={{
                padding: "12px 16px",
                background: isDefended
                  ? "rgba(34,197,94,0.06)"
                  : "rgba(212,175,55,0.04)",
                border: `1px solid ${isDefended ? "rgba(34,197,94,0.2)" : SEP}`,
                borderRadius: 6,
                fontSize: 13,
                color: isDefended ? "#86EFAC" : MUTED,
                lineHeight: 1.6,
              }}
            >
              {isDefended ? (
                <>
                  All generated controls are verified for current project metadata. This project
                  meets the SCE <em>Defended</em> threshold for the mapped surface.
                </>
              ) : controls.length === 0 ? (
                <>
                  Controls have not been generated yet.{" "}
                  <strong style={{ color: TEXT }}>
                    "Defended" status applies only after controls are generated and verified.
                  </strong>
                </>
              ) : (
                <>
                  {verifiedControls.length} of {controls.length} controls verified ({controlCoverage}% coverage).{" "}
                  <strong style={{ color: TEXT }}>
                    "Defended" status applies only when all controls are verified against current
                    project metadata and evidence.
                  </strong>
                </>
              )}
            </div>
          </ReportSection>

          {/* ═══════════════════════════════════════════════════════════ */}
          {/* NEXT ACTIONS                                                */}
          {/* ═══════════════════════════════════════════════════════════ */}
          <ReportSection id="next-actions">
            <SectionHeader>Next Actions</SectionHeader>
            <ol
              style={{
                margin: 0,
                paddingLeft: 20,
                display: "grid",
                gap: 10,
              }}
            >
              {nextActions.map((action, i) => (
                <li key={i} style={{ fontSize: 13, color: TEXT, lineHeight: 1.7 }}>
                  {action}
                </li>
              ))}
            </ol>
          </ReportSection>

          {/* ── Footer ──────────────────────────────────────────────── */}
          <div
            style={{
              borderTop: `1px solid ${SEP}`,
              paddingTop: 16,
              fontSize: 11,
              color: SUBTLE,
              display: "grid",
              gridTemplateColumns: "1fr auto",
              gap: 8,
            }}
          >
            <span>
              SCE Public-Surface Review — {review.projectName} — {fmtDate(review.updatedAt)}
            </span>
            <span>
              Report: {REPORT_STATUS_LABEL[review.reportStatus] ?? review.reportStatus}
            </span>
          </div>

          {/* ── Bottom nav (no-print) ─────────────────────────────── */}
          <div
            className="no-print"
            style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 24 }}
          >
            <NavChip href={`/dashboard/defense-review/${review.id}`} label="← Defense Review" />
            <NavChip href="/dashboard/project-map" label="Project Map" />
            <NavChip href="/dashboard/project-map" label="View Controls" />
            <NavChip href="/dashboard/threat-matrix" label="View Relevant Threats" />
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Shared small components ─────────────────────────────────────────────────
function MetaRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div style={{ display: "flex", gap: 6 }}>
      <span style={{ color: SUBTLE, minWidth: 100 }}>{label}:</span>
      <span style={{ color: highlight ? "#22C55E" : TEXT, fontWeight: highlight ? 700 : 400 }}>
        {value}
      </span>
    </div>
  );
}

function NavChip({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      style={{
        display: "inline-block",
        fontSize: 11,
        color: GOLD,
        textDecoration: "none",
        border: `1px solid ${GOLD}44`,
        padding: "4px 10px",
        borderRadius: 4,
        letterSpacing: "0.03em",
      }}
    >
      {label}
    </Link>
  );
}

function FindingRow({ finding }: { finding: AdminSurfaceFinding }) {
  const color = SEV_COLOR[finding.severity];
  const evidenceRequired = _reportEvidenceRequired(finding);
  const remediation = _reportRemediation(finding);
  const isRoleAware = evidenceRequired.length > 0 || !!remediation;
  return (
    <div
      style={{
        padding: "10px 12px",
        marginBottom: 4,
        background: "rgba(255,255,255,0.02)",
        borderLeft: `3px solid ${color}`,
        borderRadius: "0 5px 5px 0",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <Pill label={finding.severity} color={color} />
        <Pill label={FINDING_TYPE_LABEL[finding.findingType] ?? finding.findingType} color={GOLD} />
        <span style={{ fontSize: 13, fontWeight: 600, color: TEXT }}>{finding.title}</span>
      </div>
      <p style={{ margin: "0 0 6px 0", fontSize: 12, color: MUTED, lineHeight: 1.5 }}>
        {finding.summary}
      </p>
      {isRoleAware ? (
        <>
          {evidenceRequired.length > 0 && (
            <div style={{ marginTop: 6, marginBottom: 4 }}>
              <div style={{ fontSize: 10, color: MUTED, letterSpacing: "0.08em", marginBottom: 4 }}>EVIDENCE REQUIRED</div>
              <ul style={{ margin: 0, paddingLeft: 16 }}>
                {evidenceRequired.map((item, i) => (
                  <li key={i} style={{ fontSize: 11, color: SUBTLE, lineHeight: 1.5 }}>{item}</li>
                ))}
              </ul>
            </div>
          )}
          {remediation && (
            <div style={{ marginTop: 4 }}>
              <div style={{ fontSize: 10, color: MUTED, letterSpacing: "0.08em", marginBottom: 4 }}>RECOMMENDED REMEDIATION</div>
              <div style={{ fontSize: 11, color: SUBTLE, lineHeight: 1.5 }}>{remediation}</div>
            </div>
          )}
        </>
      ) : (
        finding.recommendedActions.length > 0 && (
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {finding.recommendedActions.slice(0, 3).map((a, i) => (
              <li key={i} style={{ fontSize: 11, color: SUBTLE, lineHeight: 1.5 }}>
                {a}
              </li>
            ))}
          </ul>
        )
      )}
    </div>
  );
}

function ControlRow({ control }: { control: ProjectControl }) {
  const color = CONTROL_STATUS_COLOR[control.status];
  const hasEvidence = Object.keys(control.evidence ?? {}).length > 0;
  const verificationDate = control.verifiedAt
    ? new Date(control.verifiedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
    : null;
  return (
    <div
      style={{
        padding: "8px 12px",
        marginBottom: 4,
        background: "rgba(255,255,255,0.02)",
        borderLeft: `3px solid ${color}`,
        borderRadius: "0 5px 5px 0",
        display: "grid",
        gap: 4,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Pill label={CONTROL_STATUS_LABEL[control.status]} color={color} />
        <span style={{ fontSize: 13, fontWeight: 600, color: TEXT }}>{control.title}</span>
      </div>
      <p style={{ margin: 0, fontSize: 12, color: MUTED, lineHeight: 1.5 }}>
        {control.description}
      </p>
      {control.evidenceProvided ? (
        <div>
          <span style={{ fontSize: 10, color: MUTED, letterSpacing: "0.06em" }}>EVIDENCE PROVIDED · </span>
          <span style={{ fontSize: 12, color: TEXT }}>{control.evidenceProvided}</span>
        </div>
      ) : null}
      {control.reviewerNotes ? (
        <div>
          <span style={{ fontSize: 10, color: MUTED, letterSpacing: "0.06em" }}>REVIEWER NOTES · </span>
          <span style={{ fontSize: 12, color: SUBTLE, fontStyle: "italic" }}>{control.reviewerNotes}</span>
        </div>
      ) : null}
      {control.status === "verified" && (
        <div style={{ fontSize: 11, color: "#22C55E", fontWeight: 600 }}>
          Verification Status: Verified
          {verificationDate ? ` · ${verificationDate}` : ""}
          {control.verifiedBy ? ` · verified by ${control.verifiedBy}` : ""}
        </div>
      )}
      {control.verificationNotes && (
        <div style={{ fontSize: 11, color: SUBTLE, fontStyle: "italic" }}>
          Verification notes: {control.verificationNotes}
        </div>
      )}
      {!control.evidenceProvided && hasEvidence && (
        <div style={{ fontSize: 11, color: SUBTLE }}>
          Evidence recorded ·{" "}
          <span style={{ color: "#22C55E" }}>
            {control.verificationMethod !== "none" ? control.verificationMethod : "manual"}
          </span>
        </div>
      )}
    </div>
  );
}
