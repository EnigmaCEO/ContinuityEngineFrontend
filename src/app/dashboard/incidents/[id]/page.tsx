"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, ArrowLeft, ExternalLink, FolderOpen, RefreshCw } from "lucide-react";
import { SeverityBadge } from "@/components/case-library/badges/SeverityBadge";
import { StatusBadge } from "@/components/case-library/badges/StatusBadge";
import type { CaseLibraryRecord, DoctrineStatus, ReplayStatus } from "@/lib/case-library/types";
import { fetchCase } from "@/lib/case-library/service";
import { CLR, doctrineColor, formatTs } from "@/lib/case-library/utils";

function replayLabel(status?: ReplayStatus): string {
  if (status === "passed") return "Case Indexed";
  if (status === "failed") return "Replay Failed";
  return "Replay Pending";
}

function replayColor(status?: ReplayStatus): string {
  if (status === "passed") return CLR.green;
  if (status === "failed") return CLR.red;
  if (status === "available") return CLR.blue;
  return CLR.gold;
}

function coverageLabel(status?: DoctrineStatus): string {
  if (status === "linked" || status === "updated") return "Response Coverage";
  return "Coverage Pending";
}

function Pill({ label, color }: { label: string; color: string }) {
  return (
    <span
      style={{
        background: `${color}18`,
        border: `1px solid ${color}38`,
        borderRadius: 4,
        color,
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: "0.07em",
        padding: "2px 7px",
        textTransform: "uppercase",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      style={{
        background: CLR.surface,
        border: `1px solid ${CLR.border}`,
        borderRadius: 8,
        padding: "16px 18px",
      }}
    >
      <div
        style={{
          color: CLR.gold,
          fontSize: 10,
          fontWeight: 750,
          letterSpacing: "0.12em",
          marginBottom: 12,
          textTransform: "uppercase",
        }}
      >
        {title}
      </div>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div
        style={{
          color: "rgba(140,140,170,0.58)",
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: "0.1em",
          marginBottom: 5,
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>
      <div style={{ color: CLR.text, fontSize: 11.5, lineHeight: 1.45 }}>{children}</div>
    </div>
  );
}

function tagsFor(record: CaseLibraryRecord): string[] {
  return [
    ...new Set([
      ...(record.tags ?? []),
      record.type,
      record.subsystem,
      record.chainSystem,
      ...(record.doctrineTags ?? []),
    ].filter(Boolean) as string[]),
  ];
}

function sourceUrlFor(record: CaseLibraryRecord): string | undefined {
  for (const ref of record.sourceRefs ?? []) {
    const url = ref.referenceUrls?.find(Boolean);
    if (url) return url;
  }
  return undefined;
}

function incidentDate(record: CaseLibraryRecord): { value?: string; label: string } {
  const observedAt = record.sourceRefs?.find((ref) => ref.observedAt)?.observedAt;
  if (observedAt) return { value: observedAt, label: "Published / Discovered" };
  return { value: record.ingestedAt, label: "Ingested" };
}

function LoadingState() {
  return (
    <div style={{ display: "grid", gap: 12 }}>
      {Array.from({ length: 4 }, (_, idx) => (
        <div
          key={idx}
          style={{
            background: CLR.surface,
            border: `1px solid ${CLR.border}`,
            borderRadius: 8,
            padding: 18,
          }}
        >
          <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 4, height: 12, width: idx === 0 ? "45%" : "70%" }} />
        </div>
      ))}
    </div>
  );
}

export default function IncidentDetailPage() {
  const params = useParams<{ id: string }>();
  const incidentId = decodeURIComponent(params.id);
  const [record, setRecord] = useState<CaseLibraryRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadIncident = useCallback(async () => {
    setLoading(true);
    setError(null);
    setNotFound(false);
    try {
      const next = await fetchCase(incidentId);
      setRecord(next);
    } catch (err) {
      const message = (err as Error).message ?? "Failed to load incident.";
      if (message.includes("404")) setNotFound(true);
      else setError(message);
      setRecord(null);
    } finally {
      setLoading(false);
    }
  }, [incidentId]);

  useEffect(() => {
    void loadIncident();
  }, [loadIncident]);

  const derived = useMemo(() => {
    if (!record) return null;
    const date = incidentDate(record);
    const sourceUrl = sourceUrlFor(record);
    const tags = tagsFor(record);
    const evidenceRefs = (record.sourceRefs ?? []).flatMap((ref) => ref.referenceUrls ?? []);
    return { date, sourceUrl, tags, evidenceRefs: [...new Set(evidenceRefs)].slice(0, 5) };
  }, [record]);

  return (
    <div style={{ minHeight: "100%", background: CLR.bg, padding: "22px 18px 28px" }}>
      <header
        style={{
          borderBottom: `1px solid ${CLR.border}`,
          display: "flex",
          gap: 16,
          justifyContent: "space-between",
          marginBottom: 18,
          paddingBottom: 18,
        }}
      >
        <div>
          <Link
            href="/dashboard/incidents"
            style={{
              alignItems: "center",
              color: CLR.muted,
              display: "inline-flex",
              fontSize: 10.5,
              gap: 6,
              marginBottom: 12,
              textDecoration: "none",
            }}
          >
            <ArrowLeft size={12} />
            Back to Incidents
          </Link>
          <div style={{ color: CLR.gold, fontSize: 9, fontWeight: 700, letterSpacing: "0.16em", marginBottom: 6 }}>
            GLOBAL INTELLIGENCE
          </div>
          <h1 style={{ color: CLR.text, fontSize: 20, fontWeight: 750, letterSpacing: "0.04em", lineHeight: 1.25, margin: 0 }}>
            {record?.title ?? (notFound ? "Incident not found" : "Incident Detail")}
          </h1>
          <p style={{ color: "rgba(140,140,170,0.78)", fontSize: 12, lineHeight: 1.55, margin: "7px 0 0", maxWidth: 720 }}>
            Existing normalized Case Library record rendered as lightweight incident detail.
          </p>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, height: "fit-content", justifyContent: "flex-end" }}>
          <button
            onClick={() => void loadIncident()}
            style={{
              alignItems: "center",
              background: "rgba(255,255,255,0.04)",
              border: `1px solid ${CLR.border}`,
              borderRadius: 5,
              color: CLR.muted,
              cursor: "pointer",
              display: "flex",
              fontSize: 10.5,
              gap: 6,
              height: 30,
              padding: "5px 10px",
            }}
          >
            <RefreshCw size={12} />
            Refresh
          </button>
          <Link
            href="/dashboard/case-library"
            style={{
              alignItems: "center",
              background: "rgba(212,175,55,0.08)",
              border: "1px solid rgba(212,175,55,0.28)",
              borderRadius: 5,
              color: CLR.gold,
              display: "flex",
              fontSize: 10.5,
              gap: 6,
              height: 30,
              padding: "5px 10px",
              textDecoration: "none",
            }}
          >
            <FolderOpen size={12} />
            Case Library
          </Link>
          {derived?.sourceUrl && (
            <a
              href={derived.sourceUrl}
              target="_blank"
              rel="noreferrer"
              style={{
                alignItems: "center",
                background: "rgba(59,130,246,0.1)",
                border: "1px solid rgba(59,130,246,0.32)",
                borderRadius: 5,
                color: CLR.blue,
                display: "flex",
                fontSize: 10.5,
                gap: 6,
                height: 30,
                padding: "5px 10px",
                textDecoration: "none",
              }}
            >
              <ExternalLink size={12} />
              Source
            </a>
          )}
        </div>
      </header>

      {error && (
        <div
          style={{
            alignItems: "center",
            background: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.3)",
            borderRadius: 7,
            color: "#FCA5A5",
            display: "flex",
            fontSize: 11,
            gap: 8,
            marginBottom: 12,
            padding: "10px 12px",
          }}
        >
          <AlertTriangle size={13} />
          {error}
        </div>
      )}

      {loading ? (
        <LoadingState />
      ) : notFound || !record || !derived ? (
        <section
          style={{
            alignItems: "center",
            background: CLR.surface,
            border: `1px solid ${CLR.border}`,
            borderRadius: 8,
            display: "flex",
            flexDirection: "column",
            gap: 12,
            minHeight: 280,
            justifyContent: "center",
            padding: 36,
            textAlign: "center",
          }}
        >
          <AlertTriangle size={30} style={{ color: "rgba(212,175,55,0.24)" }} />
          <div style={{ color: CLR.text, fontSize: 14, fontWeight: 700 }}>Incident record unavailable</div>
          <div style={{ color: CLR.muted, fontSize: 11 }}>The normalized Case Library record could not be found.</div>
          <Link href="/dashboard/incidents" style={{ color: CLR.gold, fontSize: 11, marginTop: 4, textDecoration: "none" }}>
            Return to Incidents
          </Link>
        </section>
      ) : (
        <div style={{ display: "grid", gap: 14 }}>
          <section
            style={{
              background: CLR.surface,
              border: "1px solid rgba(212,175,55,0.22)",
              borderRadius: 8,
              padding: "18px 20px",
            }}
          >
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
              <SeverityBadge severity={record.severity} />
              <StatusBadge status={record.status} />
              <Pill label={replayLabel(record.replayStatus)} color={replayColor(record.replayStatus)} />
              <Pill label={coverageLabel(record.doctrineStatus)} color={doctrineColor(record.doctrineStatus)} />
            </div>
            <p style={{ color: "rgba(226,232,240,0.86)", fontSize: 12.5, lineHeight: 1.7, margin: 0 }}>
              {record.summary || "No summary available."}
            </p>
          </section>

          <div style={{ display: "grid", gap: 14, gridTemplateColumns: "minmax(0, 1.2fr) minmax(280px, 0.8fr)" }}>
            <Section title="Incident Record">
              <div style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
                <Field label="Incident ID">
                  <span style={{ fontFamily: "var(--font-geist-mono,monospace)" }}>{record.caseId}</span>
                </Field>
                <Field label="Source">{record.source || "Unknown"}</Field>
                <Field label={derived.date.label}>
                  {derived.date.value ? formatTs(derived.date.value) : "Unavailable"}
                </Field>
                <Field label="Ingestion Date">{record.ingestedAt ? formatTs(record.ingestedAt) : "Unavailable"}</Field>
                <Field label="Type">{record.type || "Unavailable"}</Field>
                <Field label="Chain / System">{record.chainSystem || "Unavailable"}</Field>
              </div>
            </Section>

            <Section title="Replay And Coverage">
              <div style={{ display: "grid", gap: 14 }}>
                <Field label="Replay Validation">
                  <Pill label={replayLabel(record.replayStatus)} color={replayColor(record.replayStatus)} />
                  {record.replaySummary && (
                    <div style={{ color: CLR.muted, fontSize: 10.5, marginTop: 8 }}>{record.replaySummary}</div>
                  )}
                </Field>
                <Field label="Response Coverage">
                  <Pill label={coverageLabel(record.doctrineStatus)} color={doctrineColor(record.doctrineStatus)} />
                  {record.enrichmentSummary && (
                    <div style={{ color: CLR.muted, fontSize: 10.5, marginTop: 8 }}>{record.enrichmentSummary}</div>
                  )}
                </Field>
              </div>
            </Section>
          </div>

          <div style={{ display: "grid", gap: 14, gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)" }}>
            <Section title="Tags And Threat Signals">
              {derived.tags.length > 0 ? (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {derived.tags.map((tag) => (
                    <span
                      key={tag}
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        border: `1px solid ${CLR.border}`,
                        borderRadius: 4,
                        color: CLR.muted,
                        fontSize: 10,
                        padding: "3px 7px",
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              ) : (
                <div style={{ color: CLR.muted, fontSize: 11 }}>No tags available.</div>
              )}
            </Section>

            <Section title="Source Attribution">
              {(record.sourceRefs ?? []).length > 0 ? (
                <div style={{ display: "grid", gap: 10 }}>
                  {(record.sourceRefs ?? []).slice(0, 4).map((ref, idx) => (
                    <div
                      key={`${ref.source}-${ref.externalId ?? idx}`}
                      style={{
                        borderBottom: idx < Math.min((record.sourceRefs ?? []).length, 4) - 1 ? `1px solid ${CLR.border}` : "none",
                        paddingBottom: idx < Math.min((record.sourceRefs ?? []).length, 4) - 1 ? 10 : 0,
                      }}
                    >
                      <div style={{ color: CLR.text, fontSize: 11 }}>{ref.source || "Unknown source"}</div>
                      <div style={{ color: CLR.muted, fontSize: 10, marginTop: 3 }}>
                        {[ref.externalId, ref.observedAt ? formatTs(ref.observedAt) : undefined].filter(Boolean).join(" / ") || "No attribution details available."}
                      </div>
                    </div>
                  ))}
                </div>
              ) : derived.evidenceRefs.length > 0 ? (
                <div style={{ color: CLR.muted, fontSize: 11 }}>Evidence references are available from the source record.</div>
              ) : (
                <div style={{ color: CLR.muted, fontSize: 11 }}>No source attribution available.</div>
              )}
            </Section>
          </div>
        </div>
      )}
    </div>
  );
}
