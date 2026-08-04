"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { fetchDefenseReview, runDefenseReviewScan, updateDefenseReview } from "@/lib/defense-review/service";
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
  AbiRelationshipExtractionSummary,
  BlastRadiusEvidenceReceipt,
  BlastRadiusNarrativeSummary,
  CapabilityControlMapping,
  CapabilityControlSummary,
  CapabilityEvidenceReceipt,
  CapabilityExtractionMeta,
  CapabilityNarrativeSummary,
  CapabilityObservation,
  CapabilityPriorityItem,
  CapabilityPrioritySummary,
  CapabilitySummary,
  ContractGraphNode,
  ContractGraphSummary,
  DefenseReview,
  DefenseReviewStatus,
  RunScanResponse,
  SourceVerificationHealthSummary,
} from "@/lib/defense-review/types";
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
  protocol_adapter_limitation: "Protocol Adapter Limitation",
  owner_detected: "Supporting Owner Evidence Receipt",
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
  missing: "Pending",
  planned: "Pending",
  implemented: "Review",
  verified: "Verified",
  not_applicable: "N/A",
};

const CONTROL_STATUS_COLOR: Record<ProjectControlStatus, string> = {
  missing: GOLD,
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

function findingCategory(finding: AdminSurfaceFinding): string {
  if (finding.findingType === "owner_detected") return "supporting_evidence_receipt";
  return finding.category ?? "analytical_finding";
}

function _reportRemediation(finding: AdminSurfaceFinding, hasSharedOwnerFinding = false): string {
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

// ─── Asset-specific control title helper ─────────────────────────────────────
function normalizeCustomerOwnerCopy(value?: string | null): string {
  return (value ?? "")
    .replace(/\beoa owner\b/g, "EOA owner")
    .replace(/\bsame eoa owner address\b/g, "same EOA owner address");
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

function resolveControlTitle(
  control: ProjectControl,
  assets: ProjectAsset[],
  findings: AdminSurfaceFinding[],
  titleCounts: Map<string, number>,
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

function assetTypeLabel(assetType: string): string {
  if (assetType === "treasury") return "Treasury";
  if (assetType === "oracle") return "Oracle";
  if (assetType === "contract" || assetType === "proxy") return "Contract";
  return assetType.charAt(0).toUpperCase() + assetType.slice(1);
}

function shortMappedAddress(address?: string | null): string {
  if (!address) return "Not provided";
  return address.length > 13 ? `${address.slice(0, 6)}...${address.slice(-4)}` : address;
}

function mappedOwnerDisplay(
  asset: ProjectAsset,
  resolvedOwnerFindings: AdminSurfaceFinding[],
  unresolvedOwnerFindings: AdminSurfaceFinding[],
): string {
  const resolved = resolvedOwnerFindings.find((finding) => {
    if (finding.assetId === asset.id) return true;
    const ids = finding.evidence?.resolvedAssetIds as string[] | undefined;
    const names = finding.evidence?.resolvedAssets as string[] | undefined;
    return (ids && ids.includes(asset.id)) || (names && names.includes(asset.name)) || false;
  });
  const owner = resolved?.evidence?.adminAddress;
  if (typeof owner === "string" && owner.length > 0) {
    return `Owner: ${shortMappedAddress(owner)}\nVia: Ownable.owner()`;
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
    resolvedCount: number;
    unresolvedCount: number;
    totalAssets: number;
    resolvedAssetNames: string[];
    unresolvedAssetNames: string[];
    sharedOwnerAddr: string | undefined;
    sharedOwnerAssetCount: number;
    sharedOwnerType?: string;
    sharedOwnerTypeMethod?: string;
    sharedOwnerTypeEvidence?: string;
  },
): string {
  const { resolvedCount, unresolvedCount, totalAssets, resolvedAssetNames, unresolvedAssetNames, sharedOwnerAddr, sharedOwnerAssetCount } = opts;

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
    copy += ` ${unresolvedList} did not resolve through standard interfaces and require${unresolvedCount === 1 ? "s" : ""} source/ABI review or submitted authority evidence.`;
  }
  copy += ` ${ownerTypeReviewGateCopy({ ownerType: opts.sharedOwnerType, ownerTypeMethod: opts.sharedOwnerTypeMethod, ownerTypeEvidence: opts.sharedOwnerTypeEvidence })}`;
  return copy;
}

function buildNextActions(
  findings: AdminSurfaceFinding[],
  controls: ProjectControl[],
  opts?: { sharedOwnerAddr?: string; unresolvedAssetNames?: string[]; sharedOwnerType?: string; projectName?: string; scanInconclusive?: boolean; candidateCount?: number; candidateScopeState?: string; mappedSourceAvailable?: boolean },
): string[] {
  const actions: string[] = [];
  const missing = controls.filter((c) => c.status === "missing");
  const unverified = controls.filter(
    (c) => c.status !== "verified" && c.status !== "not_applicable",
  );
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
  const affectedRoles = knownRoles.filter((r) =>
    findings.some((f) => f.findingType.startsWith(r) || f.findingType.includes(r)),
  );
  const roleList = affectedRoles.join(", ");

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
  if (opts?.projectName?.toLowerCase().includes("aave")) {
    actions.push("Expand the project map from PoolAddressesProvider to include Pool, PoolConfigurator, ACLManager, oracle, collector/treasury, and proxy implementation authority where discoverable.");
  } else if (roleList) {
    actions.push(`Verify authority paths for mapped roles: ${roleList}.`);
  } else {
    actions.push("Verify authority paths for the mapped contract and any connected protocol contracts discovered from source/ABI.");
  }
  actions.push(
    "Document role separation and emergency procedures for each authority surface.",
  );

  if (missing.length > 0) {
    actions.push(
      `Attach or link policy evidence for ${missing.length} pending review item${missing.length > 1 ? "s" : ""}.`,
    );
  } else if (unverified.length > 0) {
    actions.push(
      `Attach or link policy evidence for ${unverified.length} outstanding review item${unverified.length > 1 ? "s" : ""}.`,
    );
  } else {
    actions.push(
      "Attach or link policy evidence for any outstanding review items.",
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
    `Generate updated report with revised evidence status. Current reviewed item count: ${verified.length} of ${controls.length}.`,
  );

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
  const [intelScanResponse, setIntelScanResponse] = useState<RunScanResponse | null>(null);
  const [intelScanRunning, setIntelScanRunning] = useState(false);
  const [intelScanError, setIntelScanError] = useState("");

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
      const res = await fetch(`/api/defense-review/${review.id}/pdf`);
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

  async function handleRefreshIntelligence() {
    if (!review) return;
    setIntelScanRunning(true);
    setIntelScanError("");
    try {
      const resp = await runDefenseReviewScan(review.id);
      setIntelScanResponse(resp);
      setReview(resp.review);
    } catch (err) {
      setIntelScanError(err instanceof Error ? err.message : "Scan failed.");
    } finally {
      setIntelScanRunning(false);
    }
  }

  // ── Derived ────────────────────────────────────────────────────────────────
  const openItems = findings.filter((f) => f.status === "open");
  const openFindings = openItems.filter((f) => findingCategory(f) === "analytical_finding");
  const supportingEvidenceReceipts = openItems.filter((f) => findingCategory(f) === "supporting_evidence_receipt");
  const criticalCount = openFindings.filter((f) => f.severity === "critical").length;
  const highCount = openFindings.filter((f) => f.severity === "high").length;
  const verifiedControls = controls.filter((c) => c.status === "verified");
  const controlCoverage =
    controls.length > 0 ? Math.round((verifiedControls.length / controls.length) * 100) : 0;
  const isEvidenceComplete = verifiedControls.length > 0 && controls.length > 0 && controlCoverage === 100;
  const authorityRoles = new Set(["treasury", "vault", "escrow", "reserve", "oracle"]);
  // Resolved: owner_detected findings with verified confidence (on-chain owner observed)
  const resolvedOwnerFindings = openItems.filter(
    (f) => f.findingType === "owner_detected" && (f.evidence?.confidence as string | undefined) === "verified"
  );
  // Unresolved: unknown_admin root authority findings for authority-role assets
  const unresolvedOwnerFindings = openFindings.filter((f) => {
    const role = f.evidence?.role;
    return f.findingType === "unknown_admin" && typeof role === "string" && authorityRoles.has(role);
  });
  const authorityRootFindings = [...resolvedOwnerFindings, ...unresolvedOwnerFindings];
  const authorityPathsResolved = resolvedOwnerFindings.reduce((sum, f) => {
    const cnt = f.evidence?.assetCount as number | undefined;
    return sum + (cnt && cnt > 1 ? cnt : 1);
  }, 0);
  const authorityPathsAwaiting = unresolvedOwnerFindings.length;
  const authorityAssetsTotal = authorityPathsResolved + authorityPathsAwaiting;

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
  const sharedOwnerType = concentrationFinding?.evidence?.ownerType as string | undefined;
  const sharedOwnerTypeMethod = concentrationFinding?.evidence?.ownerTypeDetectionMethod as string | undefined;
  const sharedOwnerTypeEvidence = concentrationFinding?.evidence?.ownerTypeEvidence as string | undefined;
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
        ? `${highCount} high-risk authority surface${highCount > 1 ? "s" : ""} require${highCount === 1 ? "s" : ""} verification.`
        : openFindings.length > 0
          ? `${openFindings.length} open authority-surface finding${openFindings.length !== 1 ? "s" : ""} require${openFindings.length === 1 ? "s" : ""} verification.`
        : review?.candidateScopeState === "candidates_imported_scan_complete"
          ? `${review.scannedAssetCount ?? review.assetsCount} mapped assets scanned; imported candidates pending evidence review.`
        : supportingEvidenceReceipts.length > 0 && (review?.customerDiscoveredCandidateAssets?.length ?? 0) > 0
          ? `${supportingEvidenceReceipts.length} evidence receipt${supportingEvidenceReceipts.length !== 1 ? "s" : ""}; ${review?.customerDiscoveredCandidateAssets?.length ?? 0} candidate asset${(review?.customerDiscoveredCandidateAssets?.length ?? 0) !== 1 ? "s" : ""} discovered, awaiting scope approval.`
          : supportingEvidenceReceipts.length > 0
            ? `${supportingEvidenceReceipts.length} supporting evidence receipt${supportingEvidenceReceipts.length !== 1 ? "s" : ""} recorded. Review in progress.`
          : "No open analytical findings recorded. Review in progress.";
  const resolvedAssetNames = resolvedOwnerFindings.flatMap((f) => {
    const multi = f.evidence?.resolvedAssets as string[] | undefined;
    if (multi && multi.length > 1) return multi;
    const a = assets.find((asset) => asset.id === f.assetId);
    return [a?.name ?? "Unknown"];
  });
  const unresolvedAssetNames = unresolvedOwnerFindings.map((f) => {
    const a = assets.find((asset) => asset.id === f.assetId);
    return a?.name ?? "Unknown";
  });

  const detectorExecutionIncomplete = [
    "inconclusive_transport_failure",
    "detector_execution_inconclusive",
    "rpc_configured_preflight_failed",
  ].includes(review?.rpcStatus ?? "");
  const authorityResolvedDisplay = detectorExecutionIncomplete
    ? "Inconclusive"
    : authorityAssetsTotal > 0 ? `${authorityPathsResolved} / ${authorityAssetsTotal}` : "Not assessed";
  const ownerEvidenceDisplay = detectorExecutionIncomplete
    ? "Inconclusive"
    : authorityAssetsTotal > 0 ? `${authorityPathsResolved} / ${authorityAssetsTotal}` : "Not assessed";
  const awaitingEvidenceDisplay = detectorExecutionIncomplete
    ? "Pending scan rerun"
    : authorityAssetsTotal > 0 ? `${authorityPathsAwaiting} / ${authorityAssetsTotal}` : "Not assessed";
  const candidates = review?.customerDiscoveredCandidateAssets ?? [];
  const mappedSourceAvailable = review?.sourceVerificationStatus === "available";
  const fallbackNextActions = buildNextActions(openFindings, controls, {
    sharedOwnerAddr, unresolvedAssetNames, sharedOwnerType, projectName: review?.projectName,
    scanInconclusive: detectorExecutionIncomplete,
    candidateCount: candidates.length,
    candidateScopeState: review?.candidateScopeState,
    mappedSourceAvailable,
  });
  const nextActions = review ? reportNextActions(review, fallbackNextActions) : fallbackNextActions;
  const continuityRiskNarrative = normalizeCustomerOwnerCopy(review?.customerContinuityRiskNarrative) || (review ? whatThisMeansCopy(review, {
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
  }) : "");
  const authoritySurfaceRows = review?.customerAuthoritySurfaceFindings ?? [];
  const observedPublicFacts = review?.customerObservedPublicFacts ?? [];
  const protocolInterpretation = review?.customerProtocolSpecificInterpretation ?? [];
  const unresolvedAssumptions = review?.customerUnresolvedAssumptions ?? [];
  const followUpScope = review?.customerFollowUpScope ?? [];
  const evidenceStatus = review?.customerEvidenceStatus ?? {};
  const topEvidenceGates = authoritySurfaceRows;
  const evidenceRequestedGroups = review?.customerEvidenceRequested ?? [];
  const sourceAbiLimitationNote = review?.customerSourceAbiLimitationNote;
  const detectorEvidence = review?.customerDetectorEvidence ?? [];
  const timelockCanonicalization = review?.customerTimelockCanonicalization ?? [];
  const explorerEvidenceByAsset = review ? reportSourceSummaryByAsset(review) : new Map();
  const scopeNote = review?.customerScopeNote;
  const reviewLimitation = review?.customerReviewLimitation;
  const expansion = review?.customerProtocolSurfaceExpansion;
  const scanMetadataAvailable = review ? hasScanMetadata(review) : false;
  const scanStatusText = scanStatusLabel(review?.scanStatus);

  const findingsBySeverity = (["critical", "high", "medium", "low"] as AdminFindingSeverity[])
    .map((sev) => ({
      sev,
      items: openItems
        .filter((f) => f.severity === sev)
        .sort((a, b) => {
          if (a.findingType === "role_concentration") return -1;
          if (b.findingType === "role_concentration") return 1;
          return findingDisplayOrder(a) - findingDisplayOrder(b);
        }),
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
              global threat families, and requested evidence. SCE does not administer this
              project, hold keys, or execute on-chain transactions.
            </p>
            <p style={{ fontSize: 13, color: MUTED, margin: "0 0 16px 0", lineHeight: 1.65 }}>
              {(() => {
                const receiptCount = supportingEvidenceReceipts.length || review.supportingEvidenceReceiptsCount || 0;
                const assetCount = activeAssets.length || review.assetsCount;
                return (
                  <>
                    This report includes{" "}
                    <strong style={{ color: TEXT }}>{receiptCount} supporting evidence receipt{receiptCount === 1 ? "" : "s"}</strong>
                    {" "}and{" "}
                    <strong style={{ color: TEXT }}>{evidenceStatus.unresolvedAssumptions ?? unresolvedAssumptions.length} unresolved assumption{(evidenceStatus.unresolvedAssumptions ?? unresolvedAssumptions.length) === 1 ? "" : "s"}</strong> across{" "}
                    <strong style={{ color: TEXT }}>{assetCount} mapped asset{assetCount === 1 ? "" : "s"}</strong>.
                  </>
                );
              })()}
            </p>
            {primaryFindingText && (
              <p style={{ fontSize: 13, color: TEXT, fontWeight: 700, margin: "0 0 16px 0", lineHeight: 1.6 }}>
                {primaryFindingText}
              </p>
            )}
            <div style={{ marginBottom: 18, padding: "12px 14px", borderLeft: `3px solid ${GOLD}`, background: "rgba(212,175,55,0.05)", borderRadius: "0 5px 5px 0" }}>
              <div style={{ fontSize: 10, color: GOLD, fontWeight: 800, letterSpacing: "0.1em", marginBottom: 6 }}>How to Read This Review</div>
              <p style={{ fontSize: 12, color: MUTED, margin: 0, lineHeight: 1.65 }}>
                Observed public facts are evidence inputs. They do not verify operating policy, signer custody, emergency procedures, or governance intent. This Defense Review is not an audit or certification.
              </p>
            </div>

            {/* Risk posture banner */}
            {(() => {
              const riskColor = criticalCount > 0 ? "#EF4444" : highCount > 0 ? "#F97316" : isEvidenceComplete ? "#22C55E" : GOLD;
              const riskLabel = criticalCount > 0 ? "Critical Risk" : highCount > 0 ? "High Risk" : isEvidenceComplete ? "Evidence Complete" : "Under Review";
              const riskDesc = criticalCount > 0
                ? `${criticalCount} critical authority surface${criticalCount > 1 ? "s" : ""} require immediate attention.`
                : highCount > 0
                  ? `${highCount} high-risk authority surface${highCount > 1 ? "s" : ""} require${highCount === 1 ? "s" : ""} review. These are open authority-surface findings, not confirmed vulnerabilities.`
                  : openFindings.length > 0
                    ? `${openFindings.length} open authority-surface finding${openFindings.length !== 1 ? "s" : ""} require${openFindings.length === 1 ? "s" : ""} review. These are not confirmed vulnerabilities.`
                  : "Public facts recorded; unresolved assumptions and evidence requests require follow-up review.";
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

            <div style={{ fontSize: 10, color: SUBTLE, fontWeight: 800, letterSpacing: "0.1em", marginBottom: 8 }}>OBSERVED BY SCE</div>
            <StatGrid>
              <Stat label="Assets Mapped" value={activeAssets.length || review.assetsCount} />
              {(authorityAssetsTotal > 0 || detectorExecutionIncomplete) && (
                <Stat
                  label="Paths Resolved"
                  value={authorityResolvedDisplay}
                  color={authorityPathsResolved > 0 ? "#22C55E" : TEXT}
                />
              )}
              {(authorityAssetsTotal > 0 || detectorExecutionIncomplete) && (
                <Stat
                  label="Owner Observed"
                  value={ownerEvidenceDisplay}
                  color={authorityPathsResolved > 0 ? "#22C55E" : TEXT}
                />
              )}
              <Stat label="Open Analytical Findings" value={openFindings.length} />
              <Stat
                label="Receipts"
                value={supportingEvidenceReceipts.length || review.supportingEvidenceReceiptsCount || 0}
              />
              {candidates.length > 0 && (
                <Stat label="Candidates" value={candidates.length} color={GOLD} />
              )}
              {(authorityAssetsTotal > 0 || detectorExecutionIncomplete) && (
                <Stat
                  label="Awaiting Evidence"
                  value={awaitingEvidenceDisplay}
                  color={authorityPathsAwaiting > 0 ? GOLD : TEXT}
                />
              )}
            </StatGrid>
            {(review.scanStatus === "partial" || review.scanStatus === "error") && (
              <StatGrid>
                <Stat label="Scan Status" value={scanStatusText} color={GOLD} />
              </StatGrid>
            )}

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
                  <MetaRow label="Assets scanned" value={`${review.scannedAssetCount ?? (activeAssets.length || review.assetsCount)} / ${review.mappedAssetCount ?? (activeAssets.length || review.assetsCount)}`} />
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
              {review.rpcStatus === "detector_execution_completed" && (
                <div style={{ fontSize: 12, color: MUTED, marginTop: 8 }}>
                  RPC public-call checks completed after RPC preflight passed. Detector observations establish only scoped public facts.
                </div>
              )}
            </div>

            {(reviewLimitation || detectorExecutionIncomplete) && (
              <div style={{ padding: "12px 14px", borderLeft: `3px solid ${GOLD}`, background: "rgba(212,175,55,0.05)", borderRadius: "0 5px 5px 0", marginBottom: 16 }}>
                <div style={{ fontSize: 10, color: GOLD, fontWeight: 800, letterSpacing: "0.1em", marginBottom: 6 }}>REVIEW LIMITATION / SCAN INCONCLUSIVE</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: TEXT, lineHeight: 1.6 }}>What this means</div>
                <div style={{ fontSize: 12, color: TEXT, lineHeight: 1.6 }}>
                  {review.rpcStatus === "rpc_configured_preflight_failed"
                    ? "Scan inconclusive - RPC preflight failed; detector execution was skipped."
                    : "RPC public-call checks attempted; detector execution failed. Scan inconclusive - retry required."}
                </div>
                <div style={{ fontSize: 12, color: TEXT, lineHeight: 1.6 }}>This execution failure does not prove a vulnerability or resolve an operating assumption.</div>
                <div style={{ fontSize: 12, color: MUTED, lineHeight: 1.6 }}>Evidence request: Re-run scan with working RPC transport.</div>
              </div>
            )}

            <div style={{ padding: "10px 14px", background: "rgba(212,175,55,0.05)", border: `1px solid ${SEP}`, borderRadius: 6, fontSize: 12, color: MUTED }}>
              Public observations and submitted evidence are assessed separately from operating assumptions.
            </div>
          </ReportSection>

          {/* ═══════════════════════════════════════════════════════════ */}
          {/* REVIEW SCOPE                                                */}
          {/* ═══════════════════════════════════════════════════════════ */}
          <ReportSection id="review-scope">
            <SectionHeader num={2}>Review Scope</SectionHeader>
            {scopeNote && (
              <div style={{ padding: "12px 14px", borderLeft: `3px solid ${GOLD}`, background: "rgba(212,175,55,0.05)", borderRadius: "0 5px 5px 0", marginBottom: 16, fontSize: 12, color: TEXT, lineHeight: 1.6 }}>
                {scopeNote}
              </div>
            )}
            {Boolean(expansion?.safe_summary_message) && (
              <div style={{ marginBottom: 16, fontSize: 12, color: MUTED, lineHeight: 1.6 }}>
                <div style={{ fontSize: 10, color: GOLD, fontWeight: 800, letterSpacing: "0.1em", marginBottom: 5 }}>DISCOVERED LINKED CONTRACT CANDIDATES</div>
                <div>{String(expansion?.safe_summary_message)}</div>
                <div>
                  Imported: {review.importedCandidateCount ?? 0} | Already mapped: {review.alreadyMappedCandidateCount ?? 0} | Pending import: {review.pendingCandidateCount ?? 0}
                </div>
                {candidates.map((candidate, i) => (
                  <div key={i}>
                    Candidate: {candidateDisplayName(candidate)} ({candidate.suggested_role ?? "unknown_contract"}) at {candidate.discovered_address ?? "not resolved"}; discovered from {candidate.function_signature ?? candidate.discovery_method ?? "public evidence"}; confidence: {candidate.confidence ?? "unresolved"}; status: {candidate.status ?? "candidate"}.
                  </div>
                ))}
              </div>
            )}

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
                      <Pill label={assetTypeLabel(a.assetType)} color={GOLD} />
                      <div style={{ flex: 1 }}>
                        <span style={{ color: TEXT, fontWeight: 600 }}>{reportAssetDisplayName(a, candidates, timelockCanonicalization)}</span>
                        <div style={{ marginTop: 2, fontSize: 11, color: MUTED, fontFamily: "monospace" }}>
                          {a.address ? shortMappedAddress(a.address) : <span style={{ color: SUBTLE, fontFamily: "inherit", fontStyle: "italic" }}>Address: Not provided</span>}
                        </div>
                        {a.chain && (
                          <div style={{ fontSize: 11, color: SUBTLE, marginTop: 1 }}>
                            {a.chain}{a.network ? ` / ${a.network}` : ""}
                          </div>
                        )}
                        <div style={{ fontSize: 11, color: SUBTLE, marginTop: 1, whiteSpace: "pre-line" }}>
                          {mappedOwnerDisplay(a, resolvedOwnerFindings, unresolvedOwnerFindings)}
                          {"\n"}Role: {assetRoleLabel(a)}
                        </div>
                        {reportAssetCanonicalStatus(a, timelockCanonicalization) && (
                          <div style={{ fontSize: 11, color: GOLD, marginTop: 3 }}>
                            {reportAssetCanonicalStatus(a, timelockCanonicalization)}
                          </div>
                        )}
                        <div style={{ fontSize: 11, color: SUBTLE, marginTop: 3 }}>
                          ABI: {explorerEvidenceByAsset.get(a.name)?.abiStatus ?? "Not recorded"}; Source: {explorerEvidenceByAsset.get(a.name)?.sourceStatus ?? "Not recorded"}
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
                      <Pill label={assetTypeLabel(a.assetType)} color={GOLD} />
                      <div style={{ flex: 1 }}>
                        <span style={{ color: TEXT, fontWeight: 600 }}>{reportAssetDisplayName(a, candidates, timelockCanonicalization)}</span>
                        {a.address ? (
                          <div style={{ marginTop: 2, fontSize: 11, color: MUTED, fontFamily: "monospace" }}>
                            {shortMappedAddress(a.address)}
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
                        <div style={{ fontSize: 11, color: SUBTLE, marginTop: 1, whiteSpace: "pre-line" }}>
                          {mappedOwnerDisplay(a, resolvedOwnerFindings, unresolvedOwnerFindings)}
                          {"\n"}Role: {assetRoleLabel(a)}
                        </div>
                        {reportAssetCanonicalStatus(a, timelockCanonicalization) && (
                          <div style={{ fontSize: 11, color: GOLD, marginTop: 3 }}>
                            {reportAssetCanonicalStatus(a, timelockCanonicalization)}
                          </div>
                        )}
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
          <ReportSection id="observed-public-facts">
            <SectionHeader num={3}>Observed Public Facts</SectionHeader>
            <ul style={{ margin: "0 0 18px 0", paddingLeft: 20, display: "grid", gap: 6 }}>
              {observedPublicFacts.map((fact, i) => (
                <li key={i} style={{ fontSize: 13, color: MUTED, lineHeight: 1.6 }}>{fact}</li>
              ))}
            </ul>
            <div style={{ fontSize: 10, color: SUBTLE, fontWeight: 800, letterSpacing: "0.1em", marginBottom: 8 }}>SEVERITY CONTEXT</div>

            <p style={{ fontSize: 13, color: MUTED, margin: "0 0 16px 0", lineHeight: 1.7 }}>
              Severity in this report reflects potential impact to protocol continuity, fund safety,
              and operational authority impact - not confirmed exploitation. Findings represent authority
              surfaces requiring verification. Severity may be revised downward once evidence is
              provided and verified.
            </p>

            <div style={{ display: "grid", gap: 8, marginBottom: 16 }}>
              {([
                { sev: "critical" as AdminFindingSeverity, color: "#EF4444", desc: "Direct fund movement, settlement, or custody authority with no timelock or multisig protection. Immediate risk to assets or protocol operation." },
                { sev: "high" as AdminFindingSeverity, color: "#F97316", desc: "Significant authority surface - upgrade authority, oracle authority, or admin role concentration - where evidence is absent or incomplete." },
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
              High-severity findings represent unverified authority surfaces, not confirmed security findings.
              Many findings reflect missing evidence rather than confirmed risk. Likelihood and verification
              confidence are factored into severity assignment.
            </div>
          </ReportSection>

          {/* ═══════════════════════════════════════════════════════════ */}
          {/* AUTHORITY FINDINGS                                          */}
          {/* ═══════════════════════════════════════════════════════════ */}
          <ReportSection id="authority-findings" breakBefore>
            <SectionHeader num={4}>Authority Surface Findings</SectionHeader>

            {findingsBySeverity.length === 0 ? (
              <EmptyState text="No analytical findings or supporting evidence receipts recorded." />
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
                      <FindingRow key={f.id} finding={f} assets={assets} candidates={candidates} sourceSummaryByAsset={explorerEvidenceByAsset} hasSharedOwnerFinding={Boolean(concentrationFinding)} />
                    ))}
                  </div>
                ))}
              </div>
            )}
          </ReportSection>

          {/* ═══════════════════════════════════════════════════════════ */}
          {/* RELEVANT THREAT FAMILIES                                   */}
          {/* ═══════════════════════════════════════════════════════════ */}
          <ReportSection id="protocol-interpretation">
            <SectionHeader num={5}>Protocol-Specific Interpretation</SectionHeader>
            {protocolInterpretation.length > 0 ? (
              <ul style={{ margin: 0, paddingLeft: 20, display: "grid", gap: 6 }}>
                {protocolInterpretation.map((item, i) => (
                  <li key={i} style={{ fontSize: 13, color: MUTED, lineHeight: 1.6 }}>{item}</li>
                ))}
              </ul>
            ) : (
              <p style={{ fontSize: 13, color: MUTED, margin: 0, lineHeight: 1.7 }}>{continuityRiskNarrative}</p>
            )}
            <p style={{ fontSize: 12, color: SUBTLE, margin: "10px 0 0 0", lineHeight: 1.6 }}>
              Capability observations and graph relationships are scoped evidence inputs and do not establish operating policy.
            </p>
            {detectorEvidence.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 10, color: SUBTLE, letterSpacing: "0.1em", marginBottom: 8 }}>DETECTOR EVIDENCE REGISTER</div>
                <div style={{ display: "grid", gap: 8 }}>
                  {detectorEvidence.slice(0, 12).map((item, i) => (
                    <div key={i} style={{ padding: "10px 12px", border: `1px solid ${SEP}`, borderRadius: 6, background: "rgba(255,255,255,0.02)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 5 }}>
                        <strong style={{ color: TEXT, fontSize: 13 }}>{item.detector} / {item.assetName}</strong>
                        <span style={{ color: GOLD, fontSize: 10, textTransform: "uppercase" }}>{item.observationStatus}</span>
                      </div>
                      <div style={{ color: MUTED, fontSize: 12, lineHeight: 1.55 }}>
                        Evidence source: {item.evidenceSource}; method: {item.method}; confidence: {item.confidenceLabel}.
                      </div>
                      {detectorObservedSummary(item.detector, item.observedValues) && (
                        <div style={{ color: MUTED, fontSize: 12, lineHeight: 1.55 }}>
                          Observed: {detectorObservedSummary(item.detector, item.observedValues)}
                        </div>
                      )}
                      {item.detector === "Etherscan V2 ABI / Source" && (
                        <div style={{ color: MUTED, fontSize: 12, lineHeight: 1.55 }}>
                          ABI: {item.abiStatus ?? "unavailable"}; source: {item.sourceStatus ?? "unavailable"}{item.contractName ? `; contract: ${item.contractName}` : ""}.
                        </div>
                      )}
                      <div style={{ color: MUTED, fontSize: 12, lineHeight: 1.55 }}>
                        Evidence Required: {(item.evidenceRequired ?? ["Supporting operating evidence."]).join(", ")}
                      </div>
                      <div style={{ color: SUBTLE, fontSize: 11, lineHeight: 1.55, marginTop: 4 }}>{item.nonClaim}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </ReportSection>

          <ReportSection id="unresolved-assumptions">
            <SectionHeader num={6}>Unresolved Assumptions</SectionHeader>
            <ul style={{ margin: "0 0 16px 0", paddingLeft: 20, display: "grid", gap: 6 }}>
              {unresolvedAssumptions.map((item, i) => (
                <li key={i} style={{ fontSize: 13, color: MUTED, lineHeight: 1.6 }}>{item}</li>
              ))}
            </ul>
            <div style={{ fontSize: 10, color: SUBTLE, fontWeight: 800, letterSpacing: "0.1em", marginBottom: 8 }}>AUTHORITY REVIEW BASIS</div>
            {topEvidenceGates.length === 0 ? (
              <EmptyState text="No customer-facing evidence gates are available yet. Run the Admin Surface Scan or submit review evidence." />
            ) : (
              <div style={{ display: "grid", gap: 8 }}>
                {topEvidenceGates.slice(0, 6).map((gate, i) => (
                  <div key={i} style={{ padding: "10px 12px", border: `1px solid ${SEP}`, borderRadius: 6, background: "rgba(255,255,255,0.02)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 5 }}>
                      <strong style={{ color: TEXT, fontSize: 13 }}>{normalizeCustomerOwnerCopy(gate.title)}</strong>
                      <span style={{ color: GOLD, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", whiteSpace: "nowrap" }}>{gate.priorityLabel}</span>
                    </div>
                    <div style={{ color: MUTED, fontSize: 12, lineHeight: 1.55 }}>{gate.whyItMatters}</div>
                    <div style={{ color: MUTED, fontSize: 12, lineHeight: 1.55, marginTop: 5 }}>
                      <strong>Evidence basis: </strong>
                      {gate.evidenceBasis ?? "Supporting evidence is required to complete this review gate."}
                    </div>
                    <div style={{ color: SUBTLE, fontSize: 11, marginTop: 5 }}>
                      Assets: {(gate.relatedAssets ?? ["Mapped assets"]).join(", ")} · Status: {gate.evidenceState ?? "evidence required"}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ReportSection>

          <ReportSection id="priority-review-path">
            <SectionHeader num={7}>Priority Review Path</SectionHeader>
            <p style={{ fontSize: 13, color: MUTED, margin: "0 0 12px 0", lineHeight: 1.6 }}>
              This sequence identifies evidence collection and pointer reconciliation work required to close unresolved assumptions.
            </p>
            <EmptyState text="Use the closure path below with the evidence requests in the next section." />
            <div style={{ marginTop: 14, padding: "12px 14px", borderLeft: `3px solid ${GOLD}`, background: "rgba(212,175,55,0.05)", borderRadius: "0 5px 5px 0" }}>
              <div style={{ fontSize: 10, color: GOLD, fontWeight: 800, letterSpacing: "0.1em", marginBottom: 6 }}>Review Closure Path</div>
              <p style={{ fontSize: 12, color: MUTED, margin: "0 0 4px 0", lineHeight: 1.6 }}>
                Step 1 - {mappedSourceAvailable && candidates.length > 0
                  ? review.candidateScopeState === "candidates_imported_scan_complete"
                    ? "Provide operating evidence for mapped and imported candidate assets."
                    : "Confirm source/ABI coverage for imported candidate assets after approval."
                  : "Submit source/ABI or verify contracts on a supported explorer."}
              </p>
              <p style={{ fontSize: 12, color: MUTED, margin: "0 0 4px 0", lineHeight: 1.6 }}>Step 2 - Provide owner/signer custody and emergency replacement evidence.</p>
              <p style={{ fontSize: 12, color: MUTED, margin: "0 0 4px 0", lineHeight: 1.6 }}>Step 3 - Provide treasury, oracle, role, emergency, and governance policies.</p>
              <p style={{ fontSize: 12, color: MUTED, margin: "0 0 4px 0", lineHeight: 1.6 }}>Step 4 - SCE reviews submitted evidence against mapped authority paths.</p>
              <p style={{ fontSize: 12, color: MUTED, margin: "0 0 7px 0", lineHeight: 1.6 }}>Step 5 - SCE re-runs supported public checks and updates unresolved assumptions.</p>
              <p style={{ fontSize: 12, color: TEXT, fontWeight: 600, margin: 0, lineHeight: 1.6 }}>
                Submitted evidence is reviewed against mapped authority paths and current project metadata before assumptions are updated.
              </p>
            </div>
          </ReportSection>

          <ReportSection id="evidence-requested">
            <SectionHeader num={8}>Evidence Requested</SectionHeader>
            {evidenceRequestedGroups.length === 0 ? (
              <EmptyState text="No customer-facing evidence request checklist is available yet." />
            ) : (
              <div style={{ display: "grid", gap: 12 }}>
                {evidenceRequestedGroups.map((group, i) => (
                  <div key={i}>
                    <div style={{ fontSize: 10, color: GOLD, fontWeight: 800, letterSpacing: "0.1em", marginBottom: 5 }}>{group.category?.toUpperCase()}</div>
                    <ul style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 4 }}>
                      {(group.requests ?? []).map((request, j) => <li key={j} style={{ fontSize: 12, color: MUTED, lineHeight: 1.5 }}>{request}</li>)}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </ReportSection>

          <ReportSection id="known-limitations-follow-up">
            <SectionHeader num={11}>Known Limitations / Follow-up Scope</SectionHeader>
            <ul style={{ margin: 0, paddingLeft: 20, display: "grid", gap: 6 }}>
              {followUpScope.map((item, i) => <li key={i} style={{ fontSize: 12, color: TEXT, lineHeight: 1.5 }}>{item}</li>)}
            </ul>
          </ReportSection>

          <ReportSection id="source-abi-verification-status">
            <SectionHeader num={9}>Source / ABI Verification Status</SectionHeader>
            <p style={{ fontSize: 13, color: MUTED, margin: 0, lineHeight: 1.7 }}>
              {sourceAbiLimitationNote ?? "No source/ABI lookup status is recorded for this report snapshot."}
            </p>
          </ReportSection>

          <ReportSection id="threat-families" breakBefore>
            <SectionHeader num={10}>Relevant Threat Families</SectionHeader>
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
                        <span>Case-library coverage: <strong style={{ color: SUBTLE, fontStyle: "italic" }}>Pending</strong></span>
                      ) : (
                        <>
                          <span>Case count: <strong style={{ color: TEXT }}>{tf.globalCaseCount}</strong></span>
                          <span>Critical count: <strong style={{ color: tf.criticalCount > 0 ? "#EF4444" : TEXT }}>{tf.criticalCount}</strong></span>
                        </>
                      )}
                    </div>
                    {tf.globalCaseCount === 0 && (
                      <div style={{ fontSize: 11, color: SUBTLE, fontStyle: "italic", marginBottom: 6 }}>
                        Case-library coverage pending — relevance is based on project authority surface match, not global case count.
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
          <ReportSection id="evidence-status" breakBefore>
            <SectionHeader num={12}>Evidence Status</SectionHeader>
            <p style={{ fontSize: 13, color: MUTED, margin: "0 0 14px 0", lineHeight: 1.6 }}>
              Evidence status reports scoped observations, open findings, unresolved assumptions, and requested follow-up evidence.
            </p>

            <StatGrid>
              <Stat label="Public Facts Observed" value={evidenceStatus.publicFactsObserved ?? observedPublicFacts.length} />
              <Stat label="Open Authority Findings" value={evidenceStatus.openAuthorityFindings ?? openFindings.length} />
              <Stat label="Supporting Evidence Receipts" value={evidenceStatus.supportingEvidenceReceipts ?? supportingEvidenceReceipts.length} />
              <Stat label="Unresolved Assumptions" value={evidenceStatus.unresolvedAssumptions ?? unresolvedAssumptions.length} color={GOLD} />
              <Stat label="Follow-up Scope Items" value={evidenceStatus.followUpScopeItems ?? followUpScope.length} />
              <Stat label="Evidence Requests" value={evidenceStatus.clientOperatorEvidenceRequests ?? 0} color={GOLD} />
            </StatGrid>
          </ReportSection>

          {/* ═══════════════════════════════════════════════════════════ */}
          {/* VERIFICATION STATUS                                         */}
          {/* ═══════════════════════════════════════════════════════════ */}
          {/* ═══════════════════════════════════════════════════════════ */}
          {/* NEXT ACTIONS                                                */}
          {/* ═══════════════════════════════════════════════════════════ */}
          <ReportSection id="next-actions">
            <SectionHeader num={13}>Next Actions</SectionHeader>
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
            <NavChip href="/dashboard/threat-matrix" label="Threat Matrix" />
          </div>
        </div>

        {/* ── Engine Intelligence Panel (internal, no-print) ──── */}
      </div>
    </>
  );
}

// ─── Engine Intelligence Panel (v5.5 internal surface) ───────────────────────

function shortAddress(addr: string | undefined): string {
  if (!addr || !addr.startsWith("0x") || addr.length < 10) return addr ?? "—";
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function getNodeLabel(node: ContractGraphNode | undefined | null): string {
  if (!node) return "";
  const r = node as Record<string, unknown>;
  if (typeof node.label === "string" && node.label) return node.label;
  if (typeof node.name === "string" && node.name) return node.name;
  if (typeof node.address === "string" && node.address) return shortAddress(node.address);
  if (typeof node.nodeType === "string" && node.nodeType) return node.nodeType;
  if (typeof r.node_type === "string" && r.node_type) return r.node_type as string;
  const id = r.id ?? r.node_id ?? r.nodeId;
  if (typeof id === "string" && id) return id.startsWith("0x") ? shortAddress(id) : id;
  return "Unknown";
}

function IntelLabel({ children, top }: { children: React.ReactNode; top?: boolean }) {
  return (
    <div style={{ fontSize: 10, letterSpacing: "0.1em", color: "rgba(148,163,184,0.55)", fontWeight: 700, marginBottom: 6, marginTop: top ? 14 : 0 }}>
      {children}
    </div>
  );
}

function IntelCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(212,175,55,0.12)", borderRadius: 8, padding: "18px 20px", marginBottom: 16 }}>
      <IntelLabel>{title}</IntelLabel>
      {children}
    </div>
  );
}

function IntelStat({ label, value, color }: { label: string; value: string | number | null | undefined; color?: string }) {
  return (
    <div style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      fontSize: 12,
      padding: "7px 10px",
      borderRadius: 4,
      background: "rgba(255,255,255,0.025)",
      border: "1px solid rgba(148,163,184,0.07)",
      gap: 8,
    }}>
      <span style={{ color: "rgba(148,163,184,0.65)", overflow: "hidden", textOverflow: "ellipsis" }}>{label}</span>
      <span style={{ color: color ?? "#E2E8F0", fontWeight: 600, flexShrink: 0 }}>{value ?? "—"}</span>
    </div>
  );
}

function JsonDebugBlock({ label, data }: { label: string; data: unknown }) {
  if (!data || (typeof data === "object" && Object.keys(data as object).length === 0)) {
    return (
      <details style={{ marginBottom: 8 }}>
        <summary style={{ fontSize: 11, color: "rgba(148,163,184,0.5)", cursor: "pointer", userSelect: "none" }}>{label} (empty)</summary>
      </details>
    );
  }
  return (
    <details style={{ marginBottom: 8 }}>
      <summary style={{ fontSize: 11, color: "#D4AF37", cursor: "pointer", userSelect: "none", fontWeight: 600 }}>{label}</summary>
      <pre style={{ fontSize: 10, color: "rgba(148,163,184,0.7)", background: "rgba(0,0,0,0.3)", padding: "10px 12px", borderRadius: 4, overflow: "auto", maxHeight: 260, margin: "6px 0 0" }}>
        {JSON.stringify(data, null, 2)}
      </pre>
    </details>
  );
}

function EngineIntelligencePanel({
  review,
  scanResponse,
  scanning,
  scanError,
  onRefresh,
  authorityPathsResolved,
  authorityAssetsTotal,
  totalAssets,
  openFindingsCount,
  verifiedControlsCount,
  totalControls,
}: {
  review: DefenseReview;
  scanResponse: RunScanResponse | null;
  scanning: boolean;
  scanError: string;
  onRefresh: () => void;
  authorityPathsResolved: number;
  authorityAssetsTotal: number;
  totalAssets: number;
  openFindingsCount: number;
  verifiedControlsCount: number;
  totalControls: number;
}) {
  const INTEL_BG = "#0a0c12";
  const INTEL_SEP = "rgba(212,175,55,0.12)";
  const INTEL_TEXT = "#E2E8F0";
  const INTEL_MUTED = "rgba(148,163,184,0.75)";
  const INTEL_SUBTLE = "rgba(148,163,184,0.45)";
  const GOLD = "#D4AF37";

  const gs: ContractGraphSummary | undefined = scanResponse?.contractGraphSummary;
  const narrative: BlastRadiusNarrativeSummary | undefined = scanResponse?.blastRadiusNarrativeSummary;
  const brSummary: BlastRadiusNarrativeSummary | undefined = scanResponse?.contractGraphBlastRadiusSummary;
  const receipts: BlastRadiusEvidenceReceipt[] = scanResponse?.blastRadiusEvidenceReceipts ?? [];
  const svh: SourceVerificationHealthSummary | undefined =
    scanResponse?.sourceVerificationHealthSummary ?? scanResponse?.sourceVerificationHealth;
  const abi: AbiRelationshipExtractionSummary | undefined =
    scanResponse?.scanMetadata?.abi_relationship_extraction;
  const graphNodes = scanResponse?.contractGraph?.nodes ?? [];
  const graphEdges = scanResponse?.contractGraph?.edges ?? [];

  // Build node lookup map for edge resolution
  const nodeById = new Map<string, ContractGraphNode>();
  for (const node of graphNodes) {
    const r = node as Record<string, unknown>;
    for (const key of ["id", "node_id", "nodeId"]) {
      const nid = r[key];
      if (typeof nid === "string" && nid) nodeById.set(nid, node);
    }
    if (typeof node.address === "string" && node.address) {
      nodeById.set(node.address.toLowerCase(), node);
    }
  }

  function resolveEdgeEndpoint(e: unknown, side: "from" | "to"): string {
    if (!e || typeof e !== "object") return "—";
    const r = e as Record<string, unknown>;
    const nodeIdKeys = side === "from" ? ["fromNodeId", "from_node_id"] : ["toNodeId", "to_node_id"];
    for (const key of nodeIdKeys) {
      const nodeId = r[key];
      if (typeof nodeId === "string" && nodeId) {
        if (nodeId.toLowerCase().includes("unresolved")) return "Unresolved";
        const node = nodeById.get(nodeId) ?? nodeById.get(nodeId.toLowerCase());
        if (node) return getNodeLabel(node);
        return nodeId.startsWith("0x") ? shortAddress(nodeId) : nodeId;
      }
    }
    const addrKeys = side === "from"
      ? ["from", "fromAddress", "from_address"]
      : ["to", "toAddress", "to_address"];
    for (const key of addrKeys) {
      const val = r[key];
      if (typeof val === "string" && val) {
        if (val.toLowerCase().includes("unresolved")) return "Unresolved";
        const node = nodeById.get(val.toLowerCase());
        if (node) return getNodeLabel(node);
        return val.startsWith("0x") ? shortAddress(val) : val;
      }
    }
    return "—";
  }

  function edgeField(e: unknown, ...keys: string[]): string {
    if (!e || typeof e !== "object") return "—";
    const r = e as Record<string, unknown>;
    for (const k of keys) {
      if (r[k] !== undefined && r[k] !== null && r[k] !== "") return String(r[k]);
    }
    return "—";
  }
  function strList(v: unknown): string[] {
    if (!Array.isArray(v)) return [];
    return v.filter((x): x is string => typeof x === "string");
  }
  function receiptField(r: BlastRadiusEvidenceReceipt, ...keys: string[]): string {
    for (const k of keys) {
      const v = (r as Record<string, unknown>)[k];
      if (typeof v === "string" && v.length > 0) return v;
    }
    return "—";
  }

  return (
    <div
      className="no-print"
      style={{ maxWidth: 880, margin: "48px auto 0", padding: "0 0 64px" }}
    >
      {/* ── Panel header ──────────────────────────────────────── */}
      <div style={{ borderTop: `2px solid ${INTEL_SEP}`, paddingTop: 24, marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 9, letterSpacing: "0.22em", color: GOLD, fontWeight: 800, marginBottom: 4 }}>
              INTERNAL INTELLIGENCE SURFACE — OPERATOR VIEW
            </div>
            <h2 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 700, color: INTEL_TEXT }}>
              Engine Intelligence
            </h2>
            <div style={{ fontSize: 12, color: INTEL_MUTED }}>
              Internal view of graph, source verification, ABI extraction, and blast-radius metadata generated by SCE.
            </div>
          </div>
          <button
            type="button"
            onClick={onRefresh}
            disabled={scanning}
            style={{
              background: scanning ? "rgba(212,175,55,0.08)" : "rgba(212,175,55,0.12)",
              border: `1px solid ${GOLD}44`,
              color: scanning ? INTEL_SUBTLE : GOLD,
              borderRadius: 4,
              padding: "6px 14px",
              fontSize: 11,
              fontWeight: 700,
              cursor: scanning ? "wait" : "pointer",
              letterSpacing: "0.04em",
              whiteSpace: "nowrap",
            }}
          >
            {scanning ? "Scanning…" : "⟳ Run Scan / Refresh Intelligence"}
          </button>
        </div>

        <div style={{ marginTop: 12, padding: "8px 12px", background: "rgba(148,163,184,0.04)", border: "1px solid rgba(148,163,184,0.12)", borderRadius: 5, fontSize: 11, color: INTEL_SUBTLE, lineHeight: 1.6 }}>
          Graph and blast-radius summaries are topology evidence. They do not establish operating posture.
          Control verification remains separate and is tracked in the Controls section above.
        </div>

        {scanError && (
          <div style={{ marginTop: 8, padding: "6px 12px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 4, fontSize: 11, color: "#FCA5A5" }}>
            Scan error: {scanError}
          </div>
        )}
      </div>

      {!scanResponse ? (
        <div style={{ padding: "20px 0", fontSize: 13, color: INTEL_SUBTLE, fontStyle: "italic" }}>
          No contract graph available. Run Scan / Refresh Intelligence to load engine intelligence for this review.
        </div>
      ) : (
        <div>
          {/* ── 1. Engine Summary ───────────────────────────────── */}
          <IntelCard title="ENGINE SUMMARY">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 6 }}>
              <IntelStat label="Scan Status" value={review.scanStatus} />
              <IntelStat
                label="Authority Paths Resolved"
                value={authorityAssetsTotal > 0 ? `${authorityPathsResolved} / ${authorityAssetsTotal}` : "Unavailable"}
                color={authorityPathsResolved > 0 ? "#22C55E" : undefined}
              />
              <IntelStat
                label="Owner Evidence Observed"
                value={authorityAssetsTotal > 0 ? `${authorityPathsResolved} / ${authorityAssetsTotal}` : "Unavailable"}
                color={authorityPathsResolved > 0 ? "#22C55E" : undefined}
              />
              <IntelStat
                label="Assets Scanned"
                value={totalAssets > 0 ? `${totalAssets} / ${totalAssets}` : review.assetsCount > 0 ? `${review.assetsCount} / ${review.assetsCount}` : "—"}
              />
              <IntelStat label="Open Analytical Findings" value={openFindingsCount > 0 ? openFindingsCount : review.findingsCount} />
              <IntelStat
                label="Evidence Items Reviewed"
                value={`${verifiedControlsCount} / ${totalControls}`}
                color={verifiedControlsCount > 0 ? "#22C55E" : undefined}
              />
              <IntelStat
                label="Source Verification"
                value={svh?.overallStatus ?? svh?.overall_status ?? review.sourceVerificationStatus ?? "Unavailable"}
                color={(() => {
                  const s = (svh?.overallStatus ?? svh?.overall_status ?? review.sourceVerificationStatus ?? "").toLowerCase();
                  return s.includes("degrad") || s.includes("error") ? "#EAB308" : s === "ok" || s === "verified" ? "#22C55E" : undefined;
                })()}
              />
              <IntelStat
                label="Source Verification Errors"
                value={svh?.errorAssets ?? svh?.error_assets ?? review.sourceVerificationErrorAssets ?? 0}
                color={(svh?.errorAssets ?? svh?.error_assets ?? review.sourceVerificationErrorAssets ?? 0) > 0 ? "#EAB308" : undefined}
              />
              <IntelStat label="ABI Relationships Found" value={abi?.relationshipsFound ?? abi?.relationships_found ?? 0} />
              <IntelStat label="Graph Nodes" value={(gs?.nodesCount ?? gs?.nodes_count ?? graphNodes.length) || 0} />
              <IntelStat label="Graph Edges" value={(gs?.edgesCount ?? gs?.edges_count ?? graphEdges.length) || 0} />
            </div>
          </IntelCard>

          {/* ── 2. Blast-Radius Narrative ────────────────────────── */}
          <IntelCard title="BLAST-RADIUS NARRATIVE — TOPOLOGY INTERPRETATION">
            {!narrative && !brSummary ? (
              <div style={{ fontSize: 12, color: INTEL_SUBTLE, fontStyle: "italic" }}>No blast-radius narrative available. Run or refresh intelligence.</div>
            ) : (
              <>
                {(narrative?.headline ?? brSummary?.headline) && (
                  <div style={{
                    fontSize: 14,
                    color: INTEL_TEXT,
                    fontWeight: 700,
                    marginBottom: 12,
                    lineHeight: 1.5,
                    padding: "8px 12px",
                    background: "rgba(212,175,55,0.06)",
                    border: "1px solid rgba(212,175,55,0.15)",
                    borderLeft: `3px solid ${GOLD}`,
                    borderRadius: "0 5px 5px 0",
                  }}>
                    {narrative?.headline ?? brSummary?.headline}
                  </div>
                )}
                {strList(narrative?.key_points ?? narrative?.keyPoints ?? brSummary?.key_points ?? brSummary?.keyPoints).length > 0 && (
                  <div style={{ marginBottom: 14 }}>
                    <IntelLabel>KEY POINTS</IntelLabel>
                    <ul style={{ margin: 0, paddingLeft: 16, display: "grid", gap: 4 }}>
                      {strList(narrative?.key_points ?? narrative?.keyPoints ?? brSummary?.key_points ?? brSummary?.keyPoints).map((p, i) => (
                        <li key={i} style={{ fontSize: 12, color: INTEL_MUTED, lineHeight: 1.7 }}>{p}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {strList(narrative?.next_evidence_gates ?? narrative?.nextEvidenceGates ?? brSummary?.next_evidence_gates ?? brSummary?.nextEvidenceGates).length > 0 && (
                  <div style={{ marginBottom: 14 }}>
                    <IntelLabel>NEXT EVIDENCE GATES</IntelLabel>
                    <ul style={{ margin: 0, paddingLeft: 16, display: "grid", gap: 4 }}>
                      {strList(narrative?.next_evidence_gates ?? narrative?.nextEvidenceGates ?? brSummary?.next_evidence_gates ?? brSummary?.nextEvidenceGates).map((g, i) => (
                        <li key={i} style={{ fontSize: 12, color: INTEL_MUTED, lineHeight: 1.7 }}>{g}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {(() => {
                  const limits = narrative?.evidenceLimits ?? narrative?.evidence_limits ?? brSummary?.evidenceLimits ?? brSummary?.evidence_limits;
                  const entries = limits && typeof limits === "object" ? Object.entries(limits as Record<string, unknown>) : [];
                  if (entries.length === 0) return null;
                  return (
                    <div style={{ marginBottom: 14 }}>
                      <IntelLabel>EVIDENCE LIMITS</IntelLabel>
                      <ul style={{ margin: 0, paddingLeft: 16, display: "grid", gap: 4 }}>
                        {entries.map(([k, v], i) => (
                          <li key={i} style={{ fontSize: 11, color: INTEL_SUBTLE, lineHeight: 1.6 }}>
                            <span style={{ color: INTEL_MUTED }}>{k}:</span> {String(v)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })()}
                {strList(narrative?.non_claims ?? narrative?.nonClaims ?? brSummary?.non_claims ?? brSummary?.nonClaims).length > 0 && (
                  <div>
                    <IntelLabel>NON-CLAIMS</IntelLabel>
                    <ul style={{ margin: 0, paddingLeft: 16, display: "grid", gap: 4 }}>
                      {strList(narrative?.non_claims ?? narrative?.nonClaims ?? brSummary?.non_claims ?? brSummary?.nonClaims).map((c, i) => (
                        <li key={i} style={{ fontSize: 11, color: INTEL_SUBTLE, fontStyle: "italic", lineHeight: 1.6 }}>{c}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
          </IntelCard>

          {/* ── 3. Evidence Receipts ─────────────────────────────── */}
          <IntelCard title={`BLAST-RADIUS EVIDENCE RECEIPTS (${receipts.length})`}>
            {receipts.length === 0 ? (
              <div style={{ fontSize: 12, color: INTEL_SUBTLE, fontStyle: "italic" }}>No blast-radius receipts available yet.</div>
            ) : (
              <div style={{ display: "grid", gap: 14 }}>
                {receipts.map((r, i) => (
                  <div key={i} style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(212,175,55,0.12)", borderRadius: 7, padding: "16px 18px" }}>
                    {/* Badge + title row */}
                    <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 10, flexWrap: "wrap" }}>
                      {receiptField(r, "receiptType", "receipt_type") !== "—" && (
                        <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.1em", color: GOLD, border: `1px solid ${GOLD}44`, padding: "3px 8px", borderRadius: 3, whiteSpace: "nowrap" }}>
                          {receiptField(r, "receiptType", "receipt_type").toUpperCase()}
                        </span>
                      )}
                      <span style={{ fontSize: 13, fontWeight: 700, color: INTEL_TEXT, lineHeight: 1.4 }}>
                        {receiptField(r, "title")}
                      </span>
                    </div>
                    {/* Summary — most important line */}
                    {receiptField(r, "summary") !== "—" && (
                      <div style={{ fontSize: 13, color: INTEL_TEXT, lineHeight: 1.7, marginBottom: 14, borderLeft: "2px solid rgba(212,175,55,0.25)", paddingLeft: 12 }}>
                        {receiptField(r, "summary")}
                      </div>
                    )}
                    {/* Compact meta row */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 6, marginBottom: 14 }}>
                      <IntelStat label="Family" value={receiptField(r, "relationshipFamily", "relationship_family")} />
                      <IntelStat label="Domain" value={receiptField(r, "continuityDomain", "continuity_domain")} />
                      <IntelStat label="Confidence" value={receiptField(r, "confidence")} />
                      <IntelStat label="Control Verification" value={receiptField(r, "controlVerification", "control_verification")} />
                    </div>
                    {/* Affected assets */}
                    {strList(r.affectedAssets ?? r.affected_assets).length > 0 && (
                      <div style={{ marginBottom: 12 }}>
                        <IntelLabel>AFFECTED ASSETS</IntelLabel>
                        <div style={{ fontSize: 11, color: INTEL_MUTED, lineHeight: 1.7 }}>
                          {strList(r.affectedAssets ?? r.affected_assets).join(", ")}
                        </div>
                      </div>
                    )}
                    {/* Evidence basis */}
                    {strList(r.evidenceBasis ?? r.evidence_basis).length > 0 && (
                      <div style={{ marginBottom: 12 }}>
                        <IntelLabel>EVIDENCE BASIS</IntelLabel>
                        <ul style={{ margin: 0, paddingLeft: 16, display: "grid", gap: 4 }}>
                          {strList(r.evidenceBasis ?? r.evidence_basis).map((b, j) => (
                            <li key={j} style={{ fontSize: 11, color: INTEL_SUBTLE, lineHeight: 1.6 }}>{b}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {/* Evidence required */}
                    {strList(r.evidenceRequired ?? r.evidence_required).length > 0 && (
                      <div style={{ marginBottom: 12 }}>
                        <IntelLabel>EVIDENCE REQUIRED</IntelLabel>
                        <ul style={{ margin: 0, paddingLeft: 16, display: "grid", gap: 4 }}>
                          {strList(r.evidenceRequired ?? r.evidence_required).map((e, j) => (
                            <li key={j} style={{ fontSize: 11, color: INTEL_MUTED, lineHeight: 1.6 }}>{e}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {/* Non-claim */}
                    {receiptField(r, "nonClaim", "non_claim") !== "—" && (
                      <div style={{ marginTop: 4, paddingTop: 10, borderTop: "1px solid rgba(148,163,184,0.07)", fontSize: 11, color: INTEL_SUBTLE, fontStyle: "italic", lineHeight: 1.6 }}>
                        {receiptField(r, "nonClaim", "non_claim")}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </IntelCard>

          {/* ── 4. Graph Summary ─────────────────────────────────── */}
          <IntelCard title="CONTRACT GRAPH SUMMARY">
            {!gs ? (
              <div style={{ fontSize: 12, color: INTEL_SUBTLE, fontStyle: "italic" }}>No contract graph available. Run or refresh intelligence.</div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 6 }}>
                <IntelStat label="Nodes" value={gs.nodesCount ?? gs.nodes_count} />
                <IntelStat label="Edges" value={gs.edgesCount ?? gs.edges_count} />
                <IntelStat label="Owner Edges" value={gs.ownerEdgesCount ?? gs.owner_edges_count} />
                <IntelStat label="Unresolved Edges" value={gs.unresolvedEdgesCount ?? gs.unresolved_edges_count} />
                <IntelStat label="Proxy Edges" value={gs.proxyEdgesCount ?? gs.proxy_edges_count} />
                <IntelStat label="ABI Relationship Edges" value={gs.abiRelationshipEdgesCount ?? gs.abi_relationship_edges_count} />
                <IntelStat label="Shared Owner Groups" value={gs.sharedOwnerGroupsCount ?? gs.shared_owner_groups_count} />
              </div>
            )}
            {(gs?.familyCounts ?? gs?.family_counts) && Object.keys(gs.familyCounts ?? gs.family_counts ?? {}).length > 0 && (
              <div style={{ marginTop: 12 }}>
                <IntelLabel>FAMILY COUNTS</IntelLabel>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 6 }}>
                  {Object.entries(gs.familyCounts ?? gs.family_counts ?? {}).map(([k, v]) => (
                    <IntelStat key={k} label={k} value={String(v)} />
                  ))}
                </div>
              </div>
            )}
          </IntelCard>

          {/* ── 5. Source Verification Health ────────────────────── */}
          <IntelCard title="SOURCE VERIFICATION HEALTH">
            {!svh ? (
              <div style={{ fontSize: 12, color: INTEL_SUBTLE, fontStyle: "italic" }}>Source verification health unavailable. Run or refresh intelligence.</div>
            ) : (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 6, marginBottom: 12 }}>
                  <IntelStat label="Enabled" value={String(svh.enabled ?? "—")} />
                  <IntelStat label="Overall Status" value={svh.overallStatus ?? svh.overall_status ?? "—"} />
                  <IntelStat label="Checked Assets" value={svh.checkedAssets ?? svh.checked_assets ?? "—"} />
                  <IntelStat label="Verified Assets" value={svh.verifiedAssets ?? svh.verified_assets ?? "—"} />
                  <IntelStat label="Error Assets" value={svh.errorAssets ?? svh.error_assets ?? "—"} />
                  <IntelStat label="Chains Missing API Key" value={svh.chainsMissingApiKey ?? svh.chains_missing_api_key ?? "—"} />
                </div>
                {(svh.chains ?? svh.chain_statuses ?? svh.chainStatuses) && (
                  <div>
                    <IntelLabel>CHAIN STATUSES</IntelLabel>
                    {(svh.chains ?? svh.chain_statuses ?? svh.chainStatuses ?? []).map((c, i) => {
                      const chain = c as Record<string, unknown>;
                      return (
                        <div key={i} style={{ fontSize: 11, color: INTEL_MUTED, padding: "6px 8px", borderRadius: 4, background: "rgba(255,255,255,0.02)", marginBottom: 4 }}>
                          Chain {String(chain.chain_id ?? chain.chainId ?? i)}: {String(chain.status ?? "—")}
                          {chain.notes ? ` — ${String(chain.notes)}` : ""}
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </IntelCard>

          {/* ── 6. ABI Relationship Extraction ───────────────────── */}
          <IntelCard title="ABI RELATIONSHIP EXTRACTION">
            {!abi ? (
              <div style={{ fontSize: 12, color: INTEL_SUBTLE, fontStyle: "italic" }}>No ABI relationships found. This may mean ABI/source is unavailable for the scanned assets.</div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 6 }}>
                <IntelStat label="Enabled" value={String(abi.enabled ?? "—")} />
                <IntelStat label="Assets with ABI" value={abi.assetsWithAbi ?? abi.assets_with_abi ?? "—"} />
                <IntelStat label="Assets Checked" value={abi.assetsChecked ?? abi.assets_checked ?? "—"} />
                <IntelStat label="Functions Considered" value={abi.functionsConsidered ?? abi.functions_considered ?? "—"} />
                <IntelStat label="Calls Attempted" value={abi.callsAttempted ?? abi.calls_attempted ?? "—"} />
                <IntelStat label="Calls Skipped" value={abi.callsSkipped ?? abi.calls_skipped ?? abi.skipped ?? "—"} />
                <IntelStat label="Relationships Found" value={abi.relationshipsFound ?? abi.relationships_found ?? "—"} />
                <IntelStat label="Errors" value={abi.errors ?? "—"} />
                <IntelStat label="Max Calls / Asset" value={abi.maxCallsPerAsset ?? abi.max_calls_per_asset ?? "—"} />
                <IntelStat label="Max Calls / Scan" value={abi.maxCallsPerScan ?? abi.max_calls_per_scan ?? "—"} />
              </div>
            )}
          </IntelCard>

          {/* ── 7. Graph Edge Preview ─────────────────────────────── */}
          <IntelCard title={`GRAPH EDGE PREVIEW (${graphEdges.length} edges)`}>
            {graphEdges.length === 0 ? (
              <div style={{ fontSize: 12, color: INTEL_SUBTLE, fontStyle: "italic" }}>No contract graph available. Run or refresh intelligence.</div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid rgba(212,175,55,0.2)" }}>
                      {["From", "Relation", "To", "Family", "Domain", "Confidence", "Evidence Source"].map((h) => (
                        <th key={h} style={{ textAlign: "left", padding: "8px 10px", color: INTEL_SUBTLE, fontWeight: 700, fontSize: 9, letterSpacing: "0.08em", whiteSpace: "nowrap" }}>
                          {h.toUpperCase()}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {graphEdges.slice(0, 50).map((e, i) => {
                      const fromLabel = resolveEdgeEndpoint(e, "from");
                      const toLabel = resolveEdgeEndpoint(e, "to");
                      return (
                        <tr key={i} style={{ borderBottom: "1px solid rgba(148,163,184,0.07)", background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.015)" }}>
                          <td style={{ padding: "8px 10px", color: INTEL_MUTED, maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={fromLabel}>
                            {fromLabel}
                          </td>
                          <td style={{ padding: "8px 10px", color: GOLD, whiteSpace: "nowrap" }}>
                            {edgeField(e, "relation", "relationshipType", "relationship_type")}
                          </td>
                          <td style={{ padding: "8px 10px", color: INTEL_MUTED, maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={toLabel}>
                            {toLabel}
                          </td>
                          <td style={{ padding: "8px 10px", color: INTEL_MUTED, whiteSpace: "nowrap" }}>
                            {edgeField(e, "family", "relationshipFamily", "relationship_family")}
                          </td>
                          <td style={{ padding: "8px 10px", color: INTEL_MUTED, whiteSpace: "nowrap" }}>
                            {edgeField(e, "domain", "continuityDomain", "continuity_domain")}
                          </td>
                          <td style={{ padding: "8px 10px", color: INTEL_MUTED, whiteSpace: "nowrap" }}>
                            {edgeField(e, "confidence")}
                          </td>
                          <td style={{ padding: "8px 10px", color: INTEL_SUBTLE, whiteSpace: "nowrap" }}>
                            {edgeField(e, "evidenceSource", "evidence_source")}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {graphEdges.length > 50 && (
                  <div style={{ fontSize: 11, color: INTEL_SUBTLE, marginTop: 6 }}>
                    Showing 50 of {graphEdges.length} edges.
                  </div>
                )}
              </div>
            )}
          </IntelCard>

          {/* ── 8. Capability Narrative (v6.1) ───────────────────── */}
          <CapabilityNarrativeSection scanResponse={scanResponse} intelSubtle={INTEL_SUBTLE} intelText={INTEL_TEXT} intelMuted={INTEL_MUTED} intelSep={INTEL_SEP} gold={GOLD} />

          {/* ── 9. Capability Priority Queue (v6.3) ──────────────── */}
          <CapabilityPriorityQueueSection scanResponse={scanResponse} intelSubtle={INTEL_SUBTLE} intelText={INTEL_TEXT} intelMuted={INTEL_MUTED} intelSep={INTEL_SEP} gold={GOLD} />
          <EvidenceRequestChecklistSection scanResponse={scanResponse} intelSubtle={INTEL_SUBTLE} intelText={INTEL_TEXT} intelMuted={INTEL_MUTED} intelSep={INTEL_SEP} gold={GOLD} />

          {/* ── 10. Capability Evidence Receipts (v6.1) ──────────── */}
          <CapabilityEvidenceReceiptsSection scanResponse={scanResponse} intelSubtle={INTEL_SUBTLE} intelText={INTEL_TEXT} intelMuted={INTEL_MUTED} intelSep={INTEL_SEP} gold={GOLD} />

          {/* ── 11. Capability-to-Control Mapping (v6.2) ─────────── */}
          <CapabilityControlMappingSection scanResponse={scanResponse} intelSubtle={INTEL_SUBTLE} intelText={INTEL_TEXT} intelMuted={INTEL_MUTED} intelSep={INTEL_SEP} gold={GOLD} />

          {/* ── 12. Capability Inventory (v6) ─────────────────────── */}
          <CapabilityInventorySection scanResponse={scanResponse} intelSubtle={INTEL_SUBTLE} intelText={INTEL_TEXT} intelMuted={INTEL_MUTED} intelSep={INTEL_SEP} gold={GOLD} />

          {/* ── 14. JSON Debug (collapsed by default) ────────────── */}
          <details style={{ borderTop: "1px solid rgba(148,163,184,0.1)", paddingTop: 12, marginTop: 8 }}>
            <summary style={{ fontSize: 10, letterSpacing: "0.14em", color: INTEL_SUBTLE, fontWeight: 700, marginBottom: 8, cursor: "pointer", userSelect: "none" }}>
              JSON DEBUG — TOPOLOGY EVIDENCE OBJECTS (click to expand)
            </summary>
            <div style={{ marginTop: 8 }}>
              <JsonDebugBlock label="contractGraphSummary" data={scanResponse?.contractGraphSummary} />
              <JsonDebugBlock label="contractGraphBlastRadiusSummary" data={scanResponse?.contractGraphBlastRadiusSummary} />
              <JsonDebugBlock label="blastRadiusEvidenceReceipts" data={scanResponse?.blastRadiusEvidenceReceipts} />
              <JsonDebugBlock label="blastRadiusNarrativeSummary" data={scanResponse?.blastRadiusNarrativeSummary} />
              <JsonDebugBlock label="sourceVerificationHealthSummary" data={scanResponse?.sourceVerificationHealthSummary} />
              <JsonDebugBlock label="abiRelationshipExtraction (from scanMetadata)" data={abi} />
              <JsonDebugBlock label="capabilityExtractionMeta (from scanMetadata)" data={scanResponse?.scanMetadata?.capability_extraction} />
              <JsonDebugBlock label="capabilityNarrativeSummary" data={scanResponse?.capabilityNarrativeSummary} />
              <JsonDebugBlock label="capabilityPrioritySummary" data={scanResponse?.capabilityPrioritySummary} />
              <JsonDebugBlock label="capabilityPriorityItems" data={scanResponse?.capabilityPriorityItems} />
              <JsonDebugBlock label="capabilityEvidenceReceipts" data={scanResponse?.capabilityEvidenceReceipts} />
              <JsonDebugBlock label="capabilityControlSummary" data={scanResponse?.capabilityControlSummary} />
              <JsonDebugBlock label="capabilityControlMappings" data={scanResponse?.capabilityControlMappings} />
            </div>
          </details>
        </div>
      )}
    </div>
  );
}

// ─── v6.1 Capability Narrative section ───────────────────────────────────────

function CapabilityNarrativeSection({
  scanResponse,
  intelSubtle,
  intelText,
  intelMuted,
  intelSep,
  gold,
}: {
  scanResponse: RunScanResponse | null;
  intelSubtle: string;
  intelText: string;
  intelMuted: string;
  intelSep: string;
  gold: string;
}) {
  const narrative = (scanResponse?.capabilityNarrativeSummary ?? scanResponse?.scanMetadata?.capability_narrative_summary) as CapabilityNarrativeSummary | undefined;
  const capMeta = scanResponse?.scanMetadata?.capability_extraction as CapabilityExtractionMeta | undefined;

  if (!narrative?.headline) {
    return (
      <IntelCard title="CAPABILITY NARRATIVE (v6.1 — INTERNAL)">
        <div style={{ fontSize: 12, color: intelSubtle, fontStyle: "italic" }}>
          No capability narrative available. Run Scan / Refresh Intelligence to populate v6 fields.
        </div>
      </IntelCard>
    );
  }

  const keyPoints: string[] = (narrative.keyPoints ?? narrative.key_points ?? []) as string[];
  const evidenceLimits: string[] = (narrative.evidenceLimits ?? narrative.evidence_limits ?? []) as string[];
  const nextGates: string[] = (narrative.nextEvidenceGates ?? narrative.next_evidence_gates ?? []) as string[];
  const nonClaims: string[] = (narrative.nonClaims ?? narrative.non_claims ?? []) as string[];

  const abiObs = capMeta?.capabilitiesObservedFromAbi ?? capMeta?.capabilities_observed_from_abi ?? 0;
  const roleInferred = capMeta?.capabilitiesInferredFromRole ?? capMeta?.capabilities_inferred_from_role ?? 0;
  const total = capMeta?.totalCapabilities ?? capMeta?.total_capabilities ?? 0;
  const allRoleInferred = total > 0 && abiObs === 0 && roleInferred > 0;
  const hasAbiObserved = abiObs > 0;

  return (
    <IntelCard title="CAPABILITY NARRATIVE (v6.1 — INTERNAL)">
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
        <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.12em", color: "#94A3B8", background: "rgba(148,163,184,0.1)", border: "1px solid rgba(148,163,184,0.25)", borderRadius: 3, padding: "3px 8px" }}>
          OPERATOR SUMMARY
        </span>
        {hasAbiObserved && (
          <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", color: "#86EFAC", background: "rgba(134,239,172,0.1)", border: "1px solid rgba(134,239,172,0.25)", borderRadius: 3, padding: "3px 8px" }}>
            ABI-OBSERVED CAPABILITIES AVAILABLE
          </span>
        )}
        {allRoleInferred && (
          <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", color: "#FCD34D", background: "rgba(252,211,77,0.08)", border: "1px solid rgba(252,211,77,0.25)", borderRadius: 3, padding: "3px 8px" }}>
            ROLE-INFERRED ONLY
          </span>
        )}
      </div>

      {allRoleInferred && (
        <div style={{ marginBottom: 12, padding: "8px 12px", background: "rgba(252,211,77,0.06)", borderRadius: 4, border: "1px solid rgba(252,211,77,0.2)", fontSize: 11, color: "#FCD34D", lineHeight: 1.6 }}>
          Capability inventory is role-inferred because ABI/source is unavailable. Submit source/ABI or explorer access to enable ABI-observed capability detection.
        </div>
      )}

      <div style={{ marginBottom: 12, padding: "8px 12px", background: "rgba(212,175,55,0.07)", borderRadius: 4, border: `1px solid rgba(212,175,55,0.18)`, fontSize: 11, color: intelMuted, lineHeight: 1.6 }}>
        Capability narrative is evidence-gate context only - not a finding or verified control status.
      </div>

      <div style={{ fontSize: 14, fontWeight: 700, color: intelText, marginBottom: 14, lineHeight: 1.5 }}>{narrative.headline}</div>

      {keyPoints.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 10, letterSpacing: "0.12em", color: intelSubtle, fontWeight: 700, marginBottom: 6 }}>KEY POINTS</div>
          <ul style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 4, fontSize: 12, color: intelMuted, lineHeight: 1.7 }}>
            {keyPoints.map((p, i) => <li key={i}>{p}</li>)}
          </ul>
        </div>
      )}
      {evidenceLimits.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 10, letterSpacing: "0.12em", color: intelSubtle, fontWeight: 700, marginBottom: 6 }}>EVIDENCE LIMITS</div>
          <ul style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 4, fontSize: 11, color: intelSubtle, lineHeight: 1.6 }}>
            {evidenceLimits.map((l, i) => <li key={i}>{l}</li>)}
          </ul>
        </div>
      )}
      {nextGates.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 10, letterSpacing: "0.12em", color: intelSubtle, fontWeight: 700, marginBottom: 6 }}>NEXT EVIDENCE GATES</div>
          <ul style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 4, fontSize: 11, color: gold, lineHeight: 1.6 }}>
            {nextGates.map((g, i) => <li key={i}>{g}</li>)}
          </ul>
        </div>
      )}
      {nonClaims.length > 0 && (
        <div style={{ fontSize: 10, color: intelSubtle, fontStyle: "italic", borderTop: `1px solid ${intelSep}`, paddingTop: 10, marginTop: 6, display: "grid", gap: 3, lineHeight: 1.6 }}>
          {nonClaims.map((nc, i) => <div key={i}>{nc}</div>)}
        </div>
      )}
    </IntelCard>
  );
}

// ─── v6.1 Capability Evidence Receipts section ───────────────────────────────

const _RECEIPT_TYPE_LABEL: Record<string, string> = {
  high_attention_capability: "HIGH ATTENTION",
  abi_observed_capability: "ABI-OBSERVED",
  role_inferred_capability: "ROLE-INFERRED",
  capability_coverage_limit: "COVERAGE LIMIT",
  capability_evidence_limit: "EVIDENCE LIMIT",
  capability_family: "CAPABILITY",
};

const _RECEIPT_TYPE_COLOR: Record<string, string> = {
  high_attention_capability: "#FCA5A5",
  abi_observed_capability: "#86EFAC",
  role_inferred_capability: "#FCD34D",
  capability_coverage_limit: "#94A3B8",
  capability_evidence_limit: "#94A3B8",
  capability_family: "#CBD5E1",
};

function _receiptSortKey(rType: string): number {
  if (rType === "high_attention_capability") return 0;
  if (rType === "capability_coverage_limit" || rType === "capability_evidence_limit") return 1;
  if (rType === "abi_observed_capability") return 2;
  if (rType === "role_inferred_capability") return 3;
  return 4;
}

function CapabilityEvidenceReceiptsSection({
  scanResponse,
  intelSubtle,
  intelText,
  intelMuted,
  intelSep,
  gold,
}: {
  scanResponse: RunScanResponse | null;
  intelSubtle: string;
  intelText: string;
  intelMuted: string;
  intelSep: string;
  gold: string;
}) {
  const [showAll, setShowAll] = useState(false);
  const rawReceipts = (
    scanResponse?.capabilityEvidenceReceipts ??
    ((scanResponse?.scanMetadata as Record<string, unknown>)?.capability_evidence_receipts as CapabilityEvidenceReceipt[] | undefined) ??
    []
  ) as CapabilityEvidenceReceipt[];

  if (rawReceipts.length === 0) {
    return (
      <IntelCard title="CAPABILITY EVIDENCE RECEIPTS (v6.1 — INTERNAL)">
        <div style={{ fontSize: 12, color: intelSubtle, fontStyle: "italic" }}>
          No capability receipts yet. Run Scan / Refresh Intelligence to populate v6 fields.
        </div>
      </IntelCard>
    );
  }

  const receipts = [...rawReceipts].sort((a, b) => {
    const aType = (a.receiptType ?? a.receipt_type ?? "capability_family") as string;
    const bType = (b.receiptType ?? b.receipt_type ?? "capability_family") as string;
    return _receiptSortKey(aType) - _receiptSortKey(bType);
  });

  const SHOW_INITIAL = 6;
  const visible = showAll ? receipts : receipts.slice(0, SHOW_INITIAL);

  return (
    <IntelCard title="CAPABILITY EVIDENCE RECEIPTS (v6.1 — INTERNAL)">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
        <div style={{ padding: "7px 12px", background: "rgba(212,175,55,0.07)", borderRadius: 4, border: `1px solid rgba(212,175,55,0.18)`, fontSize: 11, color: intelMuted, lineHeight: 1.6, flex: 1 }}>
          Each receipt is an evidence gate. Receipts do not prove control status or verified controls.
        </div>
        <div style={{ fontSize: 11, color: intelSubtle, flexShrink: 0 }}>
          {receipts.length} receipt{receipts.length !== 1 ? "s" : ""}
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {visible.map((receipt, i) => {
          const rType = (receipt.receiptType ?? receipt.receipt_type ?? "capability_family") as string;
          const family = (receipt.capabilityFamily ?? receipt.capability_family ?? "") as string;
          const title = receipt.title ?? "";
          const summary = receipt.summary ?? "";
          const assets = (receipt.affectedAssets ?? receipt.affected_assets ?? []) as string[];
          const evReq = (receipt.evidenceRequired ?? receipt.evidence_required ?? []) as string[];
          const nonClaim = (receipt.nonClaim ?? receipt.non_claim ?? "") as string;
          const confidence = (receipt.confidence ?? "") as string;
          const cv = (receipt.controlVerification ?? receipt.control_verification ?? "evidence_required") as string;
          const badgeLabel = _RECEIPT_TYPE_LABEL[rType] ?? rType;
          const badgeColor = _RECEIPT_TYPE_COLOR[rType] ?? "#CBD5E1";

          return (
            <div key={i} style={{ border: `1px solid rgba(148,163,184,0.15)`, borderRadius: 6, padding: "12px 14px", background: "rgba(255,255,255,0.02)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.12em", color: badgeColor, background: `${badgeColor}18`, border: `1px solid ${badgeColor}44`, borderRadius: 3, padding: "3px 7px" }}>
                  {badgeLabel}
                </span>
                {family && family !== "coverage_limit" && (
                  <span style={{ fontSize: 9, letterSpacing: "0.1em", color: intelSubtle, background: "rgba(148,163,184,0.08)", border: `1px solid rgba(148,163,184,0.2)`, borderRadius: 3, padding: "3px 7px" }}>
                    {_FAMILY_LABELS[family] ?? family}
                  </span>
                )}
                {title && <span style={{ fontSize: 11, color: intelMuted, fontWeight: 600 }}>{title}</span>}
              </div>
              {summary && <div style={{ fontSize: 12, color: intelText, marginBottom: 8, lineHeight: 1.7 }}>{summary}</div>}
              <div style={{ display: "flex", gap: 14, flexWrap: "wrap", fontSize: 11, color: intelSubtle, marginBottom: evReq.length > 0 ? 8 : 0 }}>
                {assets.length > 0 && <span><strong style={{ color: intelMuted }}>Assets:</strong> {assets.join(", ")}</span>}
                {confidence && <span><strong style={{ color: intelMuted }}>Confidence:</strong> {_confLabel(confidence)}</span>}
                {cv && <span><strong style={{ color: intelMuted }}>Control verification:</strong> {cv}</span>}
              </div>
              {evReq.length > 0 && (
                <div style={{ marginBottom: nonClaim ? 8 : 0 }}>
                  <div style={{ fontSize: 9, letterSpacing: "0.1em", color: intelSubtle, fontWeight: 700, marginBottom: 5 }}>EVIDENCE REQUIRED</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                    {evReq.map((ev, j) => (
                      <span key={j} style={{ fontSize: 10, color: gold, background: "rgba(212,175,55,0.07)", border: "1px solid rgba(212,175,55,0.2)", borderRadius: 3, padding: "3px 7px" }}>{ev}</span>
                    ))}
                  </div>
                </div>
              )}
              {nonClaim && (
                <div style={{ fontSize: 10, color: intelSubtle, fontStyle: "italic", borderTop: `1px solid ${intelSep}`, paddingTop: 7, marginTop: 6, lineHeight: 1.6 }}>{nonClaim}</div>
              )}
            </div>
          );
        })}
      </div>
      {receipts.length > SHOW_INITIAL && (
        <button
          onClick={() => setShowAll(!showAll)}
          style={{ marginTop: 10, fontSize: 11, color: intelSubtle, background: "rgba(148,163,184,0.07)", border: `1px solid rgba(148,163,184,0.2)`, borderRadius: 4, padding: "6px 14px", cursor: "pointer", width: "100%", letterSpacing: "0.05em" }}
        >
          {showAll ? `▲ Show first ${SHOW_INITIAL}` : `▼ Show all ${receipts.length} receipts (${receipts.length - SHOW_INITIAL} more)`}
        </button>
      )}
    </IntelCard>
  );
}

// ─── v6 Capability Inventory section ─────────────────────────────────────────

const _FAMILY_LABELS: Record<string, string> = {
  upgrade_control: "Upgrade Control",
  pause_control: "Pause Control",
  treasury_movement: "Treasury Movement",
  treasury_configuration: "Treasury Configuration",
  oracle_configuration: "Oracle Configuration",
  price_feed_control: "Price Feed Control",
  role_management: "Role Management",
  access_control: "Access Control",
  ownership_transfer: "Ownership Transfer",
  keeper_operator_control: "Keeper/Operator Control",
  routing_control: "Routing Control",
  settlement_control: "Settlement Control",
  reserve_configuration: "Reserve Configuration",
  fee_parameter_control: "Fee/Parameter Control",
  emergency_control: "Emergency Control",
  token_asset_control: "Token/Asset Control",
  governance_control: "Governance Control",
  unknown_authority: "Unknown Authority",
};

const _HIGH_ATTENTION: Set<string> = new Set([
  "upgrade_control", "treasury_movement", "emergency_control",
  "oracle_configuration", "role_management", "pause_control", "ownership_transfer",
]);

function _confLabel(c: string): string {
  if (c === "observed_from_abi") return "ABI-observed";
  if (c === "inferred_from_name") return "Name-inferred";
  if (c === "inferred_from_role") return "Role-inferred";
  if (c === "observed_from_finding") return "Finding";
  return c;
}

function CapabilityInventorySection({
  scanResponse,
  intelSubtle,
  intelText,
  intelMuted,
  intelSep,
  gold,
}: {
  scanResponse: RunScanResponse | null;
  intelSubtle: string;
  intelText: string;
  intelMuted: string;
  intelSep: string;
  gold: string;
}) {
  const capSummary = (
    scanResponse?.capabilitySummary ??
    ((scanResponse?.scanMetadata as Record<string, unknown>)?.capability_summary as CapabilitySummary | undefined)
  ) as CapabilitySummary | undefined;
  const capObs = (
    scanResponse?.capabilityObservations ??
    ((scanResponse?.scanMetadata as Record<string, unknown>)?.capability_observations as CapabilityObservation[] | undefined) ??
    []
  ) as CapabilityObservation[];
  const capMeta: CapabilityExtractionMeta | undefined = scanResponse?.scanMetadata?.capability_extraction as CapabilityExtractionMeta | undefined;

  const total = capSummary?.totalCapabilities ?? capSummary?.total_capabilities ?? 0;
  const abiObs = capMeta?.capabilitiesObservedFromAbi ?? capMeta?.capabilities_observed_from_abi ?? 0;
  const roleInferred = capMeta?.capabilitiesInferredFromRole ?? capMeta?.capabilities_inferred_from_role ?? 0;
  const byFamily = capSummary?.byFamily ?? capSummary?.by_family ?? {};
  const highAttn = capSummary?.highAttentionFamilies ?? capSummary?.high_attention_families ?? [];
  const evidenceLimits = capSummary?.evidenceLimits ?? capSummary?.evidence_limits ?? [];

  const CELL = { padding: "8px 10px", borderBottom: `1px solid ${intelSep}`, fontSize: 11 };

  return (
    <IntelCard title="10. CAPABILITY INVENTORY (v6 — INTERNAL)">
      <div style={{ marginBottom: 8, padding: "6px 10px", background: "rgba(212,175,55,0.07)", borderRadius: 4, border: `1px solid rgba(212,175,55,0.18)`, fontSize: 11, color: intelMuted }}>
        Capabilities are evidence gates for continuity and authority review - not findings or verified controls.
        Control verification status is not derived from ABI or source presence alone.
      </div>

      {total === 0 ? (
        <div style={{ fontSize: 12, color: intelSubtle, fontStyle: "italic" }}>
          No capability observations available. Run Scan / Refresh Intelligence.
        </div>
      ) : (
        <>
          {/* Summary row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 6, marginBottom: 14 }}>
            {[
              ["Total Capabilities", String(total)],
              ["ABI-Observed", String(abiObs)],
              ["Role-Inferred", String(roleInferred)],
              ["High-Attention Families", String(highAttn.length)],
            ].map(([label, val]) => (
              <div key={label} style={{ padding: "10px 12px", background: "rgba(255,255,255,0.025)", border: "1px solid rgba(148,163,184,0.07)", borderRadius: 5 }}>
                <div style={{ fontSize: 10, letterSpacing: "0.1em", color: intelSubtle, fontWeight: 700, marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: gold }}>{val}</div>
              </div>
            ))}
          </div>

          {/* Family breakdown */}
          {Object.keys(byFamily).length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 10, letterSpacing: "0.12em", color: intelSubtle, fontWeight: 700, marginBottom: 7 }}>BY FAMILY</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {Object.entries(byFamily).sort((a, b) => b[1] - a[1]).map(([fam, cnt]) => (
                  <div key={fam} style={{
                    padding: "4px 10px", borderRadius: 4, fontSize: 10, fontWeight: 600,
                    background: _HIGH_ATTENTION.has(fam) ? "rgba(239,68,68,0.12)" : "rgba(148,163,184,0.1)",
                    border: `1px solid ${_HIGH_ATTENTION.has(fam) ? "rgba(239,68,68,0.3)" : "rgba(148,163,184,0.2)"}`,
                    color: _HIGH_ATTENTION.has(fam) ? "#FCA5A5" : intelMuted,
                  }}>
                    {_FAMILY_LABELS[fam] ?? fam} ({cnt})
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Evidence limits */}
          {evidenceLimits.length > 0 && (
            <div style={{ marginBottom: 14, display: "grid", gap: 4 }}>
              {evidenceLimits.map((lim, i) => (
                <div key={i} style={{ fontSize: 11, color: intelSubtle, padding: "5px 10px", background: "rgba(234,179,8,0.05)", borderLeft: "2px solid rgba(234,179,8,0.3)", borderRadius: "0 4px 4px 0" }}>⚠ {lim}</div>
              ))}
            </div>
          )}

          {/* Capability table */}
          {capObs.length > 0 && (
            <div style={{ overflowX: "auto" }}>
              <div style={{ fontSize: 10, letterSpacing: "0.12em", color: intelSubtle, fontWeight: 700, marginBottom: 5 }}>
                CAPABILITY TABLE (showing up to 80)
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${intelSep}` }}>
                    {["Asset", "Family", "Function / Source", "Confidence", "Evidence Required", "Control Verification"].map((h) => (
                      <th key={h} style={{ ...CELL, textAlign: "left", fontWeight: 700, color: intelSubtle, letterSpacing: "0.08em" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {capObs.slice(0, 80).map((obs, i) => {
                    const fam = (obs.capabilityFamily ?? obs.capability_family ?? "") as string;
                    const funcName = obs.functionName ?? obs.function_name ?? obs.evidenceSource ?? obs.evidence_source ?? "—";
                    const conf = obs.confidence ?? "—";
                    const evReq = (obs.evidenceRequired ?? obs.evidence_required ?? []) as string[];
                    const cv = obs.controlVerification ?? obs.control_verification ?? "evidence_required";
                    return (
                      <tr key={i} style={{ background: i % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent" }}>
                        <td style={{ ...CELL, color: intelText }}>{obs.assetName ?? obs.asset_name ?? "—"}</td>
                        <td style={{ ...CELL, color: _HIGH_ATTENTION.has(fam) ? "#FCA5A5" : intelMuted, fontWeight: _HIGH_ATTENTION.has(fam) ? 700 : 400 }}>
                          {_FAMILY_LABELS[fam] ?? fam}
                        </td>
                        <td style={{ ...CELL, color: intelSubtle, fontFamily: "monospace", fontSize: 10 }}>{funcName}</td>
                        <td style={{ ...CELL, color: conf === "observed_from_abi" ? "#86EFAC" : intelSubtle }}>{_confLabel(conf)}</td>
                        <td style={{ ...CELL, color: intelSubtle }}>{evReq.slice(0, 2).join("; ") || "—"}{evReq.length > 2 ? "…" : ""}</td>
                        <td style={{ ...CELL, color: cv === "evidence_required" ? "#FCD34D" : intelSubtle }}>{cv}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {capObs.length > 80 && (
                <div style={{ fontSize: 10, color: intelSubtle, marginTop: 4 }}>
                  Showing 80 of {capObs.length} capability observations.
                </div>
              )}
            </div>
          )}
        </>
      )}
    </IntelCard>
  );
}

// ─── v6.3 Capability Priority Queue (internal, no-print) ─────────────────────

const TIER_LABEL: Record<string, string> = {
  urgent_evidence_gate: "URGENT GATE",
  high: "HIGH",
  medium: "MEDIUM",
  low: "LOW",
  blocked: "BLOCKED",
};

const TIER_COLOR: Record<string, string> = {
  urgent_evidence_gate: "#ef4444",
  high: "#f97316",
  medium: "#eab308",
  low: "#6b7280",
  blocked: "#64748b",
};

const TIER_BG: Record<string, string> = {
  urgent_evidence_gate: "rgba(239,68,68,0.12)",
  high: "rgba(249,115,22,0.1)",
  medium: "rgba(234,179,8,0.08)",
  low: "rgba(107,114,128,0.08)",
  blocked: "rgba(100,116,139,0.1)",
};

const EVIDENCE_STATE_LABEL: Record<string, string> = {
  abi_observed: "ABI observed",
  role_inferred: "Role inferred",
  unresolved: "Unresolved",
  blocked_by_source_verification: "Blocked by source/ABI",
  blocked_by_missing_evidence: "Blocked by evidence",
};

function TierBadge({ tier, intelSubtle }: { tier: string; intelSubtle: string }) {
  const color = TIER_COLOR[tier] ?? intelSubtle;
  const bg = TIER_BG[tier] ?? "rgba(148,163,184,0.08)";
  const label = TIER_LABEL[tier] ?? tier.toUpperCase();
  return (
    <span style={{
      display: "inline-block",
      fontSize: 9, fontWeight: 800, letterSpacing: "0.1em",
      color, background: bg,
      border: `1px solid ${color}44`,
      borderRadius: 3, padding: "3px 7px", whiteSpace: "nowrap",
    }}>
      {label}
    </span>
  );
}

function PriorityReasonsCell({
  reasons,
  intelSubtle,
  intelMuted,
}: {
  reasons: string[];
  intelSubtle: string;
  intelMuted: string;
}) {
  const [expanded, setExpanded] = useState(false);
  if (reasons.length === 0) return <span style={{ color: intelSubtle }}>—</span>;
  const visible = expanded ? reasons : reasons.slice(0, 2);
  return (
    <div style={{ fontSize: 10, lineHeight: 1.6 }}>
      <ul style={{ margin: 0, paddingLeft: 14, display: "grid", gap: 2 }}>
        {visible.map((r, i) => (
          <li key={i} style={{ color: intelMuted }}>{r}</li>
        ))}
      </ul>
      {reasons.length > 2 && (
        <button
          onClick={() => setExpanded(!expanded)}
          style={{ fontSize: 9, color: intelSubtle, background: "none", border: "none", cursor: "pointer", padding: "2px 0", letterSpacing: "0.05em" }}
        >
          {expanded ? "▲ show less" : `▼ +${reasons.length - 2} more`}
        </button>
      )}
    </div>
  );
}

function CapabilityPriorityQueueSection({
  scanResponse,
  intelSubtle,
  intelText,
  intelMuted,
  intelSep,
  gold,
}: {
  scanResponse: RunScanResponse | null;
  intelSubtle: string;
  intelText: string;
  intelMuted: string;
  intelSep: string;
  gold: string;
}) {
  const summary = (
    scanResponse?.capabilityPrioritySummary ??
    ((scanResponse?.scanMetadata as Record<string, unknown>)?.capability_priority_summary as CapabilityPrioritySummary | undefined)
  ) as CapabilityPrioritySummary | undefined;

  const items = (
    scanResponse?.capabilityPriorityItems ??
    ((scanResponse?.scanMetadata as Record<string, unknown>)?.capability_priority_items as CapabilityPriorityItem[] | undefined)
  ) as CapabilityPriorityItem[] | undefined ?? [];

  const total = summary?.totalPriorityItems ?? summary?.total_priority_items ?? summary?.totalItems ?? summary?.total_items ?? items.length;
  const urgentCount = summary?.urgentEvidenceGateCount ?? summary?.urgent_evidence_gate_count ?? summary?.urgentCount ?? summary?.urgent_count ?? 0;
  const highCount = summary?.highPriorityCount ?? summary?.high_priority_count ?? summary?.highCount ?? summary?.high_count ?? 0;
  const blockedCount = summary?.blockedCount ?? summary?.blocked_count ?? 0;
  const headline = summary?.narrativeHeadline ?? summary?.narrative_headline ?? ((summary as Record<string, unknown>)?.headline as string | undefined) ?? "";
  const nextGates = (summary?.nextEvidenceGates ?? summary?.next_evidence_gates ?? []) as string[];

  const byAsset = (summary?.byAsset ?? summary?.by_asset ?? {}) as Record<string, number>;
  const byFamily = (summary?.byCapabilityFamily ?? summary?.by_capability_family ?? {}) as Record<string, number>;
  const topAsset = Object.entries(byAsset).sort((a, b) => b[1] - a[1])[0];
  const topFamily = Object.entries(byFamily).sort((a, b) => b[1] - a[1])[0];
  const reasonList = (value: unknown): string[] => {
    if (Array.isArray(value)) return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
    if (typeof value === "string" && value.trim().length > 0) return [value];
    return [];
  };

  const CELL_PAD = { padding: "7px 8px", borderBottom: `1px solid ${intelSep}`, fontSize: 11, verticalAlign: "top" as const };

  return (
    <IntelCard title="CAPABILITY PRIORITY QUEUE (v6.3 — INTERNAL)">
      <div style={{ marginBottom: 12, padding: "8px 12px", background: "rgba(212,175,55,0.07)", borderRadius: 4, border: `1px solid rgba(212,175,55,0.18)`, fontSize: 11, color: intelMuted, lineHeight: 1.6 }}>
        Capability priorities rank evidence gates for operator review. They do not create findings or establish operating policy.
      </div>

      {total === 0 ? (
        <div style={{ fontSize: 12, color: intelSubtle, fontStyle: "italic" }}>
          No capability priority data yet. Run Scan / Refresh Intelligence to populate the priority queue.
        </div>
      ) : (
        <>
          {/* Summary cockpit cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: 8, marginBottom: 14 }}>
            {[
              { label: "Urgent Gates", value: urgentCount, color: TIER_COLOR.urgent_evidence_gate },
              { label: "High Priority", value: highCount, color: TIER_COLOR.high },
              { label: "Blocked", value: blockedCount, color: TIER_COLOR.blocked },
              { label: "Total Items", value: total, color: gold },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ padding: "10px 12px", background: "rgba(255,255,255,0.025)", border: `1px solid rgba(148,163,184,0.1)`, borderRadius: 5 }}>
                <div style={{ fontSize: 9, letterSpacing: "0.1em", color: intelSubtle, fontWeight: 700, marginBottom: 4 }}>{label.toUpperCase()}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
              </div>
            ))}
            {topAsset && (
              <div style={{ padding: "10px 12px", background: "rgba(255,255,255,0.025)", border: `1px solid rgba(148,163,184,0.1)`, borderRadius: 5 }}>
                <div style={{ fontSize: 9, letterSpacing: "0.1em", color: intelSubtle, fontWeight: 700, marginBottom: 4 }}>TOP ASSET</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: intelText, lineHeight: 1.3 }}>{topAsset[0]}</div>
                <div style={{ fontSize: 10, color: intelSubtle }}>{topAsset[1]} items</div>
              </div>
            )}
            {topFamily && (
              <div style={{ padding: "10px 12px", background: "rgba(255,255,255,0.025)", border: `1px solid rgba(148,163,184,0.1)`, borderRadius: 5 }}>
                <div style={{ fontSize: 9, letterSpacing: "0.1em", color: intelSubtle, fontWeight: 700, marginBottom: 4 }}>TOP FAMILY</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: intelText, lineHeight: 1.3 }}>{(_FAMILY_LABELS[topFamily[0]] ?? topFamily[0]).replace(/_/g, " ")}</div>
                <div style={{ fontSize: 10, color: intelSubtle }}>{topFamily[1]} items</div>
              </div>
            )}
          </div>

          {/* Headline */}
          {headline && (
            <div style={{ fontSize: 13, fontWeight: 700, color: intelText, marginBottom: 12, lineHeight: 1.5, padding: "8px 12px", background: "rgba(255,255,255,0.03)", borderRadius: 4, borderLeft: `3px solid ${gold}` }}>
              {headline}
            </div>
          )}

          {/* Next evidence gates checklist */}
          {nextGates.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 10, letterSpacing: "0.12em", color: intelSubtle, fontWeight: 700, marginBottom: 6 }}>TOP NEXT EVIDENCE GATES</div>
              <div style={{ display: "grid", gap: 4 }}>
                {nextGates.map((gate, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 11, color: intelMuted, lineHeight: 1.6, padding: "5px 10px", background: "rgba(212,175,55,0.04)", borderLeft: `2px solid ${gold}44`, borderRadius: "0 4px 4px 0" }}>
                    <span style={{ color: gold, fontWeight: 700, marginTop: 1, flexShrink: 0 }}>☐</span>
                    <span>{gate}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Priority table */}
          <div style={{ overflowX: "auto" }}>
            <div style={{ fontSize: 10, letterSpacing: "0.12em", color: intelSubtle, fontWeight: 700, marginBottom: 5 }}>
              PRIORITY TABLE (top {Math.min(items.length, 25)} of {items.length})
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${intelSep}` }}>
                  {["Tier", "Score", "Asset", "Capability", "Control", "Evidence State", "Why It Matters", "Next Step"].map((h) => (
                    <th key={h} style={{ textAlign: "left", padding: "5px 8px", color: intelSubtle, fontWeight: 700, fontSize: 10, letterSpacing: "0.08em", whiteSpace: "nowrap" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.slice(0, 25).map((item, idx) => {
                  const tier = (item.priorityTier ?? item.priority_tier ?? "low") as string;
                  const score = item.priorityScore ?? item.priority_score ?? 0;
                  const assetName = item.assetName ?? item.asset_name ?? "—";
                  const family = (_FAMILY_LABELS[(item.capabilityFamily ?? item.capability_family ?? "") as string] ?? (item.capabilityFamily ?? item.capability_family ?? "—")) as string;
                  const control = item.controlTitle ?? item.control_title ?? "—";
                  const evState = (item.evidenceState ?? item.evidence_state ?? "") as string;
                  const nextStep = item.nextStep ?? item.next_step ?? item.nextEvidenceStep ?? item.next_evidence_step ?? "—";
                  const reasons = reasonList(item.priorityReasons ?? item.priority_reasons ?? item.priorityReasoning ?? item.priority_reasoning);
                  const stateLabel = EVIDENCE_STATE_LABEL[evState] ?? evState;
                  const isBlocked = evState.startsWith("blocked");

                  return (
                    <tr key={item.priorityId ?? item.priority_id ?? item.priorityItemId ?? item.priority_item_id ?? idx} style={{ background: idx % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent" }}>
                      <td style={{ ...CELL_PAD, whiteSpace: "nowrap" }}>
                        <TierBadge tier={tier} intelSubtle={intelSubtle} />
                      </td>
                      <td style={{ ...CELL_PAD, color: intelMuted, fontWeight: 700, whiteSpace: "nowrap" }}>
                        {score}
                      </td>
                      <td style={{ ...CELL_PAD, color: intelText, whiteSpace: "nowrap" }}>
                        {assetName}
                      </td>
                      <td style={{ ...CELL_PAD, color: intelSubtle, fontSize: 10 }}>
                        {family}
                      </td>
                      <td style={{ ...CELL_PAD, color: intelMuted, maxWidth: 160 }}>
                        {control}
                      </td>
                      <td style={{ ...CELL_PAD, whiteSpace: "nowrap" }}>
                        {isBlocked ? (
                          <span style={{ fontSize: 10, fontWeight: 600, color: TIER_COLOR.blocked, background: TIER_BG.blocked, border: `1px solid ${TIER_COLOR.blocked}44`, borderRadius: 3, padding: "2px 6px" }}>
                            {stateLabel}
                          </span>
                        ) : (
                          <span style={{ fontSize: 10, color: intelMuted }}>{stateLabel}</span>
                        )}
                      </td>
                      <td style={{ ...CELL_PAD, maxWidth: 200 }}>
                        <PriorityReasonsCell reasons={reasons} intelSubtle={intelSubtle} intelMuted={intelMuted} />
                      </td>
                      <td style={{ ...CELL_PAD, color: intelMuted, maxWidth: 200, fontSize: 10, lineHeight: 1.5 }}>
                        {nextStep}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {items.length > 25 && (
              <div style={{ fontSize: 10, color: intelMuted, marginTop: 6, fontStyle: "italic" }}>
                Showing top 25 of {items.length} priority items.
              </div>
            )}
          </div>
        </>
      )}
    </IntelCard>
  );
}

// ─── v6.2 Capability-to-Control Mapping Panel (internal, no-print) ───────────
function CapabilityControlMappingSection({
  scanResponse,
  intelSubtle,
  intelText,
  intelMuted,
  intelSep,
  gold,
}: {
  scanResponse: RunScanResponse | null;
  intelSubtle: string;
  intelText: string;
  intelMuted: string;
  intelSep: string;
  gold: string;
}) {
  const rawMappings = (
    (scanResponse?.capabilityControlMappings ??
      (scanResponse?.scanMetadata as Record<string, unknown>)?.capability_control_mappings) ?? []
  ) as CapabilityControlMapping[];

  const ccSummary = (
    (scanResponse?.capabilityControlSummary ??
      (scanResponse?.scanMetadata as Record<string, unknown>)?.capability_control_summary) ?? {}
  ) as CapabilityControlSummary;

  const total = ccSummary.totalMappings ?? ccSummary.total_mappings ?? rawMappings.length;
  const highCount = ccSummary.highPriorityMappings ?? ccSummary.high_priority_mappings ?? 0;
  const mappedFamilies = ccSummary.mappedCapabilityFamilies ?? ccSummary.mapped_capability_families ?? [];
  const assetNames = ccSummary.assetsWithMappedControls ?? ccSummary.assets_with_mapped_controls ?? [];
  const evidenceLimits = (ccSummary.evidenceLimits ?? ccSummary.evidence_limits ?? []) as string[];

  const PRIORITY_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2 };

  const ccMappings = [...rawMappings].sort((a, b) => {
    const pa = PRIORITY_ORDER[a.priority ?? "low"] ?? 2;
    const pb = PRIORITY_ORDER[b.priority ?? "low"] ?? 2;
    if (pa !== pb) return pa - pb;
    const an = (a.assetName ?? a.asset_name ?? "").toLowerCase();
    const bn = (b.assetName ?? b.asset_name ?? "").toLowerCase();
    if (an !== bn) return an.localeCompare(bn);
    const af = (a.capabilityFamily ?? a.capability_family ?? "").toLowerCase();
    const bf = (b.capabilityFamily ?? b.capability_family ?? "").toLowerCase();
    return af.localeCompare(bf);
  });

  const CELL = { padding: "7px 10px", borderBottom: `1px solid ${intelSep}`, fontSize: 11, verticalAlign: "top" as const };

  const _priority_badge = (p: string) => {
    const color = p === "high" ? "#FCA5A5" : p === "medium" ? "#FCD34D" : intelMuted;
    const bg = p === "high" ? "rgba(252,165,165,0.1)" : p === "medium" ? "rgba(252,211,77,0.08)" : "rgba(148,163,184,0.07)";
    return (
      <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.08em", color, background: bg, border: `1px solid ${color}44`, borderRadius: 3, padding: "2px 6px" }}>
        {p.toUpperCase()}
      </span>
    );
  };

  const _verif_color = (v: string) =>
    v === "evidence_required" ? "#FCD34D" : v === "missing" ? "#FCA5A5" : intelMuted;

  return (
    <IntelCard title="CAPABILITY-TO-CONTROL MAPPING (v6.2 — INTERNAL)">
      <div style={{ marginBottom: 12, padding: "8px 12px", background: "rgba(212,175,55,0.07)", borderRadius: 4, border: `1px solid rgba(212,175,55,0.18)`, fontSize: 11, color: intelMuted, lineHeight: 1.6 }}>
        Capability-to-policy mappings are evidence gates. They do not establish operating policy or create findings.
      </div>

      {total === 0 ? (
        <div style={{ fontSize: 12, color: intelSubtle, fontStyle: "italic" }}>
          No capability-control mappings yet. Run Scan / Refresh Intelligence to generate mappings.
        </div>
      ) : (
        <>
          {/* Summary KPIs */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 8, marginBottom: 14 }}>
            {[
              { label: "Total Mappings", value: total, color: gold },
              { label: "High Priority", value: highCount, color: "#FCA5A5" },
              { label: "Mapped Families", value: mappedFamilies.length, color: gold },
              { label: "Assets Covered", value: assetNames.length, color: gold },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ padding: "10px 12px", background: "rgba(255,255,255,0.025)", border: "1px solid rgba(148,163,184,0.08)", borderRadius: 5 }}>
                <div style={{ fontSize: 10, letterSpacing: "0.1em", color: intelSubtle, fontWeight: 700, marginBottom: 4 }}>{label.toUpperCase()}</div>
                <div style={{ fontSize: 20, fontWeight: 700, color }}>{value}</div>
              </div>
            ))}
          </div>

          {/* Evidence limits */}
          {evidenceLimits.length > 0 && (
            <div style={{ marginBottom: 12, display: "grid", gap: 4 }}>
              {evidenceLimits.map((lim, i) => (
                <div key={i} style={{ fontSize: 11, color: intelSubtle, padding: "5px 10px", background: "rgba(234,179,8,0.05)", borderLeft: "2px solid rgba(234,179,8,0.3)", borderRadius: "0 4px 4px 0" }}>⚠ {lim}</div>
              ))}
            </div>
          )}

          {/* Mapping table — sorted: high priority → asset name → capability family */}
          <div style={{ overflowX: "auto" }}>
            <div style={{ fontSize: 10, letterSpacing: "0.12em", color: intelSubtle, fontWeight: 700, marginBottom: 5 }}>
              MAPPING TABLE — sorted by priority, then asset (showing up to 80)
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${intelSep}` }}>
                  {["Asset", "Capability", "Control", "Priority", "Verification", "Evidence Required"].map((h) => (
                    <th key={h} style={{ ...CELL, textAlign: "left", fontWeight: 700, color: intelSubtle, letterSpacing: "0.08em", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ccMappings.slice(0, 80).map((m, i) => {
                  const fam = (_FAMILY_LABELS[(m.capabilityFamily ?? m.capability_family ?? "") as string] ?? (m.capabilityFamily ?? m.capability_family ?? "—")) as string;
                  const title = m.controlTitle ?? m.control_title ?? "—";
                  const priority = (m.priority ?? "medium") as string;
                  const verif = (m.controlVerification ?? m.control_verification ?? "evidence_required") as string;
                  const evReq = (m.evidenceRequired ?? m.evidence_required ?? []) as string[];
                  return (
                    <tr key={i} style={{ background: i % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent" }}>
                      <td style={{ ...CELL, color: intelText, whiteSpace: "nowrap" }}>{m.assetName ?? m.asset_name ?? "—"}</td>
                      <td style={{ ...CELL, color: intelSubtle, fontSize: 10 }}>{fam}</td>
                      <td style={{ ...CELL, color: intelText, maxWidth: 200 }}>{title}</td>
                      <td style={{ ...CELL }}>{_priority_badge(priority)}</td>
                      <td style={{ ...CELL, color: _verif_color(verif), fontSize: 10 }}>{verif}</td>
                      <td style={{ ...CELL, color: intelSubtle, fontSize: 10 }}>{evReq.slice(0, 2).join("; ") || "—"}{evReq.length > 2 ? "…" : ""}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {ccMappings.length > 80 && (
              <div style={{ fontSize: 10, color: intelSubtle, marginTop: 4 }}>
                Showing 80 of {ccMappings.length} mappings.
              </div>
            )}
          </div>
        </>
      )}
    </IntelCard>
  );
}

// ─── Shared small components ─────────────────────────────────────────────────
type EvidenceRequestSource = "Priority" | "Narrative" | "Mapping" | "Capability";
type EvidenceChecklistRow = { text: string; source: EvidenceRequestSource; key: string; specificity: number };
type EvidenceLimitNoteRow = { text: string; source: EvidenceRequestSource; key: string };

const EVIDENCE_REQUEST_LABELS = {
  source_abi_access: "Submit verified source/ABI or configure explorer access to unblock role-inferred evidence gates.",
  treasury_authorization: "Provide treasury movement authorization evidence.",
  oracle_policy: "Provide oracle configuration, fallback, and stale-price policy evidence.",
  signer_policy: "Provide shared owner signer custody policy.",
  key_rotation: "Provide key rotation and emergency replacement procedure.",
  role_matrix: "Provide role matrix and signer/operator rotation procedure.",
  pause_emergency_upgrade: "Provide pause, emergency, and upgrade policy evidence where applicable.",
  governance_multisig: "Provide multisig, timelock, or governance evidence where applicable.",
  settlement_routing_reserve: "Provide settlement, routing, and reserve policy evidence where applicable.",
} as const;

type EvidenceRequestClass = keyof typeof EVIDENCE_REQUEST_LABELS;

function normalizeEvidenceRequest(text: string): string {
  let normalized = text
    .toLowerCase()
    .trim()
    .replace(/[.!?;:]+$/g, "")
    .replace(/\s+/g, " ");

  if (/\b(source|verified source|source code|contract source)\b/.test(normalized) && /\babi\b/.test(normalized)) {
    normalized = normalized
      .replace(/\bsubmit verified source\/abi or configure explorer access(?: to unblock role-inferred evidence gates)?\b/g, "source abi access")
      .replace(/\bsubmit source\/abi or configure explorer access(?: to unblock role-inferred evidence gates)?\b/g, "source abi access")
      .replace(/\brequest source\/abi\b/g, "source abi access")
      .replace(/\bverified source\/abi\b/g, "source abi access")
      .replace(/\bsource\/abi\b/g, "source abi access");
  }

  return normalized.replace(/\s+/g, " ").trim();
}

function evidenceLimitNoteKey(text: string): string {
  return text.toLowerCase().trim().replace(/[.!?;:]+$/g, "").replace(/\s+/g, " ");
}

function classifyEvidenceRequest(text: string): EvidenceRequestClass | null {
  const normalized = normalizeEvidenceRequest(text);
  const hasAny = (...terms: string[]) => terms.some((term) => normalized.includes(term));

  if (normalized.includes("source abi access") || (hasAny("source", "abi") && hasAny("explorer access"))) {
    return "source_abi_access";
  }
  if (hasAny("treasury movement authorization", "treasury authorization")) {
    return "treasury_authorization";
  }
  if (hasAny("oracle") && hasAny("configuration", "fallback", "stale-price", "stale price", "price policy")) {
    return "oracle_policy";
  }
  if (hasAny("signer custody", "owner signer custody", "shared owner signer")) {
    return "signer_policy";
  }
  if (hasAny("key rotation", "emergency replacement")) {
    return "key_rotation";
  }
  if (hasAny("role matrix", "signer/operator rotation", "signer rotation", "operator rotation")) {
    return "role_matrix";
  }
  if (hasAny("pause", "emergency", "upgrade") && hasAny("policy", "evidence")) {
    return "pause_emergency_upgrade";
  }
  if (hasAny("multisig", "timelock", "governance") && hasAny("evidence", "policy")) {
    return "governance_multisig";
  }
  if (hasAny("settlement", "routing", "reserve") && hasAny("policy", "evidence", "authorization")) {
    return "settlement_routing_reserve";
  }

  return null;
}

function isEvidenceLimitNote(text: string): boolean {
  const normalized = normalizeEvidenceRequest(text);
  return [
    "does not establish operating policy",
    "not verified controls",
    "evidence gates, not",
    "role-inferred mappings require",
    "role-inferred priorities require",
    "review items remain incomplete",
    "blocked items need",
    "does not prove",
    "does not claim",
    "not exploit",
    "not vulnerability",
    "not safe",
    "not certified",
    "graph/capability evidence does not establish operating policy",
  ].some((phrase) => normalized.includes(phrase));
}

function isEvidenceRequestAction(text: string): boolean {
  const normalized = normalizeEvidenceRequest(text);
  if (!normalized || isEvidenceLimitNote(text)) return false;
  if (classifyEvidenceRequest(text)) return true;
  return /^\b(submit|configure|provide|document|request)\b/.test(normalized) &&
    /\b(evidence|source|abi|access|policy|procedure|matrix|path|authorization)\b/.test(normalized);
}

function evidenceRequestSpecificity(text: string, requestClass: EvidenceRequestClass | null): number {
  let score = text.length;
  if (requestClass) score += 1000;
  if (/to unblock role-inferred evidence gates/i.test(text)) score += 500;
  if (/where applicable/i.test(text)) score += 50;
  return score;
}

function displayEvidenceRequestText(text: string, requestClass: EvidenceRequestClass | null): string {
  return requestClass ? EVIDENCE_REQUEST_LABELS[requestClass] : text.trim().replace(/\s+/g, " ");
}

function EvidenceRequestChecklistSection({
  scanResponse,
  intelSubtle,
  intelText,
  intelMuted,
  intelSep,
  gold,
}: {
  scanResponse: RunScanResponse | null;
  intelSubtle: string;
  intelText: string;
  intelMuted: string;
  intelSep: string;
  gold: string;
}) {
  const prioritySummary = (
    scanResponse?.capabilityPrioritySummary ??
    ((scanResponse?.scanMetadata as Record<string, unknown>)?.capability_priority_summary as CapabilityPrioritySummary | undefined)
  ) as CapabilityPrioritySummary | undefined;
  const narrative = (
    scanResponse?.capabilityNarrativeSummary ??
    ((scanResponse?.scanMetadata as Record<string, unknown>)?.capability_narrative_summary as CapabilityNarrativeSummary | undefined)
  ) as CapabilityNarrativeSummary | undefined;
  const controlSummary = (
    scanResponse?.capabilityControlSummary ??
    ((scanResponse?.scanMetadata as Record<string, unknown>)?.capability_control_summary as CapabilityControlSummary | undefined)
  ) as CapabilityControlSummary | undefined;
  const priorityItems = (
    scanResponse?.capabilityPriorityItems ??
    ((scanResponse?.scanMetadata as Record<string, unknown>)?.capability_priority_items as CapabilityPriorityItem[] | undefined) ??
    prioritySummary?.topPriorityItems ??
    prioritySummary?.top_priority_items ??
    []
  ) as CapabilityPriorityItem[];
  const controlMappings = (
    scanResponse?.capabilityControlMappings ??
    ((scanResponse?.scanMetadata as Record<string, unknown>)?.capability_control_mappings as CapabilityControlMapping[] | undefined) ??
    []
  ) as CapabilityControlMapping[];
  const capabilitySummary = (
    scanResponse?.capabilitySummary ??
    ((scanResponse?.scanMetadata as Record<string, unknown>)?.capability_summary as CapabilitySummary | undefined)
  ) as CapabilitySummary | undefined;

  const asStrings = (value: unknown): string[] =>
    Array.isArray(value)
      ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
      : [];

  const actionRows: EvidenceChecklistRow[] = [];
  const noteRows: EvidenceLimitNoteRow[] = [];
  const actionIndexes = new Map<string, number>();
  const noteKeys = new Set<string>();

  function addAction(text: string, source: EvidenceRequestSource) {
    const requestClass = classifyEvidenceRequest(text);
    const key = requestClass ?? normalizeEvidenceRequest(text);
    const displayText = displayEvidenceRequestText(text, requestClass);
    const specificity = evidenceRequestSpecificity(displayText, requestClass);
    const existingIndex = actionIndexes.get(key);

    if (existingIndex === undefined) {
      actionIndexes.set(key, actionRows.length);
      actionRows.push({ text: displayText, source, key, specificity });
      return;
    }

    const existing = actionRows[existingIndex];
    if (specificity > existing.specificity) {
      actionRows[existingIndex] = { text: displayText, source, key, specificity };
    }
  }

  function addNote(text: string, source: EvidenceRequestSource) {
    const cleanText = text.trim().replace(/\s+/g, " ");
    const key = evidenceLimitNoteKey(cleanText);
    if (!cleanText || noteKeys.has(key)) return;
    noteKeys.add(key);
    noteRows.push({ text: cleanText, source, key });
  }

  function addRows(values: string[], source: EvidenceRequestSource) {
    for (const raw of values) {
      const text = raw.trim();
      if (!text) continue;
      if (isEvidenceLimitNote(text)) {
        addNote(text, source);
      } else if (isEvidenceRequestAction(text)) {
        addAction(text, source);
      }
    }
  }

  addRows(asStrings(prioritySummary?.nextEvidenceGates ?? prioritySummary?.next_evidence_gates), "Priority");
  addRows(asStrings(prioritySummary?.evidenceLimits ?? prioritySummary?.evidence_limits), "Priority");
  priorityItems.forEach((item) => {
    addRows(asStrings(item.evidenceRequired ?? item.evidence_required), "Priority");
    addRows(asStrings([item.nextEvidenceStep ?? item.next_evidence_step ?? item.nextStep ?? item.next_step].filter(Boolean)), "Priority");
  });
  addRows(asStrings(narrative?.nextEvidenceGates ?? narrative?.next_evidence_gates), "Narrative");
  addRows(asStrings(narrative?.evidenceLimits ?? narrative?.evidence_limits), "Narrative");
  addRows(asStrings(narrative?.nonClaims ?? narrative?.non_claims), "Narrative");
  addRows(asStrings(controlSummary?.evidenceLimits ?? controlSummary?.evidence_limits), "Mapping");
  controlMappings.forEach((mapping) => {
    addRows(asStrings(mapping.evidenceRequired ?? mapping.evidence_required), "Mapping");
  });
  addRows(asStrings(capabilitySummary?.evidenceLimits ?? capabilitySummary?.evidence_limits), "Capability");

  const visibleActions = actionRows.slice(0, 8);
  const visibleNotes = noteRows.slice(0, 6);

  return (
    <IntelCard title="EVIDENCE REQUEST CHECKLIST (v6.4b - INTERNAL)">
      <div style={{ marginBottom: 12, padding: "8px 12px", background: "rgba(212,175,55,0.07)", borderRadius: 4, border: `1px solid rgba(212,175,55,0.18)`, fontSize: 11, color: intelMuted, lineHeight: 1.6 }}>
        Concrete evidence requests generated from priority, capability, and control mapping data.
      </div>

      {visibleActions.length === 0 ? (
        <div style={{ fontSize: 12, color: intelSubtle, fontStyle: "italic" }}>
          No concrete evidence requests generated yet. Run Scan / Refresh Intelligence.
        </div>
      ) : (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
            <span style={{ fontSize: 10, letterSpacing: "0.1em", color: gold, fontWeight: 800 }}>
              {actionRows.length} ACTION REQUEST{actionRows.length !== 1 ? "S" : ""}
            </span>
            <span style={{ fontSize: 10, color: intelSubtle }}>
              showing {visibleActions.length}
            </span>
          </div>
          <div style={{ display: "grid", gap: 6 }}>
            {visibleActions.map((row, i) => (
              <div key={`${row.key}-${row.source}-${i}`} style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "8px 10px", background: "rgba(255,255,255,0.025)", border: `1px solid ${intelSep}`, borderRadius: 5 }}>
                <span style={{ color: gold, fontWeight: 800, fontSize: 11, lineHeight: 1.5, flexShrink: 0 }}>{i + 1}.</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, color: intelText, lineHeight: 1.55 }}>{row.text}</div>
                  <div style={{ marginTop: 4, fontSize: 9, letterSpacing: "0.1em", color: intelSubtle, fontWeight: 700 }}>{row.source.toUpperCase()} EVIDENCE GATE</div>
                </div>
              </div>
            ))}
          </div>
          {actionRows.length > visibleActions.length && (
            <div style={{ fontSize: 10, color: intelSubtle, marginTop: 8 }}>
              Showing first {visibleActions.length} of {actionRows.length} evidence requests.
            </div>
          )}
        </>
      )}

      <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${intelSep}` }}>
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 11, letterSpacing: "0.11em", color: gold, fontWeight: 800 }}>
            EVIDENCE LIMITS / INTERPRETATION NOTES
          </div>
          <div style={{ marginTop: 3, fontSize: 11, color: intelMuted, lineHeight: 1.5 }}>
            Methodology notes that explain how to interpret the checklist.
          </div>
        </div>

        {visibleNotes.length === 0 ? (
          <div style={{ fontSize: 12, color: intelSubtle, fontStyle: "italic" }}>
            No interpretation notes generated.
          </div>
        ) : (
          <>
            <div style={{ fontSize: 10, letterSpacing: "0.1em", color: intelSubtle, fontWeight: 800, marginBottom: 8 }}>
              {noteRows.length} NOTE{noteRows.length !== 1 ? "S" : ""}
            </div>
            <div style={{ display: "grid", gap: 6 }}>
              {visibleNotes.map((row, i) => (
                <div key={`${row.key}-${row.source}-${i}`} style={{ padding: "7px 10px", background: "rgba(148,163,184,0.04)", border: `1px solid ${intelSep}`, borderRadius: 5 }}>
                  <div style={{ fontSize: 11, color: intelMuted, lineHeight: 1.55 }}>{row.text}</div>
                  <div style={{ marginTop: 4, fontSize: 9, letterSpacing: "0.1em", color: intelSubtle, fontWeight: 700 }}>{row.source.toUpperCase()} NOTE</div>
                </div>
              ))}
            </div>
            {noteRows.length > visibleNotes.length && (
              <div style={{ fontSize: 10, color: intelSubtle, marginTop: 8 }}>
                Showing first {visibleNotes.length} of {noteRows.length} interpretation notes.
              </div>
            )}
          </>
        )}
      </div>
    </IntelCard>
  );
}

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

function FindingRow({
  finding,
  assets,
  candidates,
  sourceSummaryByAsset,
  hasSharedOwnerFinding = false,
}: {
  finding: AdminSurfaceFinding;
  assets: ProjectAsset[];
  candidates: NonNullable<DefenseReview["customerDiscoveredCandidateAssets"]>;
  sourceSummaryByAsset: Map<string, import("@/lib/defense-review/types").CustomerDetectorEvidence>;
  hasSharedOwnerFinding?: boolean;
}) {
  const color = SEV_COLOR[finding.severity];
  const evidenceRequired = _reportEvidenceRequired(finding);
  const remediation = _reportRemediation(finding, hasSharedOwnerFinding);
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
  const ownerTypeLabel = finding.evidence?.ownerTypeLabel as string | undefined;
  const ownerTypeDetectionMethod = finding.evidence?.ownerTypeDetectionMethod as string | undefined;
  const ownerTypeEvidence = finding.evidence?.ownerTypeEvidence as string | undefined;
  const ownerControlModelSummary = (finding.evidence?.ownerControlModelSummary ?? finding.evidence?.owner_control_model_summary) as string | undefined;
  const sourceVerification = sourceSummaryForFinding(finding, assets, sourceSummaryByAsset);
  const sourceStatusDistribution = finding.evidence?.sourceStatusDistribution as Record<string, unknown> | undefined;
  const sourceVerificationSummary = (finding.evidence?.sourceVerificationSummary ?? finding.evidence?.source_verification_summary) as string | undefined;
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
  const controlVerification = finding.evidence?.controlVerification as string | undefined;
  const adminOwnerStatus = finding.evidence?.adminOwnerStatus as string | undefined;
  const notes = finding.evidence?.notes;
  const noteLines = Array.isArray(notes) ? notes.filter((item): item is string => typeof item === "string" && item.length > 0) : [];
  const isConcentration = finding.findingType === "role_concentration";
  const groupedAssetCount = finding.evidence?.assetCount as number | undefined;
  const groupedAssetNames = finding.evidence?.resolvedAssets as string[] | undefined;
  const isGroupedOwner = finding.findingType === "owner_detected" && !!groupedAssetCount && groupedAssetCount > 1;
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
  const findingAsset = finding.assetId ? assets.find((asset) => asset.id === finding.assetId) : undefined;
  const title = reportAssetText(finding.title, findingAsset, candidates);
  const summary = reportAssetText(finding.summary, findingAsset, candidates);

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
        <span style={{ fontSize: 13, fontWeight: 600, color: TEXT }}>{title}</span>
      </div>
      <p style={{ margin: "0 0 6px 0", fontSize: 12, color: MUTED, lineHeight: 1.5 }}>
        {summary}
      </p>
      {finding.findingType === "owner_detected" && (
        <p style={{ margin: "0 0 7px 0", fontSize: 11, color: SUBTLE, fontWeight: 600, lineHeight: 1.5 }}>
          {hasSharedOwnerFinding
            ? "Supporting evidence for the shared-owner concentration analysis; retained as an evidence receipt, not a separate analytical risk."
            : "Supporting evidence for the observed owner/admin model; retained as an evidence receipt, not a separate analytical risk."}
        </p>
      )}

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
              {ownerTypeLabel && (
                <li style={{ fontSize: 11, color: SUBTLE, lineHeight: 1.5 }}>
                  Owner Type: {ownerTypeLabel}
                </li>
              )}
              {ownerTypeDetectionMethod && (
                <li style={{ fontSize: 11, color: SUBTLE, lineHeight: 1.5 }}>
                  Owner Type Detection Method: {ownerTypeDetectionMethod}
                </li>
              )}
              {ownerTypeEvidence && (
                <li style={{ fontSize: 11, color: SUBTLE, lineHeight: 1.5 }}>
                  Owner Type Evidence: {ownerTypeEvidence}
                </li>
              )}
              {ownerControlModelSummary && (
                <li style={{ fontSize: 11, color: SUBTLE, lineHeight: 1.5 }}>
                  Owner Authority Model: {ownerControlModelSummary}
                </li>
              )}
              {ownerEvidenceConfidence && (
                <li style={{ fontSize: 11, color: SUBTLE, lineHeight: 1.5 }}>
                  Owner Evidence Confidence: {ownerEvidenceConfidence}
                </li>
              )}
              {controlVerification && (
                <li style={{ fontSize: 11, color: SUBTLE, lineHeight: 1.5 }}>
                  Evidence State: {controlVerification}
                </li>
              )}
            </>
          ) : isGroupedOwner ? (
            <>
              <li style={{ fontSize: 11, color: SUBTLE, lineHeight: 1.5 }}>
                Assets Resolved: {groupedAssetCount}
              </li>
              <li style={{ fontSize: 11, color: SUBTLE, lineHeight: 1.5 }}>
                Mapped Contracts: {(groupedAssetNames ?? []).join(", ") || <em>Not provided</em>}
              </li>
            </>
          ) : (
            <li style={{ fontSize: 11, color: SUBTLE, lineHeight: 1.5 }}>
              Representative Contract: {assetAddr ?? <em>Not provided</em>}
            </li>
          )}
          {detectionMethod && (
            <li style={{ fontSize: 11, color: SUBTLE, lineHeight: 1.5 }}>
              Detection Method: {detectionMethod}
            </li>
          )}
          {!isConcentration && ownerTypeLabel && (
            <li style={{ fontSize: 11, color: SUBTLE, lineHeight: 1.5 }}>
              Owner Type: {ownerTypeLabel}
            </li>
          )}
          {!isConcentration && ownerTypeDetectionMethod && (
            <li style={{ fontSize: 11, color: SUBTLE, lineHeight: 1.5 }}>
              Owner Type Detection Method: {ownerTypeDetectionMethod}
            </li>
          )}
          {!isConcentration && ownerTypeEvidence && (
            <li style={{ fontSize: 11, color: SUBTLE, lineHeight: 1.5 }}>
              Owner Type Evidence: {ownerTypeEvidence}
            </li>
          )}
          {!isConcentration && ownerControlModelSummary && (
            <li style={{ fontSize: 11, color: SUBTLE, lineHeight: 1.5 }}>
              Owner Authority Model: {ownerControlModelSummary}
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
          {sourceVerificationStatus && (
            <li style={{ fontSize: 11, color: SUBTLE, lineHeight: 1.5 }}>
              Source Verification: {sourceVerificationStatus}
            </li>
          )}
          {sourceExplorer && (
            <li style={{ fontSize: 11, color: SUBTLE, lineHeight: 1.5 }}>
              Explorer: {sourceExplorer}
            </li>
          )}
          {sourceVerification && (
            <>
              <li style={{ fontSize: 11, color: SUBTLE, lineHeight: 1.5 }}>
                ABI Status: {sourceAbiStatus ?? boolLabel(sourceAbiAvailable)}
              </li>
              <li style={{ fontSize: 11, color: SUBTLE, lineHeight: 1.5 }}>
                Source Status: {sourceStatus ?? boolLabel(sourceAvailable)}
              </li>
              <li style={{ fontSize: 11, color: SUBTLE, lineHeight: 1.5 }}>
                Proxy Detected: {boolLabel(sourceProxyDetected)}
              </li>
            </>
          )}
          {sourceImplementation && (
            <li style={{ fontSize: 11, color: SUBTLE, lineHeight: 1.5 }}>
              Implementation: {sourceImplementation}
            </li>
          )}
          {sourceVerificationSummary && (
            <li style={{ fontSize: 11, color: SUBTLE, lineHeight: 1.5 }}>
              Source Verification Summary: {sourceVerificationSummary}
            </li>
          )}
          {sourceStatusDistribution && (
            <li style={{ fontSize: 11, color: SUBTLE, lineHeight: 1.5 }}>
              Source Status Distribution: {sourceStatusDistributionLabel(sourceStatusDistribution)}
            </li>
          )}
          {sourceNoteLines.slice(0, 2).map((note, i) => (
            <li key={`source-note-${i}`} style={{ fontSize: 11, color: SUBTLE, lineHeight: 1.5 }}>
              Verification Notes: {note}
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
          Evidence Status: Reviewed
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
