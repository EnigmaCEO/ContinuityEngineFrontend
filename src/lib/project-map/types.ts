export type ProjectEnvironment = "mainnet" | "testnet" | "staging" | "demo";
export type ProjectStatus = "active" | "draft" | "archived";
export type ProjectAssetType =
  | "contract"
  | "proxy"
  | "multisig"
  | "timelock"
  | "treasury"
  | "oracle"
  | "bridge"
  | "keeper"
  | "frontend"
  | "dependency"
  | "other";
export type ProjectAssetStatus = "active" | "watch" | "archived";
export type AdminFindingSeverity = "low" | "medium" | "high" | "critical";
export type ProjectControlStatus = "missing" | "planned" | "implemented" | "verified" | "not_applicable";
export type AdminFindingType =
  | "owner_eoa"
  | "proxy_admin"
  | "upgrade_authority"
  | "treasury_authority"
  | "mint_authority"
  | "pause_authority"
  | "role_concentration"
  | "missing_timelock"
  | "unknown_admin"
  | "multisig_detected"
  | "timelock_detected"
  // Treasury role probes
  | "treasury_movement_authority"
  | "treasury_allocation_authority"
  | "treasury_emergency_freeze"
  | "treasury_role_concentration"
  | "treasury_timelock_required"
  // Vault role probes
  | "vault_deposit_withdrawal_authority"
  | "vault_lock_parameter_authority"
  | "vault_pause_authority"
  | "vault_upgrade_authority"
  | "vault_timelock_required"
  // Escrow role probes
  | "escrow_settlement_authority"
  | "escrow_batch_finalization"
  | "escrow_fund_routing"
  | "escrow_keeper_dependency"
  | "escrow_role_concentration"
  // Reserve role probes
  | "reserve_custody_authority"
  | "reserve_rebalance_authority"
  | "reserve_insurance_parameter"
  | "reserve_role_concentration"
  // Oracle / GoldOracle role probes
  | "oracle_price_feed_authority"
  | "oracle_stale_price_risk"
  | "oracle_fallback_authority"
  | "oracle_update_authority"
  | "oracle_manipulation_risk"
  // Keeper / EscrowKeeper role probes
  | "keeper_trigger_authority"
  | "keeper_execution_authority"
  | "keeper_failure_behavior"
  | "keeper_continuity_risk";

export interface Project {
  id: string;
  accountId: string;
  name: string;
  slug: string;
  description?: string | null;
  environment: ProjectEnvironment;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectAsset {
  id: string;
  projectId: string;
  assetType: ProjectAssetType;
  name: string;
  chain?: string | null;
  network?: string | null;
  address?: string | null;
  url?: string | null;
  metadata: Record<string, unknown>;
  status: ProjectAssetStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AdminSurfaceFinding {
  id: string;
  projectId: string;
  assetId?: string | null;
  findingType: AdminFindingType;
  severity: AdminFindingSeverity;
  title: string;
  summary: string;
  recommendedActions: string[];
  evidence: Record<string, unknown>;
  status: "open" | "acknowledged" | "resolved";
  createdAt: string;
  updatedAt: string;
}

export interface ScanAdminSurfaceResponse {
  project: Project;
  findingsCreated: number;
  findings: AdminSurfaceFinding[];
}

export interface ProjectAccountOverview {
  projectCount: number;
  assetCount: number;
  findingCount: number;
  criticalFindingCount: number;
  highFindingCount: number;
  openFindingCount: number;
  lastScanAt?: string | null;
  highestSeverity?: AdminFindingSeverity | null;
  highestRiskProjectName?: string | null;
  highestRiskAssetName?: string | null;
  findingTypeCounts: Partial<Record<AdminFindingType, number>>;
  zeroCustodyStatus: boolean;
}

export interface ProjectRelevantThreatFamily {
  threatFamily: string;
  relevanceScore: number;
  matchedFindings: string[];
  matchedSignals: string[];
  globalCaseCount: number;
  criticalCount: number;
  replayValidatedCount: number;
  replayCoveragePct: number;
  doctrineCoveragePct: number;
  topDoctrineTags: string[];
  topRecommendedActions: string[];
  whyItMatters: string;
}

export interface ProjectRelevantDoctrineTag {
  tag: string;
  matchedFindings: string[];
  matchedSignals: string[];
  globalCaseCount?: number | null;
  replayPassed?: number | null;
  recommendedActions: string[];
  continuityImplications: string[];
}

export interface ProjectRelevance {
  projectId: string;
  projectName: string;
  accountId: string;
  relevantThreatFamilies: ProjectRelevantThreatFamily[];
  relevantDoctrineTags: ProjectRelevantDoctrineTag[];
  relevanceScore: number;
  summary: string;
  generatedAt: string;
}

export interface ProjectControl {
  id: string;
  accountId: string;
  projectId: string;
  assetId?: string | null;
  findingId?: string | null;
  controlKey: string;
  title: string;
  description: string;
  status: ProjectControlStatus;
  severity: AdminFindingSeverity;
  sourceFindingType?: AdminFindingType | null;
  doctrineTags: string[];
  recommendedEvidence: string[];
  evidence: Record<string, unknown>;
  evidenceProvided?: string | null;
  reviewerNotes?: string | null;
  assignedToUserId?: string | null;
  reviewerUserId?: string | null;
  dueDate?: string | null;
  verifiedByUserId?: string | null;
  verificationNotes?: string | null;
  evidenceSubmittedBy?: string | null;
  statusUpdatedBy?: string | null;
  verifiedBy?: string | null;
  verificationMethod: "metadata" | "manual" | "future_onchain" | "none";
  verifiedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectControlGenerationResponse {
  generated: number;
  updated: number;
  skipped: number;
  controls: ProjectControl[];
}

export interface ProjectControlVerificationResponse {
  verified: number;
  implemented: number;
  unchanged: number;
  controls: ProjectControl[];
}

export interface ProjectIntakeRequest {
  projectName: string;
  chain: string;
  contractAddress: string;
  network?: string;
  websiteUrl?: string;
  docsUrl?: string;
  repoUrl?: string;
  notes?: string;
  runScan?: boolean;
}

export interface ProjectIntakeResponse {
  project: Project;
  asset: ProjectAsset;
  assetCreated: boolean;
  scanResult?: ScanAdminSurfaceResponse | null;
  findingsCount: number;
  assetsCount: number;
}

export interface ContractEntry {
  label: string;
  address: string;
  name?: string;
}

export interface ProtocolMatrixIntakeRequest {
  projectName: string;
  chain: string;
  environment: ProjectEnvironment;
  websiteUrl?: string;
  docsUrl?: string;
  repoUrl?: string;
  notes?: string;
  contracts: ContractEntry[];
  runScan?: boolean;
}

export interface ImportedAssetSummary {
  label: string;
  name: string;
  address: string;
  assetId: string;
  assetType: string;
  created: boolean;
}

export interface ProtocolMatrixIntakeResponse {
  project: Project;
  assetsImported: number;
  assetsSkipped: number;
  totalAssets: number;
  findingsCount: number;
  scanResult?: ScanAdminSurfaceResponse | null;
  importedAssets: ImportedAssetSummary[];
}
