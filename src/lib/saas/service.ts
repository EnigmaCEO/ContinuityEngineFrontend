import type {
  AccessRequest,
  Account,
  Membership,
  MembershipDetail,
  MembershipRole,
  SaasMeResponse,
  User,
} from "./types";

const API_BASE = "http://127.0.0.1:8000";
const SESSION_STORAGE_KEY = "sce_session_token";
let dashboardAdminFetchCount = 0;

function getSessionToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(SESSION_STORAGE_KEY);
}

function setSessionToken(token: string | null): void {
  if (typeof window === "undefined") return;
  if (!token) {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
    return;
  }
  window.localStorage.setItem(SESSION_STORAGE_KEY, token);
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const sessionToken = getSessionToken();
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(sessionToken ? { "X-SCE-Session": sessionToken } : {}),
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed with ${response.status}`);
  }
  return response.json() as Promise<T>;
}

async function apiWithDashboardLog<T>(path: string, init?: RequestInit): Promise<T> {
  const started = performance.now();
  const sessionToken = getSessionToken();
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(sessionToken ? { "X-SCE-Session": sessionToken } : {}),
      ...(init?.headers ?? {}),
    },
  });
  const text = await response.text();
  dashboardAdminFetchCount += 1;
  console.info(
    `[dashboard:admin] fetch=${dashboardAdminFetchCount} path=${path} status=${response.status} bytes=${text.length} ms=${Math.round(performance.now() - started)}`,
  );
  if (!response.ok) throw new Error(text || `Request failed with ${response.status}`);
  return JSON.parse(text) as T;
}

export async function login(email: string): Promise<SaasMeResponse> {
  const response = await api<SaasMeResponse>("/saas/login", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
  setSessionToken(response.sessionToken ?? null);
  return response;
}

export async function logout(): Promise<void> {
  await api("/saas/logout", { method: "POST" });
  setSessionToken(null);
}

export async function fetchMe(): Promise<SaasMeResponse> {
  return api<SaasMeResponse>("/saas/me", { cache: "no-store" });
}

export async function fetchAdminSummary(): Promise<{ accounts: number; users: number; accessRequests: number }> {
  return apiWithDashboardLog<{ accounts: number; users: number; accessRequests: number }>("/saas/admin-summary", { cache: "no-store" });
}

export async function requestAccess(payload: {
  name: string;
  email: string;
  organization: string;
  roleTitle?: string;
  useCase?: string;
}): Promise<AccessRequest> {
  return api<AccessRequest>("/saas/request-access", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function fetchAccounts(): Promise<Account[]> {
  const response = await api<{ items: Account[] }>("/saas/accounts", { cache: "no-store" });
  return response.items;
}

export async function createAccount(payload: {
  name: string;
  slug?: string;
  accountType: Account["accountType"];
  status: Account["status"];
}): Promise<Account> {
  return api<Account>("/saas/accounts", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function fetchUsers(): Promise<User[]> {
  const response = await api<{ items: User[] }>("/saas/users", { cache: "no-store" });
  return response.items;
}

export async function createUser(payload: {
  email: string;
  name: string;
  status: User["status"];
}): Promise<User> {
  return api<User>("/saas/users", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function fetchMemberships(): Promise<MembershipDetail[]> {
  const response = await api<{ items: MembershipDetail[] }>("/saas/memberships", { cache: "no-store" });
  return response.items;
}

export async function createMembership(payload: {
  accountId: string;
  userId: string;
  role: MembershipRole;
}): Promise<Membership> {
  return api<Membership>("/saas/memberships", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateMembershipRole(
  membershipId: string,
  role: MembershipRole,
): Promise<Membership> {
  return api<Membership>(`/saas/memberships/${membershipId}`, {
    method: "PATCH",
    body: JSON.stringify({ role }),
  });
}

export async function fetchAccessRequests(): Promise<AccessRequest[]> {
  const response = await api<{ items: AccessRequest[] }>("/saas/access-requests", { cache: "no-store" });
  return response.items;
}

export async function approveAccessRequest(
  requestId: string,
  payload: { accountId?: string; accountName?: string; role: MembershipRole; note?: string },
): Promise<void> {
  await api(`/saas/access-requests/${requestId}/approve`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function rejectAccessRequest(
  requestId: string,
  payload: { note?: string },
): Promise<void> {
  await api(`/saas/access-requests/${requestId}/reject`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
