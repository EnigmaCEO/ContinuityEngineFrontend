import React from "react";
import { Document, Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";

import type { DefenseReview, DefenseReviewStatus } from "@/lib/defense-review/types";
import type {
  AdminFindingSeverity,
  AdminFindingType,
  AdminSurfaceFinding,
  Project,
  ProjectAsset,
  ProjectControl,
  ProjectControlStatus,
  ProjectRelevance,
} from "@/lib/project-map/types";

// ─── Palette ────────────────────────────────────────────────────────────────
const BG = "#0A0C12";
const SURFACE = "#0F1219";
const CARD = "#121720";
const GOLD = "#D4AF37";
const GOLD_DIM = "#9A7D28";
const SEP = "#1C2030";
const TEXT = "#E2E8F0";
const MUTED = "#8892A4";
const SUBTLE = "#505C70";
const RED = "#EF4444";
const ORANGE = "#F97316";
const YELLOW = "#EAB308";
const GREEN = "#22C55E";
const BLUE = "#3B82F6";

// ─── Lookup tables ───────────────────────────────────────────────────────────
const SEV_COLOR: Record<AdminFindingSeverity, string> = {
  critical: RED, high: ORANGE, medium: YELLOW, low: GREEN,
};

const CTRL_COLOR: Record<ProjectControlStatus, string> = {
  missing: RED, planned: ORANGE, implemented: BLUE, verified: GREEN, not_applicable: SUBTLE,
};

const CTRL_LABEL: Record<ProjectControlStatus, string> = {
  missing: "MISSING", planned: "PLANNED", implemented: "IMPLEMENTED",
  verified: "VERIFIED", not_applicable: "N/A",
};

const FINDING_LABEL: Partial<Record<AdminFindingType, string>> = {
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
  treasury_movement_authority: "Treasury Movement Authority",
  treasury_allocation_authority: "Treasury Allocation Authority",
  treasury_emergency_freeze: "Treasury Emergency Freeze",
  treasury_role_concentration: "Treasury Role Concentration",
  treasury_timelock_required: "Treasury Timelock Required",
  vault_deposit_withdrawal_authority: "Vault Deposit/Withdrawal Authority",
  vault_lock_parameter_authority: "Vault Lock Parameter Authority",
  vault_pause_authority: "Vault Pause Authority",
  vault_upgrade_authority: "Vault Upgrade Authority",
  vault_timelock_required: "Vault Timelock Required",
  escrow_settlement_authority: "Escrow Settlement Authority",
  escrow_batch_finalization: "Escrow Batch Finalization",
  escrow_fund_routing: "Escrow Fund Routing",
  escrow_keeper_dependency: "Escrow Keeper Dependency",
  escrow_role_concentration: "Escrow Role Concentration",
  reserve_custody_authority: "Reserve Custody Authority",
  reserve_rebalance_authority: "Reserve Rebalance Authority",
  reserve_insurance_parameter: "Reserve Insurance Parameter",
  reserve_role_concentration: "Reserve Role Concentration",
  oracle_price_feed_authority: "Oracle Price Feed Authority",
  oracle_stale_price_risk: "Oracle Stale Price Risk",
  oracle_fallback_authority: "Oracle Fallback Authority",
  oracle_update_authority: "Oracle Update Authority",
  oracle_manipulation_risk: "Oracle Manipulation Risk",
  keeper_trigger_authority: "Keeper Trigger Authority",
  keeper_execution_authority: "Keeper Execution Authority",
  keeper_failure_behavior: "Keeper Failure Behavior",
  keeper_continuity_risk: "Keeper Continuity Risk",
};

const REVIEW_STATUS_LABEL: Record<DefenseReviewStatus, string> = {
  draft: "Draft", in_review: "In Review", report_ready: "Report Ready",
  delivered: "Delivered", closed: "Closed",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
function fmtDate(v?: string | null): string {
  if (!v) return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function fmtDateShort(v?: string | null): string {
  if (!v) return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
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
    review.lastScanAt
    || review.scanStatus !== "not_run"
    || review.scanChainsConfigured.length > 0
    || review.scanChainsUnconfigured.length > 0
    || review.scanNotes
    || review.detectorRunCount > 0,
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
    roleForAsset(directAsset)
    ?? roleForAsset(findingAsset)
    ?? normalizeControlRole(evidenceRole)
    ?? normalizeControlRole(control.sourceFindingType ?? undefined)
    ?? normalizeControlRole(control.controlKey)
    ?? normalizeControlRole(control.title)
    ?? "general"
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
  const owner = (resolved?.evidence as Record<string, unknown> | undefined)?.adminAddress;
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

function evidenceRequired(finding: AdminSurfaceFinding): string[] {
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

function remediation(finding: AdminSurfaceFinding): string {
  for (const act of finding.recommendedActions) {
    if (act.startsWith("Recommended remediation: ")) return act.slice("Recommended remediation: ".length);
    if (act.startsWith("Remediation: ")) return act.slice("Remediation: ".length);
  }
  return "";
}

// Returns an asset-specific control title when duplicates exist across assets
function resolveControlTitle(
  control: ProjectControl,
  assets: ProjectAsset[],
  findings: AdminSurfaceFinding[],
  titleCounts: Map<string, number>,
): string {
  if ((titleCounts.get(control.title) ?? 0) <= 1) return control.title;
  // Try assetId on the control first (most direct)
  const assetId = control.assetId ?? (() => {
    const f = findings.find((x) => x.id === (control.findingId ?? ""));
    return f?.assetId ?? null;
  })();
  const asset = assetId ? assets.find((a) => a.id === assetId) : undefined;
  const role = asset
    ? ((asset.metadata?.role as string | undefined) ?? asset.name)
    : null;
  if (!role) return control.title;
  // Replace generic "all admin/owner" phrase with asset-specific label
  const generic = /\ball\s+(admin\/owner|admin|owner)\b/i;
  if (generic.test(control.title)) {
    return control.title.replace(generic, `${role} admin/owner`);
  }
  return `${control.title} — ${role}`;
}

function buildNextActions(
  findings: AdminSurfaceFinding[],
  controls: ProjectControl[],
  opts?: { sharedOwnerAddr?: string; unresolvedAssetNames?: string[] },
): string[] {
  const actions: string[] = [];
  const missing = controls.filter((c) => c.status === "missing");
  const unverified = controls.filter((c) => c.status !== "verified" && c.status !== "not_applicable");
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
  const roleList = affectedRoles.length > 0
    ? affectedRoles.join(", ")
    : "treasury, vault, escrow, reserve, and oracle";

  if (opts?.sharedOwnerAddr) {
    actions.push(`Confirm that ${opts.sharedOwnerAddr} is an EOA, multisig, timelock, or governed contract — this address controls the resolved authority paths and is the primary continuity risk.`);
    actions.push("Provide the signer policy, threshold, delay windows, and emergency procedure for the shared owner address.");
  }

  if (opts?.unresolvedAssetNames && opts.unresolvedAssetNames.length > 0) {
    const unresolvedList = opts.unresolvedAssetNames.join(", ");
    actions.push(`Resolve authority paths for ${unresolvedList} — standard public interfaces did not return a valid owner or admin address.`);
  }

  actions.push("Submit or confirm the mapped asset inventory — verify all contracts, proxies, oracles, and keepers are represented in the Project Map.");
  actions.push("Submit source/ABI or admin/owner evidence for unresolved assets.");
  actions.push("Provide multisig/timelock details where applicable, including signer policy, threshold, and delay windows.");
  actions.push(`Verify authority paths for: ${roleList}.`);
  actions.push("Document role separation and emergency procedures for each authority surface.");

  if (missing.length > 0) {
    actions.push(`Attach or link policy evidence for ${missing.length} evidence and control check${missing.length > 1 ? "s" : ""} currently marked as Missing.`);
  } else if (unverified.length > 0) {
    actions.push(`Attach or link policy evidence for ${unverified.length} outstanding evidence and control check${unverified.length > 1 ? "s" : ""}.`);
  } else {
    actions.push("Attach or link policy evidence for any outstanding evidence and control checks.");
  }

  if (crit.length > 0) {
    actions.push(`Address ${crit.length} critical authority surface${crit.length > 1 ? "s" : ""} — these require immediate attention before deployment or continued operation.`);
  }
  if (findings.some((f) => f.findingType === "missing_timelock")) {
    actions.push("Implement upgrade timelocks to provide a governance review window before upgrades take effect.");
  }
  if (findings.some((f) => f.findingType === "owner_eoa")) {
    actions.push("Transition owner accounts from EOA to multisig or timelocked governance.");
  }
  if (findings.some((f) => f.findingType === "role_concentration" || f.findingType.includes("role_concentration"))) {
    actions.push("Distribute concentrated admin roles across separate key holders or governance contracts.");
  }

  actions.push("Re-run SCE Admin Surface Scan after submitting evidence to refresh findings and authority path verification.");
  actions.push(
    `Generate updated report with verified-control coverage. Current status: ${verified.length} of ${controls.length} evidence and control check${controls.length !== 1 ? "s" : ""} verified.`,
  );

  return actions.slice(0, 6);
}

// ─── StyleSheet ───────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  // Pages
  coverPage: { backgroundColor: BG, padding: 0 },
  page: {
    backgroundColor: BG,
    paddingTop: 66,
    paddingBottom: 50,
    paddingHorizontal: 50,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: TEXT,
  },

  // Fixed header (on every content page)
  header: {
    position: "absolute",
    top: 0, left: 0, right: 0,
    height: 52,
    backgroundColor: SURFACE,
    borderBottomWidth: 1,
    borderBottomColor: SEP,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 36,
  },
  headerLogo: { width: 20, height: 20, marginRight: 10 },
  headerTitle: { flex: 1, fontSize: 7.5, color: MUTED, letterSpacing: 0.6 },
  headerBadge: {
    backgroundColor: "#1A160A",
    borderWidth: 1,
    borderColor: `${GOLD}55`,
    borderRadius: 2,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  headerBadgeText: { fontSize: 6.5, fontFamily: "Helvetica-Bold", color: GOLD, letterSpacing: 1.4 },

  // Fixed footer
  footer: {
    position: "absolute",
    bottom: 0, left: 0, right: 0,
    height: 36,
    backgroundColor: SURFACE,
    borderTopWidth: 1,
    borderTopColor: SEP,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 36,
    justifyContent: "space-between",
  },
  footerText: { fontSize: 7, color: SUBTLE },

  // Section heading
  sectionHeading: {
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: SEP,
    marginBottom: 14,
  },
  sectionNum: { fontSize: 11, fontFamily: "Helvetica-Bold", color: GOLD, marginRight: 8 },
  sectionTitle: { fontSize: 11, fontFamily: "Helvetica-Bold", color: TEXT, letterSpacing: 1.1 },

  // Stat grid
  statRow: { flexDirection: "row", marginBottom: 14 },
  statCard: {
    flex: 1,
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: SEP,
    borderRadius: 4,
    padding: "9 12",
    marginRight: 8,
  },
  statLabel: { fontSize: 6.5, fontFamily: "Helvetica-Bold", color: SUBTLE, letterSpacing: 1, marginBottom: 4 },
  statValue: { fontSize: 20, fontFamily: "Helvetica-Bold", color: TEXT, lineHeight: 1 },

  // Callout box
  callout: {
    borderRadius: 4,
    padding: "10 14",
    marginBottom: 14,
  },
  calloutLabel: { fontSize: 7, fontFamily: "Helvetica-Bold", letterSpacing: 1.2, marginBottom: 3 },
  calloutText: { fontSize: 9.5, color: TEXT },

  // Body text
  body: { fontSize: 9.5, color: MUTED, lineHeight: 1.65, marginBottom: 10 },

  // Meta row
  metaRow: { flexDirection: "row", marginBottom: 6 },
  metaLabel: { fontSize: 8.5, color: SUBTLE, width: 90, flexShrink: 0 },
  metaValue: { fontSize: 8.5, color: TEXT, flex: 1 },

  // Pill/badge
  pill: { borderRadius: 2, paddingHorizontal: 5, paddingVertical: 2, marginRight: 5 },
  pillText: { fontSize: 6.5, fontFamily: "Helvetica-Bold", letterSpacing: 0.8 },

  // Finding block
  findingBlock: {
    backgroundColor: CARD,
    borderRadius: 4,
    padding: "9 12",
    marginBottom: 7,
  },
  findingHeader: { flexDirection: "row", alignItems: "flex-start", marginBottom: 5, flexWrap: "wrap" },
  findingTitle: { fontSize: 9.5, fontFamily: "Helvetica-Bold", color: TEXT, flex: 1 },
  findingSummary: { fontSize: 8.5, color: MUTED, lineHeight: 1.55, marginBottom: 5 },
  findingSubLabel: { fontSize: 7, fontFamily: "Helvetica-Bold", color: MUTED, letterSpacing: 0.8, marginBottom: 3 },
  findingSubText: { fontSize: 8, color: SUBTLE, lineHeight: 1.5 },

  // Control block
  controlBlock: {
    backgroundColor: CARD,
    borderRadius: 4,
    padding: "8 12",
    marginBottom: 6,
  },
  controlHeader: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  controlTitle: { fontSize: 9.5, fontFamily: "Helvetica-Bold", color: TEXT, flex: 1 },
  controlDesc: { fontSize: 8.5, color: MUTED, lineHeight: 1.5 },
  controlVerified: { fontSize: 8, color: GREEN, fontFamily: "Helvetica-Bold", marginTop: 3 },

  // Threat block
  threatBlock: {
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: SEP,
    borderRadius: 4,
    padding: "10 14",
    marginBottom: 8,
  },
  threatHeader: { flexDirection: "row", alignItems: "flex-start", marginBottom: 5 },
  threatName: { flex: 1, fontSize: 10, fontFamily: "Helvetica-Bold", color: TEXT },
  threatScore: { fontSize: 8, color: SUBTLE },
  threatWhy: { fontSize: 8.5, color: MUTED, lineHeight: 1.55, marginBottom: 6 },
  threatStats: { flexDirection: "row", marginBottom: 6 },
  threatStat: { fontSize: 8, color: SUBTLE, marginRight: 16 },

  // TOC row
  tocRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: SEP,
  },
  tocNum: { fontSize: 14, fontFamily: "Helvetica-Bold", color: GOLD, width: 36 },
  tocTitle: { flex: 1, fontSize: 12, color: TEXT },

  // Separator
  divider: { height: 1, backgroundColor: SEP, marginVertical: 14 },
});

// ─── Public data interface ────────────────────────────────────────────────────
export interface DefenseReviewReportData {
  review: DefenseReview;
  project: Project | null;
  assets: ProjectAsset[];
  findings: AdminSurfaceFinding[];  // already filtered to open
  controls: ProjectControl[];
  relevance: ProjectRelevance | null;
  logoPath: string;
}

// ─── Reusable micro-components ────────────────────────────────────────────────
function Pill({ label, color }: { label: string; color: string }) {
  return (
    <View style={[S.pill, { backgroundColor: `${color}1A`, borderWidth: 1, borderColor: `${color}44` }]}>
      <Text style={[S.pillText, { color }]}>{label.toUpperCase()}</Text>
    </View>
  );
}

function SevPill({ severity }: { severity: AdminFindingSeverity }) {
  return <Pill label={severity} color={SEV_COLOR[severity]} />;
}

function MetaLine({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <View style={S.metaRow}>
      <Text style={S.metaLabel}>{label}:</Text>
      <Text style={[S.metaValue, valueColor ? { color: valueColor } : {}]}>{value}</Text>
    </View>
  );
}

function SectionHeading({ num, title }: { num: number; title: string }) {
  return (
    <View style={S.sectionHeading}>
      <Text style={S.sectionNum}>{String(num).padStart(2, "0")}</Text>
      <Text style={S.sectionTitle}>{title.toUpperCase()}</Text>
    </View>
  );
}

function StatGrid({ stats }: { stats: Array<{ label: string; value: string | number; color?: string }> }) {
  return (
    <View style={S.statRow}>
      {stats.map((s, i) => (
        <View key={i} style={[S.statCard, i === stats.length - 1 ? { marginRight: 0 } : {}]}>
          <Text style={S.statLabel}>{s.label.toUpperCase()}</Text>
          <Text style={[S.statValue, s.color ? { color: s.color } : {}]}>{String(s.value)}</Text>
        </View>
      ))}
    </View>
  );
}

// ─── Header & Footer (fixed, appear on every page) ───────────────────────────
function PageHeader({ logoPath, projectName }: { logoPath: string; projectName: string }) {
  return (
    <View style={S.header} fixed>
      <Image src={logoPath} style={S.headerLogo} />
      <Text style={S.headerTitle}>
        PUBLIC-SURFACE DEFENSE REVIEW · {projectName.toUpperCase()}
      </Text>
      <View style={S.headerBadge}>
        <Text style={S.headerBadgeText}>CONFIDENTIAL</Text>
      </View>
    </View>
  );
}

function PageFooter({ projectName, date }: { projectName: string; date: string }) {
  return (
    <View style={S.footer} fixed>
      <Text style={S.footerText}>{projectName} · {date}</Text>
      <Text style={S.footerText}>Sagitta Continuity Engine (SCE)</Text>
      <Text
        style={S.footerText}
        render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
      />
    </View>
  );
}

// ─── Cover Page ───────────────────────────────────────────────────────────────
function CoverPage({ data }: { data: DefenseReviewReportData }) {
  const { review, project, logoPath } = data;
  const critCount = data.findings.filter((f) => f.severity === "critical").length;
  const highCount = data.findings.filter((f) => f.severity === "high").length;
  const riskColor = critCount > 0 ? RED : highCount > 0 ? ORANGE : GREEN;
  const riskLabel = critCount > 0 ? "CRITICAL RISK" : highCount > 0 ? "HIGH RISK" : "UNDER REVIEW";
  const isSampleReport = review.projectName.toLowerCase().includes("sagitta protocol");
  const concentrationFinding = data.findings.find((f) => f.findingType === "role_concentration");
  const concentrationEvidence = concentrationFinding?.evidence as Record<string, unknown> | undefined;
  const concentrationNames = [
    ...evidenceAssetNames(concentrationEvidence?.assetsAffected),
    ...evidenceAssetNames(concentrationEvidence?.controlledAssets),
  ].filter((name, index, all) => all.indexOf(name) === index);
  const coverRiskLine = concentrationNames.length >= 2
    ? `Shared owner concentration across ${concentrationNames.length} assets requires verification.`
    : critCount > 0
      ? `${critCount} critical authority surface${critCount > 1 ? "s" : ""} require immediate attention.`
      : highCount > 0
        ? `${highCount} high-risk authority surface${highCount > 1 ? "s" : ""} require verification.`
        : `${data.findings.length} finding${data.findings.length !== 1 ? "s" : ""} recorded. Review in progress.`;

  return (
    <Page size="A4" style={S.coverPage}>
      {/* Top gold accent bar */}
      <View style={{ height: 5, backgroundColor: GOLD }} />

      <View style={{ flex: 1, paddingHorizontal: 60, paddingTop: 72, paddingBottom: 56, flexDirection: "column" }}>

        {/* Logo + wordmark */}
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 72 }}>
          <Image src={logoPath} style={{ width: 54, height: 54, marginRight: 18 }} />
          <View>
            <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 22, color: GOLD, letterSpacing: 2.5 }}>SCE</Text>
            <Text style={{ fontSize: 8, color: MUTED, letterSpacing: 2.4, marginTop: 2 }}>SAGITTA CONTINUITY ENGINE</Text>
          </View>
          {/* Confidential badge top right */}
          <View style={{ flex: 1 }} />
          <View style={{ borderWidth: 1, borderColor: `${GOLD}55`, borderRadius: 2, paddingHorizontal: 8, paddingVertical: 4, backgroundColor: "#14110A" }}>
            <Text style={{ fontSize: 7, fontFamily: "Helvetica-Bold", color: GOLD, letterSpacing: 1.8 }}>CONFIDENTIAL</Text>
          </View>
        </View>

        {/* Report type label */}
        <Text style={{ fontSize: 8.5, color: `${GOLD}88`, letterSpacing: 3.5, marginBottom: 14 }}>
          PUBLIC-SURFACE DEFENSE REVIEW REPORT
        </Text>

        {isSampleReport ? (
          <View style={{ borderWidth: 1, borderColor: `${GOLD}66`, backgroundColor: "#14110A", padding: "10 12", marginBottom: 18 }}>
            <Text style={{ fontSize: 8.5, fontFamily: "Helvetica-Bold", color: GOLD, letterSpacing: 1.4, marginBottom: 4 }}>
              SAMPLE — STRUCTURE DEMONSTRATION
            </Text>
            <Text style={{ fontSize: 8, color: MUTED }}>
              Demo report using Sagitta Protocol testnet deployment. Not a verified client result.
            </Text>
          </View>
        ) : null}

        {/* Gold accent line */}
        <View style={{ width: 56, height: 2, backgroundColor: GOLD, borderRadius: 1, marginBottom: 20 }} />

        {/* Project name */}
        <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 34, color: TEXT, lineHeight: 1.15, marginBottom: 10 }}>
          {review.projectName}
        </Text>

        {/* Prepared by line */}
        <Text style={{ fontSize: 10, color: MUTED, marginBottom: 52 }}>
          Prepared by Sagitta Continuity Engine (SCE) · {fmtDate(review.updatedAt)}
        </Text>

        {/* Risk posture banner */}
        <View style={[S.callout, { borderLeftWidth: 4, borderLeftColor: riskColor, backgroundColor: `${riskColor}0D`, borderRadius: 0, marginBottom: 28 }]}>
          <Text style={[S.calloutLabel, { color: riskColor }]}>RISK POSTURE — {riskLabel}</Text>
          <Text style={[S.calloutText, { fontSize: 9 }]}>
            {coverRiskLine}
          </Text>
        </View>

        {/* Metadata card */}
        <View style={{ backgroundColor: SURFACE, borderWidth: 1, borderColor: SEP, borderRadius: 5, padding: "16 20", marginBottom: 36 }}>
          <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
            {[
              { label: "REVIEW ID", value: review.id },
              { label: "STATUS", value: REVIEW_STATUS_LABEL[review.status] },
              { label: "DATE ISSUED", value: fmtDate(review.updatedAt) },
              { label: "ENVIRONMENT", value: project?.environment?.toUpperCase() ?? "—" },
              { label: "ASSETS MAPPED", value: String(review.assetsCount) },
              { label: "OPEN FINDINGS", value: String(data.findings.length) },
            ].map((m, i) => (
              <View key={i} style={{ width: "50%", marginBottom: 12 }}>
                <Text style={{ fontSize: 7, color: SUBTLE, letterSpacing: 1, marginBottom: 3 }}>{m.label}</Text>
                <Text style={{ fontSize: 9, fontFamily: "Helvetica-Bold", color: TEXT }}>{m.value}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Spacer */}
        <View style={{ flex: 1 }} />

        {/* Confidentiality notice */}
        <View style={{ borderTopWidth: 1, borderTopColor: SEP, paddingTop: 16 }}>
          <Text style={{ fontSize: 7.5, fontFamily: "Helvetica-Bold", color: GOLD, letterSpacing: 1, marginBottom: 5 }}>
            CONFIDENTIAL — FOR ADDRESSEE ONLY
          </Text>
          <Text style={{ fontSize: 7.5, color: SUBTLE, lineHeight: 1.65 }}>
            This report is prepared solely for the addressee and is intended only for the internal use of the named recipient. The findings and recommendations are based on publicly available information and represent SCE's analysis as of the date of issue. SCE does not hold custody of any project assets, private keys, or signing credentials. Distribution or reproduction without written consent from Sagitta Continuity Engine (SCE) is prohibited.
          </Text>
        </View>
      </View>

      {/* Bottom gold bar */}
      <View style={{ height: 4, backgroundColor: GOLD_DIM }} />
    </Page>
  );
}

// ─── Table of Contents Page ───────────────────────────────────────────────────
const TOC_ENTRIES = [
  { num: 1, title: "Executive Summary" },
  { num: 2, title: "Review Scope" },
  { num: 3, title: "Severity Methodology" },
  { num: 4, title: "Authority Risk Findings" },
  { num: 5, title: "What this means" },
  { num: 6, title: "Relevant Threat Families" },
  { num: 7, title: "Recommended Controls" },
  { num: 8, title: "Verification Status" },
  { num: 9, title: "Next Actions" },
];

function TocPage({ data }: { data: DefenseReviewReportData }) {
  const { review, logoPath } = data;
  return (
    <Page size="A4" style={S.page}>
      <PageHeader logoPath={logoPath} projectName={review.projectName} />
      <PageFooter projectName={review.projectName} date={fmtDateShort(review.updatedAt)} />

      <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 20, color: TEXT, marginBottom: 6 }}>
        Table of Contents
      </Text>
      <Text style={{ fontSize: 9, color: MUTED, marginBottom: 22 }}>
        {review.projectName} · Public-Surface Defense Review · {fmtDate(review.updatedAt)}
      </Text>

      <View style={{ height: 1, backgroundColor: GOLD, marginBottom: 24, width: 40 }} />

      {TOC_ENTRIES.map((entry) => (
        <View key={entry.num} style={S.tocRow}>
          <Text style={S.tocNum}>{String(entry.num).padStart(2, "0")}</Text>
          <Text style={S.tocTitle}>{entry.title}</Text>
          <View style={{ borderBottomWidth: 1, borderBottomColor: SEP, flex: 1, height: 0, alignSelf: "center", marginHorizontal: 10 }} />
          <Text style={{ fontSize: 8, color: SUBTLE }}>§ {String(entry.num).padStart(2, "0")}</Text>
        </View>
      ))}

      {/* Report summary line */}
      <View style={{ marginTop: 32, padding: "12 16", backgroundColor: SURFACE, borderRadius: 4, borderLeftWidth: 3, borderLeftColor: GOLD }}>
        <Text style={{ fontSize: 8, color: MUTED, lineHeight: 1.6 }}>
          This report covers <Text style={{ color: TEXT, fontFamily: "Helvetica-Bold" }}>{data.findings.length} open finding{data.findings.length !== 1 ? "s" : ""}</Text>, {" "}
          <Text style={{ color: TEXT, fontFamily: "Helvetica-Bold" }}>{data.relevance?.relevantThreatFamilies.length ?? 0} relevant threat famil{(data.relevance?.relevantThreatFamilies.length ?? 0) !== 1 ? "ies" : "y"}</Text>, and {" "}
          <Text style={{ color: TEXT, fontFamily: "Helvetica-Bold" }}>{data.controls.length} evidence and control check{data.controls.length !== 1 ? "s" : ""}</Text> across{" "}
          <Text style={{ color: TEXT, fontFamily: "Helvetica-Bold" }}>{data.assets.filter((a) => a.status !== "archived").length} mapped asset{data.assets.length !== 1 ? "s" : ""}</Text>.
        </Text>
      </View>
    </Page>
  );
}

// ─── Content page (all sections, react-pdf paginates automatically) ───────────
function ContentPage({ data }: { data: DefenseReviewReportData }) {
  const { review, project, assets, findings, controls, relevance, logoPath } = data;
  const date = fmtDateShort(review.updatedAt);

  const openFindings = findings; // already filtered server-side
  const critCount = openFindings.filter((f) => f.severity === "critical").length;
  const highCount = openFindings.filter((f) => f.severity === "high").length;
  const verifiedControls = controls.filter((c) => c.status === "verified");
  const controlCoverage = controls.length > 0 ? Math.round((verifiedControls.length / controls.length) * 100) : 0;
  const isDefended = verifiedControls.length > 0 && controlCoverage === 100;
  const authorityRoles = new Set(["treasury", "vault", "escrow", "reserve", "oracle"]);
  // Resolved: owner_detected findings with verified confidence (on-chain owner observed)
  const resolvedOwnerFindings = openFindings.filter(
    (f) => f.findingType === "owner_detected" && (f.evidence as Record<string, unknown>)?.confidence === "verified",
  );
  // Unresolved: unknown_admin root authority findings for authority-role assets
  const unresolvedOwnerFindings = openFindings.filter((f) => {
    const role = (f.evidence as Record<string, unknown>)?.role;
    return f.findingType === "unknown_admin" && typeof role === "string" && authorityRoles.has(role);
  });
  const authorityRootFindings = [...resolvedOwnerFindings, ...unresolvedOwnerFindings];
  const authorityPathsResolved = resolvedOwnerFindings.length;
  const authorityPathsAwaiting = unresolvedOwnerFindings.length;

  // Scan aggregation: shared owner and asset name lists
  const concentrationFinding = openFindings.find((f) => f.findingType === "role_concentration");
  const sharedOwnerAddr = (concentrationFinding?.evidence as Record<string, unknown> | undefined)?.adminAddress as string | undefined;
  const concentrationEvidence = concentrationFinding?.evidence as Record<string, unknown> | undefined;
  const concentrationAssetNames = [
    ...evidenceAssetNames(concentrationEvidence?.assetsAffected),
    ...evidenceAssetNames(concentrationEvidence?.controlledAssets),
  ].filter((name, index, all) => all.indexOf(name) === index);
  const sharedOwnerAssetCount = concentrationAssetNames.length;
  const primaryFindingText = concentrationAssetNames.length > 0
    ? `Primary Finding: Shared owner concentration across ${concentrationAssetNames.join(", ")}`
    : undefined;
  const resolvedAssetNames = resolvedOwnerFindings.map((f) => {
    const a = assets.find((asset) => asset.id === f.assetId);
    return a?.name ?? "Unknown";
  });
  const unresolvedAssetNames = unresolvedOwnerFindings.map((f) => {
    const a = assets.find((asset) => asset.id === f.assetId);
    return a?.name ?? "Unknown";
  });

  const activeAssets = assets.filter((a) => a.status !== "archived");
  const contractAssets = activeAssets.filter((a) => a.assetType === "contract" || a.assetType === "proxy");
  const frontendAssets = activeAssets.filter((a) => a.assetType === "frontend");
  const otherAssets = activeAssets.filter(
    (a) => a.assetType !== "contract" && a.assetType !== "proxy" && a.assetType !== "frontend",
  );

  const nextActions = buildNextActions(openFindings, controls, { sharedOwnerAddr, unresolvedAssetNames });
  const scanMetadataAvailable = hasScanMetadata(review);
  const scanStatusText = scanStatusLabel(review.scanStatus);

  const findingsBySev = (["critical", "high", "medium", "low"] as AdminFindingSeverity[])
    .map((sev) => ({
      sev,
      items: openFindings
        .filter((f) => f.severity === sev)
        .sort((a, b) => findingDisplayOrder(a) - findingDisplayOrder(b)),
    }))
    .filter((g) => g.items.length > 0);

  // Build a title-count map to detect duplicates for asset-specific labeling
  const titleCounts = new Map<string, number>();
  for (const c of controls) {
    titleCounts.set(c.title, (titleCounts.get(c.title) ?? 0) + 1);
  }

  const controlGroups = buildControlGroups(controls, assets, openFindings);

  const riskColor = critCount > 0 ? RED : highCount > 0 ? ORANGE : isDefended ? GREEN : GOLD;
  const riskLabel = critCount > 0 ? "CRITICAL RISK" : highCount > 0 ? "HIGH RISK" : isDefended ? "DEFENDED" : "UNDER REVIEW";
  const riskDesc = critCount > 0
    ? `${critCount} critical authority surface${critCount > 1 ? "s" : ""} require immediate attention before deployment.`
    : highCount > 0
      ? `${highCount} high-risk authority surface${highCount > 1 ? "s" : ""} require verification. These are unverified authority surfaces — not confirmed exploitable vulnerabilities.`
      : isDefended
        ? "All controls verified. This project meets the SCE Defended threshold."
        : `Evidence and control verification is ${controlCoverage}% complete. Review in progress.`;

  return (
    <Page size="A4" style={S.page}>
      <PageHeader logoPath={logoPath} projectName={review.projectName} />
      <PageFooter projectName={review.projectName} date={date} />

      {/* ── 01 Executive Summary ────────────────────────────────── */}
      <SectionHeading num={1} title="Executive Summary" />

      <Text style={S.body}>
        This report reflects a public-surface review of{" "}
        <Text style={{ fontFamily: "Helvetica-Bold", color: TEXT }}>{review.projectName}</Text>{" "}
        conducted by Sagitta Continuity Engine (SCE). The analysis covers mapped public assets, authority risk findings derived from the Admin Surface Scanner, relevant global threat families, and recommended evidence and control checks. SCE does not control this project, hold keys, or execute on-chain transactions.
      </Text>
      {primaryFindingText ? (
        <Text style={[S.body, { fontFamily: "Helvetica-Bold", color: TEXT }]}>{primaryFindingText}</Text>
      ) : null}

      {/* Risk posture callout */}
      <View style={[S.callout, { borderLeftWidth: 4, borderLeftColor: riskColor, backgroundColor: `${riskColor}0D`, borderRadius: 0, marginBottom: 14 }]}>
        <Text style={[S.calloutLabel, { color: riskColor }]}>RISK POSTURE — {riskLabel}</Text>
        <Text style={[S.calloutText, { fontSize: 9.5 }]}>{riskDesc}</Text>
      </View>

      {/* Stats — row 1 */}
      <StatGrid stats={[
        { label: "Assets Mapped", value: activeAssets.length || review.assetsCount },
        { label: "Open Findings", value: openFindings.length || review.findingsCount },
        { label: "Critical / High", value: `${critCount} / ${highCount}`, color: critCount > 0 ? RED : highCount > 0 ? ORANGE : TEXT },
      ]} />

      {/* Stats — row 2 */}
      <StatGrid stats={[
        { label: "Threat Families", value: relevance ? relevance.relevantThreatFamilies.length : review.relevantThreatFamiliesCount },
        { label: "Controls", value: controls.length },
        { label: "Controls Verified", value: `${verifiedControls.length} / ${controls.length}`, color: verifiedControls.length > 0 ? GREEN : TEXT },
        { label: "Coverage", value: `${controlCoverage}%`, color: controlCoverage === 100 ? GREEN : controlCoverage > 0 ? GOLD : TEXT },
      ]} />

      {authorityRootFindings.length > 0 ? (
        <StatGrid stats={[
          { label: "Authority Paths Resolved", value: `${authorityPathsResolved} / ${authorityRootFindings.length}`, color: authorityPathsResolved > 0 ? GREEN : TEXT },
          { label: "Awaiting Evidence", value: `${authorityPathsAwaiting} / ${authorityRootFindings.length}`, color: authorityPathsAwaiting > 0 ? GOLD : TEXT },
          { label: "Evidence Checks Verified", value: `${verifiedControls.length} / ${controls.length}`, color: verifiedControls.length > 0 ? GREEN : TEXT },
          ...(review.scanStatus === "partial" || review.scanStatus === "error"
            ? [{ label: "Scan Coverage", value: scanStatusText, color: GOLD }]
            : []),
        ]} />
      ) : null}

      <View style={[S.callout, { backgroundColor: SURFACE, borderWidth: 1, borderColor: SEP, borderRadius: 4 }]}>
        <Text style={[S.calloutLabel, { color: GOLD }]}>SCAN STATUS</Text>
        {scanMetadataAvailable ? (
          <>
            <MetaLine label="Last scan" value={fmtDate(review.lastScanAt)} />
            <MetaLine label="Chains scanned" value={chainListLabel(review.scanChainsConfigured)} />
            <MetaLine label="Assets scanned" value={`${activeAssets.length || review.assetsCount} / ${activeAssets.length || review.assetsCount}`} />
            <MetaLine label="Detector attempts" value={review.detectorRunCount > 0 ? AUTHORITY_DETECTOR_ATTEMPTS : "Not available"} />
            <MetaLine label="Scan status" value={scanStatusText} valueColor={review.scanStatus === "error" || review.scanStatus === "partial" ? GOLD : undefined} />
            <MetaLine label="RPC config" value={review.scanNotes || (review.scanChainsUnconfigured.length > 0 ? `Unconfigured chains: ${chainListLabel(review.scanChainsUnconfigured)}` : "Configured")} />
          </>
        ) : (
          <MetaLine label="Scan status" value="Not available" />
        )}
      </View>

      <View style={S.divider} />

      {/* ── 02 Review Scope ─────────────────────────────────────── */}
      <SectionHeading num={2} title="Review Scope" />

      <View style={[S.callout, { backgroundColor: SURFACE, borderWidth: 1, borderColor: SEP, borderRadius: 4 }]}>
        <Text style={[S.body, { marginBottom: 4 }]}>
          This is a zero-custody public-surface review. SCE analyzes only publicly available metadata: contract addresses, deployment chains, admin surface indicators, and documented protocol configurations. No private keys, signing credentials, mnemonics, or seed phrases are requested or stored at any point.
        </Text>
        <Text style={{ fontSize: 7.5, color: SUBTLE, lineHeight: 1.5 }}>
          Public-surface describes the data reviewed; Confidential describes distribution of this report.
        </Text>
      </View>

      {/* Not an Audit disclaimer */}
      <View style={[S.callout, { borderLeftWidth: 3, borderLeftColor: SUBTLE, backgroundColor: `${SUBTLE}0D`, borderRadius: 0 }]}>
        <Text style={[S.calloutLabel, { color: SUBTLE }]}>NOT AN AUDIT</Text>
        <Text style={[S.calloutText, { fontSize: 8.5 }]}>
          This Defense Review is not a full smart contract audit, formal verification report, penetration test, or economic exploit review. It is a zero-custody authority-surface and continuity-readiness review based on public metadata and submitted evidence.
        </Text>
      </View>

      {project?.description ? (
        <Text style={[S.body, { marginTop: 4 }]}>{project.description}</Text>
      ) : null}

      {/* All mapped assets — contracts/proxies */}
      {contractAssets.length > 0 ? (
        <View style={{ marginBottom: 10 }}>
          <Text style={{ fontSize: 7.5, color: SUBTLE, letterSpacing: 1, fontFamily: "Helvetica-Bold", marginBottom: 6 }}>MAPPED CONTRACTS / PROXIES</Text>
          {contractAssets.map((a) => (
            <View key={a.id} style={{ paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: SEP }}>
              <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
                <Pill label={a.assetType} color={GOLD} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 9, fontFamily: "Helvetica-Bold", color: TEXT }}>{a.name}</Text>
                  <Text style={{ fontSize: 7.5, color: MUTED, fontFamily: "Courier", marginTop: 1 }}>
                    {a.address ?? "Address: Not provided"}
                  </Text>
                  {a.chain ? <Text style={{ fontSize: 7.5, color: SUBTLE, marginTop: 1 }}>{a.chain}{a.network ? ` / ${a.network}` : ""}</Text> : null}
                  <Text style={{ fontSize: 7.5, color: SUBTLE, marginTop: 1 }}>
                    {"Admin/Owner: "}{mappedOwnerDisplay(a, resolvedOwnerFindings, unresolvedOwnerFindings)}{" - Role: "}{assetRoleLabel(a)}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      ) : null}

      {/* Other asset types: oracle, treasury, keeper, etc. */}
      {otherAssets.length > 0 ? (
        <View style={{ marginBottom: 10 }}>
          <Text style={{ fontSize: 7.5, color: SUBTLE, letterSpacing: 1, fontFamily: "Helvetica-Bold", marginBottom: 6 }}>OTHER MAPPED ASSETS</Text>
          {otherAssets.map((a) => (
            <View key={a.id} style={{ paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: SEP }}>
              <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
                <Pill label={a.assetType} color={GOLD} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 9, fontFamily: "Helvetica-Bold", color: TEXT }}>{a.name}</Text>
                  {a.address ? (
                    <Text style={{ fontSize: 7.5, color: MUTED, fontFamily: "Courier", marginTop: 1 }}>{a.address}</Text>
                  ) : (
                    <Text style={{ fontSize: 7.5, color: SUBTLE, marginTop: 1 }}>Address: Not provided</Text>
                  )}
                  {a.chain ? <Text style={{ fontSize: 7.5, color: SUBTLE, marginTop: 1 }}>{a.chain}{a.network ? ` / ${a.network}` : ""}</Text> : null}
                  <Text style={{ fontSize: 7.5, color: SUBTLE, marginTop: 1 }}>
                    {"Admin/Owner: "}{mappedOwnerDisplay(a, resolvedOwnerFindings, unresolvedOwnerFindings)}{" - Role: "}{assetRoleLabel(a)}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      ) : null}

      {/* Frontend assets */}
      {frontendAssets.length > 0 ? (
        <View style={{ marginBottom: 10 }}>
          <Text style={{ fontSize: 7.5, color: SUBTLE, letterSpacing: 1, fontFamily: "Helvetica-Bold", marginBottom: 6 }}>FRONTEND / INTERFACE</Text>
          {frontendAssets.map((a) => (
            <View key={a.id} style={{ paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: SEP }}>
              <Text style={{ fontSize: 9, color: TEXT }}>{a.name}</Text>
              {a.url ? <Text style={{ fontSize: 7.5, color: MUTED, fontFamily: "Courier", marginTop: 1 }}>{a.url}</Text> : null}
            </View>
          ))}
        </View>
      ) : null}

      {activeAssets.length === 0 ? (
        <Text style={{ fontSize: 9, color: SUBTLE, fontStyle: "italic" }}>No mapped public assets recorded.</Text>
      ) : null}

      <View style={S.divider} />

      {/* ── 03 Severity Methodology ───────────────────────────────── */}
      <View>
        <SectionHeading num={3} title="Severity Methodology" />
        <Text style={S.body}>
          Severity in this report reflects potential impact to protocol continuity, fund safety, and operational control — not confirmed exploitation. Findings represent authority surfaces requiring verification; severity may be revised once evidence is provided and verified.
        </Text>
        {([
          { sev: "CRITICAL" as AdminFindingSeverity, desc: "Direct fund movement, settlement, or custody authority with no timelock or multisig protection. Immediate risk to assets or protocol operation." },
          { sev: "HIGH" as AdminFindingSeverity, desc: "Significant authority surface — upgrade control, oracle authority, or admin role concentration — where verification evidence is absent or incomplete. Blast radius is large; unverified control paths." },
          { sev: "MEDIUM" as AdminFindingSeverity, desc: "Authority surface with limited or indirect fund impact, or where partial mitigations exist. Verification is recommended to confirm continuity posture." },
          { sev: "LOW" as AdminFindingSeverity, desc: "Informational or structural finding. Low direct risk but relevant to continuity planning, role documentation, and future audits." },
        ]).map(({ sev, desc }) => (
          <View key={sev} style={{ flexDirection: "row", alignItems: "flex-start", marginBottom: 7 }}>
            <SevPill severity={sev} />
            <Text style={[S.body, { flex: 1, marginBottom: 0, marginLeft: 6, fontSize: 8.5 }]}>{desc}</Text>
          </View>
        ))}
        <View style={[S.callout, { borderLeftWidth: 2, borderLeftColor: SUBTLE, backgroundColor: `${SUBTLE}0D`, borderRadius: 0, marginTop: 6 }]}>
          <Text style={[S.calloutText, { fontSize: 8, color: SUBTLE }]}>
            High-risk authority surfaces in this report represent unverified control paths — not confirmed vulnerabilities. Many findings reflect missing evidence rather than confirmed risk. Likelihood and verification confidence are factored into severity.
          </Text>
        </View>
      </View>

      <View style={S.divider} />

      {/* ── 04 Authority Risk Findings ───────────────────────────── */}
      <View break>
        <SectionHeading num={4} title="Authority Risk Findings" />

        {findingsBySev.length === 0 ? (
          <Text style={{ fontSize: 9, color: SUBTLE, fontStyle: "italic" }}>No open authority risk findings recorded. Run the Admin Surface Scan to identify findings.</Text>
        ) : (
          findingsBySev.map(({ sev, items }) => (
            <View key={sev}>
              <Text style={{ fontSize: 7.5, fontFamily: "Helvetica-Bold", color: SEV_COLOR[sev], letterSpacing: 1.2, marginBottom: 6, marginTop: 4 }}>
                {sev === "high"
                  ? `HIGH-RISK AUTHORITY SURFACES REQUIRING VERIFICATION (${items.length})`
                  : `${sev.toUpperCase()} (${items.length})`}
              </Text>
              {items.map((f) => {
                const ev = evidenceRequired(f);
                const rem = remediation(f);
                const assetAddr = (f.evidence as Record<string, unknown>)?.assetAddress as string | undefined;
                const adminAddr = (f.evidence as Record<string, unknown>)?.adminAddress as string | undefined;
                const role = (f.evidence as Record<string, unknown>)?.role as string | undefined;
                const evidenceSource = (f.evidence as Record<string, unknown>)?.evidenceSource as string | undefined;
                const confidence = (f.evidence as Record<string, unknown>)?.confidence as string | undefined;
                const ownerEvidenceConfidence = (f.evidence as Record<string, unknown>)?.ownerEvidenceConfidence as string | undefined;
                const controlVerification = (f.evidence as Record<string, unknown>)?.controlVerification as string | undefined;
                const adminOwnerStatus = (f.evidence as Record<string, unknown>)?.adminOwnerStatus as string | undefined;
                const notes = (f.evidence as Record<string, unknown>)?.notes;
                const noteLines = Array.isArray(notes) ? notes.filter((item): item is string => typeof item === "string" && item.length > 0) : [];
                const isConcentration = f.findingType === "role_concentration";
                const affectedNames = [
                  ...evidenceAssetNames((f.evidence as Record<string, unknown>)?.assetsAffected),
                  ...evidenceAssetNames((f.evidence as Record<string, unknown>)?.controlledAssets),
                ].filter((name, index, all) => all.indexOf(name) === index);
                const adminDisplay = adminAddr
                  ?? adminOwnerStatus
                  ?? (confidence === "evidence_required"
                    ? "Evidence required"
                    : confidence === "unresolved"
                      ? "Unresolved"
                      : confidence === "error"
                        ? "Detection error"
                        : ((f.evidence as Record<string, unknown>)?.currentEvidenceStatus ? "Evidence required" : "Not detected"));
                const detectionLines = [
                  ["Evidence Source", evidenceSource],
                  ["Detection Method", (f.evidence as Record<string, unknown>)?.detectionMethod],
                  ["Detection Result", (f.evidence as Record<string, unknown>)?.detectionResult ?? (f.evidence as Record<string, unknown>)?.currentEvidenceStatus],
                  ["Confidence", confidence],
                ].filter((item): item is [string, string] => typeof item[1] === "string" && item[1].length > 0);
                return (
                  <View key={f.id} style={[S.findingBlock, { borderLeftWidth: 3, borderLeftColor: SEV_COLOR[f.severity], borderRadius: 0 }]} wrap={false}>
                    <View style={S.findingHeader}>
                      <SevPill severity={f.severity} />
                      <Pill label={FINDING_LABEL[f.findingType] ?? f.findingType} color={GOLD} />
                      <Text style={S.findingTitle}>{f.title}</Text>
                    </View>
                    <Text style={S.findingSummary}>{f.summary}</Text>

                    {/* Observed evidence status */}
                    <View style={{ marginBottom: 5 }}>
                      <Text style={S.findingSubLabel}>CURRENT EVIDENCE STATUS</Text>
                      <Text style={[S.findingSubText, { marginLeft: 8 }]}>
                        · Source: {evidenceSource ?? "Submitted project metadata + scanner analysis"}
                      </Text>
                      {isConcentration ? (
                        <>
                          <Text style={[S.findingSubText, { marginLeft: 8 }]}>Assets affected: {affectedNames.join(", ")}</Text>
                          <Text style={[S.findingSubText, { marginLeft: 8 }]}>Shared owner: {adminAddr ?? "Not provided"}</Text>
                          {ownerEvidenceConfidence ? (
                            <Text style={[S.findingSubText, { marginLeft: 8 }]}>Owner Evidence Confidence: {ownerEvidenceConfidence}</Text>
                          ) : null}
                          {controlVerification ? (
                            <Text style={[S.findingSubText, { marginLeft: 8 }]}>Control Verification: {controlVerification}</Text>
                          ) : null}
                        </>
                      ) : (
                        <>
                          <Text style={[S.findingSubText, { marginLeft: 8 }]}>
                            · Contract address: {assetAddr ?? "Not provided"}
                          </Text>
                          <Text style={[S.findingSubText, { marginLeft: 8 }]}>
                            · Admin/Owner: {adminDisplay}
                          </Text>
                        </>
                      )}
                      {detectionLines.map(([label, value]) => (
                        <Text key={label} style={[S.findingSubText, { marginLeft: 8 }]}>{label}: {value}</Text>
                      ))}
                      {noteLines.map((note, i) => (
                        <Text key={`note-${i}`} style={[S.findingSubText, { marginLeft: 8 }]}>Note: {note}</Text>
                      ))}
                      {role ? (
                        <Text style={[S.findingSubText, { marginLeft: 8 }]}>· Role: {role}</Text>
                      ) : null}
                    </View>

                    {ev.length > 0 ? (
                      <View style={{ marginTop: 2 }}>
                        <Text style={S.findingSubLabel}>EVIDENCE REQUIRED</Text>
                        {ev.map((item, i) => (
                          <Text key={i} style={[S.findingSubText, { marginLeft: 8 }]}>· {item}</Text>
                        ))}
                      </View>
                    ) : null}
                    {rem ? (
                      <View style={{ marginTop: 5 }}>
                        <Text style={S.findingSubLabel}>RECOMMENDED REMEDIATION</Text>
                        <Text style={S.findingSubText}>{rem}</Text>
                      </View>
                    ) : null}
                    {!ev.length && !rem && f.recommendedActions.slice(0, 2).map((a, i) => (
                      <Text key={i} style={[S.findingSubText, { marginLeft: 8 }]}>· {a}</Text>
                    ))}
                  </View>
                );
              })}
            </View>
          ))
        )}
      </View>

      <View style={S.divider} />

      {/* ── 05 Relevant Threat Families ─────────────────────────── */}
      <View>
        <SectionHeading num={5} title="What this means" />
        <Text style={S.body}>{whatThisMeansCopy(review, {
          resolvedCount: authorityPathsResolved,
          unresolvedCount: authorityPathsAwaiting,
          totalAssets: activeAssets.length,
          resolvedAssetNames,
          unresolvedAssetNames,
          sharedOwnerAddr,
          sharedOwnerAssetCount,
        })}</Text>
      </View>

      <View style={S.divider} />

      <View break>
        <SectionHeading num={6} title="Relevant Threat Families" />
        <Text style={S.body}>
          Project relevance scores reflect categorical match strength against the case library, not exploit probability.
        </Text>

        {!relevance || relevance.relevantThreatFamilies.length === 0 ? (
          <Text style={{ fontSize: 9, color: SUBTLE, fontStyle: "italic" }}>No relevant threat families mapped yet. Run the Admin Surface Scan and ensure findings are present.</Text>
        ) : (
          relevance.relevantThreatFamilies.map((tf) => (
            <View key={tf.threatFamily} style={S.threatBlock} wrap={false}>
              <View style={S.threatHeader}>
                <Text style={S.threatName}>{tf.threatFamily}</Text>
                <Text style={S.threatScore}>Project relevance {tf.relevanceScore}</Text>
              </View>
              {tf.whyItMatters ? <Text style={S.threatWhy}>{tf.whyItMatters}</Text> : null}
              <View style={S.threatStats}>
                {tf.globalCaseCount === 0 ? (
                  <Text style={S.threatStat}>Global coverage: <Text style={{ color: SUBTLE, fontFamily: "Helvetica-Bold" }}>Pending</Text></Text>
                ) : (
                  <Text style={S.threatStat}>Global cases: <Text style={{ color: TEXT, fontFamily: "Helvetica-Bold" }}>{tf.globalCaseCount}</Text></Text>
                )}
                <Text style={S.threatStat}>Critical (global): <Text style={{ color: tf.criticalCount > 0 ? RED : TEXT, fontFamily: "Helvetica-Bold" }}>{tf.criticalCount}</Text></Text>
                <Text style={S.threatStat}>Cases catalogued: <Text style={{ color: TEXT, fontFamily: "Helvetica-Bold" }}>{tf.replayValidatedCount}</Text></Text>
              </View>
              {tf.globalCaseCount === 0 ? (
                <Text style={[S.findingSubText, { marginBottom: 4, fontStyle: "italic" }]}>
                  Global case coverage pending — relevance is based on project authority surface match, not global case history.
                </Text>
              ) : null}
              {tf.topRecommendedActions.slice(0, 3).map((action, i) => (
                <Text key={i} style={[S.findingSubText, { marginLeft: 8 }]}>· {action}</Text>
              ))}
            </View>
          ))
        )}
      </View>

      <View style={S.divider} />

      {/* ── 06 Recommended Controls ─────────────────────────────── */}
      <View break>
        <SectionHeading num={7} title="Recommended Controls" />
        <Text style={S.body}>
          Controls remain grouped by asset for remediation tracking. The immediate review gate is to verify the shared owner operating model and resolve Goldoracle authority evidence; the controls below remain missing until supporting policy or governance evidence is submitted.
        </Text>

        {controls.length === 0 ? (
          <Text style={{ fontSize: 9, color: SUBTLE, fontStyle: "italic" }}>No controls generated. Generate controls from authority findings in the Project Map Controls tab.</Text>
        ) : (
          controlGroups.map((group) => (
            <View key={group.key}>
              <Text style={{ fontSize: 7.5, fontFamily: "Helvetica-Bold", color: GOLD, letterSpacing: 1.2, marginBottom: 5, marginTop: 4 }}>
                {group.label.toUpperCase()}
              </Text>
              {(["missing", "planned", "implemented", "verified", "not_applicable"] as ProjectControlStatus[])
                .map((st) => ({ st, items: group.items.filter((c) => c.status === st) }))
                .filter(({ items }) => items.length > 0)
                .map(({ st, items }) => (
                  <View key={`${group.key}-${st}`}>
                    <Text style={{ fontSize: 7, fontFamily: "Helvetica-Bold", color: CTRL_COLOR[st], letterSpacing: 1, marginBottom: 4 }}>
                      {CTRL_LABEL[st]} ({items.length})
                    </Text>
                    {items.map((c) => {
                const displayTitle = resolveControlTitle(c, assets, findings, titleCounts);
                const vDate = c.verifiedAt
                  ? new Date(c.verifiedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                  : null;
                return (
                  <View key={c.id} style={[S.controlBlock, { borderLeftWidth: 3, borderLeftColor: CTRL_COLOR[c.status], borderRadius: 0 }]} wrap={false}>
                    <View style={S.controlHeader}>
                      <Pill label={CTRL_LABEL[c.status]} color={CTRL_COLOR[c.status]} />
                      <Text style={S.controlTitle}>{displayTitle}</Text>
                    </View>
                    <Text style={S.controlDesc}>{c.description}</Text>
                    {c.evidenceProvided ? (
                      <Text style={{ fontSize: 7.5, color: MUTED, marginTop: 3 }}>
                        <Text style={{ fontFamily: "Helvetica-Bold" }}>Evidence: </Text>{c.evidenceProvided}
                      </Text>
                    ) : null}
                    {c.status === "verified" ? (
                      <Text style={S.controlVerified}>
                        ✓ Verified{vDate ? ` · ${vDate}` : ""}{c.verifiedBy ? ` · by ${c.verifiedBy}` : ""}
                      </Text>
                    ) : null}
                    {c.reviewerNotes ? (
                      <Text style={{ fontSize: 7.5, color: SUBTLE, fontStyle: "italic", marginTop: 3 }}>Note: {c.reviewerNotes}</Text>
                    ) : null}
                  </View>
                );
              })}
                  </View>
                ))}
            </View>
          ))
        )}
      </View>

      <View style={S.divider} />

      {/* ── 07 Verification Status ──────────────────────────────── */}
      <SectionHeading num={8} title="Verification Status" />

      <StatGrid stats={[
        { label: "Controls Total", value: controls.length },
        { label: "Controls Verified", value: `${verifiedControls.length} / ${controls.length}`, color: verifiedControls.length > 0 ? GREEN : TEXT },
        { label: "Coverage", value: `${controlCoverage}%`, color: controlCoverage === 100 ? GREEN : controlCoverage > 50 ? GOLD : TEXT },
        ...(authorityPathsResolved > 0 ? [{ label: "Owner Evidence Observed", value: `${authorityPathsResolved} / ${authorityRootFindings.length}`, color: GREEN }] : []),
        ...(authorityRootFindings.length > 0 ? [
          { label: "Authority Paths Resolved", value: `${authorityPathsResolved} / ${authorityRootFindings.length}`, color: authorityPathsResolved > 0 ? GREEN : TEXT },
          { label: "Authority Paths Awaiting", value: `${authorityPathsAwaiting} / ${authorityRootFindings.length}`, color: authorityPathsAwaiting > 0 ? GOLD : TEXT },
        ] : []),
      ]} />

      <View style={[S.callout, {
        borderLeftWidth: 4,
        borderLeftColor: isDefended ? GREEN : GOLD,
        backgroundColor: isDefended ? `${GREEN}0D` : `${GOLD}0D`,
        borderRadius: 0,
      }]}>
        <Text style={[S.calloutLabel, { color: isDefended ? GREEN : GOLD }]}>
          {isDefended ? "DEFENDED" : "COVERAGE INCOMPLETE"}
        </Text>
        <Text style={[S.calloutText, { fontSize: 9 }]}>
          {isDefended
            ? "All generated evidence and control checks are verified for current project metadata. This project meets the SCE Defended threshold for the mapped surface."
            : controls.length === 0
              ? "Evidence and control checks have not been generated yet. \"Defended\" status applies only after checks are generated and verified."
              : `${verifiedControls.length} of ${controls.length} evidence and control checks verified (${controlCoverage}% coverage). "Defended" status applies only when all checks are verified against current project metadata and evidence.`}
        </Text>
      </View>

      <View style={S.divider} />

      {/* ── 08 Next Actions ─────────────────────────────────────── */}
      <SectionHeading num={9} title="Next Actions" />

      {nextActions.map((action, i) => (
        <View key={i} style={{ flexDirection: "row", marginBottom: 8, alignItems: "flex-start" }} wrap={false}>
          <View style={{ width: 20, height: 20, backgroundColor: SURFACE, borderWidth: 1, borderColor: SEP, borderRadius: 2, alignItems: "center", justifyContent: "center", marginRight: 10, flexShrink: 0 }}>
            <Text style={{ fontSize: 8, fontFamily: "Helvetica-Bold", color: GOLD }}>{i + 1}</Text>
          </View>
          <Text style={{ fontSize: 9.5, color: TEXT, lineHeight: 1.65, flex: 1, paddingTop: 2 }}>{action}</Text>
        </View>
      ))}

      {/* Footer disclaimer */}
      <View style={{ marginTop: 28, paddingTop: 14, borderTopWidth: 1, borderTopColor: SEP }}>
        <Text style={{ fontSize: 7.5, fontFamily: "Helvetica-Bold", color: GOLD, letterSpacing: 1, marginBottom: 5 }}>
          CONFIDENTIAL — SAGITTA CONTINUITY ENGINE (SCE)
        </Text>
        <Text style={{ fontSize: 7, color: SUBTLE, lineHeight: 1.65 }}>
          This report is prepared solely for the addressee. The findings and recommendations are based on publicly available information and represent SCE's analysis as of {fmtDate(review.updatedAt)}. SCE does not hold custody of any project assets, private keys, or signing credentials. Distribution or reproduction without written consent from Sagitta Continuity Engine (SCE) is prohibited.
        </Text>
      </View>
    </Page>
  );
}

// ─── Root Document export ─────────────────────────────────────────────────────
export function DefenseReviewDocument({ data }: { data: DefenseReviewReportData }) {
  return (
    <Document
      title={`SCE Defense Review — ${data.review.projectName}`}
      author="Sagitta Continuity Engine (SCE)"
      subject="Public-Surface Defense Review Report"
      creator="SCE Platform"
      producer="@react-pdf/renderer"
      keywords="security defense review blockchain DeFi SCE"
    >
      <CoverPage data={data} />
      <TocPage data={data} />
      <ContentPage data={data} />
    </Document>
  );
}
