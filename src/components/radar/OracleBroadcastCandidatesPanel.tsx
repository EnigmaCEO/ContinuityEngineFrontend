import type { RadarSignalQuality, RadarSignalQualitySnapshot } from "@/lib/radar/types";

export function OracleBroadcastCandidatesPanel({
  snapshot,
  error,
}: {
  snapshot: RadarSignalQualitySnapshot | null;
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
        gap: 12,
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
          BROADCAST CANDIDATES
        </div>
        <div style={{ fontSize: 11, color: "rgba(203,213,225,0.7)", lineHeight: 1.5 }}>
          Internal signal-quality gate for Oracle Radar public brief candidates.
        </div>
      </div>

      {error ? (
        <div style={{ fontSize: 11, color: "#FCA5A5", lineHeight: 1.6 }}>{error}</div>
      ) : null}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
          gap: 10,
        }}
      >
        <Metric label="Raw Oracle Alerts" value={String(snapshot?.totalSignals ?? 0)} />
        <Metric label="Broadcast Candidates" value={String(snapshot?.broadcastCandidates ?? 0)} />
        <Metric label="Internal Only" value={String(snapshot?.internalOnlySignals ?? 0)} />
        <Metric label="Suppressed" value={String(snapshot?.suppressedSignals ?? 0)} />
        <Metric label="Highest Score" value={`${snapshot?.highestQualityScore ?? 0}/100`} />
        <Metric
          label="Top Candidate"
          value={snapshot?.topCandidate ? compactTitle(snapshot.topCandidate) : "None"}
        />
      </div>

      {snapshot?.signals?.length ? (
        <div style={{ display: "grid", gap: 8 }}>
          {snapshot.signals.slice(0, 6).map((signal) => (
            <div
              key={signal.alertId}
              style={{
                borderRadius: 8,
                border: "1px solid rgba(148,163,184,0.14)",
                background: "rgba(15,23,42,0.55)",
                padding: "10px 12px",
                display: "grid",
                gap: 8,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 8,
                  flexWrap: "wrap",
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 700, color: "#E2E8F0" }}>{compactTitle(signal)}</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <Chip label={tierLabel(signal)} color={tierColor(signal.broadcastTier)} />
                  <Chip label={`${signal.qualityScore}/100`} color="#D4AF37" />
                  <Chip label={signal.broadcastEligible ? "Eligible" : "Not Eligible"} color={signal.broadcastEligible ? "#22C55E" : "#94A3B8"} />
                </div>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
                  gap: 8,
                }}
              >
                <Metric label="Purpose" value={signal.objectPurpose ? humanize(signal.objectPurpose) : "n/a"} />
                <Metric label="Severity" value={humanize(signal.severity)} />
                <Metric label="Evidence Score" value={String(signal.evidenceScore)} />
                <Metric label="Reason" value={signal.suppressionReason ?? "None"} />
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function compactTitle(signal: RadarSignalQuality): string {
  const purpose = signal.objectPurpose ? humanize(signal.objectPurpose) : "Oracle";
  return `${purpose} ${humanize(signal.severity)}`;
}

function tierLabel(signal: RadarSignalQuality): string {
  if (signal.broadcastTier === "urgent_public") return "Broadcast Candidate";
  if (signal.broadcastTier === "daily_brief") return "Daily Brief";
  if (signal.broadcastTier === "client_only") return "Client Only";
  if (signal.broadcastTier === "internal_only") return "Internal Only";
  return "Suppressed";
}

function tierColor(tier: RadarSignalQuality["broadcastTier"]): string {
  if (tier === "urgent_public") return "#EF4444";
  if (tier === "daily_brief") return "#22C55E";
  if (tier === "client_only") return "#38BDF8";
  if (tier === "internal_only") return "#94A3B8";
  return "#F59E0B";
}

function humanize(value: string): string {
  return value.replace(/[_-]/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function Chip({ label, color }: { label: string; color: string }) {
  return (
    <span
      style={{
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: "0.08em",
        color,
        border: `1px solid ${color}40`,
        background: `${color}12`,
        borderRadius: 999,
        padding: "4px 8px",
      }}
    >
      {label.toUpperCase()}
    </span>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div
        style={{
          fontSize: 9,
          color: "rgba(148,163,184,0.72)",
          letterSpacing: "0.08em",
          marginBottom: 3,
        }}
      >
        {label.toUpperCase()}
      </div>
      <div
        style={{
          fontSize: 12,
          color: "#E2E8F0",
          fontWeight: 600,
          overflowWrap: "anywhere",
        }}
      >
        {value}
      </div>
    </div>
  );
}
