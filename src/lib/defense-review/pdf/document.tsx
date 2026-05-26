import React from "react";
import { Document, Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";

import type { DefenseReview, DefenseReviewStatus } from "@/lib/defense-review/types";
import {
  candidateDisplayName,
  reportAssetDisplayName,
  reportAssetCanonicalStatus,
  reportAssetText,
  reportNextActions,
  reportSourceSummaryByAsset,
  sourceSummaryForFinding,
} from "@/lib/defense-review/report-safe";
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
const BG       = "#08090F";
const SURFACE  = "#0D0F18";
const CARD     = "#111422";
const BORDER   = "#1A1D2E";
const GOLD     = "#D4AF37";
const GOLD_DIM = "#9A7D28";
const GOLD_BG  = "#14120A";
const PURPLE   = "#7B3FF2";
const PURPLE_L = "#9B67F5";
const TEXT     = "#EEF2F8";
const MUTED    = "#8B97AE";
const SUBTLE   = "#4E5A6E";
const RED      = "#EF4444";
const ORANGE   = "#F97316";
const YELLOW   = "#EAB308";
const GREEN    = "#22C55E";
const BLUE     = "#3B82F6";

// ─── Lookup tables ───────────────────────────────────────────────────────────
const SEV_COLOR: Record<AdminFindingSeverity, string> = {
  critical: RED, high: ORANGE, medium: YELLOW, low: GREEN,
};

const CTRL_COLOR: Record<ProjectControlStatus, string> = {
  missing: GOLD, planned: ORANGE, implemented: BLUE, verified: GREEN, not_applicable: SUBTLE,
};

const CTRL_LABEL: Record<ProjectControlStatus, string> = {
  missing: "PENDING", planned: "PENDING",
  implemented: "REVIEW", verified: "VERIFIED", not_applicable: "N/A",
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
  protocol_adapter_limitation: "Protocol Adapter Limitation",
  owner_detected: "Supporting Owner Evidence Receipt",
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
  1: "Ethereum", 10: "Optimism", 56: "BNB Chain", 137: "Polygon",
  8453: "Base", 1287: "Moonbase Alpha", 42161: "Arbitrum",
  43114: "Avalanche", 11155111: "Sepolia",
};

const AUTHORITY_DETECTOR_ATTEMPTS = "Ownable, EIP-1967, Safe, Timelock, AccessControl";

const SOURCE_VERIFICATION_NOTES_BY_ERROR: Record<string, string> = {
  api_error: "Explorer API returned an unsuccessful status. Source/ABI verification was unavailable from the configured explorer.",
  rate_limited: "Explorer rate limit reached. Retry later or configure supported explorer access.",
  missing_api_key: "Configured explorer access is unavailable. Source/ABI verification was skipped for this explorer.",
  explorer_unsupported: "No configured explorer support for this chain.",
  malformed_response: "Explorer returned an unexpected response. Source/ABI verification could not be completed.",
  network_error: "Explorer request failed due to a network or transport error.",
  not_checked: "Source/ABI verification was not checked for this asset.",
};

function sourceVerificationNote(sourceVerification: Record<string, unknown> | undefined, note: string): string {
  const errorType = String(sourceVerification?.verificationErrorType ?? "").toLowerCase();
  if (errorType && errorType !== "ok") {
    return SOURCE_VERIFICATION_NOTES_BY_ERROR[errorType] ?? SOURCE_VERIFICATION_NOTES_BY_ERROR.api_error;
  }
  const normalized = note.trim().toLowerCase();
  if (!normalized || normalized === "ok" || normalized === "notok" || normalized === "not ok" || normalized.startsWith("{") || normalized.startsWith("[")) {
    return SOURCE_VERIFICATION_NOTES_BY_ERROR.api_error;
  }
  if (normalized.includes("apikey") || normalized.includes("api_key")) {
    return SOURCE_VERIFICATION_NOTES_BY_ERROR.api_error;
  }
  return note;
}

function sourceStatusDistributionLabel(sourceStatusDistribution: Record<string, unknown>): string {
  const rows: Array<[string, unknown]> = [
    ["Verified", sourceStatusDistribution.verifiedCount],
    ["ABI Available", sourceStatusDistribution.abiAvailableCount],
    ["Unverified", sourceStatusDistribution.unverifiedCount],
    ["Error", sourceStatusDistribution.errorCount],
    ["Unsupported", sourceStatusDistribution.unsupportedCount],
    ["Unknown", sourceStatusDistribution.unknownCount],
  ];
  return rows
    .filter(([, value]) => typeof value === "number" && value > 0)
    .map(([label, value]) => `${label}: ${value}`)
    .join("; ");
}
const CONTROL_GROUP_ORDER = ["treasury", "vault", "escrow", "reserve", "oracle", "general"] as const;
type ControlGroupKey = typeof CONTROL_GROUP_ORDER[number];

const CONTROL_GROUP_LABELS: Record<ControlGroupKey, string> = {
  treasury: "Treasury controls", vault: "Vault controls", escrow: "Escrow controls",
  reserve: "Reserve controls", oracle: "Oracle controls", general: "General controls",
};

function scanStatusLabel(status?: string | null): string {
  if (!status || status === "not_run") return "Not available";
  if (status === "partial") return "Partial — retry recommended";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function chainListLabel(chains?: number[]): string {
  if (!chains || chains.length === 0) return "Not available";
  return chains.map((chain) => CHAIN_LABELS[chain] ?? String(chain)).join(", ");
}

function hasScanMetadata(review: DefenseReview): boolean {
  return Boolean(
    review.lastScanAt || review.scanStatus !== "not_run"
    || review.scanChainsConfigured.length > 0 || review.scanChainsUnconfigured.length > 0
    || review.scanNotes || review.detectorRunCount > 0,
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

function roleForControl(control: ProjectControl, assets: ProjectAsset[], findings: AdminSurfaceFinding[]): ControlGroupKey {
  const directAsset = control.assetId ? assets.find((asset) => asset.id === control.assetId) : undefined;
  const finding = control.findingId ? findings.find((item) => item.id === control.findingId) : undefined;
  const findingAsset = finding?.assetId ? assets.find((asset) => asset.id === finding.assetId) : undefined;
  const evidenceRole = typeof finding?.evidence?.role === "string" ? finding.evidence.role : undefined;
  return (
    roleForAsset(directAsset) ?? roleForAsset(findingAsset)
    ?? normalizeControlRole(evidenceRole) ?? normalizeControlRole(control.sourceFindingType ?? undefined)
    ?? normalizeControlRole(control.controlKey) ?? normalizeControlRole(control.title) ?? "general"
  );
}

function buildControlGroups(
  controls: ProjectControl[], assets: ProjectAsset[], findings: AdminSurfaceFinding[],
): Array<{ key: ControlGroupKey; label: string; items: ProjectControl[] }> {
  const buckets = new Map<ControlGroupKey, ProjectControl[]>();
  CONTROL_GROUP_ORDER.forEach((key) => buckets.set(key, []));
  controls.forEach((control) => { buckets.get(roleForControl(control, assets, findings))?.push(control); });
  return CONTROL_GROUP_ORDER
    .map((key) => ({ key, label: CONTROL_GROUP_LABELS[key], items: buckets.get(key) ?? [] }))
    .filter((group) => group.items.length > 0);
}

function evidenceAssetNames(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => {
    if (typeof item === "string") return item;
    if (item && typeof item === "object") {
      const record = item as Record<string, unknown>;
      return typeof record.asset_name === "string" ? record.asset_name
        : typeof record.name === "string" ? record.name : undefined;
    }
    return undefined;
  }).filter((item): item is string => typeof item === "string" && item.length > 0);
}

function assetRoleLabel(asset: ProjectAsset): string {
  const metadataRole = asset.metadata?.role;
  if (typeof metadataRole === "string" && metadataRole.trim().length > 0) return metadataRole.trim().toLowerCase();
  const normalizedName = asset.name.trim().toLowerCase();
  if (["treasury", "vault", "escrow", "reserve"].includes(normalizedName)) return normalizedName;
  if (normalizedName.includes("oracle")) return "oracle";
  return asset.assetType;
}

function assetTypeLabel(assetType: string): string {
  if (assetType === "treasury") return "Treasury";
  if (assetType === "oracle") return "Oracle";
  if (assetType === "contract" || assetType === "proxy") return "Contract";
  return assetType.charAt(0).toUpperCase() + assetType.slice(1);
}

function shortAddress(address?: string | null): string {
  if (!address) return "Not provided";
  return address.length > 13 ? `${address.slice(0, 6)}...${address.slice(-4)}` : address;
}

function detectorObservedSummary(detector?: string, values?: Record<string, unknown>): string | null {
  if (!detector || !values) return null;
  if (detector === "EIP-1967 Proxy") {
    const implementation = typeof values.implementation === "string" ? values.implementation : undefined;
    const admin = typeof values.admin === "string" ? values.admin : undefined;
    if (implementation || admin) return `Implementation: ${implementation ?? "unresolved"}; admin: ${admin ?? "unresolved"}.`;
  }
  if (detector === "Gnosis Safe" && typeof values.thresholdSummary === "string") {
    return `Safe threshold: ${values.thresholdSummary}.`;
  }
  if (detector === "TimelockController" && typeof values.minDelay === "string") {
    return `Timelock delay: ${values.minDelay}.`;
  }
  if (detector === "Compound Timelock") {
    const observations = [
      typeof values.delay === "string" ? `Delay: ${values.delay}` : null,
      typeof values.admin === "string" ? `admin: ${values.admin}` : null,
      typeof values.pendingAdmin === "string" ? `pending admin: ${values.pendingAdmin}` : null,
      typeof values.gracePeriod === "string" ? `grace period: ${values.gracePeriod}` : null,
    ].filter(Boolean);
    if (observations.length > 0) return `${observations.join("; ")}.`;
  }
  if (detector === "Chainlink Feed" && typeof values.feedAddress === "string") {
    return `Feed address: ${values.feedAddress}.`;
  }
  if (detector === "OpenZeppelin AccessControl" && typeof values.roleAdmin === "string") {
    return `Role admin: ${values.roleAdmin}.`;
  }
  if (detector === "Ownable" && typeof values.owner === "string") {
    return `Owner: ${values.owner}.`;
  }
  return null;
}

function mappedOwnerDisplay(
  asset: ProjectAsset, resolvedOwnerFindings: AdminSurfaceFinding[], unresolvedOwnerFindings: AdminSurfaceFinding[],
): string {
  const resolved = resolvedOwnerFindings.find((finding) => {
    if (finding.assetId === asset.id) return true;
    const ev = finding.evidence as Record<string, unknown> | undefined;
    const ids = ev?.resolvedAssetIds as string[] | undefined;
    const names = ev?.resolvedAssets as string[] | undefined;
    return (ids && ids.includes(asset.id)) || (names && names.includes(asset.name)) || false;
  });
  const owner = (resolved?.evidence as Record<string, unknown> | undefined)?.adminAddress;
  if (typeof owner === "string" && owner.length > 0) return `Owner: ${shortAddress(owner)}\nVia: Ownable.owner()`;
  if (unresolvedOwnerFindings.some((finding) => finding.assetId === asset.id)) return "Unresolved";
  const ownerType = asset.metadata?.ownerType;
  if (typeof ownerType === "string" && ownerType.length > 0 && ownerType !== "Unknown") return ownerType;
  return "Unresolved";
}

function findingDisplayOrder(finding: AdminSurfaceFinding): number {
  if (finding.findingType === "role_concentration") return 0;
  if (finding.findingType === "unknown_admin") return 1;
  if (finding.findingType === "owner_detected") return 2;
  return 3;
}

function normalizeOwnerType(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim().toLowerCase().replace(/[\s-]+/g, "_");
  if (!normalized) return undefined;
  if (normalized === "safe" || normalized === "multisig" || normalized === "safe_compatible_contract") return "safe";
  if (normalized === "timelock" || normalized === "timelock_compatible_contract") return "timelock";
  if (normalized === "contract_unknown" || normalized === "contract_unclassified") return "contract_unknown";
  if (normalized === "eoa" || normalized === "externally_owned_account") return "eoa";
  if (normalized === "error" || normalized === "detection_error") return "error";
  if (normalized === "unresolved" || normalized === "unknown") return "unresolved";
  return normalized;
}

function ownerTypeReviewGateCopy(opts: {
  ownerType?: string;
  ownerTypeMethod?: string;
  ownerTypeEvidence?: string;
}): string {
  const ownerType = normalizeOwnerType(opts.ownerType);
  if (ownerType === "eoa") {
    const method = opts.ownerTypeMethod || "eth_getCode(owner)";
    const evidenceSummary = opts.ownerTypeEvidence?.toLowerCase().includes("no bytecode")
      ? "which returned no bytecode"
      : "which indicates no bytecode was found";
    return `SCE classified the shared owner as an EOA using ${method}, ${evidenceSummary}. This does not prove unsafe operation or a vulnerability. It means the next review gate is to review signer custody, key rotation, emergency replacement path, separation of duties, and whether migration to multisig or timelock governance is required.`;
  }
  if (ownerType === "safe") {
    return "The resolved owner evidence does not prove a vulnerability. SCE classified the shared owner as a Safe-compatible contract. The next review gate is to verify signer list, threshold policy, module configuration, owner rotation process, and emergency execution procedure.";
  }
  if (ownerType === "timelock") {
    return "The resolved owner evidence does not prove a vulnerability. SCE classified the shared owner as a timelock-compatible contract. The next review gate is to verify minimum delay policy, proposer/executor roles, emergency bypass rules, and governance process.";
  }
  if (ownerType === "contract_unknown") {
    return "The resolved owner evidence does not prove a vulnerability. SCE found bytecode at the shared owner address, but supported Safe/Timelock interfaces did not resolve. The next review gate is source/ABI review and authority-model documentation.";
  }
  return "The resolved owner evidence does not prove a vulnerability, and it does not verify that the owner is unsafe. It means the next review gate is to confirm whether the resolved address is an EOA, multisig, timelock, or governed contract.";
}

function firstSharedOwnerAction(ownerAddress: string, ownerType?: string): string {
  const normalized = normalizeOwnerType(ownerType);
  if (normalized === "eoa") {
    return `Review the EOA operating model for ${ownerAddress} including signer custody, key rotation, emergency replacement path, and whether migration to multisig or timelock governance is required.`;
  }
  if (normalized === "safe") {
    return `Verify the Safe signer list, threshold policy, module configuration, owner rotation process, and emergency execution policy for ${ownerAddress}.`;
  }
  if (normalized === "timelock") {
    return `Verify the timelock minimum delay, proposer/executor roles, emergency bypass rules, and governance process for ${ownerAddress}.`;
  }
  if (normalized === "contract_unknown") {
    return `Request source/ABI and owner contract authority-model documentation for ${ownerAddress}.`;
  }
  return `Confirm whether ${ownerAddress} is an EOA, multisig, timelock, or governed contract.`;
}

function whatThisMeansCopy(
  review: DefenseReview,
  opts: {
    resolvedCount: number; unresolvedCount: number; totalAssets: number;
    resolvedAssetNames: string[]; unresolvedAssetNames: string[];
    sharedOwnerAddr: string | undefined; sharedOwnerAssetCount: number;
    sharedOwnerType?: string; sharedOwnerTypeMethod?: string; sharedOwnerTypeEvidence?: string;
    candidateCount?: number;
  },
): string {
  const { resolvedCount, unresolvedCount, totalAssets, resolvedAssetNames, unresolvedAssetNames, sharedOwnerAddr, sharedOwnerAssetCount } = opts;
  const candidateCount = opts.candidateCount ?? 0;
  if (review.scanStatus === "error" || review.scanStatus === "partial") {
    return "SCE attempted standard public authority interface checks, but scan coverage was limited by RPC transport failures. Re-run the scan with a stable RPC endpoint or submit source/ABI and authority evidence to complete authority-path verification.";
  }
  if (resolvedCount === 0 && unresolvedCount === 0) {
    return `SCE scanned standard public authority interfaces for the mapped assets. No standard owner/admin/proxy/timelock paths resolved or were attempted for ${totalAssets} asset${totalAssets !== 1 ? "s" : ""}. Submit source/ABI or authority evidence to advance verification.`;
  }
  if (sharedOwnerAddr && sharedOwnerAssetCount >= 2) {
    const ownerLabel = normalizeOwnerType(opts.sharedOwnerType) === "eoa" ? "EOA " : "";
    let copy = `SCE observed a single ${ownerLabel}owner address governing ${resolvedAssetNames.join(", ")} through public Ownable.owner() calls. That shared owner path creates a continuity dependency: if the signer is unavailable, rotated incorrectly, or used without authorization, multiple operating surfaces may be affected at once. `;
    if (ownerLabel) {
      copy += "SCE did not observe a public timelock, Safe threshold, or counter-signer path for this owner in the available public data. ";
    }
    copy += `SCE resolved ${resolvedCount} of ${totalAssets} mapped authority paths from available public evidence. `;
    if (unresolvedCount > 0) {
      copy += `${unresolvedAssetNames.join(", ")} remains unresolved through supported public authority interfaces, which prevents SCE from completing that authority path without source/ABI or submitted authority evidence. `;
    }
    return `${copy}These observations do not establish an adverse security outcome. They identify the evidence required to verify the operating model.`;
  }
  const assetWord = totalAssets !== 1 ? "assets" : "asset";
  const prefix = `SCE scanned standard public authority interfaces for ${totalAssets} mapped ${assetWord}.`;
  if (resolvedCount > 0 && unresolvedCount === 0) {
    const assetList = resolvedAssetNames.join(", ");
    let copy = `${prefix} Public calls resolved Ownable owner paths for all ${resolvedCount} asset${resolvedCount !== 1 ? "s" : ""} — ${assetList}.`;
    if (sharedOwnerAddr && sharedOwnerAssetCount >= 2) {
      copy += ` All resolved assets share the same owner address: ${sharedOwnerAddr}. This shared owner path is the primary continuity finding. ${ownerTypeReviewGateCopy({ ownerType: opts.sharedOwnerType, ownerTypeMethod: opts.sharedOwnerTypeMethod, ownerTypeEvidence: opts.sharedOwnerTypeEvidence })}`;
    }
    if (candidateCount > 0) {
      copy += ` SCE discovered ${candidateCount} linked contract candidate${candidateCount !== 1 ? "s" : ""} from public getter calls on the mapped ${assetWord}. These candidates map to the protocol's extended administrative surface - governance, oracle, pool, and role-management contracts where applicable. Importing candidates and re-running the scan is required before authority paths beyond the currently mapped asset can be assessed.`;
    }
    return copy;
  }
  const assetList = resolvedAssetNames.join(", ");
  const unresolvedList = unresolvedAssetNames.join(", ");
  let copy = `${prefix} Public calls resolved Ownable owner paths for ${resolvedCount} asset${resolvedCount !== 1 ? "s" : ""} — ${assetList}`;
  if (sharedOwnerAddr && sharedOwnerAssetCount >= 2) {
    copy += ` — all to the same owner address: ${sharedOwnerAddr}. This shared owner path is the primary continuity finding in this review.`;
  } else {
    copy += ".";
  }
  if (unresolvedCount > 0) {
    copy += ` ${unresolvedList} did not resolve through standard interfaces and require${unresolvedCount === 1 ? "s" : ""} source/ABI review or submitted authority evidence.`;
  }
  copy += ` ${ownerTypeReviewGateCopy({ ownerType: opts.sharedOwnerType, ownerTypeMethod: opts.sharedOwnerTypeMethod, ownerTypeEvidence: opts.sharedOwnerTypeEvidence })}`;
  return copy;
}

function evidenceRequired(finding: AdminSurfaceFinding): string[] {
  const ev = finding.evidence as Record<string, unknown>;
  if (Array.isArray(ev.evidenceRequired) && (ev.evidenceRequired as unknown[]).length > 0) return ev.evidenceRequired as string[];
  const act = finding.recommendedActions[0] ?? "";
  const prefix = "Evidence required: ";
  if (act.startsWith(prefix)) return act.slice(prefix.length).replace(/\.$/, "").split(", ").filter(Boolean);
  return [];
}

function findingCategory(finding: AdminSurfaceFinding): string {
  if (finding.findingType === "owner_detected") return "supporting_evidence_receipt";
  return finding.category ?? "analytical_finding";
}

function remediation(finding: AdminSurfaceFinding, hasSharedOwnerFinding = false): string {
  if (finding.findingType === "owner_detected") {
    return hasSharedOwnerFinding
      ? "Supporting receipt only. See the shared-owner finding and Top Evidence Gates for requested owner/signer evidence."
      : "Supporting receipt only. See Top Evidence Gates for requested owner/signer and governance evidence.";
  }
  for (const act of finding.recommendedActions) {
    if (act.startsWith("Recommended remediation: ")) return act.slice("Recommended remediation: ".length);
    if (act.startsWith("Remediation: ")) return act.slice("Remediation: ".length);
  }
  return "";
}

function resolveControlTitle(
  control: ProjectControl, assets: ProjectAsset[], findings: AdminSurfaceFinding[], titleCounts: Map<string, number>,
  candidates: DefenseReview["customerDiscoveredCandidateAssets"] = [],
): string {
  const assetId = control.assetId ?? (() => {
    const f = findings.find((x) => x.id === (control.findingId ?? ""));
    return f?.assetId ?? null;
  })();
  const asset = assetId ? assets.find((a) => a.id === assetId) : undefined;
  const role = asset ? reportAssetDisplayName(asset, candidates ?? []) : null;
  if (!role) return control.title;
  const generic = /\ball\s+(admin\/owner|admin|owner)\b/i;
  if (generic.test(control.title)) {
    if (role === "Admin / Governance Authority") return "Identify and document Admin / Governance Authority model";
    if (role === "COMP Token") return "Identify and document COMP Token authority";
    return control.title.replace(generic, `${role} admin/owner`);
  }
  if ((titleCounts.get(control.title) ?? 0) <= 1) return control.title;
  return `${control.title} — ${role}`;
}

function buildNextActions(
  findings: AdminSurfaceFinding[], controls: ProjectControl[],
  opts?: { sharedOwnerAddr?: string; unresolvedAssetNames?: string[]; sharedOwnerType?: string; projectName?: string; scanInconclusive?: boolean; candidateCount?: number; candidateScopeState?: string; mappedSourceAvailable?: boolean },
): string[] {
  const actions: string[] = [];
  const missing = controls.filter((c) => c.status === "missing");
  const unverified = controls.filter((c) => c.status !== "verified" && c.status !== "not_applicable");
  const verified = controls.filter((c) => c.status === "verified");
  const crit = findings.filter((f) => f.severity === "critical");
  if (opts?.scanInconclusive) {
    actions.push("Re-run scan with working RPC transport before completing authority analysis.");
  }

  if (opts?.candidateScopeState === "candidates_imported_scan_complete" && !opts?.scanInconclusive) {
    return [
      "Provide governance/admin/signer evidence for mapped and imported assets.",
      "Verify unresolved authority path for PriceOracle.",
      "Verify ACLManager role inventory and administrative membership.",
      "Verify proxy admin ownership and upgrade safeguards for Pool and PoolConfigurator.",
      "Confirm PriceOracle operating policy and fallback behavior.",
      "Update unresolved assumptions after evidence review.",
    ];
  }

  if (opts?.candidateScopeState === "candidates_imported_scan_pending" && !opts?.scanInconclusive) {
    return [
      "Re-run scan against the expanded Project Map.",
      "Provide governance/admin/signer evidence for mapped and imported assets.",
      "Verify unresolved authority paths after the expanded scan.",
      "Update unresolved assumptions after evidence review.",
    ];
  }

  if (opts?.candidateScopeState === "candidates_partially_imported" && !opts?.scanInconclusive) {
    return [
      "Approve/import remaining discovered candidate assets into Project Map.",
      "Re-run scan against the expanded Project Map.",
      "Provide governance/admin/signer evidence for mapped and imported assets.",
      "Confirm ACLManager role inventory and PriceOracle operating policy.",
      "Update unresolved assumptions after evidence review.",
    ];
  }

  if ((opts?.candidateCount ?? 0) > 0 && !opts?.scanInconclusive) {
    return [
      "Approve/import discovered candidate assets into Project Map.",
      "Re-run scan against the expanded Project Map.",
      "Provide governance/admin/signer evidence for mapped and imported assets.",
      "Confirm ACLManager role inventory and PriceOracle operating policy.",
      "Update unresolved assumptions after evidence review.",
    ];
  }

  if (opts?.sharedOwnerAddr) {
    const unresolvedList = opts.unresolvedAssetNames?.join(", ");
    return [
      "Respond to the Top Evidence Gates and Priority Remediation Roadmap.",
      "Provide requested owner/signer custody and emergency replacement evidence.",
      unresolvedList
        ? `Provide source/ABI or submitted authority evidence for ${unresolvedList}.`
        : "Provide requested source/ABI and authority evidence.",
      "Provide requested treasury, oracle, role, emergency, and governance policy evidence.",
      "SCE reviews submitted evidence against mapped authority paths and re-runs the scan.",
      "Issue an updated report with revised evidence status after evidence review.",
    ];
  }

  const knownRoles = ["treasury", "vault", "escrow", "reserve", "oracle"];
  const affectedRoles = knownRoles.filter((r) => findings.some((f) => f.findingType.startsWith(r) || f.findingType.includes(r)));
  const roleList = affectedRoles.join(", ");

  if (opts?.unresolvedAssetNames && opts.unresolvedAssetNames.length > 0) {
    actions.push(`Resolve authority paths for ${opts.unresolvedAssetNames.join(", ")} — standard public interfaces did not return a valid owner or admin address.`);
  }

  actions.push("Submit or confirm the mapped asset inventory — verify all contracts, proxies, oracles, and keepers are represented in the Project Map.");
  actions.push("Submit source/ABI or admin/owner evidence for unresolved assets.");
  actions.push("Provide multisig/timelock details where applicable, including signer policy, threshold, and delay windows.");
  if (opts?.projectName?.toLowerCase().includes("aave")) {
    actions.push("Expand the project map from PoolAddressesProvider to include Pool, PoolConfigurator, ACLManager, oracle, collector/treasury, and proxy implementation authority where discoverable.");
  } else if (roleList) {
    actions.push(`Verify authority paths for mapped roles: ${roleList}.`);
  } else {
    actions.push("Verify authority paths for the mapped contract and any connected protocol contracts discovered from source/ABI.");
  }
  actions.push("Document role separation and emergency procedures for each authority surface.");

  if (missing.length > 0) {
    actions.push(`Attach or link policy evidence for ${missing.length} pending review item${missing.length > 1 ? "s" : ""}.`);
  } else if (unverified.length > 0) {
    actions.push(`Attach or link policy evidence for ${unverified.length} outstanding review item${unverified.length > 1 ? "s" : ""}.`);
  } else {
    actions.push("Attach or link policy evidence for any outstanding review items.");
  }

  if (crit.length > 0) actions.push(`Address ${crit.length} critical authority surface${crit.length > 1 ? "s" : ""} — these require immediate attention before deployment or continued operation.`);
  if (findings.some((f) => f.findingType === "missing_timelock")) actions.push("Implement upgrade timelocks to provide a governance review window before upgrades take effect.");
  if (findings.some((f) => f.findingType === "owner_eoa")) actions.push("Transition owner accounts from EOA to multisig or timelocked governance.");
  if (findings.some((f) => f.findingType === "role_concentration" || f.findingType.includes("role_concentration"))) {
    actions.push("Distribute concentrated admin roles across separate key holders or governance contracts.");
  }
  actions.push("Re-run SCE Admin Surface Scan after submitting evidence to refresh findings and authority path verification.");
  actions.push(`Generate updated report with revised evidence status. Current reviewed item count: ${verified.length} of ${controls.length}.`);

  return actions.slice(0, 6);
}

function buildControlsPreface(
  scanStatus: string | undefined,
  hasSharedOwner: boolean,
  unresolvedAssets: string[],
): string {
  const base = "Review items remain grouped by asset for internal remediation tracking.";
  const intro = "Requested evidence supports review of public authority assumptions.";
  if (scanStatus === "partial" || scanStatus === "error") {
    return `${intro} ${base} Scanner coverage was partial, so interpretation remains pending stable scan evidence and submitted policy or governance evidence.`;
  }
  if (hasSharedOwner && unresolvedAssets.length > 0) {
    return `${intro} ${base} Requested evidence includes the owner operating model and authority evidence for: ${unresolvedAssets.join(", ")}.`;
  }
  if (hasSharedOwner) {
    return `${intro} ${base} Requested evidence includes the owner operating model.`;
  }
  if (unresolvedAssets.length > 0) {
    return `${intro} ${base} Requested authority evidence is pending for: ${unresolvedAssets.join(", ")}.`;
  }
  return `${intro} ${base}`;
}

// ─── StyleSheet ───────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  // Pages
  coverPage: { backgroundColor: BG, padding: 0 },
  page: {
    backgroundColor: BG,
    paddingTop: 60,
    paddingBottom: 48,
    paddingHorizontal: 48,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: TEXT,
  },

  // Fixed header
  header: {
    position: "absolute", top: 0, left: 0, right: 0,
    height: 48,
    backgroundColor: SURFACE,
    borderBottomWidth: 1, borderBottomColor: BORDER,
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 36,
  },
  headerLogo: { width: 22, height: 22, marginRight: 10 },
  headerTitle: { flex: 1, fontSize: 7, color: MUTED, letterSpacing: 0.8 },
  headerBadge: {
    backgroundColor: GOLD_BG,
    borderWidth: 1, borderColor: `${GOLD}44`,
    borderRadius: 2, paddingHorizontal: 7, paddingVertical: 2,
  },
  headerBadgeText: { fontSize: 6, fontFamily: "Helvetica-Bold", color: GOLD, letterSpacing: 1.6 },

  // Fixed footer
  footer: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    height: 32,
    backgroundColor: SURFACE,
    borderTopWidth: 1, borderTopColor: BORDER,
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 36, justifyContent: "space-between",
  },
  footerText: { fontSize: 6.5, color: SUBTLE },
  footerCenter: { fontSize: 6.5, color: MUTED },

  // Section heading
  sectionHeading: {
    flexDirection: "row", alignItems: "center",
    marginBottom: 16,
  },
  sectionNumBadge: {
    width: 22, height: 22,
    backgroundColor: `${PURPLE}20`,
    borderWidth: 1, borderColor: `${PURPLE}50`,
    borderRadius: 3,
    alignItems: "center", justifyContent: "center",
    marginRight: 10,
  },
  sectionNum: { fontSize: 8, fontFamily: "Helvetica-Bold", color: PURPLE_L },
  sectionTitle: {
    fontSize: 11, fontFamily: "Helvetica-Bold", color: TEXT, letterSpacing: 1.2,
    flex: 1, paddingBottom: 8,
    borderBottomWidth: 1, borderBottomColor: `${GOLD}30`,
  },

  // Table styles
  tableHeader: {
    flexDirection: "row",
    backgroundColor: `${PURPLE}18`,
    borderWidth: 1, borderColor: `${PURPLE}30`,
    borderRadius: 3, paddingVertical: 6, paddingHorizontal: 10,
    marginBottom: 1,
  },
  tableHeaderCell: { fontSize: 6.5, fontFamily: "Helvetica-Bold", color: MUTED, letterSpacing: 1 },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1, borderBottomColor: BORDER,
    paddingVertical: 7, paddingHorizontal: 10,
  },
  tableRowAlt: {
    flexDirection: "row",
    backgroundColor: `${SURFACE}`,
    borderBottomWidth: 1, borderBottomColor: BORDER,
    paddingVertical: 7, paddingHorizontal: 10,
  },
  tableCell: { fontSize: 8.5, color: TEXT },
  tableCellMono: { fontSize: 7.5, color: MUTED, fontFamily: "Courier" },
  tableCellMuted: { fontSize: 8, color: MUTED },

  // Stat grid
  statRow: { flexDirection: "row", marginBottom: 12 },
  statCard: {
    flex: 1,
    backgroundColor: CARD,
    borderWidth: 1, borderColor: BORDER,
    borderRadius: 3,
    padding: "8 12",
    marginRight: 6,
  },
  statCardLast: {
    flex: 1,
    backgroundColor: CARD,
    borderWidth: 1, borderColor: BORDER,
    borderRadius: 3,
    padding: "8 12",
  },
  statLabel: { fontSize: 6, fontFamily: "Helvetica-Bold", color: SUBTLE, letterSpacing: 1.2, marginBottom: 4 },
  statValue: { fontSize: 18, fontFamily: "Helvetica-Bold", color: TEXT, lineHeight: 1 },

  // Callout box
  callout: { borderRadius: 3, padding: "10 14", marginBottom: 12 },
  calloutLabel: { fontSize: 6.5, fontFamily: "Helvetica-Bold", letterSpacing: 1.4, marginBottom: 4 },
  calloutText: { fontSize: 9, color: TEXT, lineHeight: 1.6 },

  // Body text
  body: { fontSize: 9.5, color: MUTED, lineHeight: 1.7, marginBottom: 10 },

  // Meta row (key-value)
  metaRow: { flexDirection: "row", paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: BORDER },
  metaLabel: { fontSize: 8, color: SUBTLE, width: 120, flexShrink: 0, fontFamily: "Helvetica-Bold", letterSpacing: 0.5 },
  metaValue: { fontSize: 8, color: TEXT, flex: 1 },

  // Pill/badge
  pill: { borderRadius: 2, paddingHorizontal: 5, paddingVertical: 2, marginRight: 4 },
  pillText: { fontSize: 6, fontFamily: "Helvetica-Bold", letterSpacing: 0.8 },

  // Finding block
  findingBlock: {
    backgroundColor: CARD,
    borderRadius: 3,
    padding: "10 14",
    marginBottom: 6,
  },
  findingHeader: { flexDirection: "row", alignItems: "flex-start", marginBottom: 6, flexWrap: "wrap", gap: 4 },
  findingTitle: { fontSize: 9.5, fontFamily: "Helvetica-Bold", color: TEXT, flex: 1 },
  findingSummary: { fontSize: 8.5, color: MUTED, lineHeight: 1.6, marginBottom: 6 },
  findingSubLabel: { fontSize: 6.5, fontFamily: "Helvetica-Bold", color: SUBTLE, letterSpacing: 1, marginBottom: 3, marginTop: 5 },
  findingSubText: { fontSize: 8, color: SUBTLE, lineHeight: 1.5 },

  // Evidence mini-table
  evidenceTable: {
    backgroundColor: SURFACE,
    borderWidth: 1, borderColor: BORDER,
    borderRadius: 2, marginTop: 6,
  },
  evidenceRow: {
    flexDirection: "row",
    paddingVertical: 4, paddingHorizontal: 8,
    borderBottomWidth: 1, borderBottomColor: BORDER,
  },
  evidenceLabel: { fontSize: 7, color: SUBTLE, width: 110, flexShrink: 0 },
  evidenceValue: { fontSize: 7.5, color: MUTED, flex: 1 },

  // Control block
  controlRow: {
    flexDirection: "row",
    borderBottomWidth: 1, borderBottomColor: BORDER,
    paddingVertical: 7, paddingHorizontal: 0,
    alignItems: "flex-start",
  },
  controlStatusCell: { width: 72, flexShrink: 0, paddingTop: 1 },
  controlTitleCell: { flex: 1, paddingRight: 8 },
  controlTitle: { fontSize: 9, fontFamily: "Helvetica-Bold", color: TEXT, marginBottom: 2 },
  controlDesc: { fontSize: 8, color: MUTED, lineHeight: 1.5 },
  controlVerified: { fontSize: 7.5, color: GREEN, fontFamily: "Helvetica-Bold", marginTop: 3 },

  // Threat block
  threatBlock: {
    backgroundColor: CARD,
    borderWidth: 1, borderColor: BORDER,
    borderRadius: 3, padding: "10 14", marginBottom: 8,
  },
  threatHeader: { flexDirection: "row", alignItems: "flex-start", marginBottom: 5 },
  threatName: { flex: 1, fontSize: 10, fontFamily: "Helvetica-Bold", color: TEXT },
  threatScore: { fontSize: 7.5, color: PURPLE_L, fontFamily: "Helvetica-Bold" },
  threatWhy: { fontSize: 8.5, color: MUTED, lineHeight: 1.55, marginBottom: 6 },
  threatStats: { flexDirection: "row", marginBottom: 6, gap: 16 },
  threatStat: { fontSize: 7.5, color: SUBTLE },

  // TOC row
  tocRow: {
    flexDirection: "row", alignItems: "center",
    paddingVertical: 6,
    borderBottomWidth: 1, borderBottomColor: BORDER,
  },
  tocNumBadge: {
    width: 22, height: 22,
    backgroundColor: `${GOLD}18`,
    borderWidth: 1, borderColor: `${GOLD}40`,
    borderRadius: 3,
    alignItems: "center", justifyContent: "center",
    marginRight: 12,
    flexShrink: 0,
  },
  tocNum: { fontSize: 8, fontFamily: "Helvetica-Bold", color: GOLD },
  tocTitle: { flex: 1, fontSize: 10.5, color: TEXT },
  tocSection: { fontSize: 7.5, color: SUBTLE, fontFamily: "Helvetica-Bold", letterSpacing: 0.8 },

  // Divider
  divider: { height: 1, backgroundColor: BORDER, marginVertical: 16 },

  // Action item
  actionItem: {
    flexDirection: "row", marginBottom: 10, alignItems: "flex-start",
  },
  actionNum: {
    width: 22, height: 22,
    backgroundColor: `${GOLD}18`,
    borderWidth: 1, borderColor: `${GOLD}40`,
    borderRadius: 3,
    alignItems: "center", justifyContent: "center",
    marginRight: 10, flexShrink: 0,
  },
  actionNumText: { fontSize: 8, fontFamily: "Helvetica-Bold", color: GOLD },
  actionText: { fontSize: 9.5, color: TEXT, lineHeight: 1.65, flex: 1, paddingTop: 2 },
});

// ─── Public data interface ────────────────────────────────────────────────────
export interface DefenseReviewReportData {
  review: DefenseReview;
  project: Project | null;
  assets: ProjectAsset[];
  findings: AdminSurfaceFinding[];
  controls: ProjectControl[];
  relevance: ProjectRelevance | null;
  logoPath: string;
}

// ─── Reusable micro-components ────────────────────────────────────────────────
function Pill({ label, color }: { label: string; color: string }) {
  return (
    <View style={[S.pill, { backgroundColor: `${color}18`, borderWidth: 1, borderColor: `${color}44` }]}>
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
      <Text style={S.metaLabel}>{label}</Text>
      <Text style={[S.metaValue, valueColor ? { color: valueColor } : {}]}>{value}</Text>
    </View>
  );
}

function SectionHeading({ num, title }: { num: number; title: string }) {
  return (
    <View style={S.sectionHeading}>
      <View style={S.sectionNumBadge}>
        <Text style={S.sectionNum}>{String(num).padStart(2, "0")}</Text>
      </View>
      <Text style={S.sectionTitle}>{title.toUpperCase()}</Text>
    </View>
  );
}

function StatGrid({ stats }: { stats: Array<{ label: string; value: string | number; color?: string }> }) {
  return (
    <View style={S.statRow}>
      {stats.map((s, i) => (
        <View key={i} style={i === stats.length - 1 ? S.statCardLast : S.statCard}>
          <Text style={S.statLabel}>{s.label.toUpperCase()}</Text>
          <Text style={[S.statValue, s.color ? { color: s.color } : {}]}>{String(s.value)}</Text>
        </View>
      ))}
    </View>
  );
}

function SmallEvidenceBadge({ label }: { label?: string }) {
  const normalized = (label ?? "evidence required").toLowerCase();
  const color = normalized.includes("verified") ? GREEN
    : normalized.includes("unresolved") || normalized.includes("blocked") ? GOLD
      : MUTED;
  return (
    <View style={{ backgroundColor: `${color}18`, borderWidth: 1, borderColor: `${color}44`, borderRadius: 2, paddingHorizontal: 5, paddingVertical: 2 }}>
      <Text style={{ fontSize: 6, fontFamily: "Helvetica-Bold", color, letterSpacing: 0.8 }}>
        {(label || "Evidence Required").toUpperCase()}
      </Text>
    </View>
  );
}

function compactList(values?: string[], fallback = "Mapped assets"): string {
  if (!values || values.length === 0) return fallback;
  return values.slice(0, 5).join(", ");
}

function normalizeCustomerOwnerCopy(value?: string | null): string {
  return (value ?? "")
    .replace(/\beoa owner\b/g, "EOA owner")
    .replace(/\bsame eoa owner address\b/g, "same EOA owner address");
}

// ─── Header & Footer ─────────────────────────────────────────────────────────
function PageHeader({ logoPath, projectName }: { logoPath: string; projectName: string }) {
  return (
    <View style={S.header} fixed>
      <Image src={logoPath} style={S.headerLogo} />
      <Text style={S.headerTitle}>
        SCE · PUBLIC-SURFACE DEFENSE REVIEW · {projectName.toUpperCase()}
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
      <Text style={S.footerCenter}>Sagitta Continuity Engine</Text>
      <Text style={S.footerText} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
    </View>
  );
}

// ─── Cover Page ───────────────────────────────────────────────────────────────
function CoverPage({ data }: { data: DefenseReviewReportData }) {
  const { review, project, logoPath } = data;
  const analyticalFindings = data.findings.filter((f) => findingCategory(f) === "analytical_finding");
  const supportingReceipts = data.findings.filter((f) => findingCategory(f) === "supporting_evidence_receipt");
  const critCount = analyticalFindings.filter((f) => f.severity === "critical").length;
  const highCount = analyticalFindings.filter((f) => f.severity === "high").length;
  const riskColor = critCount > 0 ? RED : highCount > 0 ? ORANGE : GOLD;
  const riskLabel = critCount > 0 ? "CRITICAL RISK" : highCount > 0 ? "HIGH RISK" : "UNDER REVIEW";
  const isSampleReport = review.projectName.toLowerCase().includes("sagitta protocol");
  const concentrationFinding = analyticalFindings.find((f) => f.findingType === "role_concentration");
  const concentrationEvidence = concentrationFinding?.evidence as Record<string, unknown> | undefined;
  const concentrationNames = [
    ...evidenceAssetNames(concentrationEvidence?.assetsAffected),
    ...evidenceAssetNames(concentrationEvidence?.controlledAssets),
  ].filter((name, index, all) => all.indexOf(name) === index);
  const coverCandidateCount = review.candidateAssetsDiscoveredCount ?? (review.customerDiscoveredCandidateAssets ?? []).length;
  const coverRiskLine = concentrationNames.length >= 2
    ? `Shared owner concentration across ${concentrationNames.length} assets requires verification.`
    : critCount > 0
      ? `${critCount} critical authority surface${critCount > 1 ? "s" : ""} require immediate attention.`
      : highCount > 0
        ? `${highCount} high-risk authority surface${highCount > 1 ? "s" : ""} require${highCount === 1 ? "s" : ""} verification.`
        : analyticalFindings.length > 0
          ? `${analyticalFindings.length} open authority-surface finding${analyticalFindings.length !== 1 ? "s" : ""} require${analyticalFindings.length === 1 ? "s" : ""} verification.`
        : review.candidateScopeState === "candidates_imported_scan_complete"
          ? `${review.scannedAssetCount ?? review.assetsCount} mapped assets scanned; imported candidates pending evidence review.`
        : supportingReceipts.length > 0 && coverCandidateCount > 0
          ? `${supportingReceipts.length} evidence receipt${supportingReceipts.length !== 1 ? "s" : ""}; ${coverCandidateCount} candidate asset${coverCandidateCount !== 1 ? "s" : ""} discovered, awaiting scope approval.`
          : supportingReceipts.length > 0
            ? `${supportingReceipts.length} supporting evidence receipt${supportingReceipts.length !== 1 ? "s" : ""} recorded. Review in progress.`
            : "No open analytical findings recorded. Review in progress.";

  return (
    <Page size="A4" style={S.coverPage}>
      {/* Top accent — purple + gold gradient effect via two bars */}
      <View style={{ height: 3, backgroundColor: PURPLE }} />
      <View style={{ height: 3, backgroundColor: GOLD }} />

      <View style={{ flex: 1, paddingHorizontal: 56, paddingTop: 60, paddingBottom: 48, flexDirection: "column" }}>

        {/* Logo + wordmark + confidential badge */}
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 56 }}>
          <Image src={logoPath} style={{ width: 64, height: 64, marginRight: 20 }} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 26, color: GOLD, letterSpacing: 3 }}>SCE</Text>
            <Text style={{ fontSize: 7.5, color: MUTED, letterSpacing: 2.8, marginTop: 3 }}>SAGITTA CONTINUITY ENGINE</Text>
          </View>
          <View style={{
            borderWidth: 1, borderColor: `${GOLD}50`, borderRadius: 3,
            paddingHorizontal: 10, paddingVertical: 5, backgroundColor: GOLD_BG,
          }}>
            <Text style={{ fontSize: 7, fontFamily: "Helvetica-Bold", color: GOLD, letterSpacing: 2 }}>CONFIDENTIAL</Text>
          </View>
        </View>

        {/* Purple accent line */}
        <View style={{ flexDirection: "row", marginBottom: 18 }}>
          <View style={{ width: 36, height: 2, backgroundColor: PURPLE, borderRadius: 1 }} />
          <View style={{ width: 18, height: 2, backgroundColor: `${GOLD}80`, borderRadius: 1, marginLeft: 4 }} />
        </View>

        {/* Report type */}
        <Text style={{ fontSize: 8, color: `${GOLD}99`, letterSpacing: 3.8, marginBottom: 16, textTransform: "uppercase" }}>
          Public-Surface Defense Review Report
        </Text>

        {/* Sample banner */}
        {isSampleReport ? (
          <View style={{ borderWidth: 1, borderColor: `${PURPLE}55`, backgroundColor: `${PURPLE}10`, padding: "10 14", marginBottom: 20, borderRadius: 3 }}>
            <Text style={{ fontSize: 8, fontFamily: "Helvetica-Bold", color: PURPLE_L, letterSpacing: 1.4, marginBottom: 3 }}>
              SAMPLE — STRUCTURE DEMONSTRATION
            </Text>
            <Text style={{ fontSize: 8, color: MUTED }}>
              Demo report using Sagitta Protocol testnet deployment. Not a verified client result.
            </Text>
          </View>
        ) : null}

        {/* Project name */}
        <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 36, color: TEXT, lineHeight: 1.1, marginBottom: 8 }}>
          {review.projectName}
        </Text>

        {/* Prepared by */}
        <Text style={{ fontSize: 10, color: MUTED, marginBottom: 44 }}>
          Prepared by Sagitta Continuity Engine (SCE) · {fmtDate(review.updatedAt)}
        </Text>

        {/* Risk posture banner */}
        <View style={{
          borderLeftWidth: 4, borderLeftColor: riskColor,
          backgroundColor: `${riskColor}10`,
          padding: "12 16", borderRadius: "0 3 3 0", marginBottom: 28,
        }}>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
            <View style={{ backgroundColor: `${riskColor}30`, borderRadius: 2, paddingHorizontal: 6, paddingVertical: 2, marginRight: 8 }}>
              <Text style={{ fontSize: 6.5, fontFamily: "Helvetica-Bold", color: riskColor, letterSpacing: 1.5 }}>RISK POSTURE</Text>
            </View>
            <Text style={{ fontSize: 9.5, fontFamily: "Helvetica-Bold", color: riskColor, letterSpacing: 0.8 }}>{riskLabel}</Text>
          </View>
          <Text style={{ fontSize: 9, color: TEXT, lineHeight: 1.5 }}>{coverRiskLine}</Text>
        </View>

        {/* Metadata table */}
        <View style={{ backgroundColor: SURFACE, borderWidth: 1, borderColor: BORDER, borderRadius: 4, overflow: "hidden", marginBottom: 32 }}>
          {/* Table header */}
          <View style={{ backgroundColor: `${PURPLE}18`, paddingVertical: 7, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: BORDER }}>
            <Text style={{ fontSize: 6.5, fontFamily: "Helvetica-Bold", color: MUTED, letterSpacing: 1.4 }}>REPORT METADATA</Text>
          </View>
          {[
            { label: "Review ID", value: review.id },
            { label: "Status", value: REVIEW_STATUS_LABEL[review.status] },
            { label: "Date Issued", value: fmtDate(review.updatedAt) },
            { label: "Environment", value: project?.environment?.toUpperCase() ?? "—" },
            { label: "Assets Mapped", value: String(review.assetsCount) },
            { label: "Open Analytical Findings", value: String(analyticalFindings.length) },
            { label: "Supporting Evidence Receipts", value: String(supportingReceipts.length) },
            { label: "Candidate Assets Discovered", value: String(review.candidateAssetsDiscoveredCount ?? (review.customerDiscoveredCandidateAssets ?? []).length) },
            { label: "Imported Candidate Assets", value: String(review.importedCandidateCount ?? 0) },
            { label: "Already Mapped Candidates", value: String(review.alreadyMappedCandidateCount ?? 0) },
          ].map((row, i) => (
            <View key={i} style={{
              flexDirection: "row", paddingVertical: 7, paddingHorizontal: 16,
              borderBottomWidth: i < 9 ? 1 : 0, borderBottomColor: BORDER,
              backgroundColor: i % 2 === 1 ? `${CARD}` : "transparent",
            }}>
              <Text style={{ fontSize: 8, color: SUBTLE, width: 130, fontFamily: "Helvetica-Bold", letterSpacing: 0.4 }}>{row.label}</Text>
              <Text style={{ fontSize: 8.5, color: TEXT, flex: 1 }}>{row.value}</Text>
            </View>
          ))}
        </View>

        <View style={{ flex: 1 }} />

        {/* Confidentiality notice */}
        <View style={{ borderTopWidth: 1, borderTopColor: BORDER, paddingTop: 14 }}>
          <Text style={{ fontSize: 7, fontFamily: "Helvetica-Bold", color: `${GOLD}BB`, letterSpacing: 1.2, marginBottom: 5 }}>
            CONFIDENTIAL — FOR ADDRESSEE ONLY
          </Text>
          <Text style={{ fontSize: 7, color: SUBTLE, lineHeight: 1.65 }}>
            This report is prepared solely for the addressee and is intended only for the internal use of the named recipient. The findings and recommendations are based on publicly available information and represent SCE's analysis as of the date of issue. SCE does not hold custody of any project assets, private keys, or signing credentials. Distribution or reproduction without written consent from Sagitta Continuity Engine (SCE) is prohibited.
          </Text>
        </View>
      </View>

      {/* Bottom accent bars */}
      <View style={{ height: 3, backgroundColor: GOLD_DIM }} />
      <View style={{ height: 2, backgroundColor: `${PURPLE}80` }} />
    </Page>
  );
}

// ─── Table of Contents Page ───────────────────────────────────────────────────
const TOC_ENTRIES = [
  { num: 1, title: "Executive Summary" },
  { num: 2, title: "Review Scope" },
  { num: 3, title: "Observed Public Facts" },
  { num: 4, title: "Authority Surface Findings" },
  { num: 5, title: "Protocol-Specific Interpretation" },
  { num: 6, title: "Unresolved Assumptions" },
  { num: 7, title: "Priority Review Path" },
  { num: 8, title: "Evidence Requested" },
  { num: 9, title: "Source / ABI Verification Status" },
  { num: 10, title: "Relevant Threat Families" },
  { num: 11, title: "Known Limitations / Follow-up Scope" },
  { num: 12, title: "Evidence Status" },
  { num: 13, title: "Next Actions" },
];

function TocPage({ data }: { data: DefenseReviewReportData }) {
  const { review, logoPath } = data;
  const tocAnalyticalFindings = data.findings.filter((f) => findingCategory(f) === "analytical_finding");
  const tocSupportingReceipts = data.findings.filter((f) => findingCategory(f) === "supporting_evidence_receipt");
  const tocCandidateCount = review.candidateAssetsDiscoveredCount ?? (review.customerDiscoveredCandidateAssets ?? []).length;
  const tocThreatFamilyCount = data.relevance?.relevantThreatFamilies.length ?? 0;
  const tocActiveAssets = data.assets.filter((a) => a.status !== "archived");
  const tocUnresolvedAssumptions = (review.customerUnresolvedAssumptions ?? []).length;
  return (
    <Page size="A4" style={S.page}>
      <PageHeader logoPath={logoPath} projectName={review.projectName} />
      <PageFooter projectName={review.projectName} date={fmtDateShort(review.updatedAt)} />

      <View style={{ marginBottom: 18 }}>
        <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 22, color: TEXT, marginBottom: 4 }}>
          Table of Contents
        </Text>
        <Text style={{ fontSize: 9, color: MUTED }}>
          {review.projectName} · Public-Surface Defense Review · {fmtDate(review.updatedAt)}
        </Text>
        <View style={{ flexDirection: "row", marginTop: 14 }}>
          <View style={{ width: 32, height: 2, backgroundColor: PURPLE, borderRadius: 1 }} />
          <View style={{ width: 16, height: 2, backgroundColor: `${GOLD}80`, borderRadius: 1, marginLeft: 4 }} />
        </View>
      </View>

      {TOC_ENTRIES.map((entry) => (
        <View key={entry.num} style={S.tocRow} wrap={false}>
          <View style={S.tocNumBadge}>
            <Text style={S.tocNum}>{String(entry.num).padStart(2, "0")}</Text>
          </View>
          <Text style={S.tocTitle}>{entry.title}</Text>
          <View style={{ borderBottomWidth: 1, borderBottomStyle: "dashed", borderBottomColor: BORDER, flex: 1, height: 0, alignSelf: "center", marginHorizontal: 12 }} />
          <Text style={S.tocSection}>§ {String(entry.num).padStart(2, "0")}</Text>
        </View>
      ))}

      {/* Report summary */}
      <View style={{
        marginTop: 18, padding: "12 16",
        backgroundColor: CARD,
        borderRadius: 4,
        borderLeftWidth: 3, borderLeftColor: PURPLE,
      }}>
        <Text style={{ fontSize: 7.5, fontFamily: "Helvetica-Bold", color: PURPLE_L, letterSpacing: 1.2, marginBottom: 6 }}>
          REPORT SUMMARY
        </Text>
        <Text style={{ fontSize: 8.5, color: MUTED, lineHeight: 1.7 }}>
          {tocAnalyticalFindings.length === 0 && tocSupportingReceipts.length > 0 ? (
            <>
              {"This report includes "}
              <Text style={{ color: TEXT, fontFamily: "Helvetica-Bold" }}>{tocSupportingReceipts.length} supporting evidence receipt{tocSupportingReceipts.length !== 1 ? "s" : ""}</Text>
              {tocCandidateCount > 0 ? (
                <>{", "}<Text style={{ color: TEXT, fontFamily: "Helvetica-Bold" }}>{tocCandidateCount} discovered candidate asset{tocCandidateCount !== 1 ? "s" : ""}</Text></>
              ) : null}
              {", "}
              <Text style={{ color: TEXT, fontFamily: "Helvetica-Bold" }}>{tocThreatFamilyCount} relevant threat famil{tocThreatFamilyCount !== 1 ? "ies" : "y"}</Text>
              {", and "}
              <Text style={{ color: TEXT, fontFamily: "Helvetica-Bold" }}>{tocUnresolvedAssumptions} unresolved assumption{tocUnresolvedAssumptions !== 1 ? "s" : ""}</Text>
              {" across "}
              <Text style={{ color: TEXT, fontFamily: "Helvetica-Bold" }}>{tocActiveAssets.length} mapped asset{tocActiveAssets.length !== 1 ? "s" : ""}</Text>
              {"."}
            </>
          ) : (
            <>
              {"This report covers "}
              <Text style={{ color: TEXT, fontFamily: "Helvetica-Bold" }}>{tocAnalyticalFindings.length} open analytical finding{tocAnalyticalFindings.length !== 1 ? "s" : ""}</Text>
              {tocSupportingReceipts.length > 0 ? (
                <>{", "}<Text style={{ color: TEXT, fontFamily: "Helvetica-Bold" }}>{tocSupportingReceipts.length} supporting evidence receipt{tocSupportingReceipts.length !== 1 ? "s" : ""}</Text></>
              ) : null}
              {", "}
              <Text style={{ color: TEXT, fontFamily: "Helvetica-Bold" }}>{tocThreatFamilyCount} relevant threat famil{tocThreatFamilyCount !== 1 ? "ies" : "y"}</Text>
              {", and "}
              <Text style={{ color: TEXT, fontFamily: "Helvetica-Bold" }}>{tocUnresolvedAssumptions} unresolved assumption{tocUnresolvedAssumptions !== 1 ? "s" : ""}</Text>
              {" across "}
              <Text style={{ color: TEXT, fontFamily: "Helvetica-Bold" }}>{tocActiveAssets.length} mapped asset{tocActiveAssets.length !== 1 ? "s" : ""}</Text>
              {"."}
            </>
          )}
        </Text>
      </View>
    </Page>
  );
}

// ─── Content page ─────────────────────────────────────────────────────────────
function ContentPage({ data }: { data: DefenseReviewReportData }) {
  const { review, project, assets, findings, controls, relevance, logoPath } = data;
  const date = fmtDateShort(review.updatedAt);

  const openItems = findings;
  const openFindings = openItems.filter((f) => findingCategory(f) === "analytical_finding");
  const supportingEvidenceReceipts = openItems.filter((f) => findingCategory(f) === "supporting_evidence_receipt");
  const critCount = openFindings.filter((f) => f.severity === "critical").length;
  const highCount = openFindings.filter((f) => f.severity === "high").length;
  const verifiedControls = controls.filter((c) => c.status === "verified");
  const controlCoverage = controls.length > 0 ? Math.round((verifiedControls.length / controls.length) * 100) : 0;
  const isEvidenceComplete = verifiedControls.length > 0 && controlCoverage === 100;
  const authorityRoles = new Set(["treasury", "vault", "escrow", "reserve", "oracle"]);
  const resolvedOwnerFindings = openItems.filter(
    (f) => f.findingType === "owner_detected" && (f.evidence as Record<string, unknown>)?.confidence === "verified",
  );
  const unresolvedOwnerFindings = openFindings.filter((f) => {
    const role = (f.evidence as Record<string, unknown>)?.role;
    return f.findingType === "unknown_admin" && typeof role === "string" && authorityRoles.has(role);
  });
  const authorityRootFindings = [...resolvedOwnerFindings, ...unresolvedOwnerFindings];
  const authorityPathsResolved = resolvedOwnerFindings.reduce((sum, f) => {
    const cnt = ((f.evidence as Record<string, unknown>) ?? {})?.assetCount as number | undefined;
    return sum + (cnt && cnt > 1 ? cnt : 1);
  }, 0);
  const authorityPathsAwaiting = unresolvedOwnerFindings.length;
  const authorityAssetsTotal = authorityPathsResolved + authorityPathsAwaiting;

  const concentrationFinding = openFindings.find((f) => f.findingType === "role_concentration");
  const sharedOwnerAddr = (concentrationFinding?.evidence as Record<string, unknown> | undefined)?.adminAddress as string | undefined;
  const concentrationEvidence = concentrationFinding?.evidence as Record<string, unknown> | undefined;
  const sharedOwnerType = concentrationEvidence?.ownerType as string | undefined;
  const sharedOwnerTypeMethod = concentrationEvidence?.ownerTypeDetectionMethod as string | undefined;
  const sharedOwnerTypeEvidence = concentrationEvidence?.ownerTypeEvidence as string | undefined;
  const concentrationAssetNames = [
    ...evidenceAssetNames(concentrationEvidence?.assetsAffected),
    ...evidenceAssetNames(concentrationEvidence?.controlledAssets),
  ].filter((name, index, all) => all.indexOf(name) === index);
  const sharedOwnerAssetCount = concentrationAssetNames.length;
  const primaryFindingText = concentrationAssetNames.length > 0
    ? `Primary Finding: Shared owner concentration across ${concentrationAssetNames.join(", ")}`
    : undefined;
  const resolvedAssetNames = resolvedOwnerFindings.flatMap((f) => {
    const ev = f.evidence as Record<string, unknown> | undefined;
    const multi = ev?.resolvedAssets as string[] | undefined;
    if (multi && multi.length > 1) return multi;
    const a = assets.find((asset) => asset.id === f.assetId);
    return [a?.name ?? "Unknown"];
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

  const detectorExecutionIncomplete = [
    "inconclusive_transport_failure",
    "detector_execution_inconclusive",
    "rpc_configured_preflight_failed",
  ].includes(review.rpcStatus ?? "");
  const authorityResolvedDisplay = detectorExecutionIncomplete
    ? "Inconclusive"
    : authorityAssetsTotal > 0 ? `${authorityPathsResolved} / ${authorityAssetsTotal}` : "Not assessed";
  const ownerEvidenceDisplay = detectorExecutionIncomplete
    ? "Inconclusive"
    : authorityAssetsTotal > 0 ? `${authorityPathsResolved} / ${authorityAssetsTotal}` : "Not assessed";
  const awaitingEvidenceDisplay = detectorExecutionIncomplete
    ? "Pending scan rerun"
    : authorityAssetsTotal > 0 ? `${authorityPathsAwaiting} / ${authorityAssetsTotal}` : "Not assessed";
  const candidates = review.customerDiscoveredCandidateAssets ?? [];
  const mappedSourceAvailable = review.sourceVerificationStatus === "available";
  const fallbackNextActions = buildNextActions(openFindings, controls, {
    sharedOwnerAddr, unresolvedAssetNames, sharedOwnerType, projectName: review.projectName,
    scanInconclusive: detectorExecutionIncomplete,
    candidateCount: candidates.length,
    candidateScopeState: review.candidateScopeState,
    mappedSourceAvailable,
  });
  const nextActions = reportNextActions(review, fallbackNextActions);
  const continuityRiskNarrative = normalizeCustomerOwnerCopy(review.customerContinuityRiskNarrative) || whatThisMeansCopy(review, {
    resolvedCount: authorityPathsResolved,
    unresolvedCount: authorityPathsAwaiting,
    totalAssets: activeAssets.length,
    resolvedAssetNames,
    unresolvedAssetNames,
    sharedOwnerAddr,
    sharedOwnerAssetCount,
    sharedOwnerType,
    sharedOwnerTypeMethod,
    sharedOwnerTypeEvidence,
    candidateCount: candidates.length,
  });
  const topEvidenceGates = review.customerAuthoritySurfaceFindings ?? [];
  const observedPublicFacts = review.customerObservedPublicFacts ?? [];
  const protocolInterpretation = review.customerProtocolSpecificInterpretation ?? [];
  const unresolvedAssumptions = review.customerUnresolvedAssumptions ?? [];
  const followUpScope = review.customerFollowUpScope ?? [];
  const evidenceStatus = review.customerEvidenceStatus ?? {};
  const evidenceRequestedGroups = review.customerEvidenceRequested ?? [];
  const candidateControlChecks: Array<{ group?: string; status?: string; title: string }> = [];
  const sourceAbiLimitationNote = review.customerSourceAbiLimitationNote;
  const detectorEvidence = review.customerDetectorEvidence ?? [];
  const timelockCanonicalization = review.customerTimelockCanonicalization ?? [];
  const scopeNote = review.customerScopeNote;
  const reviewLimitation = review.customerReviewLimitation;
  const expansion = review.customerProtocolSurfaceExpansion;
  const explorerEvidenceByAsset = reportSourceSummaryByAsset(review);
  const scanMetadataAvailable = hasScanMetadata(review);
  const scanStatusText = scanStatusLabel(review.scanStatus);

  const findingsBySev = (["critical", "high", "medium", "low"] as AdminFindingSeverity[])
    .map((sev) => ({
      sev,
      items: openItems
        .filter((f) => f.severity === sev)
        .sort((a, b) => findingDisplayOrder(a) - findingDisplayOrder(b)),
    }))
    .filter((g) => g.items.length > 0);

  const titleCounts = new Map<string, number>();
  for (const c of controls) titleCounts.set(c.title, (titleCounts.get(c.title) ?? 0) + 1);
  const controlGroups = buildControlGroups(controls, assets, openFindings);
  const controlsPreface = "Evidence status reports scoped observations, open findings, unresolved assumptions, and requested follow-up evidence.";

  const riskColor = critCount > 0 ? RED : highCount > 0 ? ORANGE : isEvidenceComplete ? GREEN : GOLD;
  const riskLabel = critCount > 0 ? "CRITICAL RISK" : highCount > 0 ? "HIGH RISK" : isEvidenceComplete ? "EVIDENCE COMPLETE" : "UNDER REVIEW";
  const riskDesc = critCount > 0
    ? `${critCount} critical authority surface${critCount > 1 ? "s" : ""} require immediate attention before deployment.`
    : highCount > 0
      ? `${highCount} high-risk authority surface${highCount > 1 ? "s" : ""} require${highCount === 1 ? "s" : ""} verification. These are unresolved authority surfaces, not confirmed vulnerabilities.`
      : openFindings.length > 0
        ? `${openFindings.length} open authority-surface finding${openFindings.length !== 1 ? "s" : ""} require${openFindings.length === 1 ? "s" : ""} verification. These are unresolved authority surfaces, not confirmed vulnerabilities.`
      : isEvidenceComplete
        ? "All current public evidence observations have been reviewed for this report snapshot."
        : "Evidence review remains open pending supporting material and follow-up analysis.";

  return (
    <Page size="A4" style={S.page}>
      <PageHeader logoPath={logoPath} projectName={review.projectName} />
      <PageFooter projectName={review.projectName} date={date} />

      {/* ── 01 Executive Summary ────────────────────────────────── */}
      <SectionHeading num={1} title="Executive Summary" />

      <Text style={S.body}>
        This report reflects a public-surface review of{" "}
        <Text style={{ fontFamily: "Helvetica-Bold", color: TEXT }}>{review.projectName}</Text>{" "}
        conducted by Sagitta Continuity Engine (SCE). The analysis covers mapped public assets, authority surface findings derived from the Admin Surface Scanner, relevant threat families, and requested evidence. SCE does not administer this project, hold keys, or execute on-chain transactions.
      </Text>
      <Text style={S.body}>
        This report includes {supportingEvidenceReceipts.length || review.supportingEvidenceReceiptsCount || 0} supporting evidence receipt{(supportingEvidenceReceipts.length || review.supportingEvidenceReceiptsCount || 0) === 1 ? "" : "s"} and {unresolvedAssumptions.length} unresolved assumption{unresolvedAssumptions.length === 1 ? "" : "s"} across {activeAssets.length || review.assetsCount} mapped asset{(activeAssets.length || review.assetsCount) === 1 ? "" : "s"}.
      </Text>
      {primaryFindingText ? (
        <Text style={[S.body, { fontFamily: "Helvetica-Bold", color: TEXT, marginBottom: 12 }]}>{primaryFindingText}</Text>
      ) : null}
      {authorityAssetsTotal > 0 ? (
        <Text style={[S.body, { marginBottom: 8 }]}>
          Authority review resolved {authorityPathsResolved} of {authorityAssetsTotal} mapped authority path{authorityAssetsTotal !== 1 ? "s" : ""}; {authorityPathsAwaiting} {authorityPathsAwaiting === 1 ? "remains" : "remain"} awaiting evidence.
        </Text>
      ) : null}
      {topEvidenceGates[0]?.title ? (
        <Text style={[S.body, { marginBottom: 12 }]}>
          Top evidence gate: {topEvidenceGates[0].title}
        </Text>
      ) : null}

      <View style={{ marginBottom: 14, padding: "10 12", borderLeftWidth: 3, borderLeftColor: PURPLE, backgroundColor: `${PURPLE}0D`, borderRadius: "0 3 3 0" }} wrap={false}>
        <Text style={{ fontSize: 8, fontFamily: "Helvetica-Bold", color: PURPLE_L, letterSpacing: 1, marginBottom: 5 }}>How to Read This Review</Text>
        <Text style={S.findingSubText}>
          Observed public facts are evidence inputs. They do not verify operating policy, signer custody, emergency procedures, or governance intent. Evidence requests identify remaining review needs. This Defense Review is not an audit or certification.
        </Text>
      </View>

      {/* Risk posture callout */}
      <View style={{
        borderLeftWidth: 4, borderLeftColor: riskColor,
        backgroundColor: `${riskColor}0E`, padding: "10 14",
        borderRadius: "0 3 3 0", marginBottom: 14,
      }}>
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
          <View style={{ backgroundColor: `${riskColor}25`, borderRadius: 2, paddingHorizontal: 6, paddingVertical: 2, marginRight: 8 }}>
            <Text style={{ fontSize: 6, fontFamily: "Helvetica-Bold", color: riskColor, letterSpacing: 1.5 }}>RISK POSTURE</Text>
          </View>
          <Text style={{ fontSize: 9, fontFamily: "Helvetica-Bold", color: riskColor }}>{riskLabel}</Text>
        </View>
        <Text style={{ fontSize: 9, color: TEXT, lineHeight: 1.55 }}>{riskDesc}</Text>
      </View>

      <Text style={{ fontSize: 7, fontFamily: "Helvetica-Bold", color: MUTED, letterSpacing: 1.2, marginBottom: 6 }}>OBSERVED BY SCE</Text>
      <StatGrid stats={[
        { label: "Assets Mapped", value: activeAssets.length || review.assetsCount },
        { label: "Paths Resolved", value: authorityResolvedDisplay, color: authorityPathsResolved > 0 ? GREEN : TEXT },
        { label: "Owner Observed", value: ownerEvidenceDisplay, color: authorityPathsResolved > 0 ? GREEN : TEXT },
        { label: "Open Analytical Findings", value: openFindings.length },
        { label: "Receipts", value: supportingEvidenceReceipts.length || review.supportingEvidenceReceiptsCount || 0 },
        { label: "Candidates", value: candidates.length, color: candidates.length > 0 ? GOLD : TEXT },
      ]} />

      {(review.scanStatus === "partial" || review.scanStatus === "error") ? (
        <StatGrid stats={[{ label: "Scan Status", value: scanStatusText, color: GOLD }]} />
      ) : null}

      {/* Scan status table */}
      <View style={{ backgroundColor: SURFACE, borderWidth: 1, borderColor: BORDER, borderRadius: 3, overflow: "hidden", marginBottom: 12 }}>
        <View style={{ backgroundColor: `${PURPLE}18`, paddingVertical: 6, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: BORDER }}>
          <Text style={{ fontSize: 6.5, fontFamily: "Helvetica-Bold", color: MUTED, letterSpacing: 1.4 }}>SCAN STATUS</Text>
        </View>
        <View style={{ paddingHorizontal: 12, paddingBottom: 4, paddingTop: 2 }}>
          {scanMetadataAvailable ? (
            <>
              <MetaLine label="Last scan" value={fmtDate(review.lastScanAt)} />
              <MetaLine label="Chains scanned" value={chainListLabel(review.scanChainsConfigured)} />
              <MetaLine label="Assets scanned" value={`${review.scannedAssetCount ?? (activeAssets.length || review.assetsCount)} / ${review.mappedAssetCount ?? (activeAssets.length || review.assetsCount)}`} />
              <MetaLine label="Detector attempts" value={review.detectorRunCount > 0 ? AUTHORITY_DETECTOR_ATTEMPTS : "Not available"} />
              <MetaLine label="Scan Status" value={scanStatusText} valueColor={review.scanStatus === "error" || review.scanStatus === "partial" ? ORANGE : undefined} />
              <MetaLine label="RPC config" value={review.scanNotes || (review.scanChainsUnconfigured.length > 0 ? `Unconfigured: ${chainListLabel(review.scanChainsUnconfigured)}` : "Configured")} />
            </>
          ) : (
            <MetaLine label="Scan Status" value="Not available" />
          )}
          {review.rpcStatus === "detector_execution_completed" ? (
            <Text style={S.findingSubText}>RPC public-call checks completed after RPC preflight passed. Detector observations establish public facts only.</Text>
          ) : null}
        </View>
      </View>

      {(reviewLimitation || detectorExecutionIncomplete) ? (
        <View style={{ borderLeftWidth: 3, borderLeftColor: GOLD, backgroundColor: `${GOLD}0A`, padding: "9 12", marginBottom: 12 }} wrap={false}>
          <Text style={{ fontSize: 8, fontFamily: "Helvetica-Bold", color: GOLD, marginBottom: 4 }}>REVIEW LIMITATION / SCAN INCONCLUSIVE</Text>
          <Text style={{ fontSize: 8, fontFamily: "Helvetica-Bold", color: TEXT, marginBottom: 3 }}>What this means</Text>
          <Text style={S.findingSubText}>
            {review.rpcStatus === "rpc_configured_preflight_failed"
              ? "Scan inconclusive - RPC preflight failed; detector execution was skipped."
              : "RPC public-call checks attempted; detector execution failed. Scan inconclusive - retry required."}
          </Text>
          <Text style={S.findingSubText}>This execution failure does not prove a vulnerability or resolve an operating assumption.</Text>
          <Text style={S.findingSubText}>Evidence request: Re-run scan with working RPC transport.</Text>
        </View>
      ) : null}

      <View style={S.divider} />

      {/* ── 02 Review Scope ─────────────────────────────────────── */}
      <SectionHeading num={2} title="Review Scope" />

      {scopeNote ? (
        <View style={{ borderLeftWidth: 3, borderLeftColor: GOLD, backgroundColor: `${GOLD}0A`, padding: "9 12", marginBottom: 12 }} wrap={false}>
          <Text style={S.findingSubText}>{scopeNote}</Text>
        </View>
      ) : null}
      {Boolean(expansion?.safe_summary_message) ? (
        <View style={{ marginBottom: 12 }} wrap={false}>
          <Text style={{ fontSize: 7, fontFamily: "Helvetica-Bold", color: GOLD, letterSpacing: 1.2, marginBottom: 4 }}>DISCOVERED LINKED CONTRACT CANDIDATES</Text>
          <Text style={S.body}>{String(expansion?.safe_summary_message)}</Text>
          <Text style={S.findingSubText}>
            Imported: {review.importedCandidateCount ?? 0} | Already mapped: {review.alreadyMappedCandidateCount ?? 0} | Pending import: {review.pendingCandidateCount ?? 0}
          </Text>
          {candidates.map((candidate, i) => (
            <Text key={i} style={S.findingSubText}>
              Candidate: {candidateDisplayName(candidate)} ({candidate.suggested_role ?? "unknown_contract"}) at {candidate.discovered_address ?? "not resolved"}; discovered from {candidate.function_signature ?? candidate.discovery_method ?? "public evidence"}; confidence: {candidate.confidence ?? "unresolved"}; status: {candidate.status ?? "candidate"}.
            </Text>
          ))}
        </View>
      ) : null}
      <View style={{ backgroundColor: `${PURPLE}08`, borderWidth: 1, borderColor: `${PURPLE}25`, borderRadius: 3, padding: "10 14", marginBottom: 10 }}>
        <Text style={[S.body, { marginBottom: 4 }]}>
          This is a zero-custody public-surface review. SCE analyzes only publicly available metadata: contract addresses, deployment chains, admin surface indicators, and documented protocol configurations. No private keys, signing credentials, mnemonics, or seed phrases are requested or stored at any point.
        </Text>
        <Text style={{ fontSize: 7.5, color: SUBTLE, lineHeight: 1.5 }}>
          Public-surface describes the data reviewed; Confidential describes distribution of this report.
        </Text>
      </View>

      <View style={{ borderLeftWidth: 2, borderLeftColor: SUBTLE, backgroundColor: `${SUBTLE}08`, padding: "8 12", borderRadius: "0 3 3 0", marginBottom: 14 }}>
        <Text style={{ fontSize: 7, fontFamily: "Helvetica-Bold", color: SUBTLE, letterSpacing: 1.2, marginBottom: 3 }}>NOT AN AUDIT</Text>
        <Text style={{ fontSize: 8.5, color: SUBTLE, lineHeight: 1.55 }}>
          This Defense Review is not a full smart contract audit, formal verification report, penetration test, or economic exploit review. It is a zero-custody authority-surface and continuity-readiness review based on public metadata and submitted evidence.
        </Text>
      </View>

      {project?.description ? (
        <Text style={[S.body, { marginTop: 4 }]}>{project.description}</Text>
      ) : null}

      {/* Contracts table */}
      {contractAssets.length > 0 ? (
        <View style={{ marginBottom: 12 }}>
          <Text style={{ fontSize: 7, color: SUBTLE, letterSpacing: 1.2, fontFamily: "Helvetica-Bold", marginBottom: 6 }}>MAPPED CONTRACTS / PROXIES</Text>
          <View style={{ borderWidth: 1, borderColor: BORDER, borderRadius: 3, overflow: "hidden" }}>
            {/* Table header */}
            <View style={{ flexDirection: "row", backgroundColor: `${PURPLE}18`, paddingVertical: 6, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: BORDER }}>
              <Text style={[S.tableHeaderCell, { width: 68 }]}>TYPE</Text>
              <Text style={[S.tableHeaderCell, { width: 88 }]}>NAME</Text>
              <Text style={[S.tableHeaderCell, { flex: 1 }]}>ADDRESS</Text>
              <Text style={[S.tableHeaderCell, { width: 86 }]}>ADMIN / ROLE</Text>
              <Text style={[S.tableHeaderCell, { width: 74 }]}>SOURCE / ABI</Text>
            </View>
            {contractAssets.map((a, i) => (
              <View key={a.id} style={{
                flexDirection: "row",
                paddingVertical: 7, paddingHorizontal: 10,
                borderBottomWidth: i < contractAssets.length - 1 ? 1 : 0,
                borderBottomColor: BORDER,
                backgroundColor: i % 2 === 1 ? `${SURFACE}` : "transparent",
                alignItems: "flex-start",
              }}>
                <View style={{ width: 68 }}>
                  <Pill label={assetTypeLabel(a.assetType)} color={GOLD} />
                </View>
                <Text style={[S.tableCell, { width: 88, fontSize: 8.5 }]}>{reportAssetDisplayName(a, candidates, timelockCanonicalization)}</Text>
                <Text style={[S.tableCellMono, { flex: 1, fontSize: 7 }]}>
                  {shortAddress(a.address)}
                  {a.chain ? `\n${a.chain}${a.network ? ` / ${a.network}` : ""}` : ""}
                </Text>
                <Text style={[S.tableCellMuted, { width: 86, fontSize: 7.5 }]}>
                  {mappedOwnerDisplay(a, resolvedOwnerFindings, unresolvedOwnerFindings)}
                  {"\n"}<Text style={{ color: SUBTLE }}>Role: {assetRoleLabel(a)}</Text>
                  {reportAssetCanonicalStatus(a, timelockCanonicalization) ? `\n${reportAssetCanonicalStatus(a, timelockCanonicalization)}` : ""}
                </Text>
                <Text style={[S.tableCellMuted, { width: 74, fontSize: 7.5 }]}>
                  {`ABI: ${explorerEvidenceByAsset.get(a.name)?.abiStatus ?? "Not recorded"}\nSource: ${explorerEvidenceByAsset.get(a.name)?.sourceStatus ?? "Not recorded"}`}
                </Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {/* Other assets table */}
      {otherAssets.length > 0 ? (
        <View style={{ marginBottom: 12 }}>
          <Text style={{ fontSize: 7, color: SUBTLE, letterSpacing: 1.2, fontFamily: "Helvetica-Bold", marginBottom: 6 }}>OTHER MAPPED ASSETS</Text>
          <View style={{ borderWidth: 1, borderColor: BORDER, borderRadius: 3, overflow: "hidden" }}>
            <View style={{ flexDirection: "row", backgroundColor: `${PURPLE}18`, paddingVertical: 6, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: BORDER }}>
              <Text style={[S.tableHeaderCell, { width: 68 }]}>TYPE</Text>
              <Text style={[S.tableHeaderCell, { width: 88 }]}>NAME</Text>
              <Text style={[S.tableHeaderCell, { flex: 1 }]}>ADDRESS</Text>
              <Text style={[S.tableHeaderCell, { width: 112 }]}>ADMIN / ROLE</Text>
            </View>
            {otherAssets.map((a, i) => (
              <View key={a.id} style={{
                flexDirection: "row",
                paddingVertical: 7, paddingHorizontal: 10,
                borderBottomWidth: i < otherAssets.length - 1 ? 1 : 0,
                borderBottomColor: BORDER,
                backgroundColor: i % 2 === 1 ? `${SURFACE}` : "transparent",
                alignItems: "flex-start",
              }}>
                <View style={{ width: 68 }}>
                  <Pill label={assetTypeLabel(a.assetType)} color={GOLD} />
                </View>
                <Text style={[S.tableCell, { width: 88, fontSize: 8.5 }]}>{reportAssetDisplayName(a, candidates, timelockCanonicalization)}</Text>
                <Text style={[S.tableCellMono, { flex: 1, fontSize: 7 }]}>
                  {shortAddress(a.address)}
                  {a.chain ? `\n${a.chain}${a.network ? ` / ${a.network}` : ""}` : ""}
                </Text>
                <Text style={[S.tableCellMuted, { width: 112, fontSize: 7.5 }]}>
                  {mappedOwnerDisplay(a, resolvedOwnerFindings, unresolvedOwnerFindings)}
                  {"\n"}<Text style={{ color: SUBTLE }}>Role: {assetRoleLabel(a)}</Text>
                  {reportAssetCanonicalStatus(a, timelockCanonicalization) ? `\n${reportAssetCanonicalStatus(a, timelockCanonicalization)}` : ""}
                </Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {/* Frontend assets */}
      {frontendAssets.length > 0 ? (
        <View style={{ marginBottom: 12 }}>
          <Text style={{ fontSize: 7, color: SUBTLE, letterSpacing: 1.2, fontFamily: "Helvetica-Bold", marginBottom: 6 }}>FRONTEND / INTERFACE</Text>
          <View style={{ borderWidth: 1, borderColor: BORDER, borderRadius: 3, overflow: "hidden" }}>
            {frontendAssets.map((a, i) => (
              <View key={a.id} style={{
                flexDirection: "row", paddingVertical: 6, paddingHorizontal: 10,
                borderBottomWidth: i < frontendAssets.length - 1 ? 1 : 0, borderBottomColor: BORDER,
              }}>
                <Text style={[S.tableCell, { width: 140, fontSize: 8.5 }]}>{a.name}</Text>
                {a.url ? <Text style={[S.tableCellMono, { flex: 1 }]}>{a.url}</Text> : null}
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {activeAssets.length === 0 ? (
        <Text style={{ fontSize: 9, color: SUBTLE, fontStyle: "italic" }}>No mapped public assets recorded.</Text>
      ) : null}

      <View style={S.divider} />

      {/* ── 03 Severity Methodology ───────────────────────────────── */}
      <View>
        <SectionHeading num={3} title="Observed Public Facts" />
        {observedPublicFacts.length > 0 ? (
          observedPublicFacts.map((fact, i) => (
            <Text key={i} style={[S.findingSubText, { marginLeft: 8, marginBottom: 4 }]}>- {fact}</Text>
          ))
        ) : (
          <Text style={S.findingSubText}>No public facts have been recorded for this report snapshot.</Text>
        )}
        <Text style={{ fontSize: 7, fontFamily: "Helvetica-Bold", color: MUTED, letterSpacing: 1.2, marginTop: 10, marginBottom: 6 }}>SEVERITY CONTEXT</Text>
        <Text style={S.body}>
          Severity in this report reflects potential impact to protocol continuity, fund safety, and operational authority, not confirmed exploitation. Findings represent authority surfaces requiring review; severity may be revised after further evidence is evaluated.
        </Text>

        {/* Severity table */}
        <View style={{ borderWidth: 1, borderColor: BORDER, borderRadius: 3, overflow: "hidden", marginBottom: 10 }}>
          <View style={{ flexDirection: "row", backgroundColor: `${PURPLE}18`, paddingVertical: 6, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: BORDER }}>
            <Text style={[S.tableHeaderCell, { width: 70 }]}>SEVERITY</Text>
            <Text style={[S.tableHeaderCell, { flex: 1 }]}>DESCRIPTION</Text>
          </View>
          {([
            { sev: "critical" as AdminFindingSeverity, desc: "Direct fund movement, settlement, or custody authority with no timelock or multisig protection. Immediate risk to assets or protocol operation." },
            { sev: "high" as AdminFindingSeverity, desc: "Significant authority surface - upgrade authority, oracle authority, or admin role concentration - where evidence is absent or incomplete." },
            { sev: "medium" as AdminFindingSeverity, desc: "Authority surface with limited or indirect fund impact, or where partial mitigations exist. Verification is recommended to confirm continuity posture." },
            { sev: "low" as AdminFindingSeverity, desc: "Informational or structural finding. Low direct risk but relevant to continuity planning, role documentation, and future audits." },
          ]).map(({ sev, desc }, i) => (
            <View key={sev} style={{
              flexDirection: "row", paddingVertical: 8, paddingHorizontal: 10,
              borderBottomWidth: i < 3 ? 1 : 0, borderBottomColor: BORDER,
              backgroundColor: i % 2 === 1 ? `${SURFACE}` : "transparent",
              alignItems: "flex-start",
            }}>
              <View style={{ width: 70 }}>
                <SevPill severity={sev} />
              </View>
              <Text style={[S.body, { flex: 1, marginBottom: 0, fontSize: 8.5, lineHeight: 1.55 }]}>{desc}</Text>
            </View>
          ))}
        </View>

        <View style={{ borderLeftWidth: 2, borderLeftColor: SUBTLE, backgroundColor: `${SUBTLE}08`, padding: "7 10", borderRadius: "0 3 3 0" }}>
          <Text style={{ fontSize: 8, color: SUBTLE, lineHeight: 1.55 }}>
            High-risk authority surfaces in this report represent unresolved authority paths, not confirmed vulnerabilities. Many findings reflect missing evidence rather than confirmed risk.
          </Text>
        </View>
      </View>

      <View style={S.divider} />

      {/* ── 04 Authority Risk Findings ───────────────────────────── */}
      <View break>
        <SectionHeading num={4} title="Authority Surface Findings" />

        {findingsBySev.length === 0 ? (
          <Text style={{ fontSize: 9, color: SUBTLE, fontStyle: "italic" }}>No analytical findings or supporting evidence receipts recorded.</Text>
        ) : (
          findingsBySev.map(({ sev, items }) => (
            <View key={sev}>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 7, marginTop: 6 }}>
                <View style={{ width: 3, height: 16, backgroundColor: SEV_COLOR[sev], borderRadius: 2, marginRight: 8 }} />
                <Text style={{ fontSize: 7, fontFamily: "Helvetica-Bold", color: SEV_COLOR[sev], letterSpacing: 1.3 }}>
                  {sev === "high"
                    ? `HIGH-RISK AUTHORITY SURFACES REQUIRING VERIFICATION (${items.length})`
                    : `${sev.toUpperCase()} (${items.length})`}
                </Text>
              </View>
              {items.map((f) => {
                const ev = evidenceRequired(f);
                const rem = remediation(f, Boolean(concentrationFinding));
                const assetAddr = (f.evidence as Record<string, unknown>)?.assetAddress as string | undefined;
                const adminAddr = (f.evidence as Record<string, unknown>)?.adminAddress as string | undefined;
                const role = (f.evidence as Record<string, unknown>)?.role as string | undefined;
                const evidenceSource = (f.evidence as Record<string, unknown>)?.evidenceSource as string | undefined;
                const confidence = (f.evidence as Record<string, unknown>)?.confidence as string | undefined;
                const ownerEvidenceConfidence = (f.evidence as Record<string, unknown>)?.ownerEvidenceConfidence as string | undefined;
                const ownerTypeLabel = (f.evidence as Record<string, unknown>)?.ownerTypeLabel as string | undefined;
                const ownerTypeDetectionMethod = (f.evidence as Record<string, unknown>)?.ownerTypeDetectionMethod as string | undefined;
                const ownerTypeEvidence = (f.evidence as Record<string, unknown>)?.ownerTypeEvidence as string | undefined;
                const ownerControlModelSummary = ((f.evidence as Record<string, unknown>)?.ownerControlModelSummary ?? (f.evidence as Record<string, unknown>)?.owner_control_model_summary) as string | undefined;
                const sourceVerification = sourceSummaryForFinding(f, assets, explorerEvidenceByAsset);
                const sourceStatusDistribution = (f.evidence as Record<string, unknown>)?.sourceStatusDistribution as Record<string, unknown> | undefined;
                const sourceVerificationSummary = ((f.evidence as Record<string, unknown>)?.sourceVerificationSummary ?? (f.evidence as Record<string, unknown>)?.source_verification_summary) as string | undefined;
                const sourceVerificationStatus = sourceVerification?.sourceVerificationStatus as string | undefined;
                const sourceExplorer = sourceVerification?.explorerName as string | undefined;
                const sourceAbiAvailable = sourceVerification?.abiAvailable as boolean | null | undefined;
                const sourceAvailable = sourceVerification?.sourceAvailable as boolean | null | undefined;
                const sourceAbiStatus = sourceVerification?.abiStatus as string | undefined;
                const sourceStatus = sourceVerification?.sourceStatus as string | undefined;
                const sourceProxyDetected = sourceVerification?.proxyDetected as boolean | null | undefined;
                const sourceImplementation = sourceVerification?.implementationAddress as string | undefined;
                const sourceNotes = sourceVerification?.verificationNotes;
                const sourceNoteLines = Array.isArray(sourceNotes)
                  ? sourceNotes
                    .filter((item): item is string => typeof item === "string" && item.length > 0)
                    .map((note) => sourceVerificationNote(sourceVerification, note))
                  : [];
                const boolLabel = (value: boolean | null | undefined) => value === true ? "Yes" : value === false ? "No" : "Unknown";
                const controlVerification = (f.evidence as Record<string, unknown>)?.controlVerification as string | undefined;
                const adminOwnerStatus = (f.evidence as Record<string, unknown>)?.adminOwnerStatus as string | undefined;
                const notes = (f.evidence as Record<string, unknown>)?.notes;
                const noteLines = Array.isArray(notes) ? notes.filter((item): item is string => typeof item === "string" && item.length > 0) : [];
                const isConcentration = f.findingType === "role_concentration";
                const groupedAssetCount = (f.evidence as Record<string, unknown>)?.assetCount as number | undefined;
                const groupedAssetNames = (f.evidence as Record<string, unknown>)?.resolvedAssets as string[] | undefined;
                const isGroupedOwner = f.findingType === "owner_detected" && !!groupedAssetCount && groupedAssetCount > 1;
                const affectedNames = [
                  ...evidenceAssetNames((f.evidence as Record<string, unknown>)?.assetsAffected),
                  ...evidenceAssetNames((f.evidence as Record<string, unknown>)?.controlledAssets),
                ].filter((name, index, all) => all.indexOf(name) === index);
                const adminDisplay = adminAddr ?? adminOwnerStatus
                  ?? (confidence === "evidence_required" ? "Evidence required"
                    : confidence === "unresolved" ? "Unresolved"
                    : confidence === "error" ? "Detection error"
                    : ((f.evidence as Record<string, unknown>)?.currentEvidenceStatus ? "Evidence required" : "Not detected"));
                const findingAsset = f.assetId ? assets.find((asset) => asset.id === f.assetId) : undefined;
                const findingTitle = reportAssetText(f.title, findingAsset, candidates);
                const findingSummary = reportAssetText(f.summary, findingAsset, candidates);

                return (
                  <View key={f.id} style={[S.findingBlock, {
                    borderLeftWidth: 3, borderLeftColor: SEV_COLOR[f.severity], borderRadius: "0 3 3 0",
                  }]} wrap={false}>
                    <View style={S.findingHeader}>
                      <SevPill severity={f.severity} />
                      <Pill label={FINDING_LABEL[f.findingType] ?? f.findingType} color={PURPLE_L} />
                      <Text style={S.findingTitle}>{findingTitle}</Text>
                    </View>
                    <Text style={S.findingSummary}>{findingSummary}</Text>
                    {f.findingType === "owner_detected" ? (
                      <Text style={[S.findingSubText, { marginBottom: 5, fontFamily: "Helvetica-Bold" }]}>
                        {concentrationFinding
                          ? "Supporting evidence for the shared-owner concentration analysis; retained as an evidence receipt, not a separate analytical risk."
                          : "Supporting evidence for the observed owner/admin model; retained as an evidence receipt, not a separate analytical risk."}
                      </Text>
                    ) : null}

                    {/* Evidence mini-table. HTML equivalent keeps "Contract address: {assetAddr ??" for non-concentration findings. */}
                    <View style={S.evidenceTable}>
                      <View style={{ backgroundColor: `${PURPLE}14`, paddingVertical: 4, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: BORDER }}>
                        <Text style={{ fontSize: 6.5, fontFamily: "Helvetica-Bold", color: MUTED, letterSpacing: 1 }}>CURRENT EVIDENCE STATUS</Text>
                      </View>
                      <View style={{ paddingHorizontal: 0 }}>
                        <View style={S.evidenceRow}>
                          <Text style={S.evidenceLabel}>Evidence Source</Text>
                          <Text style={S.evidenceValue}>{evidenceSource ?? "Submitted project metadata + scanner analysis"}</Text>
                        </View>
                        {isConcentration ? (
                          <>
                            <View style={S.evidenceRow}>
                              <Text style={S.evidenceLabel}>Assets affected</Text>
                              <Text style={S.evidenceValue}>{affectedNames.join(", ") || "—"}</Text>
                            </View>
                            <View style={S.evidenceRow}>
                              <Text style={S.evidenceLabel}>Shared Owner</Text>
                              <Text style={S.evidenceValue}>{adminAddr ?? "Not provided"}</Text>
                            </View>
                            {ownerTypeLabel ? (
                              <View style={S.evidenceRow}>
                                <Text style={S.evidenceLabel}>Owner Type</Text>
                                <Text style={S.evidenceValue}>{ownerTypeLabel}</Text>
                              </View>
                            ) : null}
                            {ownerTypeDetectionMethod ? (
                              <View style={S.evidenceRow}>
                                <Text style={S.evidenceLabel}>Owner Type Method</Text>
                                <Text style={S.evidenceValue}>{ownerTypeDetectionMethod}</Text>
                              </View>
                            ) : null}
                            {ownerTypeEvidence ? (
                              <View style={S.evidenceRow}>
                                <Text style={S.evidenceLabel}>Owner Type Evidence</Text>
                                <Text style={S.evidenceValue}>{ownerTypeEvidence}</Text>
                              </View>
                            ) : null}
                            {ownerControlModelSummary ? (
                              <View style={S.evidenceRow}>
                                <Text style={S.evidenceLabel}>Owner Authority Model</Text>
                                <Text style={S.evidenceValue}>{ownerControlModelSummary}</Text>
                              </View>
                            ) : null}
                            {ownerEvidenceConfidence ? (
                              <View style={S.evidenceRow}>
                                <Text style={S.evidenceLabel}>Owner Evidence Confidence</Text>
                                <Text style={S.evidenceValue}>{ownerEvidenceConfidence}</Text>
                              </View>
                            ) : null}
                            {controlVerification ? (
                              <View style={[S.evidenceRow, { borderBottomWidth: 0 }]}>
                                <Text style={S.evidenceLabel}>Evidence State</Text>
                                <Text style={S.evidenceValue}>{controlVerification}</Text>
                              </View>
                            ) : null}
                          </>
                        ) : (
                          <>
                            {isGroupedOwner ? (
                              <>
                                <View style={S.evidenceRow}>
                                  <Text style={S.evidenceLabel}>Assets Resolved</Text>
                                  <Text style={S.evidenceValue}>{groupedAssetCount}</Text>
                                </View>
                                <View style={S.evidenceRow}>
                                  <Text style={S.evidenceLabel}>Mapped Contracts</Text>
                                  <Text style={S.evidenceValue}>{(groupedAssetNames ?? []).join(", ") || "—"}</Text>
                                </View>
                              </>
                            ) : (
                              <View style={S.evidenceRow}>
                                <Text style={S.evidenceLabel}>Representative Contract</Text>
                                <Text style={[S.evidenceValue, { fontFamily: "Courier", fontSize: 7 }]}>{assetAddr ?? "Not provided"}</Text>
                              </View>
                            )}
                            <View style={[S.evidenceRow, { borderBottomWidth: role || noteLines.length > 0 ? 1 : 0 }]}>
                              <Text style={S.evidenceLabel}>Admin / Owner</Text>
                              <Text style={S.evidenceValue}>{adminDisplay}</Text>
                            </View>
                            {ownerTypeLabel ? (
                              <View style={S.evidenceRow}>
                                <Text style={S.evidenceLabel}>Owner Type</Text>
                                <Text style={S.evidenceValue}>{ownerTypeLabel}</Text>
                              </View>
                            ) : null}
                            {ownerTypeDetectionMethod ? (
                              <View style={S.evidenceRow}>
                                <Text style={S.evidenceLabel}>Owner Type Method</Text>
                                <Text style={S.evidenceValue}>{ownerTypeDetectionMethod}</Text>
                              </View>
                            ) : null}
                            {ownerTypeEvidence ? (
                              <View style={S.evidenceRow}>
                                <Text style={S.evidenceLabel}>Owner Type Evidence</Text>
                                <Text style={S.evidenceValue}>{ownerTypeEvidence}</Text>
                              </View>
                            ) : null}
                            {ownerControlModelSummary ? (
                              <View style={S.evidenceRow}>
                                <Text style={S.evidenceLabel}>Owner Authority Model</Text>
                                <Text style={S.evidenceValue}>{ownerControlModelSummary}</Text>
                              </View>
                            ) : null}
                            {role ? (
                              <View style={[S.evidenceRow, { borderBottomWidth: noteLines.length > 0 ? 1 : 0 }]}>
                                <Text style={S.evidenceLabel}>Role</Text>
                                <Text style={S.evidenceValue}>{role}</Text>
                              </View>
                            ) : null}
                          </>
                        )}
                        {noteLines.map((note, i) => (
                          <View key={`note-${i}`} style={[S.evidenceRow, { borderBottomWidth: i < noteLines.length - 1 ? 1 : 0 }]}>
                            <Text style={S.evidenceLabel}>Note</Text>
                            <Text style={S.evidenceValue}>{note}</Text>
                          </View>
                        ))}
                        {sourceVerificationStatus ? (
                          <View style={S.evidenceRow}>
                            <Text style={S.evidenceLabel}>Source Verification</Text>
                            <Text style={S.evidenceValue}>{sourceVerificationStatus}</Text>
                          </View>
                        ) : null}
                        {sourceExplorer ? (
                          <View style={S.evidenceRow}>
                            <Text style={S.evidenceLabel}>Explorer</Text>
                            <Text style={S.evidenceValue}>{sourceExplorer}</Text>
                          </View>
                        ) : null}
                        {sourceVerification ? (
                          <>
                            <View style={S.evidenceRow}>
                              <Text style={S.evidenceLabel}>ABI Status</Text>
                              <Text style={S.evidenceValue}>{sourceAbiStatus ?? boolLabel(sourceAbiAvailable)}</Text>
                            </View>
                            <View style={S.evidenceRow}>
                              <Text style={S.evidenceLabel}>Source Status</Text>
                              <Text style={S.evidenceValue}>{sourceStatus ?? boolLabel(sourceAvailable)}</Text>
                            </View>
                            <View style={S.evidenceRow}>
                              <Text style={S.evidenceLabel}>Proxy Detected</Text>
                              <Text style={S.evidenceValue}>{boolLabel(sourceProxyDetected)}</Text>
                            </View>
                          </>
                        ) : null}
                        {sourceImplementation ? (
                          <View style={S.evidenceRow}>
                            <Text style={S.evidenceLabel}>Implementation</Text>
                            <Text style={S.evidenceValue}>{sourceImplementation}</Text>
                          </View>
                        ) : null}
                        {sourceVerificationSummary ? (
                          <View style={S.evidenceRow}>
                            <Text style={S.evidenceLabel}>Source Verification Summary</Text>
                            <Text style={S.evidenceValue}>{sourceVerificationSummary}</Text>
                          </View>
                        ) : null}
                        {sourceStatusDistribution ? (
                          <View style={S.evidenceRow}>
                            <Text style={S.evidenceLabel}>Source Status Distribution</Text>
                            <Text style={S.evidenceValue}>{sourceStatusDistributionLabel(sourceStatusDistribution)}</Text>
                          </View>
                        ) : null}
                        {sourceNoteLines.slice(0, 2).map((note, i) => (
                          <View key={`source-note-${i}`} style={S.evidenceRow}>
                            <Text style={S.evidenceLabel}>Verification Notes</Text>
                            <Text style={S.evidenceValue}>{note}</Text>
                          </View>
                        ))}
                      </View>
                    </View>

                    {ev.length > 0 ? (
                      <View style={{ marginTop: 7 }}>
                        <Text style={S.findingSubLabel}>EVIDENCE REQUIRED</Text>
                        {ev.map((item, i) => (
                          <Text key={i} style={[S.findingSubText, { marginLeft: 8 }]}>· {item}</Text>
                        ))}
                      </View>
                    ) : null}
                    {rem ? (
                      <View style={{ marginTop: 6 }}>
                        <Text style={S.findingSubLabel}>RECOMMENDED REMEDIATION</Text>
                        <Text style={S.findingSubText}>{rem}</Text>
                      </View>
                    ) : null}
                    {!ev.length && !rem && f.recommendedActions.slice(0, 2).map((a, i) => (
                      <Text key={i} style={[S.findingSubText, { marginLeft: 8, marginTop: i === 0 ? 4 : 0 }]}>· {a}</Text>
                    ))}
                  </View>
                );
              })}
            </View>
          ))
        )}
      </View>

      <View style={S.divider} />

      {/* ── 05 What This Means ──────────────────────────────────── */}
      <View>
        <SectionHeading num={5} title="Protocol-Specific Interpretation" />
        {protocolInterpretation.length > 0 ? (
          protocolInterpretation.map((item, i) => (
            <Text key={i} style={[S.findingSubText, { marginLeft: 8, marginBottom: 4 }]}>- {item}</Text>
          ))
        ) : (
          <Text style={S.body}>{continuityRiskNarrative}</Text>
        )}
        <Text style={[S.findingSubText, { marginTop: 8 }]}>
          Capability observations and graph relationships are scoped evidence inputs. They do not establish operating policy.
        </Text>
        {detectorEvidence.length > 0 ? (
          <View style={{ marginTop: 12 }}>
            <Text style={{ fontSize: 7, fontFamily: "Helvetica-Bold", color: MUTED, letterSpacing: 1.2, marginBottom: 6 }}>DETECTOR EVIDENCE REGISTER</Text>
            {detectorEvidence.slice(0, 12).map((item, i) => (
              <View key={i} style={{ borderWidth: 1, borderColor: BORDER, borderRadius: 3, padding: "7 9", marginBottom: 5 }} wrap={false}>
                <View style={{ flexDirection: "row", marginBottom: 4 }}>
                  <Text style={{ flex: 1, fontSize: 8.5, fontFamily: "Helvetica-Bold", color: TEXT }}>{item.detector} / {item.assetName}</Text>
                  <SmallEvidenceBadge label={item.observationStatus} />
                </View>
                <Text style={S.findingSubText}>Evidence source: {item.evidenceSource}; method: {item.method}; confidence: {item.confidenceLabel}.</Text>
                {detectorObservedSummary(item.detector, item.observedValues) ? (
                  <Text style={S.findingSubText}>Observed: {detectorObservedSummary(item.detector, item.observedValues)}</Text>
                ) : null}
                {item.detector === "Etherscan V2 ABI / Source" ? (
                  <Text style={S.findingSubText}>ABI: {item.abiStatus ?? "unavailable"}; source: {item.sourceStatus ?? "unavailable"}{item.contractName ? `; contract: ${item.contractName}` : ""}.</Text>
                ) : null}
                <Text style={S.findingSubText}>Evidence Required: {compactList(item.evidenceRequired, "Supporting operating evidence.")}</Text>
                <Text style={[S.findingSubText, { marginTop: 3 }]}>{item.nonClaim}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </View>

      <View style={S.divider} />

      {/* ── 06 Relevant Threat Families ─────────────────────────── */}
      <View>
        <SectionHeading num={6} title="Unresolved Assumptions" />
        {unresolvedAssumptions.map((item, i) => (
          <Text key={`assumption-${i}`} style={[S.findingSubText, { marginLeft: 8, marginBottom: 4 }]}>- {item}</Text>
        ))}
        <Text style={{ fontSize: 7, fontFamily: "Helvetica-Bold", color: MUTED, letterSpacing: 1.2, marginTop: 10, marginBottom: 6 }}>AUTHORITY REVIEW BASIS</Text>
        {topEvidenceGates.length === 0 ? (
          <Text style={{ fontSize: 9, color: SUBTLE, fontStyle: "italic" }}>No customer-facing evidence gates are available yet. Run the Admin Surface Scan or submit review evidence.</Text>
        ) : (
          topEvidenceGates.slice(0, 6).map((gate, i) => (
            <View key={i} style={{ padding: "8 10", borderWidth: 1, borderColor: BORDER, borderRadius: 3, marginBottom: 7 }} wrap={false}>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 5 }}>
                <Text style={{ flex: 1, fontSize: 9.5, fontFamily: "Helvetica-Bold", color: TEXT }}>{normalizeCustomerOwnerCopy(gate.title)}</Text>
                <SmallEvidenceBadge label={gate.priorityLabel} />
              </View>
              <Text style={S.findingSubText}>{gate.whyItMatters}</Text>
              <Text style={[S.findingSubText, { marginTop: 4 }]}>
                <Text style={{ fontFamily: "Helvetica-Bold", color: MUTED }}>Evidence basis: </Text>
                {gate.evidenceBasis ?? "Supporting evidence is required to complete this review gate."}
              </Text>
              <View style={{ flexDirection: "row", gap: 8, marginTop: 5 }}>
                <Text style={[S.findingSubText, { flex: 1 }]}>Assets: {compactList(gate.relatedAssets)}</Text>
                <SmallEvidenceBadge label={gate.evidenceState} />
              </View>
            </View>
          ))
        )}
      </View>

      <View style={S.divider} />

      <View>
        <SectionHeading num={7} title="Priority Review Path" />
        <Text style={S.body}>This sequence identifies evidence collection and pointer reconciliation work required to close unresolved assumptions.</Text>
      </View>

      <View style={S.divider} />

      <View>
        <SectionHeading num={8} title="Evidence Requested" />
        {evidenceRequestedGroups.length === 0 ? (
          <Text style={{ fontSize: 9, color: SUBTLE, fontStyle: "italic" }}>No customer-facing evidence request checklist is available yet.</Text>
        ) : (
          evidenceRequestedGroups.map((group, i) => (
            <View key={i} style={{ marginBottom: 9 }} wrap={false}>
              <Text style={{ fontSize: 8, fontFamily: "Helvetica-Bold", color: GOLD, letterSpacing: 1, marginBottom: 4 }}>{group.category?.toUpperCase()}</Text>
              {(group.requests ?? []).map((request, j) => (
                <Text key={j} style={[S.findingSubText, { marginLeft: 8 }]}>- {request}</Text>
              ))}
            </View>
          ))
        )}
        <View style={{ marginTop: 8, padding: "10 12", borderLeftWidth: 3, borderLeftColor: GOLD, backgroundColor: `${GOLD}0A`, borderRadius: "0 3 3 0" }} wrap={false}>
          <Text style={{ fontSize: 8, fontFamily: "Helvetica-Bold", color: GOLD, letterSpacing: 1, marginBottom: 5 }}>Review Closure Path</Text>
          <Text style={S.findingSubText}>
            Step 1 - {mappedSourceAvailable && candidates.length > 0
              ? review.candidateScopeState === "candidates_imported_scan_complete"
                ? "Provide operating evidence for mapped and imported candidate assets."
                : "Confirm source/ABI coverage for imported candidate assets after approval."
              : "Submit source/ABI or verify contracts on a supported explorer."}
          </Text>
          <Text style={S.findingSubText}>Step 2 - Provide owner/signer custody and emergency replacement evidence.</Text>
          <Text style={S.findingSubText}>Step 3 - Provide treasury, oracle, role, emergency, and governance policies.</Text>
          <Text style={S.findingSubText}>Step 4 - SCE reviews submitted evidence against mapped authority paths.</Text>
          <Text style={S.findingSubText}>Step 5 - SCE re-runs supported public checks and updates unresolved assumptions.</Text>
          <Text style={[S.findingSubText, { marginTop: 5, color: MUTED, fontFamily: "Helvetica-Bold" }]}>
            Submitted evidence is reviewed against mapped authority paths and current project metadata before assumptions are updated.
          </Text>
        </View>
      </View>

      <View style={S.divider} />

      <View>
        <SectionHeading num={11} title="Known Limitations / Follow-up Scope" />
        {followUpScope.length > 0 ? followUpScope.map((item, i) => (
          <Text key={i} style={[S.findingSubText, { marginLeft: 8, marginBottom: 4 }]}>- {item}</Text>
        )) : (
          <Text style={S.findingSubText}>No additional follow-up scope has been recorded.</Text>
        )}
      </View>

      <View style={S.divider} />

      <View>
        <SectionHeading num={9} title="Source / ABI Verification Status" />
        <Text style={S.body}>
          {sourceAbiLimitationNote ?? "No source/ABI lookup status is recorded for this report snapshot."}
        </Text>
      </View>

      <View style={S.divider} />

      <View break>
        <SectionHeading num={10} title="Relevant Threat Families" />
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
                <View style={{ backgroundColor: `${PURPLE}20`, borderRadius: 2, paddingHorizontal: 6, paddingVertical: 2 }}>
                  <Text style={S.threatScore}>RELEVANCE {tf.relevanceScore}</Text>
                </View>
              </View>
              {tf.whyItMatters ? <Text style={S.threatWhy}>{tf.whyItMatters}</Text> : null}
              <View style={S.threatStats}>
                {tf.globalCaseCount === 0 ? (
                  <Text style={S.threatStat}>Case-library coverage: <Text style={{ color: SUBTLE, fontFamily: "Helvetica-Bold" }}>Pending</Text></Text>
                ) : (
                  <>
                    <Text style={S.threatStat}>Case count: <Text style={{ color: TEXT, fontFamily: "Helvetica-Bold" }}>{tf.globalCaseCount}</Text></Text>
                    <Text style={S.threatStat}>Critical count: <Text style={{ color: tf.criticalCount > 0 ? RED : TEXT, fontFamily: "Helvetica-Bold" }}>{tf.criticalCount}</Text></Text>
                  </>
                )}
              </View>
              {tf.globalCaseCount === 0 ? (
                <Text style={[S.findingSubText, { marginBottom: 4, fontStyle: "italic" }]}>
                  Case-library coverage pending — relevance is based on project authority surface match, not global case count.
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

      {/* ── 07 Recommended Controls ─────────────────────────────── */}
      <View break>
        <SectionHeading num={12} title="Evidence Status" />
        <Text style={S.body}>{controlsPreface}</Text>

        {true ? (
          <StatGrid stats={[
            { label: "Public Facts Observed", value: evidenceStatus.publicFactsObserved ?? observedPublicFacts.length },
            { label: "Open Authority Findings", value: evidenceStatus.openAuthorityFindings ?? openFindings.length },
            { label: "Supporting Evidence Receipts", value: evidenceStatus.supportingEvidenceReceipts ?? supportingEvidenceReceipts.length },
            { label: "Unresolved Assumptions", value: evidenceStatus.unresolvedAssumptions ?? unresolvedAssumptions.length, color: GOLD },
            { label: "Follow-up Scope Items", value: evidenceStatus.followUpScopeItems ?? followUpScope.length },
            { label: "Evidence Requests", value: evidenceStatus.clientOperatorEvidenceRequests ?? 0, color: GOLD },
          ]} />
        ) : (
          controlGroups.map((group) => (
            <View key={group.key}>
              {/* Group header */}
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6, marginTop: 10 }}>
                <View style={{ width: 3, height: 14, backgroundColor: GOLD, borderRadius: 2, marginRight: 8 }} />
                <Text style={{ fontSize: 7.5, fontFamily: "Helvetica-Bold", color: GOLD, letterSpacing: 1.2 }}>
                  {group.label.toUpperCase()}
                </Text>
              </View>

              {/* Controls table for this group */}
              <View style={{ borderWidth: 1, borderColor: BORDER, borderRadius: 3, overflow: "hidden", marginBottom: 10 }}>
                <View style={{ flexDirection: "row", backgroundColor: `${PURPLE}18`, paddingVertical: 6, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: BORDER }}>
                  <Text style={[S.tableHeaderCell, { width: 80 }]}>STATUS</Text>
                  <Text style={[S.tableHeaderCell, { flex: 1 }]}>EVIDENCE CHECK</Text>
                </View>
                {(["missing", "planned", "implemented", "verified", "not_applicable"] as ProjectControlStatus[])
                  .flatMap((st) => group.items.filter((c) => c.status === st))
                  .map((c, i, arr) => {
                    const displayTitle = resolveControlTitle(c, assets, findings, titleCounts, candidates);
                    const vDate = c.verifiedAt
                      ? new Date(c.verifiedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                      : null;
                    return (
                      <View key={c.id} style={{
                        flexDirection: "row",
                        paddingVertical: 8, paddingHorizontal: 10,
                        borderBottomWidth: i < arr.length - 1 ? 1 : 0,
                        borderBottomColor: BORDER,
                        backgroundColor: i % 2 === 1 ? `${SURFACE}` : "transparent",
                        alignItems: "flex-start",
                      }} wrap={false}>
                        <View style={{ width: 80 }}>
                          <View style={{ backgroundColor: `${CTRL_COLOR[c.status]}18`, borderWidth: 1, borderColor: `${CTRL_COLOR[c.status]}44`, borderRadius: 2, paddingHorizontal: 5, paddingVertical: 2 }}>
                            <Text style={{ fontSize: 6, fontFamily: "Helvetica-Bold", color: CTRL_COLOR[c.status], letterSpacing: 0.8 }}>{CTRL_LABEL[c.status]}</Text>
                          </View>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 9, fontFamily: "Helvetica-Bold", color: TEXT, marginBottom: 2 }}>{displayTitle}</Text>
                          <Text style={{ fontSize: 8, color: MUTED, lineHeight: 1.5 }}>{c.description}</Text>
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
                      </View>
                    );
                  })}
              </View>
            </View>
          ))
        )}
        {Array.from(new Set(candidateControlChecks.map((check) => check.group ?? "Candidate Expansion Scope Items"))).map((group) => (
          <View key={group}>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6, marginTop: 10 }}>
              <View style={{ width: 3, height: 14, backgroundColor: GOLD, borderRadius: 2, marginRight: 8 }} />
              <Text style={{ fontSize: 7.5, fontFamily: "Helvetica-Bold", color: GOLD, letterSpacing: 1.2 }}>{group.toUpperCase()}</Text>
            </View>
            {candidateControlChecks.filter((check) => (check.group ?? "Candidate Expansion Scope Items") === group).map((check, i) => (
              <View key={`${group}-${i}`} style={{ flexDirection: "row", paddingVertical: 7, paddingHorizontal: 10, borderWidth: 1, borderColor: BORDER, marginBottom: 3 }} wrap={false}>
                <Text style={{ width: 92, fontSize: 7, fontFamily: "Helvetica-Bold", color: GOLD }}>{check.status ?? "Pending Policy Evidence"}</Text>
                <Text style={{ flex: 1, fontSize: 8.5, color: TEXT }}>{check.title}</Text>
              </View>
            ))}
          </View>
        ))}
      </View>

      <View style={S.divider} />

      {/* ── 09 Next Actions ─────────────────────────────────────── */}
      <SectionHeading num={13} title="Next Actions" />

      {nextActions.map((action, i) => (
        <View key={i} style={S.actionItem} wrap={false}>
          <View style={S.actionNum}>
            <Text style={S.actionNumText}>{i + 1}</Text>
          </View>
          <Text style={S.actionText}>{action}</Text>
        </View>
      ))}

      {/* Footer disclaimer */}
      <View style={{ marginTop: 32, paddingTop: 14, borderTopWidth: 1, borderTopColor: BORDER }}>
        <View style={{ flexDirection: "row", marginBottom: 8 }}>
          <View style={{ width: 2, height: 14, backgroundColor: PURPLE, borderRadius: 1, marginRight: 8, marginTop: 1 }} />
          <Text style={{ fontSize: 7, fontFamily: "Helvetica-Bold", color: `${GOLD}BB`, letterSpacing: 1.2 }}>
            CONFIDENTIAL — SAGITTA CONTINUITY ENGINE (SCE)
          </Text>
        </View>
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
