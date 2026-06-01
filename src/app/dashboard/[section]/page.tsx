import {
  Crosshair,
  BookOpen,
  Network,
  AlertTriangle,
  FolderOpen,
  Cpu,
  Activity,
  Eye,
  ShieldCheck,
  Zap,
  Shield,
  EyeOff,
  Settings,
  type LucideIcon,
} from "lucide-react";

// ─── Section registry ─────────────────────────────────────────────────────────

const sections: Record<
  string,
  { title: string; description: string; icon: LucideIcon; color: string; status: string }
> = {
  situational: {
    title: "Situational Awareness",
    description: "Real-time threat landscape and environmental signal aggregation across all monitored protocols.",
    icon: Crosshair,
    color: "#3B82F6",
    status: "In Development",
  },
  doctrine: {
    title: "Doctrine Engine",
    description: "Policy management, rule authoring, and autonomous decision doctrine configuration.",
    icon: BookOpen,
    color: "#D4AF37",
    status: "In Development",
  },
  "threat-matrix": {
    title: "Threat Matrix",
    description: "Structured threat classification and active incident severity mapping.",
    icon: Network,
    color: "#EF4444",
    status: "In Development",
  },
  incidents: {
    title: "Incidents",
    description: "Full incident lifecycle management, triage queue, and resolution tracking.",
    icon: AlertTriangle,
    color: "#F97316",
    status: "In Development",
  },
  "case-library": {
    title: "Case Library",
    description: "Historical case archive with validation capabilities and doctrine outcome analysis.",
    icon: FolderOpen,
    color: "#22C55E",
    status: "In Development",
  },
  adapters: {
    title: "Execution Adapters",
    description: "Adapter configuration, health monitoring, and execution chain management.",
    icon: Cpu,
    color: "#8B5CF6",
    status: "In Development",
  },
  "bridge-monitor": {
    title: "Bridge Monitor",
    description: "Cross-chain bridge health, liquidity depth, and anomaly detection dashboards.",
    icon: Activity,
    color: "#3B82F6",
    status: "In Development",
  },
  "oracle-monitor": {
    title: "Oracle Monitor",
    description: "Oracle feed integrity, staleness detection, and deviation threshold management.",
    icon: Eye,
    color: "#22C55E",
    status: "In Development",
  },
  "project-map": {
    title: "Project Map",
    description: "Account-specific systems, contracts, chains, bridges, oracles, frontends, and operational dependencies.",
    icon: FolderOpen,
    color: "#3B82F6",
    status: "Placeholder",
  },
  reports: {
    title: "Reports",
    description: "Account-specific reports, exports, and continuity reporting surfaces.",
    icon: ShieldCheck,
    color: "#D4AF37",
    status: "Placeholder",
  },
  audit: {
    title: "Verification & Audit",
    description: "Policy compliance verification, code integrity checks, and audit trail management.",
    icon: ShieldCheck,
    color: "#D4AF37",
    status: "In Development",
  },
  "red-team": {
    title: "Red Team",
    description: "Offensive simulation campaigns, adversarial scenario planning, and exploit modeling.",
    icon: Zap,
    color: "#EF4444",
    status: "In Development",
  },
  "blue-team": {
    title: "Blue Team",
    description: "Defensive posture management, active control monitoring, and incident response.",
    icon: Shield,
    color: "#3B82F6",
    status: "In Development",
  },
  "black-ops": {
    title: "Black Ops",
    description: "Covert threat hunting, zero-day signal detection, and classified operation tracking.",
    icon: EyeOff,
    color: "#A855F7",
    status: "In Development",
  },
  settings: {
    title: "System Settings",
    description: "Global configuration, access control, integration management, and system preferences.",
    icon: Settings,
    color: "#94A3B8",
    status: "In Development",
  },
};

// ─── Placeholder metric cards ─────────────────────────────────────────────────

const placeholderCards = [
  { label: "Active Records",    value: "—" },
  { label: "Last Sync",         value: "—" },
  { label: "Health Status",     value: "—" },
  { label: "Pending Actions",   value: "—" },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function SectionPage(
  props: PageProps<"/dashboard/[section]">
) {
  const { section } = await props.params;
  const meta = sections[section];
  const isProjectMap = section === "project-map";

  const Icon = meta?.icon ?? Settings;
  const color = meta?.color ?? "#D4AF37";
  const title = meta?.title ?? section.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const description = meta?.description ?? "Module details loading…";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100%",
        padding: "24px 20px",
        background: "#080a0e",
      }}
    >
      {/* Section header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 16,
          marginBottom: 28,
          paddingBottom: 20,
          borderBottom: "1px solid rgba(212,175,55,0.12)",
        }}
      >
        {/* Icon badge */}
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 10,
            background: `${color}14`,
            border: `1px solid ${color}40`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Icon size={22} style={{ color }} />
        </div>

        <div style={{ flex: 1 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 6,
            }}
          >
            <h1
              style={{
                margin: 0,
                fontSize: 20,
                fontWeight: 700,
                letterSpacing: "0.06em",
                color: "#E2E8F0",
              }}
            >
              {title}
            </h1>
            <span
              style={{
                fontSize: 9,
                fontWeight: 600,
                letterSpacing: "0.1em",
                color: "#D4AF37",
                background: "rgba(212,175,55,0.1)",
                border: "1px solid rgba(212,175,55,0.28)",
                borderRadius: 4,
                padding: "2px 8px",
              }}
            >
              {meta?.status?.toUpperCase() ?? "IN DEVELOPMENT"}
            </span>
          </div>
          <p
            style={{
              margin: 0,
              fontSize: 12,
              color: "rgba(140,140,170,0.8)",
              lineHeight: 1.5,
              maxWidth: 520,
            }}
          >
            {description}
          </p>
        </div>
      </div>

      {/* Placeholder metric cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 12,
          marginBottom: 20,
        }}
      >
        {placeholderCards.map((card) => (
          <div
            key={card.label}
            style={{
              background: "rgba(10,12,18,0.92)",
              border: "1px solid rgba(212,175,55,0.12)",
              borderRadius: 8,
              padding: "16px 18px",
            }}
          >
            <div
              style={{
                fontSize: 9,
                letterSpacing: "0.1em",
                color: "rgba(140,140,170,0.55)",
                marginBottom: 8,
                textTransform: "uppercase",
              }}
            >
              {card.label}
            </div>
            <div
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: "rgba(212,175,55,0.25)",
              }}
            >
              {card.value}
            </div>
          </div>
        ))}
      </div>

      {/* Placeholder content area */}
      <div
        style={{
          flex: 1,
          background: "rgba(10,12,18,0.92)",
          border: "1px solid rgba(212,175,55,0.1)",
          borderRadius: 8,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
          padding: 40,
          minHeight: 280,
        }}
      >
        {/* Animated pulse ring */}
        <div style={{ position: "relative", width: 64, height: 64 }}>
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              border: `2px solid ${color}30`,
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 8,
              borderRadius: "50%",
              border: `1.5px solid ${color}50`,
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 16,
              borderRadius: "50%",
              background: `${color}12`,
              border: `1px solid ${color}60`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon size={16} style={{ color }} />
          </div>
        </div>

        <div style={{ textAlign: "center" }}>
          <p
            style={{
              margin: "0 0 6px",
              fontSize: 13,
              fontWeight: 600,
              color: "#94A3B8",
              letterSpacing: "0.06em",
            }}
          >
            {isProjectMap ? "Project Map" : "Module Under Construction"}
          </p>
          <p
            style={{
              margin: 0,
              fontSize: 11,
              color: "rgba(140,140,170,0.5)",
            }}
          >
            {isProjectMap
              ? "Project Map v1 will connect account assets to global SCE intelligence."
              : "This section is being built out. Content will appear here."}
          </p>
        </div>

        {/* Decorative grid lines */}
        <svg
          viewBox="0 0 400 60"
          style={{
            width: "100%",
            maxWidth: 400,
            opacity: 0.15,
            marginTop: 8,
          }}
        >
          {[0, 1, 2, 3, 4].map((i) => (
            <line
              key={i}
              x1={i * 100}
              y1="0"
              x2={i * 100}
              y2="60"
              stroke={color}
              strokeWidth="0.5"
            />
          ))}
          {[0, 1, 2].map((i) => (
            <line
              key={i}
              x1="0"
              y1={i * 30}
              x2="400"
              y2={i * 30}
              stroke={color}
              strokeWidth="0.5"
            />
          ))}
          <circle cx="200" cy="30" r="4" fill={color} opacity="0.6" />
          <circle cx="200" cy="30" r="10" fill="none" stroke={color} strokeWidth="0.5" />
        </svg>
      </div>
    </div>
  );
}
