export type DefenseReviewStatus = "draft" | "in_review" | "report_ready" | "delivered" | "closed";
export type ScanStatus = "not_run" | "running" | "complete" | "partial" | "error";
export type CandidateScopeState =
  | "no_candidates"
  | "candidates_pending_import"
  | "candidates_partially_imported"
  | "candidates_imported_scan_pending"
  | "candidates_imported_scan_complete";
export type ReviewWorkflowStatus =
  | "draft"
  | "intake_started"
  | "intake_submitted"
  | "assets_validated"
  | "scan_ready"
  | "scan_completed"
  | "evidence_requested"
  | "client_evidence_received"
  | "second_review_pending"
  | "second_review_completed"
  | "ready_for_delivery"
  | "delivered"
  | "revision_available"
  | "revision_completed"
  | "limited_review"
  | "paused_needs_evidence"
  | "failed_or_cancelled";
export type DeliveryStatus = "not_ready" | "ready" | "delivered" | "revision_pending" | "completed";
export type ReadinessStatus =
  | "ready_for_delivery"
  | "needs_evidence"
  | "thin_review"
  | "failed_or_paused"
  | "custom_scope_required";

export interface DefenseReview {
  id: string;
  projectId: string;
  projectName: string;
  accountId: string;
  status: DefenseReviewStatus;
  createdAt: string;
  updatedAt: string;
  assetsCount: number;
  findingsCount: number;
  supportingEvidenceReceiptsCount?: number;
  scanLimitationsCount?: number;
  candidateAssetsDiscoveredCount?: number;
  candidateScopeState?: CandidateScopeState;
  candidateCount?: number;
  importedCandidateCount?: number;
  alreadyMappedCandidateCount?: number;
  pendingCandidateCount?: number;
  mappedAssetCount?: number;
  scannedAssetCount?: number;
  scanCompleteForImportedAssets?: boolean;
  criticalFindingsCount: number;
  highFindingsCount: number;
  relevantThreatFamiliesCount: number;
  reportStatus: string;
  notes?: string | null;
  scanStatus: ScanStatus;
  lastScanAt?: string | null;
  scanChainsConfigured: number[];
  scanChainsUnconfigured: number[];
  scanNotes?: string | null;
  detectorRunCount: number;
  rpcConfigured?: boolean;
  rpcProvider?: string | null;
  rpcPreflightStatus?: string | null;
  detectorExecutionStatus?: string | null;
  rpcDetectorAttemptedCount?: number;
  rpcDetectorObservedCount?: number;
  rpcDetectorSuccessCount?: number;
  rpcDetectorUnresolvedCount?: number;
  rpcDetectorErrorCount?: number;
  rpcDetectorSkippedCount?: number;
  rpcDetectorErrorClassCounts?: Record<string, number>;
  rpcDetectorRetryCount?: number;
  rpcStatus?: string | null;
  sourceVerificationStatus?: string | null;
  sourceVerificationCheckedAssets?: number;
  sourceVerificationErrorAssets?: number;
  sourceVerificationMissingKeyChains?: number;
  sourceVerificationNotes?: string | null;
  customerContinuityRiskNarrative?: string | null;
  customerTopEvidenceGates?: CustomerTopEvidenceGate[];
  customerEvidenceRequested?: CustomerEvidenceRequestGroup[];
  customerPriorityRemediationRoadmap?: CustomerPriorityRemediationRoadmap;
  customerSourceAbiLimitationNote?: string | null;
  customerMappedAssetSourceAbiSummary?: CustomerDetectorEvidence[];
  customerDetectorEvidence?: CustomerDetectorEvidence[];
  customerReviewLimitation?: Record<string, unknown> | null;
  customerScopeNote?: string | null;
  customerDiscoveredCandidateAssets?: DiscoveredCandidateAsset[];
  customerProtocolSurfaceExpansion?: Record<string, unknown>;
  customerTimelockCanonicalization?: CustomerTimelockCanonicalization[];
  customerObservedPublicFacts?: string[];
  customerAuthoritySurfaceFindings?: CustomerTopEvidenceGate[];
  customerProtocolSpecificInterpretation?: string[];
  customerUnresolvedAssumptions?: string[];
  customerFollowUpScope?: string[];
  customerEvidenceStatus?: CustomerEvidenceStatus;
  workflowStatus?: ReviewWorkflowStatus;
  workflowStageLabel?: string;
  paidReviewType?: "starter_defense_review";
  reviewPriceUsd?: number;
  intakeCompletedAt?: string | null;
  assetsValidatedAt?: string | null;
  scanCompletedAt?: string | null;
  evidenceRequestedAt?: string | null;
  clientEvidenceReceivedAt?: string | null;
  secondReviewCompletedAt?: string | null;
  deliveredAt?: string | null;
  revisionDueAt?: string | null;
  revisionCompletedAt?: string | null;
  deliveryStatus?: DeliveryStatus;
  readinessStatus?: ReadinessStatus;
  intakeChecklist?: Record<string, boolean>;
  assetValidationSummary?: WorkflowAssetValidationSummary;
  reviewReadinessSummary?: ReviewReadinessSummary;
  evidenceRequestSnapshot?: CustomerEvidenceRequestGroup[];
  secondReviewChecklist?: Record<string, boolean>;
  secondReviewOutcome?: string | null;
  deliveryChecklist?: Record<string, boolean>;
  deliveredReportVersion?: string | null;
  deliveredReportUrl?: string | null;
}

export interface WorkflowAssetValidationSummary {
  validAssetCount?: number;
  valid_asset_count?: number;
  invalidAssetCount?: number;
  invalid_asset_count?: number;
  archivedAssetCount?: number;
  archived_asset_count?: number;
  warnings?: string[];
  blockers?: string[];
  readyForScan?: boolean;
  ready_for_scan?: boolean;
  [key: string]: unknown;
}

export interface ReviewReadinessSummary {
  readinessStatus?: ReadinessStatus | string;
  readiness_status?: ReadinessStatus | string;
  blockers?: string[];
  warnings?: string[];
  recommendedAction?: string;
  recommended_action?: string;
  thinReviewTriggers?: string[];
  thin_review_triggers?: string[];
  deliveryAllowed?: boolean;
  delivery_allowed?: boolean;
  secondReviewRequired?: boolean;
  second_review_required?: boolean;
  [key: string]: unknown;
}

export interface CustomerTopEvidenceGate {
  title?: string;
  whyItMatters?: string;
  evidenceBasis?: string;
  relatedAssets?: string[];
  evidenceState?: "verified" | "inferred" | "unresolved" | "evidence required" | "blocked by source/ABI" | string;
  priorityLabel?: "immediate" | "high" | "standard" | "blocked by evidence" | string;
  [key: string]: unknown;
}

export interface CustomerCapabilityControlSummaryRow {
  capabilityFamily?: string;
  relevantAssets?: string[];
  basis?: string;
  requiredControlEvidence?: string[];
  status?: string;
  [key: string]: unknown;
}

export interface CustomerEvidenceRequestGroup {
  category?: string;
  requests?: string[];
  [key: string]: unknown;
}

export interface CustomerPriorityRemediationRoadmap {
  immediate?: string[];
  next?: string[];
  followUp?: string[];
  [key: string]: unknown;
}

export interface CustomerEvidenceStatus {
  publicFactsObserved?: number;
  openAuthorityFindings?: number;
  supportingEvidenceReceipts?: number;
  unresolvedAssumptions?: number;
  followUpScopeItems?: number;
  clientOperatorEvidenceRequests?: number;
}

export interface CustomerDetectorEvidence {
  detector?: string;
  assetName?: string;
  evidenceSource?: string;
  method?: string;
  confidenceLabel?: string;
  observationStatus?: "observed" | "inferred" | "unresolved" | "evidence_required" | "error" | string;
  detectorStatus?: "OBSERVED" | "UNRESOLVED" | "ERROR" | "SKIPPED" | string;
  errorCategory?: string | null;
  observedValues?: Record<string, unknown>;
  storageSlotsUsed?: Record<string, string>;
  evidenceRequired?: string[];
  controlVerification?: "evidence_required" | string;
  nonClaim?: string;
  abiStatus?: string;
  sourceStatus?: string;
  contractName?: string | null;
  compilerVersion?: string | null;
  parsedAbiFunctionCount?: number | null;
  [key: string]: unknown;
}

export interface CustomerTimelockCanonicalization {
  canonical_asset_id: string;
  canonical_asset_name: string;
  canonical_role: string;
  related_asset_ids: string[];
  provenance_asset_ids: string[];
  canonicalization_reason: string;
  evidence_confidence: string;
  public_call_methods_observed: string[];
}

export interface DiscoveredCandidateAsset {
  candidate_id?: string;
  chain_id?: number;
  source_contract?: string;
  source_asset_id?: string;
  source_asset_name?: string;
  discovery_method?: string;
  function_used?: string;
  function_name?: string;
  function_signature?: string;
  discovered_address?: string;
  suggested_name?: string;
  display_name?: string;
  suggested_role?: string;
  confidence?: string;
  status?: string;
  evidence_basis?: string;
  safe_observed_value?: string;
  requires_operator_approval?: boolean;
  requires_operator_approval_import?: boolean;
  imported_at?: string | null;
  imported_asset_id?: string | null;
  import_note?: string | null;
}

export type CandidateImportStatus =
  | "candidate"
  | "approved_for_import"
  | "imported"
  | "already_mapped"
  | "rejected"
  | "skipped"
  | "failed";

export interface CandidateImportResult {
  candidateId: string;
  candidateStatus: CandidateImportStatus;
  importedAssetId?: string | null;
  importedAssetName?: string | null;
  alreadyMapped: boolean;
  skipped: boolean;
  safeMessage: string;
  role: string;
  addressShort: string;
  chainId: number;
  sourceFunction: string;
  confidence: string;
}

export interface CandidateBatchImportResponse {
  results: CandidateImportResult[];
  imported: number;
  alreadyMapped: number;
  skipped: number;
  failed: number;
}

export interface CandidateControlCheck {
  group?: string;
  title?: string;
  status?: "Pending Import" | "Pending Scan" | "Pending Policy Evidence" | "Evidence Required" | string;
}

// ─── Engine Intelligence types (v5.5) ───────────────────────────────────────

export interface ContractGraphNode {
  address?: string;
  name?: string;
  type?: string;
  nodeType?: string;
  chain?: string | number;
  verified?: boolean;
  label?: string;
  [key: string]: unknown;
}

export interface ContractGraphEdge {
  from?: string;
  fromAddress?: string;
  to?: string;
  toAddress?: string;
  relation?: string;
  relationshipType?: string;
  family?: string;
  relationshipFamily?: string;
  domain?: string;
  continuityDomain?: string;
  confidence?: string;
  evidenceSource?: string;
  [key: string]: unknown;
}

export interface ContractGraphSummary {
  nodesCount?: number;
  nodes_count?: number;
  edgesCount?: number;
  edges_count?: number;
  ownerEdgesCount?: number;
  owner_edges_count?: number;
  unresolvedEdgesCount?: number;
  unresolved_edges_count?: number;
  proxyEdgesCount?: number;
  proxy_edges_count?: number;
  abiRelationshipEdgesCount?: number;
  abi_relationship_edges_count?: number;
  sharedOwnerGroupsCount?: number;
  shared_owner_groups_count?: number;
  familyCounts?: Record<string, number>;
  family_counts?: Record<string, number>;
  [key: string]: unknown;
}

export interface BlastRadiusEvidenceReceipt {
  receiptType?: string;
  receipt_type?: string;
  title?: string;
  summary?: string;
  relationshipFamily?: string;
  relationship_family?: string;
  continuityDomain?: string;
  continuity_domain?: string;
  affectedAssets?: string[];
  affected_assets?: string[];
  evidenceBasis?: string[];
  evidence_basis?: string[];
  evidenceRequired?: string[];
  evidence_required?: string[];
  confidence?: string;
  controlVerification?: string;
  control_verification?: string;
  nonClaim?: string;
  non_claim?: string;
  [key: string]: unknown;
}

export interface BlastRadiusNarrativeSummary {
  headline?: string;
  keyPoints?: string[];
  key_points?: string[];
  evidenceLimits?: Record<string, unknown>;
  evidence_limits?: Record<string, unknown>;
  nextEvidenceGates?: string[];
  next_evidence_gates?: string[];
  nonClaims?: string[];
  non_claims?: string[];
  [key: string]: unknown;
}

export interface SourceVerificationChainStatus {
  chainId?: number;
  chain_id?: number;
  chain?: string;
  status?: string;
  assetsChecked?: number;
  assets_checked?: number;
  assetsVerified?: number;
  assets_verified?: number;
  assetsErrored?: number;
  assets_errored?: number;
  explorerSupported?: boolean;
  explorer_supported?: boolean;
  notes?: string;
  [key: string]: unknown;
}

export interface SourceVerificationHealthSummary {
  enabled?: boolean;
  overallStatus?: string;
  overall_status?: string;
  checkedAssets?: number;
  checked_assets?: number;
  verifiedAssets?: number;
  verified_assets?: number;
  errorAssets?: number;
  error_assets?: number;
  missingApiKeyAssets?: number;
  missing_api_key_assets?: number;
  chainsMissingApiKey?: number;
  chains_missing_api_key?: number;
  chainStatuses?: SourceVerificationChainStatus[];
  chain_statuses?: SourceVerificationChainStatus[];
  chains?: SourceVerificationChainStatus[];
  notes?: string;
  [key: string]: unknown;
}

export interface AbiRelationshipExtractionSummary {
  enabled?: boolean;
  assetsWithAbi?: number;
  assets_with_abi?: number;
  assetsChecked?: number;
  assets_checked?: number;
  functionsConsidered?: number;
  functions_considered?: number;
  callsAttempted?: number;
  calls_attempted?: number;
  callsSkipped?: number;
  calls_skipped?: number;
  relationshipsFound?: number;
  relationships_found?: number;
  skipped?: number;
  errors?: number;
  maxCallsPerAsset?: number;
  max_calls_per_asset?: number;
  maxCallsPerScan?: number;
  max_calls_per_scan?: number;
  [key: string]: unknown;
}

// ─── v6 Capability Extraction types ─────────────────────────────────────────

export type CapabilityFamily =
  | "upgrade_control"
  | "pause_control"
  | "treasury_movement"
  | "treasury_configuration"
  | "oracle_configuration"
  | "price_feed_control"
  | "role_management"
  | "access_control"
  | "ownership_transfer"
  | "keeper_operator_control"
  | "routing_control"
  | "settlement_control"
  | "reserve_configuration"
  | "fee_parameter_control"
  | "emergency_control"
  | "token_asset_control"
  | "governance_control"
  | "unknown_authority";

export type CapabilityConfidence =
  | "observed_from_abi"
  | "inferred_from_name"
  | "inferred_from_role"
  | "observed_from_finding"
  | "unresolved"
  | "error";

export type CapabilityControlVerification =
  | "not_applicable"
  | "incomplete"
  | "evidence_required";

export interface CapabilityObservation {
  capabilityId: string;
  capability_id?: string;
  assetId: string;
  asset_id?: string;
  assetName: string;
  asset_name?: string;
  assetAddress?: string | null;
  asset_address?: string | null;
  chainId?: number | null;
  chain_id?: number | null;
  capabilityFamily: CapabilityFamily;
  capability_family?: CapabilityFamily;
  capabilityName: string;
  capability_name?: string;
  functionName?: string | null;
  function_name?: string | null;
  functionSignature?: string | null;
  function_signature?: string | null;
  mutability?: string | null;
  accessHint?: string | null;
  access_hint?: string | null;
  roleHint?: string | null;
  role_hint?: string | null;
  evidenceSource: string;
  evidence_source?: string;
  detectionMethod: string;
  detection_method?: string;
  confidence: CapabilityConfidence;
  controlVerification: CapabilityControlVerification;
  control_verification?: CapabilityControlVerification;
  evidenceRequired: string[];
  evidence_required?: string[];
  notes?: string | null;
  [key: string]: unknown;
}

export interface CapabilitySummary {
  totalCapabilities: number;
  total_capabilities?: number;
  assetsWithCapabilities: number;
  assets_with_capabilities?: number;
  byFamily: Record<string, number>;
  by_family?: Record<string, number>;
  highAttentionFamilies: string[];
  high_attention_families?: string[];
  assetsWithUpgradeControl: string[];
  assets_with_upgrade_control?: string[];
  assetsWithPauseControl: string[];
  assets_with_pause_control?: string[];
  assetsWithTreasuryMovement: string[];
  assets_with_treasury_movement?: string[];
  assetsWithOracleConfiguration: string[];
  assets_with_oracle_configuration?: string[];
  assetsWithRoleManagement: string[];
  assets_with_role_management?: string[];
  assetsWithEmergencyControl: string[];
  assets_with_emergency_control?: string[];
  unresolvedCapabilityAssets: string[];
  unresolved_capability_assets?: string[];
  evidenceLimits: string[];
  evidence_limits?: string[];
  [key: string]: unknown;
}

export interface CapabilityExtractionMeta {
  enabled?: boolean;
  assetsChecked?: number;
  assets_checked?: number;
  assetsWithAbi?: number;
  assets_with_abi?: number;
  capabilitiesObservedFromAbi?: number;
  capabilities_observed_from_abi?: number;
  capabilitiesInferredFromRole?: number;
  capabilities_inferred_from_role?: number;
  totalCapabilities?: number;
  total_capabilities?: number;
  byFamily?: Record<string, number>;
  by_family?: Record<string, number>;
  evidenceLimits?: string[];
  evidence_limits?: string[];
  [key: string]: unknown;
}

// ─── v6.1 Capability Evidence Receipts + Narrative Summary ──────────────────

export type CapabilityReceiptType =
  | "capability_family"
  | "high_attention_capability"
  | "abi_observed_capability"
  | "role_inferred_capability"
  | "capability_coverage_limit"
  | "capability_evidence_limit";

export interface CapabilityEvidenceReceiptItem {
  capabilityName?: string;
  capability_name?: string;
  functionName?: string | null;
  function_name?: string | null;
  functionSignature?: string | null;
  function_signature?: string | null;
  confidence?: string;
  evidenceSource?: string;
  evidence_source?: string;
  [key: string]: unknown;
}

export interface CapabilityEvidenceReceipt {
  receiptId?: string;
  receipt_id?: string;
  receiptType?: CapabilityReceiptType | string;
  receipt_type?: CapabilityReceiptType | string;
  capabilityFamily?: string;
  capability_family?: string;
  title?: string;
  summary?: string;
  affectedAssets?: string[];
  affected_assets?: string[];
  capabilities?: CapabilityEvidenceReceiptItem[];
  confidence?: string;
  controlVerification?: string;
  control_verification?: string;
  evidenceRequired?: string[];
  evidence_required?: string[];
  nonClaim?: string;
  non_claim?: string;
  [key: string]: unknown;
}

export interface CapabilityNarrativeSummary {
  summaryVersion?: string;
  summary_version?: string;
  headline?: string;
  keyPoints?: string[];
  key_points?: string[];
  evidenceLimits?: string[];
  evidence_limits?: string[];
  nextEvidenceGates?: string[];
  next_evidence_gates?: string[];
  nonClaims?: string[];
  non_claims?: string[];
  [key: string]: unknown;
}

export type CapabilityControlMappingPriority = "high" | "medium" | "low";
export type CapabilityControlMappingConfidence =
  | "direct_family_match"
  | "role_context_match"
  | "inferred_mapping";
export type CapabilityControlMappingVerification =
  | "missing"
  | "incomplete"
  | "evidence_required";

export interface CapabilityControlMapping {
  mappingId?: string;
  mapping_id?: string;
  capabilityFamily?: string;
  capability_family?: string;
  controlId?: string;
  control_id?: string;
  controlTitle?: string;
  control_title?: string;
  controlCategory?: string;
  control_category?: string;
  controlDescription?: string;
  control_description?: string;
  assetId?: string;
  asset_id?: string;
  assetName?: string;
  asset_name?: string;
  assetRole?: string | null;
  asset_role?: string | null;
  evidenceRequired?: string[];
  evidence_required?: string[];
  mappingReason?: string;
  mapping_reason?: string;
  priority?: CapabilityControlMappingPriority;
  confidence?: CapabilityControlMappingConfidence;
  controlVerification?: CapabilityControlMappingVerification;
  control_verification?: CapabilityControlMappingVerification;
  sourceCapabilityIds?: string[];
  source_capability_ids?: string[];
}

export interface CapabilityControlSummary {
  totalMappings?: number;
  total_mappings?: number;
  highPriorityMappings?: number;
  high_priority_mappings?: number;
  mappedCapabilityFamilies?: string[];
  mapped_capability_families?: string[];
  unmappedCapabilityFamilies?: string[];
  unmapped_capability_families?: string[];
  assetsWithMappedControls?: string[];
  assets_with_mapped_controls?: string[];
  byControlCategory?: Record<string, number>;
  by_control_category?: Record<string, number>;
  byCapabilityFamily?: Record<string, number>;
  by_capability_family?: Record<string, number>;
  evidenceLimits?: string[];
  evidence_limits?: string[];
}

// ─── v6.3 Capability Prioritization types ───────────────────────────────────

export type CapabilityPriorityTier =
  | "urgent_evidence_gate"
  | "high"
  | "medium"
  | "low"
  | "blocked";

export type CapabilityEvidenceState =
  | "abi_observed"
  | "role_inferred"
  | "unresolved"
  | "blocked_by_source_verification"
  | "blocked_by_missing_evidence";

export interface CapabilityPriorityAuthorityContext {
  ownerType?: string | null;
  owner_type?: string | null;
  sharedOwnerGroup?: string | null;
  shared_owner_group?: string | null;
  authorityPathResolved?: boolean | null;
  authority_path_resolved?: boolean | null;
  unresolvedAuthority?: boolean;
  unresolved_authority?: boolean;
  [key: string]: unknown;
}

export interface CapabilityPriorityGraphContext {
  relationshipFamilies?: string[];
  relationship_families?: string[];
  blastRadiusNotes?: string[];
  blast_radius_notes?: string[];
  [key: string]: unknown;
}

export interface CapabilityPriorityItem {
  priorityId?: string;
  priority_id?: string;
  priorityItemId?: string;
  priority_item_id?: string;
  assetId?: string;
  asset_id?: string;
  assetName?: string;
  asset_name?: string;
  assetRole?: string | null;
  asset_role?: string | null;
  capabilityFamily?: string;
  capability_family?: string;
  controlTitle?: string;
  control_title?: string;
  priorityTier?: CapabilityPriorityTier | string;
  priority_tier?: CapabilityPriorityTier | string;
  priorityScore?: number;
  priority_score?: number;
  priorityReasons?: string[];
  priority_reasons?: string[];
  priorityReasoning?: string[] | string;
  priority_reasoning?: string[] | string;
  evidenceState?: CapabilityEvidenceState | string;
  evidence_state?: CapabilityEvidenceState | string;
  authorityContext?: CapabilityPriorityAuthorityContext;
  authority_context?: CapabilityPriorityAuthorityContext;
  graphContext?: CapabilityPriorityGraphContext;
  graph_context?: CapabilityPriorityGraphContext;
  evidenceRequired?: string[];
  evidence_required?: string[];
  nextStep?: string;
  next_step?: string;
  nextEvidenceStep?: string;
  next_evidence_step?: string;
  sourceMappingId?: string | null;
  source_mapping_id?: string | null;
  sourceCapabilityIds?: string[];
  source_capability_ids?: string[];
  controlVerification?: string;
  control_verification?: string;
  [key: string]: unknown;
}

export interface CapabilityPrioritySummary {
  totalPriorityItems?: number;
  total_priority_items?: number;
  totalItems?: number;
  total_items?: number;
  urgentEvidenceGateCount?: number;
  urgent_evidence_gate_count?: number;
  urgentCount?: number;
  urgent_count?: number;
  highPriorityCount?: number;
  high_priority_count?: number;
  highCount?: number;
  high_count?: number;
  mediumPriorityCount?: number;
  medium_priority_count?: number;
  mediumCount?: number;
  medium_count?: number;
  lowPriorityCount?: number;
  low_priority_count?: number;
  lowCount?: number;
  low_count?: number;
  blockedCount?: number;
  blocked_count?: number;
  topPriorityItems?: CapabilityPriorityItem[];
  top_priority_items?: CapabilityPriorityItem[];
  byCapabilityFamily?: Record<string, number>;
  by_capability_family?: Record<string, number>;
  byAsset?: Record<string, number>;
  by_asset?: Record<string, number>;
  byEvidenceState?: Record<string, number>;
  by_evidence_state?: Record<string, number>;
  evidenceLimits?: string[];
  evidence_limits?: string[];
  narrativeHeadline?: string;
  narrative_headline?: string;
  nextEvidenceGates?: string[];
  next_evidence_gates?: string[];
  [key: string]: unknown;
}

export interface RunScanResponse {
  review: DefenseReview;
  findingsCreated: number;
  detectorsRan: number;
  chainsConfigured: number[];
  chainsUnconfigured: number[];
  rpcSources: Record<string, string>;
  sourceVerification?: Record<string, number>;
  sourceVerificationHealth?: SourceVerificationHealthSummary;
  sourceVerificationHealthSummary?: SourceVerificationHealthSummary;
  contractGraphSummary?: ContractGraphSummary;
  contractGraph?: {
    nodes?: ContractGraphNode[];
    edges?: ContractGraphEdge[];
    summary?: ContractGraphSummary;
    [key: string]: unknown;
  };
  contractGraphBlastRadiusSummary?: BlastRadiusNarrativeSummary;
  blastRadiusEvidenceReceipts?: BlastRadiusEvidenceReceipt[];
  blastRadiusNarrativeSummary?: BlastRadiusNarrativeSummary;
  scanMetadata?: {
    abi_relationship_extraction?: AbiRelationshipExtractionSummary;
    capability_extraction?: CapabilityExtractionMeta;
    rpc_resolutions?: Record<string, {
      chain_id: number | null;
      provider: "explicit_env" | "moralis" | "public_fallback" | "unavailable";
      status: "configured" | "not_configured" | "unsupported_chain" | "missing_key";
      safe_message: string;
      is_fallback: boolean;
      redacted_url: string | null;
    }>;
    rpc_preflight_status?: "passed" | "failed" | "skipped";
    rpc_preflight_results?: Record<string, {
      status: "passed" | "failed" | "skipped";
      rpc_preflight_chain_id: string | null;
      rpc_preflight_block_number_present: boolean;
      rpc_preflight_error_class: string | null;
      rpc_preflight_message_safe: string;
    }>;
    detector_execution_status?: string;
    rpc_detector_error_class_counts?: Record<string, number>;
    rpc_detector_retry_count?: number;
    [key: string]: unknown;
  };
  capabilityObservations?: CapabilityObservation[];
  capabilitySummary?: CapabilitySummary;
  capabilityEvidenceReceipts?: CapabilityEvidenceReceipt[];
  capabilityNarrativeSummary?: CapabilityNarrativeSummary;
  capabilityControlMappings?: CapabilityControlMapping[];
  capabilityControlSummary?: CapabilityControlSummary;
  capabilityPriorityItems?: CapabilityPriorityItem[];
  capabilityPrioritySummary?: CapabilityPrioritySummary;
  customerContinuityRiskNarrative?: string | null;
  customerTopEvidenceGates?: CustomerTopEvidenceGate[];
  customerCapabilityControlSummary?: CustomerCapabilityControlSummaryRow[];
  customerEvidenceRequested?: CustomerEvidenceRequestGroup[];
  customerPriorityRemediationRoadmap?: CustomerPriorityRemediationRoadmap;
  customerSourceAbiLimitationNote?: string | null;
  customerMappedAssetSourceAbiSummary?: CustomerDetectorEvidence[];
  customerDetectorEvidence?: CustomerDetectorEvidence[];
  customerReviewLimitation?: Record<string, unknown> | null;
  customerScopeNote?: string | null;
  customerDiscoveredCandidateAssets?: DiscoveredCandidateAsset[];
  customerProtocolSurfaceExpansion?: Record<string, unknown>;
}

export interface DefenseReviewsResponse {
  items: DefenseReview[];
}

export interface CreateDefenseReviewRequest {
  projectId: string;
  notes?: string;
}

export interface UpdateDefenseReviewRequest {
  status?: DefenseReviewStatus;
  reportStatus?: string;
  notes?: string;
}

export interface SecondReviewRequest {
  outcome?: "approve" | "approve_with_edits" | "hold_for_evidence" | "convert_to_limited_review" | "fail_or_pause";
  checklist?: Record<string, boolean>;
  reviewerName?: string;
  notes?: string;
}

export interface MarkReadyForDeliveryRequest {
  deliveryChecklist?: Record<string, boolean>;
  deliveryChecklistPassed?: boolean;
  limitedReviewSelected?: boolean;
  sampleDelivery?: boolean;
}

export interface MarkDeliveredRequest {
  deliveredReportVersion?: string;
  deliveredReportUrl?: string;
}
