import type {
  AdminSurfaceFinding,
  Project,
  ProjectAccountOverview,
  ProjectAsset,
  ProjectControl,
  ProjectControlGenerationResponse,
  ProjectControlStatus,
  ProjectControlVerificationResponse,
  ProjectIntakeRequest,
  ProjectIntakeResponse,
  ProjectRelevance,
  ProtocolMatrixIntakeRequest,
  ProtocolMatrixIntakeResponse,
  ScanAdminSurfaceResponse,
} from "./types";

const API_BASE = "http://127.0.0.1:8000";
const SESSION_STORAGE_KEY = "sce_session_token";
let projectDashboardFetchCount = 0;

function getSessionToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(SESSION_STORAGE_KEY);
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
  projectDashboardFetchCount += 1;
  console.info(
    `[dashboard:project-map] fetch=${projectDashboardFetchCount} path=${path} status=${response.status} bytes=${text.length} ms=${Math.round(performance.now() - started)}`,
  );
  if (!response.ok) throw new Error(text || `Request failed with ${response.status}`);
  return JSON.parse(text) as T;
}

function withLimit(path: string, limit = 100): string {
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}limit=${limit}`;
}

export async function fetchProjects(limit = 50): Promise<Project[]> {
  const response = await api<{ items: Project[] }>(withLimit("/projects", limit), { cache: "no-store" });
  return response.items;
}

export async function fetchProject(projectId: string): Promise<Project> {
  return api<Project>(`/projects/${projectId}`, { cache: "no-store" });
}

export async function fetchProjectAccountOverview(): Promise<ProjectAccountOverview> {
  return apiWithDashboardLog<ProjectAccountOverview>("/projects/overview", { cache: "no-store" });
}

export async function createProject(payload: {
  name: string;
  description?: string;
  environment: Project["environment"];
}): Promise<Project> {
  return api<Project>("/projects", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function fetchProjectAssets(projectId: string, limit = 100): Promise<ProjectAsset[]> {
  const response = await api<{ items: ProjectAsset[] }>(withLimit(`/projects/${projectId}/assets`, limit), { cache: "no-store" });
  return response.items;
}

export async function createProjectAsset(
  projectId: string,
  payload: {
    assetType: ProjectAsset["assetType"];
    name: string;
    chain?: string;
    network?: string;
    address?: string;
    url?: string;
    metadata: Record<string, unknown>;
  },
): Promise<ProjectAsset> {
  return api<ProjectAsset>(`/projects/${projectId}/assets`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function scanAdminSurface(projectId: string): Promise<ScanAdminSurfaceResponse> {
  return api<ScanAdminSurfaceResponse>(`/projects/${projectId}/scan-admin-surface`, {
    method: "POST",
  });
}

export async function fetchAdminSurfaceFindings(projectId: string, limit = 100): Promise<AdminSurfaceFinding[]> {
  const response = await api<{ items: AdminSurfaceFinding[] }>(
    withLimit(`/projects/${projectId}/admin-surface-findings`, limit),
    { cache: "no-store" },
  );
  return response.items;
}

export async function fetchProjectRelevance(projectId: string): Promise<ProjectRelevance> {
  return api<ProjectRelevance>(`/projects/${projectId}/relevance`, { cache: "no-store" });
}

export async function fetchProjectControls(projectId: string, limit = 100): Promise<ProjectControl[]> {
  const response = await api<{ items: ProjectControl[] }>(withLimit(`/projects/${projectId}/controls`, limit), { cache: "no-store" });
  return response.items;
}

export async function generateProjectControls(projectId: string): Promise<ProjectControlGenerationResponse> {
  return api<ProjectControlGenerationResponse>(`/projects/${projectId}/controls/generate`, {
    method: "POST",
  });
}

export async function updateProjectControl(
  projectId: string,
  controlId: string,
  payload: {
    status?: ProjectControlStatus;
    evidence?: Record<string, unknown>;
    evidenceProvided?: string | null;
    reviewerNotes?: string | null;
    assignedToUserId?: string | null;
    reviewerUserId?: string | null;
    dueDate?: string | null;
    verificationNotes?: string | null;
    verificationMethod?: ProjectControl["verificationMethod"];
  },
): Promise<ProjectControl> {
  return api<ProjectControl>(`/projects/${projectId}/controls/${controlId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function verifyProjectControl(
  projectId: string,
  controlId: string,
): Promise<ProjectControlVerificationResponse> {
  return api<ProjectControlVerificationResponse>(`/projects/${projectId}/controls/${controlId}/verify`, {
    method: "POST",
  });
}

export async function verifyAllProjectControls(projectId: string): Promise<ProjectControlVerificationResponse> {
  return api<ProjectControlVerificationResponse>(`/projects/${projectId}/controls/verify-all`, {
    method: "POST",
  });
}

export async function submitProjectIntake(payload: ProjectIntakeRequest): Promise<ProjectIntakeResponse> {
  return api<ProjectIntakeResponse>("/projects/intake", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function submitProtocolMatrixIntake(payload: ProtocolMatrixIntakeRequest): Promise<ProtocolMatrixIntakeResponse> {
  return api<ProtocolMatrixIntakeResponse>("/projects/intake/protocol-matrix", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
