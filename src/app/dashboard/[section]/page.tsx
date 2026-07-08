import {
  Crosshair,
  BookOpen,
  Network,
  AlertTriangle,
  Building2,
  FolderOpen,
  Cpu,
  Activity,
  Eye,
  ShieldCheck,
  Zap,
  Shield,
  EyeOff,
  Settings,
  ExternalLink,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";

import {
  fetchRadarBridgeCoverage,
  fetchRadarClientEntitlementSummary,
  fetchRadarClients,
  fetchLatestRadarDailyBriefRecord,
  fetchRadarAlerts,
  fetchRadarDailyBrief,
  fetchRadarDailyBriefSocialDeliveries,
  fetchRadarDeliveryDestinations,
  fetchRadarLiveDeliveries,
  fetchRadarLiveObjectsStatus,
  fetchRadarOracleActivationDiagnostics,
  fetchRadarSignalQuality,
  fetchRadarBridgeSignalQuality,
  fetchRadarOracleCoverage,
  fetchRadarLatestOraclePilotDrill,
  fetchRadarOracleReadiness,
  fetchRadarOracleCoverageSummary,
  fetchRadarRuntimeStatus,
  fetchRadarWatchlists,
  fetchRadarWatchlistMatches,
} from "@/lib/radar/service";
import { BridgeCoveragePanel } from "@/components/radar/BridgeCoveragePanel";
import { BridgeSignalQualityPanel } from "@/components/radar/BridgeSignalQualityPanel";
import { OracleCoveragePanel } from "@/components/radar/OracleCoveragePanel";
import { OracleBroadcastCandidatesPanel } from "@/components/radar/OracleBroadcastCandidatesPanel";
import { OraclePilotDrillPanel } from "@/components/radar/OraclePilotDrillPanel";
import { OracleReadinessPanel } from "@/components/radar/OracleReadinessPanel";
import { RadarOperatorConsole } from "@/components/radar/RadarOperatorConsole";
import { RadarLiveSetupPanel } from "@/components/radar/RadarLiveSetupPanel";
import { RadarServiceOpsCard } from "@/components/radar/RadarServiceOpsCard";
import { OracleActivationDiagnosticsPanel } from "@/components/radar/OracleActivationDiagnosticsPanel";
import { RadarMonitorTabs } from "@/components/radar/RadarMonitorTabs";
import type {
  BridgeCoverageItem,
  BridgeCoverageSummary,
  BridgeRouteEvidencePayload,
  ChainlinkOracleEvidenceDetails,
  LpPoolEvidencePayload,
  OracleActivationDiagnosticsResult,
  OracleCoverageItem,
  OraclePilotDrillReport,
  OracleReadinessReport,
  OracleCoverageSummary,
  RadarSignalQualitySnapshot,
  RadarAlert,
  RadarClient,
  RadarClientEntitlementSummary,
  RadarDailyBrief,
  RadarDailyBriefRecord,
  RadarDeliveryDestination,
  RadarLiveDelivery,
  RadarLiveObjectsStatus,
  RadarMonitorType,
  RadarObjectPurpose,
  RadarRuntimeStatus,
  RadarSocialDeliveryRecord,
  RadarSeverity,
  RadarWatchlist,
  RadarWatchlistMatch,
} from "@/lib/radar/types";

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
  "radar-monitor": {
    title: "Radar Monitor",
    description: "Unified Oracle, Bridge, LP, public preview, distribution, and readiness workspace for Radar operators.",
    icon: Activity,
    color: "#D4AF37",
    status: "In Development",
  },
  "lp-monitor": {
    title: "LP Monitor",
    description: "Liquidity pool health, pool imbalance, price deviation, and manipulation surface coverage registry.",
    icon: Activity,
    color: "#10B981",
    status: "In Development",
  },
  "oracle-monitor": {
    title: "Oracle Monitor",
    description: "Oracle feed integrity, staleness detection, and deviation threshold management.",
    icon: Eye,
    color: "#22C55E",
    status: "In Development",
  },
  "radar-service": {
    title: "Radar Service Ops",
    description: "Operator workspace for Radar client accounts, watchlists, destinations, and live delivery operations.",
    icon: Building2,
    color: "#D4AF37",
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

const placeholderCards = [
  { label: "Active Records", value: "-" },
  { label: "Last Sync", value: "-" },
  { label: "Health Status", value: "-" },
  { label: "Pending Actions", value: "-" },
];

export default async function SectionPage(
  props: PageProps<"/dashboard/[section]">
) {
  const { section } = await props.params;
  const meta = sections[section];
  const isProjectMap = section === "project-map";
  const isRadarServiceSection = section === "radar-service";
  const isUnifiedRadarMonitorSection = section === "radar-monitor";
  const isLpMonitorSection = section === "lp-monitor";
  const isRadarSection = section === "bridge-monitor" || section === "oracle-monitor";
  const radarMonitorType: RadarMonitorType | null = section === "bridge-monitor"
    ? "bridge"
    : section === "oracle-monitor"
      ? "oracle"
      : null;

  const Icon = meta?.icon ?? Settings;
  const color = meta?.color ?? "#D4AF37";
  const title = meta?.title ?? section.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const description = meta?.description ?? "Module details loading...";

  let radarAlerts: RadarAlert[] = [];
  let radarRuntimeStatus: RadarRuntimeStatus | null = null;
  let radarDailyBrief: RadarDailyBrief | null = null;
  let latestRadarDailyBrief: RadarDailyBriefRecord | null = null;
  let latestRadarSocialDelivery: RadarSocialDeliveryRecord | null = null;
  let radarWatchlists: RadarWatchlist[] = [];
  let radarWatchlistMatches: RadarWatchlistMatch[] = [];
  let radarDeliveryDestinations: RadarDeliveryDestination[] = [];
  let radarLiveDeliveries: RadarLiveDelivery[] = [];
  let radarClients: RadarClient[] = [];
  let radarEntitlementSummary: RadarClientEntitlementSummary | null = null;
  let radarLiveObjectsStatus: RadarLiveObjectsStatus | null = null;
  let radarOracleDiagnostics: OracleActivationDiagnosticsResult | null = null;
  let radarOracleCoverage: OracleCoverageItem[] = [];
  let radarOracleCoverageSummary: OracleCoverageSummary | null = null;
  let radarBridgeCoverage: BridgeCoverageItem[] = [];
  let radarBridgeCoverageSummary: BridgeCoverageSummary | null = null;
  let radarOracleAlerts: RadarAlert[] = [];
  let radarBridgeAlerts: RadarAlert[] = [];
  let radarLpAlerts: RadarAlert[] = [];
  let radarOracleReadiness: OracleReadinessReport | null = null;
  let radarOraclePilotDrill: OraclePilotDrillReport | null = null;
  let radarSignalQuality: RadarSignalQualitySnapshot | null = null;
  let radarBridgeSignalQuality: RadarSignalQualitySnapshot | null = null;
  let radarBridgeSignalQualityError: string | null = null;
  let radarError: string | null = null;
  let radarRuntimeError: string | null = null;
  let radarDailyBriefError: string | null = null;
  let radarSocialError: string | null = null;
  let radarLiveObjectsError: string | null = null;
  let radarOracleCoverageError: string | null = null;
  let radarBridgeCoverageError: string | null = null;
  let radarOracleReadinessError: string | null = null;
  let radarOraclePilotDrillError: string | null = null;
  let radarSignalQualityError: string | null = null;

  async function settle<T>(loader: () => Promise<T>): Promise<PromiseSettledResult<T>> {
    try {
      return {
        status: "fulfilled",
        value: await loader(),
      };
    } catch (reason) {
      return {
        status: "rejected",
        reason,
      };
    }
  }

  if (isRadarSection && radarMonitorType) {
    const adminKey = process.env.SCE_ADMIN_API_KEY ?? process.env.SCE_DASHBOARD_ADMIN_API_KEY ?? "";
    const isOracle = section === "oracle-monitor";
    const isBridge = section === "bridge-monitor";

    const [
      alertsResult,
      runtimeResult,
      liveObjectsResult,
      briefResult,
      latestBriefResult,
      diagnosticsResult,
      oracleCoverageResult,
      oracleCoverageSummaryResult,
      bridgeCoverageResult,
      oracleReadinessResult,
      oraclePilotDrillResult,
      signalQualityResult,
      bridgeSignalQualityResult,
    ] = await Promise.allSettled([
      fetchRadarAlerts({ status: "active", monitorType: radarMonitorType, limit: 12 }),
      fetchRadarRuntimeStatus(),
      fetchRadarLiveObjectsStatus(),
      fetchRadarDailyBrief(24),
      fetchLatestRadarDailyBriefRecord(),
      isOracle ? fetchRadarOracleActivationDiagnostics(adminKey) : Promise.resolve(null),
      isOracle ? fetchRadarOracleCoverage(adminKey) : Promise.resolve([] as OracleCoverageItem[]),
      isOracle ? fetchRadarOracleCoverageSummary(adminKey) : Promise.resolve(null),
      isBridge ? fetchRadarBridgeCoverage(adminKey) : Promise.resolve(null),
      isOracle ? fetchRadarOracleReadiness(adminKey) : Promise.resolve(null),
      isOracle ? fetchRadarLatestOraclePilotDrill(adminKey) : Promise.resolve(null),
      isOracle ? fetchRadarSignalQuality(adminKey) : Promise.resolve(null),
      isBridge ? fetchRadarBridgeSignalQuality(adminKey) : Promise.resolve(null),
    ]);

    if (alertsResult.status === "fulfilled") {
      radarAlerts = alertsResult.value;
    } else {
      radarError = alertsResult.reason instanceof Error
        ? alertsResult.reason.message
        : "Radar alerts are temporarily unavailable.";
    }

    if (runtimeResult.status === "fulfilled") {
      radarRuntimeStatus = runtimeResult.value;
    } else {
      radarRuntimeError = runtimeResult.reason instanceof Error
        ? runtimeResult.reason.message
        : "Radar runtime status is temporarily unavailable.";
    }

    if (liveObjectsResult.status === "fulfilled") {
      radarLiveObjectsStatus = liveObjectsResult.value;
    } else {
      radarLiveObjectsError = liveObjectsResult.reason instanceof Error
        ? liveObjectsResult.reason.message
        : "Radar live object status is temporarily unavailable.";
    }

    if (diagnosticsResult.status === "fulfilled") {
      radarOracleDiagnostics = diagnosticsResult.value as OracleActivationDiagnosticsResult | null;
    }

    if (oracleCoverageResult.status === "fulfilled") {
      radarOracleCoverage = oracleCoverageResult.value as OracleCoverageItem[];
    } else if (isOracle) {
      radarOracleCoverageError = oracleCoverageResult.reason instanceof Error
        ? oracleCoverageResult.reason.message
        : "Oracle coverage is temporarily unavailable.";
    }

    if (oracleCoverageSummaryResult.status === "fulfilled") {
      radarOracleCoverageSummary = oracleCoverageSummaryResult.value as OracleCoverageSummary | null;
    } else if (isOracle) {
      radarOracleCoverageError = oracleCoverageSummaryResult.reason instanceof Error
        ? oracleCoverageSummaryResult.reason.message
        : "Oracle coverage summary is temporarily unavailable.";
    }

    if (bridgeCoverageResult.status === "fulfilled" && bridgeCoverageResult.value) {
      const bc = bridgeCoverageResult.value as { items: BridgeCoverageItem[]; summary: BridgeCoverageSummary };
      radarBridgeCoverage = bc.items ?? [];
      radarBridgeCoverageSummary = bc.summary ?? null;
    } else if (isBridge && bridgeCoverageResult.status === "rejected") {
      radarBridgeCoverageError = bridgeCoverageResult.reason instanceof Error
        ? bridgeCoverageResult.reason.message
        : "Bridge coverage is temporarily unavailable.";
    }

    if (oracleReadinessResult.status === "fulfilled") {
      radarOracleReadiness = oracleReadinessResult.value as OracleReadinessReport | null;
    } else if (isOracle) {
      radarOracleReadinessError = oracleReadinessResult.reason instanceof Error
        ? oracleReadinessResult.reason.message
        : "Oracle readiness is temporarily unavailable.";
    }

    if (oraclePilotDrillResult.status === "fulfilled") {
      radarOraclePilotDrill = oraclePilotDrillResult.value as OraclePilotDrillReport | null;
    } else if (isOracle) {
      radarOraclePilotDrillError = oraclePilotDrillResult.reason instanceof Error
        ? oraclePilotDrillResult.reason.message
        : "Oracle pilot drill is temporarily unavailable.";
    }

    if (signalQualityResult.status === "fulfilled") {
      radarSignalQuality = signalQualityResult.value as RadarSignalQualitySnapshot | null;
    } else if (isOracle) {
      radarSignalQualityError = signalQualityResult.reason instanceof Error
        ? signalQualityResult.reason.message
        : "Oracle signal quality is temporarily unavailable.";
    }

    if (bridgeSignalQualityResult.status === "fulfilled") {
      radarBridgeSignalQuality = bridgeSignalQualityResult.value as RadarSignalQualitySnapshot | null;
    } else if (isBridge) {
      radarBridgeSignalQualityError = bridgeSignalQualityResult.reason instanceof Error
        ? bridgeSignalQualityResult.reason.message
        : "Bridge signal quality is temporarily unavailable.";
    }

    if (briefResult.status === "fulfilled") {
      radarDailyBrief = briefResult.value;
    } else {
      radarDailyBriefError = briefResult.reason instanceof Error
        ? briefResult.reason.message
        : "Radar daily brief is temporarily unavailable.";
    }

    if (latestBriefResult.status === "fulfilled") {
      latestRadarDailyBrief = latestBriefResult.value;
      if (latestRadarDailyBrief) {
        try {
          const deliveries = await fetchRadarDailyBriefSocialDeliveries(latestRadarDailyBrief.id);
          latestRadarSocialDelivery = deliveries[0] ?? null;
        } catch (error) {
          radarSocialError = error instanceof Error
            ? error.message
            : "Radar social delivery status is temporarily unavailable.";
        }
      }
    }
  } else if (isUnifiedRadarMonitorSection) {
    const [
      oracleAlertsResult,
      bridgeAlertsResult,
      lpAlertsResult,
      runtimeStatusResult,
    ] = await Promise.allSettled([
      fetchRadarAlerts({ status: "active", monitorType: "oracle", limit: 8 }),
      fetchRadarAlerts({ status: "active", monitorType: "bridge", limit: 8 }),
      fetchRadarAlerts({ status: "active", monitorType: "lp", limit: 8 }),
      fetchRadarRuntimeStatus(),
    ]);

    if (oracleAlertsResult.status === "fulfilled") {
      radarOracleAlerts = oracleAlertsResult.value;
    } else {
      radarError = oracleAlertsResult.reason instanceof Error ? oracleAlertsResult.reason.message : "Failed to load oracle alerts.";
    }

    if (bridgeAlertsResult.status === "fulfilled") {
      radarBridgeAlerts = bridgeAlertsResult.value;
    } else {
      radarError = radarError ?? (bridgeAlertsResult.reason instanceof Error ? bridgeAlertsResult.reason.message : "Failed to load bridge alerts.");
    }

    if (lpAlertsResult.status === "fulfilled") {
      radarLpAlerts = lpAlertsResult.value;
    } else {
      radarError = radarError ?? (lpAlertsResult.reason instanceof Error ? lpAlertsResult.reason.message : "Failed to load LP alerts.");
    }

    if (runtimeStatusResult.status === "fulfilled") {
      radarRuntimeStatus = runtimeStatusResult.value;
    } else {
      radarRuntimeError = runtimeStatusResult.reason instanceof Error ? runtimeStatusResult.reason.message : "Failed to load Radar runtime status.";
    }
  } else if (isLpMonitorSection) {
    const adminKey = process.env.SCE_ADMIN_API_KEY ?? process.env.SCE_DASHBOARD_ADMIN_API_KEY ?? "";
    const alertsResult = await settle(() =>
      fetchRadarAlerts({ status: "active", monitorType: "lp", limit: 50 }),
    );
    if (alertsResult.status === "fulfilled") {
      radarAlerts = alertsResult.value;
    } else {
      radarError = alertsResult.reason instanceof Error
        ? alertsResult.reason.message
        : "LP alerts are temporarily unavailable.";
    }
    void adminKey;
  } else if (isRadarServiceSection) {
    const [clientsResult, watchlistsResult, matchesResult, destinationsResult, liveDeliveriesResult] = await Promise.allSettled([
      fetchRadarClients(),
      fetchRadarWatchlists(),
      fetchRadarWatchlistMatches({ status: "pending_delivery", limit: 100 }),
      fetchRadarDeliveryDestinations(),
      fetchRadarLiveDeliveries({ limit: 100 }),
    ]);

    if (clientsResult.status === "fulfilled") {
      radarClients = clientsResult.value;
      const latestClient = radarClients[0] ?? null;
      if (latestClient) {
        try {
          radarEntitlementSummary = await fetchRadarClientEntitlementSummary(latestClient.id);
        } catch {
          radarEntitlementSummary = null;
        }
      }
    } else {
      radarError = clientsResult.reason instanceof Error
        ? clientsResult.reason.message
        : "Radar clients are temporarily unavailable.";
    }

    if (watchlistsResult.status === "fulfilled") {
      radarWatchlists = watchlistsResult.value;
    }
    if (matchesResult.status === "fulfilled") {
      radarWatchlistMatches = matchesResult.value;
    }
    if (destinationsResult.status === "fulfilled") {
      radarDeliveryDestinations = destinationsResult.value;
    }
    if (liveDeliveriesResult.status === "fulfilled") {
      radarLiveDeliveries = liveDeliveriesResult.value;
    }
  }

  const metricCards = isRadarServiceSection
    ? [
        { label: "Total Clients", value: String(radarClients.length) },
        {
          label: "Active / Trial",
          value: String(radarClients.filter((client) => client.status === "active" || client.status === "trial").length),
        },
        { label: "Watchlists", value: String(radarWatchlists.length) },
        { label: "Delivery Destinations", value: String(radarDeliveryDestinations.length) },
        { label: "Pending Matches", value: String(radarWatchlistMatches.length) },
        { label: "Sent Deliveries", value: String(radarLiveDeliveries.filter((delivery) => delivery.status === "sent").length) },
        { label: "Failed Deliveries", value: String(radarLiveDeliveries.filter((delivery) => delivery.status === "failed").length) },
      ]
    : isUnifiedRadarMonitorSection
    ? [
        { label: "Oracle Alerts", value: String(radarOracleAlerts.length) },
        { label: "Bridge Alerts", value: String(radarBridgeAlerts.length) },
        { label: "LP Alerts", value: String(radarLpAlerts.length) },
        { label: "Total Active Signals", value: String(radarOracleAlerts.length + radarBridgeAlerts.length + radarLpAlerts.length) },
      ]
    : isRadarSection
    ? [
        { label: "Active Alerts", value: String(radarAlerts.length) },
        { label: "Critical", value: String(radarAlerts.filter((alert) => alert.severity === "critical").length) },
        { label: "Avg Confidence", value: radarAlerts.length > 0 ? `${Math.round(radarAlerts.reduce((sum, alert) => sum + alert.confidence, 0) / radarAlerts.length)}%` : "0%" },
        { label: "Latest Signal", value: radarAlerts.length > 0 ? formatShortTime(radarAlerts[0].createdAt) : "No signal" },
      ]
    : isLpMonitorSection
    ? [
        { label: "Active LP Alerts", value: String(radarAlerts.length) },
        { label: "Critical", value: String(radarAlerts.filter((alert) => alert.severity === "critical").length) },
        { label: "Warning", value: String(radarAlerts.filter((alert) => alert.severity === "warning").length) },
        { label: "Latest Signal", value: radarAlerts.length > 0 ? formatShortTime(radarAlerts[0].updatedAt) : "No signal" },
      ]
    : placeholderCards;

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

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: 12,
          marginBottom: 20,
        }}
      >
        {metricCards.map((card) => (
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
                color: isRadarSection || isUnifiedRadarMonitorSection ? "#E2E8F0" : "rgba(212,175,55,0.25)",
              }}
            >
              {card.value}
            </div>
          </div>
        ))}
      </div>

      {isUnifiedRadarMonitorSection ? (
        <UnifiedRadarMonitorPage
          oracleAlerts={radarOracleAlerts}
          bridgeAlerts={radarBridgeAlerts}
          lpAlerts={radarLpAlerts}
          runtimeStatus={radarRuntimeStatus}
          error={radarError}
          runtimeError={radarRuntimeError}
        />
      ) : isRadarSection ? (
        <RadarAlertPanel
          section={section}
          alerts={radarAlerts}
          error={radarError}
          runtimeStatus={radarRuntimeStatus}
          runtimeError={radarRuntimeError}
          dailyBrief={radarDailyBrief}
          latestDailyBrief={latestRadarDailyBrief}
          latestSocialDelivery={latestRadarSocialDelivery}
          dailyBriefError={radarDailyBriefError}
          socialError={radarSocialError}
          clients={radarClients}
          entitlementSummary={radarEntitlementSummary}
          watchlists={radarWatchlists}
          watchlistMatches={radarWatchlistMatches}
          deliveryDestinations={radarDeliveryDestinations}
          liveDeliveries={radarLiveDeliveries}
          liveObjectsStatus={radarLiveObjectsStatus}
          liveObjectsError={radarLiveObjectsError}
          oracleDiagnostics={radarOracleDiagnostics}
          oracleCoverage={radarOracleCoverage}
          oracleCoverageSummary={radarOracleCoverageSummary}
          oracleCoverageError={radarOracleCoverageError}
          bridgeCoverage={radarBridgeCoverage}
          bridgeCoverageSummary={radarBridgeCoverageSummary}
          bridgeCoverageError={radarBridgeCoverageError}
          bridgeSignalQuality={radarBridgeSignalQuality}
          bridgeSignalQualityError={radarBridgeSignalQualityError}
          signalQuality={radarSignalQuality}
          signalQualityError={radarSignalQualityError}
          oracleReadiness={radarOracleReadiness}
          oracleReadinessError={radarOracleReadinessError}
          oraclePilotDrill={radarOraclePilotDrill}
          oraclePilotDrillError={radarOraclePilotDrillError}
          accentColor={color}
        />
      ) : isLpMonitorSection ? (
        <LpMonitorPage alerts={radarAlerts} alertError={radarError} />
      ) : isRadarServiceSection ? (
        <RadarServicePage
          clients={radarClients}
          entitlementSummary={radarEntitlementSummary}
          watchlists={radarWatchlists}
          watchlistMatches={radarWatchlistMatches}
          deliveryDestinations={radarDeliveryDestinations}
          liveDeliveries={radarLiveDeliveries}
          error={radarError}
        />
      ) : (
        <PlaceholderPanel
          color={color}
          Icon={Icon}
          isProjectMap={isProjectMap}
        />
      )}
    </div>
  );
}

function UnifiedRadarMonitorPage({
  oracleAlerts,
  bridgeAlerts,
  lpAlerts,
  runtimeStatus,
  error,
  runtimeError,
}: {
  oracleAlerts: RadarAlert[];
  bridgeAlerts: RadarAlert[];
  lpAlerts: RadarAlert[];
  runtimeStatus: RadarRuntimeStatus | null;
  error: string | null;
  runtimeError: string | null;
}) {
  const totalSignals = oracleAlerts.length + bridgeAlerts.length + lpAlerts.length;
  const tabs = [
    {
      label: "Overview",
      content: (
        <div style={{ display: "grid", gap: 16 }}>
          <OperationalPanel
            title="Unified Radar Overview"
            subtitle="Radar Monitor now consolidates Oracle, Bridge, LP, public preview, distribution, and readiness actions into one operator workspace."
            error={error}
          >
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10 }}>
              <MetricLine label="Oracle Signals" value={String(oracleAlerts.length)} />
              <MetricLine label="Bridge Signals" value={String(bridgeAlerts.length)} />
              <MetricLine label="LP Signals" value={String(lpAlerts.length)} />
              <MetricLine label="Total Signals" value={String(totalSignals)} />
            </div>
          </OperationalPanel>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
            <UnifiedRadarSectionCard
              title="Oracle"
              subtitle="Feed integrity, staleness, deviation, broadcast briefs, and Oracle readiness."
              href="/dashboard/oracle-monitor"
              value={`${oracleAlerts.length} active`}
            />
            <UnifiedRadarSectionCard
              title="Bridge"
              subtitle="Canonical bridge monitoring, coverage, activation matrix, and bridge brief preview."
              href="/dashboard/bridge-monitor"
              value={`${bridgeAlerts.length} active`}
            />
            <UnifiedRadarSectionCard
              title="LP"
              subtitle="LP smoke, monitor, fresh preview, and live LP alert review."
              href="/dashboard/lp-monitor"
              value={`${lpAlerts.length} active`}
            />
          </div>
        </div>
      ),
    },
    {
      label: "Oracle",
      badge: oracleAlerts.length,
      content: (
        <UnifiedRadarPillarPanel
          title="Oracle"
          subtitle="Oracle monitor actions stay available here while the legacy Oracle route remains intact for direct links and bookmarks."
          alerts={oracleAlerts}
          href="/dashboard/oracle-monitor"
          emptyMessage="No active Oracle alerts."
        />
      ),
    },
    {
      label: "Bridge",
      badge: bridgeAlerts.length,
      content: (
        <UnifiedRadarPillarPanel
          title="Bridge"
          subtitle="Bridge monitor, route checks, activation matrix, and bridge preview actions stay available from the unified Radar Monitor console."
          alerts={bridgeAlerts}
          href="/dashboard/bridge-monitor"
          emptyMessage="No active Bridge alerts."
        />
      ),
    },
    {
      label: "LP",
      badge: lpAlerts.length,
      content: (
        <UnifiedRadarPillarPanel
          title="LP"
          subtitle="LP coverage, smoke, monitor, and fresh preview actions stay available from the unified Radar Monitor console."
          alerts={lpAlerts}
          href="/dashboard/lp-monitor"
          emptyMessage="No active LP alerts."
          useUpdatedAt
        />
      ),
    },
    {
      label: "Public Preview",
      content: (
        <OperationalPanel
          title="Public Preview"
          subtitle="Run Full Radar Preview, deterministic preview, editorial review, approval, copy, and dry-run controls from the unified operator console below."
          error={null}
        >
          <div style={{ fontSize: 11, color: "rgba(203,213,225,0.76)", lineHeight: 1.7 }}>
            Use the <strong style={{ color: "#F5E7A1" }}>Public Preview</strong> group to compose the current Oracle + Bridge + LP public thread,
            review editorial copy, approve the exact preview hash, and dry-run the approved thread without sending anything.
          </div>
        </OperationalPanel>
      ),
    },
    {
      label: "Distribution",
      content: (
        <OperationalPanel
          title="Distribution"
          subtitle="Approved public threads can be distributed manually from the unified operator console."
          error={null}
        >
          <div style={{ fontSize: 11, color: "rgba(203,213,225,0.76)", lineHeight: 1.7 }}>
            Use the <strong style={{ color: "#F5E7A1" }}>Send Approved Public Thread</strong> control after approval to send the frozen thread to
            configured Discord, Telegram, or X destinations. No auto-send, scheduling, or monitoring logic changed.
          </div>
        </OperationalPanel>
      ),
    },
    {
      label: "Readiness",
      content: (
        <OperationalPanel
          title="Readiness"
          subtitle="Cross-pillar runtime visibility remains available while Radar moves to a unified operator surface."
          error={runtimeError}
        >
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10 }}>
            <MetricLine label="Runtime Enabled" value={runtimeStatus ? yesNo(runtimeStatus.runtimeEnabled) : "Unknown"} />
            <MetricLine label="Oracle Monitor" value={runtimeStatus ? yesNo(runtimeStatus.oracleMonitorEnabled) : "Unknown"} />
            <MetricLine label="Bridge Monitor" value={runtimeStatus ? yesNo(runtimeStatus.bridgeMonitorEnabled ?? false) : "Unknown"} />
            <MetricLine label="Last Success" value={runtimeStatus?.lastSuccessAt ? formatTimestamp(runtimeStatus.lastSuccessAt) : "Unknown"} />
          </div>
        </OperationalPanel>
      ),
    },
  ];

  return (
    <div style={{ display: "grid", gap: 18 }}>
      {error ? (
        <div
          style={{
            borderRadius: 8,
            border: "1px solid rgba(249,115,22,0.25)",
            background: "rgba(24,12,8,0.88)",
            padding: "16px 18px",
            color: "#FDBA74",
            fontSize: 12,
            lineHeight: 1.6,
          }}
        >
          Radar Monitor loaded with partial data. {error}
        </div>
      ) : null}
      <div
        style={{
          background: "rgba(10,12,18,0.92)",
          border: "1px solid rgba(212,175,55,0.1)",
          borderRadius: 8,
          padding: 20,
          display: "grid",
          gap: 16,
        }}
      >
        <RadarMonitorTabs tabs={tabs} />
      </div>
      <RadarOperatorConsole section="radar-monitor" />
    </div>
  );
}

function RadarAlertPanel({
  section,
  alerts,
  error,
  runtimeStatus,
  runtimeError,
  dailyBrief,
  latestDailyBrief,
  latestSocialDelivery,
  dailyBriefError,
  socialError,
  clients,
  entitlementSummary,
  watchlists,
  watchlistMatches,
  deliveryDestinations,
  liveDeliveries,
  liveObjectsStatus,
  liveObjectsError,
  oracleDiagnostics,
  oracleCoverage,
  oracleCoverageSummary,
  oracleCoverageError,
  bridgeCoverage,
  bridgeCoverageSummary,
  bridgeCoverageError,
  bridgeSignalQuality,
  bridgeSignalQualityError,
  signalQuality,
  signalQualityError,
  oracleReadiness,
  oracleReadinessError,
  oraclePilotDrill,
  oraclePilotDrillError,
  accentColor,
}: {
  section: string;
  alerts: RadarAlert[];
  error: string | null;
  runtimeStatus: RadarRuntimeStatus | null;
  runtimeError: string | null;
  dailyBrief: RadarDailyBrief | null;
  latestDailyBrief: RadarDailyBriefRecord | null;
  latestSocialDelivery: RadarSocialDeliveryRecord | null;
  dailyBriefError: string | null;
  socialError: string | null;
  clients: RadarClient[];
  entitlementSummary: RadarClientEntitlementSummary | null;
  watchlists: RadarWatchlist[];
  watchlistMatches: RadarWatchlistMatch[];
  deliveryDestinations: RadarDeliveryDestination[];
  liveDeliveries: RadarLiveDelivery[];
  liveObjectsStatus: RadarLiveObjectsStatus | null;
  liveObjectsError: string | null;
  oracleDiagnostics: OracleActivationDiagnosticsResult | null;
  oracleCoverage: OracleCoverageItem[];
  oracleCoverageSummary: OracleCoverageSummary | null;
  oracleCoverageError: string | null;
  bridgeCoverage: BridgeCoverageItem[];
  bridgeCoverageSummary: BridgeCoverageSummary | null;
  bridgeCoverageError: string | null;
  bridgeSignalQuality: RadarSignalQualitySnapshot | null;
  bridgeSignalQualityError: string | null;
  signalQuality: RadarSignalQualitySnapshot | null;
  signalQualityError: string | null;
  oracleReadiness: OracleReadinessReport | null;
  oracleReadinessError: string | null;
  oraclePilotDrill: OraclePilotDrillReport | null;
  oraclePilotDrillError: string | null;
  accentColor: string;
}) {
  const signalQualityByAlertId = new Map(
    (signalQuality?.signals ?? []).map((quality) => [quality.alertId, quality] as const),
  );
  {
    const overviewContent = (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 12,
        }}
      >
        <OperationalPanel
          title="Runtime Status"
          subtitle="Whether SCE is actively polling and normalizing signals."
          error={runtimeError}
        >
          <MetricLine label="Runtime Enabled" value={runtimeStatus ? yesNo(runtimeStatus.runtimeEnabled) : "Unknown"} />
          {section === "bridge-monitor" ? (
            <>
              <MetricLine label="Bridge Monitor" value={runtimeStatus ? yesNo(runtimeStatus.bridgeMonitorEnabled ?? false) : "Unknown"} />
              <MetricLine label="Last Bridge Run" value={runtimeStatus?.lastBridgeRunAt ? formatTimestamp(runtimeStatus.lastBridgeRunAt) : "Never"} />
              <MetricLine label="Last Success" value={runtimeStatus?.lastBridgeSuccessAt ? formatTimestamp(runtimeStatus.lastBridgeSuccessAt) : "Never"} />
              <MetricLine label="Routes Checked" value={String(runtimeStatus?.routesChecked ?? 0)} />
              <MetricLine label="Sources Checked" value={String(runtimeStatus?.bridgeSourcesChecked ?? 0)} />
              <MetricLine
                label="Alert Changes"
                value={runtimeStatus ? `${runtimeStatus.bridgeAlertsCreated ?? 0}/${runtimeStatus.bridgeAlertsUpdated ?? 0}/${runtimeStatus.bridgeAlertsResolved ?? 0}` : "0/0/0"}
              />
              {runtimeStatus?.lastBridgeError ? <MetricLine label="Bridge Error" value={runtimeStatus.lastBridgeError} /> : null}
            </>
          ) : (
            <>
              <MetricLine label="Oracle Monitor" value={runtimeStatus ? yesNo(runtimeStatus.oracleMonitorEnabled) : "Unknown"} />
              <MetricLine label="Reference Monitor" value={runtimeStatus ? yesNo(runtimeStatus.oracleDeviationEnabled ?? false) : "Unknown"} />
              <MetricLine label="Last Run" value={runtimeStatus?.lastRunAt ? formatTimestamp(runtimeStatus.lastRunAt) : "Never"} />
              <MetricLine label="Last Success" value={runtimeStatus?.lastSuccessAt ? formatTimestamp(runtimeStatus.lastSuccessAt) : "Never"} />
              <MetricLine label="Feeds Checked" value={String(runtimeStatus?.feedsChecked ?? 0)} />
              <MetricLine
                label="Alert Changes"
                value={runtimeStatus ? `${runtimeStatus.alertsCreated}/${runtimeStatus.alertsUpdated}/${runtimeStatus.alertsResolved}` : "0/0/0"}
              />
              <MetricLine label="Last Reference Run" value={runtimeStatus?.lastDeviationRunAt ? formatTimestamp(runtimeStatus.lastDeviationRunAt) : "Never"} />
              {(runtimeStatus?.comparisonGroupsChecked ?? 0) > 0 ? (
                <MetricLine label="Reference Groups" value={String(runtimeStatus?.comparisonGroupsChecked ?? 0)} />
              ) : null}
              {(runtimeStatus?.deviationAlertsCreated ?? 0) > 0 || (runtimeStatus?.deviationAlertsUpdated ?? 0) > 0 || (runtimeStatus?.deviationAlertsResolved ?? 0) > 0 ? (
                <MetricLine
                  label="Reference Changes"
                  value={`${runtimeStatus?.deviationAlertsCreated ?? 0}/${runtimeStatus?.deviationAlertsUpdated ?? 0}/${runtimeStatus?.deviationAlertsResolved ?? 0}`}
                />
              ) : null}
              {runtimeStatus?.lastError ? <MetricLine label="Last Error" value={runtimeStatus.lastError} /> : null}
              {runtimeStatus?.lastDeviationError ? <MetricLine label="Reference Error" value={runtimeStatus.lastDeviationError} /> : null}
            </>
          )}
        </OperationalPanel>

        <OperationalPanel
          title="Daily Brief Preview"
          subtitle="Public Radar activity over the default 24 hour window."
          error={dailyBriefError}
        >
          <MetricLine label="Headline" value={latestDailyBrief?.headline ?? "No stored brief"} />
          <MetricLine label="Status" value={latestDailyBrief?.status ?? "Preview only"} />
          <MetricLine label="Generated" value={latestDailyBrief?.updatedAt ? formatTimestamp(latestDailyBrief.updatedAt) : (dailyBrief?.windowEnd ? formatTimestamp(dailyBrief.windowEnd) : "Unknown")} />
          <MetricLine label="Total Alerts" value={String(latestDailyBrief?.totalAlerts ?? dailyBrief?.totalAlerts ?? 0)} />
          <MetricLine label="Severity" value={formatCountItems(latestDailyBrief?.countsBySeverity ?? dailyBrief?.countsBySeverity)} />
          <MetricLine label="Monitor Types" value={formatCountItems(latestDailyBrief?.countsByMonitorType ?? dailyBrief?.countsByMonitorType)} />
          <MetricLine label="Top Assets" value={formatCountItems(latestDailyBrief?.topAssets ?? dailyBrief?.topAssets)} />
          <MetricLine label="Top Chains" value={formatCountItems(latestDailyBrief?.topChains ?? dailyBrief?.topChains)} />
        </OperationalPanel>

        <OperationalPanel
          title="Live Objects"
          subtitle={section === "bridge-monitor"
            ? "Configured bridge routes, activation state, and latest live check status."
            : "Configured oracle feeds, activation state, and latest live check status."}
          error={liveObjectsError}
        >
          <RadarLiveObjectsPanel
            section={section}
            liveObjectsStatus={liveObjectsStatus}
            oracleDiagnostics={oracleDiagnostics}
          />
        </OperationalPanel>

        <OperationalPanel
          title="Twitter Delivery"
          subtitle="Latest X/Twitter delivery attempt for the stored daily brief."
          error={socialError}
        >
          <MetricLine label="Brief Status" value={latestDailyBrief?.status ?? "No stored brief"} />
          <MetricLine label="Delivery Status" value={latestSocialDelivery?.status ?? "No delivery"} />
          <MetricLine label="Destination" value={latestSocialDelivery?.destination ?? "n/a"} />
          <MetricLine label="Posts" value={String(latestSocialDelivery?.postCount ?? 0)} />
          <MetricLine label="Updated" value={latestSocialDelivery?.updatedAt ? formatTimestamp(latestSocialDelivery.updatedAt) : "Never"} />
          <MetricLine label="Sent At" value={latestSocialDelivery?.sentAt ? formatTimestamp(latestSocialDelivery.sentAt) : "Not sent"} />
          <MetricLine label="Result" value={latestSocialDelivery?.error ?? "No error"} />
          <MetricLine
            label="Preview"
            value={latestSocialDelivery?.postPreview?.[0]?.slice(0, 180) ?? "No Twitter preview recorded yet."}
          />
        </OperationalPanel>
      </div>
    );

    const alertsContent = (
      <>
        {error ? (
          <div
            style={{
              borderRadius: 8,
              border: "1px solid rgba(249,115,22,0.25)",
              background: "rgba(24,12,8,0.88)",
              padding: "16px 18px",
              color: "#FDBA74",
              fontSize: 12,
              lineHeight: 1.6,
            }}
          >
            Radar alerts could not be loaded. {error}
          </div>
        ) : null}
        {!error && alerts.length === 0 ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 8,
              border: "1px dashed rgba(212,175,55,0.18)",
              background: "linear-gradient(180deg, rgba(12,16,24,0.96), rgba(8,10,14,0.96))",
              padding: 28,
              textAlign: "center",
            }}
          >
            <div>
              <div style={{ marginBottom: 8, fontSize: 13, fontWeight: 700, letterSpacing: "0.08em", color: "#E2E8F0" }}>
                No active Radar alerts.
              </div>
              <div style={{ fontSize: 11, color: "rgba(148,163,184,0.72)" }}>
                Radar is ready. Runtime is disabled and no monitor has run yet.
              </div>
            </div>
          </div>
        ) : null}
        {!error && alerts.length > 0 ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 12,
            }}
          >
            {alerts.map((alert) => {
              const signal = signalQualityByAlertId.get(alert.id);
              return (
                <article
                  key={alert.id}
                  style={{
                    display: "grid",
                    gap: 10,
                    background: "linear-gradient(180deg, rgba(15,18,28,0.96), rgba(8,10,14,0.96))",
                    border: "1px solid rgba(212,175,55,0.12)",
                    borderRadius: 10,
                    padding: 16,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      <Badge label={alert.severity.toUpperCase()} color={severityColor(alert.severity)} />
                      <Badge label={monitorLabel(alert.monitorType).toUpperCase()} color={accentColor} />
                      <Badge label={alert.status.toUpperCase()} color="#94A3B8" />
                      <Badge label={formatProvenanceLabel(alert.provenance).toUpperCase()} color={provenanceColor(alert.provenance)} />
                      {alert.objectPurpose ? (
                        <Badge label={formatObjectPurposeLabel(alert.objectPurpose).toUpperCase()} color={objectPurposeColor(alert.objectPurpose)} />
                      ) : null}
                      {signal ? (
                        <Badge label={signalBadgeLabel(signal.broadcastTier)} color={signalBadgeColor(signal.broadcastTier)} />
                      ) : null}
                    </div>
                    <div style={{ fontSize: 10, color: "rgba(148,163,184,0.68)", letterSpacing: "0.08em" }}>
                      {formatTimestamp(alert.createdAt)}
                    </div>
                  </div>
                  <div>
                    <div style={{ marginBottom: 4, fontSize: 11, color: "rgba(212,175,55,0.72)", letterSpacing: "0.08em" }}>
                      SOURCE: {alert.source.toUpperCase()}
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#E2E8F0", lineHeight: 1.5 }}>
                      {alert.summary}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {alert.asset ? <MetaChip label="Asset">{alert.asset}</MetaChip> : null}
                    {alert.chain ? <MetaChip label="Chain">{alert.chain}</MetaChip> : null}
                    {alert.route ? <MetaChip label="Route">{alert.route}</MetaChip> : null}
                    {alert.oracle ? <MetaChip label="Pair">{alert.oracle}</MetaChip> : null}
                    {alert.bridge ? <MetaChip label="Bridge">{alert.bridge}</MetaChip> : null}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
                    <MetricLine label="Alert Confidence" value={`${confidenceLabel(alert.confidence)} / ${alert.confidence}`} />
                    <MetricLine label="Reason" value={humanizeReasonCode(alert.reasonCode)} />
                    <MetricLine label="Observed" value={alert.observedValue ?? "n/a"} />
                    <MetricLine label="Expected" value={alert.expectedValue ?? "n/a"} />
                    <MetricLine label="Signal Type" value={formatProvenanceLabel(alert.provenance)} />
                    <MetricLine label="Object Purpose" value={alert.objectPurpose ? formatObjectPurposeLabel(alert.objectPurpose) : "n/a"} />
                    <MetricLine label="Object" value={alert.monitorObjectId ?? "n/a"} />
                  </div>
                  {alert.reasonCode === "ORACLE_STALE" && alert.evidence ? (
                    <OracleAlertEvidenceSection evidence={alert.evidence} objectPurpose={alert.objectPurpose} />
                  ) : null}
                  {alert.monitorType === "bridge" && alert.bridgeEvidence ? (
                    <BridgeAlertEvidenceSection evidence={alert.bridgeEvidence} confidence={alert.confidence} />
                  ) : null}
                  {alert.monitorType === "lp" && alert.lpEvidence ? (
                    <LpAlertEvidenceSection evidence={alert.lpEvidence} confidence={alert.confidence} />
                  ) : null}
                  {alert.evidenceUrl ? (
                    <a
                      href={alert.evidenceUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#F5E7A1", fontSize: 11, fontWeight: 700, textDecoration: "none" }}
                    >
                      Evidence Link
                      <ExternalLink size={13} />
                    </a>
                  ) : null}
                </article>
              );
            })}
          </div>
        ) : null}
      </>
    );

    const serviceContent = (
      <>
        <RadarLiveWatchlistsPanel section={section} watchlists={watchlists} pendingMatches={watchlistMatches} />
        <RadarLiveDeliveryPanel destinations={deliveryDestinations} liveDeliveries={liveDeliveries} />
        <RadarPlanPanel clients={clients} entitlementSummary={entitlementSummary} />
        <RadarServiceOpsCard />
        <RadarOperatorConsole section={section} />
      </>
    );

    const oracleTabs = section === "oracle-monitor" ? [
      { label: "Overview", content: overviewContent },
      { label: "Active Alerts", badge: alerts.length, content: alertsContent },
      { label: "Diagnostics", content: oracleDiagnostics ? <OracleActivationDiagnosticsPanel diagnostics={oracleDiagnostics} /> : <span style={{ fontSize: 11, color: "rgba(148,163,184,0.5)" }}>No diagnostics data.</span> },
      { label: "Broadcast", content: <OracleBroadcastCandidatesPanel snapshot={signalQuality} error={signalQualityError} /> },
      { label: "Readiness", content: <OracleReadinessPanel report={oracleReadiness} error={oracleReadinessError} /> },
      { label: "Pilot Drill", content: <OraclePilotDrillPanel report={oraclePilotDrill} error={oraclePilotDrillError} /> },
      { label: "Coverage", content: <OracleCoveragePanel items={oracleCoverage} summary={oracleCoverageSummary} error={oracleCoverageError} /> },
      { label: "Service", content: serviceContent },
    ] : [
      { label: "Overview", content: overviewContent },
      { label: "Active Alerts", badge: alerts.length, content: alertsContent },
      { label: "Coverage", content: <BridgeCoveragePanel items={bridgeCoverage} summary={bridgeCoverageSummary} error={bridgeCoverageError} /> },
      { label: "Signal Quality", content: <BridgeSignalQualityPanel snapshot={bridgeSignalQuality} error={bridgeSignalQualityError} /> },
      { label: "Service", content: serviceContent },
    ];

    return (
      <div
        style={{
          background: "rgba(10,12,18,0.92)",
          border: "1px solid rgba(212,175,55,0.1)",
          borderRadius: 8,
          display: "grid",
          gap: 0,
          padding: 20,
          minHeight: 280,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
            marginBottom: 16,
          }}
        >
          <div>
            <div style={{ marginBottom: 6, fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", color: "#D4AF37" }}>
              ACTIVE RADAR ALERTS
            </div>
            <div style={{ fontSize: 12, color: "rgba(203,213,225,0.76)", maxWidth: 620, lineHeight: 1.6 }}>
              {section === "bridge-monitor"
                ? "Bridge route alerts normalized through the shared Radar alert spine."
                : "Oracle feed alerts normalized through the shared Radar alert spine."}
            </div>
          </div>
          <div style={{ fontSize: 10, color: "rgba(148,163,184,0.76)", letterSpacing: "0.08em" }}>
            {error ? "STATUS: DEGRADED" : `VISIBLE SIGNALS: ${alerts.length}`}
          </div>
        </div>

        <RadarMonitorTabs tabs={oracleTabs} />
      </div>
    );
  }
}

function LpMonitorPage({ alerts, alertError }: { alerts: RadarAlert[]; alertError: string | null }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {/* Active LP Alerts */}
      <div
        style={{
          background: "rgba(10,12,18,0.92)",
          border: "1px solid rgba(212,175,55,0.1)",
          borderRadius: 8,
          padding: 20,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div>
            <div style={{ marginBottom: 4, fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", color: "#10B981" }}>
              ACTIVE LP ALERTS
            </div>
            <div style={{ fontSize: 12, color: "rgba(203,213,225,0.76)", lineHeight: 1.5 }}>
              Live LP pool alerts created by the LP monitor. Run LP Monitor to update.
            </div>
          </div>
          <div style={{ fontSize: 10, color: "rgba(148,163,184,0.76)", letterSpacing: "0.08em" }}>
            {alertError ? "STATUS: DEGRADED" : `SIGNALS: ${alerts.length}`}
          </div>
        </div>
        {alertError ? (
          <div style={{ fontSize: 12, color: "#EF4444", lineHeight: 1.6 }}>LP alerts could not be loaded. {alertError}</div>
        ) : alerts.length === 0 ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 8,
              border: "1px dashed rgba(212,175,55,0.18)",
              background: "linear-gradient(180deg, rgba(12,16,24,0.96), rgba(8,10,14,0.96))",
              padding: 28,
              textAlign: "center",
            }}
          >
            <div>
              <div style={{ marginBottom: 8, fontSize: 13, fontWeight: 700, letterSpacing: "0.08em", color: "#E2E8F0" }}>
                No active LP alerts.
              </div>
              <div style={{ fontSize: 11, color: "rgba(148,163,184,0.72)" }}>
                All monitored pools are healthy or LP monitoring has not run yet.
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12 }}>
            {alerts.map((alert) => (
              <article
                key={alert.id}
                style={{
                  display: "grid",
                  gap: 10,
                  background: "linear-gradient(180deg, rgba(15,18,28,0.96), rgba(8,10,14,0.96))",
                  border: "1px solid rgba(212,175,55,0.12)",
                  borderRadius: 10,
                  padding: 16,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <Badge label={alert.severity.toUpperCase()} color={severityColor(alert.severity)} />
                    <Badge label="LP" color="#10B981" />
                    <Badge label={alert.status.toUpperCase()} color="#94A3B8" />
                  </div>
                  <div style={{ fontSize: 10, color: "rgba(148,163,184,0.68)", letterSpacing: "0.08em", whiteSpace: "nowrap" }}>
                    {formatTimestamp(alert.updatedAt)}
                  </div>
                </div>
                <div>
                  <div style={{ marginBottom: 4, fontSize: 11, color: "rgba(212,175,55,0.72)", letterSpacing: "0.08em" }}>
                    {humanizeReasonCode(alert.reasonCode)}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#E2E8F0", lineHeight: 1.5 }}>
                    {alert.summary}
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8 }}>
                  {alert.asset ? <MetricLine label="Asset" value={alert.asset} /> : null}
                  {alert.chain ? <MetricLine label="Chain" value={alert.chain} /> : null}
                  <MetricLine label="Confidence" value={`${alert.confidence}%`} />
                  {alert.observedValue ? <MetricLine label="Observed" value={alert.observedValue} /> : null}
                  {alert.expectedValue ? <MetricLine label="Expected" value={alert.expectedValue} /> : null}
                </div>
                {alert.monitorType === "lp" && alert.lpEvidence ? (
                  <LpAlertEvidenceSection evidence={alert.lpEvidence} confidence={alert.confidence} />
                ) : null}
              </article>
            ))}
          </div>
        )}
      </div>

      {/* Operator Console */}
      <RadarOperatorConsole section="lp-monitor" />
    </div>
  );
}

function UnifiedRadarPillarPanel({
  title,
  subtitle,
  alerts,
  href,
  emptyMessage,
  useUpdatedAt = false,
}: {
  title: string;
  subtitle: string;
  alerts: RadarAlert[];
  href: string;
  emptyMessage: string;
  useUpdatedAt?: boolean;
}) {
  return (
    <OperationalPanel title={title} subtitle={subtitle} error={null}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
        <div style={{ fontSize: 11, color: "rgba(203,213,225,0.76)" }}>
          Active signals: <strong style={{ color: "#E2E8F0" }}>{alerts.length}</strong>
        </div>
        <a href={href} style={{ fontSize: 11, color: "#F5E7A1", textDecoration: "none", fontWeight: 700 }}>
          Open Direct Route
        </a>
      </div>
      {alerts.length === 0 ? (
        <div style={{ fontSize: 11, color: "rgba(148,163,184,0.55)", fontStyle: "italic" }}>{emptyMessage}</div>
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          {alerts.slice(0, 4).map((alert) => (
            <div
              key={alert.id}
              style={{
                display: "grid",
                gap: 6,
                borderRadius: 8,
                border: "1px solid rgba(148,163,184,0.14)",
                background: "rgba(15,23,42,0.45)",
                padding: "10px 12px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <Badge label={alert.severity.toUpperCase()} color={severityColor(alert.severity)} />
                  <Badge label={monitorLabel(alert.monitorType).toUpperCase()} color="#94A3B8" />
                </div>
                <div style={{ fontSize: 10, color: "rgba(148,163,184,0.68)", letterSpacing: "0.08em" }}>
                  {formatTimestamp(useUpdatedAt ? alert.updatedAt : alert.createdAt)}
                </div>
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#E2E8F0", lineHeight: 1.5 }}>{alert.summary}</div>
            </div>
          ))}
        </div>
      )}
    </OperationalPanel>
  );
}

function UnifiedRadarSectionCard({
  title,
  subtitle,
  href,
  value,
}: {
  title: string;
  subtitle: string;
  href: string;
  value: string;
}) {
  return (
    <a
      href={href}
      style={{
        display: "grid",
        gap: 8,
        textDecoration: "none",
        background: "linear-gradient(180deg, rgba(15,18,28,0.96), rgba(8,10,14,0.96))",
        border: "1px solid rgba(212,175,55,0.12)",
        borderRadius: 10,
        padding: 14,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#E2E8F0", letterSpacing: "0.04em" }}>{title}</div>
        <div style={{ fontSize: 10, color: "#F5E7A1", fontWeight: 700 }}>{value}</div>
      </div>
      <div style={{ fontSize: 11, color: "rgba(203,213,225,0.7)", lineHeight: 1.6 }}>{subtitle}</div>
      <div style={{ fontSize: 10, color: "rgba(212,175,55,0.72)", letterSpacing: "0.08em" }}>DIRECT ROUTE AVAILABLE</div>
    </a>
  );
}

function RadarServicePage({
  clients,
  entitlementSummary,
  watchlists,
  watchlistMatches,
  deliveryDestinations,
  liveDeliveries,
  error,
}: {
  clients: RadarClient[];
  entitlementSummary: RadarClientEntitlementSummary | null;
  watchlists: RadarWatchlist[];
  watchlistMatches: RadarWatchlistMatch[];
  deliveryDestinations: RadarDeliveryDestination[];
  liveDeliveries: RadarLiveDelivery[];
  error: string | null;
}) {
  return (
    <div
      style={{
        flex: 1,
        background: "rgba(10,12,18,0.92)",
        border: "1px solid rgba(212,175,55,0.1)",
        borderRadius: 8,
        display: "flex",
        flexDirection: "column",
        gap: 18,
        padding: 20,
        minHeight: 280,
      }}
    >
      <div>
        <div
          style={{
            marginBottom: 6,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.14em",
            color: "#D4AF37",
          }}
        >
          RADAR SERVICE OPERATIONS
        </div>
        <div
          style={{
            fontSize: 12,
            color: "rgba(203,213,225,0.76)",
            maxWidth: 680,
            lineHeight: 1.6,
          }}
        >
          Dedicated operator workspace for Radar client accounts, watchlists, delivery destinations, live delivery,
          and entitlement usage.
        </div>
      </div>

      {error ? (
        <div
          style={{
            borderRadius: 8,
            border: "1px solid rgba(249,115,22,0.25)",
            background: "rgba(24,12,8,0.88)",
            padding: "16px 18px",
            color: "#FDBA74",
            fontSize: 12,
            lineHeight: 1.6,
          }}
        >
          Radar service data could not be loaded completely. {error}
        </div>
      ) : null}

      <RadarLiveSetupPanel
        clients={clients}
        entitlementSummary={entitlementSummary}
        watchlists={watchlists}
        watchlistMatches={watchlistMatches}
        deliveryDestinations={deliveryDestinations}
        liveDeliveries={liveDeliveries}
      />

      <RadarOperatorConsole section="radar-service" />
    </div>
  );
}

function OperationalPanel({
  title,
  subtitle,
  error,
  children,
}: {
  title: string;
  subtitle: string;
  error: string | null;
  children: ReactNode;
}) {
  return (
    <section
      style={{
        display: "grid",
        gap: 12,
        background: "linear-gradient(180deg, rgba(15,18,28,0.96), rgba(8,10,14,0.96))",
        border: "1px solid rgba(212,175,55,0.12)",
        borderRadius: 10,
        padding: 16,
      }}
    >
      <div>
        <div
          style={{
            marginBottom: 4,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.14em",
            color: "#D4AF37",
          }}
        >
          {title.toUpperCase()}
        </div>
        <div
          style={{
            fontSize: 11,
            color: "rgba(203,213,225,0.7)",
            lineHeight: 1.5,
          }}
        >
          {subtitle}
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
          {error}
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: 10,
          }}
        >
          {children}
        </div>
      )}
    </section>
  );
}

function oracleObjectStatusColor(status: string): string {
  if (status === "fresh") return "#22C55E";
  if (status === "stale") return "#F59E0B";
  if (status === "error" || status === "missing_rpc_url" || status === "missing_contract_address") return "#EF4444";
  if (status === "disabled") return "#475569";
  return "#94A3B8";
}

function RadarLiveObjectsPanel({
  section,
  liveObjectsStatus,
  oracleDiagnostics,
}: {
  section: string;
  liveObjectsStatus: RadarLiveObjectsStatus | null;
  oracleDiagnostics: OracleActivationDiagnosticsResult | null;
}) {
  const objectType = section === "bridge-monitor" ? "bridge_route" : "oracle_feed";
  const summary = objectType === "bridge_route" ? liveObjectsStatus?.bridge : liveObjectsStatus?.oracle;
  const objects = (liveObjectsStatus?.objects ?? [])
    .filter((object) => object.objectType === objectType)
    .sort((a, b) => liveObjectDisplayPriority(a) - liveObjectDisplayPriority(b) || new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  const latestObject =
    objects.find((o) => o.status === "fresh" || o.status === "stale") ??
    objects.find((o) => o.status !== "disabled" && o.status !== "configured") ??
    null;

  const isOracle = section === "oracle-monitor";
  const allOracleDisabled = isOracle && objects.length > 0 && objects.every(
    (obj) => obj.status === "disabled" || obj.status === "configured",
  );
  const dependencyFresh = isOracle && objects.some(
    (obj) => obj.purpose === "sagitta_dependency" && obj.status === "fresh",
  );

  if (!summary) {
    return (
      <>
        <MetricLine label={section === "bridge-monitor" ? "Configured Routes" : "Configured Feeds"} value="0" />
        <MetricLine label={section === "bridge-monitor" ? "Enabled Routes" : "Enabled Feeds"} value="0" />
        <MetricLine label={section === "bridge-monitor" ? "Checked Routes" : "Checked Feeds"} value="0" />
        <MetricLine label="Live Objects Active" value="0" />
        <MetricLine label="Latest Success" value="Never" />
        <MetricLine label="Latest Error" value="None" />
        {section === "bridge-monitor" ? <MetricLine label="Missing Source Count" value="0" /> : null}
        <MetricLine label="Latest Signal Object" value="None" />
        {isOracle ? (
          <div
            style={{
              gridColumn: "1 / -1",
              fontSize: 10,
              color: "rgba(148,163,184,0.62)",
              fontStyle: "italic",
              paddingTop: 4,
            }}
          >
            Radar live oracle capability is working, but no Sagitta dependency oracle is active yet. Enable Chainlink USDC/USD on Base to monitor the first Sagitta dependency feed.
          </div>
        ) : null}
      </>
    );
  }

  return (
    <>
      <MetricLine
        label={section === "bridge-monitor" ? "Configured Routes" : "Configured Feeds"}
        value={String(summary.configuredCount)}
      />
      <MetricLine
        label={section === "bridge-monitor" ? "Enabled Routes" : "Enabled Feeds"}
        value={String(summary.enabledCount)}
      />
      <MetricLine
        label={section === "bridge-monitor" ? "Checked Routes" : "Checked Feeds"}
        value={String(summary.checkedCount)}
      />
      <MetricLine label="Live Objects Active" value={String(summary.liveCount)} />
      <MetricLine label="Latest Success" value={summary.latestSuccessAt ? formatTimestamp(summary.latestSuccessAt) : "Never"} />
      <MetricLine label="Latest Error" value={summary.latestError ?? "None"} />
      {section === "bridge-monitor"
        ? <MetricLine label="Missing Source Count" value={String(summary.missingSourceCount)} />
        : null}
      <MetricLine
        label="Latest Signal Object"
        value={latestObject ? `${formatLiveObjectLabel(latestObject)} (${humanizeObjectStatus(latestObject.status)})` : "None"}
      />
      {isOracle && allOracleDisabled ? (
        <div
          style={{
            gridColumn: "1 / -1",
            fontSize: 10,
            color: "rgba(148,163,184,0.62)",
            fontStyle: "italic",
            paddingTop: 4,
          }}
        >
          Radar live oracle capability is working, but no Sagitta dependency oracle is active yet. Enable Chainlink USDC/USD on Base to monitor the first Sagitta dependency feed.
        </div>
      ) : null}
      {isOracle && dependencyFresh ? (
        <div
          style={{
            gridColumn: "1 / -1",
            fontSize: 10,
            color: "rgba(34,197,94,0.82)",
            fontStyle: "italic",
            paddingTop: 4,
          }}
        >
          Sagitta dependency feed is live and fresh.
        </div>
      ) : null}
    </>
  );
}

function RadarLiveWatchlistsPanel({
  section,
  watchlists,
  pendingMatches,
}: {
  section: string;
  watchlists: RadarWatchlist[];
  pendingMatches: RadarWatchlistMatch[];
}) {
  const monitorFilter = section === "bridge-monitor" ? "bridge" : "oracle";
  const relevant = watchlists.filter(
    (w) => w.monitorTypes.length === 0 || w.monitorTypes.includes(monitorFilter),
  );
  const enabled = relevant.filter((w) => w.enabled);
  const latest = pendingMatches[0] ?? null;

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
          RADAR LIVE WATCHLISTS
        </div>
        <div style={{ fontSize: 11, color: "rgba(203,213,225,0.7)", lineHeight: 1.5 }}>
          {section === "bridge-monitor"
            ? "Client watchlists monitoring bridge routes, sources, and assets."
            : "Client watchlists monitoring oracle feeds, sources, and assets."}
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
          gap: 10,
        }}
      >
        {(
          [
            { label: "Total Watchlists", value: String(relevant.length) },
            { label: "Enabled", value: String(enabled.length) },
            { label: "Pending Matches", value: String(pendingMatches.length) },
            {
              label: "Latest Match",
              value: latest ? formatTimestamp(latest.createdAt) : "None",
            },
          ] as { label: string; value: string }[]
        ).map((item) => (
          <div key={item.label}>
            <div
              style={{
                fontSize: 9,
                color: "rgba(148,163,184,0.72)",
                letterSpacing: "0.08em",
                marginBottom: 3,
              }}
            >
              {item.label.toUpperCase()}
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#E2E8F0" }}>{item.value}</div>
          </div>
        ))}
      </div>

      {relevant.length === 0 ? (
        <div style={{ fontSize: 11, color: "rgba(148,163,184,0.55)", fontStyle: "italic" }}>
          No watchlists configured. Create one from Radar Service Ops.
        </div>
      ) : (
        <div style={{ display: "grid", gap: 6 }}>
          {relevant.slice(0, 4).map((wl) => (
            <div
              key={wl.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 8,
                padding: "6px 10px",
                borderRadius: 6,
                background: "rgba(15,23,42,0.45)",
                border: "1px solid rgba(148,163,184,0.1)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: wl.enabled ? "#22C55E" : "#475569",
                    flexShrink: 0,
                    display: "inline-block",
                  }}
                />
                <span style={{ fontSize: 11, color: "#CBD5E1", fontWeight: 600 }}>{wl.name}</span>
              </div>
              <div style={{ display: "flex", gap: 4 }}>
                <span
                  style={{
                    fontSize: 9,
                    color: "#D4AF37",
                    background: "rgba(212,175,55,0.1)",
                    border: "1px solid rgba(212,175,55,0.22)",
                    borderRadius: 999,
                    padding: "2px 7px",
                    letterSpacing: "0.06em",
                  }}
                >
                  {wl.plan.replace("_", " ")}
                </span>
                <span
                  style={{
                    fontSize: 9,
                    color: "rgba(148,163,184,0.72)",
                    background: "rgba(15,23,42,0.55)",
                    border: "1px solid rgba(148,163,184,0.14)",
                    borderRadius: 999,
                    padding: "2px 7px",
                  }}
                >
                  {wl.minimumSeverity}+
                </span>
              </div>
            </div>
          ))}
          {relevant.length > 4 ? (
            <div style={{ fontSize: 10, color: "rgba(148,163,184,0.45)", paddingLeft: 4 }}>
              +{relevant.length - 4} more watchlists
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Plan entitlement constants (mirrors apps/api/app/radar/entitlements.py)
// ---------------------------------------------------------------------------

function _limitLabel(n: number | null): string {
  return n === null ? "∞" : String(n);
}

function RadarPlanPanel({
  clients,
  entitlementSummary,
}: {
  clients: RadarClient[];
  entitlementSummary: RadarClientEntitlementSummary | null;
}) {
  const client = clients[0] ?? null;
  const watchlistsLimit = entitlementSummary?.watchlistsLimit ?? null;
  const destinationsLimit = entitlementSummary?.destinationsLimit ?? null;

  const statRows: { label: string; value: string; warn?: boolean }[] = [
    { label: "Client", value: entitlementSummary?.clientName ?? client?.name ?? "No client" },
    { label: "Status", value: entitlementSummary?.status ?? client?.status ?? "Unknown" },
    { label: "Current Plan", value: entitlementSummary?.plan?.replace("_", " ") ?? client?.plan?.replace("_", " ") ?? "free" },
    {
      label: "Watchlists",
      value: `${entitlementSummary?.watchlistsUsed ?? 0} / ${_limitLabel(watchlistsLimit)}`,
      warn: entitlementSummary !== null && watchlistsLimit !== null && entitlementSummary.watchlistsUsed >= watchlistsLimit,
    },
    {
      label: "Destinations",
      value: `${entitlementSummary?.destinationsUsed ?? 0} / ${_limitLabel(destinationsLimit)}`,
      warn: entitlementSummary !== null && destinationsLimit !== null && entitlementSummary.destinationsUsed >= destinationsLimit,
    },
    { label: "Live Delivery", value: entitlementSummary?.liveDeliveryEnabled ? "Enabled" : "Disabled" },
    { label: "Discord Delivery", value: entitlementSummary?.discordEnabled ? "Enabled" : "Disabled" },
    { label: "Telegram Delivery", value: entitlementSummary?.telegramEnabled ? "Enabled" : "Disabled" },
    { label: "Webhook Delivery", value: entitlementSummary?.webhookEnabled ? "Enabled" : "Disabled" },
  ];

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
          RADAR PLAN
        </div>
        <div style={{ fontSize: 11, color: "rgba(203,213,225,0.7)", lineHeight: 1.5 }}>
          Current plan entitlements and usage.
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
          gap: 10,
        }}
      >
        {statRows.map((row) => (
          <div key={row.label}>
            <div
              style={{
                fontSize: 9,
                color: "rgba(148,163,184,0.72)",
                letterSpacing: "0.08em",
                marginBottom: 3,
              }}
            >
              {row.label.toUpperCase()}
            </div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: row.warn ? "#F59E0B" : "#E2E8F0",
              }}
            >
              {row.value}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function RadarLiveDeliveryPanel({
  destinations,
  liveDeliveries,
}: {
  destinations: RadarDeliveryDestination[];
  liveDeliveries: RadarLiveDelivery[];
}) {
  const enabled = destinations.filter((d) => d.enabled);
  const telegramDestinations = destinations.filter((d) => d.channel === "telegram");
  const sent = liveDeliveries.filter((d) => d.status === "sent");
  const failed = liveDeliveries.filter((d) => d.status === "failed");
  const latest = liveDeliveries[0] ?? null;

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
          RADAR LIVE DELIVERY
        </div>
        <div style={{ fontSize: 11, color: "rgba(203,213,225,0.7)", lineHeight: 1.5 }}>
          Delivery destinations and outbound live alert dispatch status.
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
          gap: 10,
        }}
      >
        {(
          [
            { label: "Total Destinations", value: String(destinations.length) },
            { label: "Enabled", value: String(enabled.length) },
            { label: "Telegram Destinations", value: String(telegramDestinations.length) },
            { label: "Sent", value: String(sent.length) },
            { label: "Failed", value: String(failed.length) },
            { label: "Latest Status", value: latest ? latest.status : "None" },
            { label: "Latest Channel", value: latest ? formatDeliveryChannel(latest.channel) : "—" },
          ] as { label: string; value: string }[]
        ).map((item) => (
          <div key={item.label}>
            <div
              style={{
                fontSize: 9,
                color: "rgba(148,163,184,0.72)",
                letterSpacing: "0.08em",
                marginBottom: 3,
              }}
            >
              {item.label.toUpperCase()}
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#E2E8F0" }}>{item.value}</div>
          </div>
        ))}
      </div>

      {destinations.length === 0 ? (
        <div style={{ fontSize: 11, color: "rgba(148,163,184,0.55)", fontStyle: "italic" }}>
          No delivery destinations configured. Create one from Radar Service Ops.
        </div>
      ) : (
        <div style={{ display: "grid", gap: 6 }}>
          {destinations.slice(0, 4).map((dest) => (
            <div
              key={dest.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 8,
                padding: "6px 10px",
                borderRadius: 6,
                background: "rgba(15,23,42,0.45)",
                border: "1px solid rgba(148,163,184,0.1)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: dest.enabled ? "#22C55E" : "#475569",
                    flexShrink: 0,
                    display: "inline-block",
                  }}
                />
                <span style={{ fontSize: 11, color: "#CBD5E1", fontWeight: 600 }}>{dest.name}</span>
              </div>
              <div style={{ display: "flex", gap: 4 }}>
                <span
                  style={{
                    fontSize: 9,
                    color: "#D4AF37",
                    background: "rgba(212,175,55,0.1)",
                    border: "1px solid rgba(212,175,55,0.22)",
                    borderRadius: 999,
                    padding: "2px 7px",
                    letterSpacing: "0.06em",
                  }}
                >
                  {formatDeliveryChannel(dest.channel)}
                </span>
                <span
                  style={{
                    fontSize: 9,
                    color: "rgba(148,163,184,0.72)",
                    background: "rgba(15,23,42,0.55)",
                    border: "1px solid rgba(148,163,184,0.14)",
                    borderRadius: 999,
                    padding: "2px 7px",
                  }}
                >
                  {dest.minimumSeverity}+
                </span>
              </div>
            </div>
          ))}
          {destinations.length > 4 ? (
            <div style={{ fontSize: 10, color: "rgba(148,163,184,0.45)", paddingLeft: 4 }}>
              +{destinations.length - 4} more destinations
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}

function PlaceholderPanel({
  color,
  Icon,
  isProjectMap,
}: {
  color: string;
  Icon: LucideIcon;
  isProjectMap: boolean;
}) {
  return (
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
  );
}

function confidenceLabel(score: number): string {
  if (score >= 80) return "High";
  if (score >= 50) return "Medium";
  return "Low";
}

function severityColor(severity: RadarSeverity): string {
  if (severity === "critical") return "#EF4444";
  if (severity === "warning") return "#F59E0B";
  return "#38BDF8";
}

function monitorLabel(monitorType: RadarMonitorType): string {
  if (monitorType === "sce_heartbeat") return "SCE Heartbeat";
  return monitorType.replace(/[_-]/g, " ").replace(/\b\w/g, (value) => value.toUpperCase());
}

function formatTimestamp(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown time";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatShortTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatCountItems(items?: Array<{ key: string; count: number }>): string {
  if (!items || items.length === 0) return "None";
  return items.slice(0, 3).map((item) => `${item.key} ${item.count}`).join(" | ");
}

function yesNo(value: boolean): string {
  return value ? "Yes" : "No";
}

function formatDeliveryChannel(value: string): string {
  const labels: Record<string, string> = {
    discord: "Discord",
    telegram: "Telegram",
    webhook: "Webhook",
  };
  return labels[value] ?? value;
}

function humanizeReasonCode(value: string): string {
  const labels: Record<string, string> = {
    ORACLE_STALE: "Oracle stale",
    ORACLE_DEVIATION: "Oracle deviation",
    ORACLE_REFERENCE_DEVIATION: "Reference deviation",
    BRIDGE_LATENCY_SPIKE: "Latency spike",
    BRIDGE_ROUTE_UNAVAILABLE: "Route unavailable",
    BRIDGE_LIQUIDITY_LOW: "Liquidity low",
    ROUTE_PAUSED: "Route paused",
  };
  return labels[value] ?? value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatDurationSeconds(value: number | null | undefined): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return "n/a";
  if (value < 60) return `${value}s`;
  const minutes = Math.floor(value / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}

function formatProvenanceLabel(value: string): string {
  const labels: Record<string, string> = {
    sample: "Sample",
    manual: "Manual",
    runtime: "Runtime",
    live: "Live",
  };
  return labels[value] ?? value;
}

function provenanceColor(value: string): string {
  const colors: Record<string, string> = {
    sample: "#A78BFA",
    manual: "#38BDF8",
    runtime: "#F59E0B",
    live: "#22C55E",
  };
  return colors[value] ?? "#94A3B8";
}

function formatObjectPurposeLabel(value: RadarObjectPurpose): string {
  const labels: Record<RadarObjectPurpose, string> = {
    sagitta_dependency: "Sagitta Dependency",
    technical_smoke: "Technical Smoke",
    oracle_reference: "Oracle Reference",
    commercial_priority: "Commercial Priority",
    future_sagitta_dependency: "Future Sagitta Dependency",
    grant_or_ecosystem_dependency: "Grant / Ecosystem Dependency",
    client_dependency: "Client Dependency",
  };
  return labels[value] ?? value;
}

function objectPurposeColor(value: RadarObjectPurpose): string {
  const colors: Record<RadarObjectPurpose, string> = {
    sagitta_dependency: "#22C55E",
    technical_smoke: "#38BDF8",
    oracle_reference: "#F59E0B",
    commercial_priority: "#D4AF37",
    future_sagitta_dependency: "#F97316",
    grant_or_ecosystem_dependency: "#D4AF37",
    client_dependency: "#D4AF37",
  };
  return colors[value] ?? "#94A3B8";
}

function signalBadgeLabel(value: string): string {
  if (value === "urgent_public") return "Broadcast Candidate";
  if (value === "daily_brief") return "Daily Brief";
  if (value === "client_only") return "Client Only";
  if (value === "internal_only") return "Internal Only";
  return "Suppressed";
}

function signalBadgeColor(value: string): string {
  if (value === "urgent_public") return "#EF4444";
  if (value === "daily_brief") return "#22C55E";
  if (value === "client_only") return "#38BDF8";
  if (value === "internal_only") return "#94A3B8";
  return "#F59E0B";
}

function OracleAlertEvidenceSection({
  evidence,
  objectPurpose,
}: {
  evidence: ChainlinkOracleEvidenceDetails;
  objectPurpose?: RadarObjectPurpose | null;
}) {
  return (
    <div
      style={{
        display: "grid",
        gap: 8,
        padding: "10px 12px",
        borderRadius: 8,
        background: "rgba(8,10,16,0.55)",
        border: "1px solid rgba(148,163,184,0.12)",
      }}
    >
      <div
        style={{
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: "0.12em",
          color: "rgba(148,163,184,0.6)",
        }}
      >
        ORACLE EVIDENCE
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: 8,
        }}
      >
        <MetricLine label="Price" value={evidence.normalizedPrice ?? "n/a"} />
        <MetricLine label="Round" value={evidence.roundId != null ? String(evidence.roundId) : "n/a"} />
        <MetricLine label="Updated" value={evidence.updatedAt ? formatTimestamp(evidence.updatedAt) : "n/a"} />
        <MetricLine label="Feed Age" value={formatDurationSeconds(evidence.feedAgeSeconds)} />
        <MetricLine label="Warning After" value={formatDurationSeconds(evidence.warningAfterSeconds)} />
        <MetricLine label="Critical After" value={formatDurationSeconds(evidence.criticalAfterSeconds)} />
        <MetricLine
          label="Purpose"
          value={objectPurpose ? formatObjectPurposeLabel(objectPurpose) : (evidence.objectPurpose ? formatObjectPurposeLabel(evidence.objectPurpose) : "n/a")}
        />
      </div>
    </div>
  );
}

function BridgeAlertEvidenceSection({
  evidence,
  confidence,
}: {
  evidence: BridgeRouteEvidencePayload;
  confidence?: number | null;
}) {
  const confLabel =
    confidence == null ? null
    : confidence >= 80 ? "High"
    : confidence >= 50 ? "Medium"
    : "Low";

  const fmtSec = (s: number | null | undefined) => {
    if (s == null) return "n/a";
    if (s < 60) return `${s}s`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    const rem = m % 60;
    return rem ? `${h}h ${rem}m` : `${h}h`;
  };

  return (
    <div
      style={{
        display: "grid",
        gap: 8,
        padding: "10px 12px",
        borderRadius: 8,
        background: "rgba(8,10,16,0.55)",
        border: "1px solid rgba(148,163,184,0.12)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div
          style={{
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: "0.12em",
            color: "rgba(148,163,184,0.6)",
          }}
        >
          BRIDGE EVIDENCE
        </div>
        {confLabel != null && (
          <div style={{ fontSize: 10, fontWeight: 700, color: "#F5E7A1" }}>
            Alert Confidence: {confLabel} / {confidence}
          </div>
        )}
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: 8,
        }}
      >
        <MetricLine label="Route" value={`${evidence.sourceChain} → ${evidence.destinationChain}`} />
        <MetricLine label="Asset" value={evidence.asset} />
        <MetricLine label="Observed Latency" value={fmtSec(evidence.observedLatencySeconds)} />
        <MetricLine label="Max Pending Age" value={fmtSec(evidence.maxPendingAgeSeconds)} />
        <MetricLine label="Pending Messages" value={evidence.pendingMessageCount != null ? String(evidence.pendingMessageCount) : "n/a"} />
        <MetricLine label="Warning After" value={fmtSec(evidence.warningAfterSeconds)} />
        <MetricLine label="Critical After" value={fmtSec(evidence.criticalAfterSeconds)} />
        <MetricLine label="Provenance" value={evidence.provenance} />
      </div>
    </div>
  );
}

function LpAlertEvidenceSection({
  evidence,
  confidence,
}: {
  evidence: LpPoolEvidencePayload;
  confidence?: number | null;
}) {
  const confLabel =
    confidence == null ? null
    : confidence >= 80 ? "High"
    : confidence >= 50 ? "Medium"
    : "Low";

  return (
    <div
      style={{
        display: "grid",
        gap: 8,
        padding: "10px 12px",
        borderRadius: 8,
        background: "rgba(8,10,16,0.55)",
        border: "1px solid rgba(148,163,184,0.12)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", color: "rgba(148,163,184,0.6)" }}>
          LP POOL EVIDENCE
        </div>
        {confLabel != null && (
          <div style={{ fontSize: 10, fontWeight: 700, color: "#F5E7A1" }}>
            Alert Confidence: {confLabel} / {confidence}
          </div>
        )}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8 }}>
        <MetricLine label="Pool" value={evidence.poolName} />
        <MetricLine label="Provider" value={evidence.provider} />
        <MetricLine label="Chain" value={evidence.chain} />
        <MetricLine label="Pair" value={evidence.assetPair} />
        <MetricLine label="Liquidity" value={evidence.liquidity ?? "n/a"} />
        <MetricLine label="Fee Tier" value={evidence.fee != null ? `${evidence.fee / 10000}%` : "n/a"} />
        <MetricLine label="Tick" value={evidence.tick != null ? String(evidence.tick) : "n/a"} />
        <MetricLine label="Pool Price" value={evidence.normalizedPrice != null ? evidence.normalizedPrice.toFixed(4) : "n/a"} />
        <MetricLine label="Reference Price" value={evidence.referencePrice != null ? evidence.referencePrice.toFixed(4) : "n/a"} />
        <MetricLine label="Deviation bps" value={evidence.priceDeviationBps != null ? String(evidence.priceDeviationBps) : "n/a"} />
        <MetricLine label="Liquidity Drop %" value={evidence.liquidityDropPct != null ? `${evidence.liquidityDropPct.toFixed(1)}%` : "n/a"} />
        <MetricLine label="Imbalance %" value={evidence.imbalancePct != null ? `${evidence.imbalancePct.toFixed(1)}%` : "n/a"} />
        <MetricLine
          label="Dominant Asset"
          value={
            evidence.dominantAsset && evidence.dominantAssetSharePct != null
              ? `${evidence.dominantAsset} (${evidence.dominantAssetSharePct.toFixed(1)}%)`
              : "n/a"
          }
        />
        <MetricLine
          label="Calibration Status"
          value={evidence.imbalanceCalibrationStatus ? evidence.imbalanceCalibrationStatus.replace(/_/g, " ") : "n/a"}
        />
        <MetricLine
          label="Internal Threshold"
          value={`imbalance >= ${evidence.imbalanceWarningPct}% / ${evidence.imbalanceCriticalPct}%`}
        />
        <MetricLine
          label="Public Threshold"
          value={
            evidence.imbalancePublicWarningPct != null && evidence.imbalancePublicCriticalPct != null
              ? `imbalance >= ${evidence.imbalancePublicWarningPct.toFixed(1)}% / ${evidence.imbalancePublicCriticalPct.toFixed(1)}%`
              : "n/a"
          }
        />
        <MetricLine label="Warning Threshold" value={`dev ≥ ${evidence.priceDeviationWarningBps} bps`} />
        <MetricLine label="Critical Threshold" value={`dev ≥ ${evidence.priceDeviationCriticalBps} bps`} />
        <MetricLine label="Token0" value={evidence.token0Symbol ?? evidence.token0Address ?? "n/a"} />
        <MetricLine label="Token1" value={evidence.token1Symbol ?? evidence.token1Address ?? "n/a"} />
        <MetricLine label="Provenance" value={evidence.provenance} />
      </div>
    </div>
  );
}

function liveObjectDisplayPriority(object: { objectType: string; purpose?: RadarObjectPurpose | null }): number {
  if (object.objectType !== "oracle_feed") return 99;
  const order: Record<RadarObjectPurpose, number> = {
    sagitta_dependency: 0,
    technical_smoke: 1,
    oracle_reference: 2,
    commercial_priority: 3,
    future_sagitta_dependency: 4,
    grant_or_ecosystem_dependency: 5,
    client_dependency: 6,
  };
  return object.purpose ? order[object.purpose] ?? 99 : 99;
}

function liveObjectStateDescription(
  obj: { status: string; purpose?: RadarObjectPurpose | null },
  diag: { enabledEnv?: string; rpcUrlEnv?: string; contractAddressEnvsChecked?: string[] } | null,
): string | null {
  if (obj.status === "disabled") {
    const env = diag?.enabledEnv ?? "the enabled env flag";
    if (obj.purpose === "sagitta_dependency") {
      return `Configured but disabled. Set ${env}=true to activate the first Sagitta dependency oracle.`;
    }
    return `Configured but disabled. Set ${env}=true to activate.`;
  }
  if (obj.status === "configured") {
    if (obj.purpose === "future_sagitta_dependency") {
      return "Configured pending. Not a live monitor until the Reserve route confirms this chain.";
    }
    if (obj.purpose === "grant_or_ecosystem_dependency") {
      return "Configured pending. Not a live monitor unless this ecosystem dependency becomes active.";
    }
    return "Configured pending. Not a live monitor yet.";
  }
  if (obj.status === "missing_rpc_url") {
    const env = diag?.rpcUrlEnv ?? "RPC URL env";
    return `Enabled but missing ${env}.`;
  }
  if (obj.status === "missing_contract_address") {
    const env = diag?.contractAddressEnvsChecked?.[0] ?? "the feed address env";
    return `Enabled but missing Chainlink feed address. Set ${env}.`;
  }
  if (obj.status === "fresh") return "Live check succeeded.";
  return null;
}

function humanizeObjectStatus(value: string): string {
  const labels: Record<string, string> = {
    configured: "Configured",
    enabled: "Enabled",
    disabled: "Disabled",
    checked: "Checked",
    fresh: "Fresh",
    stale: "Stale",
    skipped: "Skipped",
    error: "Error",
    missing_rpc_url: "Missing RPC",
    missing_contract_address: "Missing Contract",
    missing_status_source: "Missing Source",
  };
  return labels[value] ?? value;
}

function formatLiveObjectLabel(object: {
  pair?: string | null;
  chain?: string | null;
  route?: string | null;
  asset?: string | null;
}): string {
  if (object.route) {
    return `${object.asset ?? "Route"} ${object.route}`;
  }
  return [object.pair, object.chain].filter(Boolean).join(" on ") || object.asset || "Unknown object";
}

function Badge({ label, color }: { label: string; color: string }) {
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
      {label}
    </span>
  );
}

function MetaChip({ label, children }: { label?: string; children: ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 2,
        padding: "4px 8px",
        height: "fit-content",
        background: "rgba(148,163,184,0.05)",
        border: "1px solid rgba(148,163,184,0.14)",
        borderRadius: 6,
      }}
    >
      {label ? (
        <span
          style={{
            fontSize: 8,
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "rgba(148,163,184,0.5)",
          }}
        >
          {label}
        </span>
      ) : null}
      <span
        style={{
          fontSize: 11,
          fontWeight: 500,
          color: "#E2E8F0",
          whiteSpace: "nowrap",
        }}
      >
        {children}
      </span>
    </div>
  );
}

function MetricLine({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div
        style={{
          marginBottom: 4,
          fontSize: 9,
          color: "rgba(148,163,184,0.72)",
          letterSpacing: "0.08em",
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
