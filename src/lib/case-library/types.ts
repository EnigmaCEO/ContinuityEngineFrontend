// ─── Core enumerations ────────────────────────────────────────────────────────

export type CaseSeverity = 'critical' | 'high' | 'medium' | 'low';
export type CasePriorityBand = 'critical' | 'high' | 'medium' | 'low';

export type CaseStatus =
  | 'ingested'
  | 'normalized'
  | 'classified'
  | 'replay_ready'
  | 'doctrine_tagged'
  | 'verified'
  | 'needs_review'
  | 'raw_ingested'
  | 'failed_normalization'
  | 'failed_classification';

export type ReplayStatus = 'available' | 'missing' | 'passed' | 'failed' | 'pending';

export type DoctrineStatus = 'linked' | 'pending' | 'updated' | 'none';

export type HealthStatus    = 'healthy' | 'degraded' | 'sync_delay' | 'needs_review';
export type PipelineHealth  = 'healthy' | 'partial' | 'degraded' | 'offline';
export type LibraryMaturity = 'raw' | 'needs_enrichment' | 'enriched' | 'verified';

export type ActivityCategory =
  | 'ingest'
  | 'normalize'
  | 'classify'
  | 'replay'
  | 'doctrine'
  | 'sync'
  | 'error'
  | 'escalation';

export type ActivitySeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';

// ─── Source attribution ───────────────────────────────────────────────────────

export interface CaseSourceReference {
  source:        string;
  sourceType?:   string;
  externalId?:   string;
  referenceUrls?: string[];
  observedAt?:   string;
}

export type EpssPressureBand =
  | 'very_high_pressure'
  | 'high_pressure'
  | 'elevated_pressure'
  | 'baseline_pressure';

export interface CaseEnrichment {
  provider: string;
  kind: string;
  confidence: string;
  evidence: string[];
  payload: Record<string, unknown>;
}

// ─── Package intelligence (OSV / advisory enrichment) ────────────────────────

export interface AffectedPackage {
  package_name:   string;
  ecosystem:      string;
  version_ranges?: string[];
  fixed_versions?: string[];
  warnings?:       string[];
}

// ─── Core records ────────────────────────────────────────────────────────────

export interface CaseLibraryRecord {
  caseId:         string;
  rawId?:         string;
  title:          string;
  summary:        string;
  type:           string;
  source:         string;
  chainSystem:    string;
  subsystem?:     string;
  severity:       CaseSeverity;
  status:         CaseStatus;
  replayStatus:   ReplayStatus;
  doctrineStatus: DoctrineStatus;
  /** Verified response state, or the reason there isn't one. Computed server-side
   *  so no surface re-derives the conjunction — re-deriving it is how the two
   *  renderings drifted apart. */
  responseCoverageState?: string;
  cveCount:       number;
  cveRefs?:       string[];
  ingestedAt:     string;
  updatedAt:      string;
  tags?:          string[];
  confidence?:    number;
  outcome?:       string;
  priorityScore?:   number;
  priorityBand?:    CasePriorityBand;
  priorityReasons?: string[];
  // Multi-source attribution
  sources?:      string[];
  sourceRefs?:   CaseSourceReference[];
  // OSV / package intelligence enrichment
  aliases?:          string[];
  affectedPackages?: AffectedPackage[];
  caseEnrichments?:  CaseEnrichment[];
  // FIRST EPSS exploit-pressure enrichment. This is likelihood only, not exposure.
  epssScore?:        number | null;
  epssPercentile?:   number | null;
  epssDate?:         string | null;
  epssSource?:       'FIRST EPSS' | null;
  epssUpdatedAt?:    string | null;
  epssPressureBand?: EpssPressureBand | null;
  exploitPressureLabel?: string | null;
  // Doctrine enrichment (populated after enrich-doctrine)
  doctrineTags?:           string[];
  continuityImplications?: string[];
  recommendedActions?:     string[];
  replayEligibility?:      boolean;
  enrichmentSummary?:      string;
  enrichmentConfidence?:   number;
  // Replay fields (populated after run-replay)
  replaySummary?:      string;
  replayScenario?:     string;
  affectedInvariants?: string[];
  expectedControl?:    string;
  replayResult?:       string;
  replayConfidence?:   number;
  replayedAt?:         string;
}

// ─── Doctrine enrichment responses ────────────────────────────────────────────

export interface BatchEnrichmentResult {
  enriched: number;
  skipped:  number;
  failed:   number;
}

// ─── Replay responses ─────────────────────────────────────────────────────────

export interface BatchReplayResult {
  replayed: number;
  skipped:  number;
  failed:   number;
}

export interface EligibilityRefreshResult {
  updated: number;
  skipped: number;
  failed:  number;
}

// ─── Summary stats ────────────────────────────────────────────────────────────

export interface CaseLibrarySummaryStats {
  activeRecords:            number;
  activeRecordsDelta:       number;
  newCvesAdded:             number;
  /** Window the newCvesAdded figure covers. Ships with the number because it is
   *  deliberately NOT comparable to rawIngestsToday (24h) or a sync run's count. */
  newCvesWindowDays?:       number;
  healthStatus:             HealthStatus;    // backward-compat: mirrors pipelineHealth
  pipelineHealth:           PipelineHealth;
  libraryMaturity:          LibraryMaturity;
  normalizationSuccessRate: number;
  syncUptimePct:            number;
  pendingActions:           number;
  pendingReplayCount:       number;
  pendingDoctrineCount:     number;
  pendingReviewCount:       number;
  failedIngestionCount:     number;
  replayCoveragePct:        number;
  doctrineLinkedPct:        number;
  failedIngestions:         number;          // backward-compat alias
  lastSyncAt:               string;
}

// ─── Activity feed ────────────────────────────────────────────────────────────

export interface CaseLibraryActivityItem {
  id:        string;
  timestamp: string;
  category:  ActivityCategory;
  severity?: ActivitySeverity;
  message:   string;
  caseId?:   string;
  rawId?:    string;
}

// ─── Metrics panel ────────────────────────────────────────────────────────────

export interface SourceStat {
  source: string;
  count:  number;
  color:  string;
}

export interface SeverityStat {
  severity: CaseSeverity;
  count:    number;
}

export interface PriorityStat {
  priorityBand: CasePriorityBand;
  count:        number;
}

export interface CaseLibraryMetrics {
  sourceBreakdown: SourceStat[];
  priorityDistribution: PriorityStat[];
  severityDistribution: SeverityStat[];
  replayStats: {
    available:   number;
    missing:     number;
    passed:      number;
    failed:      number;
    pending:     number;
    coveragePct: number;
  };
  doctrineStats: {
    linked:     number;
    updated:    number;
    pending:    number;
    none:       number;
    linkedPct:  number;
  };
  ingestionStats: {
    rawIngestsToday:   number;
    normalizedToday:   number;
    failedIngestions:  number;
    pendingReview:     number;
    /** True when priority scoring has produced a queue nothing consumes — the
     *  White Team seam, rather than an empty backlog. */
    reviewQueueUnconsumed?: boolean;
    reviewQueueSeamNote?:   string | null;
    avgProcessTimeSec: number;
    lastSyncAt:        string;
  };
}

// ─── Provider status ─────────────────────────────────────────────────────────

export interface SourceProviderStatus {
  source:             string;
  sourceKey:          string;
  sourceType:         string;
  registered:         boolean;
  enabled:            boolean;
  lastRun?:           string;
  contributedRecords: number;
  lastError?:         string;
  lastWarning?:       string;
  lastActivityLine?:  string;
  tags:               string[];
  roles:              string[];
  description:        string;
}

// ─── Sync result ──────────────────────────────────────────────────────────────

export interface SourceRunResult {
  source:            string;
  sourceType:        string;
  evaluated:         number;
  added:             number;
  normalized:        number;
  classified:        number;
  duplicatesSkipped: number;
  sourcesMerged:     number;
  failed:            number;
  errorMessage?:     string;
  status:            string;
}

export interface SourceSyncResult {
  rawAdded:          number;
  normalized:        number;
  classified:        number;
  duplicatesSkipped: number;
  sourcesMerged:     number;
  failed:            number;
  lastSyncAt:        string;
  sourcesRun:        number;
  sourceResults:     SourceRunResult[];
}

// ─── Table query/response ─────────────────────────────────────────────────────

export type CaseLibraryTableSortKey = keyof Pick<
  CaseLibraryRecord,
  'caseId' | 'title' | 'type' | 'source' | 'chainSystem' |
  'severity' | 'status' | 'replayStatus' | 'doctrineStatus' |
  'cveCount' | 'priorityScore' | 'priorityBand' | 'ingestedAt' | 'updatedAt'
>;

export interface CaseLibraryTableParams {
  search?:         string;
  severity?:       CaseSeverity | '';
  type?:           string;
  source?:         string;
  chainSystem?:    string;
  replayStatus?:   ReplayStatus | '';
  doctrineStatus?: DoctrineStatus | '';
  status?:         CaseStatus | '';
  priorityBand?:   CasePriorityBand | '';
  ingestedFrom?:   string;  // YYYY-MM-DD
  ingestedTo?:     string;  // YYYY-MM-DD
  updatedFrom?:    string;  // YYYY-MM-DD
  updatedTo?:      string;  // YYYY-MM-DD
  page:            number;
  pageSize:        number;
  sortBy:          CaseLibraryTableSortKey;
  sortDir:         'asc' | 'desc';
}

export interface CaseLibraryTableResponse {
  items:    CaseLibraryRecord[];
  page:     number;
  pageSize: number;
  total:    number;
}

export interface ArchiveFacetOption {
  value: string;
  label: string;
  count: number;
}

export interface ArchiveFacetsResponse {
  sources:          ArchiveFacetOption[];
  severities:       ArchiveFacetOption[];
  types:            ArchiveFacetOption[];
  chains:           ArchiveFacetOption[];
  replayStatuses:   ArchiveFacetOption[];
  doctrineStatuses: ArchiveFacetOption[];
  caseStatuses:     ArchiveFacetOption[];
}

export interface CaseLibraryPageBootstrapResponse {
  summary:        CaseLibrarySummaryStats;
  activity:       CaseLibraryActivityItem[];
  metrics:        CaseLibraryMetrics;
  providerStatus: SourceProviderStatus[];
  /** Why provider contributions do not sum to the corpus total. Ships beside the
   *  provider table so the two figures explain each other instead of looking
   *  contradictory. */
  corpusReconciliation?: CorpusReconciliation | null;
  facets:         ArchiveFacetsResponse;
}

export interface DoctrineReplayCoverageStat {
  tag:           string;
  replayPassed:  number;
  replayMissing: number;
  coveragePct:   number;
}

export interface DoctrineTagRow {
  tag:                        string;
  caseCount:                  number;
  criticalCount:              number;
  highCount:                  number;
  replayPassed:               number;
  replayMissing:              number;
  confidenceAvg:              number;
  topRecommendedActions:      string[];
  topContinuityImplications:  string[];
  recommendedActions:         string[];
  continuityImplications:     string[];
  relatedCaseIds:             string[];
  relatedCaseCount:           number;
  sourceBreakdown?:           SourceContribution[];
  sourceConcentrated?:        boolean;
  concentrationNote?:         string | null;
  /** Newest case carrying this condition, so a row sampling stale cases cannot
   *  look current beside a library adding ~1,000 records a week. */
  newestCaseAt?:              string | null;
  replayGapSummary:           string;
  lastUpdated:                string;
}

export interface DoctrineOverviewResponse {
  totalDoctrineTags:            number;
  totalDoctrineCoveredCases:    number;
  totalReplayedDoctrineCases:   number;
  doctrineCoveragePct:          number;
  replayCoverageByDoctrineTag:  DoctrineReplayCoverageStat[];
  rows:                         DoctrineTagRow[];
}

export interface ThreatMatrixRow {
  threatFamily:         string;
  caseCount:            number;
  criticalCount:        number;
  highCount:            number;
  doctrineCoveragePct:  number;
  replayCoveragePct:    number;
  replayPassed:         number;
  replayMissing:        number;
  topDoctrineTags:      string[];
  topRecommendedActions:string[];
  topSources:           string[];
  /** Full decomposition of caseCount by contributing provider. An aggregate
   *  without its composition is honest about the corpus and misleading as a
   *  finding. */
  sourceBreakdown?:     SourceContribution[];
  /** True when one provider supplies >80% of this row — the figure then
   *  describes that provider's reach rather than the world. */
  sourceConcentrated?:  boolean;
  concentrationNote?:   string | null;
  lastObservedAt:       string;
  summary:              string;
  topCases:             string[];
  doctrineTags:         string[];
  recommendedActions:   string[];
  continuityImplications:string[];
  replayGapExplanation: string;
  relatedSources:       string[];
}

export interface CorpusReconciliation {
  providerContributions: number;
  corpusTotal:           number;
  deduplicated:          number;
  explanation:           string;
}

export interface SourceContribution {
  source:    string;
  count:     number;
  sharePct:  number;
}

export interface ThreatMatrixOverviewResponse {
  activeThreatFamilies: number;
  criticalExposure:     number;
  replayGaps:           number;
  rows:                 ThreatMatrixRow[];
}

export interface DashboardCriticalCase {
  caseId:            string;
  title:             string;
  severity:          CaseSeverity;
  source:            string;
  replayStatus:      ReplayStatus;
  replayEligibility: boolean;
  ingestedAt:        string;
  updatedAt:         string;
}

export interface DashboardCriticalIntelligence {
  timeframe:               '24h' | '7d' | '30d';
  criticalCount:           number;
  highCount:               number;
  seriousTotal:            number;
  replayableCount:         number;
  defendedCount:           number;
  defenseReadinessPct:     number;
  criticalReplayMissing:   number;
  highReplayMissing:       number;
  topThreatFamily:         string | null;
  latestSeriousCases:      DashboardCriticalCase[];
}

export interface DashboardOverviewResponse {
  summary:       CaseLibrarySummaryStats;
  metrics:       CaseLibraryMetrics;
  doctrine:      DoctrineOverviewResponse;
  threats:       ThreatMatrixOverviewResponse;
  activity:      CaseLibraryActivityItem[];
  criticalIntel: DashboardCriticalIntelligence;
}

export interface AdvisoryOverviewItem {
  id:                         string;
  title:                      string;
  source:                     string;
  severity:                   CaseSeverity;
  status:                     string;
  published_discovered_date:  string | null;
  replay_validation_state:    string;
  response_coverage_state:    string;
}

export interface AdvisoriesOverviewResponse {
  total_advisories:                    number;
  critical_advisories:                 number;
  high_advisories:                     number;
  medium_advisories:                   number;
  low_advisories:                      number;
  advisories_awaiting_validation:          number;
  validation_passed_advisories:         number;
  advisories_with_response_coverage:   number;
  recent_advisories:                   AdvisoryOverviewItem[];
  critical_ticker_items:              AdvisoryOverviewItem[];
}
