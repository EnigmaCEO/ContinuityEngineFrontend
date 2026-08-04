import type {
  CandidateBatchImportResponse,
  CandidateImportResult,
  CreateDefenseReviewRequest,
  DefenseReview,
  DefenseReviewsResponse,
  MarkDeliveredRequest,
  MarkReadyForDeliveryRequest,
  RunScanResponse,
  SecondReviewRequest,
  UpdateDefenseReviewRequest,
} from "./types";

const BASE = "/api/backend";

function headers(): HeadersInit {
  return {
    "Content-Type": "application/json",
  };
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { ...init, credentials: "include", headers: headers() });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

async function safeOperatorMutation<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    credentials: "include",
    headers: headers(),
  });
  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      throw new Error("You need operator access to perform this action.");
    }
    throw new Error("The requested action could not be completed safely.");
  }
  return res.json() as Promise<T>;
}

export async function fetchDefenseReviews(): Promise<DefenseReview[]> {
  const data = await api<DefenseReviewsResponse>("/defense-reviews");
  return data.items;
}

export async function fetchDefenseReview(reviewId: string): Promise<DefenseReview> {
  return api<DefenseReview>(`/defense-reviews/${reviewId}`);
}

export async function createDefenseReview(body: CreateDefenseReviewRequest): Promise<DefenseReview> {
  return api<DefenseReview>("/defense-reviews", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function updateDefenseReview(
  reviewId: string,
  body: UpdateDefenseReviewRequest,
): Promise<DefenseReview> {
  return api<DefenseReview>(`/defense-reviews/${reviewId}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function refreshDefenseReview(reviewId: string): Promise<DefenseReview> {
  return safeOperatorMutation<DefenseReview>(`/defense-reviews/${reviewId}/refresh`, {
    method: "POST",
  });
}

export async function runDefenseReviewScan(reviewId: string): Promise<RunScanResponse> {
  return safeOperatorMutation<RunScanResponse>(`/defense-reviews/${reviewId}/run-scan`, {
    method: "POST",
  });
}

export async function importDefenseReviewCandidate(
  projectId: string,
  candidateId: string,
): Promise<CandidateImportResult> {
  return safeOperatorMutation<CandidateImportResult>(
    `/projects/${projectId}/candidates/${candidateId}/import`,
    { method: "POST" },
  );
}

export async function importDefenseReviewCandidatesBatch(
  projectId: string,
  candidateIds: string[],
  allEligible = false,
): Promise<CandidateBatchImportResponse> {
  return safeOperatorMutation<CandidateBatchImportResponse>(
    `/projects/${projectId}/candidates/import-batch`,
    {
      method: "POST",
      body: JSON.stringify({ candidateIds, allEligible }),
    },
  );
}

export async function validateDefenseReviewAssets(reviewId: string): Promise<DefenseReview> {
  return api<DefenseReview>(`/defense-reviews/${reviewId}/workflow/validate-assets`, {
    method: "POST",
  });
}

export async function markEvidenceRequested(reviewId: string): Promise<DefenseReview> {
  return api<DefenseReview>(`/defense-reviews/${reviewId}/workflow/mark-evidence-requested`, {
    method: "POST",
  });
}

export async function completeSecondReview(
  reviewId: string,
  body: SecondReviewRequest,
): Promise<DefenseReview> {
  return api<DefenseReview>(`/defense-reviews/${reviewId}/workflow/second-review`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function markReadyForDelivery(
  reviewId: string,
  body: MarkReadyForDeliveryRequest,
): Promise<DefenseReview> {
  return api<DefenseReview>(`/defense-reviews/${reviewId}/workflow/mark-ready`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function markDelivered(
  reviewId: string,
  body: MarkDeliveredRequest,
): Promise<DefenseReview> {
  return api<DefenseReview>(`/defense-reviews/${reviewId}/workflow/mark-delivered`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}
