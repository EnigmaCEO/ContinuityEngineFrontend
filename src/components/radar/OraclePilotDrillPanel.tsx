import type { OraclePilotDrillReport, OracleReadinessIssue } from "@/lib/radar/types";

export function OraclePilotDrillPanel({
  report,
  error,
}: {
  report: OraclePilotDrillReport | null;
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
            ORACLE PILOT DRILL
          </div>
          <div style={{ fontSize: 11, color: "rgba(203,213,225,0.7)", lineHeight: 1.5, maxWidth: 720 }}>
            Controlled pilot workflow from manual oracle checks through brief, watchlist, and delivery-readiness proof. Runtime remains untouched.
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <StatusBadge status={report?.status ?? "needs_attention"} />
          <Pill label={report ? `Score ${report.score}/100` : "No drill yet"} />
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
          Oracle pilot drill status is temporarily unavailable. {error}
        </div>
      ) : null}

      {!error && !report ? (
        <div
          style={{
            borderRadius: 8,
            border: "1px dashed rgba(148,163,184,0.18)",
            background: "rgba(8,10,16,0.48)",
            padding: "14px 16px",
            fontSize: 11,
            color: "#CBD5E1",
          }}
        >
          No pilot drill report stored yet. Run the drill from the operator console.
        </div>
      ) : null}

      {report ? (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
              gap: 10,
            }}
          >
            <SummaryCard label="Live Checks" value={String(report.liveChecksRun)} />
            <SummaryCard label="Dependency Feeds" value={String(report.dependencyFeedsChecked)} />
            <SummaryCard label="Dependency Alerts" value={String(report.activeDependencyAlerts)} />
            <SummaryCard label="Reference Checks" value={`${report.referenceChecksRun} / ${report.referenceChecksSkipped}`} />
            <SummaryCard label="Readiness" value={`${report.readinessStatus} · ${report.readinessScore}`} />
            <SummaryCard label="Brief" value={humanize(report.dailyBriefStatus)} />
            <SummaryCard label="Matches Created" value={String(report.watchlistMatchesCreated)} />
            <SummaryCard label="Delivery" value={report.deliveryReady ? humanize(report.deliveryDryRunStatus) : "Blocked"} />
          </div>

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
                <div style={{ fontSize: 11, color: "#CBD5E1" }}>No open pilot-drill issues.</div>
              ) : (
                report.issues.slice(0, 4).map((issue) => (
                  <IssueRow key={`${issue.code}:${issue.relatedObjectId ?? "global"}`} issue={issue} />
                ))
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
                <div style={{ fontSize: 11, color: "#CBD5E1" }}>No queued follow-up actions.</div>
              ) : (
                report.recommendations.slice(0, 4).map((recommendation) => (
                  <div key={recommendation} style={{ fontSize: 11, color: "#CBD5E1", lineHeight: 1.5 }}>
                    {recommendation}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      ) : null}
    </section>
  );
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

function StatusBadge({ status }: { status: OraclePilotDrillReport["status"] }) {
  const color = status === "passed" ? "#22C55E" : status === "failed" ? "#F97316" : "#D4AF37";
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
      {humanize(status).toUpperCase()}
    </span>
  );
}

function Pill({ label }: { label: string }) {
  return (
    <span
      style={{
        fontSize: 11,
        color: "#E2E8F0",
        fontWeight: 700,
        borderRadius: 999,
        border: "1px solid rgba(148,163,184,0.14)",
        background: "rgba(8,10,16,0.55)",
        padding: "6px 10px",
      }}
    >
      {label}
    </span>
  );
}

function SectionLabel({ children }: { children: string }) {
  return <div style={{ fontSize: 9, color: "rgba(148,163,184,0.72)", letterSpacing: "0.08em" }}>{children.toUpperCase()}</div>;
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

function humanize(value: string): string {
  return value.replace(/[_-]/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}
