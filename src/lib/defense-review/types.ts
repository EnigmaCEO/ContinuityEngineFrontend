export type DefenseReviewStatus = "draft" | "in_review" | "report_ready" | "delivered" | "closed";

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
