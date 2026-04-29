// ─── Core enumerations ────────────────────────────────────────────────────────

export type CaseSeverity = 'critical' | 'high' | 'medium' | 'low';

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
  cveCount:       number;
  cveRefs?:       string[];
  ingestedAt:     string;
  updatedAt:      string;
  tags?:          string[];
  confidence?:    number;
  outcome?:       string;
  // Multi-source attribution
  sources?:      string[];
  sourceRefs?:   CaseSourceReference[];
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

// ─── Summary stats ────────────────────────────────────────────────────────────

export interface CaseLibrarySummaryStats {
  activeRecords:            number;
  activeRecordsDelta:       number;
  newCvesAdded:             number;
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

export interface CaseLibraryMetrics {
  sourceBreakdown: SourceStat[];
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
    avgProcessTimeSec: number;
    lastSyncAt:        string;
  };
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
  'cveCount' | 'ingestedAt' | 'updatedAt'
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
  threatScore:          number;
  lastObservedAt:       string;
  summary:              string;
  topCases:             string[];
  doctrineTags:         string[];
  recommendedActions:   string[];
  continuityImplications:string[];
  replayGapExplanation: string;
  relatedSources:       string[];
}

export interface ThreatMatrixOverviewResponse {
  activeThreatFamilies: number;
  criticalExposure:     number;
  replayGaps:           number;
  highestThreatScore:   number;
  rows:                 ThreatMatrixRow[];
}
