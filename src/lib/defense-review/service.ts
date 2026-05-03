import type {
  CreateDefenseReviewRequest,
  DefenseReview,
  DefenseReviewsResponse,
  UpdateDefenseReviewRequest,
} from "./types";

const BASE = "http://127.0.0.1:8000";
const SESSION_STORAGE_KEY = "sce_session_token";

function sessionToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(SESSION_STORAGE_KEY);
}

function headers(): HeadersInit {
  const token = sessionToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { "X-SCE-Session": token } : {}),
  };
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { ...init, headers: headers() });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(text || `HTTP ${res.status}`);
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
  return api<DefenseReview>(`/defense-reviews/${reviewId}/refresh`, {
    method: "POST",
  });
}
