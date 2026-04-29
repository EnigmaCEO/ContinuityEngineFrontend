import {
  Activity,
  BookOpen,
  ShieldAlert,
  FolderOpen,
  Cpu,
  Eye,
  ShieldCheck,
  Zap,
  Shield,
  EyeOff,
  type LucideIcon,
} from "lucide-react";

// ─── Shared style tokens ─────────────────────────────────────────────────────

const CARD: React.CSSProperties = {
  background: "rgba(10,12,18,0.92)",
  border: "1px solid rgba(212,175,55,0.16)",
  borderRadius: 8,
  padding: "13px 15px",
};

const GOLD = "#D4AF37";
const MUTED = "rgba(140,140,170,0.65)";

const SECTION_TITLE: React.CSSProperties = {
  fontSize: 9.5,
  fontWeight: 600,
  letterSpacing: "0.13em",
  color: GOLD,
  textTransform: "uppercase",
};

const VIEW_LINK: React.CSSProperties = {
  fontSize: 9,
  color: "rgba(212,175,55,0.65)",
  letterSpacing: "0.07em",
  cursor: "pointer",
};

// ─── Seeded data ─────────────────────────────────────────────────────────────

const uptimeData     = [99.99,99.98,99.99,99.95,99.99,99.98,99.99,99.97,99.98,99.99,99.982];
const latencyData    = [142,135,148,122,131,125,140,128,132,128,128];
const throughputData = [2.1,2.3,2.5,2.2,2.6,2.4,2.5,2.3,2.46,2.5,2.46];
const errorData      = [0.025,0.020,0.018,0.022,0.015,0.019,0.018,0.016,0.020,0.018,0.018];
const bridgeData     = [8,8,8,7,8,8,8,8,7,8,8];
const oracleData     = [12,12,11,12,12,12,12,11,12,12,12];

const cases = [
  {
    id: "CASE-2025-0526-001",
    title: "Bridge Drain Attempt",
    type: "Exploit Attempt",
    chains: [{ color: "#3B82F6", abbr: "E" }, { color: "#D97706", abbr: "P" }],
    date: "May 26, 2025",
    outcome: "MITIGATED",
    outcomeColor: "#22C55E",
  },
  {
    id: "CASE-2025-0525-077",
    title: "Oracle Manipulation",
    type: "Data Integrity",
    chains: [{ color: "#8B5CF6", abbr: "S" }],
    date: "May 25, 2025",
    outcome: "MITIGATED",
    outcomeColor: "#22C55E",
  },
  {
    id: "CASE-2025-0524-041",
    title: "MEV Sandwich Surge",
    type: "MEV / Front-running",
    chains: [
      { color: "#3B82F6", abbr: "E" },
      { color: "#8B5CF6", abbr: "A" },
      { color: "#F59E0B", abbr: "B" },
    ],
    date: "May 24, 2025",
    outcome: "MONITORED",
    outcomeColor: "#D4AF37",
  },
  {
    id: "CASE-2025-0523-033",
    title: "Governance Attack Sim",
    type: "Governance",
    chains: [{ color: "#8B5CF6", abbr: "S" }],
    date: "May 23, 2025",
    outcome: "BLOCKED",
    outcomeColor: "#EF4444",
  },
];

const adapters = [
  { label: "EVM",     icon: Cpu,      color: "#F97316", status: "HEALTHY" },
  { label: "SOLANA",  icon: Zap,      color: "#8B5CF6", status: "HEALTHY" },
  { label: "BRIDGE",  icon: Activity, color: "#3B82F6", status: "HEALTHY" },
  { label: "ORACLE",  icon: Eye,      color: "#22C55E", status: "HEALTHY" },
  { label: "BANKING", icon: Shield,   color: "#D4AF37", status: "HEALTHY" },
];

const auditMetrics = [
  { label: "POLICY COMPLIANCE", value: "98.9%" },
  { label: "CODE INTEGRITY",    value: "99.1%" },
  { label: "DATA CONSISTENCY",  value: "98.4%" },
  { label: "ACCESS CONTROLS",   value: "99.0%" },
];

// ─── Threat Matrix donut ─────────────────────────────────────────────────────

const threatSegments = [
  { label: "Critical", count: 1, color: "#EF4444" },
  { label: "High",     count: 2, color: "#F97316" },
  { label: "Medium",   count: 3, color: "#D4AF37" },
  { label: "Low",      count: 1, color: "#A855F7" },
];
const THREAT_TOTAL = 7;

function donutArcPath(
  startDeg: number, endDeg: number,
  cx: number, cy: number, or: number, ir: number
): string {
  const r = (d: number) => (d * Math.PI) / 180;
  const s = r(startDeg), e = r(endDeg);
  const large = endDeg - startDeg > 180 ? 1 : 0;
  const f = (n: number) => n.toFixed(2);
  return [
    `M ${f(cx + or * Math.cos(s))} ${f(cy + or * Math.sin(s))}`,
    `A ${or} ${or} 0 ${large} 1 ${f(cx + or * Math.cos(e))} ${f(cy + or * Math.sin(e))}`,
    `L ${f(cx + ir * Math.cos(e))} ${f(cy + ir * Math.sin(e))}`,
    `A ${ir} ${ir} 0 ${large} 0 ${f(cx + ir * Math.cos(s))} ${f(cy + ir * Math.sin(s))}`,
    "Z",
  ].join(" ");
}

let threatCursor = -90;
const threatPaths = threatSegments.map((seg) => {
  const start = threatCursor;
  const end = threatCursor + (seg.count / THREAT_TOTAL) * 360;
  threatCursor = end;
  return { ...seg, path: donutArcPath(start, end, 48, 48, 36, 22) };
});

// ─── Verification gauge ──────────────────────────────────────────────────────

const GAUGE_R = 36;
const GAUGE_CIRC = 2 * Math.PI * GAUGE_R;
const GAUGE_FILL = 0.987 * GAUGE_CIRC;
const GAUGE_GAP  = GAUGE_CIRC - GAUGE_FILL;

// ─── Utilities ───────────────────────────────────────────────────────────────

function sparklinePath(data: number[], w: number, h: number): string {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const pad = h * 0.1;
  return data
    .map((v, i) => ({
      x: (i / (data.length - 1)) * w,
      y: pad + (h - pad * 2) * (1 - (v - min) / range),
    }))
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(" ");
}

function Sparkline({
  data, color = "#8B5CF6", w = 88, h = 22,
}: { data: number[]; color?: string; w?: number; h?: number }) {
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} style={{ display: "block" }}>
      <path
        d={sparklinePath(data, w, h)}
        fill="none"
        stroke={color}
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SectionHead({
  icon: Icon, title, action,
}: { icon: LucideIcon; title: string; action?: string }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 11,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
        <div
          style={{
            width: 18,
            height: 18,
            borderRadius: "50%",
            background: "rgba(212,175,55,0.1)",
            border: "1px solid rgba(212,175,55,0.28)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon size={9} style={{ color: GOLD }} />
        </div>
        <span style={SECTION_TITLE}>{title}</span>
      </div>
      {action && <span style={VIEW_LINK}>{action}</span>}
    </div>
  );
}

function MetricCell({
  label, value, data, color,
}: { label: string; value: string; data: number[]; color: string }) {
  return (
    <div>
      <div style={{ fontSize: 8.5, color: MUTED, letterSpacing: "0.08em", marginBottom: 2 }}>
        {label}
      </div>
      <div style={{ fontSize: 16, fontWeight: 700, color: "#E2E8F0", lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ marginTop: 6 }}>
        <Sparkline data={data} color={color} w={88} h={20} />
      </div>
    </div>
  );
}

function StatusPill({ label, color }: { label: string; color: string }) {
  return (
    <span
      style={{
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: "0.08em",
        color,
        background: `${color}18`,
        border: `1px solid ${color}40`,
        borderRadius: 4,
        padding: "2px 7px",
      }}
    >
      {label}
    </span>
  );
}

function ChainBadge({ color, abbr }: { color: string; abbr: string }) {
  return (
    <div
      style={{
        width: 16,
        height: 16,
        borderRadius: "50%",
        background: color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 7.5,
        fontWeight: 700,
        color: "#fff",
        flexShrink: 0,
      }}
    >
      {abbr}
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100%",
        background: "#080a0e",
      }}
    >
      {/* ── Atmospheric portal header ── */}
      <div
        style={{
          position: "relative",
          textAlign: "center",
          padding: "22px 20px 18px",
          overflow: "hidden",
        }}
      >
        {/* Warm amber radial glow */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse 90% 160% at 50% 120%, rgba(180,100,0,0.42) 0%, rgba(130,70,0,0.22) 30%, rgba(60,30,0,0.1) 55%, transparent 72%)",
            pointerEvents: "none",
          }}
        />
        {/* Secondary glow layer */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse 50% 60% at 50% 90%, rgba(212,140,0,0.2) 0%, transparent 60%)",
            pointerEvents: "none",
          }}
        />

        <div style={{ position: "relative", zIndex: 1 }}>
          <h1
            style={{
              margin: 0,
              fontSize: 42,
              fontWeight: 800,
              letterSpacing: "0.28em",
              color: GOLD,
              textShadow:
                "0 0 30px rgba(212,175,55,0.55), 0 0 60px rgba(212,175,55,0.2)",
              lineHeight: 1,
            }}
          >
            SCE PORTAL
          </h1>
          <p
            style={{
              margin: "6px 0 14px",
              fontSize: 10.5,
              letterSpacing: "0.55em",
              color: "rgba(212,175,55,0.55)",
            }}
          >
            ✦ CONTINUITY COMMAND ✦
          </p>

          {/* Operational status */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              border: "1px solid rgba(212,175,55,0.28)",
              borderRadius: 4,
              padding: "4px 14px",
              background: "rgba(0,0,0,0.3)",
            }}
          >
            <span
              style={{
                fontSize: 8.5,
                letterSpacing: "0.18em",
                color: "rgba(212,175,55,0.65)",
              }}
            >
              OPERATIONAL STATUS
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "#22C55E",
                  boxShadow: "0 0 6px #22C55E",
                }}
              />
              <span
                style={{
                  fontSize: 9.5,
                  fontWeight: 700,
                  color: "#22C55E",
                  letterSpacing: "0.12em",
                }}
              >
                NOMINAL
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Card grid ── */}
      <div style={{ flex: 1, padding: "0 14px 18px" }}>

        {/* Row 1: System Health | Doctrine Engine | Threat Matrix */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 10,
            marginBottom: 10,
          }}
        >
          {/* System Health */}
          <div style={CARD}>
            <SectionHead icon={Activity} title="System Health" action="VIEW FULL HEALTH ›" />
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "10px 14px",
              }}
            >
              <MetricCell label="UPTIME"         value="99.982%"  data={uptimeData}     color="#22C55E" />
              <MetricCell label="LATENCY (P50)"  value="128ms"    data={latencyData}    color="#8B5CF6" />
              <MetricCell label="THROUGHPUT"     value="2.46k tps" data={throughputData} color="#3B82F6" />
              <MetricCell label="ERROR RATE"     value="0.018%"   data={errorData}      color="#F97316" />
            </div>
          </div>

          {/* Doctrine Engine */}
          <div style={CARD}>
            <SectionHead icon={BookOpen} title="Doctrine Engine" action="MANAGE" />
            <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
              {/* Cube icon */}
              <div
                style={{
                  width: 62,
                  height: 62,
                  flexShrink: 0,
                  background: "rgba(212,175,55,0.06)",
                  border: "1px solid rgba(212,175,55,0.22)",
                  borderRadius: 8,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg viewBox="0 0 40 40" width={36} height={36}>
                  <polygon points="20,4 36,12 36,28 20,36 4,28 4,12"
                    fill="none" stroke="rgba(212,175,55,0.5)" strokeWidth="1.2"/>
                  <polygon points="20,4 36,12 20,20 4,12"
                    fill="rgba(212,175,55,0.08)" stroke="rgba(212,175,55,0.3)" strokeWidth="0.8"/>
                  <polygon points="4,12 20,20 20,36 4,28"
                    fill="rgba(212,175,55,0.05)" stroke="rgba(212,175,55,0.2)" strokeWidth="0.8"/>
                  <polygon points="36,12 20,20 20,36 36,28"
                    fill="rgba(212,175,55,0.1)" stroke="rgba(212,175,55,0.25)" strokeWidth="0.8"/>
                </svg>
              </div>
              {/* Stats */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  { label: "Status",       value: "ACTIVE",      color: "#22C55E" },
                  { label: "Policy Set",   value: "v4.2.1",      color: "#E2E8F0" },
                  { label: "Integrity",    value: "VERIFIED",    color: "#22C55E" },
                  { label: "Last Updated", value: "2h 14m ago",  color: "#94A3B8" },
                ].map((r) => (
                  <div key={r.label} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{ fontSize: 9.5, color: MUTED, minWidth: 72 }}>{r.label}</span>
                    <span style={{ fontSize: 10.5, fontWeight: 600, color: r.color }}>{r.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Threat Matrix */}
          <div style={CARD}>
            <SectionHead icon={ShieldAlert} title="Threat Matrix" action="VIEW MATRIX" />
            <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
              {/* Donut */}
              <svg viewBox="0 0 96 96" width={90} height={90} style={{ flexShrink: 0 }}>
                {threatPaths.map((seg) => (
                  <path key={seg.label} d={seg.path} fill={seg.color} stroke="#080a0e" strokeWidth="1.5"/>
                ))}
                <text x="48" y="45" textAnchor="middle" fontSize="16" fontWeight="800" fill="#E2E8F0">7</text>
                <text x="48" y="58" textAnchor="middle" fontSize="7.5" fill={MUTED} letterSpacing="0.1em">ACTIVE</text>
              </svg>
              {/* Legend */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {threatSegments.map((seg) => (
                  <div key={seg.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: seg.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 10.5, color: "#CBD5E1", flex: 1 }}>{seg.label}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#E2E8F0" }}>{seg.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Row 2: Case Library | Bridge + Oracle + Adapters */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.15fr 1fr",
            gap: 10,
            marginBottom: 10,
          }}
        >
          {/* Case Library */}
          <div style={CARD}>
            <SectionHead icon={FolderOpen} title="Case Library / Replay" action="VIEW LIBRARY ›" />
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["CASE ID", "TITLE", "EVENT TYPE", "CHAIN(S)", "DATE", "OUTCOME"].map((h) => (
                    <th
                      key={h}
                      style={{
                        fontSize: 8.5,
                        fontWeight: 600,
                        letterSpacing: "0.08em",
                        color: MUTED,
                        textAlign: "left",
                        paddingBottom: 8,
                        borderBottom: "1px solid rgba(212,175,55,0.1)",
                        paddingRight: 8,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cases.map((c) => (
                  <tr key={c.id}>
                    <td style={{ padding: "7px 8px 7px 0", borderBottom: "1px solid rgba(212,175,55,0.06)", fontSize: 9.5, color: "rgba(212,175,55,0.7)", fontFamily: "monospace", whiteSpace: "nowrap" }}>
                      {c.id}
                    </td>
                    <td style={{ padding: "7px 8px", borderBottom: "1px solid rgba(212,175,55,0.06)", fontSize: 10.5, color: "#CBD5E1", whiteSpace: "nowrap" }}>
                      {c.title}
                    </td>
                    <td style={{ padding: "7px 8px", borderBottom: "1px solid rgba(212,175,55,0.06)", fontSize: 9.5, color: MUTED, whiteSpace: "nowrap" }}>
                      {c.type}
                    </td>
                    <td style={{ padding: "7px 8px", borderBottom: "1px solid rgba(212,175,55,0.06)" }}>
                      <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
                        {c.chains.map((ch, i) => (
                          <ChainBadge key={i} color={ch.color} abbr={ch.abbr} />
                        ))}
                      </div>
                    </td>
                    <td style={{ padding: "7px 8px", borderBottom: "1px solid rgba(212,175,55,0.06)", fontSize: 9.5, color: MUTED, whiteSpace: "nowrap" }}>
                      {c.date}
                    </td>
                    <td style={{ padding: "7px 0px 7px 8px", borderBottom: "1px solid rgba(212,175,55,0.06)" }}>
                      <StatusPill label={c.outcome} color={c.outcomeColor} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Right column */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {/* Bridge + Oracle monitors */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[
                { label: "BRIDGE MONITOR", icon: Activity, value: "8 / 8", sub: "Bridges Online", data: bridgeData, color: "#3B82F6" },
                { label: "ORACLE MONITOR", icon: Eye,      value: "12 / 12", sub: "Oracles Online", data: oracleData, color: "#22C55E" },
              ].map((m) => (
                <div key={m.label} style={CARD}>
                  <SectionHead icon={m.icon} title={m.label} />
                  <StatusPill label="HEALTHY" color="#22C55E" />
                  <div style={{ marginTop: 8 }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: "#E2E8F0", lineHeight: 1 }}>
                      {m.value}
                    </div>
                    <div style={{ fontSize: 9.5, color: MUTED, marginTop: 2 }}>{m.sub}</div>
                  </div>
                  <div style={{ marginTop: 8 }}>
                    <Sparkline data={m.data} color={m.color} w={120} h={22} />
                  </div>
                </div>
              ))}
            </div>

            {/* Execution Adapters */}
            <div style={CARD}>
              <SectionHead icon={Cpu} title="Execution Adapters" action="VIEW ALL" />
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-around",
                  alignItems: "center",
                }}
              >
                {adapters.map((adapter) => (
                  <div
                    key={adapter.label}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 5,
                    }}
                  >
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: "50%",
                        background: `${adapter.color}18`,
                        border: `1px solid ${adapter.color}50`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <adapter.icon size={17} style={{ color: adapter.color }} />
                    </div>
                    <span style={{ fontSize: 9.5, fontWeight: 600, color: "#CBD5E1" }}>
                      {adapter.label}
                    </span>
                    <span
                      style={{
                        fontSize: 8.5,
                        color: "#22C55E",
                        letterSpacing: "0.05em",
                      }}
                    >
                      {adapter.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Row 3: Verification & Audit | Adversarial Operations */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "0.72fr 1fr",
            gap: 10,
          }}
        >
          {/* Verification & Audit */}
          <div style={CARD}>
            <SectionHead icon={ShieldCheck} title="Verification & Audit" action="VIEW AUDIT LOGS ›" />
            <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
              {/* Gauge */}
              <div style={{ flexShrink: 0 }}>
                <svg viewBox="0 0 96 96" width={96} height={96}>
                  {/* Track */}
                  <circle
                    cx="48" cy="48" r={GAUGE_R}
                    fill="none"
                    stroke="rgba(212,175,55,0.12)"
                    strokeWidth="8"
                  />
                  {/* Fill */}
                  <circle
                    cx="48" cy="48" r={GAUGE_R}
                    fill="none"
                    stroke={GOLD}
                    strokeWidth="8"
                    strokeDasharray={`${GAUGE_FILL.toFixed(2)} ${GAUGE_GAP.toFixed(2)}`}
                    strokeLinecap="round"
                    transform="rotate(-90 48 48)"
                  />
                  <text x="48" y="45" textAnchor="middle" fontSize="12" fontWeight="800" fill={GOLD}>98.7%</text>
                  <text x="48" y="57" textAnchor="middle" fontSize="6.5" fill="#22C55E" letterSpacing="0.12em">VERIFIED</text>
                </svg>
                <div style={{ textAlign: "center", fontSize: 8.5, color: MUTED, marginTop: 4 }}>Last Audit: 12m ago</div>
                <div style={{ textAlign: "center", fontSize: 8.5, color: "rgba(212,175,55,0.7)", marginTop: 2 }}>
                  NEXT AUDIT IN: 47m
                </div>
              </div>
              {/* Metrics */}
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
                {auditMetrics.map((m) => (
                  <div key={m.label}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 4,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#22C55E", flexShrink: 0 }} />
                        <span style={{ fontSize: 9, color: MUTED, letterSpacing: "0.06em" }}>{m.label}</span>
                      </div>
                      <span style={{ fontSize: 10.5, fontWeight: 700, color: "#E2E8F0" }}>{m.value}</span>
                    </div>
                    {/* Progress bar */}
                    <div style={{ height: 3, background: "rgba(212,175,55,0.08)", borderRadius: 2 }}>
                      <div
                        style={{
                          height: "100%",
                          width: m.value,
                          background: GOLD,
                          borderRadius: 2,
                          opacity: 0.7,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Adversarial Operations */}
          <div style={CARD}>
            <SectionHead icon={Zap} title="Adversarial Operations" action="VIEW WAR ROOM ›" />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>

              {/* Red Team */}
              <div
                style={{
                  borderRadius: 6,
                  padding: "12px 12px",
                  background:
                    "linear-gradient(135deg, rgba(60,10,10,0.8) 0%, rgba(30,5,5,0.9) 100%)",
                  border: "1px solid rgba(239,68,68,0.22)",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 70% 50% at 50% 100%, rgba(239,68,68,0.12) 0%, transparent 70%)", pointerEvents: "none" }} />
                <div style={{ position: "relative" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                    <Zap size={11} style={{ color: "#EF4444" }} />
                    <span style={{ fontSize: 9.5, fontWeight: 700, color: "#EF4444", letterSpacing: "0.1em" }}>RED TEAM</span>
                  </div>
                  <div style={{ fontSize: 9, color: MUTED, marginBottom: 10 }}>Offensive Simulation</div>
                  <div style={{ fontSize: 30, fontWeight: 800, color: "#EF4444", lineHeight: 1 }}>3</div>
                  <div style={{ fontSize: 9, color: "rgba(239,68,68,0.8)", marginBottom: 6 }}>Active Campaigns</div>
                  <div style={{ fontSize: 9, color: MUTED }}>Last Run: 9m ago</div>
                </div>
              </div>

              {/* Blue Team */}
              <div
                style={{
                  borderRadius: 6,
                  padding: "12px 12px",
                  background:
                    "linear-gradient(135deg, rgba(10,20,60,0.8) 0%, rgba(5,10,35,0.9) 100%)",
                  border: "1px solid rgba(59,130,246,0.22)",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 70% 50% at 50% 100%, rgba(59,130,246,0.12) 0%, transparent 70%)", pointerEvents: "none" }} />
                <div style={{ position: "relative" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                    <Shield size={11} style={{ color: "#3B82F6" }} />
                    <span style={{ fontSize: 9.5, fontWeight: 700, color: "#3B82F6", letterSpacing: "0.1em" }}>BLUE TEAM</span>
                  </div>
                  <div style={{ fontSize: 9, color: MUTED, marginBottom: 10 }}>Defensive Posture</div>
                  <div style={{ fontSize: 30, fontWeight: 800, color: "#60A5FA", lineHeight: 1 }}>8</div>
                  <div style={{ fontSize: 9, color: "rgba(96,165,250,0.8)", marginBottom: 6 }}>Active Controls</div>
                  <div style={{ fontSize: 9, color: MUTED }}>Last Updated: 2m ago</div>
                </div>
              </div>

              {/* Black Ops */}
              <div
                style={{
                  borderRadius: 6,
                  padding: "12px 12px",
                  background:
                    "linear-gradient(135deg, rgba(10,8,25,0.9) 0%, rgba(5,4,15,0.95) 100%)",
                  border: "1px solid rgba(168,85,247,0.22)",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 70% 50% at 50% 100%, rgba(168,85,247,0.1) 0%, transparent 70%)", pointerEvents: "none" }} />
                <div style={{ position: "relative" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                    <EyeOff size={11} style={{ color: "#A855F7" }} />
                    <span style={{ fontSize: 9.5, fontWeight: 700, color: "#A855F7", letterSpacing: "0.1em" }}>BLACK OPS</span>
                  </div>
                  <div style={{ fontSize: 9, color: MUTED, marginBottom: 10 }}>Threat Hunting</div>
                  <div style={{ fontSize: 30, fontWeight: 800, color: "#C084FC", lineHeight: 1 }}>5</div>
                  <div style={{ fontSize: 9, color: "rgba(192,132,252,0.8)", marginBottom: 6 }}>Active Hunts</div>
                  <div style={{ fontSize: 9, color: MUTED }}>Last Signal: 1m ago</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <div
        style={{
          borderTop: "1px solid rgba(212,175,55,0.1)",
          padding: "10px 20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* Mini Sagitta diamond */}
          <svg viewBox="0 0 14 14" width={12} height={12}>
            <polygon points="7,1 13,7 7,13 1,7" fill="none" stroke="rgba(212,175,55,0.5)" strokeWidth="1.2"/>
            <polygon points="7,4 10,7 7,10 4,7" fill="rgba(212,175,55,0.25)"/>
          </svg>
          <span
            style={{
              fontSize: 9.5,
              letterSpacing: "0.28em",
              color: "rgba(212,175,55,0.45)",
            }}
          >
            PRESERVE &nbsp;•&nbsp; PROTECT &nbsp;•&nbsp; PERPETUATE
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div
            style={{
              width: 5,
              height: 5,
              borderRadius: "50%",
              background: "#22C55E",
              boxShadow: "0 0 4px #22C55E",
            }}
          />
          <span style={{ fontSize: 9, color: "rgba(100,200,100,0.6)", letterSpacing: "0.04em" }}>
            Secure. Continuous. Sovereign.
          </span>
        </div>
      </div>
    </div>
  );
}
