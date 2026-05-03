"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { fetchDefenseReview, refreshDefenseReview, updateDefenseReview } from "@/lib/defense-review/service";
import type { DefenseReview, DefenseReviewStatus } from "@/lib/defense-review/types";

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

export default function DefenseReviewDetailPage() {
  const params = useParams();
  const reviewId = typeof params.id === "string" ? params.id : "";

  const [review, setReview] = useState<DefenseReview | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [editStatus, setEditStatus] = useState<DefenseReviewStatus | "">("");
  const [editNotes, setEditNotes] = useState("");
  const [refreshing, setRefreshing] = useState(false);

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

  const controlCoverage =
    review.controlsCount > 0
      ? Math.round((review.verifiedControlsCount / review.controlsCount) * 100)
      : 0;

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
          Public-surface review using mapped assets, authority findings, relevant threat families, and recommended
          controls. SCE does not control this project or hold keys.
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
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
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
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gap: 8 }}>
        <Kpi label="Assets Mapped" value={String(review.assetsCount)} />
        <Kpi label="Open Findings" value={String(review.findingsCount)} />
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
        <Kpi label="Controls" value={String(review.controlsCount)} />
        <Kpi
          label="Verified"
          value={String(review.verifiedControlsCount)}
          color="#22C55E"
          sub={`${controlCoverage}% coverage`}
        />
        </div>
      </section>

      {/* Empty states for findings, threats, controls */}
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
          <SectionLabel>CONTROLS</SectionLabel>
          {review.controlsCount === 0 ? (
            <div style={{ fontSize: 12, color: MUTED }}>No controls generated yet.</div>
          ) : (
            <div style={{ display: "grid", gap: 6 }}>
              <div style={{ display: "flex", gap: 16 }}>
                <div>
                  <div style={{ fontSize: 9, color: MUTED, letterSpacing: "0.1em" }}>TOTAL</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: TEXT }}>{review.controlsCount}</div>
                </div>
                <div>
                  <div style={{ fontSize: 9, color: MUTED, letterSpacing: "0.1em" }}>VERIFIED</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: "#22C55E" }}>{review.verifiedControlsCount}</div>
                </div>
                <div>
                  <div style={{ fontSize: 9, color: MUTED, letterSpacing: "0.1em" }}>COVERAGE</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: GOLD }}>{controlCoverage}%</div>
                </div>
              </div>
              <div style={{ marginTop: 6 }}>
                <NavLink href="/dashboard/project-map" label="View Controls →" />
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
          <NavLink href="/dashboard/project-map" label="Controls" />
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
