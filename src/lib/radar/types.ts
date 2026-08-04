export type RadarMonitorType = "oracle" | "bridge" | "governance" | "sce_heartbeat" | "dependency" | "lp";
export type RadarSeverity = "watch" | "warning" | "critical";
export type RadarStatus = "active" | "resolved" | "superseded";
export type RadarVisibility = "public" | "private";
export type RadarAlertProvenance = "sample" | "manual" | "runtime" | "live";
export type RadarBroadcastTier = "none" | "internal_only" | "daily_brief" | "urgent_public" | "client_only";
export type RadarObjectPurpose =
  | "sagitta_dependency"
  | "technical_smoke"
  | "oracle_reference"
  | "future_sagitta_dependency"
  | "grant_or_ecosystem_dependency"
  | "client_dependency"
  | "commercial_priority";
export type RadarMonitoredObjectType = "oracle_feed" | "bridge_route";
export type RadarMonitoredObjectStatus =
  | "configured"
  | "enabled"
  | "disabled"
  | "checked"
  | "fresh"
  | "stale"
  | "skipped"
  | "error"
  | "missing_rpc_url"
  | "missing_contract_address"
  | "missing_status_source";
export type OracleCoverageProvider =
  | "chainlink"
  | "pyth"
  | "chronicle"
  | "redstone"
  | "stork"
  | "supra"
  | "dia"
  | "api3"
  | "uma"
  | "switchboard"
  | "band"
  | "internal"
  | "twap";
export type OracleCoveragePurpose =
  | "sagitta_dependency"
  | "technical_smoke"
  | "oracle_reference"
  | "client_dependency"
  | "pending_ecosystem"
  | "commercial_priority";
export type OracleCoverageAssetClass =
  | "stablecoin"
  | "volatile_crypto"
  | "commodity_backed"
  | "lst"
  | "lrt"
  | "rwa"
  | "internal"
  | "twap";
export type OracleCoverageStatus =
  | "active"
  | "enabled"
  | "disabled"
  | "pending"
  | "reference_only"
  | "unavailable";
export type OracleCoverageSourceType =
  | "onchain_feed"
  | "offchain_reference"
  | "internal_reference"
  | "twap_or_amm";
export type OracleCoverageLicensingStatus =
  | "unrestricted"
  | "optional_api_key"
  | "paid_or_limited"
  | "unknown";
export type OracleCoverageOfficialMetadataStatus =
  | "verified"
  | "manually_configured"
  | "pending_verification";
export type OracleCoverageCommercialValueTier = "low" | "medium" | "high" | "very_high";
export type OracleCoverageMarketRiskCategory =
  | "low"
  | "medium"
  | "high"
  | "very_high"
  | "new_token"
  | "custom"
  | "deprecating"
  | "unknown";
export type OracleCoverageMarketRiskMetadataStatus =
  | "verified"
  | "manually_configured"
  | "pending_verification";
export type OracleDoctrineClass =
  | "stablecoin_dependency"
  | "commodity_backed_dependency"
  | "volatile_reference";
export type OracleDoctrineThresholdSource = "default" | "custom_override";
export type BridgeCoverageProvider =
  | "cctp"
  | "across"
  | "wormhole"
  | "layerzero"
  | "axelar"
  | "hyperlane"
  | "circle"
  | "internal"
  | "unknown";
export type BridgeCoverageMessageType =
  | "token_transfer"
  | "message"
  | "attestation"
  | "settlement"
  | "unknown";
export type BridgeCoveragePurpose =
  | "sagitta_dependency"
  | "client_dependency"
  | "commercial_priority"
  | "technical_smoke"
  | "pending_ecosystem"
  | "backlog";
export type BridgeCoverageRouteClass =
  | "stablecoin_settlement"
  | "general_message"
  | "liquidity_bridge"
  | "canonical_bridge"
  | "third_party_bridge"
  | "internal_route";
export type BridgeCoverageCommercialValueTier = "low" | "medium" | "high" | "very_high";
export type BridgeCoverageStatus = "active" | "enabled" | "disabled" | "pending" | "blocked" | "backlog";
export type BridgeCoverageMetadataStatus = "verified" | "manually_configured" | "pending_verification";
export type BridgeDoctrineClass =
  | "cctp_stablecoin_settlement"
  | "general_message_bridge"
  | "liquidity_bridge";

export interface RadarAlert {
  id: string;
  dedupeKey: string;
  monitorType: RadarMonitorType;
  source: string;
  severity: RadarSeverity;
  status: RadarStatus;
  confidence: number;
  summary: string;
  reasonCode: string;
  visibility: RadarVisibility;
  provenance: RadarAlertProvenance;
  createdAt: string;
  updatedAt: string;
  oracle?: string | null;
  bridge?: string | null;
  asset?: string | null;
  chain?: string | null;
  route?: string | null;
  affectedProtocol?: string | null;
  observedValue?: string | null;
  expectedValue?: string | null;
  evidenceUrl?: string | null;
  evidenceHash?: string | null;
  doctrineVersion?: string | null;
  monitorObjectId?: string | null;
  objectPurpose?: RadarObjectPurpose | null;
  runId?: string | null;
  evidence?: ChainlinkOracleEvidenceDetails | null;
  bridgeEvidence?: BridgeRouteEvidencePayload | null;
  lpEvidence?: LpPoolEvidencePayload | null;
  resolvedAt?: string | null;
}

export interface ChainlinkOracleEvidenceDetails {
  normalizedPrice?: string | null;
  rawAnswer?: number | null;
  decimals?: number | null;
  roundId?: number | null;
  blockNumber?: number | null;
  updatedAt?: string | null;
  observedAt?: string | null;
  feedAgeSeconds?: number | null;
  expectedHeartbeatSeconds?: number | null;
  watchAfterSeconds?: number | null;
  warningAfterSeconds?: number | null;
  criticalAfterSeconds?: number | null;
  heartbeatMetadataStatus?: OracleCoverageOfficialMetadataStatus | null;
  heartbeatSourceUrl?: string | null;
  contractAddress?: string | null;
  chain?: string | null;
  pair?: string | null;
  objectPurpose?: RadarObjectPurpose | null;
  provenance?: RadarAlertProvenance | null;
}

export interface BridgeRouteEvidencePayload {
  provider: string;
  routeId: string;
  routeName: string;
  sourceChain: string;
  destinationChain: string;
  asset: string;
  latestObservedMessageId?: string | null;
  latestCompletedMessageId?: string | null;
  latestObservedAt?: string | null;
  latestCompletedAt?: string | null;
  pendingMessageCount?: number | null;
  maxPendingAgeSeconds?: number | null;
  observedLatencySeconds?: number | null;
  expectedSettlementSeconds: number;
  watchAfterSeconds: number;
  warningAfterSeconds: number;
  criticalAfterSeconds: number;
  statusSource: string;
  provenance: string;
}

export interface RadarLiveObject {
  id: string;
  objectType: RadarMonitoredObjectType;
  source: string;
  status: RadarMonitoredObjectStatus;
  isLive: boolean;
  isSample: boolean;
  createdAt: string;
  updatedAt: string;
  asset?: string | null;
  pair?: string | null;
  chain?: string | null;
  route?: string | null;
  contractAddress?: string | null;
  rpcUrlEnv?: string | null;
  purpose?: RadarObjectPurpose | null;
  lastCheckedAt?: string | null;
  lastSuccessAt?: string | null;
  lastError?: string | null;
  checksCount: number;
  alertsCreatedCount: number;
  doctrineVersion?: string | null;
}

export interface RadarLiveObjectSummary {
  objectType: "all" | "oracle_feed" | "bridge_route";
  configuredCount: number;
  enabledCount: number;
  checkedCount: number;
  liveCount: number;
  errorCount: number;
  missingSourceCount: number;
  latestSuccessAt?: string | null;
  latestError?: string | null;
}

export interface RadarLiveObjectsStatus {
  generatedAt: string;
  objects: RadarLiveObject[];
  totalConfigured: number;
  totalEnabled: number;
  totalChecked: number;
  totalLiveActive: number;
  totalError: number;
  totalMissingSource: number;
  latestSuccessAt?: string | null;
  latestError?: string | null;
  oracle: RadarLiveObjectSummary;
  bridge: RadarLiveObjectSummary;
}

export interface OracleActivationDiagnostic {
  objectId: string;
  source: string;
  pair: string;
  chain: string;
  purpose?: RadarObjectPurpose | null;
  enabledEnv: string;
  enabledValue: boolean;
  rpcUrlEnv: string;
  rpcUrlPresent: boolean;
  contractAddressEnvsChecked: string[];
  contractAddressPresent: boolean;
  status: string;
  nextAction: string;
}

export interface OracleActivationDiagnosticsResult {
  generatedAt: string;
  runtimeEnabled: boolean;
  oracleMonitorEnabled: boolean;
  feeds: OracleActivationDiagnostic[];
}

export interface OracleCoverageItem {
  id: string;
  provider: OracleCoverageProvider;
  pair: string;
  asset: string;
  chain?: string | null;
  purpose: OracleCoveragePurpose;
  assetClass: OracleCoverageAssetClass;
  status: OracleCoverageStatus;
  sourceType: OracleCoverageSourceType;
  canAlert: boolean;
  canReferenceCompare: boolean;
  licensingStatus: OracleCoverageLicensingStatus;
  officialMetadataStatus: OracleCoverageOfficialMetadataStatus;
  officialSourceUrl?: string | null;
  officialMetadataVerifiedAt?: string | null;
  officialMetadataVerifiedBy?: string | null;
  officialMetadataNotes?: string | null;
  commercialValueTier: OracleCoverageCommercialValueTier;
  chainlinkMarketRiskCategory: OracleCoverageMarketRiskCategory;
  marketRiskMetadataStatus: OracleCoverageMarketRiskMetadataStatus;
  expectedHeartbeatSeconds?: number | null;
  doctrineClass?: OracleDoctrineClass | null;
  doctrineThresholdSource?: OracleDoctrineThresholdSource | null;
  watchAfterSeconds?: number | null;
  warningAfterSeconds?: number | null;
  criticalAfterSeconds?: number | null;
  notes?: string | null;
  lastCheckedAt?: string | null;
  lastSuccessAt?: string | null;
  latestStatus?: string | null;
  latestAlertId?: string | null;
}

export interface OracleCoverageSummary {
  totalItems: number;
  activeDependencyFeeds: number;
  enabledOnchainFeeds: number;
  disabledFeeds: number;
  referenceOnlySources: number;
  pendingEcosystemItems: number;
  commercialPriorityBacklogItems: number;
  providersCovered: OracleCoverageProvider[];
  providersPending: OracleCoverageProvider[];
  feedsMissingOfficialMetadataVerification: number;
  latestDependencyAlert?: RadarAlert | null;
  activeDependencyAlertCount: number;
}

export interface BridgeCoverageItem {
  id: string;
  provider: BridgeCoverageProvider;
  routeName: string;
  sourceChain: string;
  destinationChain: string;
  asset: string;
  messageType: BridgeCoverageMessageType;
  purpose: BridgeCoveragePurpose;
  routeClass: BridgeCoverageRouteClass;
  doctrineClass: BridgeDoctrineClass;
  commercialValueTier: BridgeCoverageCommercialValueTier;
  status: BridgeCoverageStatus;
  canAlert: boolean;
  canBroadcast: boolean;
  canReferenceCompare: boolean;
  enabledEnv?: string | null;
  sourceConfigEnv?: string | null;
  destinationConfigEnv?: string | null;
  expectedSettlementSeconds?: number | null;
  watchAfterSeconds?: number | null;
  warningAfterSeconds?: number | null;
  criticalAfterSeconds?: number | null;
  metadataStatus: BridgeCoverageMetadataStatus;
  officialSourceUrl?: string | null;
  metadataNotes?: string | null;
  latestStatus?: string | null;
  latestCheckedAt?: string | null;
  latestSuccessAt?: string | null;
  latestAlertId?: string | null;
  notes?: string | null;
}

export interface BridgeCoverageSummary {
  totalRoutes: number;
  activeRoutes: number;
  enabledRoutes: number;
  disabledRoutes: number;
  pendingRoutes: number;
  blockedRoutes: number;
  backlogRoutes: number;
  providersCovered: BridgeCoverageProvider[];
  sagittaDependencyRoutes: number;
  commercialPriorityRoutes: number;
  activeBridgeAlerts: number;
  latestBridgeAlert?: RadarAlert | null;
}

export interface BridgeCoverageResponse {
  generatedAt: string;
  summary: BridgeCoverageSummary;
  items: BridgeCoverageItem[];
}

export interface ChainlinkMonitorFeedResult {
  feedId: string;
  asset: string;
  pair: string;
  chain: string;
  status: "created" | "updated" | "resolved" | "healthy" | "skipped" | "error";
  ageSeconds?: number | null;
  expectedHeartbeatSeconds?: number | null;
  staleAfterSeconds?: number | null;
  freshnessLevel?: "fresh" | "watch" | "warning" | "critical" | null;
  doctrineClass?: OracleDoctrineClass | null;
  doctrineThresholdSource?: OracleDoctrineThresholdSource | null;
  watchAfterSeconds?: number | null;
  warningAfterSeconds?: number | null;
  criticalAfterSeconds?: number | null;
  alertId?: string | null;
  monitorObjectId?: string | null;
  evidence?: ChainlinkOracleEvidenceDetails | null;
  error?: string | null;
}

export interface RadarSmokeObjectResult {
  objectId: string;
  source: string;
  enabled: boolean;
  status: RadarMonitoredObjectStatus;
  nextAction: string;
  purpose?: RadarObjectPurpose | null;
  chain?: string | null;
  pair?: string | null;
  route?: string | null;
  freshnessStatus?: "fresh" | "watch" | "warning" | "critical" | "stale" | "not_checked" | "read_failed" | null;
  doctrineClass?: OracleDoctrineClass | null;
  doctrineThresholdSource?: OracleDoctrineThresholdSource | null;
  feedAgeSeconds?: number | null;
  evidence?: ChainlinkOracleEvidenceDetails | null;
  lastCheckedAt?: string | null;
  lastSuccessAt?: string | null;
  lastError?: string | null;
}

export type OracleReadinessStatus = "ready" | "needs_attention" | "not_ready";
export type OracleReadinessIssueSeverity = "info" | "warning" | "critical";

export interface OracleReadinessIssue {
  code: string;
  severity: OracleReadinessIssueSeverity;
  title: string;
  detail: string;
  nextAction: string;
  relatedObjectId?: string | null;
}

export interface OracleReadinessReport {
  generatedAt: string;
  overallStatus: OracleReadinessStatus;
  score: number;
  activeDependencyFeeds: number;
  dependencyFeedsWithSuccessfulCheck: number;
  activeDependencyAlerts: number;
  referenceComparisonsAvailable: number;
  referenceComparisonsSkipped: number;
  feedsMissingMetadataVerification: number;
  feedsMissingDoctrine: number;
  pendingEcosystemItems: number;
  commercialPriorityBacklogItems: number;
  deliveryReady: boolean;
  watchlistReady: boolean;
  dailyBriefReady: boolean;
  issues: OracleReadinessIssue[];
  recommendations: string[];
}

export type OraclePilotDrillStatus = "passed" | "needs_attention" | "failed";

export interface OraclePilotDrillReport {
  generatedAt: string;
  status: OraclePilotDrillStatus;
  passed: boolean;
  needsAttention: boolean;
  failed: boolean;
  score: number;
  liveChecksRun: number;
  dependencyFeedsChecked: number;
  activeDependencyAlerts: number;
  referenceChecksRun: number;
  referenceChecksSkipped: number;
  readinessStatus: OracleReadinessStatus;
  readinessScore: number;
  dailyBriefStatus: string;
  watchlistMatchesCreated: number;
  deliveryReady: boolean;
  deliveryDryRunStatus: string;
  issues: OracleReadinessIssue[];
  recommendations: string[];
}

export interface RadarCountItem {
  key: string;
  count: number;
}

export interface RadarDailyBriefSummary {
  id: string;
  severity: RadarSeverity;
  monitorType: RadarMonitorType;
  source: string;
  summary: string;
  asset?: string | null;
  chain?: string | null;
  route?: string | null;
  createdAt: string;
}

export interface RadarDailyBrief {
  generatedAt: string;
  windowStart: string;
  windowEnd: string;
  signalQualityMode: "raw" | "broadcast_candidates";
  totalAlerts: number;
  rawAlertsTotal: number;
  broadcastCandidates: number;
  suppressedInternalSignals: number;
  notableSignals: number;
  countsBySeverity: RadarCountItem[];
  countsByMonitorType: RadarCountItem[];
  topAssets: RadarCountItem[];
  topChains: RadarCountItem[];
  topRoutes: RadarCountItem[];
  alertSummaries: RadarDailyBriefSummary[];
  includedAlertIds: string[];
  excludedAlertIds: string[];
  excludedReasons: string[];
}

export type BridgePolicyStatus =
  | "not_eligible"
  | "internal_only"
  | "daily_brief_candidate"
  | "urgent_candidate";

export type LpPolicyStatus =
  | "not_eligible"
  | "internal_only"
  | "daily_brief_candidate"
  | "urgent_candidate";

export type CurveImbalanceCalibrationStatus =
  | "uncalibrated"
  | "baseline_configured"
  | "calibrated";

export type CurveImbalanceBaselineSource =
  | "doctrine"
  | "env"
  | "manual"
  | "historical_window"
  | "unavailable";

export type CurvePoolRole =
  | "base_pool"
  | "metapool"
  | "two_asset_stable"
  | "unknown";

export interface RadarSignalQuality {
  alertId: string;
  monitorType: RadarMonitorType;
  reasonCode: string;
  objectId?: string | null;
  objectPurpose?: RadarObjectPurpose | null;
  severity: RadarSeverity;
  qualityScore: number;
  broadcastEligible: boolean;
  broadcastTier: RadarBroadcastTier;
  suppressionReason?: string | null;
  evidenceScore: number;
  dependencyScore: number;
  severityScore: number;
  noveltyScore: number;
  persistenceScore: number;
  referenceScore: number;
  publicSafetyScore: number;
  explanation: string;
  createdAt: string;
  updatedAt: string;
  bridgePolicyStatus?: BridgePolicyStatus | null;
  bridgePolicyReason?: string | null;
  bridgePolicyScore?: number | null;
  bridgePolicyEnabled: boolean;
  lpPolicyStatus?: LpPolicyStatus | null;
  lpPolicyReason?: string | null;
  lpPolicyScore?: number | null;
  lpPolicyEnabled: boolean;
}

export interface RadarSignalQualitySnapshot {
  generatedAt: string;
  totalSignals: number;
  broadcastCandidates: number;
  internalOnlySignals: number;
  suppressedSignals: number;
  highestQualityScore: number;
  topCandidate?: RadarSignalQuality | null;
  signals: RadarSignalQuality[];
  bridgeDailyBriefCandidates: number;
  bridgeUrgentCandidates: number;
  bridgePolicyEnabled: boolean;
  lpDailyBriefCandidates: number;
  lpUrgentCandidates: number;
  lpPolicyEnabled: boolean;
}

export interface RadarPreviewExcludedReason {
  code: string;
  label: string;
  count: number;
  alertIds: string[];
  detail?: string | null;
}

export interface RadarPreviewSafetyCheck {
  code: string;
  status: "pass" | "fail";
  detail: string;
}

export interface RadarEditorialRequest {
  editorial: boolean;
}

export interface RadarEditorialSafetyCheck {
  code: string;
  status: "pass" | "fail";
  detail: string;
}

export interface RadarEditorialPost {
  index: number;
  rawText: string;
  editedText: string;
  signalType: "oracle" | "bridge" | "lp" | "mixed" | "summary" | "footer";
  publicSignalClass: "alert" | "warning" | "watch" | "coverage" | "summary" | "footer";
  severity: "critical" | "warning" | "info" | "none";
  sourceAlertIds: string[];
  claimsAllowed: string[];
  claimsBlocked: string[];
  evidenceUsed: string[];
  editorialStatus: "disabled" | "not_configured" | "edited" | "failed" | "blocked";
  blockedReason?: string | null;
  needsOperatorApproval: boolean;
}

export interface RadarEditorialPreview {
  requested: boolean;
  enabled: boolean;
  configured: boolean;
  provider: string;
  model?: string | null;
  editorialStatus: "disabled" | "not_configured" | "edited" | "failed" | "blocked";
  operatorApprovalRequired: boolean;
  posts: RadarEditorialPost[];
  blockedEdits: string[];
  safetyChecks: RadarEditorialSafetyCheck[];
  latestError?: string | null;
}

export interface RadarUnifiedPreviewThreadPost {
  index: number;
  text: string;
  signalType: "oracle" | "bridge" | "lp" | "mixed" | "summary" | "footer";
  severity: "critical" | "warning" | "info" | "none";
  sourceAlertIds: string[];
  characterCount: number;
}

export interface RadarUnifiedPublicAlertPreview {
  generatedAt: string;
  status: "ready" | "no_candidates" | "needs_attention" | "error";
  mode: "preview_only";
  publicBroadcastEnabled: boolean;
  editorialRequested: boolean;
  operatorApprovalRequired: boolean;
  previewHash: string;
  threadHash: string;
  postCount: number;
  deterministicHash: string;
  editorialHash?: string | null;
  approvalStatus: "not_approved" | "pending" | "approved" | "revoked" | "expired";
  approvalId?: string | null;
  approvedAt?: string | null;
  approvedBy?: string | null;
  approvalNote?: string | null;
  expiresAt?: string | null;
  deliveryAllowed: boolean;
  previewChanged: boolean;
  totalSignals: number;
  oracleSignals: number;
  bridgeSignals: number;
  lpSignals: number;
  criticalSignals: number;
  warningSignals: number;
  suppressedSignals: number;
  includedAlertIds: string[];
  excludedAlertIds: string[];
  excludedReasons: RadarPreviewExcludedReason[];
  safetyChecks: RadarPreviewSafetyCheck[];
  headline: string;
  summary: string;
  providerSummary: string;
  riskSummary: string;
  threadPosts: RadarUnifiedPreviewThreadPost[];
  editorialPreview?: RadarEditorialPreview | null;
  recommendations: string[];
  latestError?: string | null;
}

export interface RadarFreshPreviewStepResult {
  step: string;
  status: "success" | "warning" | "error";
  summary: string;
  alertsCreated: number;
  alertsUpdated: number;
  alertsResolved: number;
  signalsScored: number;
  latestError?: string | null;
}

export interface RadarFreshPublicPreviewResult {
  generatedAt: string;
  status: "success" | "warning" | "error";
  mode: "preview_only";
  publicBroadcastEnabled: false;
  deliverySent: false;
  operatorApprovalRequired: true;
  oracleStatus: "success" | "warning" | "error";
  bridgeStatus: "success" | "warning" | "error";
  lpStatus: "success" | "warning" | "error";
  unifiedPreview?: RadarUnifiedPublicAlertPreview | null;
  editorialPreview?: RadarEditorialPreview | null;
  stepResults: RadarFreshPreviewStepResult[];
  warnings: string[];
  latestError?: string | null;
  recommendations: string[];
}

export interface RadarPublicPreviewApprovalStatusResult {
  previewHash: string;
  threadHash: string;
  postCount: number;
  deterministicHash: string;
  editorialHash?: string | null;
  status: "not_approved" | "pending" | "approved" | "revoked" | "expired";
  approvalId?: string | null;
  approvedAt?: string | null;
  approvedBy?: string | null;
  approvalNote?: string | null;
  expiresAt?: string | null;
  deliveryAllowed: boolean;
  operatorApprovalRequired: boolean;
  previewChanged: boolean;
}

export interface RadarPublicPreviewCopyResult {
  previewHash: string;
  threadHash: string;
  postCount: number;
  fullThreadText: string;
  posts: string[];
  approvalStatus: "not_approved" | "pending" | "approved" | "revoked" | "expired";
  approvalId?: string | null;
  operatorApprovalRequired: boolean;
  deliveryAllowed: boolean;
}

export interface RadarPublicPreviewPlatformDryRun {
  xThread: string[];
  discordMessages: string[];
  telegramMessages: string[];
}

export interface RadarPublicPreviewDryRunResult {
  approved: boolean;
  approvalRequired: boolean;
  approvalId?: string | null;
  previewHash: string;
  threadHash: string;
  postCount: number;
  characterCounts: number[];
  platformPreview: RadarPublicPreviewPlatformDryRun;
  deliverySent: false;
  publicBroadcastEnabled: false;
  operatorApprovalRequired: true;
  latestError?: string | null;
}

export type RadarPublicDistributionChannel = "discord" | "telegram" | "x";
export type RadarPublicDistributionStatus = "sent" | "partial" | "failed" | "blocked" | "dry_run";
export type RadarPublicDistributionChannelStatus = "sent" | "skipped" | "failed" | "blocked" | "dry_run";

export interface RadarPublicDeliveryChannelResult {
  channel: RadarPublicDistributionChannel;
  enabled: boolean;
  configured: boolean;
  status: RadarPublicDistributionChannelStatus;
  messageCount: number;
  externalIds: string[];
  sanitizedError?: string | null;
}

export interface RadarPublicDeliveryLedgerEntry {
  deliveryId: string;
  approvalId: string;
  previewHash: string;
  threadHash: string;
  channels: RadarPublicDistributionChannel[];
  status: RadarPublicDistributionStatus;
  dryRun: boolean;
  sentAt?: string | null;
  postCount: number;
  deliveryNote?: string | null;
  deliveryResults: RadarPublicDeliveryChannelResult[];
  createdAt: string;
  updatedAt: string;
}

export interface RadarPublicDistributionResult {
  deliveryId: string;
  generatedAt: string;
  status: RadarPublicDistributionStatus;
  approvalId?: string | null;
  previewHash: string;
  threadHash: string;
  postCount: number;
  channelsRequested: RadarPublicDistributionChannel[];
  channelsSent: RadarPublicDistributionChannel[];
  channelsFailed: RadarPublicDistributionChannel[];
  dryRun: boolean;
  publicBroadcastEnabled: boolean;
  operatorApprovalRequired: boolean;
  deliveryResults: RadarPublicDeliveryChannelResult[];
  latestError?: string | null;
}

export type RadarDailyBriefStatus = "draft" | "published" | "superseded";
export type RadarSocialChannel = "twitter";
export type RadarSocialDeliveryStatus = "draft" | "dry_run" | "sent" | "skipped" | "failed";

export interface RadarDailyBriefRecord {
  id: string;
  briefDate: string;
  windowStart: string;
  windowEnd: string;
  status: RadarDailyBriefStatus;
  signalQualityMode: "raw" | "broadcast_candidates";
  totalAlerts: number;
  rawAlertsTotal: number;
  broadcastCandidates: number;
  suppressedInternalSignals: number;
  notableSignals: number;
  countsBySeverity: RadarCountItem[];
  countsByMonitorType: RadarCountItem[];
  topAssets: RadarCountItem[];
  topChains: RadarCountItem[];
  topRoutes: RadarCountItem[];
  headline: string;
  summary: string;
  publicBody: string;
  tweetThreadPreview: string[];
  sourceAlertIds: string[];
  excludedAlertIds: string[];
  excludedReasons: string[];
  evidenceHash: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string | null;
}

export interface RadarBroadcastBriefResult {
  generatedAt: string;
  rawAlerts: number;
  candidatesIncluded: number;
  candidatesExcluded: number;
  exclusionReasons: string[];
  dailyBriefId: string;
  dailyBriefStatus: RadarDailyBriefStatus;
  xTwitterPreviewAvailable: boolean;
}

export interface RadarSocialDeliveryRecord {
  id: string;
  briefId: string;
  channel: RadarSocialChannel;
  status: RadarSocialDeliveryStatus;
  destination: string;
  postCount: number;
  externalPostIds?: string[] | null;
  postPreview: string[];
  error?: string | null;
  createdAt: string;
  updatedAt: string;
  sentAt?: string | null;
}

export type RadarWatchlistPlan = "free" | "radar_live" | "radar_pro" | "managed";
export type RadarClientStatus = "trial" | "active" | "past_due" | "suspended" | "canceled";
export type RadarBillingProvider = "manual" | "stripe" | "x402";
export type RadarWatchlistDeliveryChannel = "discord" | "telegram" | "email" | "webhook";
export type RadarWatchlistMatchStatus = "pending_delivery" | "delivered" | "dismissed" | "superseded";

export interface RadarClient {
  id: string;
  name: string;
  status: RadarClientStatus;
  plan: RadarWatchlistPlan;
  primaryContactEmail?: string | null;
  telegramHandle?: string | null;
  discordContact?: string | null;
  notes?: string | null;
  trialEndsAt?: string | null;
  externalBillingCustomerId?: string | null;
  billingProvider?: RadarBillingProvider | null;
  createdAt: string;
  updatedAt: string;
}

export interface RadarClientCreateInput {
  id?: string | null;
  name: string;
  status: RadarClientStatus;
  plan: RadarWatchlistPlan;
  primaryContactEmail?: string | null;
  telegramHandle?: string | null;
  discordContact?: string | null;
  notes?: string | null;
  trialEndsAt?: string | null;
  externalBillingCustomerId?: string | null;
  billingProvider?: RadarBillingProvider | null;
}

export interface RadarClientUpdateInput {
  name?: string | null;
  status?: RadarClientStatus | null;
  plan?: RadarWatchlistPlan | null;
  primaryContactEmail?: string | null;
  telegramHandle?: string | null;
  discordContact?: string | null;
  notes?: string | null;
  trialEndsAt?: string | null;
  externalBillingCustomerId?: string | null;
  billingProvider?: RadarBillingProvider | null;
}

export interface RadarClientEntitlementSummary {
  clientId: string;
  clientName: string;
  plan: RadarWatchlistPlan;
  status: RadarClientStatus;
  watchlistsUsed: number;
  watchlistsLimit?: number | null;
  destinationsUsed: number;
  destinationsLimit?: number | null;
  liveDeliveryEnabled: boolean;
  discordEnabled: boolean;
  telegramEnabled: boolean;
  webhookEnabled: boolean;
  alertHistoryDays: number;
}

export interface RadarWatchlist {
  id: string;
  clientId: string;
  name: string;
  enabled: boolean;
  plan: RadarWatchlistPlan;
  monitorTypes: string[];
  sources: string[];
  assets: string[];
  chains: string[];
  routes: string[];
  reasonCodes: string[];
  minimumSeverity: RadarSeverity;
  deliveryChannels: RadarWatchlistDeliveryChannel[];
  createdAt: string;
  updatedAt: string;
}

export interface RadarWatchlistCreateInput {
  clientId: string;
  name: string;
  enabled: boolean;
  plan: RadarWatchlistPlan;
  monitorTypes: string[];
  sources: string[];
  assets: string[];
  chains: string[];
  routes: string[];
  reasonCodes: string[];
  minimumSeverity: RadarSeverity;
  deliveryChannels: RadarWatchlistDeliveryChannel[];
}

export interface RadarWatchlistMatch {
  id: string;
  watchlistId: string;
  clientId: string;
  alertId: string;
  matchedReasons: string[];
  status: RadarWatchlistMatchStatus;
  createdAt: string;
  updatedAt: string;
}

export interface WatchlistMatchRunResult {
  watchlistsChecked: number;
  alertsChecked: number;
  matchesCreated: number;
  matchesDeduped: number;
  matchesSkipped: number;
  errors: string[];
}

export type RadarLiveDeliveryChannel = "discord" | "telegram" | "webhook";
export type RadarLiveDeliveryStatus = "pending" | "sent" | "skipped" | "failed";
export type RadarDeliveryMode = "live" | "dry_run";

export interface RadarDeliveryDestination {
  id: string;
  clientId: string;
  name: string;
  enabled: boolean;
  channel: RadarLiveDeliveryChannel;
  destinationUrl: string;
  purpose?: string | null;
  deliveryMode: RadarDeliveryMode;
  minimumSeverity: RadarSeverity;
  monitorTypes: string[];
  sources: string[];
  assets: string[];
  chains: string[];
  routes: string[];
  createdAt: string;
  updatedAt: string;
}

export interface RadarDeliveryDestinationCreateInput {
  clientId: string;
  name: string;
  enabled: boolean;
  channel: RadarLiveDeliveryChannel;
  destinationUrl: string;
  purpose?: string | null;
  deliveryMode?: RadarDeliveryMode;
  minimumSeverity: RadarSeverity;
  monitorTypes: string[];
  sources: string[];
  assets: string[];
  chains: string[];
  routes: string[];
}

export interface RadarLiveDelivery {
  id: string;
  clientId: string;
  watchlistId: string;
  matchId: string;
  alertId: string;
  destinationId: string;
  channel: RadarLiveDeliveryChannel;
  status: RadarLiveDeliveryStatus;
  reason?: string | null;
  attemptCount: number;
  lastAttemptAt?: string | null;
  sentAt?: string | null;
  responseReference?: string | null;
  error?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LiveDeliveryRunResult {
  matchesChecked: number;
  destinationsChecked: number;
  deliveriesCreated: number;
  deliveriesSent: number;
  deliveriesSkipped: number;
  deliveriesFailed: number;
  errors: string[];
}

export interface RadarRuntimeStatus {
  runtimeEnabled: boolean;
  oracleMonitorEnabled: boolean;
  oracleDeviationEnabled?: boolean;
  bridgeMonitorEnabled?: boolean;
  lastRunAt?: string | null;
  nextRunAt?: string | null;
  lastSuccessAt?: string | null;
  lastError?: string | null;
  feedsChecked: number;
  alertsCreated: number;
  alertsUpdated: number;
  alertsResolved: number;
  errorsCount: number;
  lastDeviationRunAt?: string | null;
  nextDeviationRunAt?: string | null;
  lastDeviationSuccessAt?: string | null;
  lastDeviationError?: string | null;
  comparisonGroupsChecked?: number;
  deviationSourcesChecked?: number;
  deviationAlertsCreated?: number;
  deviationAlertsUpdated?: number;
  deviationAlertsResolved?: number;
  deviationErrorsCount?: number;
  lastBridgeRunAt?: string | null;
  nextBridgeRunAt?: string | null;
  lastBridgeSuccessAt?: string | null;
  lastBridgeError?: string | null;
  routesChecked?: number;
  bridgeSourcesChecked?: number;
  bridgeAlertsCreated?: number;
  bridgeAlertsUpdated?: number;
  bridgeAlertsResolved?: number;
  bridgeErrorsCount?: number;
}

export type BridgeActivationStatus =
  | "active"
  | "activation_ready"
  | "enabled_missing_source"
  | "enabled_not_checked"
  | "blocked"
  | "pending"
  | "backlog"
  | "unsupported"
  | "disabled";

export interface BridgeActivationRouteRow {
  routeId: string;
  provider: string;
  routeName: string;
  sourceChain: string;
  destinationChain: string;
  asset: string;
  purpose: string;
  routeClass: string;
  commercialValueTier: string;
  coverageStatus: string;
  enabled: boolean;
  adapterSupported: boolean;
  sourceMode: string;
  sourceConfigured: boolean;
  requiredEnvPresent: boolean;
  missingEnv: string[];
  liveChecked: boolean;
  latestCheckedAt?: string | null;
  latestSuccessAt?: string | null;
  latestError?: string | null;
  alertCapable: boolean;
  futureBriefCapable: boolean;
  activationStatus: BridgeActivationStatus;
  activationReason: string;
  nextAction: string;
}

export interface BridgeProviderSummary {
  provider: string;
  implemented: boolean;
  sourceMode: string;
  sourceConfigured: boolean;
  sourceVerified: boolean;
  routesTotal: number;
  routesEnabled: number;
  routesActive: number;
  routesActivationReady: number;
  routesBlocked: number;
  routesBacklog: number;
  latestCheckedAt?: string | null;
  latestSuccessAt?: string | null;
  latestError?: string | null;
  nextAction: string;
}

export interface BridgeProviderActivationMatrix {
  generatedAt: string;
  status: "ready" | "needs_attention" | "blocked";
  providersTotal: number;
  providersImplemented: number;
  providersConfigured: number;
  providersLiveVerified: number;
  routesTotal: number;
  routesActive: number;
  routesEnabled: number;
  routesActivationReady: number;
  routesBlocked: number;
  routesPending: number;
  routesBacklog: number;
  routesCheckedSuccessfully: number;
  routesAlertCapable: number;
  routesFutureBriefCapable: number;
  highestPriorityNextAction: string;
  providerSummaries: BridgeProviderSummary[];
  routeRows: BridgeActivationRouteRow[];
  recommendations: string[];
}

// ---------------------------------------------------------------------------
// Radar Readiness Summary types
// ---------------------------------------------------------------------------

export type RadarOverallReadinessStatus = "ready" | "needs_attention" | "blocked";
export type RadarReadinessLabel =
  | "ready_for_manual_operation"
  | "ready_for_internal_demo"
  | "ready_for_private_pilot"
  | "needs_attention"
  | "blocked";

export interface OracleRadarReadinessSummary {
  status: RadarOverallReadinessStatus;
  readinessLabel: RadarReadinessLabel;
  activeFeeds: number;
  dependencyFeeds: number;
  commercialPriorityFeeds: number;
  referenceSources: number;
  activeOracleAlerts: number;
  warningAlerts: number;
  criticalAlerts: number;
  broadcastCandidates: number;
  latestMonitorRunAt?: string | null;
  latestBroadcastBriefAt?: string | null;
  xPreviewAvailable: boolean;
  publicBroadcastEnabled: boolean;
  providers: string[];
  sourceModes: string[];
  recommendations: string[];
}

export interface BridgeRadarReadinessSummary {
  status: RadarOverallReadinessStatus;
  readinessLabel: RadarReadinessLabel;
  providersImplemented: number;
  providersConfigured: number;
  providersLiveVerified: number;
  providersChecked: number;
  providerLanes: number;
  routesConfigured: number;
  routesEnabled: number;
  routesActive: number;
  routesChecked: number;
  routesDelayed: number;
  routesErrored: number;
  routesFailed: number;
  alertCapableRoutes: number;
  futureBriefCapableRoutes: number;
  activeBridgeAlerts: number;
  staleRouteAlertsResolved: number;
  latestBridgeMonitorRunAt?: string | null;
  bridgePreviewAvailable: boolean;
  publicBroadcastEnabled: boolean;
  policyEnabled: boolean;
  providerSummaries: string[];
  recommendations: string[];
}

export interface RadarActiveAlertsSummary {
  totalActiveAlerts: number;
  oracleAlerts: number;
  bridgeAlerts: number;
  warningAlerts: number;
  criticalAlerts: number;
  manualAlerts: number;
  drillAlerts: number;
  staleOrDisabledRouteAlerts: number;
  publicEligibleAlerts: number;
  internalOnlyAlerts: number;
  latestAlertSummary?: string | null;
}

export interface RadarBroadcastReadinessSummary {
  oraclePublicBroadcastEnabled: boolean;
  bridgePublicBroadcastEnabled: boolean;
  oracleXPreviewReady: boolean;
  bridgeInternalPreviewReady: boolean;
  latestOracleBriefId?: string | null;
  latestBridgePreviewStatus: string;
  oracleBroadcastCandidates: number;
  bridgeFutureCandidates: number;
  deliveryDestinationsConfigured: number;
  deliveryReady: boolean;
  recommendations: string[];
}

export interface RadarReadinessCoverageSummary {
  oracleActiveFeeds: number;
  oracleReferenceSources: number;
  bridgeActiveRoutes: number;
  bridgeActiveProviders: number;
  bridgeBacklogRoutes: number;
  bridgeActivationReadyRoutes: number;
  bridgeBlockedRoutes: number;
}

export interface RadarReadinessSummary {
  generatedAt: string;
  status: RadarOverallReadinessStatus;
  overallReadinessLabel: RadarReadinessLabel;
  oracleReadiness: OracleRadarReadinessSummary;
  bridgeReadiness: BridgeRadarReadinessSummary;
  activeAlertsSummary: RadarActiveAlertsSummary;
  broadcastSummary: RadarBroadcastReadinessSummary;
  coverageSummary: RadarReadinessCoverageSummary;
  riskGaps: string[];
  recommendations: string[];
  nextOperatorAction: string;
  commercialDemoReady: boolean;
  publicBroadcastReady: boolean;
}

// ---------------------------------------------------------------------------
// LP Coverage types
// ---------------------------------------------------------------------------

export type LpCoverageProvider =
  | "uniswap_v3"
  | "aerodrome"
  | "curve"
  | "balancer"
  | "pancakeswap"
  | "sushiswap"
  | "internal"
  | "unknown";

export type LpCoveragePoolType =
  | "concentrated_liquidity"
  | "stable_pool"
  | "volatile_amm"
  | "weighted_pool"
  | "internal_pool"
  | "unknown";

export type LpCoveragePurpose =
  | "sagitta_dependency"
  | "client_dependency"
  | "commercial_priority"
  | "oracle_reference"
  | "technical_smoke"
  | "pending_ecosystem"
  | "backlog";

export type LpCoverageCommercialValueTier = "low" | "medium" | "high" | "very_high";
export type LpCoverageStatus = "active" | "enabled" | "disabled" | "pending" | "blocked" | "backlog";
export type LpCoverageSourceType =
  | "rpc_pool_read"
  | "subgraph"
  | "aggregator_api"
  | "internal_reference"
  | "unknown";
export type LpDoctrineClass =
  | "uniswap_v3_blue_chip_pool"
  | "stable_pool"
  | "commodity_reserve_pool"
  | "base_ecosystem_pool";
export type LpCoverageMetadataStatus = "verified" | "manually_configured" | "pending_verification";

export interface LpCoverageItem {
  id: string;
  provider: LpCoverageProvider;
  poolName: string;
  chain: string;
  dex: string;
  poolAddressEnv?: string | null;
  token0: string;
  token1: string;
  assetPair: string;
  feeTier?: string | null;
  poolType: LpCoveragePoolType;
  doctrineClass: LpDoctrineClass;
  purpose: LpCoveragePurpose;
  commercialValueTier: LpCoverageCommercialValueTier;
  status: LpCoverageStatus;
  canAlert: boolean;
  canBroadcast: boolean;
  canReferenceCompare: boolean;
  sourceType: LpCoverageSourceType;
  enabledEnv?: string | null;
  rpcUrlEnv?: string | null;
  subgraphUrlEnv?: string | null;
  aggregatorSource?: string | null;
  expectedUpdateSeconds: number;
  watchAfterSeconds: number;
  warningAfterSeconds: number;
  criticalAfterSeconds: number;
  liquidityDropWarningPct: number;
  liquidityDropCriticalPct: number;
  priceDeviationWarningBps: number;
  priceDeviationCriticalBps: number;
  imbalanceWarningPct: number;
  imbalanceCriticalPct: number;
  slippageWarningBps: number;
  slippageCriticalBps: number;
  metadataStatus: LpCoverageMetadataStatus;
  officialSourceUrl?: string | null;
  metadataNotes?: string | null;
  latestStatus?: string | null;
  latestCheckedAt?: string | null;
  latestSuccessAt?: string | null;
  latestAlertId?: string | null;
  notes?: string | null;
}

export interface LpCoverageSummary {
  totalPools: number;
  activePools: number;
  enabledPools: number;
  pendingPools: number;
  blockedPools: number;
  backlogPools: number;
  disabledPools: number;
  providersCovered: LpCoverageProvider[];
  commercialPriorityPools: number;
  sagittaDependencyPools: number;
  alertCapablePools: number;
  referenceCompareCapablePools: number;
  activeLpAlerts: number;
  latestLpAlert?: RadarAlert | null;
}

export interface LpCoverageResponse {
  generatedAt: string;
  summary: LpCoverageSummary;
  items: LpCoverageItem[];
}

// ---------------------------------------------------------------------------
// LP Uniswap v3 smoke result types
// ---------------------------------------------------------------------------

export type LpPoolStatus =
  | "disabled"
  | "missing_rpc"
  | "missing_pool"
  | "checked"
  | "error"
  | "unsupported_pool_family"
  | "unsupported_selector";

export interface LpPoolEvidence {
  provider: string;
  poolId: string;
  poolName: string;
  chain: string;
  dex: string;
  poolFamily?: string | null;
  assetPair: string;
  token0Address?: string | null;
  token1Address?: string | null;
  token0Decimals?: number | null;
  token1Decimals?: number | null;
  fee?: number | null;
  liquidity?: string | null;
  reserve0?: string | null;
  reserve1?: string | null;
  token0Balance?: string | null;
  token1Balance?: string | null;
  stable?: boolean | null;
  coins: string[];
  coinSymbols: Array<string | null>;
  coinDecimals: Array<number | null>;
  balances: string[];
  normalizedBalances: number[];
  sqrtPriceX96?: string | null;
  tick?: number | null;
  tickSpacing?: number | null;
  rawPriceToken1PerToken0?: number | null;
  rawPriceToken0PerToken1?: number | null;
  normalizedPrice?: number | null;
  normalizedPriceT0PerT1?: number | null;
  virtualPrice?: number | null;
  amplification?: number | null;
  amplificationPrecise?: number | null;
  adminFee?: number | null;
  humanPrice?: number | null;
  humanPriceLabel?: string | null;
  humanPriceInverse?: number | null;
  humanPriceInverseLabel?: string | null;
  referencePairOrientation?: string | null;
  imbalancePct?: number | null;
  dominantAsset?: string | null;
  dominantAssetSharePct?: number | null;
  totalLiquidityProxy?: number | null;
  imbalanceCalibrationStatus?: CurveImbalanceCalibrationStatus | null;
  imbalanceBaselinePct?: number | null;
  imbalancePublicWarningPct?: number | null;
  imbalancePublicCriticalPct?: number | null;
  imbalanceBaselineSource?: CurveImbalanceBaselineSource | null;
  curvePoolRole?: CurvePoolRole | null;
  imbalancePublicEligible?: boolean | null;
  expectedUpdateSeconds: number;
  watchAfterSeconds: number;
  warningAfterSeconds: number;
  criticalAfterSeconds: number;
  statusSource: string;
  provenance: string;
  readerVersion?: string | null;
  selectorPath?: string | null;
}

export interface LpPoolCheckResult {
  objectId: string;
  provider: string;
  poolId: string;
  poolName: string;
  chain: string;
  assetPair: string;
  poolAddressPresent: boolean;
  rpcConfigured: boolean;
  status: LpPoolStatus;
  latestCheckedAt?: string | null;
  latestSuccessAt?: string | null;
  latestError?: string | null;
  poolFamily?: string | null;
  liquidity?: string | null;
  reserve0?: string | null;
  reserve1?: string | null;
  token0Balance?: string | null;
  token1Balance?: string | null;
  stable?: boolean | null;
  coins: string[];
  coinSymbols: Array<string | null>;
  coinDecimals: Array<number | null>;
  balances: string[];
  normalizedBalances: number[];
  sqrtPriceX96?: string | null;
  tick?: number | null;
  tickSpacing?: number | null;
  fee?: number | null;
  token0Address?: string | null;
  token1Address?: string | null;
  token0Symbol?: string | null;
  token1Symbol?: string | null;
  token0Decimals?: number | null;
  token1Decimals?: number | null;
  rawPriceToken1PerToken0?: number | null;
  rawPriceToken0PerToken1?: number | null;
  normalizedPrice?: number | null;
  normalizedPriceT0PerT1?: number | null;
  virtualPrice?: number | null;
  amplification?: number | null;
  amplificationPrecise?: number | null;
  adminFee?: number | null;
  humanPrice?: number | null;
  humanPriceLabel?: string | null;
  humanPriceInverse?: number | null;
  humanPriceInverseLabel?: string | null;
  referencePairOrientation?: string | null;
  imbalancePct?: number | null;
  dominantAsset?: string | null;
  dominantAssetSharePct?: number | null;
  totalLiquidityProxy?: number | null;
  imbalanceCalibrationStatus?: CurveImbalanceCalibrationStatus | null;
  imbalanceBaselinePct?: number | null;
  imbalancePublicWarningPct?: number | null;
  imbalancePublicCriticalPct?: number | null;
  imbalanceBaselineSource?: CurveImbalanceBaselineSource | null;
  curvePoolRole?: CurvePoolRole | null;
  imbalancePublicEligible?: boolean | null;
  readerVersion?: string | null;
  selectorPath?: string | null;
  evidence?: LpPoolEvidence | null;
}

export interface LpUniswapV3SmokeResult {
  generatedAt: string;
  poolsConfigured: number;
  poolsEnabled: number;
  poolsChecked: number;
  poolsSucceeded: number;
  poolsSkipped: number;
  poolsFailed: number;
  alertsCreated: number;
  alertsUpdated: number;
  alertsResolved: number;
  poolResults: LpPoolCheckResult[];
  messages: string[];
}

export interface LpPoolEvidencePayload {
  provider: string;
  poolId: string;
  poolName: string;
  chain: string;
  dex: string;
  poolFamily?: string | null;
  poolAddress?: string | null;
  assetPair: string;
  token0Address?: string | null;
  token1Address?: string | null;
  token0Symbol?: string | null;
  token1Symbol?: string | null;
  token0Decimals?: number | null;
  token1Decimals?: number | null;
  fee?: number | null;
  liquidity?: string | null;
  reserve0?: string | null;
  reserve1?: string | null;
  token0Balance?: string | null;
  token1Balance?: string | null;
  stable?: boolean | null;
  coins: string[];
  coinSymbols: Array<string | null>;
  coinDecimals: Array<number | null>;
  balances: string[];
  normalizedBalances: number[];
  sqrtPriceX96?: string | null;
  tick?: number | null;
  tickSpacing?: number | null;
  rawPriceToken1PerToken0?: number | null;
  rawPriceToken0PerToken1?: number | null;
  normalizedPrice?: number | null;
  normalizedPriceT0PerT1?: number | null;
  virtualPrice?: number | null;
  amplification?: number | null;
  amplificationPrecise?: number | null;
  adminFee?: number | null;
  humanPrice?: number | null;
  humanPriceLabel?: string | null;
  humanPriceInverse?: number | null;
  humanPriceInverseLabel?: string | null;
  referencePairOrientation?: string | null;
  dominantAsset?: string | null;
  dominantAssetSharePct?: number | null;
  totalLiquidityProxy?: number | null;
  imbalanceCalibrationStatus?: CurveImbalanceCalibrationStatus | null;
  imbalanceBaselinePct?: number | null;
  imbalancePublicWarningPct?: number | null;
  imbalancePublicCriticalPct?: number | null;
  imbalanceBaselineSource?: CurveImbalanceBaselineSource | null;
  curvePoolRole?: CurvePoolRole | null;
  imbalancePublicEligible?: boolean | null;
  referencePrice?: number | null;
  priceDeviationBps?: number | null;
  liquidityDropPct?: number | null;
  imbalancePct?: number | null;
  expectedUpdateSeconds: number;
  watchAfterSeconds: number;
  warningAfterSeconds: number;
  criticalAfterSeconds: number;
  liquidityDropWarningPct: number;
  liquidityDropCriticalPct: number;
  priceDeviationWarningBps: number;
  priceDeviationCriticalBps: number;
  imbalanceWarningPct: number;
  imbalanceCriticalPct: number;
  slippageWarningBps: number;
  slippageCriticalBps: number;
  statusSource: string;
  provenance: string;
  readerVersion?: string | null;
  selectorPath?: string | null;
}

export interface LpUniswapV3MonitorResult {
  generatedAt: string;
  poolsConfigured: number;
  poolsEnabled: number;
  poolsChecked: number;
  poolsSucceeded: number;
  poolsSkipped: number;
  poolsFailed: number;
  alertsCreated: number;
  alertsUpdated: number;
  alertsResolved: number;
  createdAlertIds: string[];
  updatedAlertIds: string[];
  resolvedAlertIds: string[];
  alertOperations: {
    alertId: string;
    dedupeKey: string;
    action: "created" | "updated" | "resolved";
    reasonCode: string;
    severity: "watch" | "warning" | "critical";
    visibility: "public" | "private";
    provider: string;
    poolId: string;
    poolName: string;
    chain: string;
    assetPair: string;
    statusAfter: "active" | "resolved" | "superseded";
    visibleInActiveAlerts: boolean;
    visibilityReason: string;
  }[];
  poolResults: LpPoolCheckResult[];
  messages: string[];
}

export type RadarDashboardView = "oracle" | "bridge" | "unified" | "lp" | "service";

export interface RadarDashboardBootstrap {
  view: RadarDashboardView;
  alerts?: RadarAlert[];
  oracleAlerts?: RadarAlert[];
  bridgeAlerts?: RadarAlert[];
  lpAlerts?: RadarAlert[];
  runtimeStatus?: RadarRuntimeStatus | null;
  liveObjectsStatus?: RadarLiveObjectsStatus | null;
  dailyBrief?: RadarDailyBrief | null;
  latestBrief?: RadarDailyBriefRecord | null;
  latestSocialDelivery?: RadarSocialDeliveryRecord | null;
  oracleDiagnostics?: OracleActivationDiagnosticsResult | null;
  oracleCoverage?: OracleCoverageItem[] | null;
  oracleCoverageSummary?: OracleCoverageSummary | null;
  oracleReadiness?: OracleReadinessReport | null;
  oraclePilotDrill?: OraclePilotDrillReport | null;
  signalQuality?: RadarSignalQualitySnapshot | null;
  bridgeCoverage?: BridgeCoverageResponse | null;
  bridgeSignalQuality?: RadarSignalQualitySnapshot | null;
  clients?: RadarClient[];
  entitlementSummary?: RadarClientEntitlementSummary | null;
  watchlists?: RadarWatchlist[];
  watchlistMatches?: RadarWatchlistMatch[];
  deliveryDestinations?: RadarDeliveryDestination[];
  liveDeliveries?: RadarLiveDelivery[];
  errors: Record<string, string>;
}
