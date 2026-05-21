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
  owner_detected: "Owner Detected",
  access_control_detected: "AccessControl Detected",
  oracle_feed_detected: "Oracle Feed Detected",
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

// ─── Asset-specific control title helper ─────────────────────────────────────
function resolveControlTitle(
  control: ProjectControl,
  assets: ProjectAsset[],
  findings: AdminSurfaceFinding[],
  titleCounts: Map<string, number>,
): string {
  if ((titleCounts.get(control.title) ?? 0) <= 1) return control.title;
  const assetId = control.assetId ?? (() => {
    const f = findings.find((x) => x.id === (control.findingId ?? ""));
    return f?.assetId ?? null;
  })();
  const asset = assetId ? assets.find((a) => a.id === assetId) : undefined;
  const role = asset
    ? ((asset.metadata?.role as string | undefined) ?? asset.name)
    : null;
  if (!role) return control.title;
  const generic = /\ball\s+(admin\/owner|admin|owner)\b/i;
  if (generic.test(control.title)) {
    return control.title.replace(generic, `${role} admin/owner`);
  }
  return `${control.title} — ${role}`;
}

// ─── Helpers ────────────────────────────────────────────────────────────────
function fmtDate(v?: string | null): string {
  if (!v) return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
}

const CHAIN_LABELS: Record<number, string> = {
  1: "Ethereum",
  10: "Optimism",
  56: "BNB Chain",
  137: "Polygon",
  8453: "Base",
  1287: "Moonbase Alpha",
  42161: "Arbitrum",
  43114: "Avalanche",
  11155111: "Sepolia",
};

const AUTHORITY_DETECTOR_ATTEMPTS = "Ownable, EIP-1967, Safe, Timelock, AccessControl";
const CONTROL_GROUP_ORDER = ["treasury", "vault", "escrow", "reserve", "oracle", "general"] as const;
type ControlGroupKey = typeof CONTROL_GROUP_ORDER[number];

const CONTROL_GROUP_LABELS: Record<ControlGroupKey, string> = {
  treasury: "Treasury controls",
  vault: "Vault controls",
  escrow: "Escrow controls",
  reserve: "Reserve controls",
  oracle: "Oracle controls",
  general: "General controls",
};

function scanStatusLabel(status?: string | null): string {
  if (!status || status === "not_run") return "Not available";
  if (status === "partial") return "Partial - retry recommended";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function chainListLabel(chains?: number[]): string {
  if (!chains || chains.length === 0) return "Not available";
  return chains.map((chain) => CHAIN_LABELS[chain] ?? String(chain)).join(", ");
}

function hasScanMetadata(review: DefenseReview): boolean {
  return Boolean(
    review.lastScanAt ||
      review.scanStatus !== "not_run" ||
      review.scanChainsConfigured.length > 0 ||
      review.scanChainsUnconfigured.length > 0 ||
      review.scanNotes ||
      review.detectorRunCount > 0,
  );
}

function normalizeControlRole(value?: string | null): ControlGroupKey | null {
  if (!value) return null;
  const normalized = value.toLowerCase().replace(/[-_\s]/g, "");
  if (normalized === "treasury") return "treasury";
  if (normalized === "vault") return "vault";
  if (normalized === "escrow") return "escrow";
  if (normalized === "reserve") return "reserve";
  if (["oracle", "goldoracle", "pricefeed", "priceoracle"].includes(normalized)) return "oracle";
  return null;
}

function roleForAsset(asset?: ProjectAsset): ControlGroupKey | null {
  if (!asset) return null;
  const metadataRole = typeof asset.metadata?.role === "string" ? asset.metadata.role : undefined;
  return normalizeControlRole(metadataRole) ?? normalizeControlRole(asset.name) ?? normalizeControlRole(asset.assetType);
}

function roleForControl(
  control: ProjectControl,
  assets: ProjectAsset[],
  findings: AdminSurfaceFinding[],
): ControlGroupKey {
  const directAsset = control.assetId ? assets.find((asset) => asset.id === control.assetId) : undefined;
  const finding = control.findingId ? findings.find((item) => item.id === control.findingId) : undefined;
  const findingAsset = finding?.assetId ? assets.find((asset) => asset.id === finding.assetId) : undefined;
  const evidenceRole = typeof finding?.evidence?.role === "string" ? finding.evidence.role : undefined;
  return (
    roleForAsset(directAsset) ??
    roleForAsset(findingAsset) ??
    normalizeControlRole(evidenceRole) ??
    normalizeControlRole(control.sourceFindingType ?? undefined) ??
    normalizeControlRole(control.controlKey) ??
    normalizeControlRole(control.title) ??
    "general"
  );
}

function buildControlGroups(
  controls: ProjectControl[],
  assets: ProjectAsset[],
  findings: AdminSurfaceFinding[],
): Array<{ key: ControlGroupKey; label: string; items: ProjectControl[] }> {
  const buckets = new Map<ControlGroupKey, ProjectControl[]>();
  CONTROL_GROUP_ORDER.forEach((key) => buckets.set(key, []));
  controls.forEach((control) => {
    buckets.get(roleForControl(control, assets, findings))?.push(control);
  });
  return CONTROL_GROUP_ORDER
    .map((key) => ({ key, label: CONTROL_GROUP_LABELS[key], items: buckets.get(key) ?? [] }))
    .filter((group) => group.items.length > 0);
}

function evidenceAssetNames(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (typeof item === "string") return item;
      if (item && typeof item === "object") {
        const record = item as Record<string, unknown>;
        return typeof record.asset_name === "string"
          ? record.asset_name
          : typeof record.name === "string"
            ? record.name
            : undefined;
      }
      return undefined;
    })
    .filter((item): item is string => typeof item === "string" && item.length > 0);
}

function assetRoleLabel(asset: ProjectAsset): string {
  const metadataRole = asset.metadata?.role;
  if (typeof metadataRole === "string" && metadataRole.trim().length > 0) {
    return metadataRole.trim().toLowerCase();
  }
  const normalizedName = asset.name.trim().toLowerCase();
  if (["treasury", "vault", "escrow", "reserve"].includes(normalizedName)) return normalizedName;
  if (normalizedName.includes("oracle")) return "oracle";
  return asset.assetType;
}

function mappedOwnerDisplay(
  asset: ProjectAsset,
  resolvedOwnerFindings: AdminSurfaceFinding[],
  unresolvedOwnerFindings: AdminSurfaceFinding[],
): string {
  const resolved = resolvedOwnerFindings.find((finding) => finding.assetId === asset.id);
  const owner = resolved?.evidence?.adminAddress;
  if (typeof owner === "string" && owner.length > 0) {
    return `${owner} (resolved via Ownable.owner)`;
  }
  if (unresolvedOwnerFindings.some((finding) => finding.assetId === asset.id)) {
    return "Unresolved";
  }
  const ownerType = asset.metadata?.ownerType;
  if (typeof ownerType === "string" && ownerType.length > 0 && ownerType !== "Unknown") {
    return ownerType;
  }
  return "Unresolved";
}

function findingDisplayOrder(finding: AdminSurfaceFinding): number {
  if (finding.findingType === "role_concentration") return 0;
  if (finding.findingType === "unknown_admin") return 1;
  if (finding.findingType === "owner_detected") return 2;
  return 3;
}

function whatThisMeansCopy(
  review: DefenseReview,
  opts: {
    resolvedCount: number;
    unresolvedCount: number;
    totalAssets: number;
    resolvedAssetNames: string[];
    unresolvedAssetNames: string[];
    sharedOwnerAddr: string | undefined;
    sharedOwnerAssetCount: number;
  },
): string {
  const { resolvedCount, unresolvedCount, totalAssets, resolvedAssetNames, unresolvedAssetNames, sharedOwnerAddr, sharedOwnerAssetCount } = opts;

  if (review.scanStatus === "error" || review.scanStatus === "partial") {
    return "SCE attempted standard public authority interface checks, but scan coverage was limited by RPC transport failures. Re-run the scan with a stable RPC endpoint or submit source/ABI and control evidence to complete authority-path verification.";
  }

  if (resolvedCount === 0 && unresolvedCount === 0) {
    return `SCE scanned standard public authority interfaces for the mapped assets. No standard owner/admin/proxy/timelock paths resolved or were attempted for ${totalAssets} asset${totalAssets !== 1 ? "s" : ""}. Submit source/ABI or control evidence to advance verification.`;
  }

  const assetWord = totalAssets !== 1 ? "assets" : "asset";
  const prefix = `SCE scanned standard public authority interfaces for ${totalAssets} mapped ${assetWord}.`;

  if (resolvedCount > 0 && unresolvedCount === 0) {
    const assetList = resolvedAssetNames.join(", ");
    let copy = `${prefix} Public calls resolved Ownable owner paths for all ${resolvedCount} asset${resolvedCount !== 1 ? "s" : ""} — ${assetList}.`;
    if (sharedOwnerAddr && sharedOwnerAssetCount >= 2) {
      copy += ` All resolved assets share the same owner address: ${sharedOwnerAddr}. This shared owner path is the primary continuity finding. The resolved owner evidence does not prove a vulnerability. The next review gate is to confirm whether this address is an EOA, multisig, timelock, or governed contract.`;
    }
    return copy;
  }

  // Mix of resolved and unresolved
  const assetList = resolvedAssetNames.join(", ");
  const unresolvedList = unresolvedAssetNames.join(", ");

  let copy = `${prefix} Public calls resolved Ownable owner paths for ${resolvedCount} asset${resolvedCount !== 1 ? "s" : ""} — ${assetList}`;
  if (sharedOwnerAddr && sharedOwnerAssetCount >= 2) {
    copy += ` — all to the same owner address: ${sharedOwnerAddr}. This shared owner path is the primary continuity finding in this review.`;
  } else {
    copy += ".";
  }
  if (unresolvedCount > 0) {
    copy += ` ${unresolvedList} did not resolve through standard interfaces and require${unresolvedCount === 1 ? "s" : ""} source/ABI review or submitted control evidence.`;
  }
  copy += " The resolved owner evidence does not prove a vulnerability, and it does not verify that the owner is unsafe. It means the next review gate is to confirm whether the resolved address is an EOA, multisig, timelock, or governed contract.";
  return copy;
}

function buildNextActions(
  findings: AdminSurfaceFinding[],
  controls: ProjectControl[],
  opts?: { sharedOwnerAddr?: string; unresolvedAssetNames?: string[] },
): string[] {
  const actions: string[] = [];
  const missing = controls.filter((c) => c.status === "missing");
  const unverified = controls.filter(
    (c) => c.status !== "verified" && c.status !== "not_applicable",
  );
  const verified = controls.filter((c) => c.status === "verified");
  const crit = findings.filter((f) => f.severity === "critical");

  if (opts?.sharedOwnerAddr) {
    const unresolvedList = opts.unresolvedAssetNames?.join(", ");
    return [
      `Confirm whether ${opts.sharedOwnerAddr} is an EOA, multisig, timelock, or governed contract.`,
      "Provide signer policy, threshold, delay windows, and emergency procedure for the shared owner.",
      unresolvedList
        ? `Resolve ${unresolvedList} authority path through source/ABI review or submitted control evidence.`
        : "Resolve remaining unresolved authority paths through source/ABI review or submitted control evidence.",
      "Verify whether critical powers should remain concentrated or be split across multisigs, timelocks, or governed roles.",
      "Submit supporting policy evidence and re-run SCE Admin Surface Scan.",
      `Generate updated report with verified-control coverage. Current status: ${verified.length} of ${controls.length} evidence and control check${controls.length !== 1 ? "s" : ""} verified.`,
    ];
  }

  const knownRoles = ["treasury", "vault", "escrow", "reserve", "oracle"];
  const affectedRoles = knownRoles.filter((r) =>
    findings.some((f) => f.findingType.startsWith(r) || f.findingType.includes(r)),
  );
  const roleList =
    affectedRoles.length > 0
      ? affectedRoles.join(", ")
      : "treasury, vault, escrow, reserve, and oracle";

  if (opts?.sharedOwnerAddr) {
    actions.push(
      `Confirm that ${opts.sharedOwnerAddr} is an EOA, multisig, timelock, or governed contract — this address controls the resolved authority paths and is the primary continuity risk.`,
    );
    actions.push(
      "Provide the signer policy, threshold, delay windows, and emergency procedure for the shared owner address.",
    );
  }

  if (opts?.unresolvedAssetNames && opts.unresolvedAssetNames.length > 0) {
    const unresolvedList = opts.unresolvedAssetNames.join(", ");
    actions.push(
      `Resolve authority paths for ${unresolvedList} — standard public interfaces did not return a valid owner or admin address.`,
    );
  }

  actions.push(
    "Submit or confirm the mapped asset inventory — verify all contracts, proxies, oracles, and keepers are represented in the Project Map.",
  );
  actions.push("Submit source/ABI or admin/owner evidence for unresolved assets.");
  actions.push(
    "Provide multisig/timelock details where applicable, including signer policy, threshold, and delay windows.",
  );
  actions.push(`Verify authority paths for: ${roleList}.`);
  actions.push(
    "Document role separation and emergency procedures for each authority surface.",
  );

  if (missing.length > 0) {
    actions.push(
      `Attach or link policy evidence for ${missing.length} evidence and control check${missing.length > 1 ? "s" : ""} currently marked as Missing.`,
    );
  } else if (unverified.length > 0) {
    actions.push(
      `Attach or link policy evidence for ${unverified.length} outstanding evidence and control check${unverified.length > 1 ? "s" : ""}.`,
    );
  } else {
    actions.push(
      "Attach or link policy evidence for any outstanding evidence and control checks.",
    );
  }

  if (crit.length > 0) {
    actions.push(
      `Address ${crit.length} critical authority surface${crit.length > 1 ? "s" : ""} — these require immediate attention before deployment or continued operation.`,
    );
  }
  if (findings.some((f) => f.findingType === "missing_timelock")) {
    actions.push(
      "Implement upgrade timelocks to provide a governance review window before upgrades take effect.",
    );
  }
  if (findings.some((f) => f.findingType === "owner_eoa")) {
    actions.push(
      "Transition owner accounts from EOA to multisig or timelocked governance.",
    );
  }
  if (
    findings.some(
      (f) =>
        f.findingType === "role_concentration" ||
        f.findingType.includes("role_concentration"),
    )
  ) {
    actions.push(
      "Distribute concentrated admin roles across separate key holders or governance contracts.",
    );
  }

  actions.push(
    "Re-run SCE Admin Surface Scan after submitting evidence to refresh findings and authority path verification.",
  );
  actions.push(
    `Generate updated report with verified-control coverage. Current status: ${verified.length} of ${controls.length} evidence and control check${controls.length !== 1 ? "s" : ""} verified.`,
  );

  return actions.slice(0, 6);
}

// ─── Sub-components ──────────────────────────────────────────────────────────
function SectionHeader({ children, num }: { children: React.ReactNode; num?: number }) {
  return (
    <h2
      style={{
        margin: "0 0 16px 0",
        fontSize: 13,
        fontWeight: 700,
        letterSpacing: "0.1em",
        color: TEXT,
        paddingBottom: 10,
        borderBottom: `1px solid ${SEP}`,
        textTransform: "uppercase",
        display: "flex",
        alignItems: "center",
        gap: 10,
      }}
    >
      {num !== undefined && (
        <span style={{ color: GOLD, fontWeight: 800, fontSize: 12 }}>{String(num).padStart(2, "0")}</span>
      )}
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
  breakBefore,
  children,
}: {
  id?: string;
  breakBefore?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className={breakBefore ? "print-break-before" : undefined}
      style={{
        marginBottom: 40,
        pageBreakInside: "avoid",
        breakInside: "avoid",
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
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState("");

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

  async function handleDownloadPdf() {
    if (!review) return;
    setDownloading(true);
    setDownloadError("");
    try {
      const token = window.localStorage.getItem("sce_session_token");
      const res = await fetch(`/api/defense-review/${review.id}/pdf`, {
        headers: token ? { "X-SCE-Session": token } : {},
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const safeName = review.projectName.replace(/[^a-zA-Z0-9-_]/g, "-");
      a.href = url;
      a.download = `SCE-Defense-Review-${safeName}-${review.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setDownloadError(err instanceof Error ? err.message : "PDF generation failed.");
    } finally {
      setDownloading(false);
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
  const authorityRoles = new Set(["treasury", "vault", "escrow", "reserve", "oracle"]);
  // Resolved: owner_detected findings with verified confidence (on-chain owner observed)
  const resolvedOwnerFindings = openFindings.filter(
    (f) => f.findingType === "owner_detected" && (f.evidence?.confidence as string | undefined) === "verified"
  );
  // Unresolved: unknown_admin root authority findings for authority-role assets
  const unresolvedOwnerFindings = openFindings.filter((f) => {
    const role = f.evidence?.role;
    return f.findingType === "unknown_admin" && typeof role === "string" && authorityRoles.has(role);
  });
  const authorityRootFindings = [...resolvedOwnerFindings, ...unresolvedOwnerFindings];
  const authorityPathsResolved = resolvedOwnerFindings.length;
  const authorityPathsAwaiting = unresolvedOwnerFindings.length;

  const activeAssets = assets.filter((a) => a.status !== "archived");
  const contractAssets = activeAssets.filter(
    (a) => a.assetType === "contract" || a.assetType === "proxy",
  );
  const frontendAssets = activeAssets.filter((a) => a.assetType === "frontend");
  const otherAssets = activeAssets.filter(
    (a) =>
      a.assetType !== "contract" &&
      a.assetType !== "proxy" &&
      a.assetType !== "frontend",
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

  // Scan aggregation: extract concentration and resolved/unresolved asset names
  const concentrationFinding = openFindings.find((f) => f.findingType === "role_concentration");
  const sharedOwnerAddr = concentrationFinding?.evidence?.adminAddress as string | undefined;
  const concentrationAssetNames = [
    ...evidenceAssetNames(concentrationFinding?.evidence?.assetsAffected),
    ...evidenceAssetNames(concentrationFinding?.evidence?.controlledAssets),
  ].filter((name, index, all) => all.indexOf(name) === index);
  const sharedOwnerAssetCount = concentrationAssetNames.length;
  const primaryFindingText = concentrationAssetNames.length > 0
    ? `Primary Finding: Shared owner concentration across ${concentrationAssetNames.join(", ")}`
    : undefined;
  const coverRiskLine = concentrationAssetNames.length >= 2
    ? `Shared owner concentration across ${concentrationAssetNames.length} assets requires verification.`
    : criticalCount > 0
      ? `${criticalCount} critical authority surface${criticalCount > 1 ? "s" : ""} require immediate attention.`
      : highCount > 0
        ? `${highCount} high-risk authority surface${highCount > 1 ? "s" : ""} require verification.`
        : `${openFindings.length} finding${openFindings.length !== 1 ? "s" : ""} recorded. Review in progress.`;
  const resolvedAssetNames = resolvedOwnerFindings.map((f) => {
    const a = assets.find((asset) => asset.id === f.assetId);
    return a?.name ?? "Unknown";
  });
  const unresolvedAssetNames = unresolvedOwnerFindings.map((f) => {
    const a = assets.find((asset) => asset.id === f.assetId);
    return a?.name ?? "Unknown";
  });

  const nextActions = buildNextActions(openFindings, controls, { sharedOwnerAddr, unresolvedAssetNames });
  const scanMetadataAvailable = review ? hasScanMetadata(review) : false;
  const scanStatusText = scanStatusLabel(review?.scanStatus);

  const findingsBySeverity = (["critical", "high", "medium", "low"] as AdminFindingSeverity[])
    .map((sev) => ({
      sev,
      items: openFindings
        .filter((f) => f.severity === sev)
        .sort((a, b) => {
          if (a.findingType === "role_concentration") return -1;
          if (b.findingType === "role_concentration") return 1;
          return findingDisplayOrder(a) - findingDisplayOrder(b);
        }),
    }))
    .filter((g) => g.items.length > 0);

  const controlGroups = buildControlGroups(controls, assets, openFindings);

  // Build title-count map for asset-specific control deduplication
  const titleCounts = new Map<string, number>();
  for (const c of controls) {
    titleCounts.set(c.title, (titleCounts.get(c.title) ?? 0) + 1);
  }

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
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
        @media print {
          /* Hide UI chrome — report content only */
          .no-print { display: none !important; }
          .dashboard-chrome { display: none !important; }

          /* Fix the dashboard shell flex layout for print */
          #dashboard-shell-root {
            display: block !important;
            height: auto !important;
            overflow: visible !important;
          }
          #dashboard-main-content {
            overflow: visible !important;
            height: auto !important;
          }

          body {
            background: #0a0c12 !important;
            font-family: 'Inter', system-ui, sans-serif !important;
            overflow: visible !important;
          }
          .report-root { padding: 0 !important; }
          .report-container { box-shadow: none !important; }
          .print-break-before { page-break-before: always; break-before: page; }
          .print-avoid-break { page-break-inside: avoid; break-inside: avoid; }
        }
        @page { margin: 20mm 18mm; size: A4; }
        @page :first { margin-top: 0mm; }
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
          <NavChip href={`/dashboard/project-map?project=${review.projectId}`} label="Project Map" />
          <NavChip href={`/dashboard/project-map?project=${review.projectId}&tab=controls`} label="Controls" />
          <NavChip href="/dashboard/threat-matrix" label="Threat Matrix" />
          <div style={{ flex: 1 }} />
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={downloading}
            style={{
              background: downloading ? "rgba(212,175,55,0.15)" : GOLD,
              border: "none",
              borderRadius: 4,
              color: downloading ? GOLD : "#0a0c12",
              fontSize: 11,
              padding: "6px 16px",
              cursor: downloading ? "wait" : "pointer",
              fontWeight: 700,
              letterSpacing: "0.04em",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            {downloading ? "Generating PDF…" : "⬇ Download PDF"}
          </button>
        </nav>

        {downloadError && (
          <div
            className="no-print"
            style={{
              maxWidth: 880,
              margin: "0 auto 12px",
              padding: "8px 14px",
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.25)",
              borderRadius: 5,
              fontSize: 12,
              color: "#FCA5A5",
            }}
          >
            PDF error: {downloadError}
          </div>
        )}

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
          {/* REPORT HEADER / COVER                                       */}
          {/* ═══════════════════════════════════════════════════════════ */}
          <ReportSection id="report-header">
            {/* Gold accent bar at top */}
            <div style={{ height: 4, background: `linear-gradient(90deg, ${GOLD}, ${GOLD}55)`, borderRadius: 2, marginBottom: 32 }} />

            {/* Brand + confidential row */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                <span style={{ fontSize: 22, fontWeight: 800, color: GOLD, letterSpacing: "0.04em" }}>SCE</span>
                <span style={{ fontSize: 11, color: MUTED, letterSpacing: "0.14em" }}>SAGITTA CONTINUITY ENGINE</span>
              </div>
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 800,
                  letterSpacing: "0.2em",
                  color: GOLD,
                  border: `1px solid ${GOLD}66`,
                  padding: "3px 8px",
                  borderRadius: 3,
                }}
              >
                CONFIDENTIAL
              </span>
            </div>

            {/* Report type label */}
            <div
              style={{
                fontSize: 10,
                letterSpacing: "0.22em",
                color: `${GOLD}88`,
                marginBottom: 10,
                textTransform: "uppercase",
              }}
            >
              Public-Surface Defense Review Report
            </div>

            {/* Project name */}
            <h1
              style={{
                margin: "0 0 6px 0",
                fontSize: 32,
                fontWeight: 800,
                color: TEXT,
                lineHeight: 1.15,
                letterSpacing: "-0.01em",
              }}
            >
              {review.projectName}
            </h1>

            {/* Prepared by line */}
            <div style={{ fontSize: 12, color: MUTED, marginBottom: 24 }}>
              Prepared by Sagitta Continuity Engine (SCE) · {fmtDate(review.updatedAt)}
            </div>

            <div
              style={{
                padding: "10px 14px",
                background: "rgba(249,115,22,0.06)",
                border: "1px solid rgba(249,115,22,0.25)",
                borderLeft: "4px solid #F97316",
                borderRadius: "0 5px 5px 0",
                fontSize: 13,
                color: TEXT,
                marginBottom: 20,
              }}
            >
              {coverRiskLine}
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: `linear-gradient(90deg, ${GOLD}44, transparent)`, marginBottom: 20 }} />

            {/* Metadata grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "10px 32px",
                fontSize: 12,
                color: MUTED,
                paddingBottom: 20,
                borderBottom: `1px solid ${SEP}`,
              }}
            >
              <MetaRow label="Review ID" value={review.id} />
              <MetaRow label="Review Status" value={REVIEW_STATUS_LABEL[review.status]} />
              <MetaRow label="Initiated" value={fmtDate(review.createdAt)} />
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
          </ReportSection>

          {/* ═══════════════════════════════════════════════════════════ */}
          {/* EXECUTIVE SUMMARY                                           */}
          {/* ═══════════════════════════════════════════════════════════ */}
          <ReportSection id="executive-summary">
            <SectionHeader num={1}>Executive Summary</SectionHeader>
            <p
              style={{
                fontSize: 13,
                color: MUTED,
                lineHeight: 1.75,
                margin: "0 0 20px 0",
              }}
            >
              This report reflects a public-surface review of{" "}
              <strong style={{ color: TEXT }}>{review.projectName}</strong> conducted by
              Sagitta Continuity Engine (SCE). The analysis covers mapped public assets,
              authority risk findings derived from the Admin Surface Scanner, relevant
              global threat families, and recommended evidence and control checks. SCE does not control this
              project, hold keys, or execute on-chain transactions.
            </p>
            {primaryFindingText && (
              <p style={{ fontSize: 13, color: TEXT, fontWeight: 700, margin: "0 0 16px 0", lineHeight: 1.6 }}>
                {primaryFindingText}
              </p>
            )}

            {/* Risk posture banner */}
            {(() => {
              const riskColor = criticalCount > 0 ? "#EF4444" : highCount > 0 ? "#F97316" : isDefended ? "#22C55E" : GOLD;
              const riskLabel = criticalCount > 0 ? "Critical Risk" : highCount > 0 ? "High Risk" : isDefended ? "Defended" : "Under Review";
              const riskDesc = criticalCount > 0
                ? `${criticalCount} critical authority surface${criticalCount > 1 ? "s" : ""} require immediate attention.`
                : highCount > 0
                  ? `${highCount} high-risk authority surface${highCount > 1 ? "s" : ""} require verification. These are unverified authority surfaces — not confirmed vulnerabilities.`
                  : isDefended
                    ? "All controls verified. Project meets the SCE Defended threshold."
                    : `Evidence and control verification at ${controlCoverage}%. Review in progress.`;
              return (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    padding: "12px 16px",
                    background: `${riskColor}0d`,
                    border: `1px solid ${riskColor}44`,
                    borderLeft: `4px solid ${riskColor}`,
                    borderRadius: "0 6px 6px 0",
                    marginBottom: 20,
                  }}
                >
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.14em", color: riskColor, marginBottom: 2 }}>
                      RISK POSTURE — {riskLabel.toUpperCase()}
                    </div>
                    <div style={{ fontSize: 12, color: TEXT }}>{riskDesc}</div>
                  </div>
                </div>
              );
            })()}

            <StatGrid>
              <Stat label="Assets Mapped" value={activeAssets.length || review.assetsCount} />
              <Stat
                label="Open Findings"
                value={openFindings.length || review.findingsCount}
              />
              <Stat
                label="Critical / High"
                value={`${criticalCount} / ${highCount}`}
                color={criticalCount > 0 ? "#EF4444" : highCount > 0 ? "#F97316" : TEXT}
              />
              <Stat
                label="Threat Families"
                value={
                  relevance
                    ? relevance.relevantThreatFamilies.length
                    : review.relevantThreatFamiliesCount
                }
              />
              <Stat label="Controls" value={controls.length} />
              <Stat
                label="Controls Verified"
                value={`${verifiedControls.length} / ${controls.length}`}
                color={verifiedControls.length > 0 ? "#22C55E" : TEXT}
              />
              <Stat
                label="Coverage"
                value={`${controlCoverage}%`}
                color={
                  controlCoverage === 100
                    ? "#22C55E"
                    : controlCoverage > 0
                    ? GOLD
                    : TEXT
                }
              />
              {authorityRootFindings.length > 0 && (
                <>
                  <Stat
                    label="Authority Paths Resolved"
                    value={`${authorityPathsResolved} / ${authorityRootFindings.length}`}
                    color={authorityPathsResolved > 0 ? "#22C55E" : TEXT}
                  />
                  <Stat
                    label="Awaiting Evidence"
                    value={`${authorityPathsAwaiting} / ${authorityRootFindings.length}`}
                    color={authorityPathsAwaiting > 0 ? GOLD : TEXT}
                  />
                  {(review.scanStatus === "partial" || review.scanStatus === "error") && (
                    <Stat
                      label="Scan Coverage"
                      value={scanStatusText}
                      color={GOLD}
                    />
                  )}
                </>
              )}
            </StatGrid>

            <div
              style={{
                padding: "12px 14px",
                background: "rgba(255,255,255,0.02)",
                border: `1px solid ${SEP}`,
                borderRadius: 6,
                marginBottom: 16,
              }}
            >
              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.14em", color: GOLD, marginBottom: 8 }}>
                SCAN STATUS
              </div>
              {scanMetadataAvailable ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "6px 18px", fontSize: 12, color: MUTED }}>
                  <MetaRow label="Last scan" value={fmtDate(review.lastScanAt)} />
                  <MetaRow label="Chains scanned" value={chainListLabel(review.scanChainsConfigured)} />
                  <MetaRow label="Assets scanned" value={`${activeAssets.length || review.assetsCount} / ${activeAssets.length || review.assetsCount}`} />
                  <MetaRow label="Detector attempts" value={review.detectorRunCount > 0 ? AUTHORITY_DETECTOR_ATTEMPTS : "Not available"} />
                  <MetaRow label="Scan status" value={scanStatusText} highlight={review.scanStatus === "complete"} />
                  <MetaRow
                    label="RPC config"
                    value={review.scanNotes || (review.scanChainsUnconfigured.length > 0 ? `Unconfigured chains: ${chainListLabel(review.scanChainsUnconfigured)}` : "Configured")}
                  />
                </div>
              ) : (
                <div style={{ fontSize: 12, color: MUTED }}>Scan status: Not available</div>
              )}
            </div>

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
                All generated evidence and control checks are verified for current project metadata. Coverage: 100%.
              </div>
            ) : (
              <div
                style={{
                  padding: "10px 14px",
                  background: "rgba(212,175,55,0.05)",
                  border: `1px solid ${SEP}`,
                  borderRadius: 6,
                  fontSize: 12,
                  color: MUTED,
                }}
              >
                Evidence and control verification is{" "}
                <strong style={{ color: TEXT }}>{controlCoverage}%</strong> complete.{" "}
                {!isDefended &&
                  '"Defended" status applies only when all checks are verified against current project metadata.'}
              </div>
            )}
          </ReportSection>

          {/* ═══════════════════════════════════════════════════════════ */}
          {/* REVIEW SCOPE                                                */}
          {/* ═══════════════════════════════════════════════════════════ */}
          <ReportSection id="review-scope">
            <SectionHeader num={2}>Review Scope</SectionHeader>

            <div
              style={{
                padding: "12px 16px",
                background: "rgba(212,175,55,0.04)",
                border: `1px solid ${SEP}`,
                borderRadius: 6,
                marginBottom: 8,
                fontSize: 13,
                color: MUTED,
                lineHeight: 1.6,
              }}
            >
              This is a zero-custody public-surface review. SCE analyzes only publicly
              available metadata: contract addresses, deployment chains, admin surface
              indicators, and documented protocol configurations. No private keys, signing
              credentials, mnemonics, or seed phrases are requested or stored at any point.
              <div style={{ marginTop: 6, fontSize: 11, color: SUBTLE }}>
                Public-surface describes the data reviewed; Confidential describes distribution of this report.
              </div>
            </div>

            {/* Not an Audit disclaimer */}
            <div
              style={{
                padding: "10px 14px",
                borderLeft: "3px solid rgba(148,163,184,0.3)",
                background: "rgba(148,163,184,0.04)",
                borderRadius: "0 5px 5px 0",
                marginBottom: 16,
                fontSize: 12,
                color: SUBTLE,
                lineHeight: 1.6,
              }}
            >
              <strong style={{ letterSpacing: "0.06em", color: SUBTLE }}>NOT AN AUDIT.</strong>{" "}
              This Defense Review is not a full smart contract audit, formal verification report,
              penetration test, or economic exploit review. It is a zero-custody authority-surface
              and continuity-readiness review based on public metadata and submitted evidence.
            </div>

            {project?.description && (
              <p style={{ fontSize: 13, color: MUTED, marginBottom: 12, lineHeight: 1.6 }}>
                {project.description}
              </p>
            )}

            {/* Mapped contracts/proxies */}
            {contractAssets.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, color: SUBTLE, letterSpacing: "0.08em", marginBottom: 6 }}>
                  MAPPED CONTRACTS / PROXIES
                </div>
                {contractAssets.map((a) => (
                  <div
                    key={a.id}
                    style={{
                      padding: "8px 0",
                      borderBottom: `1px solid ${SEP}`,
                      fontSize: 13,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                      <Pill label={a.assetType} color={GOLD} />
                      <div style={{ flex: 1 }}>
                        <span style={{ color: TEXT, fontWeight: 600 }}>{a.name}</span>
                        <div style={{ marginTop: 2, fontSize: 11, color: MUTED, fontFamily: "monospace" }}>
                          {a.address ?? <span style={{ color: SUBTLE, fontFamily: "inherit", fontStyle: "italic" }}>Address: Not provided</span>}
                        </div>
                        {a.chain && (
                          <div style={{ fontSize: 11, color: SUBTLE, marginTop: 1 }}>
                            {a.chain}{a.network ? ` / ${a.network}` : ""}
                          </div>
                        )}
                        <div style={{ fontSize: 11, color: SUBTLE, marginTop: 1 }}>
                          Admin/Owner:{" "}
                          {mappedOwnerDisplay(a, resolvedOwnerFindings, unresolvedOwnerFindings)}
                          <span> - Role: {assetRoleLabel(a)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Other asset types */}
            {otherAssets.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, color: SUBTLE, letterSpacing: "0.08em", marginBottom: 6 }}>
                  OTHER MAPPED ASSETS
                </div>
                {otherAssets.map((a) => (
                  <div
                    key={a.id}
                    style={{
                      padding: "8px 0",
                      borderBottom: `1px solid ${SEP}`,
                      fontSize: 13,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                      <Pill label={a.assetType} color={GOLD} />
                      <div style={{ flex: 1 }}>
                        <span style={{ color: TEXT, fontWeight: 600 }}>{a.name}</span>
                        {a.address ? (
                          <div style={{ marginTop: 2, fontSize: 11, color: MUTED, fontFamily: "monospace" }}>
                            {a.address}
                          </div>
                        ) : (
                          <div style={{ fontSize: 11, color: SUBTLE, fontStyle: "italic", marginTop: 2 }}>
                            Address: Not provided
                          </div>
                        )}
                        {a.chain && (
                          <div style={{ fontSize: 11, color: SUBTLE, marginTop: 1 }}>
                            {a.chain}{a.network ? ` / ${a.network}` : ""}
                          </div>
                        )}
                        <div style={{ fontSize: 11, color: SUBTLE, marginTop: 1 }}>
                          Admin/Owner:{" "}
                          {mappedOwnerDisplay(a, resolvedOwnerFindings, unresolvedOwnerFindings)}
                          <span> - Role: {assetRoleLabel(a)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Frontend assets */}
            {frontendAssets.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, color: SUBTLE, letterSpacing: "0.08em", marginBottom: 6 }}>
                  FRONTEND / INTERFACE
                </div>
                {frontendAssets.map((a) => (
                  <div key={a.id} style={{ fontSize: 13, color: MUTED, padding: "4px 0", borderBottom: `1px solid ${SEP}` }}>
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

            {activeAssets.length === 0 && (
              <EmptyState text="No mapped public assets. Add contract or frontend assets in the Project Map to populate scope." />
            )}
          </ReportSection>

          {/* ═══════════════════════════════════════════════════════════ */}
          {/* SEVERITY METHODOLOGY                                        */}
          {/* ═══════════════════════════════════════════════════════════ */}
          <ReportSection id="severity-methodology">
            <SectionHeader num={3}>Severity Methodology</SectionHeader>

            <p style={{ fontSize: 13, color: MUTED, margin: "0 0 16px 0", lineHeight: 1.7 }}>
              Severity in this report reflects potential impact to protocol continuity, fund safety,
              and operational control — not confirmed exploitation. Findings represent authority
              surfaces requiring verification. Severity may be revised downward once evidence is
              provided and verified.
            </p>

            <div style={{ display: "grid", gap: 8, marginBottom: 16 }}>
              {([
                { sev: "critical" as AdminFindingSeverity, color: "#EF4444", desc: "Direct fund movement, settlement, or custody authority with no timelock or multisig protection. Immediate risk to assets or protocol operation." },
                { sev: "high" as AdminFindingSeverity, color: "#F97316", desc: "Significant authority surface — upgrade control, oracle authority, or admin role concentration — where verification evidence is absent or incomplete. Blast radius is large; unverified control paths." },
                { sev: "medium" as AdminFindingSeverity, color: "#EAB308", desc: "Authority surface with limited or indirect fund impact, or where partial mitigations exist. Verification recommended to confirm continuity posture." },
                { sev: "low" as AdminFindingSeverity, color: "#22C55E", desc: "Informational or structural finding. Low direct risk but relevant to continuity planning, role documentation, and future audits." },
              ]).map(({ sev, color, desc }) => (
                <div
                  key={sev}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 12,
                    padding: "8px 12px",
                    background: `${color}08`,
                    border: `1px solid ${color}22`,
                    borderRadius: 5,
                  }}
                >
                  <Pill label={sev} color={color} />
                  <span style={{ fontSize: 12, color: MUTED, lineHeight: 1.6 }}>{desc}</span>
                </div>
              ))}
            </div>

            <div
              style={{
                padding: "8px 12px",
                background: "rgba(148,163,184,0.04)",
                borderLeft: "2px solid rgba(148,163,184,0.2)",
                fontSize: 11,
                color: SUBTLE,
                lineHeight: 1.6,
              }}
            >
              High-severity findings represent unverified authority surfaces — not confirmed vulnerabilities.
              Many findings reflect missing evidence rather than confirmed risk. Likelihood and verification
              confidence are factored into severity assignment.
            </div>
          </ReportSection>

          {/* ═══════════════════════════════════════════════════════════ */}
          {/* AUTHORITY FINDINGS                                          */}
          {/* ═══════════════════════════════════════════════════════════ */}
          <ReportSection id="authority-findings" breakBefore>
            <SectionHeader num={4}>Authority Risk Findings</SectionHeader>

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
                      {sev === "high"
                        ? `HIGH-RISK AUTHORITY SURFACES REQUIRING VERIFICATION (${items.length})`
                        : `${sev.toUpperCase()} (${items.length})`}
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
          <ReportSection id="what-this-means">
            <SectionHeader num={5}>What this means</SectionHeader>
            <p style={{ fontSize: 13, color: MUTED, margin: 0, lineHeight: 1.7 }}>
              {whatThisMeansCopy(review, {
                resolvedCount: authorityPathsResolved,
                unresolvedCount: authorityPathsAwaiting,
                totalAssets: activeAssets.length,
                resolvedAssetNames,
                unresolvedAssetNames,
                sharedOwnerAddr,
                sharedOwnerAssetCount,
              })}
            </p>
          </ReportSection>

          <ReportSection id="threat-families" breakBefore>
            <SectionHeader num={6}>Relevant Threat Families</SectionHeader>
            <p style={{ fontSize: 13, color: MUTED, margin: "0 0 14px 0", lineHeight: 1.6 }}>
              Project relevance scores reflect categorical match strength against the case library, not exploit probability.
            </p>

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
                        Project relevance {tf.relevanceScore}
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
                        marginBottom: tf.globalCaseCount === 0 ? 4 : 0,
                      }}
                    >
                      {tf.globalCaseCount === 0 ? (
                        <span>Global coverage: <strong style={{ color: SUBTLE, fontStyle: "italic" }}>Pending</strong></span>
                      ) : (
                        <span>Global cases: <strong style={{ color: TEXT }}>{tf.globalCaseCount}</strong></span>
                      )}
                      <span>Critical (global): <strong style={{ color: tf.criticalCount > 0 ? "#EF4444" : TEXT }}>{tf.criticalCount}</strong></span>
                      <span>Cases catalogued: <strong style={{ color: TEXT }}>{tf.replayValidatedCount}</strong></span>
                    </div>
                    {tf.globalCaseCount === 0 && (
                      <div style={{ fontSize: 11, color: SUBTLE, fontStyle: "italic", marginBottom: 6 }}>
                        Global case coverage pending — relevance is based on project authority surface match, not global case history.
                      </div>
                    )}
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
          <ReportSection id="recommended-controls" breakBefore>
            <SectionHeader num={7}>Recommended Controls</SectionHeader>
            <p style={{ fontSize: 13, color: MUTED, margin: "0 0 14px 0", lineHeight: 1.6 }}>
              Controls remain grouped by asset for remediation tracking. The immediate review gate is to verify the shared owner operating model and resolve Goldoracle authority evidence; the controls below remain missing until supporting policy or governance evidence is submitted.
            </p>

            {controls.length === 0 ? (
              <EmptyState text="No controls generated. Generate controls from authority findings in the Project Map Controls tab." />
            ) : (
              <div style={{ display: "grid", gap: 6 }}>
                {controlGroups.map((group) => (
                  <div key={group.key}>
                    <div
                      style={{
                        fontSize: 10,
                        letterSpacing: "0.1em",
                        color: GOLD,
                        fontWeight: 700,
                        marginBottom: 6,
                        marginTop: 4,
                      }}
                    >
                      {group.label.toUpperCase()}
                    </div>
                    {(["missing", "planned", "implemented", "verified", "not_applicable"] as ProjectControlStatus[])
                      .map((st) => ({ st, items: group.items.filter((c) => c.status === st) }))
                      .filter(({ items }) => items.length > 0)
                      .map(({ st, items }) => (
                        <div key={`${group.key}-${st}`}>
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
                            <ControlRow
                              key={c.id}
                              control={c}
                              displayTitle={resolveControlTitle(c, assets, findings, titleCounts)}
                            />
                          ))}
                        </div>
                      ))}
                  </div>
                ))}
              </div>
            )}
          </ReportSection>

          {/* ═══════════════════════════════════════════════════════════ */}
          {/* VERIFICATION STATUS                                         */}
          {/* ═══════════════════════════════════════════════════════════ */}
          <ReportSection id="verification-status">
            <SectionHeader num={8}>Verification Status</SectionHeader>

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
                label="Controls Verified"
                value={`${verifiedControls.length} / ${controls.length}`}
                color={verifiedControls.length > 0 ? "#22C55E" : TEXT}
              />
              {authorityPathsResolved > 0 && (
                <Stat
                  label="Owner Evidence Observed"
                  value={`${authorityPathsResolved} / ${authorityRootFindings.length}`}
                  color="#22C55E"
                />
              )}
              {authorityRootFindings.length > 0 && (
                <Stat
                  label="Authority Paths Resolved"
                  value={`${authorityPathsResolved} / ${authorityRootFindings.length}`}
                  color={authorityPathsResolved > 0 ? "#22C55E" : TEXT}
                />
              )}
              {authorityRootFindings.length > 0 && (
                <Stat
                  label="Authority Paths Awaiting"
                  value={`${authorityPathsAwaiting} / ${authorityRootFindings.length}`}
                  color={authorityPathsAwaiting > 0 ? GOLD : TEXT}
                />
              )}
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
                  All generated evidence and control checks are verified for current project metadata. This project
                  meets the SCE <em>Defended</em> threshold for the mapped surface.
                </>
              ) : controls.length === 0 ? (
                <>
                  Evidence and control checks have not been generated yet.{" "}
                  <strong style={{ color: TEXT }}>
                    "Defended" status applies only after checks are generated and verified.
                  </strong>
                </>
              ) : (
                <>
                  {verifiedControls.length} of {controls.length} evidence and control checks verified ({controlCoverage}% coverage).{" "}
                  <strong style={{ color: TEXT }}>
                    "Defended" status applies only when all checks are verified against current
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
            <SectionHeader num={9}>Next Actions</SectionHeader>
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
              marginTop: 8,
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr auto",
                gap: 8,
                fontSize: 11,
                color: SUBTLE,
                marginBottom: 10,
              }}
            >
              <span>
                SCE Public-Surface Defense Review · {review.projectName} · {fmtDate(review.updatedAt)}
              </span>
              <span>Report Status: {REPORT_STATUS_LABEL[review.reportStatus] ?? review.reportStatus}</span>
            </div>
            <div
              style={{
                fontSize: 10,
                color: `${SUBTLE}99`,
                lineHeight: 1.6,
                borderTop: `1px solid ${SEP}`,
                paddingTop: 10,
              }}
            >
              <strong style={{ color: SUBTLE, letterSpacing: "0.06em" }}>CONFIDENTIAL.</strong>{" "}
              This report is prepared solely for the addressee and is intended only for the
              internal use of the recipient. The findings and recommendations contained herein
              are based on publicly available information and represent SCE&apos;s analysis as
              of the date of issue. SCE does not hold custody of any project assets, private
              keys, or signing credentials. Distribution or reproduction of this report without
              written consent from Sagitta Continuity Engine (SCE) is prohibited.
            </div>
          </div>

          {/* ── Bottom nav (no-print) ─────────────────────────────── */}
          <div
            className="no-print"
            style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 24 }}
          >
            <NavChip href={`/dashboard/defense-review/${review.id}`} label="← Defense Review" />
            <NavChip href={`/dashboard/project-map?project=${review.projectId}`} label="Project Map" />
            <NavChip href={`/dashboard/project-map?project=${review.projectId}&tab=controls`} label="Controls" />
            <NavChip href="/dashboard/threat-matrix" label="Threat Matrix" />
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
  const assetAddr = finding.evidence?.assetAddress as string | undefined;
  const adminAddr = finding.evidence?.adminAddress as string | undefined;
  const role = finding.evidence?.role as string | undefined;
  const evidenceSource = finding.evidence?.evidenceSource as string | undefined;
  const currentEvidenceStatus = finding.evidence?.currentEvidenceStatus as string | undefined;
  const detectionMethod = finding.evidence?.detectionMethod as string | undefined;
  const detectionResult = finding.evidence?.detectionResult as string | undefined;
  const confidence = finding.evidence?.confidence as string | undefined;
  const ownerEvidenceConfidence = finding.evidence?.ownerEvidenceConfidence as string | undefined;
  const controlVerification = finding.evidence?.controlVerification as string | undefined;
  const adminOwnerStatus = finding.evidence?.adminOwnerStatus as string | undefined;
  const notes = finding.evidence?.notes;
  const noteLines = Array.isArray(notes) ? notes.filter((item): item is string => typeof item === "string" && item.length > 0) : [];
  const isConcentration = finding.findingType === "role_concentration";
  const affectedNames = [
    ...evidenceAssetNames(finding.evidence?.assetsAffected),
    ...evidenceAssetNames(finding.evidence?.controlledAssets),
  ].filter((name, index, all) => all.indexOf(name) === index);
  const adminDisplay = adminAddr
    ?? adminOwnerStatus
    ?? (confidence === "evidence_required"
      ? <em>Evidence required</em>
      : confidence === "unresolved"
        ? <em>Unresolved</em>
        : confidence === "error"
          ? <em>Detection error</em>
          : currentEvidenceStatus
            ? <em>Evidence required</em>
            : <em>Not detected</em>);

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

      {/* Current evidence status */}
      <div style={{ marginBottom: 6 }}>
        <div style={{ fontSize: 10, color: MUTED, letterSpacing: "0.08em", marginBottom: 3 }}>
          CURRENT EVIDENCE STATUS
        </div>
        <ul style={{ margin: 0, paddingLeft: 16, display: "grid", gap: 1 }}>
          <li style={{ fontSize: 11, color: SUBTLE, lineHeight: 1.5 }}>
            Source: {evidenceSource ?? "Submitted project metadata + scanner analysis"}
          </li>
          {isConcentration ? (
            <>
              <li style={{ fontSize: 11, color: SUBTLE, lineHeight: 1.5 }}>
                Assets affected: {affectedNames.join(", ")}
              </li>
              <li style={{ fontSize: 11, color: SUBTLE, lineHeight: 1.5 }}>
                Shared owner: {adminAddr ?? <em>Not provided</em>}
              </li>
              {ownerEvidenceConfidence && (
                <li style={{ fontSize: 11, color: SUBTLE, lineHeight: 1.5 }}>
                  Owner Evidence Confidence: {ownerEvidenceConfidence}
                </li>
              )}
              {controlVerification && (
                <li style={{ fontSize: 11, color: SUBTLE, lineHeight: 1.5 }}>
                  Control Verification: {controlVerification}
                </li>
              )}
            </>
          ) : (
            <li style={{ fontSize: 11, color: SUBTLE, lineHeight: 1.5 }}>
              Contract address: {assetAddr ?? <em>Not provided</em>}
            </li>
          )}
          {detectionMethod && (
            <li style={{ fontSize: 11, color: SUBTLE, lineHeight: 1.5 }}>
              Detection Method: {detectionMethod}
            </li>
          )}
          {(detectionResult || currentEvidenceStatus) && (
            <li style={{ fontSize: 11, color: SUBTLE, lineHeight: 1.5 }}>
              Detection Result: {detectionResult ?? currentEvidenceStatus}
            </li>
          )}
          {confidence && (
            <li style={{ fontSize: 11, color: SUBTLE, lineHeight: 1.5 }}>
              Confidence: {confidence}
            </li>
          )}
          {noteLines.map((note, i) => (
            <li key={`note-${i}`} style={{ fontSize: 11, color: SUBTLE, lineHeight: 1.5 }}>
              Note: {note}
            </li>
          ))}
          {!isConcentration && (
            <li style={{ fontSize: 11, color: SUBTLE, lineHeight: 1.5 }}>
              Admin/Owner: {adminDisplay}
            </li>
          )}
          {role && (
            <li style={{ fontSize: 11, color: SUBTLE, lineHeight: 1.5 }}>Role: {role}</li>
          )}
        </ul>
      </div>

      {isRoleAware ? (
        <>
          {evidenceRequired.length > 0 && (
            <div style={{ marginTop: 4, marginBottom: 4 }}>
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

function ControlRow({ control, displayTitle }: { control: ProjectControl; displayTitle: string }) {
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
        <span style={{ fontSize: 13, fontWeight: 600, color: TEXT }}>{displayTitle}</span>
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
