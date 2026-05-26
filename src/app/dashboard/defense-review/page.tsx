"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { useSession } from "@/components/layout/SessionContext";
import { fetchDefenseReviews } from "@/lib/defense-review/service";
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

function formatDate(value?: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
}

function StatusPill({ status }: { status: DefenseReviewStatus }) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 8px",
        borderRadius: 4,
        fontSize: 10,
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

export default function DefenseReviewsPage() {
  const me = useSession();
  const [reviews, setReviews] = useState<DefenseReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    fetchDefenseReviews()
      .then(setReviews)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Failed to load reviews"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ padding: "22px 20px 32px", display: "grid", gap: 14 }}>
      <header style={{ ...PANEL, display: "grid", gap: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 18, alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 11, letterSpacing: "0.18em", color: "rgba(212,175,55,0.72)" }}>
              ACCOUNT OPERATIONS
            </div>
            <h1 style={{ margin: "8px 0 6px", fontSize: 30, color: TEXT }}>Defense Reviews</h1>
            <p style={{ margin: 0, color: "rgba(203,213,225,0.72)", maxWidth: 800, lineHeight: 1.5, fontSize: 13 }}>
              Public-surface review using mapped assets, authority findings, relevant threat families, and requested evidence.
              SCE does not administer the reviewed project or hold keys.
            </p>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 9, color: MUTED, letterSpacing: "0.1em", marginBottom: 4 }}>CURRENT CONTEXT</div>
            <div style={{ fontSize: 13, color: TEXT, fontWeight: 800 }}>{me?.activeAccount?.name ?? "No active account"}</div>
            <div style={{ marginTop: 8 }}>
              <Link
                href="/dashboard/project-map"
                style={{ fontSize: 11, color: GOLD, textDecoration: "none", border: `1px solid ${GOLD}44`, padding: "4px 10px", borderRadius: 4 }}
              >
                Open Project Map
              </Link>
            </div>
          </div>
        </div>
      </header>

      {error ? (
        <div style={{ ...PANEL, borderColor: "rgba(239,68,68,0.25)", color: "#FCA5A5" }}>{error}</div>
      ) : null}

      {loading ? (
        <div style={{ ...PANEL, color: MUTED, fontSize: 13 }}>Loading reviews…</div>
      ) : reviews.length === 0 ? (
        <section style={{ ...PANEL, display: "grid", gap: 10 }}>
          <div style={{ fontSize: 11, letterSpacing: "0.14em", color: "rgba(212,175,55,0.6)" }}>NO REVIEWS YET</div>
          <div style={{ fontSize: 13, color: MUTED }}>
            No Defense Reviews created yet. Select a project in{" "}
            <Link href="/dashboard/project-map" style={{ color: GOLD }}>
              Project Map
            </Link>{" "}
            and use <strong style={{ color: TEXT }}>Start Defense Review</strong> to create one.
          </div>
        </section>
      ) : (
        <section style={{ display: "grid", gap: 10 }}>
          {reviews.map((review) => (
            <ReviewRow key={review.id} review={review} />
          ))}
        </section>
      )}
    </div>
  );
}

function ReviewRow({ review }: { review: DefenseReview }) {
  return (
    <Link
      href={`/dashboard/defense-review/${review.id}`}
      style={{ textDecoration: "none" }}
    >
      <div
        style={{
          ...PANEL,
          display: "grid",
          gridTemplateColumns: "1fr auto",
          gap: 12,
          alignItems: "center",
          cursor: "pointer",
          transition: "border-color 0.15s",
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(212,175,55,0.32)"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(212,175,55,0.12)"; }}
      >
        <div style={{ display: "grid", gap: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 15, fontWeight: 800, color: TEXT }}>{review.projectName}</span>
            <StatusPill status={review.status} />
          </div>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <Stat label="Assets" value={String(review.assetsCount)} />
            <Stat label="Open Findings" value={String(review.findingsCount)} />
            <Stat label="Critical" value={String(review.criticalFindingsCount)} color="#EF4444" />
            <Stat label="High" value={String(review.highFindingsCount)} color="#F97316" />
            <Stat label="Threat Families" value={String(review.relevantThreatFamiliesCount)} />
            <Stat label="Public Facts" value={String(review.customerEvidenceStatus?.publicFactsObserved ?? 0)} />
            <Stat label="Assumptions" value={String(review.customerEvidenceStatus?.unresolvedAssumptions ?? 0)} color={GOLD} />
          </div>
        </div>
        <div style={{ textAlign: "right", display: "grid", gap: 4 }}>
          <div style={{ fontSize: 10, color: MUTED }}>Created</div>
          <div style={{ fontSize: 11, color: TEXT }}>{formatDate(review.createdAt)}</div>
          <div style={{ marginTop: 6, fontSize: 10, color: GOLD, letterSpacing: "0.08em" }}>VIEW →</div>
        </div>
      </div>
    </Link>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
      <span style={{ fontSize: 9, color: MUTED, letterSpacing: "0.1em" }}>{label.toUpperCase()}</span>
      <span style={{ fontSize: 13, fontWeight: 700, color: color ?? TEXT }}>{value}</span>
    </div>
  );
}
