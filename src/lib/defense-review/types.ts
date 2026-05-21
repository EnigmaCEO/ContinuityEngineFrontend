export type DefenseReviewStatus = "draft" | "in_review" | "report_ready" | "delivered" | "closed";
export type ScanStatus = "not_run" | "running" | "complete" | "partial" | "error";

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
  criticalFindingsCount: number;
  highFindingsCount: number;
  relevantThreatFamiliesCount: number;
  controlsCount: number;
  verifiedControlsCount: number;
  reportStatus: string;
  notes?: string | null;
  scanStatus: ScanStatus;
  lastScanAt?: string | null;
  scanChainsConfigured: number[];
  scanChainsUnconfigured: number[];
  scanNotes?: string | null;
  detectorRunCount: number;
}

export interface RunScanResponse {
  review: DefenseReview;
  findingsCreated: number;
  detectorsRan: number;
  chainsConfigured: number[];
  chainsUnconfigured: number[];
  rpcSources: Record<string, string>;
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
