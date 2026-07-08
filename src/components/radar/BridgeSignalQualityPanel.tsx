import type { BridgePolicyStatus, RadarSignalQuality, RadarSignalQualitySnapshot } from "@/lib/radar/types";

export function BridgeSignalQualityPanel({
  snapshot,
  error,
}: {
  snapshot: RadarSignalQualitySnapshot | null;
  error: string | null;
}) {
  const highestPolicyScore = snapshot?.signals
    ? Math.max(0, ...snapshot.signals.map((s) => s.bridgePolicyScore ?? 0))
    : 0;

  return (
    <section
      style={{
        background: "linear-gradient(180deg, rgba(15,18,28,0.96), rgba(8,10,14,0.96))",
        border: "1px solid rgba(59,130,246,0.18)",
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
            color: "#3B82F6",
            marginBottom: 4,
          }}
        >
          BRIDGE SIGNAL QUALITY
        </div>
        <div style={{ fontSize: 11, color: "rgba(203,213,225,0.7)", lineHeight: 1.5 }}>
          Internal signal-quality scoring and broadcast policy classification for Bridge Radar alerts.
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
        <Metric label="Bridge Signals" value={String(snapshot?.totalSignals ?? 0)} />
        <Metric
          label="Future Daily Brief"
          value={String(snapshot?.bridgeDailyBriefCandidates ?? 0)}
          highlight={(snapshot?.bridgeDailyBriefCandidates ?? 0) > 0}
        />
        <Metric
          label="Future Urgent"
          value={String(snapshot?.bridgeUrgentCandidates ?? 0)}
          highlight={(snapshot?.bridgeUrgentCandidates ?? 0) > 0}
          highlightColor="#F59E0B"
        />
        <Metric label="Internal Only" value={String(snapshot?.internalOnlySignals ?? 0)} />
        <Metric
          label="Policy Enabled"
          value={snapshot?.bridgePolicyEnabled ? "Yes" : "No (v0)"}
        />
        <Metric
          label="Highest Policy Score"
          value={highestPolicyScore > 0 ? `${highestPolicyScore}/100` : "—"}
        />
      </div>

      <div
        style={{
          fontSize: 10,
          color: "rgba(148,163,184,0.65)",
          lineHeight: 1.6,
          borderTop: "1px solid rgba(59,130,246,0.1)",
          paddingTop: 8,
        }}
      >
        Bridge broadcast policy is currently internal-only. Candidate status shows what would qualify
        for future bridge daily briefs, but bridge signals are not included in public X/Twitter
        previews yet.
      </div>

      {snapshot?.signals?.length ? (
        <div style={{ display: "grid", gap: 8 }}>
          {snapshot.signals.slice(0, 6).map((signal) => (
            <BridgeSignalRow key={signal.alertId} signal={signal} />
          ))}
        </div>
      ) : (
        <div style={{ fontSize: 11, color: "rgba(148,163,184,0.6)" }}>
          No bridge signals in the current window.
        </div>
      )}
    </section>
  );
}

function BridgeSignalRow({ signal }: { signal: RadarSignalQuality }) {
  const policyStatus = signal.bridgePolicyStatus;
  return (
    <div
      style={{
        borderRadius: 8,
        border: "1px solid rgba(59,130,246,0.14)",
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
        <div style={{ fontSize: 11, fontWeight: 700, color: "#E2E8F0" }}>
          {bridgeSignalTitle(signal)}
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <Chip label={tierLabel(signal.broadcastTier)} color={tierColor(signal.broadcastTier)} />
          <Chip
            label={policyStatusLabel(policyStatus)}
            color={policyStatusColor(policyStatus)}
          />
          <Chip label={`Q ${signal.qualityScore}/100`} color="#3B82F6" />
          {signal.bridgePolicyScore != null && signal.bridgePolicyScore > 0 ? (
            <Chip label={`P ${signal.bridgePolicyScore}/100`} color="#8B5CF6" />
          ) : null}
          <Chip label="Not Broadcast Eligible" color="#94A3B8" />
        </div>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
          gap: 8,
        }}
      >
        <Metric label="Route" value={signal.objectId ?? "—"} />
        <Metric
          label="Provider"
          value={signal.monitorType === "bridge" ? "CCTP" : signal.monitorType}
        />
        <Metric label="Asset" value="USDC" />
        <Metric label="Severity" value={humanize(signal.severity)} />
        <Metric label="Alert Confidence" value={`${signal.referenceScore >= 0 ? "≥" : "<"}50`} />
        <Metric label="Quality Score" value={`${signal.qualityScore}/100`} />
        <Metric label="Policy Status" value={policyStatusLabel(policyStatus)} />
        <Metric
          label="Policy Reason"
          value={signal.bridgePolicyReason ?? signal.suppressionReason ?? "Internal-only (v0)"}
        />
        <Metric label="Broadcast Eligible" value={signal.broadcastEligible ? "Yes" : "No"} />
      </div>
    </div>
  );
}

function bridgeSignalTitle(signal: RadarSignalQuality): string {
  const purpose = signal.objectPurpose ? humanize(signal.objectPurpose) : "Bridge";
  return `${humanize(signal.severity)} ${purpose} Signal`;
}

function policyStatusLabel(status: BridgePolicyStatus | null | undefined): string {
  if (status === "daily_brief_candidate") return "Future Daily Brief";
  if (status === "urgent_candidate") return "Future Urgent";
  if (status === "internal_only") return "Internal Only";
  return "Not Eligible";
}

function policyStatusColor(status: BridgePolicyStatus | null | undefined): string {
  if (status === "urgent_candidate") return "#F59E0B";
  if (status === "daily_brief_candidate") return "#34D399";
  return "#94A3B8";
}

function tierLabel(tier: RadarSignalQuality["broadcastTier"]): string {
  if (tier === "internal_only") return "Internal Only";
  if (tier === "client_only") return "Client Only";
  if (tier === "daily_brief") return "Daily Brief";
  if (tier === "urgent_public") return "Urgent";
  return "Suppressed";
}

function tierColor(tier: RadarSignalQuality["broadcastTier"]): string {
  if (tier === "internal_only") return "#94A3B8";
  if (tier === "client_only") return "#38BDF8";
  return "#F59E0B";
}

function humanize(value: string): string {
  return value.replace(/[_-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
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

function Metric({
  label,
  value,
  highlight = false,
  highlightColor = "#34D399",
}: {
  label: string;
  value: string;
  highlight?: boolean;
  highlightColor?: string;
}) {
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
          color: highlight ? highlightColor : "#E2E8F0",
          fontWeight: 600,
          overflowWrap: "anywhere",
        }}
      >
        {value}
      </div>
    </div>
  );
}
