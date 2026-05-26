"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { useSession } from "@/components/layout/SessionContext";
import {
  completeSecondReview,
  fetchDefenseReview,
  importDefenseReviewCandidate,
  importDefenseReviewCandidatesBatch,
  markDelivered,
  markEvidenceRequested,
  markReadyForDelivery,
  refreshDefenseReview,
  runDefenseReviewScan,
  updateDefenseReview,
  validateDefenseReviewAssets,
} from "@/lib/defense-review/service";
import type {
  CandidateBatchImportResponse,
  CandidateImportResult,
  CandidateImportStatus,
  DefenseReview,
  DefenseReviewStatus,
  DiscoveredCandidateAsset,
  RunScanResponse,
  ScanStatus,
} from "@/lib/defense-review/types";

const GOLD = "#D4AF37";
const TEXT = "#E2E8F0";
const MUTED = "rgba(148,163,184,0.78)";
const PANEL: React.CSSProperties = {
  background: "rgba(10,12,18,0.92)",
  border: "1px solid rgba(212,175,55,0.12)",
  borderRadius: 8,
  padding: 14,
};

const STATUS_LABELS: Record<DefenseReviewStatus, string> = {
  draft: "Draft",
  in_review: "In Review",
  report_ready: "Report Ready",
  delivered: "Delivered",
  closed: "Closed",
};

const STATUS_COLORS: Record<DefenseReviewStatus, string> = {
  draft: MUTED,
  in_review: "#3B82F6",
  report_ready: GOLD,
  delivered: "#22C55E",
  closed: "rgba(148,163,184,0.4)",
};

const ALL_STATUSES: DefenseReviewStatus[] = ["draft", "in_review", "report_ready", "delivered", "closed"];
const SECOND_REVIEW_CHECKS = [
  "no_unsupported_safe_certified_audited_defended_claims",
  "no_unsupported_exploitability_vulnerability_claims",
  "findings_match_evidence_blocks",
  "verified_inferred_unresolved_labels_correct",
  "controls_verified_count_accurate",
  "authority_path_counts_match_mapped_assets",
  "source_abi_limitation_clear",
  "evidence_requested_actionable",
  "remediation_roadmap_ordered_non_promissory",
  "sample_client_label_correct",
  "no_internal_json_debug_data_leaks_into_pdf",
];

function formatDate(value?: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function StatusPill({ status }: { status: DefenseReviewStatus }) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "3px 10px",
        borderRadius: 4,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "0.1em",
        background: `${STATUS_COLORS[status]}22`,
        color: STATUS_COLORS[status],
        border: `1px solid ${STATUS_COLORS[status]}55`,
      }}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

function Kpi({
  label,
  value,
  color,
  sub,
}: {
  label: string;
  value: string;
  color?: string;
  sub?: string;
}) {
  return (
    <div
      style={{
        ...PANEL,
        padding: "10px 12px",
        display: "grid",
        gap: 3,
      }}
    >
      <div style={{ fontSize: 9, color: MUTED, letterSpacing: "0.12em" }}>{label.toUpperCase()}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: color ?? TEXT, lineHeight: 1 }}>{value}</div>
      {sub ? <div style={{ fontSize: 10, color: MUTED }}>{sub}</div> : null}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 10,
        letterSpacing: "0.16em",
        color: "rgba(212,175,55,0.6)",
        fontWeight: 700,
        marginBottom: 8,
      }}
    >
      {children}
    </div>
  );
}

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      style={{
        display: "inline-block",
        fontSize: 11,
        color: GOLD,
        textDecoration: "none",
        border: `1px solid ${GOLD}44`,
        padding: "4px 10px",
        borderRadius: 4,
        letterSpacing: "0.04em",
      }}
    >
      {label}
    </Link>
  );
}

function isImportEligible(candidate: DiscoveredCandidateAsset): boolean {
  return candidate.status === "candidate" || candidate.status === "approved_for_import";
}

function candidateStatusLabel(status?: CandidateImportStatus | string): string {
  const labels: Record<string, string> = {
    candidate: "Pending import",
    approved_for_import: "Approved for import",
    imported: "Imported",
    already_mapped: "Already mapped",
    rejected: "Rejected",
    skipped: "Skipped",
    failed: "Import failed",
  };
  return labels[status ?? "candidate"] ?? "Pending import";
}

function CandidateAssetsPanel({
  candidates,
  canImport,
  pendingIds,
  batchImporting,
  failures,
  batchSummary,
  onImport,
  onBatchImport,
}: {
  candidates: DiscoveredCandidateAsset[];
  canImport: boolean;
  pendingIds: string[];
  batchImporting: boolean;
  failures: Record<string, string>;
  batchSummary: CandidateBatchImportResponse | null;
  onImport: (candidateId: string) => void;
  onBatchImport: (candidateIds: string[], allEligible: boolean) => void;
}) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const eligible = candidates.filter((candidate) => isImportEligible(candidate) && Boolean(candidate.candidate_id));
  const eligibleIds = eligible.map((candidate) => candidate.candidate_id as string);
  const selectedEligibleIds = selectedIds.filter((id) => eligibleIds.includes(id));
  const duplicates = new Map<string, DiscoveredCandidateAsset[]>();

  for (const candidate of candidates) {
    const address = candidate.discovered_address?.toLowerCase();
    if (!address) continue;
    const key = `${candidate.chain_id ?? candidate.source_contract ?? "chain"}:${address}`;
    duplicates.set(key, [...(duplicates.get(key) ?? []), candidate]);
  }

  function toggleCandidate(candidateId: string) {
    setSelectedIds((current) => current.includes(candidateId)
      ? current.filter((id) => id !== candidateId)
      : [...current, candidateId]);
  }

  return (
    <section style={PANEL}>
      <SectionLabel>DISCOVERED CANDIDATE ASSETS</SectionLabel>
      <div style={{ fontSize: 12, color: MUTED, lineHeight: 1.55, marginBottom: 10 }}>
        Candidates require operator approval and import into Project Map before they become in-scope mapped assets.
        Imported candidates become mapped assets and require a new scan before they are included in authority review results.
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
        <button
          type="button"
          onClick={() => onBatchImport(selectedEligibleIds, false)}
          disabled={!canImport || batchImporting || selectedEligibleIds.length === 0}
          style={candidateActionStyle(!canImport || batchImporting || selectedEligibleIds.length === 0)}
        >
          {batchImporting ? "Importing..." : "Import selected"}
        </button>
        <button
          type="button"
          onClick={() => onBatchImport(eligibleIds, true)}
          disabled={!canImport || batchImporting || eligibleIds.length === 0}
          style={candidateActionStyle(!canImport || batchImporting || eligibleIds.length === 0)}
        >
          Import all eligible
        </button>
        {!canImport ? (
          <span style={{ fontSize: 11, color: MUTED, alignSelf: "center" }}>Operator access required to import candidates.</span>
        ) : null}
      </div>
      {batchSummary ? (
        <div style={{ border: "1px solid rgba(34,197,94,0.22)", borderRadius: 6, padding: "7px 10px", marginBottom: 10, fontSize: 11, color: "#86EFAC" }}>
          Imported: {batchSummary.imported} | Already mapped: {batchSummary.alreadyMapped} | Skipped: {batchSummary.skipped} | Failed: {batchSummary.failed}
        </div>
      ) : null}
      <div style={{ display: "grid", gap: 7 }}>
        {candidates.map((candidate, index) => {
          const candidateId = candidate.candidate_id ?? "";
          const failure = candidateId ? failures[candidateId] : undefined;
          const status = failure ? "failed" : (candidate.status ?? "candidate");
          const loading = Boolean(candidateId && pendingIds.includes(candidateId));
          const canSelect = canImport && isImportEligible(candidate) && Boolean(candidateId) && !batchImporting;
          const address = candidate.discovered_address?.toLowerCase();
          const duplicateKey = address ? `${candidate.chain_id ?? candidate.source_contract ?? "chain"}:${address}` : "";
          const sameAddress = duplicates.get(duplicateKey) ?? [];
          const peer = sameAddress.find((item) => item.candidate_id !== candidate.candidate_id);
          const actionDisabled = !canImport || !isImportEligible(candidate) || !candidateId || loading || batchImporting;
          return (
            <div key={candidateId || index} style={{ border: "1px solid rgba(148,163,184,0.14)", borderRadius: 6, padding: "8px 10px", display: "grid", gap: 5 }}>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                <input
                  type="checkbox"
                  aria-label={`Select ${candidate.suggested_name ?? "candidate"} for import`}
                  checked={Boolean(candidateId && selectedEligibleIds.includes(candidateId))}
                  disabled={!canSelect}
                  onChange={() => toggleCandidate(candidateId)}
                />
                <span style={{ fontSize: 13, fontWeight: 700, color: TEXT }}>{candidate.suggested_name ?? candidate.suggested_role ?? "Linked contract"}</span>
                <span style={{ fontSize: 11, color: GOLD, border: "1px solid rgba(212,175,55,0.25)", borderRadius: 4, padding: "1px 5px" }}>
                  {candidate.suggested_role ?? "unknown_contract"}
                </span>
                <span style={{ fontSize: 11, color: MUTED }}>{candidate.discovered_address}</span>
                {peer ? (
                  <span style={{ fontSize: 10, color: "#F5E7A1", background: "rgba(212,175,55,0.08)", borderRadius: 4, padding: "2px 6px" }}>
                    Same address as {peer.suggested_name ?? "another candidate"}
                  </span>
                ) : null}
              </div>
              <div style={{ fontSize: 11, color: MUTED }}>
                From {candidate.source_asset_name ?? "mapped asset"} via {candidate.function_signature ?? candidate.discovery_method ?? "public evidence"}; confidence: {candidate.confidence ?? "unresolved"}.
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                <span style={{ fontSize: 11, color: status === "imported" || status === "already_mapped" ? "#22C55E" : status === "failed" ? "#FCA5A5" : GOLD }}>
                  {candidateStatusLabel(status)}
                </span>
                <button
                  type="button"
                  disabled={actionDisabled}
                  onClick={() => onImport(candidateId)}
                  style={candidateActionStyle(actionDisabled)}
                >
                  {loading
                    ? "Importing..."
                    : failure
                      ? "Retry import"
                      : isImportEligible(candidate)
                        ? "Import to Project Map"
                        : candidateStatusLabel(status)}
                </button>
                {failure ? <span style={{ fontSize: 11, color: "#FCA5A5" }}>{failure}</span> : null}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function candidateActionStyle(disabled: boolean): React.CSSProperties {
  return {
    border: `1px solid ${disabled ? "rgba(148,163,184,0.2)" : "rgba(212,175,55,0.35)"}`,
    borderRadius: 5,
    padding: "5px 10px",
    background: disabled ? "rgba(148,163,184,0.05)" : "rgba(212,175,55,0.1)",
    color: disabled ? MUTED : GOLD,
    fontSize: 11,
    fontWeight: 700,
    cursor: disabled ? "default" : "pointer",
  };
}

export default function DefenseReviewDetailPage() {
  const params = useParams();
  const reviewId = typeof params.id === "string" ? params.id : "";
  const me = useSession();
  const canImportCandidates = Boolean(me?.permissions.canEditAssets);
  const canRunScan = Boolean(me?.permissions.canRunScans);

  const [review, setReview] = useState<DefenseReview | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [editStatus, setEditStatus] = useState<DefenseReviewStatus | "">("");
  const [editNotes, setEditNotes] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [workflowSaving, setWorkflowSaving] = useState("");
  const [scanResult, setScanResult] = useState<RunScanResponse | null>(null);
  const [candidatePendingIds, setCandidatePendingIds] = useState<string[]>([]);
  const [candidateBatchImporting, setCandidateBatchImporting] = useState(false);
  const [candidateFailures, setCandidateFailures] = useState<Record<string, string>>({});
  const [candidateBatchSummary, setCandidateBatchSummary] = useState<CandidateBatchImportResponse | null>(null);
  const [rescanRequired, setRescanRequired] = useState(false);

  useEffect(() => {
    if (!reviewId) return;
    setLoading(true);
    fetchDefenseReview(reviewId)
      .then((r) => {
        setReview(r);
        setEditStatus(r.status);
        setEditNotes(r.notes ?? "");
      })
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "Failed to load review"),
      )
      .finally(() => setLoading(false));
  }, [reviewId]);

  async function handleRefresh() {
    if (!review) return;
    setRefreshing(true);
    setError("");
    setMessage("");
    try {
      const updated = await refreshDefenseReview(review.id);
      setReview(updated);
      setMessage("Counts refreshed from current project state.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to refresh counts");
    } finally {
      setRefreshing(false);
    }
  }

  async function handleRunScan() {
    if (!review || !canRunScan) return;
    setScanning(true);
    setError("");
    setMessage("");
    setScanResult(null);
    try {
      const result = await runDefenseReviewScan(review.id);
      setReview(result.review);
      setRescanRequired(false);
      setScanResult(result);
      const rpcSt = result.review.rpcStatus;
      const scanMsg = rpcSt === "rpc_configured_preflight_failed"
        ? "Scan inconclusive - RPC preflight failed; detector execution skipped."
        : (rpcSt === "detector_execution_inconclusive" || rpcSt === "inconclusive_transport_failure")
          ? `Scan inconclusive - detector execution failed, ${result.detectorsRan} detectors ran.`
          : (rpcSt === "detector_execution_completed_with_errors" || rpcSt === "completed_with_errors")
            ? `Scan partial - detector execution completed with errors, ${result.detectorsRan} detectors ran.`
            : `Scan complete - ${result.findingsCreated} findings, ${result.detectorsRan} detectors ran.`;
      setMessage(scanMsg);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Scan failed");
    } finally {
      setScanning(false);
    }
  }

  function applyCandidateResults(results: CandidateImportResult[]) {
    setReview((current) => {
      if (!current) return current;
      return {
        ...current,
        customerDiscoveredCandidateAssets: (current.customerDiscoveredCandidateAssets ?? []).map((candidate) => {
          const result = results.find((item) => item.candidateId === candidate.candidate_id);
          return result
            ? {
                ...candidate,
                status: result.candidateStatus,
                imported_asset_id: result.importedAssetId,
                import_note: result.safeMessage,
              }
            : candidate;
        }),
      };
    });
  }

  async function refreshAfterCandidateImport() {
    if (!review) return;
    try {
      const updated = await refreshDefenseReview(review.id);
      setReview(updated);
    } catch {
      setMessage("Import recorded. Refresh counts to retrieve the latest candidate state.");
    }
  }

  async function handleCandidateImport(candidateId: string) {
    if (!review || !canImportCandidates) return;
    setCandidatePendingIds((current) => [...current, candidateId]);
    setCandidateBatchSummary(null);
    setError("");
    setMessage("");
    setCandidateFailures((current) => {
      const next = { ...current };
      delete next[candidateId];
      return next;
    });
    try {
      const result = await importDefenseReviewCandidate(review.projectId, candidateId);
      applyCandidateResults([result]);
      if (result.candidateStatus === "failed") {
        setCandidateFailures((current) => ({ ...current, [candidateId]: result.safeMessage }));
        return;
      }
      if (result.candidateStatus === "imported") setRescanRequired(true);
      setMessage(result.safeMessage);
      await refreshAfterCandidateImport();
    } catch (err: unknown) {
      const safeMessage = err instanceof Error ? err.message : "Candidate import failed safely.";
      setCandidateFailures((current) => ({ ...current, [candidateId]: safeMessage }));
    } finally {
      setCandidatePendingIds((current) => current.filter((id) => id !== candidateId));
    }
  }

  async function handleCandidateBatchImport(candidateIds: string[], allEligible: boolean) {
    if (!review || !canImportCandidates || candidateIds.length === 0) return;
    setCandidateBatchImporting(true);
    setCandidateBatchSummary(null);
    setError("");
    setMessage("");
    try {
      const result = await importDefenseReviewCandidatesBatch(review.projectId, candidateIds, allEligible);
      applyCandidateResults(result.results);
      setCandidateBatchSummary(result);
      const nextFailures: Record<string, string> = {};
      for (const item of result.results) {
        if (item.candidateStatus === "failed") nextFailures[item.candidateId] = item.safeMessage;
      }
      setCandidateFailures(nextFailures);
      if (result.imported > 0) {
        setRescanRequired(true);
        setMessage("New assets imported. Re-run EVM scan to include them in authority review results.");
      }
      await refreshAfterCandidateImport();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Candidate import failed safely.");
    } finally {
      setCandidateBatchImporting(false);
    }
  }

  async function workflowAction(label: string, action: () => Promise<DefenseReview>) {
    setWorkflowSaving(label);
    setError("");
    setMessage("");
    try {
      const updated = await action();
      setReview(updated);
      setMessage(`${label} complete.`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : `${label} failed`);
    } finally {
      setWorkflowSaving("");
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!review) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const updated = await updateDefenseReview(review.id, {
        status: editStatus as DefenseReviewStatus,
        notes: editNotes || undefined,
      });
      setReview(updated);
      setMessage("Review updated.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update review");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div style={{ padding: "22px 20px 32px" }}>
        <div style={{ ...PANEL, color: MUTED, fontSize: 13 }}>Loading…</div>
      </div>
    );
  }

  if (!review) {
    return (
      <div style={{ padding: "22px 20px 32px" }}>
        <div style={{ ...PANEL, borderColor: "rgba(239,68,68,0.25)", color: "#FCA5A5" }}>
          {error || "Defense Review not found."}
        </div>
        <div style={{ marginTop: 12 }}>
          <NavLink href="/dashboard/defense-review" label="← All Reviews" />
        </div>
      </div>
    );
  }

  const evidenceStatus = review.customerEvidenceStatus ?? {};
  const importedNeedsScan = rescanRequired || (review.customerDiscoveredCandidateAssets ?? []).some((candidate) => (
    candidate.status === "imported"
    && Boolean(candidate.imported_at)
    && (!review.lastScanAt || new Date(candidate.imported_at as string).getTime() > new Date(review.lastScanAt).getTime())
  ));

  return (
    <div style={{ padding: "22px 20px 32px", display: "grid", gap: 14 }}>
      {/* Header */}
      <header style={{ ...PANEL, display: "grid", gap: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 18, alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 11, letterSpacing: "0.18em", color: "rgba(212,175,55,0.72)" }}>
              DEFENSE REVIEW
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 8 }}>
              <h1 style={{ margin: 0, fontSize: 26, color: TEXT }}>{review.projectName}</h1>
              <StatusPill status={review.status} />
            </div>
            <div style={{ marginTop: 6, fontSize: 12, color: MUTED }}>
              {review.id} &bull; Created {formatDate(review.createdAt)} &bull; Updated {formatDate(review.updatedAt)}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "flex-start", flexWrap: "wrap" }}>
            <Link
              href={`/dashboard/defense-review/${review.id}/report`}
              style={{
                display: "inline-block",
                fontSize: 11,
                fontWeight: 700,
                color: "#0a0c12",
                background: GOLD,
                textDecoration: "none",
                padding: "5px 12px",
                borderRadius: 4,
                letterSpacing: "0.04em",
              }}
            >
              View Report
            </Link>
            <NavLink href="/dashboard/defense-review" label="← All Reviews" />
          </div>
        </div>

        {/* Service framing */}
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
          Public-surface review using mapped assets, authority findings, relevant threat families, and requested
          evidence. SCE does not administer this project or hold keys.
        </div>
      </header>

      {error ? (
        <div style={{ ...PANEL, borderColor: "rgba(239,68,68,0.25)", color: "#FCA5A5" }}>{error}</div>
      ) : null}
      {message ? (
        <div style={{ ...PANEL, borderColor: "rgba(34,197,94,0.24)", color: "#86EFAC" }}>{message}</div>
      ) : null}

      {/* KPI row */}
      <section style={{ display: "grid", gap: 8 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
          <div style={{ fontSize: 11, color: MUTED }}>Counts snapshotted at review creation. Refresh to re-sync from current project state.</div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              onClick={handleRefresh}
              disabled={!canImportCandidates || refreshing || scanning}
              style={{
                border: "1px solid rgba(212,175,55,0.3)",
                borderRadius: 6,
                background: "rgba(212,175,55,0.1)",
                color: refreshing ? MUTED : GOLD,
                padding: "5px 12px",
                fontSize: 11,
                fontWeight: 700,
                cursor: refreshing ? "default" : "pointer",
                whiteSpace: "nowrap",
              }}
            >
              {refreshing ? "Refreshing…" : "Refresh Counts"}
            </button>
            <button
              type="button"
              onClick={handleRunScan}
              disabled={!canRunScan || scanning || refreshing}
              style={{
                border: `1px solid ${scanning ? "rgba(148,163,184,0.2)" : "rgba(249,115,22,0.4)"}`,
                borderRadius: 6,
                background: scanning ? "rgba(148,163,184,0.06)" : "rgba(249,115,22,0.1)",
                color: scanning ? MUTED : "#F97316",
                padding: "5px 12px",
                fontSize: 11,
                fontWeight: 700,
                cursor: scanning ? "default" : "pointer",
                whiteSpace: "nowrap",
              }}
            >
              {scanning ? "Scanning…" : "Run EVM Scan"}
            </button>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gap: 8 }}>
        <Kpi label="Assets Mapped" value={String(review.assetsCount)} />
        <Kpi label="Open Analytical Findings" value={String(review.findingsCount)} />
        <Kpi label="Supporting Evidence Receipts" value={String(review.supportingEvidenceReceiptsCount ?? 0)} />
        <Kpi label="Candidate Assets Discovered" value={String(review.candidateAssetsDiscoveredCount ?? 0)} />
        <Kpi
          label="Critical"
          value={String(review.criticalFindingsCount)}
          color={review.criticalFindingsCount > 0 ? "#EF4444" : TEXT}
        />
        <Kpi
          label="High"
          value={String(review.highFindingsCount)}
          color={review.highFindingsCount > 0 ? "#F97316" : TEXT}
        />
        <Kpi label="Threat Families" value={String(review.relevantThreatFamiliesCount)} />
        <Kpi label="Public Facts Observed" value={String(evidenceStatus.publicFactsObserved ?? 0)} />
        <Kpi label="Unresolved Assumptions" value={String(evidenceStatus.unresolvedAssumptions ?? 0)} color={GOLD} />
        </div>
      </section>

      {/* Scan status */}
      <ScanStatusPanel review={review} scanResult={scanResult} />

      {importedNeedsScan ? (
        <section style={{ ...PANEL, borderColor: "rgba(249,115,22,0.3)", background: "rgba(249,115,22,0.06)", display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ fontSize: 12, color: "#FDBA74" }}>
            Imported assets are now in the Project Map. Re-run the EVM scan to include them in authority review results.
          </div>
          <button
            type="button"
            onClick={handleRunScan}
            disabled={!canRunScan || scanning}
            style={candidateActionStyle(!canRunScan || scanning)}
          >
            {scanning ? "Scanning..." : "Re-run EVM scan"}
          </button>
        </section>
      ) : null}

      {(review.customerDiscoveredCandidateAssets ?? []).length > 0 ? (
        <CandidateAssetsPanel
          candidates={review.customerDiscoveredCandidateAssets ?? []}
          canImport={canImportCandidates}
          pendingIds={candidatePendingIds}
          batchImporting={candidateBatchImporting}
          failures={candidateFailures}
          batchSummary={candidateBatchSummary}
          onImport={handleCandidateImport}
          onBatchImport={handleCandidateBatchImport}
        />
      ) : null}

      <PaidReviewWorkflowPanel
        review={review}
        busy={workflowSaving}
        scanning={scanning}
        onValidate={() => workflowAction("Validate Assets", () => validateDefenseReviewAssets(review.id))}
        onRunScan={handleRunScan}
        onEvidence={() => workflowAction("Mark Evidence Requested", () => markEvidenceRequested(review.id))}
        onSecondReview={() => workflowAction("Complete Second Review", () => completeSecondReview(review.id, {
          outcome: "approve",
          checklist: Object.fromEntries(SECOND_REVIEW_CHECKS.map((key) => [key, true])),
        }))}
        onReady={() => workflowAction("Mark Ready for Delivery", () => markReadyForDelivery(review.id, {
          deliveryChecklistPassed: true,
          limitedReviewSelected: review.readinessStatus === "thin_review",
          sampleDelivery: false,
        }))}
        onDelivered={() => workflowAction("Mark Delivered", () => markDelivered(review.id, {
          deliveredReportVersion: `${review.id}-v1`,
        }))}
      />

      {/* Summary panels */}
      <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
        <div style={PANEL}>
          <SectionLabel>FINDINGS</SectionLabel>
          {review.findingsCount === 0 ? (
            <div style={{ fontSize: 12, color: MUTED }}>No findings recorded yet.</div>
          ) : (
            <div style={{ display: "grid", gap: 6 }}>
              <FindingSummaryRow label="Critical" count={review.criticalFindingsCount} color="#EF4444" />
              <FindingSummaryRow label="High" count={review.highFindingsCount} color="#F97316" />
              <FindingSummaryRow
                label="Other"
                count={review.findingsCount - review.criticalFindingsCount - review.highFindingsCount}
                color={GOLD}
              />
              <div style={{ marginTop: 6 }}>
                <NavLink href="/dashboard/project-map" label="View in Admin Surface →" />
              </div>
            </div>
          )}
        </div>

        <div style={PANEL}>
          <SectionLabel>RELEVANT THREAT FAMILIES</SectionLabel>
          {review.relevantThreatFamiliesCount === 0 ? (
            <div style={{ fontSize: 12, color: MUTED }}>No relevant threat families mapped yet.</div>
          ) : (
            <div style={{ display: "grid", gap: 6 }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: TEXT }}>{review.relevantThreatFamiliesCount}</div>
              <div style={{ fontSize: 11, color: MUTED }}>mapped from project surface</div>
              <div style={{ marginTop: 6, display: "flex", gap: 8, flexWrap: "wrap" }}>
                <NavLink href="/dashboard/project-map" label="Relevant Threats →" />
                <NavLink href="/dashboard/threat-matrix" label="Threat Matrix →" />
              </div>
            </div>
          )}
        </div>

        <div style={PANEL}>
          <SectionLabel>EVIDENCE STATUS</SectionLabel>
          {(evidenceStatus.publicFactsObserved ?? 0) === 0 && (evidenceStatus.unresolvedAssumptions ?? 0) === 0 ? (
            <div style={{ fontSize: 12, color: MUTED }}>No evidence status summary generated yet.</div>
          ) : (
            <div style={{ display: "grid", gap: 6 }}>
              <div style={{ display: "flex", gap: 16 }}>
                <div>
                  <div style={{ fontSize: 9, color: MUTED, letterSpacing: "0.1em" }}>PUBLIC FACTS</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: TEXT }}>{evidenceStatus.publicFactsObserved ?? 0}</div>
                </div>
                <div>
                  <div style={{ fontSize: 9, color: MUTED, letterSpacing: "0.1em" }}>ASSUMPTIONS</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: GOLD }}>{evidenceStatus.unresolvedAssumptions ?? 0}</div>
                </div>
                <div>
                  <div style={{ fontSize: 9, color: MUTED, letterSpacing: "0.1em" }}>REQUESTS</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: TEXT }}>{evidenceStatus.clientOperatorEvidenceRequests ?? 0}</div>
                </div>
              </div>
              <div style={{ marginTop: 6 }}>
                <NavLink href={`/dashboard/defense-review/${review.id}/report`} label="View Report →" />
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Report status */}
      <section style={PANEL}>
        <SectionLabel>REPORT STATUS</SectionLabel>
        <ReportStatusRow review={review} onUpdate={setReview} />
      </section>

      {/* Notes */}
      {review.notes ? (
        <section style={PANEL}>
          <SectionLabel>NOTES</SectionLabel>
          <div style={{ fontSize: 13, color: TEXT, whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{review.notes}</div>
        </section>
      ) : null}

      {/* Navigation links */}
      <section style={PANEL}>
        <SectionLabel>NAVIGATE</SectionLabel>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <NavLink href="/dashboard/project-map" label="Project Map" />
          <NavLink href="/dashboard/project-map" label="Admin Surface" />
          <NavLink href="/dashboard/project-map" label="Relevant Threats" />
          <NavLink href="/dashboard/threat-matrix" label="Threat Matrix" />
          <NavLink href="/dashboard/doctrine" label="Doctrine Engine" />
        </div>
      </section>

      {/* Update form */}
      <section style={PANEL}>
        <SectionLabel>UPDATE REVIEW</SectionLabel>
        <form onSubmit={handleSave} style={{ display: "grid", gap: 10, maxWidth: 540 }}>
          <div>
            <label style={{ fontSize: 11, color: MUTED, display: "block", marginBottom: 4 }}>Status</label>
            <select
              value={editStatus}
              onChange={(e) => setEditStatus(e.target.value as DefenseReviewStatus)}
              disabled={saving}
              style={{
                width: "100%",
                background: "rgba(15,17,24,0.95)",
                border: "1px solid rgba(212,175,55,0.22)",
                borderRadius: 5,
                color: TEXT,
                padding: "6px 8px",
                fontSize: 12,
              }}
            >
              {ALL_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, color: MUTED, display: "block", marginBottom: 4 }}>Notes (optional)</label>
            <textarea
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              rows={3}
              disabled={saving}
              placeholder="Add operator notes…"
              style={{
                width: "100%",
                background: "rgba(15,17,24,0.95)",
                border: "1px solid rgba(212,175,55,0.22)",
                borderRadius: 5,
                color: TEXT,
                padding: "6px 8px",
                fontSize: 12,
                resize: "vertical",
                boxSizing: "border-box",
              }}
            />
          </div>
          <div>
            <button
              type="submit"
              disabled={saving}
              style={{
                background: saving ? "rgba(148,163,184,0.15)" : GOLD,
                color: saving ? MUTED : "#0a0c12",
                border: "none",
                borderRadius: 5,
                padding: "7px 18px",
                fontSize: 12,
                fontWeight: 700,
                cursor: saving ? "not-allowed" : "pointer",
                letterSpacing: "0.04em",
              }}
            >
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

const SCAN_STATUS_COLOR: Record<ScanStatus, string> = {
  not_run: "rgba(148,163,184,0.6)",
  running: "#3B82F6",
  complete: "#22C55E",
  partial: "#F97316",
  error: "#EF4444",
};

function countValue(summary: Record<string, unknown> | undefined, camel: string, snake: string): number {
  const value = summary?.[camel] ?? summary?.[snake];
  return typeof value === "number" ? value : 0;
}

function boolValue(summary: Record<string, unknown> | undefined, camel: string, snake: string): boolean {
  const value = summary?.[camel] ?? summary?.[snake];
  return value === true;
}

function stringList(summary: Record<string, unknown> | undefined, key: string): string[] {
  const value = summary?.[key];
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function PaidReviewWorkflowPanel({
  review,
  busy,
  scanning,
  onValidate,
  onRunScan,
  onEvidence,
  onSecondReview,
  onReady,
  onDelivered,
}: {
  review: DefenseReview;
  busy: string;
  scanning: boolean;
  onValidate: () => void;
  onRunScan: () => void;
  onEvidence: () => void;
  onSecondReview: () => void;
  onReady: () => void;
  onDelivered: () => void;
}) {
  const validation = review.assetValidationSummary;
  const readiness = review.reviewReadinessSummary;
  const blockers = [
    ...stringList(validation, "blockers"),
    ...stringList(readiness, "blockers"),
  ].slice(0, 6);
  const recommended =
    (readiness?.recommendedAction as string | undefined) ??
    (readiness?.recommended_action as string | undefined) ??
    "Validate assets, run scan, request evidence, complete second review, then mark delivery readiness.";
  const readyForScan = boolValue(validation, "readyForScan", "ready_for_scan");
  const deliveryAllowed = boolValue(readiness, "deliveryAllowed", "delivery_allowed");

  return (
    <section className="no-print" style={{ ...PANEL, display: "grid", gap: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <SectionLabel>PAID REVIEW WORKFLOW</SectionLabel>
          <div style={{ fontSize: 15, color: TEXT, fontWeight: 800 }}>{review.workflowStageLabel ?? "Intake Started"}</div>
          <div style={{ marginTop: 3, fontSize: 11, color: MUTED }}>
            Starter Defense Review &bull; ${review.reviewPriceUsd ?? 3000}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-start" }}>
          <WorkflowButton label="Validate Assets" busy={busy} onClick={onValidate} />
          <WorkflowButton label={scanning ? "Scanning..." : "Run Scan / Refresh Intelligence"} busy={busy} disabled={scanning} onClick={onRunScan} />
          <WorkflowButton label="Mark Evidence Requested" busy={busy} onClick={onEvidence} />
          <WorkflowButton label="Complete Second Review" busy={busy} onClick={onSecondReview} />
          <WorkflowButton label="Mark Ready for Delivery" busy={busy} onClick={onReady} disabled={!deliveryAllowed && !(review.secondReviewCompletedAt && review.evidenceRequestedAt)} />
          <WorkflowButton label="Mark Delivered" busy={busy} onClick={onDelivered} disabled={review.deliveryStatus !== "ready"} />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 8 }}>
        <WorkflowStat label="Workflow" value={review.workflowStatus ?? "intake_started"} />
        <WorkflowStat label="Readiness" value={review.readinessStatus ?? "needs_evidence"} />
        <WorkflowStat
          label="Asset Validation"
          value={`${countValue(validation, "validAssetCount", "valid_asset_count")} valid / ${countValue(validation, "invalidAssetCount", "invalid_asset_count")} invalid`}
          color={readyForScan ? "#22C55E" : "#F97316"}
        />
        <WorkflowStat label="Scan" value={review.scanStatus ?? "not_run"} color={review.scanStatus === "complete" ? "#22C55E" : undefined} />
        <WorkflowStat label="Evidence Request" value={review.evidenceRequestedAt ? "generated" : "not generated"} color={review.evidenceRequestedAt ? "#22C55E" : undefined} />
        <WorkflowStat label="Second Review" value={review.secondReviewCompletedAt ? "completed" : "pending"} color={review.secondReviewCompletedAt ? "#22C55E" : "#F97316"} />
        <WorkflowStat
          label="Delivery"
          value={review.deliveryStatus === "delivered" && review.deliveredReportVersion
            ? `delivered - ${review.deliveredReportVersion}`
            : review.deliveryStatus ?? "not_ready"}
          color={review.deliveryStatus === "ready" || review.deliveryStatus === "delivered" ? "#22C55E" : undefined}
        />
      </div>

      <div style={{ fontSize: 11, color: MUTED, lineHeight: 1.6 }}>
        Recommended next action: <span style={{ color: TEXT }}>{recommended}</span>
      </div>
      {blockers.length > 0 ? (
        <div style={{ borderTop: "1px solid rgba(212,175,55,0.12)", paddingTop: 8 }}>
          <div style={{ fontSize: 10, letterSpacing: "0.1em", color: "#F97316", fontWeight: 800, marginBottom: 5 }}>BLOCKERS</div>
          <ul style={{ margin: 0, paddingLeft: 16, display: "grid", gap: 2 }}>
            {blockers.map((item, index) => (
              <li key={index} style={{ fontSize: 11, color: "#FDBA74", lineHeight: 1.5 }}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

function WorkflowStat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ border: "1px solid rgba(148,163,184,0.12)", borderRadius: 6, padding: "8px 10px", background: "rgba(255,255,255,0.02)" }}>
      <div style={{ fontSize: 9, letterSpacing: "0.1em", color: MUTED }}>{label.toUpperCase()}</div>
      <div style={{ marginTop: 3, fontSize: 12, color: color ?? TEXT, fontWeight: 800 }}>{String(value).replaceAll("_", " ")}</div>
    </div>
  );
}

function WorkflowButton({
  label,
  busy,
  disabled,
  onClick,
}: {
  label: string;
  busy: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  const isBusy = busy === label;
  const isDisabled = disabled || Boolean(busy);
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isDisabled}
      style={{
        border: `1px solid ${isDisabled ? "rgba(148,163,184,0.16)" : "rgba(212,175,55,0.35)"}`,
        borderRadius: 5,
        background: isDisabled ? "rgba(148,163,184,0.06)" : "rgba(212,175,55,0.1)",
        color: isDisabled ? MUTED : GOLD,
        padding: "5px 10px",
        fontSize: 10,
        fontWeight: 800,
        cursor: isDisabled ? "default" : "pointer",
        whiteSpace: "nowrap",
      }}
    >
      {isBusy ? "Working..." : label}
    </button>
  );
}

const _SCAN_STATUS_LABEL_BASE: Record<ScanStatus, string> = {
  not_run: "Not Run",
  running: "Running…",
  complete: "Complete",
  partial: "Partial",
  error: "Error",
};

function getScanStatusLabel(review: DefenseReview): string {
  const status = review.scanStatus ?? "not_run";
  if (status !== "partial") return _SCAN_STATUS_LABEL_BASE[status] ?? status;
  const rpcStatus = review.rpcStatus;
  if (rpcStatus === "rpc_configured_preflight_failed") return "Partial — RPC preflight failed";
  if (rpcStatus === "detector_execution_inconclusive" || rpcStatus === "inconclusive_transport_failure") return "Partial — RPC detector execution failed";
  if (rpcStatus === "detector_execution_completed_with_errors" || rpcStatus === "completed_with_errors") return "Partial — detector execution completed with errors";
  if ((review.scanChainsUnconfigured?.length ?? 0) > 0 && !review.rpcConfigured) return "Partial — some chains unconfigured";
  if (rpcStatus === "rpc_unconfigured" || rpcStatus === "unavailable") return "Partial — RPC unavailable";
  if (rpcStatus === "detector_execution_skipped") return "Partial — detector execution skipped";
  return "Partial — detector execution incomplete";
}

function ScanStatusPanel({
  review,
  scanResult,
}: {
  review: DefenseReview;
  scanResult: RunScanResponse | null;
}) {
  const status = review.scanStatus ?? "not_run";
  const color = SCAN_STATUS_COLOR[status];
  const label = getScanStatusLabel(review);

  return (
    <section style={{ ...PANEL, display: "grid", gap: 8 }}>
      <SectionLabel>EVM SCAN STATUS</SectionLabel>
      <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            color,
            background: `${color}18`,
            padding: "3px 10px",
            borderRadius: 4,
            border: `1px solid ${color}44`,
          }}
        >
          {label}
        </span>
        {review.lastScanAt && (
          <span style={{ fontSize: 11, color: MUTED }}>Last scanned {formatDate(review.lastScanAt)}</span>
        )}
        {scanResult && (
          <span style={{ fontSize: 11, color: "#86EFAC" }}>
            {scanResult.findingsCreated} findings · {scanResult.detectorsRan} detectors ran
            {scanResult.chainsConfigured.length > 0 && ` · chains ${scanResult.chainsConfigured.join(", ")}`}
          </span>
        )}
      </div>
      {(review.scanChainsUnconfigured?.length > 0) && (
        <div style={{ fontSize: 11, color: "#F97316" }}>
          No RPC configured for chain{review.scanChainsUnconfigured.length > 1 ? "s" : ""}{" "}
          {review.scanChainsUnconfigured.join(", ")} — set{" "}
          <code style={{ fontFamily: "monospace", background: "rgba(249,115,22,0.1)", padding: "0 4px", borderRadius: 3 }}>
            SCE_EVM_RPC_URL_{"{chain_id}"}
          </code>{" "}
          , enable <code style={{ fontFamily: "monospace", background: "rgba(249,115,22,0.1)", padding: "0 4px", borderRadius: 3 }}>SCE_USE_MORALIS_RPC_FALLBACKS=true</code>{" "}
          with <code style={{ fontFamily: "monospace", background: "rgba(249,115,22,0.1)", padding: "0 4px", borderRadius: 3 }}>MORALIS_NODE_KEY</code>, or enable{" "}
          <code style={{ fontFamily: "monospace", background: "rgba(249,115,22,0.1)", padding: "0 4px", borderRadius: 3 }}>SCE_USE_PUBLIC_RPC_FALLBACKS=1</code>.
        </div>
      )}
      {scanResult?.scanMetadata?.rpc_resolutions && Object.entries(scanResult.scanMetadata.rpc_resolutions).map(([chainId, rpc]) => (
        <div key={chainId} style={{ fontSize: 11, color: MUTED }}>
          RPC chain {chainId}: provider <code>{rpc.provider}</code>, status <code>{rpc.status}</code>
          {rpc.redacted_url ? <>; endpoint <code>{rpc.redacted_url}</code></> : null}
        </div>
      ))}
      {scanResult?.scanMetadata?.rpc_preflight_status && (
        <div style={{ fontSize: 11, color: MUTED }}>
          RPC preflight <code>{scanResult.scanMetadata.rpc_preflight_status}</code>
          {"; "}
          {scanResult.scanMetadata.detector_execution_status === "detector_execution_completed"
            ? "detector execution completed"
            : scanResult.scanMetadata.detector_execution_status === "detector_execution_completed_with_errors"
              ? "detector execution completed with unresolved/errors"
              : `detector execution ${String(scanResult.scanMetadata.detector_execution_status ?? "unknown")}`}
          {"; "}retries: <code>{String(scanResult.scanMetadata.rpc_detector_retry_count ?? 0)}</code>
        </div>
      )}
      {review.scanNotes && (
        <div style={{ fontSize: 11, color: MUTED }}>{review.scanNotes}</div>
      )}
    </section>
  );
}

const REPORT_STATUS_LABEL: Record<string, string> = {
  not_generated: "Not Generated",
  draft: "Draft",
  ready: "Ready",
};

function ReportStatusRow({
  review,
  onUpdate,
}: {
  review: DefenseReview;
  onUpdate: (r: DefenseReview) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const rs = review.reportStatus;
  const label = REPORT_STATUS_LABEL[rs] ?? rs;
  const labelColor =
    rs === "ready" ? "#22C55E" : rs === "draft" ? GOLD : MUTED;

  async function markAs(value: string) {
    setSaving(true);
    setMsg("");
    try {
      const updated = await updateDefenseReview(review.id, { reportStatus: value });
      onUpdate(updated);
      setMsg(`Marked as ${REPORT_STATUS_LABEL[value] ?? value}.`);
    } catch {
      setMsg("Failed to update.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: 8 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <span style={{ fontSize: 13, color: labelColor, fontWeight: 700 }}>{label}</span>
        {rs !== "draft" && (
          <button
            type="button"
            onClick={() => markAs("draft")}
            disabled={saving}
            style={{
              background: "transparent",
              border: `1px solid ${GOLD}55`,
              borderRadius: 4,
              color: GOLD,
              fontSize: 11,
              padding: "3px 10px",
              cursor: saving ? "not-allowed" : "pointer",
              fontWeight: 600,
            }}
          >
            Mark Draft
          </button>
        )}
        {rs !== "ready" && (
          <button
            type="button"
            onClick={() => markAs("ready")}
            disabled={saving}
            style={{
              background: saving ? "rgba(148,163,184,0.1)" : GOLD,
              border: "none",
              borderRadius: 4,
              color: saving ? MUTED : "#0a0c12",
              fontSize: 11,
              padding: "3px 10px",
              cursor: saving ? "not-allowed" : "pointer",
              fontWeight: 700,
            }}
          >
            Mark Ready
          </button>
        )}
        <Link
          href={`/dashboard/defense-review/${review.id}/report`}
          style={{
            fontSize: 11,
            color: GOLD,
            textDecoration: "none",
            border: `1px solid ${GOLD}44`,
            padding: "3px 10px",
            borderRadius: 4,
          }}
        >
          Open Report →
        </Link>
      </div>
      {msg && <div style={{ fontSize: 11, color: "#86EFAC" }}>{msg}</div>}
    </div>
  );
}

function FindingSummaryRow({
  label,
  count,
  color,
}: {
  label: string;
  count: number;
  color: string;
}) {
  if (count === 0) return null;
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span style={{ fontSize: 11, color: MUTED }}>{label}</span>
      <span
        style={{
          fontSize: 11,
          fontWeight: 700,
          color,
          background: `${color}18`,
          padding: "1px 8px",
          borderRadius: 3,
        }}
      >
        {count}
      </span>
    </div>
  );
}
