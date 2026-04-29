import { Bell, Settings } from "lucide-react";

const alerts = [
  {
    severity: "CRITICAL",
    color: "#EF4444",
    bg: "rgba(239,68,68,0.08)",
    label: "Bridge Anomaly Detected",
    source: "SigmaBridge",
    time: "14:35:21 UTC",
  },
  {
    severity: "HIGH",
    color: "#F97316",
    bg: "rgba(249,115,22,0.08)",
    label: "Unusual Transaction Pattern",
    source: "0xA8f3...7C21",
    time: "14:34:02 UTC",
  },
  {
    severity: "MEDIUM",
    color: "#D4AF37",
    bg: "rgba(212,175,55,0.08)",
    label: "Oracle Deviation Threshold",
    source: "Chainlink ETH/USD",
    time: "14:28:11 UTC",
  },
  {
    severity: "LOW",
    color: "#A855F7",
    bg: "rgba(168,85,247,0.08)",
    label: "Rate Limit Approaching",
    source: "API Gateway",
    time: "14:22:47 UTC",
  },
];

const timeline = [
  { time: "14:36:21", label: "Bridge Anomaly Detected",      source: "SigmaBridge",       color: "#EF4444" },
  { time: "14:34:02", label: "Unusual Transaction Pattern",  source: "EVM Network",        color: "#F97316" },
  { time: "14:28:11", label: "Oracle Deviation Threshold",   source: "Chainlink ETH/USD",  color: "#D4AF37" },
  { time: "14:22:47", label: "Rate Limit Approaching",       source: "API Gateway",        color: "#A855F7" },
  { time: "14:15:33", label: "Policy Update Applied",        source: "Doctrine Engine",    color: "#22C55E" },
];

const feed = [
  { time: "14:37:15", label: "Policy signature verified",     source: "Doctrine Engine" },
  { time: "14:37:02", label: "Heartbeat: Bridge SigmaBridge", source: "Bridge Monitor" },
  { time: "14:36:58", label: "Oracle update: ETH/USD",        source: "Chainlink" },
  { time: "14:36:45", label: "Adapter sync complete",         source: "EVM Adapter" },
];

const S = {
  sectionTitle: {
    fontSize: 9.5,
    fontWeight: 600,
    letterSpacing: "0.14em",
    color: "#D4AF37",
  } as React.CSSProperties,
  viewAll: {
    fontSize: 8.5,
    color: "rgba(212,175,55,0.65)",
    letterSpacing: "0.06em",
    cursor: "pointer",
  } as React.CSSProperties,
};

export function RightPanel() {
  return (
    <div
      style={{
        width: 316,
        minWidth: 316,
        background: "#0b0d12",
        borderLeft: "1px solid rgba(212,175,55,0.18)",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflowY: "auto",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "15px 16px",
          borderBottom: "1px solid rgba(212,175,55,0.12)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: "0.1em",
              color: "#D4AF37",
              lineHeight: 1.2,
            }}
          >
            SCE PORTAL
          </div>
          <div
            style={{
              fontSize: 9,
              color: "rgba(212,175,55,0.55)",
              letterSpacing: "0.06em",
              marginTop: 1,
            }}
          >
            Continuity Command v2.7.1
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Bell size={15} style={{ color: "rgba(212,175,55,0.65)" }} />
          <Settings size={15} style={{ color: "rgba(212,175,55,0.65)" }} />
          <div style={{ position: "relative" }}>
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: "50%",
                background: "rgba(212,175,55,0.15)",
                border: "1px solid rgba(212,175,55,0.4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 10,
                fontWeight: 700,
                color: "#D4AF37",
              }}
            >
              AO
            </div>
            <div
              style={{
                position: "absolute",
                bottom: 0,
                right: 0,
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "#22C55E",
                border: "1.5px solid #0b0d12",
              }}
            />
          </div>
        </div>
      </div>

      {/* Live Alerts */}
      <div
        style={{
          padding: "13px 16px",
          borderBottom: "1px solid rgba(212,175,55,0.1)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 10,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div
              style={{
                width: 4,
                height: 4,
                borderRadius: "50%",
                background: "#EF4444",
                boxShadow: "0 0 6px #EF4444",
              }}
            />
            <span style={S.sectionTitle}>LIVE ALERTS</span>
          </div>
          <span style={S.viewAll}>VIEW ALL</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {alerts.map((alert, i) => (
            <div
              key={i}
              style={{
                background: alert.bg,
                border: `1px solid ${alert.color}28`,
                borderRadius: 6,
                padding: "7px 10px",
                display: "flex",
                gap: 8,
                alignItems: "flex-start",
              }}
            >
              <div
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: alert.color,
                  marginTop: 3,
                  flexShrink: 0,
                  boxShadow: `0 0 5px ${alert.color}80`,
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    marginBottom: 2,
                  }}
                >
                  <span
                    style={{
                      fontSize: 8.5,
                      fontWeight: 700,
                      color: alert.color,
                      letterSpacing: "0.06em",
                    }}
                  >
                    {alert.severity}
                  </span>
                  <span
                    style={{
                      fontSize: 10.5,
                      color: "#E2E8F0",
                      fontWeight: 500,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {alert.label}
                  </span>
                </div>
                <div style={{ fontSize: 9, color: "rgba(140,140,170,0.7)" }}>
                  {alert.source} · {alert.time}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Incident Timeline */}
      <div
        style={{
          padding: "13px 16px",
          borderBottom: "1px solid rgba(212,175,55,0.1)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 10,
          }}
        >
          <span style={S.sectionTitle}>INCIDENT TIMELINE</span>
          <span style={S.viewAll}>VIEW ALL</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          {timeline.map((item, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                gap: 9,
                paddingBottom: 10,
                position: "relative",
              }}
            >
              {/* Connecting line */}
              {i < timeline.length - 1 && (
                <div
                  style={{
                    position: "absolute",
                    left: 42,
                    top: 12,
                    bottom: 0,
                    width: 1,
                    background: "rgba(212,175,55,0.12)",
                  }}
                />
              )}
              <span
                style={{
                  fontSize: 9,
                  color: "rgba(140,140,170,0.65)",
                  fontFamily: "monospace",
                  minWidth: 40,
                  textAlign: "right",
                  flexShrink: 0,
                  paddingTop: 1,
                }}
              >
                {item.time}
              </span>
              <div
                style={{
                  width: 9,
                  height: 9,
                  borderRadius: "50%",
                  background: item.color,
                  flexShrink: 0,
                  marginTop: 2,
                  boxShadow: `0 0 5px ${item.color}60`,
                }}
              />
              <div>
                <div
                  style={{
                    fontSize: 10.5,
                    color: "#CBD5E1",
                    fontWeight: 500,
                  }}
                >
                  {item.label}
                </div>
                <div style={{ fontSize: 9, color: "rgba(140,140,170,0.6)" }}>
                  {item.source}
                </div>
              </div>
            </div>
          ))}
        </div>
        <button
          style={{
            width: "100%",
            marginTop: 2,
            padding: "8px 0",
            background: "rgba(212,175,55,0.06)",
            border: "1px solid rgba(212,175,55,0.22)",
            borderRadius: 6,
            fontSize: 9.5,
            color: "rgba(212,175,55,0.75)",
            cursor: "pointer",
            letterSpacing: "0.1em",
          }}
        >
          VIEW INCIDENT CENTER
        </button>
      </div>

      {/* System Feed */}
      <div style={{ padding: "13px 16px", flex: 1 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 10,
          }}
        >
          <span style={S.sectionTitle}>SYSTEM FEED</span>
          <span style={S.viewAll}>VIEW FULL FEED</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          {feed.map((item, i) => (
            <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
              <span
                style={{
                  fontSize: 9,
                  color: "rgba(140,140,170,0.6)",
                  fontFamily: "monospace",
                  minWidth: 42,
                  textAlign: "right",
                  flexShrink: 0,
                  paddingTop: 1,
                }}
              >
                {item.time}
              </span>
              <div
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  background: "rgba(212,175,55,0.5)",
                  marginTop: 4,
                  flexShrink: 0,
                }}
              />
              <div>
                <div style={{ fontSize: 10.5, color: "#94A3B8" }}>{item.label}</div>
                <div style={{ fontSize: 9, color: "rgba(140,140,170,0.55)" }}>
                  {item.source}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
