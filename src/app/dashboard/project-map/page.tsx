"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useMemo, useRef, useState } from "react";

import { useSession } from "@/components/layout/SessionContext";
import {
  archiveProject,
  createProject,
  createProjectAsset,
  fetchAdminSurfaceFindings,
  fetchProjectControls,
  fetchProjectAssets,
  fetchProjectRelevance,
  fetchProjects,
  generateProjectControls,
  scanAdminSurface,
  submitProjectIntake,
  submitProtocolMatrixIntake,
  updateProjectControl,
  verifyAllProjectControls,
  verifyProjectControl,
} from "@/lib/project-map/service";
import type { AdminSurfaceFinding, ContractEntry, Project, ProjectAsset, ProjectControl, ProjectControlStatus, ProjectIntakeResponse, ProjectRelevance, ProtocolMatrixIntakeResponse } from "@/lib/project-map/types";
import type { MembershipRole } from "@/lib/saas/types";
import { createDefenseReview, fetchDefenseReviews } from "@/lib/defense-review/service";

const GOLD = "#D4AF37";
const TEXT = "#E2E8F0";
const MUTED = "rgba(148,163,184,0.78)";
const PANEL: React.CSSProperties = {
  background: "rgba(10,12,18,0.92)",
  border: "1px solid rgba(212,175,55,0.12)",
  borderRadius: 8,
  padding: 14,
};

const severityOrder: Array<AdminSurfaceFinding["severity"]> = ["critical", "high", "medium", "low"];
const severityColors: Record<AdminSurfaceFinding["severity"], string> = {
  critical: "#EF4444",
  high: "#F97316",
  medium: GOLD,
  low: "#22C55E",
};

type TabKey = "assets" | "admin" | "threats" | "doctrine" | "controls";
type ProjectStats = {
  assetCount: number;
  openFindingCount: number;
  criticalCount: number;
  highCount: number;
  highestSeverity: AdminSurfaceFinding["severity"] | null;
  lastScanAt: string | null;
};

const emptyStats: ProjectStats = {
  assetCount: 0,
  openFindingCount: 0,
  criticalCount: 0,
  highCount: 0,
  highestSeverity: null,
  lastScanAt: null,
};
const controlStatuses: ProjectControlStatus[] = ["missing", "planned", "implemented", "verified", "not_applicable"];
const controlStatusColors: Record<ProjectControlStatus, string> = {
  missing: "#EF4444",
  planned: "#F97316",
  implemented: GOLD,
  verified: "#22C55E",
  not_applicable: MUTED,
};

function formatTag(value: string): string {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatDate(value?: string | null): string {
  if (!value) return "Not scanned";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not scanned";
  return date.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function highestSeverity(findings: AdminSurfaceFinding[]): AdminSurfaceFinding["severity"] | null {
  return severityOrder.find((severity) => findings.some((finding) => finding.severity === severity)) ?? null;
}

function assetAuthorityChips(asset: ProjectAsset): string[] {
  const metadata = asset.metadata as Record<string, unknown>;
  return [
    metadata.ownerType ? `owner: ${String(metadata.ownerType)}` : null,
    metadata.canUpgrade ? "upgrade" : null,
    metadata.canMoveFunds ? "treasury" : null,
    metadata.canMint ? "mint" : null,
    metadata.canPause ? "pause" : null,
    metadata.timelock ? "timelock" : null,
  ].filter(Boolean) as string[];
}

function canManageProjectsForRole(role: MembershipRole | null): boolean {
  return ["super_admin", "sce_operator", "account_owner", "security_admin", "client_admin"].includes(role ?? "");
}

function canEditAssetsForRole(role: MembershipRole | null): boolean {
  return [
    "super_admin",
    "sce_operator",
    "account_owner",
    "security_admin",
    "developer",
    "operations_lead",
    "client_admin",
    "client_member",
  ].includes(role ?? "");
}

function canRunScansForRole(role: MembershipRole | null): boolean {
  return ["super_admin", "sce_operator", "account_owner", "security_admin", "client_admin", "client_member"].includes(role ?? "");
}

function canGenerateControlsForRole(role: MembershipRole | null): boolean {
  return ["super_admin", "sce_operator", "account_owner", "security_admin", "client_admin"].includes(role ?? "");
}

function canSubmitEvidenceForRole(role: MembershipRole | null): boolean {
  return [
    "super_admin",
    "sce_operator",
    "account_owner",
    "security_admin",
    "developer",
    "operations_lead",
    "client_admin",
    "client_member",
  ].includes(role ?? "");
}

function canVerifyControlsForRole(role: MembershipRole | null): boolean {
  return ["super_admin", "sce_operator", "account_owner", "reviewer", "client_admin"].includes(role ?? "");
}

export default function ProjectMapPage() {
  const me = useSession();
  const router = useRouter();
  const role = me?.effectiveRole ?? me?.currentRole ?? null;
  const canManageProjects = canManageProjectsForRole(role);
  const canEditAssets = canEditAssetsForRole(role);
  const canScan = canRunScansForRole(role);
  const canGenerateControls = canGenerateControlsForRole(role);
  const canSubmitEvidence = canSubmitEvidenceForRole(role);
  const canVerifyControls = canVerifyControlsForRole(role);

  const [projects, setProjects] = useState<Project[]>([]);
  const [projectStats, setProjectStats] = useState<Record<string, ProjectStats>>({});
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [assets, setAssets] = useState<ProjectAsset[]>([]);
  const [findings, setFindings] = useState<AdminSurfaceFinding[]>([]);
  const [controls, setControls] = useState<ProjectControl[]>([]);
  const [relevance, setRelevance] = useState<ProjectRelevance | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [scanLoading, setScanLoading] = useState(false);
  const [controlsLoading, setControlsLoading] = useState(false);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [showAddAsset, setShowAddAsset] = useState(false);
  const [showIntakeForm, setShowIntakeForm] = useState(false);
  const [intakeLoading, setIntakeLoading] = useState(false);
  const [intakeResult, setIntakeResult] = useState<ProjectIntakeResponse | null>(null);
  const [showMatrixForm, setShowMatrixForm] = useState(false);
  const [matrixLoading, setMatrixLoading] = useState(false);
  const [matrixResult, setMatrixResult] = useState<ProtocolMatrixIntakeResponse | null>(null);
  const [matrixExtra, setMatrixExtra] = useState<Array<{ id: number; label: string; address: string }>>([]);
  const [activeTab, setActiveTab] = useState<TabKey>("assets");
  const [expandedFindings, setExpandedFindings] = useState<Set<string>>(new Set());
  const [highlightControlId, setHighlightControlId] = useState<string | null>(null);
  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [reviewLoading, setReviewLoading] = useState(false);
  const [archiveLoading, setArchiveLoading] = useState(false);

  const selectedProject = projects.find((project) => project.id === selectedProjectId) ?? null;
  const selectedStats = selectedProjectId ? projectStats[selectedProjectId] ?? emptyStats : emptyStats;

  async function loadProjectStats(nextProjects: Project[]) {
    const projectsForStats = nextProjects.slice(0, 25);
    const entries = await Promise.all(
      projectsForStats.map(async (project) => {
        try {
          const [projectAssets, projectFindings] = await Promise.all([
            fetchProjectAssets(project.id, 50),
            fetchAdminSurfaceFindings(project.id, 50),
          ]);
          const openFindings = projectFindings.filter((finding) => finding.status === "open");
          const lastScanAt = projectFindings.reduce<string | null>((latest, finding) => {
            if (!latest) return finding.updatedAt;
            return new Date(finding.updatedAt).getTime() > new Date(latest).getTime() ? finding.updatedAt : latest;
          }, null);
          return [
            project.id,
            {
              assetCount: projectAssets.filter((asset) => asset.status !== "archived").length,
              openFindingCount: openFindings.length,
              criticalCount: openFindings.filter((finding) => finding.severity === "critical").length,
              highCount: openFindings.filter((finding) => finding.severity === "high").length,
              highestSeverity: highestSeverity(openFindings),
              lastScanAt,
            },
          ] as const;
        } catch {
          return [project.id, emptyStats] as const;
        }
      }),
    );
    setProjectStats(Object.fromEntries(entries));
  }

  async function loadProjects(nextSelectedId?: string) {
    setLoading(true);
    setError("");
    try {
      const nextProjects = await fetchProjects(50);
      setProjects(nextProjects);
      void loadProjectStats(nextProjects);
      const resolvedId =
        nextSelectedId && nextProjects.some((project) => project.id === nextSelectedId)
          ? nextSelectedId
          : nextProjects[0]?.id ?? "";
      setSelectedProjectId(resolvedId);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Failed to load projects.");
      setProjects([]);
      setSelectedProjectId("");
    } finally {
      setLoading(false);
    }
  }

  async function loadProjectDetail(projectId: string, resetTab = true) {
    if (!projectId) {
      setAssets([]);
      setFindings([]);
      setControls([]);
      setRelevance(null);
      return;
    }
    setDetailLoading(true);
    setError("");
    try {
      const [nextAssets, nextFindings, nextRelevance, nextControls] = await Promise.all([
        fetchProjectAssets(projectId),
        fetchAdminSurfaceFindings(projectId),
        fetchProjectRelevance(projectId),
        fetchProjectControls(projectId, 100),
      ]);
      setAssets(nextAssets);
      setFindings(nextFindings);
      setRelevance(nextRelevance);
      setControls(nextControls);
      setExpandedFindings(new Set());
      if (resetTab) setActiveTab(nextFindings.length > 0 ? "admin" : "assets");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Failed to load project detail.");
      setAssets([]);
      setFindings([]);
      setControls([]);
      setRelevance(null);
    } finally {
      setDetailLoading(false);
    }
  }

  useEffect(() => {
    void loadProjects();
  }, []);

  useEffect(() => {
    void loadProjectDetail(selectedProjectId);
  }, [selectedProjectId]);

  const groupedFindings = useMemo(() => {
    return severityOrder
      .map((severity) => ({
        severity,
        items: findings.filter((item) => item.severity === severity),
      }))
      .filter((group) => group.items.length > 0);
  }, [findings]);

  const findingByAsset = useMemo(() => {
    const map = new Map<string, AdminSurfaceFinding[]>();
    findings.forEach((finding) => {
      if (!finding.assetId) return;
      map.set(finding.assetId, [...(map.get(finding.assetId) ?? []), finding]);
    });
    return map;
  }, [findings]);

  async function handleCreateProject(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    try {
      const project = await createProject({
        name: String(form.get("name") || ""),
        environment: String(form.get("environment") || "mainnet") as Project["environment"],
        description: String(form.get("description") || ""),
      });
      formElement.reset();
      setShowCreateProject(false);
      setMessage(`Project created: ${project.name}`);
      await loadProjects(project.id);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Failed to create project.");
    }
  }

  async function handleArchiveProject() {
    if (!selectedProject) return;
    const confirmed = window.confirm(
      `Archive "${selectedProject.name}"? It will be removed from the active project list. Its assets, findings, and review records will be retained.`,
    );
    if (!confirmed) return;

    setArchiveLoading(true);
    setError("");
    setMessage("");
    try {
      await archiveProject(selectedProject.id);
      setShowAddAsset(false);
      setMessage(`Project archived: ${selectedProject.name}`);
      await loadProjects();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Failed to archive project.");
    } finally {
      setArchiveLoading(false);
    }
  }

  async function handleIntake(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setIntakeResult(null);
    const form = new FormData(event.currentTarget);
    const contractAddress = String(form.get("contractAddress") || "").trim();
    if (!/^(0x[0-9a-fA-F]{40}|https?:\/\/.+\/address\/0x[0-9a-fA-F]{40}.*)$/i.test(contractAddress)) {
      setError("Enter a valid 0x contract address or a block-explorer URL containing one.");
      return;
    }
    setIntakeLoading(true);
    try {
      const result = await submitProjectIntake({
        projectName: String(form.get("projectName") || "").trim(),
        chain: String(form.get("chain") || "").trim(),
        contractAddress,
        network: String(form.get("network") || "").trim() || undefined,
        websiteUrl: String(form.get("websiteUrl") || "").trim() || undefined,
        docsUrl: String(form.get("docsUrl") || "").trim() || undefined,
        repoUrl: String(form.get("repoUrl") || "").trim() || undefined,
        notes: String(form.get("notes") || "").trim() || undefined,
        runScan: form.get("runScan") === "on",
      });
      setIntakeResult(result);
      setMessage(
        result.assetCreated
          ? `Project intake complete: ${result.project.name} mapped with ${result.assetsCount} asset(s).`
          : `Project intake complete: contract already mapped for this chain/address — no duplicate created.`,
      );
      await loadProjects(result.project.id);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Intake failed.");
    } finally {
      setIntakeLoading(false);
    }
  }

  async function handleMatrixIntake(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setMatrixResult(null);
    const form = new FormData(event.currentTarget);

    const fixedLabels = ["treasury", "vault", "escrow", "reserve", "goldoracle", "escrowkeeper"];
    const contracts: ContractEntry[] = [];

    for (const label of fixedLabels) {
      const address = String(form.get(`addr_${label}`) || "").trim();
      if (address) {
        if (!/^0x[0-9a-fA-F]{40}$/i.test(address)) {
          setError(`Invalid address for ${label}: ${address}. Use a 0x-prefixed 40-character hex address.`);
          return;
        }
        contracts.push({ label, address });
      }
    }

    for (const extra of matrixExtra) {
      const address = String(form.get(`extra_addr_${extra.id}`) || "").trim();
      const label = String(form.get(`extra_label_${extra.id}`) || extra.label).trim() || "other";
      if (address) {
        if (!/^0x[0-9a-fA-F]{40}$/i.test(address)) {
          setError(`Invalid address for ${label}: ${address}. Use a 0x-prefixed 40-character hex address.`);
          return;
        }
        contracts.push({ label, address });
      }
    }

    if (contracts.length === 0) {
      setError("Enter at least one contract address.");
      return;
    }

    setMatrixLoading(true);
    try {
      const result = await submitProtocolMatrixIntake({
        projectName: String(form.get("projectName") || "").trim(),
        chain: String(form.get("chain") || "").trim(),
        environment: String(form.get("environment") || "testnet") as "mainnet" | "testnet" | "staging" | "demo",
        websiteUrl: String(form.get("websiteUrl") || "").trim() || undefined,
        docsUrl: String(form.get("docsUrl") || "").trim() || undefined,
        repoUrl: String(form.get("repoUrl") || "").trim() || undefined,
        notes: String(form.get("notes") || "").trim() || undefined,
        contracts,
        runScan: form.get("runScan") === "on",
      });
      setMatrixResult(result);
      setMessage(
        `Protocol matrix import complete: ${result.assetsImported} asset(s) imported, ${result.assetsSkipped} duplicate(s) skipped.`,
      );
      await loadProjects(result.project.id);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Protocol matrix import failed.");
    } finally {
      setMatrixLoading(false);
    }
  }

  async function handleCreateAsset(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedProjectId) return;
    setError("");
    setMessage("");
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const metadata = {
      adminAddress: String(form.get("adminAddress") || "") || undefined,
      ownerType: String(form.get("ownerType") || "Unknown"),
      canUpgrade: form.get("canUpgrade") === "on",
      canMoveFunds: form.get("canMoveFunds") === "on",
      canMint: form.get("canMint") === "on",
      canPause: form.get("canPause") === "on",
      timelock: form.get("timelock") === "on",
      notes: String(form.get("notes") || "") || undefined,
    };

    try {
      await createProjectAsset(selectedProjectId, {
        assetType: String(form.get("assetType") || "other") as ProjectAsset["assetType"],
        name: String(form.get("name") || ""),
        chain: String(form.get("chain") || "") || undefined,
        network: String(form.get("network") || "") || undefined,
        address: String(form.get("address") || "") || undefined,
        url: String(form.get("url") || "") || undefined,
        metadata,
      });
      formElement.reset();
      setShowAddAsset(false);
      setMessage("Asset added.");
      await loadProjectDetail(selectedProjectId, false);
      void loadProjectStats(projects);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Failed to add asset.");
    }
  }

  async function handleScan() {
    if (!selectedProjectId) return;
    setScanLoading(true);
    setError("");
    setMessage("");
    try {
      const result = await scanAdminSurface(selectedProjectId);
      setMessage(`Admin surface scan completed: ${result.findingsCreated} findings.`);
      await loadProjectDetail(selectedProjectId);
      void loadProjectStats(projects);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Failed to scan admin surface.");
    } finally {
      setScanLoading(false);
    }
  }

  async function handleGenerateControls() {
    if (!selectedProjectId) return;
    setControlsLoading(true);
    setError("");
    setMessage("");
    try {
      const result = await generateProjectControls(selectedProjectId);
      setControls(result.controls);
      setMessage(`Controls generated: ${result.generated} new, ${result.updated} updated, ${result.skipped} skipped.`);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Failed to generate controls.");
    } finally {
      setControlsLoading(false);
    }
  }

  async function handleVerifyAllControls() {
    if (!selectedProjectId) return;
    setControlsLoading(true);
    setError("");
    setMessage("");
    try {
      const result = await verifyAllProjectControls(selectedProjectId);
      setControls(result.controls);
      setMessage(`Controls verified: ${result.verified} verified, ${result.implemented} implemented, ${result.unchanged} unchanged.`);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Failed to verify controls.");
    } finally {
      setControlsLoading(false);
    }
  }

  async function handleVerifyControl(controlId: string) {
    if (!selectedProjectId) return;
    setError("");
    setMessage("");
    try {
      const result = await verifyProjectControl(selectedProjectId, controlId);
      setControls(result.controls);
      setMessage(`Control verification: ${result.verified} verified, ${result.implemented} implemented, ${result.unchanged} unchanged.`);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Failed to verify control.");
    }
  }

  async function handleUpdateControl(
    controlId: string,
    payload: {
      status?: ProjectControlStatus;
      evidence?: Record<string, unknown>;
      evidenceProvided?: string | null;
      reviewerNotes?: string | null;
      verificationNotes?: string | null;
    },
  ) {
    if (!selectedProjectId) return;
    setError("");
    setMessage("");
    try {
      const updated = await updateProjectControl(selectedProjectId, controlId, payload);
      setControls((current) => current.map((control) => (control.id === updated.id ? updated : control)));
      setMessage("Control updated.");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Failed to update control.");
    }
  }

  function toggleFinding(findingId: string) {
    setExpandedFindings((current) => {
      const next = new Set(current);
      if (next.has(findingId)) next.delete(findingId);
      else next.add(findingId);
      return next;
    });
  }

  async function handleStartDefenseReview() {
    if (!selectedProjectId) return;
    setReviewLoading(true);
    setError("");
    setMessage("");
    try {
      // If an active review already exists the API returns it; otherwise creates one.
      const existing = await fetchDefenseReviews();
      const active = existing.find((r) => r.projectId === selectedProjectId && r.status !== "closed");
      if (active) {
        router.push(`/dashboard/defense-review/${active.id}`);
        return;
      }
      const review = await createDefenseReview({ projectId: selectedProjectId });
      router.push(`/dashboard/defense-review/${review.id}`);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Failed to start Defense Review.");
    } finally {
      setReviewLoading(false);
    }
  }

  const tabs: Array<{ key: TabKey; label: string }> = [
    { key: "assets", label: "Assets" },
    { key: "admin", label: "Admin Surface" },
    { key: "threats", label: "Relevant Threats" },
    { key: "doctrine", label: "Relevant Doctrine" },
    { key: "controls", label: "Controls" },
  ];

  return (
    <div style={{ padding: "22px 20px 32px", display: "grid", gap: 14 }}>
      <header style={{ ...PANEL, display: "grid", gap: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 18, alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 11, letterSpacing: "0.18em", color: "rgba(212,175,55,0.72)" }}>
              ACCOUNT OPERATIONS
            </div>
            <h1 style={{ margin: "8px 0 6px", fontSize: 30, color: TEXT }}>Project Map</h1>
            <p style={{ margin: 0, color: "rgba(203,213,225,0.72)", maxWidth: 920, lineHeight: 1.5, fontSize: 13 }}>
              Account-specific asset inventory, admin surface findings, and global SCE relevance.
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8, minWidth: 220 }}>
            <div style={{ textAlign: "right", display: "grid", gap: 5 }}>
              <div style={{ fontSize: 9, color: MUTED, letterSpacing: "0.1em" }}>CURRENT CONTEXT</div>
              <div style={{ fontSize: 13, color: TEXT, fontWeight: 800 }}>{me?.activeAccount?.name ?? "No active account"}</div>
              <div style={{ fontSize: 11, color: MUTED }}>{selectedProject?.name ?? "No project selected"}</div>
            </div>
            {canManageProjects ? (
              <div style={{ display: "flex", gap: 6 }}>
                <ActionButton
                  onClick={() => {
                    setShowIntakeForm((v) => !v);
                    if (!showIntakeForm) { setShowMatrixForm(false); setMatrixResult(null); }
                    setIntakeResult(null);
                    setError("");
                  }}
                >
                  {showIntakeForm ? "Close Intake" : "Import Project"}
                </ActionButton>
                <ActionButton
                  onClick={() => {
                    setShowMatrixForm((v) => !v);
                    if (!showMatrixForm) { setShowIntakeForm(false); setIntakeResult(null); }
                    setMatrixResult(null);
                    setMatrixExtra([]);
                    setError("");
                  }}
                >
                  {showMatrixForm ? "Close Matrix" : "Protocol Matrix"}
                </ActionButton>
              </div>
            ) : null}
          </div>
        </div>
        <div
          style={{
            border: "1px solid rgba(212,175,55,0.18)",
            borderRadius: 6,
            padding: "8px 10px",
            color: "#F5E7A1",
            background: "rgba(212,175,55,0.06)",
            fontSize: 12,
          }}
        >
          SCE never asks for private keys. Add only public addresses, URLs, metadata, and configuration details.
        </div>
      </header>

      {error ? <div style={{ ...PANEL, borderColor: "rgba(239,68,68,0.25)", color: "#FCA5A5" }}>{error}</div> : null}
      {message ? <div style={{ ...PANEL, borderColor: "rgba(34,197,94,0.24)", color: "#86EFAC" }}>{message}</div> : null}

      {showIntakeForm ? (
        <section style={{ ...PANEL, display: "grid", gap: 14 }}>
          <div>
            <div style={{ fontSize: 11, letterSpacing: "0.14em", color: "rgba(212,175,55,0.72)" }}>PROJECT INTAKE</div>
            <div style={{ marginTop: 4, fontSize: 18, fontWeight: 800, color: TEXT }}>Import from Contract Address</div>
            <div style={{ marginTop: 4, fontSize: 12, color: MUTED }}>
              Public-surface import only. SCE maps the address as a project asset and can run an authority scan on the submitted metadata. SCE does not control this contract.
            </div>
          </div>
          <form onSubmit={handleIntake} style={{ display: "grid", gap: 10 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <TextField label="Project Name *" name="projectName" required disabled={intakeLoading} />
              <TextField label="Chain / Network *" name="chain" required placeholder="ethereum, polygon, arbitrum…" disabled={intakeLoading} />
            </div>
            <TextField
              label="Contract Address or Explorer URL *"
              name="contractAddress"
              required
              placeholder="0x… or https://etherscan.io/address/0x…"
              disabled={intakeLoading}
            />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              <TextField label="Network (optional)" name="network" placeholder="mainnet, testnet…" disabled={intakeLoading} />
              <TextField label="Website URL (optional)" name="websiteUrl" placeholder="https://…" disabled={intakeLoading} />
              <TextField label="Docs URL (optional)" name="docsUrl" placeholder="https://docs.…" disabled={intakeLoading} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <TextField label="Repo / GitHub URL (optional)" name="repoUrl" placeholder="https://github.com/…" disabled={intakeLoading} />
              <TextAreaField label="Notes (optional)" name="notes" disabled={intakeLoading} />
            </div>
            <CheckField label="Run Admin Surface Scan after import" name="runScan" disabled={intakeLoading} />
            <div style={{ display: "flex", gap: 8 }}>
              <ActionButton type="submit" disabled={intakeLoading}>
                {intakeLoading ? "Importing…" : "Import Project"}
              </ActionButton>
              <ActionButton onClick={() => { setShowIntakeForm(false); setIntakeResult(null); }}>
                Cancel
              </ActionButton>
            </div>
          </form>

          {intakeResult ? (
            <div
              style={{
                borderTop: "1px solid rgba(212,175,55,0.16)",
                paddingTop: 14,
                display: "grid",
                gap: 10,
              }}
            >
              <div style={{ fontSize: 11, letterSpacing: "0.12em", color: "rgba(212,175,55,0.68)" }}>INTAKE RESULT</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                <div style={{ ...PANEL, padding: "10px 12px" }}>
                  <div style={{ fontSize: 9, color: MUTED, letterSpacing: "0.1em" }}>PROJECT</div>
                  <div style={{ marginTop: 4, fontSize: 13, fontWeight: 800, color: TEXT }}>{intakeResult.project.name}</div>
                  <div style={{ marginTop: 2, fontSize: 10, color: MUTED }}>{intakeResult.project.environment}</div>
                </div>
                <div style={{ ...PANEL, padding: "10px 12px" }}>
                  <div style={{ fontSize: 9, color: MUTED, letterSpacing: "0.1em" }}>MAPPED ASSET</div>
                  <div style={{ marginTop: 4, fontSize: 11, fontWeight: 800, color: TEXT, wordBreak: "break-all" }}>{intakeResult.asset.address}</div>
                  <div style={{ marginTop: 2, fontSize: 10, color: MUTED }}>{intakeResult.asset.chain}</div>
                  <Pill label={intakeResult.assetCreated ? "New" : "Existing"} color={intakeResult.assetCreated ? "#22C55E" : MUTED} />
                </div>
                <div style={{ ...PANEL, padding: "10px 12px" }}>
                  <div style={{ fontSize: 9, color: MUTED, letterSpacing: "0.1em" }}>SCAN STATUS</div>
                  {intakeResult.scanResult ? (
                    <>
                      <div style={{ marginTop: 4, fontSize: 13, fontWeight: 800, color: GOLD }}>Scanned</div>
                      <div style={{ marginTop: 2, fontSize: 11, color: TEXT }}>{intakeResult.scanResult.findingsCreated} finding(s) from {intakeResult.assetsCount} asset(s)</div>
                    </>
                  ) : (
                    <div style={{ marginTop: 4, fontSize: 13, fontWeight: 800, color: MUTED }}>Not scanned</div>
                  )}
                  <div style={{ marginTop: 4, fontSize: 10, color: MUTED }}>{intakeResult.findingsCount} total finding(s)</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowIntakeForm(false);
                    setIntakeResult(null);
                    setSelectedProjectId(intakeResult.project.id);
                  }}
                  style={linkButtonStyle}
                >
                  → Open in Project Map
                </button>
                {intakeResult.findingsCount > 0 ? (
                  <button
                    type="button"
                    onClick={() => {
                      setShowIntakeForm(false);
                      setIntakeResult(null);
                      setSelectedProjectId(intakeResult.project.id);
                      setActiveTab("admin");
                    }}
                    style={linkButtonStyle}
                  >
                    → View Findings ({intakeResult.findingsCount})
                  </button>
                ) : null}
                {intakeResult.findingsCount > 0 ? (
                  <button
                    type="button"
                    onClick={() => {
                      setShowIntakeForm(false);
                      setIntakeResult(null);
                      setSelectedProjectId(intakeResult.project.id);
                      setActiveTab("controls");
                    }}
                    style={linkButtonStyle}
                  >
                    → Controls
                  </button>
                ) : null}
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      {showMatrixForm ? (
        <ProtocolMatrixForm
          loading={matrixLoading}
          matrixExtra={matrixExtra}
          matrixResult={matrixResult}
          onSubmit={handleMatrixIntake}
          onCancel={() => { setShowMatrixForm(false); setMatrixResult(null); setMatrixExtra([]); }}
          onAddExtra={() => setMatrixExtra((prev) => [...prev, { id: Date.now(), label: "other", address: "" }])}
          onRemoveExtra={(id) => setMatrixExtra((prev) => prev.filter((e) => e.id !== id))}
          onOpenProject={(projectId) => {
            setShowMatrixForm(false);
            setMatrixResult(null);
            setMatrixExtra([]);
            setSelectedProjectId(projectId);
          }}
          onOpenTab={(projectId, tab) => {
            setShowMatrixForm(false);
            setMatrixResult(null);
            setMatrixExtra([]);
            setSelectedProjectId(projectId);
            setActiveTab(tab as TabKey);
          }}
          onStartDefenseReview={handleStartDefenseReview}
        />
      ) : null}

      <div style={{ display: "grid", gridTemplateColumns: "340px minmax(0, 1fr)", gap: 14, alignItems: "start" }}>
        <aside style={{ display: "grid", gap: 12 }}>
          <section style={{ ...PANEL, display: "grid", gap: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
              <div>
                <div style={{ fontSize: 11, letterSpacing: "0.12em", color: "rgba(212,175,55,0.68)" }}>
                  PROJECTS
                </div>
                <div style={{ marginTop: 3, fontSize: 20, fontWeight: 800, color: TEXT }}>
                  {loading ? "Loading..." : `${projects.length} mapped`}
                </div>
              </div>
              <ActionButton onClick={() => setShowCreateProject((value) => !value)} disabled={!canManageProjects}>
                {showCreateProject ? "Close" : "New"}
              </ActionButton>
            </div>

            {showCreateProject ? (
              <form onSubmit={handleCreateProject} style={{ display: "grid", gap: 9, opacity: canManageProjects ? 1 : 0.6 }}>
                <TextField label="Name" name="name" required disabled={!canManageProjects} />
                <SelectField
                  label="Environment"
                  name="environment"
                  disabled={!canManageProjects}
                  options={["mainnet", "testnet", "staging", "demo"]}
                />
                <TextAreaField label="Description" name="description" disabled={!canManageProjects} />
                <ActionButton type="submit" disabled={!canManageProjects}>
                  Create Project
                </ActionButton>
              </form>
            ) : null}

            <div style={{ display: "grid", gap: 8 }}>
              {projects.length === 0 && !loading ? (
                <EmptyState>Create a project to map account assets.</EmptyState>
              ) : null}
              {projects.map((project) => {
                const active = project.id === selectedProjectId;
                const stats = projectStats[project.id] ?? emptyStats;
                const severity = stats.highestSeverity;
                return (
                  <button
                    key={project.id}
                    onClick={() => setSelectedProjectId(project.id)}
                    style={{
                      textAlign: "left",
                      borderRadius: 8,
                      border: active ? "1px solid rgba(212,175,55,0.34)" : "1px solid rgba(212,175,55,0.08)",
                      background: active ? "rgba(212,175,55,0.09)" : "rgba(255,255,255,0.02)",
                      padding: 12,
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: TEXT }}>{project.name}</div>
                      <Pill label={project.environment} color={GOLD} />
                    </div>
                    <div style={{ marginTop: 8, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                      <MiniStat label="Assets" value={String(stats.assetCount)} />
                      <MiniStat label="Open" value={String(stats.openFindingCount)} />
                    </div>
                    <div style={{ marginTop: 8, display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
                      <span style={{ fontSize: 10, color: MUTED }}>{project.status.toUpperCase()}</span>
                      <span style={{ fontSize: 10, color: severity ? severityColors[severity] : MUTED, fontWeight: 800 }}>
                        {severity ? severity.toUpperCase() : "NO FINDINGS"}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          <section style={{ ...PANEL, display: "grid", gap: 10 }}>
            <div style={{ fontSize: 11, letterSpacing: "0.12em", color: "rgba(212,175,55,0.68)" }}>
              ASSET INVENTORY
            </div>
            {assets.length === 0 ? (
              <EmptyState>Add public asset metadata to begin zero-custody analysis.</EmptyState>
            ) : (
              <div style={{ display: "grid", gap: 8 }}>
                {assets.slice(0, 8).map((asset) => (
                  <div key={asset.id} style={{ borderTop: "1px solid rgba(212,175,55,0.08)", paddingTop: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                      <span style={{ fontSize: 12, color: TEXT, fontWeight: 800 }}>{asset.name}</span>
                      <span style={{ fontSize: 10, color: MUTED }}>{asset.assetType}</span>
                    </div>
                    <div style={{ marginTop: 3, fontSize: 10, color: MUTED }}>
                      {[asset.chain, asset.network].filter(Boolean).join(" / ") || "No chain"}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </aside>

        <main style={{ display: "grid", gap: 12 }}>
          {!selectedProject ? (
            <section style={PANEL}>
              <EmptyState>Create a project to map account assets.</EmptyState>
            </section>
          ) : (
            <>
              <section style={{ ...PANEL, display: "grid", gap: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 14, alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontSize: 11, letterSpacing: "0.12em", color: "rgba(212,175,55,0.68)" }}>
                      SELECTED PROJECT
                    </div>
                    <div style={{ marginTop: 5, fontSize: 24, fontWeight: 800, color: TEXT }}>
                      {selectedProject.name}
                    </div>
                    <div style={{ marginTop: 5, fontSize: 12, color: MUTED }}>
                      {selectedProject.description || "Assets, authority metadata, findings, and relevance are scoped to this account project."}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
                    <ActionButton onClick={() => setShowAddAsset((value) => !value)} disabled={!canEditAssets || !selectedProjectId}>
                      {showAddAsset ? "Close Asset Form" : "Add Asset"}
                    </ActionButton>
                    <ActionButton onClick={handleScan} disabled={!selectedProjectId || !canScan || scanLoading}>
                      {scanLoading ? "Scanning..." : "Scan Admin Surface"}
                    </ActionButton>
                    <ActionButton onClick={handleStartDefenseReview} disabled={!selectedProjectId || !canManageProjects || reviewLoading}>
                      {reviewLoading ? "Opening…" : "Start Defense Review"}
                    </ActionButton>
                    <ActionButton
                      onClick={handleArchiveProject}
                      disabled={!selectedProjectId || !canManageProjects || archiveLoading}
                      variant="danger"
                      title="Retain project history while removing it from the active list"
                    >
                      {archiveLoading ? "Archiving..." : "Archive Project"}
                    </ActionButton>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gap: 8 }}>
                  <Kpi label="Assets" value={String(assets.length)} />
                  <Kpi label="Open Findings" value={String(selectedStats.openFindingCount)} />
                  <Kpi label="Critical" value={String(selectedStats.criticalCount)} color="#EF4444" />
                  <Kpi label="High" value={String(selectedStats.highCount)} color="#F97316" />
                  <Kpi label="Families" value={String(relevance?.relevantThreatFamilies.length ?? 0)} />
                  <Kpi label="Relevance" value={String(relevance?.relevanceScore ?? 0)} />
                  <Kpi label="Last Scan" value={formatDate(selectedStats.lastScanAt)} compact />
                </div>

                {showAddAsset ? (
                  <form onSubmit={handleCreateAsset} style={{ display: "grid", gap: 10, opacity: canEditAssets ? 1 : 0.6 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
                      <SelectField
                        label="Asset Type"
                        name="assetType"
                        disabled={!canEditAssets || !selectedProjectId}
                        options={["contract", "proxy", "multisig", "timelock", "treasury", "oracle", "bridge", "keeper", "frontend", "dependency", "other"]}
                      />
                      <TextField label="Name" name="name" required disabled={!canEditAssets || !selectedProjectId} />
                      <TextField label="Chain" name="chain" disabled={!canEditAssets || !selectedProjectId} />
                      <TextField label="Network" name="network" disabled={!canEditAssets || !selectedProjectId} />
                      <TextField label="Address" name="address" disabled={!canEditAssets || !selectedProjectId} />
                      <TextField label="URL" name="url" disabled={!canEditAssets || !selectedProjectId} />
                      <TextField label="Owner / Admin Address" name="adminAddress" disabled={!canEditAssets || !selectedProjectId} />
                      <SelectField
                        label="Owner Type"
                        name="ownerType"
                        disabled={!canEditAssets || !selectedProjectId}
                        options={["EOA", "Multisig", "Timelock", "Unknown"]}
                      />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))", gap: 8 }}>
                      <CheckField label="Can Upgrade" name="canUpgrade" disabled={!canEditAssets || !selectedProjectId} />
                      <CheckField label="Can Move Funds" name="canMoveFunds" disabled={!canEditAssets || !selectedProjectId} />
                      <CheckField label="Can Mint" name="canMint" disabled={!canEditAssets || !selectedProjectId} />
                      <CheckField label="Can Pause" name="canPause" disabled={!canEditAssets || !selectedProjectId} />
                      <CheckField label="Timelock" name="timelock" disabled={!canEditAssets || !selectedProjectId} />
                    </div>
                    <TextAreaField label="Notes" name="notes" disabled={!canEditAssets || !selectedProjectId} />
                    <ActionButton type="submit" disabled={!canEditAssets || !selectedProjectId}>
                      Add Asset
                    </ActionButton>
                  </form>
                ) : null}
              </section>

              <section style={{ ...PANEL, display: "grid", gap: 12 }}>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {tabs.map((tab) => {
                    const active = activeTab === tab.key;
                    return (
                      <button
                        key={tab.key}
                        type="button"
                        onClick={() => setActiveTab(tab.key)}
                        style={{
                          border: `1px solid ${active ? "rgba(212,175,55,0.45)" : "rgba(212,175,55,0.12)"}`,
                          borderRadius: 6,
                          background: active ? "rgba(212,175,55,0.14)" : "rgba(255,255,255,0.02)",
                          color: active ? "#F5E7A1" : "rgba(203,213,225,0.82)",
                          padding: "8px 11px",
                          fontSize: 11,
                          fontWeight: 800,
                          cursor: "pointer",
                        }}
                      >
                        {tab.label}
                      </button>
                    );
                  })}
                  {detailLoading ? <span style={{ marginLeft: "auto", fontSize: 11, color: MUTED }}>Refreshing...</span> : null}
                </div>

                {activeTab === "assets" ? (
                  <AssetsTab assets={assets} findingByAsset={findingByAsset} />
                ) : null}

                {activeTab === "admin" ? (
                  <AdminSurfaceTab
                    assets={assets}
                    findings={findings}
                    controls={controls}
                    expandedFindings={expandedFindings}
                    onToggleFinding={toggleFinding}
                    onGoToControls={(controlId?: string) => {
                      setActiveTab("controls");
                      if (controlId) setHighlightControlId(controlId);
                    }}
                  />
                ) : null}

                {activeTab === "threats" ? <ThreatsTab relevance={relevance} findings={findings} /> : null}

                {activeTab === "doctrine" ? <DoctrineTab relevance={relevance} findings={findings} /> : null}

                {activeTab === "controls" ? (
                  <ControlsTab
                    assets={assets}
                    findings={findings}
                    controls={controls}
                    canGenerate={canGenerateControls}
                    canSubmitEvidence={canSubmitEvidence}
                    canVerify={canVerifyControls}
                    loading={controlsLoading}
                    highlightControlId={highlightControlId}
                    onGenerate={handleGenerateControls}
                    onVerifyAll={handleVerifyAllControls}
                    onVerify={handleVerifyControl}
                    onUpdate={handleUpdateControl}
                    onClearHighlight={() => setHighlightControlId(null)}
                  />
                ) : null}
              </section>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

const MATRIX_LABELS: Array<{ key: string; display: string }> = [
  { key: "treasury", display: "Treasury" },
  { key: "vault", display: "Vault" },
  { key: "escrow", display: "Escrow" },
  { key: "reserve", display: "Reserve" },
  { key: "goldoracle", display: "GoldOracle" },
  { key: "escrowkeeper", display: "EscrowKeeper" },
];

function ProtocolMatrixForm({
  loading,
  matrixExtra,
  matrixResult,
  onSubmit,
  onCancel,
  onAddExtra,
  onRemoveExtra,
  onOpenProject,
  onOpenTab,
  onStartDefenseReview,
}: {
  loading: boolean;
  matrixExtra: Array<{ id: number; label: string; address: string }>;
  matrixResult: ProtocolMatrixIntakeResponse | null;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
  onAddExtra: () => void;
  onRemoveExtra: (id: number) => void;
  onOpenProject: (projectId: string) => void;
  onOpenTab: (projectId: string, tab: string) => void;
  onStartDefenseReview: () => void;
}) {
  return (
    <section style={{ ...PANEL, display: "grid", gap: 14 }}>
      <div>
        <div style={{ fontSize: 11, letterSpacing: "0.14em", color: "rgba(212,175,55,0.72)" }}>PROTOCOL ADDRESS MATRIX</div>
        <div style={{ marginTop: 4, fontSize: 18, fontWeight: 800, color: TEXT }}>Multi-Contract Protocol Import</div>
        <div style={{ marginTop: 4, fontSize: 12, color: MUTED }}>
          Public-surface import only. SCE maps labeled contract addresses as project assets and runs authority analysis on submitted metadata.
          SCE does not control these contracts, hold keys, or execute transactions.
        </div>
      </div>

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <TextField label="Project Name *" name="projectName" required disabled={loading} />
          <TextField label="Chain / Network *" name="chain" required placeholder="ethereum, polygon, arbitrum…" disabled={loading} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          <SelectField label="Environment" name="environment" options={["testnet", "mainnet", "staging", "demo"]} disabled={loading} />
          <TextField label="Website URL (optional)" name="websiteUrl" placeholder="https://…" disabled={loading} />
          <TextField label="Docs URL (optional)" name="docsUrl" placeholder="https://docs.…" disabled={loading} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <TextField label="Repo / GitHub URL (optional)" name="repoUrl" placeholder="https://github.com/…" disabled={loading} />
          <TextAreaField label="Notes (optional)" name="notes" disabled={loading} />
        </div>

        <div>
          <div style={{ fontSize: 11, letterSpacing: "0.12em", color: "rgba(212,175,55,0.68)", marginBottom: 8 }}>
            CONTRACT ADDRESS MATRIX — enter public addresses only
          </div>
          <div style={{ display: "grid", gap: 7 }}>
            {MATRIX_LABELS.map(({ key, display }) => (
              <div key={key} style={{ display: "grid", gridTemplateColumns: "140px minmax(0, 1fr)", gap: 10, alignItems: "center" }}>
                <span style={{ fontSize: 12, color: TEXT, fontWeight: 700 }}>{display}</span>
                <input
                  name={`addr_${key}`}
                  placeholder="0x… (optional)"
                  disabled={loading}
                  style={fieldStyle(loading)}
                />
              </div>
            ))}
            {matrixExtra.map((extra) => (
              <div key={extra.id} style={{ display: "grid", gridTemplateColumns: "140px minmax(0, 1fr) 32px", gap: 10, alignItems: "center" }}>
                <input
                  name={`extra_label_${extra.id}`}
                  defaultValue={extra.label}
                  placeholder="Label"
                  disabled={loading}
                  style={fieldStyle(loading)}
                />
                <input
                  name={`extra_addr_${extra.id}`}
                  placeholder="0x… (optional)"
                  disabled={loading}
                  style={fieldStyle(loading)}
                />
                <button
                  type="button"
                  onClick={() => onRemoveExtra(extra.id)}
                  disabled={loading}
                  style={{ background: "transparent", border: "none", color: MUTED, cursor: "pointer", fontSize: 16, padding: 0 }}
                >
                  ×
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={onAddExtra}
              disabled={loading}
              style={{ ...linkButtonStyle, fontSize: 11, paddingTop: 4 }}
            >
              + Add Contract
            </button>
          </div>
        </div>

        <CheckField label="Run Admin Surface Scan after import" name="runScan" disabled={loading} />
        <div style={{ display: "flex", gap: 8 }}>
          <ActionButton type="submit" disabled={loading}>
            {loading ? "Importing…" : "Import Protocol Matrix"}
          </ActionButton>
          <ActionButton onClick={onCancel}>Cancel</ActionButton>
        </div>
      </form>

      {matrixResult ? (
        <div style={{ borderTop: "1px solid rgba(212,175,55,0.16)", paddingTop: 14, display: "grid", gap: 12 }}>
          <div style={{ fontSize: 11, letterSpacing: "0.12em", color: "rgba(212,175,55,0.68)" }}>IMPORT RESULT</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
            <div style={{ ...PANEL, padding: "10px 12px" }}>
              <div style={{ fontSize: 9, color: MUTED, letterSpacing: "0.1em" }}>PROJECT</div>
              <div style={{ marginTop: 4, fontSize: 13, fontWeight: 800, color: TEXT }}>{matrixResult.project.name}</div>
              <div style={{ marginTop: 2, fontSize: 10, color: MUTED }}>{matrixResult.project.environment} / {matrixResult.project.status}</div>
            </div>
            <div style={{ ...PANEL, padding: "10px 12px" }}>
              <div style={{ fontSize: 9, color: MUTED, letterSpacing: "0.1em" }}>ASSETS</div>
              <div style={{ marginTop: 4, fontSize: 20, fontWeight: 800, color: "#22C55E" }}>{matrixResult.assetsImported}</div>
              <div style={{ marginTop: 2, fontSize: 10, color: MUTED }}>Mapped</div>
              {matrixResult.assetsSkipped > 0 ? (
                <div style={{ marginTop: 2, fontSize: 10, color: MUTED }}>{matrixResult.assetsSkipped} duplicate(s) skipped</div>
              ) : null}
            </div>
            <div style={{ ...PANEL, padding: "10px 12px" }}>
              <div style={{ fontSize: 9, color: MUTED, letterSpacing: "0.1em" }}>AUTHORITY RISKS</div>
              {matrixResult.scanResult ? (
                <>
                  <div style={{ marginTop: 4, fontSize: 20, fontWeight: 800, color: matrixResult.findingsCount > 0 ? "#F97316" : "#22C55E" }}>
                    {matrixResult.findingsCount}
                  </div>
                  <div style={{ marginTop: 2, fontSize: 10, color: MUTED }}>Findings</div>
                </>
              ) : (
                <div style={{ marginTop: 4, fontSize: 13, fontWeight: 800, color: MUTED }}>Scan not run</div>
              )}
            </div>
            <div style={{ ...PANEL, padding: "10px 12px" }}>
              <div style={{ fontSize: 9, color: MUTED, letterSpacing: "0.1em" }}>SCAN STATUS</div>
              {matrixResult.scanResult ? (
                <>
                  <div style={{ marginTop: 4, fontSize: 13, fontWeight: 800, color: GOLD }}>Scanned</div>
                  <div style={{ marginTop: 2, fontSize: 10, color: MUTED }}>{matrixResult.scanResult.findingsCreated} finding(s) across {matrixResult.totalAssets} asset(s)</div>
                </>
              ) : (
                <div style={{ marginTop: 4, fontSize: 13, fontWeight: 800, color: MUTED }}>Not scanned</div>
              )}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 10, color: MUTED, letterSpacing: "0.08em", marginBottom: 8 }}>IMPORTED ASSETS BY LABEL</div>
            <div style={{ display: "grid", gap: 5 }}>
              {matrixResult.importedAssets.map((asset) => (
                <div
                  key={asset.assetId}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "120px minmax(0, 1fr) 70px",
                    gap: 10,
                    alignItems: "center",
                    border: "1px solid rgba(212,175,55,0.08)",
                    borderRadius: 6,
                    padding: "7px 10px",
                    background: "rgba(255,255,255,0.02)",
                  }}
                >
                  <span style={{ fontSize: 11, color: GOLD, fontWeight: 800 }}>{asset.label.toUpperCase()}</span>
                  <span style={{ fontSize: 10, color: TEXT, wordBreak: "break-all" }}>{asset.address}</span>
                  <Pill label={asset.created ? "Mapped" : "Existing"} color={asset.created ? "#22C55E" : MUTED} />
                </div>
              ))}
            </div>
          </div>

          <div style={{ fontSize: 10, color: MUTED, fontStyle: "italic" }}>
            Public-surface mapping only. SCE does not control these contracts, wallets, keys, or upgrades.
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <button type="button" onClick={() => onOpenProject(matrixResult.project.id)} style={linkButtonStyle}>
              → Project Map
            </button>
            {matrixResult.findingsCount > 0 ? (
              <button type="button" onClick={() => onOpenTab(matrixResult.project.id, "admin")} style={linkButtonStyle}>
                → Admin Surface ({matrixResult.findingsCount} Findings)
              </button>
            ) : null}
            {matrixResult.findingsCount > 0 ? (
              <button type="button" onClick={() => onOpenTab(matrixResult.project.id, "controls")} style={linkButtonStyle}>
                → Controls Recommended
              </button>
            ) : null}
            <button type="button" onClick={() => onOpenTab(matrixResult.project.id, "threats")} style={linkButtonStyle}>
              → Relevant Threats
            </button>
            <button
              type="button"
              onClick={onStartDefenseReview}
              style={{ ...linkButtonStyle, color: GOLD, fontWeight: 800 }}
            >
              → Create / Open Defense Review
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function AssetsTab({
  assets,
  findingByAsset,
}: {
  assets: ProjectAsset[];
  findingByAsset: Map<string, AdminSurfaceFinding[]>;
}) {
  if (assets.length === 0) return <EmptyState>Add public asset metadata to begin zero-custody analysis.</EmptyState>;

  return (
    <div style={{ display: "grid", gap: 8 }}>
      {assets.map((asset) => {
        const assetFindings = findingByAsset.get(asset.id) ?? [];
        const severity = highestSeverity(assetFindings);
        const chips = assetAuthorityChips(asset);
        const metadata = asset.metadata as Record<string, unknown>;
        return (
          <div
            key={asset.id}
            style={{
              display: "grid",
              gridTemplateColumns: "0.7fr 1.1fr 0.8fr 1.3fr 0.45fr",
              gap: 12,
              alignItems: "center",
              border: "1px solid rgba(212,175,55,0.08)",
              borderRadius: 8,
              padding: "11px 12px",
              background: "rgba(255,255,255,0.02)",
            }}
          >
            <div>
              <div style={{ fontSize: 10, color: MUTED, letterSpacing: "0.08em" }}>TYPE</div>
              <div style={{ marginTop: 3, fontSize: 12, color: TEXT, fontWeight: 800 }}>{asset.assetType}</div>
            </div>
            <div>
              <div style={{ fontSize: 13, color: TEXT, fontWeight: 800 }}>{asset.name}</div>
              <div style={{ marginTop: 3, fontSize: 10, color: MUTED, wordBreak: "break-all" }}>
                {asset.address || asset.url || "No public address or URL"}
              </div>
            </div>
            <div style={{ fontSize: 11, color: MUTED }}>
              {[asset.chain, asset.network].filter(Boolean).join(" / ") || "No chain"}
              <div style={{ marginTop: 3, color: "rgba(203,213,225,0.78)" }}>
                {metadata.ownerType ? `Owner: ${String(metadata.ownerType)}` : "Owner: Unknown"}
              </div>
            </div>
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
              {chips.length > 0 ? chips.map((chip) => <Pill key={chip} label={chip} color="#93C5FD" />) : <span style={{ fontSize: 11, color: MUTED }}>No authority metadata</span>}
            </div>
            <div style={{ textAlign: "right" }}>
              <span style={{ fontSize: 10, color: severity ? severityColors[severity] : MUTED, fontWeight: 800 }}>
                {severity ? severity.toUpperCase() : "CLEAR"}
              </span>
              <div style={{ marginTop: 3, fontSize: 10, color: MUTED }}>{assetFindings.length} findings</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Finding category sets ────────────────────────────────────────────────────
const _AUTHORITY_RISK_TYPES = new Set([
  "owner_eoa", "upgrade_authority", "treasury_authority", "mint_authority", "proxy_admin", "role_concentration",
  "treasury_movement_authority", "treasury_allocation_authority", "treasury_role_concentration",
  "vault_deposit_withdrawal_authority",
  "escrow_settlement_authority", "escrow_fund_routing", "escrow_role_concentration",
  "reserve_custody_authority", "reserve_rebalance_authority", "reserve_role_concentration",
  "oracle_price_feed_authority", "oracle_manipulation_risk", "oracle_update_authority",
  "keeper_execution_authority",
]);
const _CONTINUITY_RISK_TYPES = new Set([
  "missing_timelock", "pause_authority", "unknown_admin",
  "treasury_emergency_freeze", "treasury_timelock_required",
  "vault_pause_authority", "vault_upgrade_authority", "vault_lock_parameter_authority", "vault_timelock_required",
  "escrow_batch_finalization", "escrow_keeper_dependency",
  "reserve_insurance_parameter",
  "oracle_stale_price_risk", "oracle_fallback_authority",
  "keeper_trigger_authority", "keeper_failure_behavior", "keeper_continuity_risk",
]);

function _findingEvidenceRequired(finding: AdminSurfaceFinding): string[] {
  const ev = finding.evidence as Record<string, unknown>;
  if (Array.isArray(ev.evidenceRequired) && (ev.evidenceRequired as unknown[]).length > 0) {
    return ev.evidenceRequired as string[];
  }
  const act = finding.recommendedActions[0] ?? "";
  const prefix = "Evidence required: ";
  if (act.startsWith(prefix)) {
    return act.slice(prefix.length).replace(/\.$/, "").split(", ").filter(Boolean);
  }
  return [];
}

function _findingRemediation(finding: AdminSurfaceFinding): string {
  for (const act of finding.recommendedActions) {
    if (act.startsWith("Recommended remediation: ")) return act.slice("Recommended remediation: ".length);
    if (act.startsWith("Remediation: ")) return act.slice("Remediation: ".length);
  }
  return "";
}

function _findingAssetRole(finding: AdminSurfaceFinding): string | null {
  const ev = finding.evidence as Record<string, unknown>;
  if (typeof ev.role === "string" && ev.role) return ev.role;
  const ft = finding.findingType as string;
  for (const p of ["treasury", "vault", "escrow", "reserve", "oracle", "keeper"]) {
    if (ft.startsWith(p + "_")) return p;
  }
  return null;
}

function _findingCategory(findingType: string): string {
  if (_AUTHORITY_RISK_TYPES.has(findingType)) return "Authority Risk";
  if (_CONTINUITY_RISK_TYPES.has(findingType)) return "Continuity Risk";
  return "General";
}

function FilterChip({ label, active, onClick, color }: { label: string; active: boolean; onClick: () => void; color: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        fontSize: 10,
        border: `1px solid ${active ? color : color + "40"}`,
        borderRadius: 999,
        padding: "3px 8px",
        background: active ? color + "25" : "transparent",
        color: active ? color : color + "B0",
        cursor: "pointer",
        fontWeight: active ? 800 : 400,
        lineHeight: 1.2,
      }}
    >
      {label}
    </button>
  );
}

function AdminSurfaceTab({
  assets,
  findings,
  controls,
  expandedFindings,
  onToggleFinding,
  onGoToControls,
}: {
  assets: ProjectAsset[];
  findings: AdminSurfaceFinding[];
  controls: ProjectControl[];
  expandedFindings: Set<string>;
  onToggleFinding: (findingId: string) => void;
  onGoToControls: (controlId?: string) => void;
}) {
  const [filterSev, setFilterSev] = useState<string>("");
  const [filterRole, setFilterRole] = useState<string>("");
  const [filterCat, setFilterCat] = useState<string>("");

  if (assets.length === 0) return <EmptyState>Add public asset metadata to begin zero-custody analysis.</EmptyState>;
  if (findings.length === 0) return <EmptyState>Run Admin Surface Scan to generate findings.</EmptyState>;

  const availableRoles = [...new Set(findings.map(_findingAssetRole).filter((r): r is string => r !== null))].sort();
  const availableCategories = [...new Set(findings.map((f) => _findingCategory(f.findingType as string)))].sort();

  const filtered = findings.filter(
    (f) =>
      (!filterSev || f.severity === filterSev) &&
      (!filterRole || _findingAssetRole(f) === filterRole) &&
      (!filterCat || _findingCategory(f.findingType as string) === filterCat),
  );

  const groupedFiltered = severityOrder
    .map((sev) => ({ severity: sev, items: filtered.filter((f) => f.severity === sev) }))
    .filter((g) => g.items.length > 0);

  const hasFilter = !!(filterSev || filterRole || filterCat);

  return (
    <div style={{ display: "grid", gap: 12 }}>
      {/* Filter bar */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
        <span style={{ fontSize: 10, color: MUTED, letterSpacing: "0.08em" }}>SEVERITY:</span>
        {(["critical", "high", "medium", "low"] as const).map((sev) => (
          <FilterChip
            key={sev}
            label={sev}
            active={filterSev === sev}
            onClick={() => setFilterSev(filterSev === sev ? "" : sev)}
            color={severityColors[sev]}
          />
        ))}
        {availableRoles.length > 0 ? (
          <>
            <span style={{ color: MUTED, fontSize: 11, margin: "0 2px" }}>|</span>
            <span style={{ fontSize: 10, color: MUTED, letterSpacing: "0.08em" }}>ROLE:</span>
            {availableRoles.map((role) => (
              <FilterChip
                key={role}
                label={role}
                active={filterRole === role}
                onClick={() => setFilterRole(filterRole === role ? "" : role)}
                color="#93C5FD"
              />
            ))}
          </>
        ) : null}
        {availableCategories.length > 1 ? (
          <>
            <span style={{ color: MUTED, fontSize: 11, margin: "0 2px" }}>|</span>
            <span style={{ fontSize: 10, color: MUTED, letterSpacing: "0.08em" }}>CATEGORY:</span>
            {availableCategories.map((cat) => (
              <FilterChip
                key={cat}
                label={cat}
                active={filterCat === cat}
                onClick={() => setFilterCat(filterCat === cat ? "" : cat)}
                color={cat === "Authority Risk" ? "#F97316" : cat === "Continuity Risk" ? "#A78BFA" : MUTED}
              />
            ))}
          </>
        ) : null}
        {hasFilter ? (
          <button
            type="button"
            onClick={() => { setFilterSev(""); setFilterRole(""); setFilterCat(""); }}
            style={linkButtonStyle}
          >
            Clear filters
          </button>
        ) : null}
        <span style={{ marginLeft: "auto", fontSize: 10, color: MUTED }}>
          {filtered.length}/{findings.length}
        </span>
      </div>

      {groupedFiltered.length === 0 ? (
        <EmptyState>No findings match the current filters.</EmptyState>
      ) : (
        groupedFiltered.map((group) => (
          <div key={group.severity} style={{ display: "grid", gap: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.12em", color: severityColors[group.severity] }}>
              {group.severity.toUpperCase()} ({group.items.length})
            </div>
            {group.items.map((finding) => {
              const asset = assets.find((a) => a.id === finding.assetId);
              const expanded = expandedFindings.has(finding.id);
              const evidenceRequired = _findingEvidenceRequired(finding);
              const remediation = _findingRemediation(finding);
              const role = _findingAssetRole(finding);
              const category = _findingCategory(finding.findingType as string);
              const assetAddress = (finding.evidence as Record<string, unknown>).assetAddress as string | undefined;
              const mappedControl =
                controls.find((c) => c.findingId === finding.id) ??
                controls.find((c) => c.sourceFindingType === finding.findingType && c.assetId === finding.assetId) ??
                controls.find((c) => c.sourceFindingType === finding.findingType);
              const catColor = category === "Authority Risk" ? "#F97316" : category === "Continuity Risk" ? "#A78BFA" : MUTED;
              return (
                <div
                  key={finding.id}
                  style={{
                    borderRadius: 8,
                    border: `1px solid ${severityColors[finding.severity]}24`,
                    background: `${severityColors[finding.severity]}0E`,
                    padding: 12,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
                    <div>
                      <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                        <Pill label={finding.severity.toUpperCase()} color={severityColors[finding.severity]} />
                        <Pill label={formatTag(finding.findingType)} color={severityColors[finding.severity]} />
                        {role ? <Pill label={role} color="#93C5FD" /> : null}
                        <Pill label={category} color={catColor} />
                      </div>
                      <div style={{ marginTop: 7, fontSize: 13, fontWeight: 800, color: TEXT }}>{finding.title}</div>
                      <div style={{ marginTop: 5, fontSize: 11, color: "rgba(212,175,55,0.75)" }}>
                        Related asset: {asset?.name ?? "Project-level finding"}
                        {assetAddress ? ` — ${assetAddress.length > 12 ? assetAddress.slice(0, 10) + "…" : assetAddress}` : ""}
                      </div>
                    </div>
                    <button type="button" onClick={() => onToggleFinding(finding.id)} style={linkButtonStyle}>
                      {expanded ? "Hide panel" : "Show panel"}
                    </button>
                  </div>
                  <div style={{ marginTop: 8, fontSize: 12, color: "rgba(226,232,240,0.82)", lineHeight: 1.5 }}>
                    {finding.summary}
                  </div>

                  {expanded ? (
                    <div
                      style={{
                        marginTop: 12,
                        borderTop: `1px solid ${severityColors[finding.severity]}22`,
                        paddingTop: 12,
                        display: "grid",
                        gap: 14,
                      }}
                    >
                      {/* Affected asset + Finding category */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        <div>
                          <div style={{ fontSize: 10, color: MUTED, letterSpacing: "0.08em", marginBottom: 5 }}>AFFECTED ASSET</div>
                          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                            <span style={{ fontSize: 12, color: TEXT, fontWeight: 700 }}>{asset?.name ?? "Project-level"}</span>
                            {role ? <Pill label={role} color="#93C5FD" /> : null}
                          </div>
                          {assetAddress ? (
                            <div style={{ marginTop: 4, fontSize: 10, color: MUTED, wordBreak: "break-all" }}>{assetAddress}</div>
                          ) : null}
                        </div>
                        <div>
                          <div style={{ fontSize: 10, color: MUTED, letterSpacing: "0.08em", marginBottom: 5 }}>FINDING TYPE / CATEGORY</div>
                          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                            <Pill label={formatTag(finding.findingType)} color={severityColors[finding.severity]} />
                            <Pill label={category} color={catColor} />
                          </div>
                        </div>
                      </div>

                      {/* Evidence Required */}
                      {evidenceRequired.length > 0 ? (
                        <div>
                          <div style={{ fontSize: 10, color: MUTED, letterSpacing: "0.08em", marginBottom: 6 }}>EVIDENCE REQUIRED</div>
                          <div style={{ display: "grid", gap: 4 }}>
                            {evidenceRequired.map((item) => (
                              <div key={item} style={{ display: "flex", gap: 7, alignItems: "baseline" }}>
                                <span style={{ color: GOLD, fontSize: 10, flexShrink: 0 }}>•</span>
                                <span style={{ fontSize: 11, color: TEXT, lineHeight: 1.4 }}>{item}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}

                      {/* Recommended Remediation */}
                      {remediation ? (
                        <div>
                          <div style={{ fontSize: 10, color: MUTED, letterSpacing: "0.08em", marginBottom: 6 }}>RECOMMENDED REMEDIATION</div>
                          <div style={{ fontSize: 12, color: "rgba(226,232,240,0.9)", lineHeight: 1.55 }}>{remediation}</div>
                        </div>
                      ) : null}

                      {/* Mapped Control */}
                      <div>
                        <div style={{ fontSize: 10, color: MUTED, letterSpacing: "0.08em", marginBottom: 6 }}>MAPPED CONTROL</div>
                        {mappedControl ? (
                          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                              <span style={{ fontSize: 12, color: TEXT, fontWeight: 700 }}>{mappedControl.title}</span>
                              <Pill label={mappedControl.status} color={controlStatusColors[mappedControl.status]} />
                            </div>
                            <button type="button" onClick={() => onGoToControls(mappedControl.id)} style={linkButtonStyle}>
                              View Control →
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                            <span style={{ fontSize: 11, color: MUTED }}>No control generated yet.</span>
                            <button type="button" onClick={() => onGoToControls()} style={linkButtonStyle}>
                              Go to Controls tab →
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        ))
      )}
    </div>
  );
}

function ThreatsTab({ relevance, findings }: { relevance: ProjectRelevance | null; findings: AdminSurfaceFinding[] }) {
  if (findings.length === 0) return <EmptyState>Run Admin Surface Scan to map project findings to global SCE intelligence.</EmptyState>;
  if (!relevance || relevance.relevantThreatFamilies.length === 0) return <EmptyState>Findings but no relevance: No global relevance matches yet.</EmptyState>;

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
        <div style={{ fontSize: 12, color: MUTED }}>{relevance.summary}</div>
        <Link href="/dashboard/threat-matrix" style={{ color: "rgba(212,175,55,0.78)", fontSize: 10, letterSpacing: "0.08em", textDecoration: "none" }}>
          OPEN THREAT MATRIX
        </Link>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
        {relevance.relevantThreatFamilies.map((family) => (
          <div key={family.threatFamily} style={{ border: "1px solid rgba(212,175,55,0.1)", borderRadius: 8, padding: 12, background: "rgba(255,255,255,0.02)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: TEXT }}>{family.threatFamily}</div>
              <Pill label={String(family.relevanceScore)} color={family.relevanceScore >= 70 ? "#EF4444" : GOLD} />
            </div>
            <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
              <MiniStat label="Matched" value={String(family.matchedFindings.length)} />
              <MiniStat label="Cases" value={String(family.globalCaseCount)} />
              <MiniStat label="Critical" value={String(family.criticalCount)} />
              <MiniStat label="Replay" value={`${Math.round(family.replayCoveragePct)}%`} />
            </div>
            <div style={{ marginTop: 10, display: "flex", gap: 5, flexWrap: "wrap" }}>
              {family.topDoctrineTags.slice(0, 3).map((tag) => <Pill key={tag} label={formatTag(tag)} color="#F5E7A1" />)}
            </div>
            <div style={{ marginTop: 10, fontSize: 12, color: "rgba(226,232,240,0.82)", lineHeight: 1.5 }}>
              {family.whyItMatters}
            </div>
            {family.topRecommendedActions.slice(0, 2).map((action) => (
              <div key={action} style={{ marginTop: 7, fontSize: 11, color: "rgba(203,213,225,0.78)" }}>
                {action}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function DoctrineTab({ relevance, findings }: { relevance: ProjectRelevance | null; findings: AdminSurfaceFinding[] }) {
  if (findings.length === 0) return <EmptyState>Run Admin Surface Scan to map project findings to global SCE intelligence.</EmptyState>;
  if (!relevance || relevance.relevantDoctrineTags.length === 0) return <EmptyState>No global relevance matches yet.</EmptyState>;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
      {relevance.relevantDoctrineTags.slice(0, 10).map((item) => (
        <div key={item.tag} style={{ border: "1px solid rgba(212,175,55,0.1)", borderRadius: 8, padding: 12, background: "rgba(255,255,255,0.02)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
            <div style={{ fontSize: 13, color: TEXT, fontWeight: 800 }}>{formatTag(item.tag)}</div>
            <span style={{ fontSize: 10, color: MUTED }}>{item.matchedSignals.length} signals</span>
          </div>
          <div style={{ marginTop: 8, display: "flex", gap: 5, flexWrap: "wrap" }}>
            {item.matchedSignals.slice(0, 2).map((signal) => <Pill key={signal} label={signal} color="#93C5FD" />)}
          </div>
          <div style={{ marginTop: 10, fontSize: 11, color: "rgba(203,213,225,0.82)", lineHeight: 1.5 }}>
            {item.recommendedActions[0] || "No action preview available."}
          </div>
          <div style={{ marginTop: 7, fontSize: 11, color: "rgba(148,163,184,0.82)", lineHeight: 1.5 }}>
            {item.continuityImplications[0] || "No continuity implication preview available."}
          </div>
        </div>
      ))}
    </div>
  );
}

function ControlCard({
  control,
  asset,
  canSubmitEvidence,
  canVerify,
  isHighlighted,
  onVerify,
  onUpdate,
  onClearHighlight,
}: {
  control: ProjectControl;
  asset: ProjectAsset | undefined;
  canSubmitEvidence: boolean;
  canVerify: boolean;
  isHighlighted: boolean;
  onVerify: (controlId: string) => void;
  onUpdate: (
    controlId: string,
    payload: {
      status?: ProjectControlStatus;
      evidenceProvided?: string | null;
      reviewerNotes?: string | null;
    },
  ) => void;
  onClearHighlight: () => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [evidenceInput, setEvidenceInput] = useState(control.evidenceProvided ?? "");
  const [reviewerInput, setReviewerInput] = useState(control.reviewerNotes ?? "");

  useEffect(() => {
    setEvidenceInput(control.evidenceProvided ?? "");
    setReviewerInput(control.reviewerNotes ?? "");
  }, [control.evidenceProvided, control.reviewerNotes]);

  useEffect(() => {
    if (isHighlighted && cardRef.current) {
      cardRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [isHighlighted]);

  const hasEvidence = evidenceInput.trim().length > 0 || (control.evidenceProvided ?? "").trim().length > 0;
  const canMarkVerified = canVerify && hasEvidence;
  const verificationDate = control.verifiedAt ? new Date(control.verifiedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : null;

  return (
    <div
      ref={cardRef}
      style={{
        border: isHighlighted ? "1px solid rgba(212,175,55,0.55)" : "1px solid rgba(212,175,55,0.1)",
        borderRadius: 8,
        padding: 14,
        background: isHighlighted ? "rgba(212,175,55,0.06)" : "rgba(255,255,255,0.02)",
        boxShadow: isHighlighted ? "0 0 0 2px rgba(212,175,55,0.18)" : "none",
        transition: "border-color 0.3s, background 0.3s",
      }}
      onClick={isHighlighted ? onClearHighlight : undefined}
    >
      {/* Header row */}
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <Pill label={formatTag(control.status)} color={controlStatusColors[control.status]} />
            <Pill label={control.severity.toUpperCase()} color={severityColors[control.severity]} />
            {control.sourceFindingType ? <Pill label={control.sourceFindingType} color="#93C5FD" /> : null}
          </div>
          <div style={{ marginTop: 8, fontSize: 14, fontWeight: 800, color: TEXT }}>{control.title}</div>
          <div style={{ marginTop: 5, fontSize: 12, color: "rgba(226,232,240,0.82)", lineHeight: 1.5 }}>{control.description}</div>
          <div style={{ marginTop: 5, fontSize: 11, color: "rgba(212,175,55,0.75)" }}>
            Affected asset: {asset?.name ?? "Project-level control"}
          </div>
          {control.sourceFindingType ? (
            <div style={{ marginTop: 2, fontSize: 11, color: MUTED }}>
              Finding type: {control.sourceFindingType}
            </div>
          ) : null}
        </div>
        {/* Status action buttons */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end", flexShrink: 0 }}>
          {canVerify && control.status !== "planned" ? (
            <ActionButton onClick={() => onUpdate(control.id, { status: "planned" })} disabled={control.status === "not_applicable"}>
              Mark Planned
            </ActionButton>
          ) : null}
          {canVerify && control.status !== "implemented" ? (
            <ActionButton onClick={() => onUpdate(control.id, { status: "implemented" })} disabled={control.status === "not_applicable"}>
              Mark Implemented
            </ActionButton>
          ) : null}
          {canVerify && control.status !== "verified" ? (
            <ActionButton
              onClick={() => onVerify(control.id)}
              disabled={!canMarkVerified}
              title={!hasEvidence ? "Evidence Provided is required before marking Verified" : undefined}
            >
              Mark Verified
            </ActionButton>
          ) : null}
          {canVerify && control.status !== "not_applicable" ? (
            <ActionButton onClick={() => onUpdate(control.id, { status: "not_applicable" })}>
              Not Applicable
            </ActionButton>
          ) : null}
        </div>
      </div>

      {/* Metadata row */}
      <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <ControlDetail label="Evidence Required" values={control.recommendedEvidence} />
        <ControlDetail label="Doctrine Tags" values={control.doctrineTags.map(formatTag)} />
      </div>

      {/* Verification status */}
      {control.status === "verified" && (
        <div style={{ marginTop: 8, padding: "7px 10px", background: "rgba(34,197,94,0.08)", borderRadius: 6, border: "1px solid rgba(34,197,94,0.2)" }}>
          <div style={{ fontSize: 11, color: "#22C55E", fontWeight: 700 }}>
            VERIFICATION STATUS: VERIFIED
            {verificationDate ? ` · ${verificationDate}` : ""}
            {control.verifiedBy ? ` · by ${control.verifiedBy}` : ""}
          </div>
          {control.verificationMethod !== "none" ? (
            <div style={{ fontSize: 10, color: MUTED, marginTop: 3 }}>
              Method: {control.verificationMethod}
            </div>
          ) : null}
        </div>
      )}

      {/* Evidence Provided display */}
      {control.evidenceProvided ? (
        <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: 10, color: MUTED, letterSpacing: "0.08em", marginBottom: 4 }}>EVIDENCE PROVIDED</div>
          <div style={{ fontSize: 12, color: TEXT, background: "rgba(15,23,42,0.5)", borderRadius: 6, padding: "8px 10px", whiteSpace: "pre-wrap", wordBreak: "break-word", lineHeight: 1.5 }}>
            {control.evidenceProvided}
          </div>
        </div>
      ) : null}

      {/* Reviewer Notes display */}
      {control.reviewerNotes ? (
        <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: 10, color: MUTED, letterSpacing: "0.08em", marginBottom: 4 }}>REVIEWER NOTES</div>
          <div style={{ fontSize: 12, color: TEXT, background: "rgba(15,23,42,0.5)", borderRadius: 6, padding: "8px 10px", whiteSpace: "pre-wrap", wordBreak: "break-word", lineHeight: 1.5 }}>
            {control.reviewerNotes}
          </div>
        </div>
      ) : null}

      {/* Edit area */}
      {(canSubmitEvidence || canVerify) && (
        <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
          {canSubmitEvidence ? (
            <div>
              <div style={{ fontSize: 10, color: MUTED, letterSpacing: "0.08em", marginBottom: 5 }}>EVIDENCE PROVIDED</div>
              <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
                <textarea
                  value={evidenceInput}
                  onChange={(e) => setEvidenceInput(e.target.value)}
                  rows={2}
                  placeholder="URL, wallet/multisig address, timelock ref, contract link, governance proposal link, or operator notes"
                  style={{ ...fieldStyle(false), flex: 1, resize: "vertical" }}
                />
                <ActionButton
                  onClick={() => onUpdate(control.id, { evidenceProvided: evidenceInput.trim() || null })}
                  disabled={evidenceInput === (control.evidenceProvided ?? "")}
                >
                  Save
                </ActionButton>
              </div>
            </div>
          ) : null}
          {canVerify ? (
            <div>
              <div style={{ fontSize: 10, color: MUTED, letterSpacing: "0.08em", marginBottom: 5 }}>REVIEWER NOTES</div>
              <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
                <textarea
                  value={reviewerInput}
                  onChange={(e) => setReviewerInput(e.target.value)}
                  rows={2}
                  placeholder="Reviewer comments, verification context, or rejection reason"
                  style={{ ...fieldStyle(false), flex: 1, resize: "vertical" }}
                />
                <ActionButton
                  onClick={() => onUpdate(control.id, { reviewerNotes: reviewerInput.trim() || null })}
                  disabled={reviewerInput === (control.reviewerNotes ?? "")}
                >
                  Save
                </ActionButton>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {!canMarkVerified && canVerify && control.status !== "verified" && control.status !== "not_applicable" ? (
        <div style={{ marginTop: 8, fontSize: 11, color: "rgba(251,191,36,0.75)" }}>
          Evidence Provided required before marking Verified.
        </div>
      ) : null}
    </div>
  );
}

function ControlsTab({
  assets,
  findings,
  controls,
  canGenerate,
  canSubmitEvidence,
  canVerify,
  loading,
  highlightControlId,
  onGenerate,
  onVerifyAll,
  onVerify,
  onUpdate,
  onClearHighlight,
}: {
  assets: ProjectAsset[];
  findings: AdminSurfaceFinding[];
  controls: ProjectControl[];
  canGenerate: boolean;
  canSubmitEvidence: boolean;
  canVerify: boolean;
  loading: boolean;
  highlightControlId: string | null;
  onGenerate: () => void;
  onVerifyAll: () => void;
  onVerify: (controlId: string) => void;
  onUpdate: (
    controlId: string,
    payload: {
      status?: ProjectControlStatus;
      evidenceProvided?: string | null;
      reviewerNotes?: string | null;
    },
  ) => void;
  onClearHighlight: () => void;
}) {
  const total = controls.length;
  const counts = controlStatuses.reduce(
    (acc, status) => ({ ...acc, [status]: controls.filter((control) => control.status === status).length }),
    {} as Record<ProjectControlStatus, number>,
  );
  const coverage = total > 0 ? Math.round((counts.verified / total) * 100) : 0;
  const assetById = new Map(assets.map((asset) => [asset.id, asset]));
  const grouped = controlStatuses.map((status) => ({
    status,
    items: controls.filter((control) => control.status === status),
  })).filter((group) => group.items.length > 0);

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, minmax(0, 1fr))", gap: 8 }}>
        <Kpi label="Total controls" value={String(total)} />
        <Kpi label="Missing" value={String(counts.missing)} color={controlStatusColors.missing} />
        <Kpi label="Planned" value={String(counts.planned)} color={controlStatusColors.planned} />
        <Kpi label="Implemented" value={String(counts.implemented)} color={controlStatusColors.implemented} />
        <Kpi label="Verified" value={String(counts.verified)} color={controlStatusColors.verified} />
        <Kpi label="Coverage" value={`${coverage}%`} />
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ display: "grid", gap: 4 }}>
          <div style={{ fontSize: 12, color: "#F5E7A1" }}>Zero-custody evidence only</div>
          <div style={{ fontSize: 11, color: MUTED }}>Evidence Provided accepts URLs, wallet/multisig addresses, timelock references, contract links, governance proposal links, or operator notes.</div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <ActionButton onClick={onGenerate} disabled={!canGenerate || loading}>
            {loading ? "Working..." : "Generate Controls"}
          </ActionButton>
          <ActionButton onClick={onVerifyAll} disabled={!canVerify || loading || total === 0}>
            Verify All
          </ActionButton>
        </div>
      </div>

      {findings.length === 0 ? <EmptyState>Run Admin Surface Scan before generating controls.</EmptyState> : null}
      {findings.length > 0 && total === 0 ? <EmptyState>Generate controls from current findings.</EmptyState> : null}
      {total > 0 && counts.verified === total ? <EmptyState>All generated controls are verified for current metadata/evidence.</EmptyState> : null}

      <div style={{ display: "grid", gap: 12 }}>
        {grouped.map((group) => (
          <div key={group.status} style={{ display: "grid", gap: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.12em", color: controlStatusColors[group.status] }}>
              {formatTag(group.status).toUpperCase()} ({group.items.length})
            </div>
            {group.items.map((control) => (
              <ControlCard
                key={control.id}
                control={control}
                asset={assetById.get(control.assetId || "")}
                canSubmitEvidence={canSubmitEvidence}
                canVerify={canVerify}
                isHighlighted={highlightControlId === control.id}
                onVerify={onVerify}
                onUpdate={onUpdate}
                onClearHighlight={onClearHighlight}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function ControlDetail({ label, values }: { label: string; values: string[] }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: MUTED, letterSpacing: "0.08em" }}>{label.toUpperCase()}</div>
      <div style={{ marginTop: 5, display: "flex", gap: 5, flexWrap: "wrap" }}>
        {values.length > 0 ? values.slice(0, 5).map((value) => <Pill key={value} label={value} color="#CBD5E1" />) : <span style={{ fontSize: 11, color: MUTED }}>None recorded</span>}
      </div>
    </div>
  );
}

function evidencePreview(evidence: Record<string, unknown>): string[] {
  return ["note", "url", "address", "transactionHash", "label"]
    .map((key) => {
      const value = evidence[key];
      return typeof value === "string" && value.trim() ? `${formatTag(key)}: ${value.trim()}` : null;
    })
    .filter(Boolean) as string[];
}

function Kpi({ label, value, color = TEXT, compact = false }: { label: string; value: string; color?: string; compact?: boolean }) {
  return (
    <div style={{ border: "1px solid rgba(212,175,55,0.08)", borderRadius: 8, padding: "10px 11px", background: "rgba(255,255,255,0.02)", minWidth: 0 }}>
      <div style={{ fontSize: 9, color: MUTED, letterSpacing: "0.08em" }}>{label.toUpperCase()}</div>
      <div style={{ marginTop: 5, fontSize: compact ? 11 : 18, fontWeight: 800, color, overflowWrap: "anywhere" }}>{value}</div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 9, color: MUTED, letterSpacing: "0.08em" }}>{label.toUpperCase()}</div>
      <div style={{ marginTop: 2, fontSize: 12, color: TEXT, fontWeight: 800 }}>{value}</div>
    </div>
  );
}

function Pill({ label, color }: { label: string; color: string }) {
  return (
    <span
      style={{
        fontSize: 10,
        color,
        border: `1px solid ${color}38`,
        borderRadius: 999,
        padding: "3px 7px",
        background: `${color}12`,
        lineHeight: 1.2,
      }}
    >
      {label}
    </span>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 13, color: MUTED, padding: "10px 0" }}>{children}</div>;
}

function TextField({
  label,
  name,
  required = false,
  disabled = false,
  placeholder,
}: {
  label: string;
  name: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
}) {
  return (
    <label style={{ display: "grid", gap: 5 }}>
      <span style={{ fontSize: 11, color: "#CBD5E1" }}>{label}</span>
      <input name={name} required={required} disabled={disabled} placeholder={placeholder} style={fieldStyle(disabled)} />
    </label>
  );
}

function TextAreaField({
  label,
  name,
  disabled = false,
}: {
  label: string;
  name: string;
  disabled?: boolean;
}) {
  return (
    <label style={{ display: "grid", gap: 5 }}>
      <span style={{ fontSize: 11, color: "#CBD5E1" }}>{label}</span>
      <textarea name={name} rows={2} disabled={disabled} style={fieldStyle(disabled)} />
    </label>
  );
}

function SelectField({
  label,
  name,
  options,
  disabled = false,
}: {
  label: string;
  name: string;
  options: string[];
  disabled?: boolean;
}) {
  return (
    <label style={{ display: "grid", gap: 5 }}>
      <span style={{ fontSize: 11, color: "#CBD5E1" }}>{label}</span>
      <select name={name} disabled={disabled} style={fieldStyle(disabled)}>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function CheckField({
  label,
  name,
  disabled = false,
}: {
  label: string;
  name: string;
  disabled?: boolean;
}) {
  return (
    <label
      style={{
        display: "flex",
        alignItems: "center",
        gap: 7,
        border: "1px solid rgba(148,163,184,0.16)",
        borderRadius: 8,
        padding: "9px 10px",
        background: "rgba(15,23,42,0.62)",
        color: disabled ? "rgba(148,163,184,0.65)" : TEXT,
      }}
    >
      <input type="checkbox" name={name} disabled={disabled} />
      <span style={{ fontSize: 11 }}>{label}</span>
    </label>
  );
}

function ActionButton({
  children,
  disabled = false,
  onClick,
  type = "button",
  title,
  variant = "primary",
}: {
  children: React.ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  type?: "button" | "submit";
  title?: string;
  variant?: "primary" | "danger";
}) {
  const destructive = variant === "danger";
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        border: destructive ? "1px solid rgba(239,68,68,0.34)" : "1px solid rgba(212,175,55,0.24)",
        borderRadius: 8,
        background: disabled ? "rgba(148,163,184,0.12)" : destructive ? "rgba(239,68,68,0.11)" : GOLD,
        color: disabled ? "rgba(148,163,184,0.84)" : destructive ? "#FCA5A5" : "#111827",
        padding: "8px 11px",
        fontSize: 11,
        fontWeight: 800,
        cursor: disabled ? "default" : "pointer",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </button>
  );
}

const linkButtonStyle: React.CSSProperties = {
  border: "none",
  background: "transparent",
  color: "rgba(212,175,55,0.78)",
  fontSize: 10,
  fontWeight: 800,
  cursor: "pointer",
  padding: 0,
};

function fieldStyle(disabled: boolean): React.CSSProperties {
  return {
    width: "100%",
    borderRadius: 8,
    border: "1px solid rgba(148,163,184,0.22)",
    background: disabled ? "rgba(15,23,42,0.3)" : "rgba(15,23,42,0.74)",
    color: TEXT,
    padding: "9px 10px",
    fontSize: 12,
  };
}
