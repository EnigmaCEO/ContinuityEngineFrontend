import type { OracleReadinessIssue, OracleReadinessReport } from "@/lib/radar/types";

export function OracleReadinessPanel({
  report,
  error,
}: {
  report: OracleReadinessReport | null;
  error: string | null;
}) {
  return (
    <section
      style={{
        background: "linear-gradient(180deg, rgba(15,18,28,0.96), rgba(8,10,14,0.96))",
        border: "1px solid rgba(212,175,55,0.12)",
        borderRadius: 10,
        padding: 16,
        display: "grid",
        gap: 14,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div>
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.14em",
              color: "#D4AF37",
              marginBottom: 4,
            }}
          >
            COMMERCIAL READINESS
          </div>
          <div style={{ fontSize: 11, color: "rgba(203,213,225,0.7)", lineHeight: 1.5, maxWidth: 720 }}>
            Internal QA for controlled Oracle Radar pilots. This does not imply public coverage beyond enabled feeds.
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <StatusBadge status={report?.overallStatus ?? "needs_attention"} />
          <div
            style={{
              borderRadius: 999,
              border: "1px solid rgba(148,163,184,0.14)",
              background: "rgba(8,10,16,0.55)",
              padding: "6px 10px",
              fontSize: 11,
              color: "#E2E8F0",
              fontWeight: 700,
            }}
          >
            Score {report?.score ?? 0}/100
          </div>
        </div>
      </div>

      {error ? (
        <div
          style={{
            borderRadius: 8,
            border: "1px solid rgba(249,115,22,0.25)",
            background: "rgba(24,12,8,0.88)",
            padding: "12px 14px",
            color: "#FDBA74",
            fontSize: 11,
            lineHeight: 1.6,
          }}
        >
          Oracle readiness is temporarily unavailable. {error}
        </div>
      ) : null}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: 10,
        }}
      >
        <SummaryCard label="Active Dependencies" value={String(report?.activeDependencyFeeds ?? 0)} />
        <SummaryCard label="Checked Dependencies" value={String(report?.dependencyFeedsWithSuccessfulCheck ?? 0)} />
        <SummaryCard label="Dependency Alerts" value={String(report?.activeDependencyAlerts ?? 0)} />
        <SummaryCard
          label="Reference Checks"
          value={`${report?.referenceComparisonsAvailable ?? 0} / ${report?.referenceComparisonsSkipped ?? 0}`}
        />
        <SummaryCard label="Watchlists" value={boolLabel(report?.watchlistReady ?? false)} />
        <SummaryCard label="Delivery" value={boolLabel(report?.deliveryReady ?? false)} />
        <SummaryCard label="Daily Brief" value={boolLabel(report?.dailyBriefReady ?? false)} />
        <SummaryCard label="Metadata Pending" value={String(report?.feedsMissingMetadataVerification ?? 0)} />
      </div>

      {report ? (
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.15fr) minmax(0, 0.85fr)", gap: 12 }}>
          <div
            style={{
              borderRadius: 8,
              border: "1px solid rgba(148,163,184,0.12)",
              background: "rgba(15,23,42,0.5)",
              padding: "12px 14px",
              display: "grid",
              gap: 8,
            }}
          >
            <SectionLabel>Top Issues</SectionLabel>
            {report.issues.length === 0 ? (
              <div style={{ fontSize: 11, color: "#CBD5E1" }}>No open readiness issues.</div>
            ) : (
              report.issues.slice(0, 4).map((issue) => <IssueRow key={`${issue.code}:${issue.relatedObjectId ?? "global"}`} issue={issue} />)
            )}
          </div>

          <div
            style={{
              borderRadius: 8,
              border: "1px solid rgba(148,163,184,0.12)",
              background: "rgba(8,10,16,0.55)",
              padding: "12px 14px",
              display: "grid",
              gap: 8,
            }}
          >
            <SectionLabel>Recommendations</SectionLabel>
            {report.recommendations.length === 0 ? (
              <div style={{ fontSize: 11, color: "#CBD5E1" }}>No immediate remediation steps queued.</div>
            ) : (
              report.recommendations.slice(0, 4).map((recommendation) => (
                <div key={recommendation} style={{ fontSize: 11, color: "#CBD5E1", lineHeight: 1.5 }}>
                  {recommendation}
                </div>
              ))
            )}
            <div
              style={{
                marginTop: 4,
                paddingTop: 8,
                borderTop: "1px solid rgba(148,163,184,0.1)",
                display: "grid",
                gap: 4,
              }}
            >
              <Field label="Doctrine Gaps" value={String(report.feedsMissingDoctrine)} />
              <Field label="Pending Ecosystem" value={String(report.pendingEcosystemItems)} />
              <Field label="Priority Backlog" value={String(report.commercialPriorityBacklogItems)} />
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function StatusBadge({ status }: { status: OracleReadinessReport["overallStatus"] }) {
  const color = status === "ready" ? "#22C55E" : status === "not_ready" ? "#F97316" : "#D4AF37";
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "0.08em",
        color,
        border: `1px solid ${color}40`,
        background: `${color}12`,
        borderRadius: 999,
        padding: "4px 10px",
      }}
    >
      {status.replace(/_/g, " ").toUpperCase()}
    </span>
  );
}

function SectionLabel({ children }: { children: string }) {
  return <div style={{ fontSize: 9, color: "rgba(148,163,184,0.72)", letterSpacing: "0.08em" }}>{children.toUpperCase()}</div>;
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        borderRadius: 8,
        border: "1px solid rgba(148,163,184,0.12)",
        background: "rgba(8,10,16,0.55)",
        padding: "10px 12px",
      }}
    >
      <div style={{ fontSize: 9, color: "rgba(148,163,184,0.72)", letterSpacing: "0.08em", marginBottom: 4 }}>
        {label.toUpperCase()}
      </div>
      <div style={{ fontSize: 16, color: "#E2E8F0", fontWeight: 700 }}>{value}</div>
    </div>
  );
}

function IssueRow({ issue }: { issue: OracleReadinessIssue }) {
  const color = issue.severity === "critical" ? "#F97316" : issue.severity === "warning" ? "#D4AF37" : "#38BDF8";
  return (
    <div style={{ display: "grid", gap: 4 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <span
          style={{
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: "0.08em",
            color,
            border: `1px solid ${color}40`,
            background: `${color}12`,
            borderRadius: 999,
            padding: "3px 8px",
          }}
        >
          {issue.severity.toUpperCase()}
        </span>
        <div style={{ fontSize: 11, color: "#E2E8F0", fontWeight: 700 }}>{issue.title}</div>
      </div>
      <div style={{ fontSize: 10, color: "rgba(148,163,184,0.78)", lineHeight: 1.55 }}>{issue.detail}</div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
      <div style={{ fontSize: 9, color: "rgba(148,163,184,0.72)", letterSpacing: "0.08em" }}>{label.toUpperCase()}</div>
      <div style={{ fontSize: 11, color: "#CBD5E1" }}>{value}</div>
    </div>
  );
}

function boolLabel(value: boolean): string {
  return value ? "Ready" : "Pending";
}
