import type {
  CustomerDetectorEvidence,
  CustomerTimelockCanonicalization,
  DefenseReview,
  DiscoveredCandidateAsset,
} from "./types";
import type { AdminSurfaceFinding, ProjectAsset } from "@/lib/project-map/types";

export function candidateDisplayName(candidate: DiscoveredCandidateAsset): string {
  return candidate.display_name ?? candidate.suggested_name ?? candidate.suggested_role ?? "Connected contract";
}

export function reportAssetDisplayName(
  asset: ProjectAsset,
  candidates: DiscoveredCandidateAsset[],
  canonicalizations: CustomerTimelockCanonicalization[] = [],
): string {
  const candidate = candidates.find((row) => row.imported_asset_id === asset.id);
  const baseName = candidate ? candidateDisplayName(candidate) : asset.name;
  return canonicalizations.some((row) => row.provenance_asset_ids.includes(asset.id))
    ? `${baseName} - linked/provenance`
    : baseName;
}

export function reportAssetCanonicalStatus(
  asset: ProjectAsset,
  canonicalizations: CustomerTimelockCanonicalization[],
): string | null {
  const provenance = canonicalizations.find((row) => row.provenance_asset_ids.includes(asset.id));
  if (provenance) return `Represented by ${provenance.canonical_asset_name}; metadata provenance retained.`;
  const canonical = canonicalizations.find((row) => row.canonical_asset_id === asset.id);
  if (canonical) return "Canonical timelock surface; public-call evidence retained.";
  return null;
}

export function reportAssetText(
  value: string,
  asset: ProjectAsset | undefined,
  candidates: DiscoveredCandidateAsset[],
): string {
  if (!asset) return value;
  const displayName = reportAssetDisplayName(asset, candidates);
  return displayName === asset.name ? value : value.replaceAll(asset.name, displayName);
}

export function reportNextActions(review: DefenseReview, fallback: string[]): string[] {
  const generated = (review.customerEvidenceRequested ?? [])
    .flatMap((group) => group.requests ?? [])
    .filter((request): request is string => request.trim().length > 0);
  return generated.length > 0 ? generated : fallback;
}

export function reportSourceSummaryByAsset(
  review: DefenseReview,
): Map<string, CustomerDetectorEvidence> {
  const rows = review.customerMappedAssetSourceAbiSummary?.length
    ? review.customerMappedAssetSourceAbiSummary
    : (review.customerDetectorEvidence ?? []).filter(
      (item) => item.detector === "Etherscan V2 ABI / Source",
    );
  return new Map(
    rows
      .filter((item) => typeof item.assetName === "string")
      .map((item) => [item.assetName as string, item]),
  );
}

export function sourceSummaryForFinding(
  finding: AdminSurfaceFinding,
  assets: ProjectAsset[],
  summaryByAsset: Map<string, CustomerDetectorEvidence>,
): Record<string, unknown> | undefined {
  const existing = finding.evidence?.sourceVerification;
  if (existing && typeof existing === "object") {
    return existing as Record<string, unknown>;
  }
  const asset = finding.assetId ? assets.find((row) => row.id === finding.assetId) : undefined;
  const summary = asset ? summaryByAsset.get(asset.name) : undefined;
  if (!summary) return undefined;
  const abiStatus = summary.abiStatus ?? "unknown";
  const sourceStatus = summary.sourceStatus ?? "unknown";
  const verificationStatus = abiStatus === "available" || sourceStatus === "available"
    ? "available"
    : abiStatus === "not_verified" && sourceStatus === "not_verified"
      ? "not_verified"
      : summary.observationStatus ?? "unknown";
  return {
    sourceVerificationStatus: verificationStatus,
    explorerName: summary.evidenceSource ?? "Etherscan V2",
    abiAvailable: abiStatus === "available",
    sourceAvailable: sourceStatus === "available",
    abiStatus,
    sourceStatus,
    contractName: summary.contractName,
    verificationNotes: [],
  };
}
