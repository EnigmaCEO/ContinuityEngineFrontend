"use client";

import { useCallback, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";

import { useSession } from "@/components/layout/SessionContext";

type ActionKey =
  | "client-sample"
  | "client-upgrade-pro"
  | "client-downgrade-live"
  | "client-suspend"
  | "oracle-sample"
  | "bridge-sample"
  | "run-chainlink"
  | "run-reference"
  | "run-oracle-pilot-drill"
  | "recompute-signal-quality"
  | "bridge-monitor"
  | "bridge-reconcile-stale"
  | "run-bridge"
  | "cctp-smoke"
  | "cctp-circle-verify"
  | "bridge-brief-preview"
  | "public-alerts-preview"
  | "public-alerts-preview-fresh"
  | "public-alerts-preview-approve"
  | "public-alerts-preview-revoke"
  | "public-alerts-preview-copy"
  | "public-alerts-preview-dry-run"
  | "public-alerts-preview-send-approved"
  | "bridge-activation-matrix"
  | "bridge-drill-warning"
  | "bridge-drill-critical"
  | "bridge-drill-recovery"
  | "bridge-drill-healthy"
  | "oracle-diagnostics"
  | "oracle-smoke"
  | "generate-broadcast-brief"
  | "generate-brief"
  | "publish-brief"
  | "preview-twitter"
  | "dry-run-twitter"
  | "watchlist-sample-bridge"
  | "watchlist-sample-oracle"
  | "watchlist-match-all"
  | "delivery-sample-discord"
  | "delivery-sample-telegram"
  | "delivery-sample-webhook"
  | "deliver-pending"
  | "radar-readiness"
  | "lp-coverage"
  | "lp-smoke"
  | "lp-uniswap-v3-smoke"
  | "lp-uniswap-v3-monitor"
  | "lp-fresh-preview"
  | "lp-aerodrome-smoke";

type ActionLevel = "success" | "warning" | "error";

interface ActionDef {
  key: ActionKey;
  label: string;
  description: string;
  requiresPreviewContext?: boolean;
}

interface ActionGroup {
  label: string;
  actions: ActionDef[];
}

interface SummaryItem {
  label: string;
  value: string;
}

interface ResultRow {
  title: string;
  fields: SummaryItem[];
}

interface ActionResult {
  action: string;
  level: ActionLevel;
  message: string;
  summary: SummaryItem[];
  rows: ResultRow[];
  errors: string[];
  previewPosts: string[];
  approvalContext?: PreviewApprovalContext;
  timestamp: string;
}

interface PreviewApprovalContext {
  previewHash: string;
  threadHash: string;
  postCount: number;
  copyText: string;
  approvalStatus: string;
  approvalId?: string | null;
  approvedAt?: string | null;
  expiresAt?: string | null;
  previewChanged: boolean;
}

interface DistributionSelection {
  discord: boolean;
  telegram: boolean;
  x: boolean;
  dryRun: boolean;
}

const READINESS_ACTIONS: ActionDef[] = [
  { key: "radar-readiness", label: "Radar Readiness", description: "Internal readiness summary: Oracle + Bridge operational readiness, active alerts, broadcast status, coverage, and next operator action" },
];

const MONITOR_ORACLE: ActionDef[] = [
  { key: "oracle-sample", label: "Create Oracle Sample", description: "Seed a sample Chainlink stale alert" },
  { key: "run-chainlink", label: "Chainlink Staleness Check", description: "Check all Chainlink feed heartbeats and stale thresholds" },
  { key: "run-reference", label: "Run Reference Check", description: "Compare configured Chainlink feeds against their Pyth reference feeds" },
  { key: "run-oracle-pilot-drill", label: "Run Oracle Pilot Drill", description: "Run the internal pilot-readiness drill across checks, briefing, watchlists, and delivery readiness" },
  { key: "recompute-signal-quality", label: "Recompute Signal Quality", description: "Score recent oracle alerts for broadcast eligibility and public-signal quality" },
  { key: "oracle-diagnostics", label: "Oracle Activation Diagnostics", description: "Check env config state for all oracle feeds" },
  { key: "oracle-smoke", label: "Chainlink Smoke Check", description: "Run the prioritized live oracle smoke set: Base USDC/USD, Ethereum PAXG/USD, then Base ETH/USD" },
];

const MONITOR_BRIDGE: ActionDef[] = [
  { key: "bridge-sample", label: "Create Bridge Sample", description: "Seed a sample CCTP latency alert" },
  { key: "bridge-monitor", label: "Run Bridge Monitor", description: "Canonical bridge pipeline: CCTP route checks, alert lifecycle, signal quality, and broadcast policy classification" },
  { key: "bridge-reconcile-stale", label: "Reconcile Stale Route Alerts", description: "Resolve active bridge alerts tied to disabled, backlog, or unsupported routes — no live checks, no notifications" },
  { key: "cctp-smoke", label: "Run CCTP Route Check", description: "Diagnostic: run live CCTP route smoke check for Ethereum↔Base USDC routes" },
  { key: "cctp-circle-verify", label: "Verify Circle CCTP API", description: "Diagnostic: verify Circle API config, response shape, and route mapping before enabling live bridge monitoring" },
  { key: "bridge-brief-preview", label: "Bridge Brief Preview", description: "Internal: preview what Bridge Radar would publish in a future bridge daily brief from current policy candidates" },
  { key: "bridge-activation-matrix", label: "Bridge Activation Matrix", description: "View provider activation status for CCTP, Across, and Wormhole routes" },
  { key: "bridge-drill-warning", label: "Bridge Drill: Warning Delay", description: "Synthetic drill: drive a warning-delay scenario through the full bridge alert lifecycle, signal quality, and broadcast policy (internal-only, no broadcast)" },
  { key: "bridge-drill-critical", label: "Bridge Drill: Critical Delay", description: "Synthetic drill: drive a critical-delay scenario through the full bridge stack (internal-only, no broadcast, no delivery)" },
  { key: "bridge-drill-recovery", label: "Bridge Drill: Recovery", description: "Synthetic drill: confirm a previously delayed drill route resolves cleanly (internal-only)" },
  { key: "bridge-drill-healthy", label: "Bridge Drill: Healthy", description: "Synthetic drill: confirm a healthy route produces no alert and resolves any active drill alert (internal-only)" },
  { key: "run-bridge", label: "Legacy Bridge Routes", description: "Diagnostic: run the legacy mock/all-source bridge route monitor" },
];

const ORACLE_BRIEF_ACTIONS: ActionDef[] = [
  { key: "generate-broadcast-brief", label: "Generate Broadcast Brief", description: "Draft a broadcast-only oracle brief from current broadcast candidates" },
  { key: "publish-brief", label: "Publish Latest Brief", description: "Publish the latest draft daily brief" },
];

const BRIDGE_BRIEF_ACTIONS: ActionDef[] = [
  { key: "generate-brief", label: "Generate Daily Brief", description: "Draft a new daily brief from current alerts" },
  { key: "publish-brief", label: "Publish Latest Brief", description: "Publish the latest draft daily brief" },
];

const DISTRIBUTION_ACTIONS: ActionDef[] = [
  { key: "preview-twitter", label: "Preview X/Twitter", description: "Compose the tweet thread for the latest published brief" },
  { key: "dry-run-twitter", label: "Dry Run X/Twitter", description: "Record a dry-run delivery for the latest published brief" },
];

const PUBLIC_PREVIEW_ACTIONS: ActionDef[] = [
  { key: "public-alerts-preview-fresh", label: "Run Full Radar Preview", description: "Run Oracle refresh, Bridge Monitor, Bridge Brief Preview, LP Monitor, LP Fresh Preview, and unified public Radar preview in one preview-only operator action." },
  { key: "public-alerts-preview", label: "Preview Public Radar Alerts", description: "Preview-only unified public Radar thread across Oracle, Bridge, and LP eligible signals. No X/Twitter post, no delivery notifications, no polling." },
  { key: "public-alerts-preview-copy", label: "Copy Full Thread", description: "Return the full current Radar public preview thread text for operator copy/export.", requiresPreviewContext: true },
  { key: "public-alerts-preview-approve", label: "Approve Preview", description: "Approve the exact current Radar public preview thread hash for future manual delivery tasks.", requiresPreviewContext: true },
  { key: "public-alerts-preview-revoke", label: "Revoke Approval", description: "Revoke approval for the exact current Radar public preview thread hash.", requiresPreviewContext: true },
  { key: "public-alerts-preview-dry-run", label: "Dry Run Approved Thread", description: "Build a no-send platform preview for the currently approved Radar public preview thread.", requiresPreviewContext: true },
  { key: "public-alerts-preview-send-approved", label: "Send Approved Public Thread", description: "Send the exact approved Radar public preview thread to requested public channels or dry run the send.", requiresPreviewContext: true },
];

const WATCHLIST_ACTIONS: ActionDef[] = [
  { key: "watchlist-sample-bridge", label: "Create USDC Bridge Watchlist", description: "Seed a sample USDC bridge watchlist (dev)" },
  { key: "watchlist-sample-oracle", label: "Create USDC Oracle Watchlist", description: "Seed a sample Base USDC oracle watchlist (dev)" },
  { key: "watchlist-match-all", label: "Match Active Alerts", description: "Run matching engine across all enabled watchlists" },
];

const CLIENT_ACTIONS: ActionDef[] = [
  { key: "client-sample", label: "Create Sample Radar Client", description: "Seed the shared sample Radar client profile (dev)" },
  { key: "client-upgrade-pro", label: "Upgrade Sample to Pro", description: "Set the sample Radar client plan to Radar Pro" },
  { key: "client-downgrade-live", label: "Downgrade Sample to Live", description: "Set the sample Radar client plan back to Radar Live" },
  { key: "client-suspend", label: "Suspend Sample Client", description: "Mark the sample Radar client as suspended" },
];

const DELIVERY_ACTIONS: ActionDef[] = [
  { key: "delivery-sample-discord", label: "Create Sample Discord Destination", description: "Seed a sample Discord webhook destination (dev)" },
  { key: "delivery-sample-telegram", label: "Create Sample Telegram Destination", description: "Seed a sample Telegram destination (dev)" },
  { key: "delivery-sample-webhook", label: "Create Sample Webhook Destination", description: "Seed a sample generic webhook destination (dev)" },
  { key: "deliver-pending", label: "Deliver Pending Matches", description: "Attempt delivery for all pending watchlist matches" },
];

const ORACLE_GROUPS: ActionGroup[] = [
  { label: "Readiness", actions: READINESS_ACTIONS },
  { label: "Monitoring", actions: MONITOR_ORACLE },
  { label: "Daily Brief", actions: ORACLE_BRIEF_ACTIONS },
  { label: "Public Preview", actions: PUBLIC_PREVIEW_ACTIONS },
  { label: "Distribution", actions: DISTRIBUTION_ACTIONS },
];

const BRIDGE_GROUPS: ActionGroup[] = [
  { label: "Readiness", actions: READINESS_ACTIONS },
  { label: "Monitoring", actions: MONITOR_BRIDGE },
  { label: "Daily Brief", actions: BRIDGE_BRIEF_ACTIONS },
  { label: "Public Preview", actions: PUBLIC_PREVIEW_ACTIONS },
  { label: "Distribution", actions: DISTRIBUTION_ACTIONS },
];

const LP_COVERAGE_ACTIONS: ActionDef[] = [
  { key: "lp-coverage", label: "LP Coverage Registry", description: "LP Radar coverage and doctrine registry: pool list, doctrine thresholds, and status summary." },
];

const LP_MONITOR_ACTIONS: ActionDef[] = [
  { key: "lp-smoke", label: "Run LP Smoke", description: "Live read all LP pools across Uniswap v3, Aerodrome, and Curve. No alerts created, no notifications sent." },
  { key: "lp-uniswap-v3-monitor", label: "Run LP Monitor", description: "Live read Uniswap v3 ETH/USDC pools and create/resolve LP alerts. No notifications sent." },
  { key: "lp-fresh-preview", label: "LP Fresh Preview", description: "Internal: run a live LP monitor pass, recompute LP signal quality and policy, and preview what LP Radar would publish in a future LP daily brief. No broadcast, no notifications." },
];

const LP_GROUPS: ActionGroup[] = [
  { label: "Readiness", actions: READINESS_ACTIONS },
  { label: "LP Coverage", actions: LP_COVERAGE_ACTIONS },
  { label: "LP Monitor", actions: LP_MONITOR_ACTIONS },
  { label: "Public Preview", actions: PUBLIC_PREVIEW_ACTIONS },
];

const UNIFIED_RADAR_GROUPS: ActionGroup[] = [
  { label: "Readiness", actions: READINESS_ACTIONS },
  { label: "Oracle", actions: [...MONITOR_ORACLE, ...ORACLE_BRIEF_ACTIONS] },
  { label: "Bridge", actions: [...MONITOR_BRIDGE, ...BRIDGE_BRIEF_ACTIONS] },
  { label: "LP", actions: [...LP_COVERAGE_ACTIONS, ...LP_MONITOR_ACTIONS] },
  { label: "Public Preview", actions: PUBLIC_PREVIEW_ACTIONS },
  { label: "Distribution", actions: DISTRIBUTION_ACTIONS },
];

const SERVICE_GROUPS: ActionGroup[] = [
  { label: "Clients", actions: CLIENT_ACTIONS },
  { label: "Watchlists", actions: WATCHLIST_ACTIONS },
  { label: "Live Delivery", actions: DELIVERY_ACTIONS },
];

function getSessionToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("sce_session_token");
}

function extractPreviewPosts(data: unknown): string[] {
  if (!data || typeof data !== "object") return [];
  const d = data as Record<string, unknown>;
  if ("posts" in d && Array.isArray(d.posts)) {
    return (d.posts as Array<{ content?: unknown }>).map((post) => String(post.content ?? "")).filter(Boolean);
  }
  if ("preview" in d && typeof d.preview === "object" && d.preview !== null) {
    const preview = d.preview as Record<string, unknown>;
    if (Array.isArray(preview.posts)) {
      return (preview.posts as Array<{ content?: unknown }>).map((post) => String(post.content ?? "")).filter(Boolean);
    }
  }
  return [];
}

function previewPostClass(post: Record<string, unknown>): "alert" | "warning" | "watch" | "coverage" | "diagnostic" | "summary" | "footer" {
  const header = String(post.text ?? "").split("\n")[0]?.trim().toLowerCase() ?? "";
  const signalType = String(post.signalType ?? "");
  const severity = String(post.severity ?? "");
  if (signalType === "summary") return "summary";
  if (signalType === "footer") return "footer";
  if (severity === "critical") return "alert";
  if (severity === "warning") return "warning";
  if (header.includes("watch")) return "watch";
  if (header.includes("coverage")) return "coverage";
  return "summary";
}

function diagnosticCount(excludedReasons: Array<Record<string, unknown>>): number {
  return excludedReasons
    .filter((reason) => {
      const code = String(reason.code ?? "");
      return code === "read_error_diagnostic" || code === "missing_source_diagnostic";
    })
    .reduce((sum, reason) => sum + Number(reason.count ?? 0), 0);
}

function humanizeStatus(value: string): string {
  return value.replace(/[_-]/g, " ").replace(/\b\w/g, (char) => char.toUpperCase()) || "Unknown";
}

function humanizeFreshness(value: string): string {
  if (value === "not_checked") return "Not checked";
  if (value === "read_failed") return "Read failed";
  return humanizeStatus(value);
}

function formatAge(value: unknown): string {
  const num = typeof value === "number" ? value : typeof value === "string" && value ? Number(value) : NaN;
  if (!Number.isFinite(num)) return "n/a";
  if (num < 60) return `${num}s`;
  const minutes = Math.floor(num / 60);
  const seconds = num % 60;
  if (minutes < 60) return `${minutes}m ${seconds}s`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m`;
}

function formatDateTime(value: unknown): string {
  if (typeof value !== "string" || !value) return "Never";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Never";
  return date.toLocaleString();
}

function formatDisplayValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "n/a";
  return String(value);
}

function formatDoctrineClass(value: unknown): string {
  if (value === "stablecoin_dependency") return "Stablecoin";
  if (value === "commodity_backed_dependency") return "Commodity-backed";
  if (value === "volatile_reference") return "Volatile reference";
  return "n/a";
}

function formatDoctrineThresholdSource(value: unknown): string {
  if (value === "default") return "Default doctrine";
  if (value === "custom_override") return "Custom override";
  return "n/a";
}

function normalizeLevel(value: string): ActionLevel {
  if (value === "error") return "error";
  if (value === "warning") return "warning";
  return "success";
}

function summaryItem(label: string, value: unknown): SummaryItem {
  return { label, value: String(value ?? "") || "n/a" };
}

function composeThreadText(posts: string[]): string {
  return posts.filter(Boolean).join("\n\n");
}

function buildPreviewApprovalContext(
  preview: Record<string, unknown>,
  posts: string[],
): PreviewApprovalContext | undefined {
  const previewHash = typeof preview.previewHash === "string" ? preview.previewHash : "";
  const threadHash = typeof preview.threadHash === "string" ? preview.threadHash : previewHash;
  if (!previewHash) return undefined;
  return {
    previewHash,
    threadHash,
    postCount: Number(preview.postCount ?? posts.length ?? 0),
    copyText: composeThreadText(posts),
    approvalStatus: String(preview.approvalStatus ?? "not_approved"),
    approvalId: typeof preview.approvalId === "string" ? preview.approvalId : null,
    approvedAt: typeof preview.approvedAt === "string" ? preview.approvedAt : null,
    expiresAt: typeof preview.expiresAt === "string" ? preview.expiresAt : null,
    previewChanged: Boolean(preview.previewChanged),
  };
}

function chainlinkEvidence(row: Record<string, unknown>): Record<string, unknown> {
  const evidence = row.evidence;
  return evidence && typeof evidence === "object" ? evidence as Record<string, unknown> : {};
}

function buildActionResult(action: ActionDef, data: unknown): ActionResult {
  const d = data && typeof data === "object" ? (data as Record<string, unknown>) : {};

  if ("action" in d && "objectResults" in d) {
    const objectResults = Array.isArray(d.objectResults) ? d.objectResults as Array<Record<string, unknown>> : [];
    return {
      action: action.label,
      level: normalizeLevel(String(d.status ?? "warning")),
      message: String(d.message ?? "Smoke check completed."),
      summary: [
        summaryItem("Objects Checked", d.objectsChecked ?? 0),
        summaryItem("Objects Succeeded", d.objectsSucceeded ?? 0),
        summaryItem("Objects Skipped", d.objectsSkipped ?? 0),
        summaryItem("Objects Failed", d.objectsFailed ?? 0),
        summaryItem("Alerts Created", d.alertsCreated ?? 0),
        summaryItem("Alerts Updated", d.alertsUpdated ?? 0),
        summaryItem("Alerts Resolved", d.alertsResolved ?? 0),
        summaryItem("Latest Error", d.latestError ?? "None"),
      ],
      rows: objectResults.map((row) => ({
        title: `${String(row.pair ?? row.route ?? row.objectId ?? "Object")} ${String(row.chain ? `on ${row.chain}` : "")}`.trim(),
        fields: (() => {
          const be = row.bridgeEvidence && typeof row.bridgeEvidence === "object" ? row.bridgeEvidence as Record<string, unknown> : null;
          if (be) {
            return [
              summaryItem("Object ID", row.objectId ?? ""),
              summaryItem("Source", row.source ?? ""),
              summaryItem("Route", be.routeName ?? row.route ?? "n/a"),
              summaryItem("Asset", be.asset ?? "n/a"),
              summaryItem("Enabled", row.enabled ? "Yes" : "No"),
              summaryItem("Status", humanizeStatus(String(row.status ?? ""))),
              summaryItem("Freshness", humanizeFreshness(String(row.freshnessStatus ?? "not_checked"))),
              summaryItem("Observed Latency", formatAge(be.observedLatencySeconds)),
              summaryItem("Expected Settlement", formatAge(be.expectedSettlementSeconds)),
              summaryItem("Pending Messages", be.pendingMessageCount ?? "n/a"),
              summaryItem("Max Pending Age", formatAge(be.maxPendingAgeSeconds)),
              summaryItem("Latest Observed At", formatDateTime(be.latestObservedAt)),
              summaryItem("Latest Completed At", formatDateTime(be.latestCompletedAt)),
              summaryItem("Status Source", be.statusSource ?? "n/a"),
              summaryItem("Provenance", be.provenance ?? "n/a"),
              summaryItem("Last Checked", formatDateTime(row.lastCheckedAt)),
              summaryItem("Last Success", formatDateTime(row.lastSuccessAt)),
              summaryItem("Last Error", row.lastError ?? "None"),
              summaryItem("Next Action", row.nextAction ?? ""),
            ];
          }
          const evidence = chainlinkEvidence(row);
          return [
          summaryItem("Object ID", row.objectId ?? ""),
          summaryItem("Source", row.source ?? ""),
          summaryItem("Purpose", row.purpose ? humanizeStatus(String(row.purpose)) : "n/a"),
          summaryItem("Pair", row.pair ?? "n/a"),
          summaryItem("Chain", row.chain ?? "n/a"),
          summaryItem("Enabled", row.enabled ? "Yes" : "No"),
          summaryItem("Status", humanizeStatus(String(row.status ?? ""))),
          summaryItem("Freshness", humanizeFreshness(String(row.freshnessStatus ?? "not_checked"))),
          summaryItem("Doctrine Class", formatDoctrineClass(row.doctrineClass)),
          summaryItem("Doctrine Mode", formatDoctrineThresholdSource(row.doctrineThresholdSource)),
          summaryItem("Feed Age", formatAge(row.feedAgeSeconds)),
          summaryItem("Price", evidence.normalizedPrice ?? "n/a"),
          summaryItem("Round ID", evidence.roundId ?? "n/a"),
          summaryItem("Updated At", formatDateTime(evidence.updatedAt)),
          summaryItem("Decimals", evidence.decimals ?? "n/a"),
          summaryItem("Last Checked", formatDateTime(row.lastCheckedAt)),
          summaryItem("Last Success", formatDateTime(row.lastSuccessAt)),
          summaryItem("Last Error", row.lastError ?? "None"),
          summaryItem("Next Action", row.nextAction ?? ""),
          ];
        })(),
      })),
      errors: Array.isArray(d.errors) ? d.errors.map((item) => String(item)) : [],
      previewPosts: extractPreviewPosts(data),
      timestamp: new Date().toLocaleTimeString(),
    };
  }

  if ("feedsChecked" in d) {
    const feedResults = Array.isArray(d.feedResults) ? d.feedResults as Array<Record<string, unknown>> : [];
    const errors = Array.isArray(d.errors)
      ? d.errors.map((item) => typeof item === "object" && item !== null && "message" in item ? String((item as Record<string, unknown>).message) : String(item))
      : [];
    const checked = Number(d.feedsChecked ?? 0);
    const level: ActionLevel = checked > 0 && errors.length === 0
      ? "success"
      : checked === 0 || feedResults.every((row) => String(row.status ?? "") === "skipped")
        ? "warning"
        : "warning";
    return {
      action: action.label,
      level,
      message: level === "success"
        ? Number(d.alertsCreated ?? 0) > 0
          ? "Chainlink monitor completed and created or updated live alert state."
          : "Chainlink monitor completed successfully. Fresh feeds required no alert."
        : errors[0] ?? "Chainlink monitor completed with warnings.",
      summary: [
        summaryItem("Feeds Checked", checked),
        summaryItem("Alerts Created", d.alertsCreated ?? 0),
        summaryItem("Alerts Updated", d.alertsUpdated ?? 0),
        summaryItem("Alerts Resolved", d.alertsResolved ?? 0),
        summaryItem("Errors", errors.length),
      ],
      rows: feedResults.map((row) => ({
        title: `${String(row.pair ?? "Feed")} on ${String(row.chain ?? "Unknown")}`,
        fields: (() => {
          const evidence = chainlinkEvidence(row);
          return [
          summaryItem("Feed ID", row.feedId ?? ""),
          summaryItem("Asset", row.asset ?? ""),
          summaryItem("Pair", row.pair ?? ""),
          summaryItem("Chain", row.chain ?? ""),
          summaryItem("Status", humanizeStatus(String(row.status ?? ""))),
          summaryItem("Freshness Level", row.freshnessLevel ? humanizeFreshness(String(row.freshnessLevel)) : "n/a"),
          summaryItem("Doctrine Class", formatDoctrineClass(row.doctrineClass)),
          summaryItem("Doctrine Mode", formatDoctrineThresholdSource(row.doctrineThresholdSource)),
          summaryItem("Feed Age", formatAge(row.ageSeconds)),
          summaryItem("Price", evidence.normalizedPrice ?? "n/a"),
          summaryItem("Round ID", evidence.roundId ?? "n/a"),
          summaryItem("Updated At", formatDateTime(evidence.updatedAt)),
          summaryItem("Decimals", evidence.decimals ?? "n/a"),
          summaryItem("Expected Heartbeat", formatAge(row.expectedHeartbeatSeconds)),
          summaryItem("Watch After", formatAge(row.watchAfterSeconds)),
          summaryItem("Warning After", formatAge(row.warningAfterSeconds)),
          summaryItem("Critical After", formatAge(row.criticalAfterSeconds)),
          summaryItem("Alert ID", row.alertId ?? "None"),
          summaryItem("Last Error", row.error ?? "None"),
          ];
        })(),
      })),
      errors,
      previewPosts: extractPreviewPosts(data),
      timestamp: new Date().toLocaleTimeString(),
    };
  }

  if ("groupsChecked" in d) {
    const groupResults = Array.isArray(d.groupResults) ? d.groupResults as Array<Record<string, unknown>> : [];
    const comparisonResults = Array.isArray(d.comparisonResults) ? d.comparisonResults as Array<Record<string, unknown>> : [];
    const errors = Array.isArray(d.errors)
      ? d.errors.map((item) => typeof item === "object" && item !== null && "message" in item ? String((item as Record<string, unknown>).message) : String(item))
      : [];
    const comparisonsMade = Number(d.comparisonsMade ?? 0);
    const skippedComparisons = Number(d.skippedComparisons ?? 0);
    const alertsCreated = Number(d.alertsCreated ?? 0);
    const alertsUpdated = Number(d.alertsUpdated ?? 0);
    const alertsResolved = Number(d.alertsResolved ?? 0);
    const hasComparisonWarnings = comparisonResults.some((row) => {
      const status = String(row.status ?? "");
      return status === "warning" || status === "critical" || status === "skipped" || status === "error";
    });
    const level: ActionLevel = errors.length > 0
      ? "warning"
      : comparisonsMade > 0 && !hasComparisonWarnings
        ? "success"
        : "warning";
    const rows = comparisonResults.length > 0
      ? comparisonResults.map((row) => ({
          title: `${String(row.pair ?? "Reference Check")} on ${String(row.chain ?? "Unknown")}`,
          fields: [
            summaryItem("Group ID", row.groupId ?? ""),
            summaryItem("Primary", row.primarySource ?? "chainlink"),
            summaryItem("Reference", row.referenceSource ?? "pyth"),
            summaryItem("Status", humanizeStatus(String(row.status ?? ""))),
            summaryItem("Severity", row.severity ? humanizeStatus(String(row.severity)) : "n/a"),
            summaryItem("Chainlink Price", formatDisplayValue(row.primaryPrice)),
            summaryItem("Pyth Price", formatDisplayValue(row.referencePrice)),
            summaryItem("Deviation", row.deviationBps !== undefined ? `${String(row.deviationBps)} bps` : "n/a"),
            summaryItem("Threshold", row.thresholdBps !== undefined ? `${String(row.thresholdBps)} bps` : "n/a"),
            summaryItem("Critical", row.criticalThresholdBps !== undefined ? `${String(row.criticalThresholdBps)} bps` : "n/a"),
            summaryItem("Alert Action", row.alertAction ? humanizeStatus(String(row.alertAction)) : "none"),
            summaryItem("Alert ID", row.alertId ?? "None"),
            summaryItem("Reason", row.reason ?? "None"),
          ],
        }))
      : groupResults.map((row) => ({
          title: `${String(row.asset ?? "")} ${String(row.pair ?? "")}`.trim() || "Reference Group",
          fields: [
            summaryItem("Group ID", row.groupId ?? ""),
            summaryItem("Status", humanizeStatus(String(row.status ?? ""))),
            summaryItem("Sources Checked", row.sourcesChecked ?? 0),
            summaryItem("Successful Sources", row.successfulSources ?? 0),
            summaryItem("Deviation", row.deviationBps !== undefined ? `${String(row.deviationBps)} bps` : "n/a"),
            summaryItem("Alert ID", row.alertId ?? "None"),
            summaryItem("Last Error", row.error ?? "None"),
          ],
        }));
    return {
      action: action.label,
      level,
      message: errors[0]
        ?? (alertsCreated + alertsUpdated > 0
          ? "Reference check detected a material Chainlink vs Pyth deviation and updated alert state."
          : alertsResolved > 0
            ? "Reference check returned within threshold and resolved the active alert."
            : comparisonsMade > 0 && skippedComparisons === 0
              ? "Oracle reference check passed. Chainlink remained aligned with Pyth."
              : "Oracle reference check completed with skipped or incomplete comparisons."),
      summary: [
        summaryItem("Groups Checked", d.groupsChecked ?? 0),
        summaryItem("Sources Checked", d.sourcesChecked ?? 0),
        summaryItem("Comparisons Made", comparisonsMade),
        summaryItem("Skipped Comparisons", skippedComparisons),
        summaryItem("Alerts Created", alertsCreated),
        summaryItem("Alerts Updated", alertsUpdated),
        summaryItem("Alerts Resolved", alertsResolved),
        summaryItem("Errors", errors.length),
      ],
      rows,
      errors,
      previewPosts: extractPreviewPosts(data),
      timestamp: new Date().toLocaleTimeString(),
    };
  }

  if ("highestQualityScore" in d && "signals" in d) {
    const signals = Array.isArray(d.signals) ? d.signals as Array<Record<string, unknown>> : [];
    const level: ActionLevel = Number(d.broadcastCandidates ?? 0) > 0 ? "success" : Number(d.totalSignals ?? 0) > 0 ? "warning" : "warning";
    return {
      action: action.label,
      level,
      message: Number(d.broadcastCandidates ?? 0) > 0
        ? "Signal quality recompute completed. Broadcast candidates are ready for operator review."
        : "Signal quality recompute completed. No oracle signals currently meet the broadcast gate.",
      summary: [
        summaryItem("Signals Scored", d.totalSignals ?? 0),
        summaryItem("Broadcast Candidates", d.broadcastCandidates ?? 0),
        summaryItem("Internal Only", d.internalOnlySignals ?? 0),
        summaryItem("Suppressed", d.suppressedSignals ?? 0),
        summaryItem("Highest Score", `${String(d.highestQualityScore ?? 0)}/100`),
        summaryItem("Top Candidate", (d.topCandidate as Record<string, unknown> | undefined)?.alertId ?? "None"),
      ],
      rows: signals.slice(0, 6).map((signal) => ({
        title: `${String(signal.reasonCode ?? "Signal")} - ${humanizeStatus(String(signal.broadcastTier ?? "none"))}`,
        fields: [
          summaryItem("Alert ID", signal.alertId ?? ""),
          summaryItem("Purpose", signal.objectPurpose ? humanizeStatus(String(signal.objectPurpose)) : "n/a"),
          summaryItem("Severity", humanizeStatus(String(signal.severity ?? ""))),
          summaryItem("Eligible", signal.broadcastEligible ? "Yes" : "No"),
          summaryItem("Tier", humanizeStatus(String(signal.broadcastTier ?? ""))),
          summaryItem("Score", `${String(signal.qualityScore ?? 0)}/100`),
          summaryItem("Evidence Score", String(signal.evidenceScore ?? 0)),
          summaryItem("Suppression", signal.suppressionReason ?? "None"),
          summaryItem("Explanation", signal.explanation ?? ""),
        ],
      })),
      errors: [],
      previewPosts: [],
      timestamp: new Date().toLocaleTimeString(),
    };
  }

  if ("readinessStatus" in d && "deliveryDryRunStatus" in d) {
    const issues = Array.isArray(d.issues) ? d.issues as Array<Record<string, unknown>> : [];
    const recommendations = Array.isArray(d.recommendations) ? d.recommendations.map((item) => String(item)) : [];
    const level: ActionLevel = d.status === "failed" ? "error" : d.status === "needs_attention" ? "warning" : "success";
    return {
      action: action.label,
      level,
      message: d.status === "passed"
        ? "Oracle pilot drill passed. Manual monitoring, briefing, watchlist, and delivery-readiness flow is commercially ready."
        : d.status === "failed"
          ? "Oracle pilot drill failed. Critical pilot-readiness gaps remain."
          : "Oracle pilot drill completed with follow-up items.",
      summary: [
        summaryItem("Status", humanizeStatus(String(d.status ?? ""))),
        summaryItem("Score", `${String(d.score ?? 0)}/100`),
        summaryItem("Live Checks", d.liveChecksRun ?? 0),
        summaryItem("Dependency Feeds", d.dependencyFeedsChecked ?? 0),
        summaryItem("Dependency Alerts", d.activeDependencyAlerts ?? 0),
        summaryItem("Reference Checks", d.referenceChecksRun ?? 0),
        summaryItem("Reference Skipped", d.referenceChecksSkipped ?? 0),
        summaryItem("Readiness", `${String(d.readinessStatus ?? "")} / ${String(d.readinessScore ?? 0)}`),
        summaryItem("Daily Brief", d.dailyBriefStatus ?? "n/a"),
        summaryItem("Matches Created", d.watchlistMatchesCreated ?? 0),
        summaryItem("Delivery Ready", d.deliveryReady ? "Yes" : "No"),
        summaryItem("Delivery Dry Run", d.deliveryDryRunStatus ?? "n/a"),
      ],
      rows: [
        {
          title: "Pilot Drill Summary",
          fields: [
            summaryItem("Generated At", formatDateTime(d.generatedAt)),
            summaryItem("Passed", d.passed ? "Yes" : "No"),
            summaryItem("Needs Attention", d.needsAttention ? "Yes" : "No"),
            summaryItem("Failed", d.failed ? "Yes" : "No"),
            summaryItem("Issues", issues.length),
            summaryItem("Recommendations", recommendations.length),
          ],
        },
        ...issues.slice(0, 4).map((issue, index) => ({
          title: `Issue ${index + 1}`,
          fields: [
            summaryItem("Severity", humanizeStatus(String(issue.severity ?? ""))),
            summaryItem("Code", issue.code ?? ""),
            summaryItem("Title", issue.title ?? ""),
            summaryItem("Detail", issue.detail ?? ""),
            summaryItem("Next Action", issue.nextAction ?? ""),
          ],
        })),
      ],
      errors: [],
      previewPosts: [],
      timestamp: new Date().toLocaleTimeString(),
    };
  }

  if ("baseUrlConfigured" in d && "apiKeyConfigured" in d && "routesTested" in d) {
    // CCTP Circle API verify result (cctp_status_source.run_cctp_circle_verify)
    const routeResults = Array.isArray(d.routeResults) ? d.routeResults as Array<Record<string, unknown>> : [];
    const warnings = Array.isArray(d.warnings) ? d.warnings.map((w) => String(w)) : [];
    const recommendations = Array.isArray(d.recommendations) ? d.recommendations.map((r) => String(r)) : [];
    const missingFields = Array.isArray(d.missingRequiredFields) ? d.missingRequiredFields.map((f) => String(f)) : [];
    const sampleFields = Array.isArray(d.sampleFieldsDetected) ? d.sampleFieldsDetected.map((f) => String(f)) : [];
    const normalizedFields = Array.isArray(d.normalizedFieldsAvailable) ? d.normalizedFieldsAvailable.map((f) => String(f)) : [];
    const verifyStatus = String(d.status ?? "");
    const level: ActionLevel = verifyStatus === "ready" ? "success" : verifyStatus === "needs_configuration" ? "warning" : "error";
    return {
      action: action.label,
      level,
      message: verifyStatus === "ready"
        ? "Circle CCTP API is configured and adapter can normalize the response shape."
        : verifyStatus === "needs_configuration"
          ? "Circle CCTP API is not fully configured. Review required fields."
          : verifyStatus === "request_failed"
            ? "Circle CCTP API request failed. Check connectivity and base URL."
            : verifyStatus === "response_unrecognized"
              ? "Circle API response shape was not recognized by the adapter."
              : "Circle API response could not be parsed.",
      summary: [
        summaryItem("Status", humanizeStatus(verifyStatus)),
        summaryItem("Source Mode", String(d.sourceMode ?? "")),
        summaryItem("API Version", String(d.apiVersion ?? "")),
        summaryItem("Base URL Configured", d.baseUrlConfigured ? "Yes" : "No"),
        summaryItem("API Key Configured", d.apiKeyConfigured ? "Yes" : "No"),
        summaryItem("Routes Tested", d.routesTested ?? 0),
        summaryItem("Routes Parseable", d.routesParseable ?? 0),
        summaryItem("Fields Detected", sampleFields.join(", ") || "None"),
        summaryItem("Missing Fields", missingFields.join(", ") || "None"),
        summaryItem("Sanitized Error", d.sanitizedError ? String(d.sanitizedError) : "None"),
        summaryItem("Next Action", String(d.nextAction ?? "")),
      ],
      rows: [
        ...(warnings.length > 0 || recommendations.length > 0 ? [{
          title: "Diagnostics",
          fields: [
            ...warnings.map((w, i) => summaryItem(`Warning ${i + 1}`, w)),
            ...recommendations.map((r, i) => summaryItem(`Recommendation ${i + 1}`, r)),
          ],
        }] : []),
        ...routeResults.map((row) => ({
          title: String(row.routeId ?? "Route"),
          fields: [
            summaryItem("Parseable", row.parseable ? "Yes" : "No"),
            summaryItem("Status", humanizeStatus(String(row.status ?? ""))),
            summaryItem("Domain Src", row.domainSrc != null ? String(row.domainSrc) : "n/a"),
            summaryItem("Domain Dst", row.domainDst != null ? String(row.domainDst) : "n/a"),
            summaryItem("Latest Observed Msg", row.latestObservedMessageId ? String(row.latestObservedMessageId) : "None"),
            summaryItem("Pending Messages", row.pendingMessageCount ?? 0),
          ],
        })),
        ...(normalizedFields.length > 0 ? [{
          title: "Normalized Fields Available",
          fields: normalizedFields.map((f) => summaryItem("Field", f)),
        }] : []),
      ],
      errors: missingFields,
      previewPosts: [],
      timestamp: new Date().toLocaleTimeString(),
    };
  }

  if ("stepResults" in d && "oracleStatus" in d && "bridgeStatus" in d && "lpStatus" in d) {
    const stepResults = Array.isArray(d.stepResults) ? d.stepResults as Array<Record<string, unknown>> : [];
    const warnings = Array.isArray(d.warnings) ? d.warnings.map((item) => String(item)) : [];
    const recommendations = Array.isArray(d.recommendations) ? d.recommendations.map((item) => String(item)) : [];
    const unifiedPreview = d.unifiedPreview && typeof d.unifiedPreview === "object"
      ? d.unifiedPreview as Record<string, unknown>
      : null;
    const editorialPreview = d.editorialPreview && typeof d.editorialPreview === "object"
      ? d.editorialPreview as Record<string, unknown>
      : null;
    const threadPosts = unifiedPreview && Array.isArray(unifiedPreview.threadPosts)
      ? unifiedPreview.threadPosts as Array<Record<string, unknown>>
      : [];
    const editorialPosts = editorialPreview && Array.isArray(editorialPreview.posts)
      ? editorialPreview.posts as Array<Record<string, unknown>>
      : [];
    const displayPosts = editorialPosts.length > 0
      ? editorialPosts.map((post) => String(post.editedText ?? post.rawText ?? "")).filter(Boolean)
      : threadPosts.map((post) => String(post.text ?? "")).filter(Boolean);
    const deterministicSafetyChecks = unifiedPreview && Array.isArray(unifiedPreview.safetyChecks)
      ? unifiedPreview.safetyChecks as Array<Record<string, unknown>>
      : [];
    const editorialSafetyChecks = editorialPreview && Array.isArray(editorialPreview.safetyChecks)
      ? editorialPreview.safetyChecks as Array<Record<string, unknown>>
      : [];
    const blockedEdits = editorialPreview && Array.isArray(editorialPreview.blockedEdits)
      ? editorialPreview.blockedEdits.map((item) => String(item))
      : [];
    const postClasses = threadPosts.map((post) => previewPostClass(post));
    const alertCount = postClasses.filter((value) => value === "alert").length;
    const warningCount = postClasses.filter((value) => value === "warning").length;
    const watchCount = postClasses.filter((value) => value === "watch").length;
    const coverageCount = postClasses.filter((value) => value === "coverage").length;
    const previewStatus = String(d.status ?? "warning");

    const rows: ResultRow[] = [
      {
        title: "Fresh Preview Summary",
        fields: [
          summaryItem("Generated At", formatDateTime(d.generatedAt)),
          summaryItem("Status", humanizeStatus(previewStatus)),
          summaryItem("Mode", String(d.mode ?? "preview_only")),
          summaryItem("Public Broadcast", d.publicBroadcastEnabled ? "Yes" : "No"),
          summaryItem("Delivery Sent", d.deliverySent ? "Yes" : "No"),
          summaryItem("Operator Approval", d.operatorApprovalRequired ? "Required" : "Not required"),
          summaryItem("Oracle Status", humanizeStatus(String(d.oracleStatus ?? "error"))),
          summaryItem("Bridge Status", humanizeStatus(String(d.bridgeStatus ?? "error"))),
          summaryItem("LP Status", humanizeStatus(String(d.lpStatus ?? "error"))),
          summaryItem("Latest Error", String(d.latestError ?? "None")),
        ],
      },
      ...stepResults.map((step, index) => ({
        title: `Step ${index + 1} - ${humanizeStatus(String(step.step ?? "step"))}`,
        fields: [
          summaryItem("Status", humanizeStatus(String(step.status ?? "warning"))),
          summaryItem("Summary", String(step.summary ?? "")),
          summaryItem("Alerts Created", step.alertsCreated ?? 0),
          summaryItem("Alerts Updated", step.alertsUpdated ?? 0),
          summaryItem("Alerts Resolved", step.alertsResolved ?? 0),
          summaryItem("Signals Scored", step.signalsScored ?? 0),
          summaryItem("Latest Error", String(step.latestError ?? "None")),
        ],
      })),
    ];

    if (unifiedPreview) {
      const includedAlertIds = Array.isArray(unifiedPreview.includedAlertIds)
        ? unifiedPreview.includedAlertIds.map((id) => String(id))
        : [];
      const excludedReasons = Array.isArray(unifiedPreview.excludedReasons)
        ? unifiedPreview.excludedReasons as Array<Record<string, unknown>>
        : [];
      rows.push(
        {
          title: "Unified Deterministic Preview",
          fields: [
            summaryItem("Status", humanizeStatus(String(unifiedPreview.status ?? "no_candidates"))),
            summaryItem("Headline", String(unifiedPreview.headline ?? "SCE Radar Public Alert Preview")),
            summaryItem("Summary", String(unifiedPreview.summary ?? "n/a")),
            summaryItem("Providers", String(unifiedPreview.providerSummary ?? "n/a")),
            summaryItem("Risk", String(unifiedPreview.riskSummary ?? "n/a")),
            summaryItem("Total Signals", unifiedPreview.totalSignals ?? 0),
            summaryItem("Oracle Signals", unifiedPreview.oracleSignals ?? 0),
            summaryItem("Bridge Signals", unifiedPreview.bridgeSignals ?? 0),
            summaryItem("LP Signals", unifiedPreview.lpSignals ?? 0),
            summaryItem("Approval Status", humanizeStatus(String(unifiedPreview.approvalStatus ?? "not_approved"))),
            summaryItem("Approval ID", String(unifiedPreview.approvalId ?? "None")),
            summaryItem("Preview Hash", String(unifiedPreview.previewHash ?? "n/a")),
            summaryItem("Thread Hash", String(unifiedPreview.threadHash ?? "n/a")),
            summaryItem("Post Count", unifiedPreview.postCount ?? 0),
          ],
        },
        ...threadPosts.map((post) => ({
          title: `Deterministic Post ${String(post.index ?? "?")} - ${humanizeStatus(previewPostClass(post))}`,
          fields: [
            summaryItem("Severity", humanizeStatus(String(post.severity ?? "none"))),
            summaryItem("Character Count", post.characterCount ?? 0),
            summaryItem("Source Alerts", Array.isArray(post.sourceAlertIds) && post.sourceAlertIds.length > 0 ? (post.sourceAlertIds as string[]).join(", ") : "None"),
            summaryItem("Text", String(post.text ?? "")),
          ],
        })),
        ...(includedAlertIds.length > 0 ? [{
          title: "Included Alerts",
          fields: includedAlertIds.map((id, index) => summaryItem(`Alert ${index + 1}`, id)),
        }] : []),
        ...(excludedReasons.length > 0 ? [{
          title: "Excluded Reasons",
          fields: excludedReasons.map((reason) => summaryItem(
            `${String(reason.label ?? reason.code ?? "Reason")} (${String(reason.count ?? 0)})`,
            String(reason.detail ?? "Excluded from unified public preview."),
          )),
        }] : []),
        ...(diagnosticCount(excludedReasons) > 0 ? [{
          title: "Diagnostics",
          fields: [summaryItem("Internal Diagnostics", diagnosticCount(excludedReasons))],
        }] : []),
        ...(deterministicSafetyChecks.length > 0 ? [{
          title: "Deterministic Safety Checks",
          fields: deterministicSafetyChecks.map((check) => summaryItem(
            String(check.code ?? "check"),
            `${humanizeStatus(String(check.status ?? "pass"))}: ${String(check.detail ?? "")}`,
          )),
        }] : []),
      );
    }

    if (editorialPreview) {
      rows.push(
        {
          title: "LLM Editorial Preview",
          fields: [
            summaryItem("Status", humanizeStatus(String(editorialPreview.editorialStatus ?? "disabled"))),
            summaryItem("Enabled", editorialPreview.enabled ? "Yes" : "No"),
            summaryItem("Configured", editorialPreview.configured ? "Yes" : "No"),
            summaryItem("Provider", String(editorialPreview.provider ?? "openai")),
            summaryItem("Model", String(editorialPreview.model ?? "Not configured")),
            summaryItem("Operator Approval", editorialPreview.operatorApprovalRequired ? "Required" : "Not required"),
            summaryItem("Latest Error", String(editorialPreview.latestError ?? "None")),
          ],
        },
        ...editorialPosts.map((post) => ({
          title: `Editorial Post ${String(post.index ?? "?")} - ${humanizeStatus(String(post.signalType ?? "summary"))}`,
          fields: [
            summaryItem("Status", humanizeStatus(String(post.editorialStatus ?? "disabled"))),
            summaryItem("Class", humanizeStatus(String(post.publicSignalClass ?? "summary"))),
            summaryItem("Severity", humanizeStatus(String(post.severity ?? "none"))),
            summaryItem("Source Alerts", Array.isArray(post.sourceAlertIds) && post.sourceAlertIds.length > 0 ? (post.sourceAlertIds as string[]).join(", ") : "None"),
            summaryItem("Raw Text", String(post.rawText ?? "")),
            summaryItem("Edited Text", String(post.editedText ?? "")),
            summaryItem("Blocked Reason", String(post.blockedReason ?? "None")),
            summaryItem("Blocked Claims", Array.isArray(post.claimsBlocked) && post.claimsBlocked.length > 0 ? (post.claimsBlocked as string[]).join(", ") : "None"),
          ],
        })),
        ...(blockedEdits.length > 0 ? [{
          title: "Editorial Blocked Claims",
          fields: blockedEdits.map((reason, index) => summaryItem(`Blocked ${index + 1}`, reason)),
        }] : []),
        ...(editorialSafetyChecks.length > 0 ? [{
          title: "Editorial Safety Checks",
          fields: editorialSafetyChecks.map((check) => summaryItem(
            String(check.code ?? "check"),
            `${humanizeStatus(String(check.status ?? "pass"))}: ${String(check.detail ?? "")}`,
          )),
        }] : []),
      );
    }

    rows.push(
      ...(warnings.length > 0 ? [{
        title: "Warnings",
        fields: warnings.map((warning, index) => summaryItem(`Warning ${index + 1}`, warning)),
      }] : []),
      ...recommendations.map((recommendation, index) => ({
        title: `Recommendation ${index + 1}`,
        fields: [summaryItem("Action", recommendation)],
      })),
    );

    return {
      action: action.label,
      level: normalizeLevel(previewStatus),
      message: unifiedPreview
        ? String(unifiedPreview.headline ?? unifiedPreview.summary ?? "Fresh Radar public preview generated.")
        : "Fresh Radar public preview completed without a usable unified preview.",
      summary: [
        summaryItem("Status", humanizeStatus(previewStatus)),
        summaryItem("Oracle", humanizeStatus(String(d.oracleStatus ?? "error"))),
        summaryItem("Bridge", humanizeStatus(String(d.bridgeStatus ?? "error"))),
        summaryItem("LP", humanizeStatus(String(d.lpStatus ?? "error"))),
        summaryItem("Public Broadcast", d.publicBroadcastEnabled ? "Yes" : "No"),
        summaryItem("Delivery Sent", d.deliverySent ? "Yes" : "No"),
        summaryItem("Approval Required", d.operatorApprovalRequired ? "Yes" : "No"),
        summaryItem("Alerts", alertCount),
        summaryItem("Warnings", warningCount),
        summaryItem("Watches", watchCount),
        summaryItem("Coverage", coverageCount),
        summaryItem("Diagnostics", diagnosticCount(unifiedPreview && Array.isArray(unifiedPreview.excludedReasons) ? unifiedPreview.excludedReasons as Array<Record<string, unknown>> : [])),
        summaryItem("Unified Preview", unifiedPreview ? humanizeStatus(String(unifiedPreview.status ?? "ready")) : "Unavailable"),
        summaryItem("Editorial", editorialPreview ? humanizeStatus(String(editorialPreview.editorialStatus ?? "disabled")) : "Disabled"),
        summaryItem("Approval", unifiedPreview ? humanizeStatus(String(unifiedPreview.approvalStatus ?? "not_approved")) : "Not Approved"),
      ],
      rows,
      errors: previewStatus === "error" && d.latestError ? [String(d.latestError)] : [],
      previewPosts: displayPosts,
      approvalContext: unifiedPreview ? buildPreviewApprovalContext(unifiedPreview, displayPosts) : undefined,
      timestamp: new Date().toLocaleTimeString(),
    };
  }

  if ("threadPosts" in d && "oracleSignals" in d && "bridgeSignals" in d && "lpSignals" in d) {
    const excludedReasons = Array.isArray(d.excludedReasons) ? d.excludedReasons as Array<Record<string, unknown>> : [];
    const safetyChecks = Array.isArray(d.safetyChecks) ? d.safetyChecks as Array<Record<string, unknown>> : [];
    const threadPosts = Array.isArray(d.threadPosts) ? d.threadPosts as Array<Record<string, unknown>> : [];
    const recommendations = Array.isArray(d.recommendations) ? d.recommendations.map((r) => String(r)) : [];
    const includedAlertIds = Array.isArray(d.includedAlertIds) ? d.includedAlertIds.map((id) => String(id)) : [];
    const editorialPreview = d.editorialPreview && typeof d.editorialPreview === "object"
      ? d.editorialPreview as Record<string, unknown>
      : null;
    const editorialPosts = editorialPreview && Array.isArray(editorialPreview.posts)
      ? editorialPreview.posts as Array<Record<string, unknown>>
      : [];
    const displayPosts = (
      editorialPosts.length > 0
        ? editorialPosts.map((post) => String(post.editedText ?? post.rawText ?? "")).filter(Boolean)
        : threadPosts.map((post) => String(post.text ?? "")).filter(Boolean)
    );
    const editorialSafetyChecks = editorialPreview && Array.isArray(editorialPreview.safetyChecks)
      ? editorialPreview.safetyChecks as Array<Record<string, unknown>>
      : [];
    const blockedEdits = editorialPreview && Array.isArray(editorialPreview.blockedEdits)
      ? editorialPreview.blockedEdits.map((item) => String(item))
      : [];
    const postClasses = threadPosts.map((post) => previewPostClass(post));
    const alertCount = postClasses.filter((value) => value === "alert").length;
    const warningCount = postClasses.filter((value) => value === "warning").length;
    const watchCount = postClasses.filter((value) => value === "watch").length;
    const coverageCount = postClasses.filter((value) => value === "coverage").length;
    const diagnostics = diagnosticCount(excludedReasons);
    const previewStatus = String(d.status ?? "no_candidates");
    const level: ActionLevel = previewStatus === "error"
      ? "error"
      : previewStatus === "needs_attention" || previewStatus === "no_candidates"
        ? "warning"
        : "success";

    const rows: ResultRow[] = [
      {
        title: "Preview Summary",
        fields: [
          summaryItem("Headline", String(d.headline ?? "SCE Radar Public Alert Preview")),
          summaryItem("Summary", String(d.summary ?? "n/a")),
          summaryItem("Providers", String(d.providerSummary ?? "n/a")),
          summaryItem("Risk", String(d.riskSummary ?? "n/a")),
          summaryItem("Preview Only", "No public post sent"),
          summaryItem("Latest Error", String(d.latestError ?? "None")),
        ],
      },
      {
        title: "Deterministic Preview",
        fields: [
          summaryItem("Mode", String(d.mode ?? "preview_only")),
          summaryItem("Editorial Requested", d.editorialRequested ? "Yes" : "No"),
          summaryItem("Operator Approval", d.operatorApprovalRequired ? "Required" : "Not required"),
          summaryItem("Approval Status", humanizeStatus(String(d.approvalStatus ?? "not_approved"))),
          summaryItem("Approval ID", String(d.approvalId ?? "None")),
          summaryItem("Preview Hash", String(d.previewHash ?? "n/a")),
          summaryItem("Thread Hash", String(d.threadHash ?? "n/a")),
          summaryItem("Post Count", d.postCount ?? 0),
          summaryItem("Alerts", alertCount),
          summaryItem("Warnings", warningCount),
          summaryItem("Watches", watchCount),
          summaryItem("Coverage", coverageCount),
          summaryItem("Diagnostics", diagnostics),
        ],
      },
      ...threadPosts.map((post) => ({
        title: `Deterministic Post ${String(post.index ?? "?")} - ${humanizeStatus(previewPostClass(post))}`,
        fields: [
          summaryItem("Severity", humanizeStatus(String(post.severity ?? "none"))),
          summaryItem("Character Count", post.characterCount ?? 0),
          summaryItem("Source Alerts", Array.isArray(post.sourceAlertIds) && post.sourceAlertIds.length > 0 ? (post.sourceAlertIds as string[]).join(", ") : "None"),
          summaryItem("Text", String(post.text ?? "")),
        ],
      })),
      ...(editorialPreview ? [{
        title: "LLM Editorial Preview",
        fields: [
          summaryItem("Status", humanizeStatus(String(editorialPreview.editorialStatus ?? "disabled"))),
          summaryItem("Enabled", editorialPreview.enabled ? "Yes" : "No"),
          summaryItem("Configured", editorialPreview.configured ? "Yes" : "No"),
          summaryItem("Provider", String(editorialPreview.provider ?? "openai")),
          summaryItem("Model", String(editorialPreview.model ?? "Not configured")),
          summaryItem("Operator Approval", editorialPreview.operatorApprovalRequired ? "Required" : "Not required"),
          summaryItem("Latest Error", String(editorialPreview.latestError ?? "None")),
        ],
      }] : []),
      ...editorialPosts.map((post) => ({
        title: `Editorial Post ${String(post.index ?? "?")} - ${humanizeStatus(String(post.signalType ?? "summary"))}`,
        fields: [
          summaryItem("Status", humanizeStatus(String(post.editorialStatus ?? "disabled"))),
          summaryItem("Class", humanizeStatus(String(post.publicSignalClass ?? "summary"))),
          summaryItem("Severity", humanizeStatus(String(post.severity ?? "none"))),
          summaryItem("Source Alerts", Array.isArray(post.sourceAlertIds) && post.sourceAlertIds.length > 0 ? (post.sourceAlertIds as string[]).join(", ") : "None"),
          summaryItem("Raw Text", String(post.rawText ?? "")),
          summaryItem("Edited Text", String(post.editedText ?? "")),
          summaryItem("Blocked Reason", String(post.blockedReason ?? "None")),
          summaryItem("Blocked Claims", Array.isArray(post.claimsBlocked) && post.claimsBlocked.length > 0 ? (post.claimsBlocked as string[]).join(", ") : "None"),
          summaryItem("Allowed Claims", Array.isArray(post.claimsAllowed) && post.claimsAllowed.length > 0 ? (post.claimsAllowed as string[]).join(" | ") : "None"),
          summaryItem("Evidence Used", Array.isArray(post.evidenceUsed) && post.evidenceUsed.length > 0 ? (post.evidenceUsed as string[]).join(" | ") : "None"),
        ],
      })),
      ...(blockedEdits.length > 0 ? [{
        title: "Blocked Claims",
        fields: blockedEdits.map((reason, index) => summaryItem(`Blocked ${index + 1}`, reason)),
      }] : []),
      ...(includedAlertIds.length > 0 ? [{
        title: "Included Alerts",
        fields: includedAlertIds.map((id, index) => summaryItem(`Alert ${index + 1}`, id)),
      }] : []),
      ...(excludedReasons.length > 0 ? [{
        title: "Excluded Reasons",
        fields: excludedReasons.map((reason) => summaryItem(
          `${String(reason.label ?? reason.code ?? "Reason")} (${String(reason.count ?? 0)})`,
          String(reason.detail ?? "Excluded from unified public preview."),
        )),
      }] : []),
      ...(diagnostics > 0 ? [{
        title: "Diagnostics",
        fields: [summaryItem("Internal Diagnostics", diagnostics)],
      }] : []),
      ...(safetyChecks.length > 0 ? [{
        title: "Deterministic Safety Checks",
        fields: safetyChecks.map((check) => summaryItem(
          String(check.code ?? "check"),
          `${humanizeStatus(String(check.status ?? "pass"))}: ${String(check.detail ?? "")}`,
        )),
      }] : []),
      ...(editorialSafetyChecks.length > 0 ? [{
        title: "Editorial Safety Checks",
        fields: editorialSafetyChecks.map((check) => summaryItem(
          String(check.code ?? "check"),
          `${humanizeStatus(String(check.status ?? "pass"))}: ${String(check.detail ?? "")}`,
        )),
      }] : []),
      ...recommendations.map((rec, index) => ({
        title: `Recommendation ${index + 1}`,
        fields: [summaryItem("Action", rec)],
      })),
    ];

    return {
      action: action.label,
      level,
      message: String(d.headline ?? d.summary ?? "Unified public preview generated."),
      summary: [
        summaryItem("Status", humanizeStatus(previewStatus)),
        summaryItem("Total Signals", d.totalSignals ?? 0),
        summaryItem("Oracle Signals", d.oracleSignals ?? 0),
        summaryItem("Bridge Signals", d.bridgeSignals ?? 0),
        summaryItem("LP Signals", d.lpSignals ?? 0),
        summaryItem("Critical", d.criticalSignals ?? 0),
        summaryItem("Warning", d.warningSignals ?? 0),
        summaryItem("Watches", watchCount),
        summaryItem("Coverage", coverageCount),
        summaryItem("Diagnostics / Excluded", d.suppressedSignals ?? 0),
        summaryItem("Public Broadcast", d.publicBroadcastEnabled ? "Yes" : "No"),
        summaryItem("Mode", String(d.mode ?? "preview_only")),
        summaryItem("Editorial", editorialPreview ? humanizeStatus(String(editorialPreview.editorialStatus ?? "disabled")) : "Disabled"),
        summaryItem("Approval", humanizeStatus(String(d.approvalStatus ?? "not_approved"))),
      ],
      rows,
      errors: previewStatus === "error" && d.latestError ? [String(d.latestError)] : [],
      previewPosts: displayPosts,
      approvalContext: buildPreviewApprovalContext(d, displayPosts),
      timestamp: new Date().toLocaleTimeString(),
    };
  }

  if ("fullThreadText" in d && "previewHash" in d && "postCount" in d) {
    const posts = Array.isArray(d.posts) ? d.posts.map((post) => String(post)) : [];
    return {
      action: action.label,
      level: "success",
      message: "Full preview thread is ready to copy.",
      summary: [
        summaryItem("Approval Status", humanizeStatus(String(d.approvalStatus ?? "not_approved"))),
        summaryItem("Approval ID", String(d.approvalId ?? "None")),
        summaryItem("Preview Hash", String(d.previewHash ?? "n/a")),
        summaryItem("Thread Hash", String(d.threadHash ?? "n/a")),
        summaryItem("Post Count", d.postCount ?? 0),
        summaryItem("Delivery Allowed", d.deliveryAllowed ? "Yes" : "No"),
      ],
      rows: [
        {
          title: "Copy Full Thread",
          fields: [
            summaryItem("Full Thread Text", String(d.fullThreadText ?? "")),
          ],
        },
      ],
      errors: [],
      previewPosts: posts,
      approvalContext: buildPreviewApprovalContext(d, posts),
      timestamp: new Date().toLocaleTimeString(),
    };
  }

  if ("platformPreview" in d && "approved" in d && "previewHash" in d) {
    const platformPreview = d.platformPreview && typeof d.platformPreview === "object"
      ? d.platformPreview as Record<string, unknown>
      : {};
    const xThread = Array.isArray(platformPreview.xThread) ? platformPreview.xThread.map((post) => String(post)) : [];
    const discordMessages = Array.isArray(platformPreview.discordMessages) ? platformPreview.discordMessages.map((post) => String(post)) : [];
    const telegramMessages = Array.isArray(platformPreview.telegramMessages) ? platformPreview.telegramMessages.map((post) => String(post)) : [];
    const approved = Boolean(d.approved);
    return {
      action: action.label,
      level: approved ? "success" : "warning",
      message: approved
        ? "Approved preview dry run generated. No delivery occurred."
        : String(d.latestError ?? "Approval required before dry run."),
      summary: [
        summaryItem("Approved", approved ? "Yes" : "No"),
        summaryItem("Approval Required", d.approvalRequired ? "Yes" : "No"),
        summaryItem("Approval ID", String(d.approvalId ?? "None")),
        summaryItem("Preview Hash", String(d.previewHash ?? "n/a")),
        summaryItem("Thread Hash", String(d.threadHash ?? "n/a")),
        summaryItem("Post Count", d.postCount ?? 0),
        summaryItem("Delivery Sent", d.deliverySent ? "Yes" : "No"),
        summaryItem("Public Broadcast", d.publicBroadcastEnabled ? "Yes" : "No"),
      ],
      rows: [
        {
          title: "Dry Run Preview",
          fields: [
            summaryItem("Character Counts", Array.isArray(d.characterCounts) ? (d.characterCounts as number[]).join(", ") : "None"),
            summaryItem("X Thread", xThread.join(" | ") || "None"),
            summaryItem("Discord Messages", discordMessages.join(" | ") || "None"),
            summaryItem("Telegram Messages", telegramMessages.join(" | ") || "None"),
          ],
        },
      ],
      errors: approved ? [] : [String(d.latestError ?? "Approval required before dry run.")],
      previewPosts: xThread,
      approvalContext: buildPreviewApprovalContext(d, xThread),
      timestamp: new Date().toLocaleTimeString(),
    };
  }

  if ("deliveryResults" in d && "channelsRequested" in d && "deliveryId" in d) {
    const deliveryResults = Array.isArray(d.deliveryResults) ? d.deliveryResults as Array<Record<string, unknown>> : [];
    const channelsRequested = Array.isArray(d.channelsRequested) ? d.channelsRequested.map((channel) => String(channel)) : [];
    const channelsSent = Array.isArray(d.channelsSent) ? d.channelsSent.map((channel) => String(channel)) : [];
    const channelsFailed = Array.isArray(d.channelsFailed) ? d.channelsFailed.map((channel) => String(channel)) : [];
    const status = String(d.status ?? "blocked");
    const level: ActionLevel =
      status === "sent" ? "success" : status === "dry_run" || status === "partial" || status === "blocked" ? "warning" : "error";

    return {
      action: action.label,
      level,
      message:
        status === "dry_run"
          ? "Approved Radar public thread dry run completed. No public post was sent."
          : status === "sent"
            ? "Approved Radar public thread sent to the requested channels."
            : status === "partial"
              ? "Approved Radar public thread sent to some requested channels."
              : String(d.latestError ?? "Approved Radar public thread delivery was blocked or failed."),
      summary: [
        summaryItem("Status", humanizeStatus(status)),
        summaryItem("Delivery ID", String(d.deliveryId ?? "n/a")),
        summaryItem("Approval ID", String(d.approvalId ?? "n/a")),
        summaryItem("Preview Hash", String(d.previewHash ?? "n/a")),
        summaryItem("Thread Hash", String(d.threadHash ?? "n/a")),
        summaryItem("Post Count", d.postCount ?? 0),
        summaryItem("Dry Run", d.dryRun ? "Yes" : "No"),
        summaryItem("Channels Requested", channelsRequested.join(", ") || "None"),
        summaryItem("Channels Sent", channelsSent.join(", ") || "None"),
        summaryItem("Channels Failed", channelsFailed.join(", ") || "None"),
        summaryItem("Public Broadcast", d.publicBroadcastEnabled ? "Yes" : "No"),
        summaryItem("Operator Approval Required", d.operatorApprovalRequired ? "Yes" : "No"),
      ],
      rows: deliveryResults.map((result) => ({
        title: `${humanizeStatus(String(result.channel ?? "channel"))} Delivery`,
        fields: [
          summaryItem("Status", humanizeStatus(String(result.status ?? "blocked"))),
          summaryItem("Enabled", result.enabled ? "Yes" : "No"),
          summaryItem("Configured", result.configured ? "Yes" : "No"),
          summaryItem("Message Count", result.messageCount ?? 0),
          summaryItem("External IDs", Array.isArray(result.externalIds) ? (result.externalIds as string[]).join(", ") || "None" : "None"),
          summaryItem("Sanitized Error", String(result.sanitizedError ?? "None")),
        ],
      })),
      errors: [],
      previewPosts: [],
      timestamp: new Date().toLocaleTimeString(),
    };
  }

  if ("previewHash" in d && "deliveryAllowed" in d && "operatorApprovalRequired" in d && !("threadPosts" in d) && !("platformPreview" in d) && !("fullThreadText" in d)) {
    return {
      action: action.label,
      level: String(d.status ?? "not_approved") === "approved" ? "success" : String(d.status ?? "not_approved") === "expired" ? "warning" : "success",
      message: String(d.previewChanged)
        ? "Preview changed after approval. Re-approval is required."
        : `Preview approval status: ${humanizeStatus(String(d.status ?? "not_approved"))}.`,
      summary: [
        summaryItem("Approval Status", humanizeStatus(String(d.status ?? "not_approved"))),
        summaryItem("Approval ID", String(d.approvalId ?? "None")),
        summaryItem("Approved At", formatDateTime(d.approvedAt)),
        summaryItem("Approved By", String(d.approvedBy ?? "n/a")),
        summaryItem("Expires At", formatDateTime(d.expiresAt)),
        summaryItem("Preview Hash", String(d.previewHash ?? "n/a")),
        summaryItem("Thread Hash", String(d.threadHash ?? "n/a")),
        summaryItem("Post Count", d.postCount ?? 0),
        summaryItem("Preview Changed", d.previewChanged ? "Yes" : "No"),
        summaryItem("Delivery Allowed", d.deliveryAllowed ? "Yes" : "No"),
      ],
      rows: [
        {
          title: "Approval State",
          fields: [
            summaryItem("Deterministic Hash", String(d.deterministicHash ?? "n/a")),
            summaryItem("Editorial Hash", String(d.editorialHash ?? "n/a")),
            summaryItem("Approval Note", String(d.approvalNote ?? "None")),
            summaryItem("Operator Approval Required", d.operatorApprovalRequired ? "Yes" : "No"),
          ],
        },
      ],
      errors: [],
      previewPosts: [],
      approvalContext: buildPreviewApprovalContext(d, []),
      timestamp: new Date().toLocaleTimeString(),
    };
  }

  if ("publicBroadcastEnabled" in d && "poolHighlights" in d) {
    // LP Fresh Intelligence Preview (lp_fresh_preview.py)
    const candidateSections = Array.isArray(d.candidateSections) ? d.candidateSections as Array<Record<string, unknown>> : [];
    const internalSections = Array.isArray(d.internalOnlySections) ? d.internalOnlySections as Array<Record<string, unknown>> : [];
    const poolHighlights = Array.isArray(d.poolHighlights) ? d.poolHighlights as Array<Record<string, unknown>> : [];
    const excludedReasons = Array.isArray(d.excludedReasons) ? d.excludedReasons.map((r) => String(r)) : [];
    const recommendations = Array.isArray(d.recommendations) ? d.recommendations.map((r) => String(r)) : [];
    const previewStatus = String(d.status ?? "no_candidates");
    const level: ActionLevel = previewStatus === "needs_attention" ? "warning" : previewStatus === "error" ? "error" : "success";

    const allSections = [
      ...(poolHighlights.length > 0 ? [{
        title: "Pool Highlights",
        fields: poolHighlights.map((p) =>
          summaryItem(
            `${String(p.poolName ?? p.poolId ?? "Pool")} (${String(p.chain ?? "")})`,
            [
              humanizeStatus(String(p.status ?? "")),
              p.humanPrice != null ? `${String(p.humanPriceLabel ?? "price")}: ${Number(p.humanPrice).toFixed(2)}` : null,
              p.normalizedPrice != null ? `norm ${Number(p.normalizedPrice).toFixed(4)}` : null,
              p.imbalancePct != null ? `imbalance ${Number(p.imbalancePct).toFixed(1)}%` : null,
              p.dominantAsset ? `dominant ${String(p.dominantAsset)}` : null,
              p.imbalanceCalibrationStatus ? `calibration ${String(p.imbalanceCalibrationStatus).replace(/_/g, " ")}` : null,
              p.imbalanceWarningPct != null && p.imbalanceCriticalPct != null
                ? `internal ${String(p.imbalanceWarningPct)}%/${String(p.imbalanceCriticalPct)}%`
                : null,
              p.imbalancePublicWarningPct != null && p.imbalancePublicCriticalPct != null
                ? `public ${Number(p.imbalancePublicWarningPct).toFixed(1)}%/${Number(p.imbalancePublicCriticalPct).toFixed(1)}%`
                : null,
              p.liquidity != null ? `liq ${String(p.liquidity)}` : null,
              String(p.note ?? ""),
            ].filter(Boolean).join(" | "),
          ),
        ),
      }] : []),
      ...candidateSections.map((sec) => ({
        title: String(sec.title ?? "Candidate"),
        fields: [
          summaryItem("Severity", humanizeStatus(String(sec.severity ?? ""))),
          summaryItem("Pool", sec.poolName ?? sec.poolId ?? "n/a"),
          summaryItem("Provider", sec.provider ?? "uniswap_v3"),
          summaryItem("Chain", sec.chain ?? "n/a"),
          summaryItem("Asset Pair", sec.assetPair ?? "ETH/USDC"),
          summaryItem("Policy Status", humanizeStatus(String(sec.policyStatus ?? ""))),
          summaryItem("Policy Score", sec.policyScore != null ? String(sec.policyScore) : "n/a"),
          summaryItem("Quality Score", sec.qualityScore != null ? String(sec.qualityScore) : "n/a"),
          summaryItem("Confidence", sec.alertConfidence != null ? `${String(sec.alertConfidence)}%` : "n/a"),
          summaryItem("Reason Code", sec.reasonCode ?? "n/a"),
          summaryItem("Policy Reason", String(sec.policyReason ?? "n/a")),
          summaryItem("Operational Summary", String(sec.operationalSummary ?? "")),
          summaryItem("Evidence", Array.isArray(sec.evidenceSummary) ? (sec.evidenceSummary as string[]).join(" | ") : "n/a"),
        ],
      })),
      ...internalSections.map((sec) => ({
        title: `[Internal] ${String(sec.title ?? "Signal")}`,
        fields: [
          summaryItem("Severity", humanizeStatus(String(sec.severity ?? ""))),
          summaryItem("Pool", sec.poolName ?? sec.poolId ?? "n/a"),
          summaryItem("Policy Status", humanizeStatus(String(sec.policyStatus ?? ""))),
          summaryItem("Quality Score", sec.qualityScore != null ? String(sec.qualityScore) : "n/a"),
          summaryItem("Reason Code", sec.reasonCode ?? "n/a"),
          summaryItem("Policy Reason", String(sec.policyReason ?? "LP signal remains internal-only.")),
          summaryItem("Why Internal", String(sec.operationalSummary ?? "LP signal remains internal-only.")),
          summaryItem("Evidence", Array.isArray(sec.evidenceSummary) ? (sec.evidenceSummary as string[]).join(" | ") : "n/a"),
        ],
      })),
      ...(excludedReasons.length > 0 ? [{
        title: "Excluded Reasons",
        fields: excludedReasons.map((r, i) => summaryItem(`Reason ${i + 1}`, r)),
      }] : []),
      ...recommendations.slice(0, 2).map((rec, i) => ({
        title: `Recommendation ${i + 1}`,
        fields: [summaryItem("Action", rec)],
      })),
    ];

    return {
      action: action.label,
      level,
      message: String(d.headline ?? d.summary ?? "LP fresh preview generated."),
      summary: [
        summaryItem("Status", humanizeStatus(previewStatus)),
        summaryItem("Pools Checked", d.poolsChecked ?? 0),
        summaryItem("Pools Succeeded", d.poolsSucceeded ?? 0),
        summaryItem("Pools Failed", d.poolsFailed ?? 0),
        summaryItem("Alerts Created", d.alertsCreated ?? 0),
        summaryItem("Alerts Resolved", d.alertsResolved ?? 0),
        summaryItem("LP Signals Scored", d.lpSignalsScored ?? 0),
        summaryItem("Future Daily Brief", d.futureDailyBriefCandidates ?? 0),
        summaryItem("Future Urgent", d.futureUrgentCandidates ?? 0),
        summaryItem("Internal Only", d.internalOnlySignals ?? 0),
        summaryItem("Policy Enabled", d.policyEnabled ? "Yes" : "No (v0)"),
        summaryItem("Public Broadcast", d.publicBroadcastEnabled ? "Yes" : "No (v0)"),
        summaryItem("Summary", String(d.summary ?? "").slice(0, 160)),
      ],
      rows: allSections,
      errors: [],
      previewPosts: [],
      timestamp: new Date().toLocaleTimeString(),
    };
  }

  if ("publicBroadcastEnabled" in d && "candidateSections" in d) {
    // Bridge Daily Brief Preview (bridge_brief.py)
    const candidateSections = Array.isArray(d.candidateSections) ? d.candidateSections as Array<Record<string, unknown>> : [];
    const internalSections = Array.isArray(d.internalOnlySections) ? d.internalOnlySections as Array<Record<string, unknown>> : [];
    const routeHighlights = Array.isArray(d.routeHighlights) ? d.routeHighlights.map((h) => String(h)) : [];
    const excludedReasons = Array.isArray(d.excludedReasons) ? d.excludedReasons.map((r) => String(r)) : [];
    const recommendations = Array.isArray(d.recommendations) ? d.recommendations.map((r) => String(r)) : [];
    const previewStatus = String(d.status ?? "no_candidates");
    const level: ActionLevel = previewStatus === "needs_attention" ? "warning" : previewStatus === "error" ? "error" : "success";

    const allSections = [
      ...candidateSections.map((sec) => ({
        title: String(sec.title ?? "Candidate"),
        fields: [
          summaryItem("Severity", humanizeStatus(String(sec.severity ?? ""))),
          summaryItem("Route", sec.route ?? "n/a"),
          summaryItem("Provider", sec.provider ?? "CCTP"),
          summaryItem("Asset", sec.asset ?? "USDC"),
          summaryItem("Source Chain", sec.sourceChain ?? "n/a"),
          summaryItem("Destination Chain", sec.destinationChain ?? "n/a"),
          summaryItem("Policy Status", humanizeStatus(String(sec.policyStatus ?? ""))),
          summaryItem("Policy Score", sec.policyScore != null ? String(sec.policyScore) : "n/a"),
          summaryItem("Quality Score", sec.qualityScore != null ? String(sec.qualityScore) : "n/a"),
          summaryItem("Confidence", sec.alertConfidence != null ? `${String(sec.alertConfidence)}%` : "n/a"),
          summaryItem("Reason Code", sec.reasonCode ?? "n/a"),
          summaryItem("Public Summary", String(sec.publicSafeSummary ?? "")),
          summaryItem("Evidence", Array.isArray(sec.evidenceSummary) ? (sec.evidenceSummary as string[]).join(" | ") : "n/a"),
        ],
      })),
      ...internalSections.map((sec) => ({
        title: `[Internal] ${String(sec.title ?? "Signal")}`,
        fields: [
          summaryItem("Severity", humanizeStatus(String(sec.severity ?? ""))),
          summaryItem("Route", sec.route ?? "n/a"),
          summaryItem("Policy Status", humanizeStatus(String(sec.policyStatus ?? ""))),
          summaryItem("Quality Score", sec.qualityScore != null ? String(sec.qualityScore) : "n/a"),
          summaryItem("Reason Code", sec.reasonCode ?? "n/a"),
          summaryItem("Why Internal", String(sec.publicSafeSummary ?? "Bridge signal remains internal-only.")),
        ],
      })),
      ...(routeHighlights.length > 0 ? [{
        title: "Route Highlights",
        fields: routeHighlights.map((h) => {
          const trimmed = h.trimStart();
          const isDetail = h.startsWith(" ");
          return summaryItem(isDetail ? "↳ Delay" : trimmed.split(":")[0], isDetail ? trimmed : (trimmed.split(":").slice(1).join(":").trim() || trimmed));
        }),
      }] : []),
      ...(excludedReasons.length > 0 ? [{
        title: "Excluded Reasons",
        fields: excludedReasons.map((r, i) => summaryItem(`Reason ${i + 1}`, r)),
      }] : []),
      ...recommendations.slice(0, 2).map((rec, i) => ({
        title: `Recommendation ${i + 1}`,
        fields: [summaryItem("Action", rec)],
      })),
    ];

    return {
      action: action.label,
      level,
      message: String(d.headline ?? d.summary ?? "Bridge brief preview generated."),
      summary: [
        summaryItem("Status", humanizeStatus(previewStatus)),
        summaryItem("Provider", String(d.provider ?? "cctp").toUpperCase()),
        summaryItem("Routes Checked", d.routesChecked ?? 0),
        summaryItem("Delayed Routes", d.routesDelayed ?? 0),
        summaryItem("Signals Scored", d.bridgeSignalsScored ?? 0),
        summaryItem("Future Daily Brief", d.futureDailyBriefCandidates ?? 0),
        summaryItem("Future Urgent", d.futureUrgentCandidates ?? 0),
        summaryItem("Internal Only", d.internalOnlySignals ?? 0),
        summaryItem("Policy Enabled", d.policyEnabled ? "Yes" : "No (v0)"),
        summaryItem("Public Broadcast", d.publicBroadcastEnabled ? "Yes" : "No (v0)"),
        summaryItem("Summary", String(d.summary ?? "").slice(0, 160)),
      ],
      rows: allSections,
      errors: [],
      previewPosts: [],
      timestamp: new Date().toLocaleTimeString(),
    };
  }

  if ("providersTotal" in d && "routeRows" in d) {
    // Bridge Provider Activation Matrix
    const providerSummaries = Array.isArray(d.providerSummaries) ? d.providerSummaries as Array<Record<string, unknown>> : [];
    const routeRows = Array.isArray(d.routeRows) ? d.routeRows as Array<Record<string, unknown>> : [];
    const recommendations = Array.isArray(d.recommendations) ? d.recommendations.map((r) => String(r)) : [];
    const matrixStatus = String(d.status ?? "blocked");
    const level: ActionLevel = matrixStatus === "ready" ? "success" : matrixStatus === "needs_attention" ? "warning" : "error";
    return {
      action: action.label,
      level,
      message: String(d.highestPriorityNextAction ?? "Bridge activation matrix generated."),
      summary: [
        summaryItem("Status", humanizeStatus(matrixStatus)),
        summaryItem("Providers Implemented", d.providersImplemented ?? 0),
        summaryItem("Providers Configured", d.providersConfigured ?? 0),
        summaryItem("Providers Live Verified", d.providersLiveVerified ?? 0),
        summaryItem("Routes Active", d.routesActive ?? 0),
        summaryItem("Activation Ready", d.routesActivationReady ?? 0),
        summaryItem("Blocked", d.routesBlocked ?? 0),
        summaryItem("Backlog", d.routesBacklog ?? 0),
        summaryItem("Alert Capable", d.routesAlertCapable ?? 0),
        summaryItem("Future Brief Capable", d.routesFutureBriefCapable ?? 0),
      ],
      rows: [
        ...providerSummaries.map((p) => ({
          title: `${String(p.provider ?? "provider").toUpperCase()} Provider Summary`,
          fields: [
            summaryItem("Implemented", p.implemented ? "Yes" : "No"),
            summaryItem("Source Mode", String(p.sourceMode ?? "disabled")),
            summaryItem("Source Configured", p.sourceConfigured ? "Yes" : "No"),
            summaryItem("Source Verified", p.sourceVerified ? "Yes" : "No"),
            summaryItem("Routes Total", p.routesTotal ?? 0),
            summaryItem("Routes Enabled", p.routesEnabled ?? 0),
            summaryItem("Routes Active", p.routesActive ?? 0),
            summaryItem("Activation Ready", p.routesActivationReady ?? 0),
            summaryItem("Blocked", p.routesBlocked ?? 0),
            summaryItem("Backlog", p.routesBacklog ?? 0),
            summaryItem("Latest Checked", formatDateTime(p.latestCheckedAt)),
            summaryItem("Latest Success", formatDateTime(p.latestSuccessAt)),
            summaryItem("Latest Error", p.latestError ? String(p.latestError) : "None"),
            summaryItem("Next Action", String(p.nextAction ?? "")),
          ],
        })),
        ...routeRows.slice(0, 12).map((row) => ({
          title: `${String(row.routeName ?? row.routeId ?? "Route")}`,
          fields: [
            summaryItem("Provider", String(row.provider ?? "").toUpperCase()),
            summaryItem("Route", String(row.routeName ?? row.routeId ?? "")),
            summaryItem("Asset", String(row.asset ?? "")),
            summaryItem("Source Chain", String(row.sourceChain ?? "")),
            summaryItem("Destination Chain", String(row.destinationChain ?? "")),
            summaryItem("Activation Status", humanizeStatus(String(row.activationStatus ?? ""))),
            summaryItem("Enabled", row.enabled ? "Yes" : "No"),
            summaryItem("Adapter Supported", row.adapterSupported ? "Yes" : "No"),
            summaryItem("Source Mode", String(row.sourceMode ?? "disabled")),
            summaryItem("Source Configured", row.sourceConfigured ? "Yes" : "No"),
            summaryItem("Live Checked", row.liveChecked ? "Yes" : "No"),
            summaryItem("Alert Capable", row.alertCapable ? "Yes" : "No"),
            summaryItem("Future Brief Capable", row.futureBriefCapable ? "Yes" : "No"),
            summaryItem("Missing Env", Array.isArray(row.missingEnv) && row.missingEnv.length > 0 ? (row.missingEnv as string[]).join(", ") : "None"),
            summaryItem("Latest Checked", formatDateTime(row.latestCheckedAt)),
            summaryItem("Latest Success", formatDateTime(row.latestSuccessAt)),
            summaryItem("Latest Error", row.latestError ? String(row.latestError) : "None"),
            summaryItem("Next Action", String(row.nextAction ?? "")),
          ],
        })),
        ...recommendations.slice(0, 3).map((rec, i) => ({
          title: `Recommendation ${i + 1}`,
          fields: [summaryItem("Action", rec)],
        })),
      ],
      errors: [],
      previewPosts: [],
      timestamp: new Date().toLocaleTimeString(),
    };
  }

  if ("drillResults" in d && "deliverySent" in d) {
    // Bridge Drill Matrix result (bridge_drill.py)
    const drillResults = Array.isArray(d.drillResults) ? (d.drillResults as Array<Record<string, unknown>>) : [];
    const recommendations = Array.isArray(d.recommendations) ? d.recommendations.map((r) => String(r)) : [];
    const level = normalizeLevel(String(d.status ?? "warning"));
    return {
      action: action.label,
      level,
      message: "[DRILL] " + String(d.policySummary ?? "Bridge drill completed."),
      summary: [
        summaryItem("Scenario", String(d.scenario ?? "")),
        summaryItem("Providers Tested", Array.isArray(d.providersTested) ? (d.providersTested as string[]).join(", ") || "none" : "n/a"),
        summaryItem("Routes Tested", d.routesTested ?? 0),
        summaryItem("Alerts Created", d.alertsCreated ?? 0),
        summaryItem("Alerts Updated", d.alertsUpdated ?? 0),
        summaryItem("Alerts Resolved", d.alertsResolved ?? 0),
        summaryItem("Signals Scored", d.bridgeSignalsScored ?? 0),
        summaryItem("Future Daily Brief", d.futureDailyBriefCandidates ?? 0),
        summaryItem("Future Urgent", d.futureUrgentCandidates ?? 0),
        summaryItem("Internal Only Signals", d.internalOnlySignals ?? 0),
        summaryItem("Public Broadcast", d.publicBroadcastEnabled ? "Yes" : "No"),
        summaryItem("Delivery Sent", d.deliverySent ? "Yes" : "No"),
        summaryItem("Preview Headline", d.previewHeadline ?? "n/a"),
      ],
      rows: drillResults.map((row) => {
        const evidence = Array.isArray(row.evidenceSummary) ? (row.evidenceSummary as string[]).join("; ") : "n/a";
        return {
          title: String(row.routeName ?? row.routeId ?? "Drill Route"),
          fields: [
            summaryItem("Provider", String(row.provider ?? "").toUpperCase()),
            summaryItem("Route", String(row.routeName ?? row.routeId ?? "n/a")),
            summaryItem("Source Chain", String(row.sourceChain ?? "n/a")),
            summaryItem("Destination Chain", String(row.destinationChain ?? "n/a")),
            summaryItem("Asset", String(row.asset ?? "n/a")),
            summaryItem("Scenario", String(row.scenario ?? "n/a")),
            summaryItem("Expected Status", String(row.expectedStatus ?? "n/a")),
            summaryItem("Actual Status", String(row.actualStatus ?? "n/a")),
            summaryItem("Expected Alert", String(row.expectedAlertAction ?? "n/a")),
            summaryItem("Actual Alert", String(row.actualAlertAction ?? "n/a")),
            summaryItem("Expected Policy", String(row.expectedPolicyStatus ?? "n/a")),
            summaryItem("Actual Policy", String(row.actualPolicyStatus ?? "n/a")),
            summaryItem("Passed", row.passed ? "Yes" : "No"),
            summaryItem("Confidence", row.confidence ?? "n/a"),
            summaryItem("Quality Score", row.qualityScore ?? "n/a"),
            summaryItem("Evidence", evidence || "n/a"),
            summaryItem("Notes", String(row.notes ?? "")),
          ],
        };
      }).concat(
        recommendations.slice(0, 2).map((rec, i) => ({
          title: "Recommendation " + String(i + 1),
          fields: [summaryItem("Action", rec)],
        }))
      ),
      errors: [],
      previewPosts: [],
      timestamp: new Date().toLocaleTimeString(),
    };
  }

  if ("reconciledRouteIds" in d && "reconciliationMessages" in d) {
    // Bridge stale alert reconciliation result (bridge_route_reconciliation.py)
    const reconciledRouteIds = Array.isArray(d.reconciledRouteIds) ? (d.reconciledRouteIds as string[]) : [];
    const reconciliationMessages = Array.isArray(d.reconciliationMessages) ? (d.reconciliationMessages as string[]) : [];
    const recommendations = Array.isArray(d.recommendations) ? (d.recommendations as string[]) : [];
    const level = normalizeLevel(String(d.status ?? "ok"));
    return {
      action: action.label,
      level,
      message: String(d.message ?? "Reconciliation complete."),
      summary: [
        summaryItem("Alerts Resolved", d.alertsResolved ?? 0),
        summaryItem("Disabled Route Alerts Resolved", d.disabledRouteAlertsResolved ?? 0),
        summaryItem("Routes Reconciled", reconciledRouteIds.length),
      ],
      rows: [
        ...(reconciledRouteIds.length > 0 ? [{
          title: "Reconciled Routes",
          fields: reconciledRouteIds.map((id, i) => summaryItem(`Route ${i + 1}`, id)),
        }] : []),
        ...(reconciliationMessages.length > 0 ? [{
          title: "Reconciliation Detail",
          fields: reconciliationMessages.map((msg, i) => summaryItem(`Step ${i + 1}`, msg)),
        }] : []),
        ...recommendations.map((rec, i) => ({
          title: `Recommendation ${i + 1}`,
          fields: [summaryItem("Action", rec)],
        })),
      ],
      errors: [],
      previewPosts: [],
      timestamp: new Date().toLocaleTimeString(),
    };
  }

  if ("overallReadinessLabel" in d && "oracleReadiness" in d && "bridgeReadiness" in d) {
    // Radar Readiness Summary (radar_readiness.py)
    const oracle = d.oracleReadiness && typeof d.oracleReadiness === "object" ? d.oracleReadiness as Record<string, unknown> : {};
    const bridge = d.bridgeReadiness && typeof d.bridgeReadiness === "object" ? d.bridgeReadiness as Record<string, unknown> : {};
    const alertsSummary = d.activeAlertsSummary && typeof d.activeAlertsSummary === "object" ? d.activeAlertsSummary as Record<string, unknown> : {};
    const broadcastSum = d.broadcastSummary && typeof d.broadcastSummary === "object" ? d.broadcastSummary as Record<string, unknown> : {};
    const coverageSum = d.coverageSummary && typeof d.coverageSummary === "object" ? d.coverageSummary as Record<string, unknown> : {};
    const riskGaps = Array.isArray(d.riskGaps) ? d.riskGaps.map((g) => String(g)) : [];
    const recommendations = Array.isArray(d.recommendations) ? d.recommendations.map((r) => String(r)) : [];
    const oracleRecs = Array.isArray(oracle.recommendations) ? oracle.recommendations.map((r) => String(r)) : [];
    const bridgeRecs = Array.isArray(bridge.recommendations) ? bridge.recommendations.map((r) => String(r)) : [];
    const broadcastRecs = Array.isArray(broadcastSum.recommendations) ? broadcastSum.recommendations.map((r) => String(r)) : [];
    const overallLabel = String(d.overallReadinessLabel ?? "");
    const overallStatus = String(d.status ?? "needs_attention");
    const level: ActionLevel = overallStatus === "blocked" ? "error" : overallStatus === "needs_attention" ? "warning" : "success";

    return {
      action: action.label,
      level,
      message: String(d.nextOperatorAction ?? "Radar readiness summary generated."),
      summary: [
        summaryItem("Overall Status", humanizeStatus(overallStatus)),
        summaryItem("Readiness", humanizeStatus(overallLabel)),
        summaryItem("Oracle Readiness", humanizeStatus(String(oracle.readinessLabel ?? ""))),
        summaryItem("Bridge Readiness", humanizeStatus(String(bridge.readinessLabel ?? ""))),
        summaryItem("Oracle Feeds Active", oracle.activeFeeds ?? 0),
        summaryItem("Bridge Routes Checked", bridge.routesChecked ?? 0),
        summaryItem("Bridge Routes Configured", bridge.routesConfigured ?? 0),
        summaryItem("Providers Checked", bridge.providersChecked ?? 0),
        summaryItem("Broadcast Candidates", oracle.broadcastCandidates ?? 0),
        summaryItem("Active Alerts", alertsSummary.totalActiveAlerts ?? 0),
        summaryItem("Commercial Demo Ready", d.commercialDemoReady ? "Yes" : "No"),
        summaryItem("Public Broadcast Ready", d.publicBroadcastReady ? "Yes" : "No (v0)"),
      ],
      rows: [
        {
          title: "Oracle Radar",
          fields: [
            summaryItem("Status", humanizeStatus(String(oracle.status ?? ""))),
            summaryItem("Readiness", humanizeStatus(String(oracle.readinessLabel ?? ""))),
            summaryItem("Active Feeds", oracle.activeFeeds ?? 0),
            summaryItem("Dependency Feeds", oracle.dependencyFeeds ?? 0),
            summaryItem("Commercial Priority Feeds", oracle.commercialPriorityFeeds ?? 0),
            summaryItem("Reference Sources", oracle.referenceSources ?? 0),
            summaryItem("Active Alerts", oracle.activeOracleAlerts ?? 0),
            summaryItem("Warning Alerts", oracle.warningAlerts ?? 0),
            summaryItem("Critical Alerts", oracle.criticalAlerts ?? 0),
            summaryItem("Broadcast Candidates", oracle.broadcastCandidates ?? 0),
            summaryItem("Providers", Array.isArray(oracle.providers) ? (oracle.providers as string[]).join(", ") || "n/a" : "n/a"),
            summaryItem("X Preview Available", oracle.xPreviewAvailable ? "Yes" : "No"),
            summaryItem("Public Broadcast", oracle.publicBroadcastEnabled ? "Yes" : "No (v0)"),
            summaryItem("Latest Monitor Run", formatDateTime(oracle.latestMonitorRunAt)),
            summaryItem("Latest Brief At", formatDateTime(oracle.latestBroadcastBriefAt)),
            ...oracleRecs.slice(0, 2).map((r, i) => summaryItem(`Recommendation ${i + 1}`, r)),
          ],
        },
        {
          title: "Bridge Radar",
          fields: [
            summaryItem("Status", humanizeStatus(String(bridge.status ?? ""))),
            summaryItem("Readiness", humanizeStatus(String(bridge.readinessLabel ?? ""))),
            summaryItem("Providers Implemented", bridge.providersImplemented ?? 0),
            summaryItem("Providers Configured", bridge.providersConfigured ?? 0),
            summaryItem("Providers Live Verified", bridge.providersLiveVerified ?? 0),
            summaryItem("Providers Checked", bridge.providersChecked ?? 0),
            summaryItem("Provider Lanes", bridge.providerLanes ?? 0),
            summaryItem("Routes Configured", bridge.routesConfigured ?? 0),
            summaryItem("Routes Enabled", bridge.routesEnabled ?? 0),
            summaryItem("Routes Active", bridge.routesActive ?? 0),
            summaryItem("Routes Checked", bridge.routesChecked ?? 0),
            summaryItem("Routes Delayed", bridge.routesDelayed ?? 0),
            summaryItem("Routes Errored", bridge.routesErrored ?? 0),
            summaryItem("Alert Capable Routes", bridge.alertCapableRoutes ?? 0),
            summaryItem("Future Brief Capable", bridge.futureBriefCapableRoutes ?? 0),
            summaryItem("Active Bridge Alerts", bridge.activeBridgeAlerts ?? 0),
            summaryItem("Bridge Preview Available", bridge.bridgePreviewAvailable ? "Yes" : "No"),
            summaryItem("Public Broadcast", "No (v0)"),
            summaryItem("Policy Enabled", bridge.policyEnabled ? "Yes" : "No (v0)"),
            summaryItem("Latest Monitor Run", formatDateTime(bridge.latestBridgeMonitorRunAt)),
            ...bridgeRecs.slice(0, 2).map((r, i) => summaryItem(`Recommendation ${i + 1}`, r)),
          ],
        },
        {
          title: "Active Alerts",
          fields: [
            summaryItem("Total Active", alertsSummary.totalActiveAlerts ?? 0),
            summaryItem("Oracle Alerts", alertsSummary.oracleAlerts ?? 0),
            summaryItem("Bridge Alerts", alertsSummary.bridgeAlerts ?? 0),
            summaryItem("Warning", alertsSummary.warningAlerts ?? 0),
            summaryItem("Critical", alertsSummary.criticalAlerts ?? 0),
            summaryItem("Manual", alertsSummary.manualAlerts ?? 0),
            summaryItem("Drill", alertsSummary.drillAlerts ?? 0),
            summaryItem("Stale / Disabled Route", alertsSummary.staleOrDisabledRouteAlerts ?? 0),
            summaryItem("Public Eligible", alertsSummary.publicEligibleAlerts ?? 0),
            summaryItem("Internal Only", alertsSummary.internalOnlyAlerts ?? 0),
            ...(alertsSummary.latestAlertSummary ? [summaryItem("Latest Alert", String(alertsSummary.latestAlertSummary).slice(0, 120))] : []),
          ],
        },
        {
          title: "Broadcast Summary",
          fields: [
            summaryItem("Oracle Public Broadcast", broadcastSum.oraclePublicBroadcastEnabled ? "Yes" : "No (v0)"),
            summaryItem("Bridge Public Broadcast", "No (v0)"),
            summaryItem("Oracle X Preview Ready", broadcastSum.oracleXPreviewReady ? "Yes" : "No"),
            summaryItem("Bridge Internal Preview", broadcastSum.bridgeInternalPreviewReady ? "Yes" : "No"),
            summaryItem("Oracle Broadcast Candidates", broadcastSum.oracleBroadcastCandidates ?? 0),
            summaryItem("Bridge Future Candidates", broadcastSum.bridgeFutureCandidates ?? 0),
            summaryItem("Delivery Destinations", broadcastSum.deliveryDestinationsConfigured ?? 0),
            summaryItem("Delivery Ready", broadcastSum.deliveryReady ? "Yes" : "No"),
            ...broadcastRecs.slice(0, 2).map((r, i) => summaryItem(`Recommendation ${i + 1}`, r)),
          ],
        },
        {
          title: "Coverage Summary",
          fields: [
            summaryItem("Oracle Active Feeds", coverageSum.oracleActiveFeeds ?? 0),
            summaryItem("Oracle Reference Sources", coverageSum.oracleReferenceSources ?? 0),
            summaryItem("Bridge Active Routes", coverageSum.bridgeActiveRoutes ?? 0),
            summaryItem("Bridge Active Providers", coverageSum.bridgeActiveProviders ?? 0),
            summaryItem("Bridge Backlog Routes", coverageSum.bridgeBacklogRoutes ?? 0),
            summaryItem("Bridge Activation Ready", coverageSum.bridgeActivationReadyRoutes ?? 0),
            summaryItem("Bridge Blocked Routes", coverageSum.bridgeBlockedRoutes ?? 0),
          ],
        },
        ...(riskGaps.length > 0 ? [{
          title: "Risk Gaps",
          fields: riskGaps.map((gap, i) => summaryItem(`Gap ${i + 1}`, gap)),
        }] : []),
        ...recommendations.slice(0, 3).map((rec, i) => ({
          title: `Next Action ${i + 1}`,
          fields: [summaryItem("Action", rec)],
        })),
      ],
      errors: [],
      previewPosts: [],
      timestamp: new Date().toLocaleTimeString(),
    };
  }

  if ("futureDailyBriefCandidates" in d && "routeResults" in d) {
    // Canonical Bridge Monitor result (bridge_pipeline.py)
    const routeResults = Array.isArray(d.routeResults) ? d.routeResults as Array<Record<string, unknown>> : [];
    const sqResults = Array.isArray(d.signalQualityResults) ? d.signalQualityResults as Array<Record<string, unknown>> : [];
    const recommendations = Array.isArray(d.recommendations) ? d.recommendations.map((r) => String(r)) : [];
    const level = normalizeLevel(String(d.status ?? "warning"));
    // Build object_id → policy_status lookup from signal quality results
    const policyByObjectId = new Map<string, string>();
    for (const sq of sqResults) {
      const oid = String(sq.monitorObjectId ?? sq.objectId ?? "");
      const ps = String(sq.bridgePolicyStatus ?? "internal_only");
      if (oid) policyByObjectId.set(oid, ps);
    }
    return {
      action: action.label,
      level,
      message: String(d.message ?? "Bridge Monitor completed."),
      summary: [
        summaryItem("CCTP Source Mode", String(d.cctpStatusSourceMode ?? "disabled")),
        summaryItem("Across Source Mode", String(d.acrossStatusSourceMode ?? "disabled")),
        summaryItem("Wormhole Source Mode", String(d.wormholeStatusSourceMode ?? "disabled")),
        summaryItem("LayerZero Source Mode", String(d.layerzeroStatusSourceMode ?? "disabled")),
        summaryItem("Providers Checked", Array.isArray(d.providersChecked) ? (d.providersChecked as string[]).join(", ") || "none" : "n/a"),
        summaryItem("Provider Lanes", d.providerLanesChecked ?? 1),
        summaryItem("Routes Configured", d.routesConfigured ?? 0),
        summaryItem("Routes Enabled", d.routesEnabled ?? 0),
        summaryItem("Routes Checked", d.routesChecked ?? 0),
        summaryItem("Routes Delayed", d.routesDelayed ?? 0),
        summaryItem("Routes Errored", d.routesErrored ?? 0),
        summaryItem("Routes Failed", d.routesFailed ?? 0),
        summaryItem("Alerts Created", d.alertsCreated ?? 0),
        summaryItem("Alerts Updated", d.alertsUpdated ?? 0),
        summaryItem("Alerts Resolved", d.alertsResolved ?? 0),
        summaryItem("Signals Scored", d.bridgeSignalsScored ?? 0),
        summaryItem("Future Daily Brief", d.futureDailyBriefCandidates ?? 0),
        summaryItem("Future Urgent", d.futureUrgentCandidates ?? 0),
        summaryItem("Internal Only", d.internalOnlySignals ?? 0),
        summaryItem("Policy Enabled", d.policyEnabled ? "Yes" : "No (v0)"),
        summaryItem("Latest Error", d.latestError ?? "None"),
      ],
      rows: routeResults.map((row) => {
        const be = row.bridgeEvidence && typeof row.bridgeEvidence === "object" ? row.bridgeEvidence as Record<string, unknown> : null;
        const objectId = String(row.objectId ?? "");
        const policyStatus = policyByObjectId.get(objectId) ?? "internal_only";
        return {
          title: String(be?.routeName ?? row.route ?? row.objectId ?? "Route"),
          fields: [
            summaryItem("Route", be?.routeName ?? row.route ?? "n/a"),
            summaryItem("Provider", String(row.source ?? be?.provider ?? "cctp").toUpperCase()),
            summaryItem("Asset", String(be?.asset ?? "USDC")),
            summaryItem("Source Chain", String(be?.sourceChain ?? "n/a")),
            summaryItem("Destination Chain", String(be?.destinationChain ?? "n/a")),
            summaryItem("Status", humanizeStatus(String(row.status ?? ""))),
            summaryItem("Latest Checked", formatDateTime(row.lastCheckedAt)),
            summaryItem("Latest Success", formatDateTime(row.lastSuccessAt)),
            summaryItem("Observed Latency", be ? formatAge(be.observedLatencySeconds) : "n/a"),
            summaryItem("Max Pending Age", be ? formatAge(be.maxPendingAgeSeconds) : "n/a"),
            summaryItem("Pending Messages", be ? formatDisplayValue(be.pendingMessageCount) : "n/a"),
            summaryItem("Latest Observed Msg", be ? String(be.latestObservedMessageId ?? "n/a") : "n/a"),
            summaryItem("Latest Completed Msg", be ? String(be.latestCompletedMessageId ?? "n/a") : "n/a"),
            summaryItem("Bridge Policy Status", policyStatus),
            summaryItem("Alert Action", row.lastError ? "Check error" : row.status === "checked" ? "Route checked" : "Route delayed"),
            summaryItem("Next Action", String(row.nextAction ?? "n/a")),
          ],
        };
      }).concat(
        recommendations.slice(0, 2).map((rec, i) => ({
          title: `Recommendation ${i + 1}`,
          fields: [summaryItem("Action", rec)],
        }))
      ),
      errors: d.latestError ? [String(d.latestError)] : [],
      previewPosts: [],
      timestamp: new Date().toLocaleTimeString(),
    };
  }

  if ("routesChecked" in d) {
    const routeResults = Array.isArray(d.routeResults) ? d.routeResults as Array<Record<string, unknown>> : [];
    const errors = Array.isArray(d.errors)
      ? d.errors.map((item) => typeof item === "object" && item !== null && "message" in item ? String((item as Record<string, unknown>).message) : String(item))
      : [];
    const skippedRoutes = routeResults.filter((row) => String(row.status ?? "") === "skipped").length;
    const failedRoutes = routeResults.filter((row) => String(row.status ?? "") === "error").length;
    return {
      action: action.label,
      level: Number(d.routesChecked ?? 0) > 0 && failedRoutes === 0 && errors.length === 0 ? "success" : "warning",
      message: Number(d.routesChecked ?? 0) > 0 && failedRoutes === 0 && errors.length === 0
        ? Number(d.alertsCreated ?? 0) > 0
          ? "Bridge monitor completed and created or updated alert state."
          : "Bridge monitor completed successfully. Healthy routes required no alert."
        : errors[0] ?? "Bridge monitor completed with warnings.",
      summary: [
        summaryItem("Routes Checked", d.routesChecked ?? 0),
        summaryItem("Sources Checked", d.sourcesChecked ?? 0),
        summaryItem("Alerts Created", d.alertsCreated ?? 0),
        summaryItem("Alerts Updated", d.alertsUpdated ?? 0),
        summaryItem("Alerts Resolved", d.alertsResolved ?? 0),
        summaryItem("Skipped Routes", skippedRoutes),
        summaryItem("Failed Routes", failedRoutes),
        summaryItem("Errors", errors.length),
      ],
      rows: routeResults.map((row) => ({
        title: String(row.route ?? "Route"),
        fields: [
          summaryItem("Route ID", row.routeId ?? ""),
          summaryItem("Asset", row.asset ?? ""),
          summaryItem("From", row.fromChain ?? ""),
          summaryItem("To", row.toChain ?? ""),
          summaryItem("Status", humanizeStatus(String(row.status ?? ""))),
          summaryItem("Alerts Created", row.alertsCreated ?? 0),
          summaryItem("Alerts Updated", row.alertsUpdated ?? 0),
          summaryItem("Alerts Resolved", row.alertsResolved ?? 0),
          summaryItem("Last Error", row.error ?? "None"),
        ],
      })),
      errors,
      previewPosts: extractPreviewPosts(data),
      timestamp: new Date().toLocaleTimeString(),
    };
  }

  if ("feeds" in d && Array.isArray(d.feeds)) {
    const feeds = d.feeds as Array<Record<string, unknown>>;
    const disabled = feeds.filter((row) => row.status === "disabled").length;
    const ready = feeds.filter((row) => row.status === "enabled" || row.status === "fresh" || row.status === "stale").length;
    const missing = feeds.filter((row) => String(row.status ?? "").startsWith("missing")).length;
    return {
      action: action.label,
      level: missing > 0 || ready === 0 ? "warning" : "success",
      message: missing > 0 ? "Oracle activation diagnostics completed with missing configuration." : "Oracle activation diagnostics completed.",
      summary: [
        summaryItem("Feeds", feeds.length),
        summaryItem("Runtime Enabled", d.runtimeEnabled ? "Yes" : "No"),
        summaryItem("Oracle Monitor", d.oracleMonitorEnabled ? "Yes" : "No"),
        summaryItem("Disabled", disabled),
        summaryItem("Ready", ready),
        summaryItem("Missing Config", missing),
      ],
      rows: feeds.map((row) => ({
        title: `${String(row.pair ?? "")} on ${String(row.chain ?? "")}`,
        fields: [
          summaryItem("Object ID", row.objectId ?? ""),
          summaryItem("Source", row.source ?? ""),
          summaryItem("Enabled", row.enabledValue ? "Yes" : "No"),
          summaryItem("Status", humanizeStatus(String(row.status ?? ""))),
          summaryItem("RPC Env", row.rpcUrlEnv ?? ""),
          summaryItem("RPC Present", row.rpcUrlPresent ? "Yes" : "No"),
          summaryItem("Feed Address Present", row.contractAddressPresent ? "Yes" : "No"),
          summaryItem("Next Action", row.nextAction ?? ""),
        ],
      })),
      errors: [],
      previewPosts: extractPreviewPosts(data),
      timestamp: new Date().toLocaleTimeString(),
    };
  }

  if ("matchesChecked" in d) {
    return {
      action: action.label,
      level: Array.isArray(d.errors) && d.errors.length > 0 ? "warning" : "success",
      message: "Delivery action completed.",
      summary: [
        summaryItem("Matches Checked", d.matchesChecked ?? 0),
        summaryItem("Destinations", d.destinationsChecked ?? 0),
        summaryItem("Created", d.deliveriesCreated ?? 0),
        summaryItem("Sent", d.deliveriesSent ?? 0),
        summaryItem("Skipped", d.deliveriesSkipped ?? 0),
        summaryItem("Failed", d.deliveriesFailed ?? 0),
      ],
      rows: [],
      errors: Array.isArray(d.errors) ? d.errors.map((item) => String(item)) : [],
      previewPosts: extractPreviewPosts(data),
      timestamp: new Date().toLocaleTimeString(),
    };
  }

  if ("watchlistsChecked" in d) {
    return {
      action: action.label,
      level: Array.isArray(d.errors) && d.errors.length > 0 ? "warning" : "success",
      message: "Watchlist matching completed.",
      summary: [
        summaryItem("Watchlists", d.watchlistsChecked ?? 0),
        summaryItem("Alerts Checked", d.alertsChecked ?? 0),
        summaryItem("Matches Created", d.matchesCreated ?? 0),
        summaryItem("Deduped", d.matchesDeduped ?? 0),
        summaryItem("Skipped", d.matchesSkipped ?? 0),
      ],
      rows: [],
      errors: Array.isArray(d.errors) ? d.errors.map((item) => String(item)) : [],
      previewPosts: extractPreviewPosts(data),
      timestamp: new Date().toLocaleTimeString(),
    };
  }

  if ("summary" in d && typeof d.summary === "object" && d.summary !== null && "totalPools" in (d.summary as Record<string, unknown>)) {
    const summary = d.summary as Record<string, unknown>;
    const items = Array.isArray(d.items) ? d.items as Array<Record<string, unknown>> : [];
    const totalPools = Number(summary.totalPools ?? 0);
    const activePools = Number(summary.activePools ?? 0);
    const providers = Array.isArray(summary.providersCovered) ? (summary.providersCovered as string[]).join(", ") || "none" : "none";
    return {
      action: action.label,
      level: activePools > 0 ? "success" : "warning",
      message: activePools > 0
        ? "LP Radar has active monitored pools."
        : `LP Radar coverage registry loaded. ${totalPools} pools registered — all disabled or backlog in v0. No live LP monitoring is active.`,
      summary: [
        summaryItem("Total Pools", totalPools),
        summaryItem("Active Pools", activePools),
        summaryItem("Enabled Pools", summary.enabledPools ?? 0),
        summaryItem("Disabled Pools", summary.disabledPools ?? 0),
        summaryItem("Pending Pools", summary.pendingPools ?? 0),
        summaryItem("Backlog Pools", summary.backlogPools ?? 0),
        summaryItem("Blocked Pools", summary.blockedPools ?? 0),
        summaryItem("Providers Covered", providers),
        summaryItem("Commercial Priority", summary.commercialPriorityPools ?? 0),
        summaryItem("Sagitta Dependencies", summary.sagittaDependencyPools ?? 0),
        summaryItem("Alert Capable", summary.alertCapablePools ?? 0),
        summaryItem("Reference Compare", summary.referenceCompareCapablePools ?? 0),
        summaryItem("Active LP Alerts", summary.activeLpAlerts ?? 0),
      ],
      rows: items.slice(0, 12).map((item) => ({
        title: `${String(item.poolName ?? item.assetPair ?? item.id ?? "Pool")} — ${String(item.chain ?? "")}`,
        fields: [
          summaryItem("Provider", String(item.provider ?? "").replace("_", " ")),
          summaryItem("Pool", String(item.poolName ?? "")),
          summaryItem("Chain", String(item.chain ?? "")),
          summaryItem("Pair", String(item.assetPair ?? "")),
          summaryItem("Pool Type", String(item.poolType ?? "").replace(/_/g, " ")),
          summaryItem("Doctrine", String(item.doctrineClass ?? "").replace(/_/g, " ")),
          summaryItem("Purpose", String(item.purpose ?? "").replace(/_/g, " ")),
          summaryItem("Value Tier", String(item.commercialValueTier ?? "")),
          summaryItem("Status", humanizeStatus(String(item.status ?? ""))),
          summaryItem("Can Alert", item.canAlert ? "Yes" : "No"),
          summaryItem("Can Broadcast", item.canBroadcast ? "Yes" : "No"),
          summaryItem("Fee Tier", item.feeTier ? String(item.feeTier) : "n/a"),
          summaryItem("Liquidity Drop Warn", item.liquidityDropWarningPct != null ? `${item.liquidityDropWarningPct}%` : "n/a"),
          summaryItem("Price Dev Warn", item.priceDeviationWarningBps != null ? `${item.priceDeviationWarningBps} bps` : "n/a"),
          summaryItem("Slippage Warn", item.slippageWarningBps != null ? `${item.slippageWarningBps} bps` : "n/a"),
          summaryItem("Metadata Status", String(item.metadataStatus ?? "").replace(/_/g, " ")),
          summaryItem("Enabled Env", item.enabledEnv ? String(item.enabledEnv) : "n/a"),
        ],
      })).concat([{
        title: "Note",
        fields: [summaryItem("Coverage Note", "LP coverage rows are registry entries. Pending, disabled, and backlog rows are not active monitoring. LP alerts require a live pool monitor and crossed doctrine thresholds.")],
      }]),
      errors: [],
      previewPosts: [],
      timestamp: new Date().toLocaleTimeString(),
    };
  }

  if ("poolsConfigured" in d && "poolResults" in d && Array.isArray(d.poolResults)) {
    const results = d.poolResults as Array<Record<string, unknown>>;
    const succeeded = Number(d.poolsSucceeded ?? 0);
    const failed = Number(d.poolsFailed ?? 0);
    const skipped = Number(d.poolsSkipped ?? 0);
    const createdAlertIds = Array.isArray(d.createdAlertIds) ? d.createdAlertIds.map((value) => String(value)) : [];
    const updatedAlertIds = Array.isArray(d.updatedAlertIds) ? d.updatedAlertIds.map((value) => String(value)) : [];
    const resolvedAlertIds = Array.isArray(d.resolvedAlertIds) ? d.resolvedAlertIds.map((value) => String(value)) : [];
    const alertOperations = Array.isArray(d.alertOperations) ? d.alertOperations as Array<Record<string, unknown>> : [];
    const visibleActiveOperations = alertOperations.filter(
      (operation) => operation.visibleInActiveAlerts === true && String(operation.statusAfter ?? "") === "active",
    );
    const formatAlertIds = (ids: string[]) => ids.length > 0 ? ids.join(", ") : "None";
    const isMonitor = "alertsCreated" in d && Number(d.alertsCreated ?? 0) >= 0 && "lpDailyBriefCandidates" in d;
    const operationRows = alertOperations.map((operation) => ({
      title: `Alert ${humanizeStatus(String(operation.action ?? "updated"))} - ${String(operation.poolName ?? operation.poolId ?? "LP Pool")}`,
      fields: [
        summaryItem("Alert ID", String(operation.alertId ?? "None")),
        summaryItem("Reason Code", String(operation.reasonCode ?? "")),
        summaryItem("Severity", humanizeStatus(String(operation.severity ?? ""))),
        summaryItem("Status After", humanizeStatus(String(operation.statusAfter ?? ""))),
        summaryItem("Visible In Active LP Alerts", operation.visibleInActiveAlerts ? "Yes" : "No"),
        summaryItem("Visibility Reason", String(operation.visibilityReason ?? "")),
        summaryItem("Visibility", humanizeStatus(String(operation.visibility ?? ""))),
        summaryItem("Provider", String(operation.provider ?? "")),
        summaryItem("Chain", String(operation.chain ?? "")),
        summaryItem("Pair", String(operation.assetPair ?? "")),
        summaryItem("Dedupe Key", String(operation.dedupeKey ?? "")),
      ],
    }));
    return {
      action: action.label,
      level: succeeded > 0 ? "success" : failed > 0 ? "error" : "warning",
      message: visibleActiveOperations.length > 0
        ? `LP monitor updated alert state. ${visibleActiveOperations.length} active LP alert(s) should now be visible in Active LP Alerts.`
        : succeeded > 0
          ? `${succeeded} LP pool(s) checked successfully.`
          : failed > 0
            ? `${failed} pool(s) failed. ${skipped} skipped (disabled).`
            : `All ${skipped} pool(s) skipped (disabled or not configured).`,
      summary: [
        summaryItem("Pools Configured", d.poolsConfigured ?? 0),
        summaryItem("Pools Enabled", d.poolsEnabled ?? 0),
        summaryItem("Pools Checked", d.poolsChecked ?? 0),
        summaryItem("Pools Succeeded", succeeded),
        summaryItem("Pools Skipped", skipped),
        summaryItem("Pools Failed", failed),
        summaryItem("Alerts Created", d.alertsCreated ?? 0),
        summaryItem("Alerts Updated", d.alertsUpdated ?? 0),
        summaryItem("Alerts Resolved", d.alertsResolved ?? 0),
        summaryItem("Created Alert IDs", formatAlertIds(createdAlertIds)),
        summaryItem("Updated Alert IDs", formatAlertIds(updatedAlertIds)),
        summaryItem("Resolved Alert IDs", formatAlertIds(resolvedAlertIds)),
        summaryItem("Active Alerts Visible", visibleActiveOperations.length),
        ...(isMonitor ? [
          summaryItem("LP Signals Scored", d.lpSignalsScored ?? 0),
          summaryItem("Future Daily Brief", d.lpDailyBriefCandidates ?? 0),
          summaryItem("Future Urgent", d.lpUrgentCandidates ?? 0),
          summaryItem("Internal Only", d.lpInternalOnlySignals ?? 0),
          summaryItem("LP Policy Enabled", "No (v0)"),
          summaryItem("LP Public Broadcast", "Disabled"),
        ] : []),
      ],
      rows: operationRows.concat(results.map((r) => {
        const sq = r.signalQuality && typeof r.signalQuality === "object" ? r.signalQuality as Record<string, unknown> : null;
        return {
          title: `${String(r.poolName ?? r.poolId ?? "Pool")} — ${String(r.chain ?? "")}`,
          fields: [
            summaryItem("Provider", String(r.provider ?? "")),
            summaryItem("Pool Family", r.poolFamily ? String(r.poolFamily) : "—"),
            summaryItem("Pool", String(r.poolName ?? "")),
            summaryItem("Chain", String(r.chain ?? "")),
            summaryItem("Pair", String(r.assetPair ?? "")),
            summaryItem("Status", humanizeStatus(String(r.status ?? ""))),
            summaryItem("Latest Checked", r.latestCheckedAt ? new Date(r.latestCheckedAt as string).toLocaleTimeString() : "—"),
            summaryItem("Latest Success", r.latestSuccessAt ? new Date(r.latestSuccessAt as string).toLocaleTimeString() : "—"),
            summaryItem("Liquidity", r.liquidity ? String(r.liquidity) : "—"),
            summaryItem("Reserve0", r.reserve0 ? String(r.reserve0) : "—"),
            summaryItem("Reserve1", r.reserve1 ? String(r.reserve1) : "—"),
            summaryItem("Token0 Balance", r.token0Balance ? String(r.token0Balance) : "—"),
            summaryItem("Token1 Balance", r.token1Balance ? String(r.token1Balance) : "—"),
            summaryItem(
              "Coins",
              Array.isArray(r.coinSymbols) && r.coinSymbols.length > 0
                ? r.coinSymbols
                    .map((s, i) => s || String(Array.isArray(r.coins) ? r.coins[i] ?? `coin${i}` : `coin${i}`))
                    .join(", ")
                : "—",
            ),
            summaryItem(
              "Normalized Balances",
              Array.isArray(r.normalizedBalances) && r.normalizedBalances.length > 0
                ? r.normalizedBalances.map((v) => Number(v).toFixed(2)).join(", ")
                : "—",
            ),
            summaryItem("Fee Tier", r.fee != null ? `${Number(r.fee) / 10000}%` : "—"),
            summaryItem("Stable", r.stable == null ? "—" : (r.stable ? "Yes" : "No")),
            summaryItem("Tick", r.tick != null ? String(r.tick) : "—"),
            summaryItem("Tick Spacing", r.tickSpacing != null ? String(r.tickSpacing) : "—"),
            summaryItem("sqrtPriceX96", r.sqrtPriceX96 ? String(r.sqrtPriceX96) : "—"),
            summaryItem("Virtual Price", r.virtualPrice != null ? Number(r.virtualPrice).toFixed(6) : "—"),
            summaryItem("Amplification", r.amplification != null ? Number(r.amplification).toFixed(2) : "—"),
            summaryItem("Dominant Asset", r.dominantAsset ? String(r.dominantAsset) : "—"),
            summaryItem(
              "Dominant Share",
              r.dominantAssetSharePct != null ? `${Number(r.dominantAssetSharePct).toFixed(1)}%` : "—",
            ),
            summaryItem("Token0", r.token0Symbol ? `${String(r.token0Symbol)} (${String(r.token0Address ?? "").slice(0, 10)}…)` : String(r.token0Address ?? "—")),
            summaryItem("Token1", r.token1Symbol ? `${String(r.token1Symbol)} (${String(r.token1Address ?? "").slice(0, 10)}…)` : String(r.token1Address ?? "—")),
            summaryItem("Pool price (raw t1/t0)", r.rawPriceToken1PerToken0 != null ? Number(r.rawPriceToken1PerToken0).toExponential(6) : "—"),
            summaryItem("Pool price (raw t0/t1)", r.rawPriceToken0PerToken1 != null ? Number(r.rawPriceToken0PerToken1).toExponential(6) : "—"),
            summaryItem("Normalized price", r.normalizedPrice != null ? Number(r.normalizedPrice).toFixed(4) : "unavailable"),
            summaryItem("Human Price", r.humanPrice != null ? `${String(r.humanPriceLabel ?? "price")}: ${Number(r.humanPrice).toFixed(6)}` : "—"),
            summaryItem("Reader Path", r.selectorPath ? String(r.selectorPath) : "—"),
            summaryItem("Reader Version", r.readerVersion ? String(r.readerVersion) : "—"),
            ...(r.latestError ? [summaryItem("Error", String(r.latestError))] : []),
            summaryItem("RPC Configured", r.rpcConfigured ? "Yes" : "No"),
            summaryItem("Pool Address Present", r.poolAddressPresent ? "Yes" : "No"),
            summaryItem("Alerts Created", Number(d.alertsCreated ?? 0)),
            summaryItem("Alerts Updated", Number(d.alertsUpdated ?? 0)),
            summaryItem("Alerts Resolved", Number(d.alertsResolved ?? 0)),
            ...(sq ? [
              summaryItem("Alert Confidence", sq.confidence != null ? String(sq.confidence) : "—"),
              summaryItem("Quality Score", sq.qualityScore != null ? `${String(sq.qualityScore)}/100` : "—"),
              summaryItem("LP Policy Status", String(sq.lpPolicyStatus ?? "internal_only")),
              summaryItem("Broadcast Eligible", sq.broadcastEligible ? "Yes" : "No (v0)"),
              summaryItem("Broadcast Tier", String(sq.broadcastTier ?? "—")),
            ] : []),
          ],
        };
      })),
      errors: results.filter((r) => r.latestError).map((r) => String(r.latestError)),
      previewPosts: [],
      timestamp: new Date().toLocaleTimeString(),
    };
  }

  if ("destinationUrl" in d) {
    return {
      action: action.label,
      level: "success",
      message: "Destination created.",
      summary: [
        summaryItem("ID", String(d.id ?? "").slice(0, 20)),
        summaryItem("Name", d.name ?? ""),
        summaryItem("Channel", d.channel ?? ""),
        summaryItem("Enabled", d.enabled ? "Yes" : "No"),
        summaryItem("Min Severity", d.minimumSeverity ?? "watch"),
      ],
      rows: [],
      errors: [],
      previewPosts: extractPreviewPosts(data),
      timestamp: new Date().toLocaleTimeString(),
    };
  }

  if ("clientId" in d && "monitorTypes" in d) {
    const types = Array.isArray(d.monitorTypes) ? d.monitorTypes as string[] : [];
    return {
      action: action.label,
      level: "success",
      message: "Watchlist created.",
      summary: [
        summaryItem("ID", String(d.id ?? "").slice(0, 20)),
        summaryItem("Name", d.name ?? ""),
        summaryItem("Plan", String(d.plan ?? "").replace("_", " ")),
        summaryItem("Enabled", d.enabled ? "Yes" : "No"),
        summaryItem("Monitor Types", types.join(", ") || "any"),
        summaryItem("Min Severity", d.minimumSeverity ?? "watch"),
      ],
      rows: [],
      errors: [],
      previewPosts: extractPreviewPosts(data),
      timestamp: new Date().toLocaleTimeString(),
    };
  }

  if ("status" in d && "plan" in d && !("briefDate" in d) && !("dedupeKey" in d) && !("destinationUrl" in d)) {
    return {
      action: action.label,
      level: "success",
      message: "Radar client updated.",
      summary: [
        summaryItem("ID", String(d.id ?? "").slice(0, 20)),
        summaryItem("Name", d.name ?? ""),
        summaryItem("Status", d.status ?? ""),
        summaryItem("Plan", String(d.plan ?? "").replace("_", " ")),
        summaryItem("Email", d.primaryContactEmail ?? ""),
      ],
      rows: [],
      errors: [],
      previewPosts: extractPreviewPosts(data),
      timestamp: new Date().toLocaleTimeString(),
    };
  }

  if ("briefDate" in d) {
    return {
      action: action.label,
      level: "success",
      message: "Daily brief action completed.",
      summary: [
        summaryItem("ID", String(d.id ?? "").slice(0, 16)),
        summaryItem("Status", d.status ?? ""),
        summaryItem("Total Alerts", d.totalAlerts ?? 0),
        summaryItem("Headline", String(d.headline ?? "").slice(0, 120)),
      ],
      rows: [],
      errors: [],
      previewPosts: extractPreviewPosts(data),
      timestamp: new Date().toLocaleTimeString(),
    };
  }

  if ("dailyBriefId" in d && "candidatesIncluded" in d) {
    const exclusionReasons = Array.isArray(d.exclusionReasons) ? d.exclusionReasons.map((item) => String(item)) : [];
    return {
      action: action.label,
      level: Number(d.candidatesIncluded ?? 0) > 0 ? "success" : "warning",
      message: Number(d.candidatesIncluded ?? 0) > 0
        ? "Broadcast brief generated from current oracle broadcast candidates."
        : "Broadcast brief generation completed, but no oracle candidates qualified for inclusion.",
      summary: [
        summaryItem("Raw Alerts", d.rawAlerts ?? 0),
        summaryItem("Included", d.candidatesIncluded ?? 0),
        summaryItem("Excluded", d.candidatesExcluded ?? 0),
        summaryItem("Brief ID", String(d.dailyBriefId ?? "").slice(0, 16)),
        summaryItem("Brief Status", d.dailyBriefStatus ?? ""),
        summaryItem("X Preview", d.xTwitterPreviewAvailable ? "Yes" : "No"),
      ],
      rows: exclusionReasons.length > 0
        ? exclusionReasons.slice(0, 4).map((reason, index) => ({
            title: `Exclusion Reason ${index + 1}`,
            fields: [summaryItem("Reason", reason)],
          }))
        : [],
      errors: [],
      previewPosts: extractPreviewPosts(data),
      timestamp: new Date().toLocaleTimeString(),
    };
  }

  if ("dedupeKey" in d) {
    return {
      action: action.label,
      level: "success",
      message: "Alert action completed.",
      summary: [
        summaryItem("ID", String(d.id ?? "").slice(0, 16)),
        summaryItem("Severity", d.severity ?? ""),
        summaryItem("Status", d.status ?? ""),
        summaryItem("Monitor", d.monitorType ?? ""),
        summaryItem("Confidence", d.confidence ? `${d.confidence}%` : "n/a"),
        summaryItem("Summary", String(d.summary ?? "").slice(0, 120)),
      ],
      rows: [],
      errors: [],
      previewPosts: extractPreviewPosts(data),
      timestamp: new Date().toLocaleTimeString(),
    };
  }

  if ("preview" in d && "delivery" in d) {
    const delivery = (d.delivery ?? {}) as Record<string, unknown>;
    return {
      action: action.label,
      level: delivery.status === "failed" ? "warning" : "success",
      message: "Distribution action completed.",
      summary: [
        summaryItem("Status", delivery.status ?? ""),
        summaryItem("Destination", delivery.destination ?? ""),
        summaryItem("Posts", delivery.postCount ?? 0),
        summaryItem("Error", String(delivery.error ?? "None").slice(0, 120)),
      ],
      rows: [],
      errors: delivery.error ? [String(delivery.error)] : [],
      previewPosts: extractPreviewPosts(data),
      timestamp: new Date().toLocaleTimeString(),
    };
  }

  if ("briefId" in d && "posts" in d) {
    return {
      action: action.label,
      level: "success",
      message: "Preview generated.",
      summary: [
        summaryItem("Mode", d.mode ?? ""),
        summaryItem("Destination", d.destination ?? ""),
        summaryItem("Posts", d.postCount ?? 0),
      ],
      rows: [],
      errors: [],
      previewPosts: extractPreviewPosts(data),
      timestamp: new Date().toLocaleTimeString(),
    };
  }

  return {
    action: action.label,
    level: "success",
    message: "Action completed.",
    summary: [],
    rows: [],
    errors: [],
    previewPosts: extractPreviewPosts(data),
    timestamp: new Date().toLocaleTimeString(),
  };
}

function levelColors(level: ActionLevel): { border: string; background: string; text: string } {
  if (level === "error") {
    return {
      border: "rgba(239,68,68,0.25)",
      background: "rgba(20,8,8,0.88)",
      text: "#FCA5A5",
    };
  }
  if (level === "warning") {
    return {
      border: "rgba(245,158,11,0.28)",
      background: "rgba(24,18,8,0.88)",
      text: "#FCD34D",
    };
  }
  return {
    border: "rgba(34,197,94,0.25)",
    background: "rgba(8,20,12,0.88)",
    text: "#86EFAC",
  };
}

export function RadarOperatorConsole({ section }: { section: string }) {
  const session = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState<ActionKey | "refresh" | null>(null);
  const [lastResult, setLastResult] = useState<ActionResult | null>(null);
  const [lastPreviewContext, setLastPreviewContext] = useState<PreviewApprovalContext | null>(null);
  const [selectedRowTab, setSelectedRowTab] = useState(0);
  const [distributionSelection, setDistributionSelection] = useState<DistributionSelection>({
    discord: true,
    telegram: true,
    x: false,
    dryRun: true,
  });

  const isOperator = session?.permissions.canViewGlobalModules ?? false;

  const runAction = useCallback(
    async (action: ActionDef) => {
      if (action.requiresPreviewContext && !lastPreviewContext) {
        setLastResult({
          action: action.label,
          level: "warning",
          message: "Run Full Radar Preview or Preview Public Radar Alerts first.",
          summary: [],
          rows: [],
          errors: [],
          previewPosts: [],
          timestamp: new Date().toLocaleTimeString(),
        });
        return;
      }
      if (action.key === "public-alerts-preview-send-approved") {
        const requestedChannels = [
          distributionSelection.discord ? "discord" : null,
          distributionSelection.telegram ? "telegram" : null,
          distributionSelection.x ? "x" : null,
        ].filter(Boolean);
        if (requestedChannels.length === 0) {
          setLastResult({
            action: action.label,
            level: "warning",
            message: "Select at least one public delivery channel before sending the approved thread.",
            summary: [],
            rows: [],
            errors: [],
            previewPosts: [],
            timestamp: new Date().toLocaleTimeString(),
          });
          return;
        }
      }
      setLoading(action.key);
      setLastResult(null);
      const token = getSessionToken();
      const payload = action.key === "public-alerts-preview-send-approved"
        ? {
            previewHash: lastPreviewContext?.previewHash,
            approvalId: lastPreviewContext?.approvalId,
            channels: [
              distributionSelection.discord ? "discord" : null,
              distributionSelection.telegram ? "telegram" : null,
              distributionSelection.x ? "x" : null,
            ].filter(Boolean),
            dryRun: distributionSelection.dryRun,
          }
        : action.requiresPreviewContext
          ? {
            previewHash: lastPreviewContext?.previewHash,
          }
          : undefined;

      try {
        const res = await fetch("/api/radar/actions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { "X-SCE-Session": token } : {}),
          },
          body: JSON.stringify({ action: action.key, payload }),
        });

        const text = await res.text();
        let data: unknown;
        try {
          data = JSON.parse(text);
        } catch {
          data = null;
        }

        if (!res.ok) {
          const errMsg =
            data && typeof data === "object" && "error" in (data as object)
              ? String((data as Record<string, unknown>).error)
              : `Request failed (${res.status})`;
          setLastResult({
            action: action.label,
            level: "error",
            message: errMsg,
            summary: [],
            rows: [],
            errors: [],
            previewPosts: [],
            timestamp: new Date().toLocaleTimeString(),
          });
          setSelectedRowTab(0);
          router.refresh();
          return;
        }

        const nextResult = buildActionResult(action, data);
        if (nextResult.approvalContext) {
          setLastPreviewContext((current) => ({
            previewHash: nextResult.approvalContext?.previewHash ?? current?.previewHash ?? "",
            threadHash: nextResult.approvalContext?.threadHash ?? current?.threadHash ?? "",
            postCount: nextResult.approvalContext?.postCount ?? current?.postCount ?? 0,
            copyText: nextResult.approvalContext?.copyText || current?.copyText || "",
            approvalStatus: nextResult.approvalContext?.approvalStatus ?? current?.approvalStatus ?? "not_approved",
            approvalId: nextResult.approvalContext?.approvalId ?? current?.approvalId ?? null,
            approvedAt: nextResult.approvalContext?.approvedAt ?? current?.approvedAt ?? null,
            expiresAt: nextResult.approvalContext?.expiresAt ?? current?.expiresAt ?? null,
            previewChanged: nextResult.approvalContext?.previewChanged ?? current?.previewChanged ?? false,
          }));
        }
        setLastResult(nextResult);
        setSelectedRowTab(0);
        router.refresh();
      } catch (err) {
        setLastResult({
          action: action.label,
          level: "error",
          message: err instanceof Error ? err.message : "Unexpected error.",
          summary: [],
          rows: [],
          errors: [],
          previewPosts: [],
          timestamp: new Date().toLocaleTimeString(),
        });
        setSelectedRowTab(0);
      } finally {
        setLoading(null);
      }
    },
    [distributionSelection, lastPreviewContext, router],
  );

  const handleRefresh = useCallback(() => {
    setLoading("refresh");
    router.refresh();
    setTimeout(() => setLoading(null), 800);
  }, [router]);

  if (!isOperator) return null;

  const groups =
    section === "radar-monitor"
      ? UNIFIED_RADAR_GROUPS
      : section === "bridge-monitor"
      ? BRIDGE_GROUPS
      : section === "lp-monitor"
        ? LP_GROUPS
        : section === "radar-service"
          ? SERVICE_GROUPS
          : ORACLE_GROUPS;
  const isAnyLoading = loading !== null;
  const colors = lastResult ? levelColors(lastResult.level) : null;

  return (
    <section
      style={{
        background: "linear-gradient(180deg, rgba(15,18,28,0.98), rgba(8,10,14,0.98))",
        border: "1px solid rgba(212,175,55,0.18)",
        borderRadius: 10,
        padding: 18,
        display: "grid",
        gap: 16,
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
            OPERATOR CONSOLE
          </div>
          <div style={{ fontSize: 11, color: "rgba(203,213,225,0.7)", lineHeight: 1.5 }}>
            {section === "radar-service"
              ? "Use dev-safe sample client, watchlist, and delivery actions for service-side validation."
              : "Run monitors, smoke checks, or diagnostics and review exactly what was checked."}
          </div>
        </div>
        <button
          type="button"
          onClick={handleRefresh}
          disabled={isAnyLoading}
          style={btnStyle(loading === "refresh", false)}
        >
          {loading === "refresh" ? "Refreshing..." : "Refresh Data"}
        </button>
      </div>

      <div style={{ display: "grid", gap: 12 }}>
        {groups.map((group) => (
          <div key={group.label}>
            <div
              style={{
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: "0.12em",
                color: "rgba(148,163,184,0.55)",
                marginBottom: 6,
              }}
            >
              {group.label.toUpperCase()}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {group.actions.map((action) => (
                <button
                  key={action.key}
                  type="button"
                  title={action.description}
                  onClick={() => void runAction(action)}
                  disabled={isAnyLoading}
                  style={btnStyle(loading === action.key, true)}
                >
                  {loading === action.key ? "Running..." : action.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {lastResult && colors ? (
        <div
          style={{
            borderRadius: 8,
            border: `1px solid ${colors.border}`,
            background: colors.background,
            padding: "14px 16px",
            display: "grid",
            gap: 12,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 8,
            }}
          >
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.1em",
                color: colors.text,
              }}
            >
              {lastResult.level.toUpperCase()} - {lastResult.action.toUpperCase()}
            </div>
            <div style={{ fontSize: 9, color: "rgba(148,163,184,0.6)", letterSpacing: "0.08em" }}>
              {lastResult.timestamp}
            </div>
          </div>

          <div style={{ fontSize: 11, color: "#E2E8F0", lineHeight: 1.6 }}>
            {lastResult.message}
          </div>

          {lastPreviewContext ? (
            <div style={{ display: "grid", gap: 10 }}>
              <div
                style={{
                  borderRadius: 8,
                  border: "1px solid rgba(148,163,184,0.16)",
                  background: "rgba(15,23,42,0.32)",
                  padding: "10px 12px",
                  display: "grid",
                  gap: 8,
                }}
              >
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", color: "#E2E8F0" }}>
                  SEND APPROVED PUBLIC THREAD
                </div>
                <div style={{ fontSize: 11, color: "rgba(226,232,240,0.82)", lineHeight: 1.6 }}>
                  Only approved preview threads can be sent. No scheduling or auto-send is enabled.
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                  {([
                    ["discord", "Discord"],
                    ["telegram", "Telegram"],
                    ["x", "X/Twitter"],
                    ["dryRun", "Dry Run Send"],
                  ] as const).map(([key, label]) => (
                    <label
                      key={key}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        fontSize: 11,
                        color: "#CBD5E1",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={distributionSelection[key]}
                        onChange={(event) =>
                          setDistributionSelection((current) => ({
                            ...current,
                            [key]: event.target.checked,
                          }))
                        }
                      />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {PUBLIC_PREVIEW_ACTIONS.filter((action) => action.requiresPreviewContext).map((action) => (
                <button
                  key={`context-${action.key}`}
                  type="button"
                  title={action.description}
                  onClick={() => void runAction(action)}
                  disabled={isAnyLoading}
                  style={btnStyle(loading === action.key, true)}
                >
                  {loading === action.key ? "Running..." : action.label}
                </button>
              ))}
              </div>
            </div>
          ) : null}

          {lastResult.summary.length > 0 ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
                gap: 8,
              }}
            >
              {lastResult.summary.map((item) => (
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
                  <div style={{ fontSize: 11, color: "#E2E8F0", fontWeight: 600, overflowWrap: "anywhere" }}>
                    {item.value}
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {lastResult.errors.length > 0 ? (
            <div style={{ display: "grid", gap: 6 }}>
              <div
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  color: "rgba(148,163,184,0.55)",
                }}
              >
                ERRORS
              </div>
              {lastResult.errors.map((error, index) => (
                <div
                  key={`${error}-${index}`}
                  style={{
                    borderRadius: 6,
                    border: "1px solid rgba(148,163,184,0.14)",
                    background: "rgba(15,23,42,0.55)",
                    padding: "10px 12px",
                    fontSize: 11,
                    color: "#CBD5E1",
                    lineHeight: 1.6,
                    overflowWrap: "anywhere",
                  }}
                >
                  {error}
                </div>
              ))}
            </div>
          ) : null}

          {lastResult.rows.length > 0 ? (
            <div style={{ display: "grid", gap: 8 }}>
              <div
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  color: "rgba(148,163,184,0.55)",
                }}
              >
                RESULT DETAILS
              </div>
              <div
                style={{
                  display: "flex",
                  gap: 4,
                  overflowX: "auto",
                  paddingBottom: 2,
                }}
              >
                {lastResult.rows.map((row, index) => (
                  <button
                    key={`tab-${row.title}-${index}`}
                    type="button"
                    onClick={() => setSelectedRowTab(index)}
                    style={{
                      flexShrink: 0,
                      fontSize: 10,
                      fontWeight: selectedRowTab === index ? 700 : 500,
                      padding: "5px 10px",
                      borderRadius: 5,
                      border: selectedRowTab === index
                        ? "1px solid rgba(148,163,184,0.35)"
                        : "1px solid rgba(148,163,184,0.14)",
                      background: selectedRowTab === index
                        ? "rgba(148,163,184,0.12)"
                        : "transparent",
                      color: selectedRowTab === index ? "#E2E8F0" : "rgba(148,163,184,0.55)",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                      transition: "background 0.12s, color 0.12s",
                    }}
                  >
                    {row.title}
                  </button>
                ))}
              </div>
              {lastResult.rows[selectedRowTab] ? (
                <div
                  style={{
                    borderRadius: 6,
                    border: "1px solid rgba(148,163,184,0.14)",
                    background: "rgba(15,23,42,0.55)",
                    padding: "12px 14px",
                    display: "grid",
                    gap: 8,
                  }}
                >
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#E2E8F0" }}>
                    {lastResult.rows[selectedRowTab].title}
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
                      gap: 8,
                    }}
                  >
                    {lastResult.rows[selectedRowTab].fields.map((field) => (
                      <div key={field.label}>
                        <div
                          style={{
                            fontSize: 9,
                            color: "rgba(148,163,184,0.72)",
                            letterSpacing: "0.08em",
                            marginBottom: 3,
                          }}
                        >
                          {field.label.toUpperCase()}
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            color: "#CBD5E1",
                            lineHeight: 1.55,
                            overflowWrap: "anywhere",
                          }}
                        >
                          {field.value}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          {lastResult.previewPosts.length > 0 ? (
            <div style={{ display: "grid", gap: 6 }}>
              <div
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  color: "rgba(148,163,184,0.55)",
                }}
              >
                POST PREVIEW
              </div>
              {lastResult.previewPosts.map((post, index) => (
                <div
                  key={`${post}-${index}`}
                  style={{
                    borderRadius: 6,
                    border: "1px solid rgba(148,163,184,0.14)",
                    background: "rgba(15,23,42,0.55)",
                    padding: "10px 12px",
                    fontSize: 11,
                    color: "#CBD5E1",
                    lineHeight: 1.65,
                    whiteSpace: "pre-wrap",
                    overflowWrap: "anywhere",
                  }}
                >
                  {lastResult.previewPosts.length > 1 ? (
                    <span
                      style={{
                        display: "block",
                        fontSize: 9,
                        color: "rgba(148,163,184,0.5)",
                        letterSpacing: "0.08em",
                        marginBottom: 5,
                      }}
                    >
                      POST {index + 1}
                    </span>
                  ) : null}
                  {post}
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

function btnStyle(active: boolean, isPrimary: boolean): CSSProperties {
  return {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.06em",
    padding: "7px 13px",
    borderRadius: 6,
    border: isPrimary
      ? active
        ? "1px solid rgba(212,175,55,0.5)"
        : "1px solid rgba(212,175,55,0.28)"
      : "1px solid rgba(148,163,184,0.22)",
    background: isPrimary
      ? active
        ? "rgba(212,175,55,0.18)"
        : "rgba(212,175,55,0.08)"
      : "rgba(15,23,42,0.55)",
    color: isPrimary ? (active ? "#F5E7A1" : "#D4AF37") : "#94A3B8",
    cursor: active ? "wait" : "pointer",
    opacity: active ? 0.8 : 1,
    transition: "opacity 0.15s, background 0.15s",
  };
}
