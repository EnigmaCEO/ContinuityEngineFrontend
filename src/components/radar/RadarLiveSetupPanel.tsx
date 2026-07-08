"use client";

import type { CSSProperties } from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useSession } from "@/components/layout/SessionContext";
import type {
  LiveDeliveryRunResult,
  RadarClient,
  RadarClientCreateInput,
  RadarClientEntitlementSummary,
  RadarClientStatus,
  RadarClientUpdateInput,
  RadarDeliveryDestination,
  RadarDeliveryDestinationCreateInput,
  RadarLiveDelivery,
  RadarLiveDeliveryChannel,
  RadarSeverity,
  RadarWatchlist,
  RadarWatchlistCreateInput,
  RadarWatchlistDeliveryChannel,
  RadarWatchlistMatch,
  RadarWatchlistPlan,
  WatchlistMatchRunResult,
} from "@/lib/radar/types";

const PLAN_OPTIONS: RadarWatchlistPlan[] = ["free", "radar_live", "radar_pro", "managed"];
const STATUS_OPTIONS: RadarClientStatus[] = ["trial", "active", "past_due", "suspended", "canceled"];
const SEVERITY_OPTIONS: RadarSeverity[] = ["watch", "warning", "critical"];
const DESTINATION_CHANNEL_OPTIONS: RadarLiveDeliveryChannel[] = ["discord", "telegram", "webhook"];
const WATCHLIST_CHANNEL_OPTIONS: RadarWatchlistDeliveryChannel[] = ["discord", "telegram", "webhook"];
const MONITOR_TYPE_OPTIONS = ["oracle", "bridge", "governance", "dependency", "sce_heartbeat"] as const;

interface SetupMessage {
  tone: "success" | "error";
  title: string;
  text: string;
  reason?: string;
  detail?: string;
}

interface ActionErrorPayload {
  error?: string;
  reason?: string;
  detail?: {
    detail?: string;
    reason?: string;
  };
}

interface ClientDraft {
  plan: RadarWatchlistPlan;
  status: RadarClientStatus;
}

interface Props {
  clients: RadarClient[];
  entitlementSummary: RadarClientEntitlementSummary | null;
  watchlists: RadarWatchlist[];
  watchlistMatches: RadarWatchlistMatch[];
  deliveryDestinations: RadarDeliveryDestination[];
  liveDeliveries: RadarLiveDelivery[];
}

function getSessionToken(sessionToken?: string | null): string | null {
  if (sessionToken) return sessionToken;
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("sce_session_token");
}

function parseList(value: string): string[] {
  return value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function toggleValue<T extends string>(values: T[], value: T): T[] {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}

function formatPlanLabel(value: string): string {
  return value.replace(/_/g, " ");
}

function formatChannelLabel(value: string): string {
  const labels: Record<string, string> = {
    discord: "Discord",
    telegram: "Telegram",
    webhook: "Webhook",
  };
  return labels[value] ?? value;
}

function formatTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function normalizeError(error: unknown): SetupMessage {
  if (error && typeof error === "object" && "message" in error) {
    const payload = error as { message: string; reason?: string; detail?: string };
    return {
      tone: "error",
      title: "Action blocked",
      text: payload.message,
      reason: payload.reason,
      detail: payload.detail,
    };
  }
  return {
    tone: "error",
    title: "Action blocked",
    text: error instanceof Error ? error.message : "Unexpected error.",
  };
}

async function parseResponse<T>(res: Response): Promise<T> {
  const text = await res.text();
  if (!text) {
    return null as T;
  }
  return JSON.parse(text) as T;
}

export function RadarLiveSetupPanel({
  clients,
  entitlementSummary,
  watchlists,
  watchlistMatches,
  deliveryDestinations,
  liveDeliveries,
}: Props) {
  const session = useSession();
  const router = useRouter();
  const [createdClients, setCreatedClients] = useState<RadarClient[]>([]);
  const [createdWatchlists, setCreatedWatchlists] = useState<RadarWatchlist[]>([]);
  const [createdDestinations, setCreatedDestinations] = useState<RadarDeliveryDestination[]>([]);
  const [selectedClientId, setSelectedClientId] = useState(entitlementSummary?.clientId ?? clients[0]?.id ?? "");
  const [selectedWatchlistId, setSelectedWatchlistId] = useState("");
  const [clientDrafts, setClientDrafts] = useState<Record<string, ClientDraft>>({});
  const [entitlementCache, setEntitlementCache] = useState<Record<string, RadarClientEntitlementSummary>>(
    entitlementSummary ? { [entitlementSummary.clientId]: entitlementSummary } : {},
  );
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [message, setMessage] = useState<SetupMessage | null>(null);

  const [clientForm, setClientForm] = useState<RadarClientCreateInput>({
    name: "",
    plan: "radar_live",
    status: "trial",
    primaryContactEmail: "",
    telegramHandle: "",
    discordContact: "",
    notes: "",
    billingProvider: "manual",
  });
  const [watchlistForm, setWatchlistForm] = useState({
    name: "",
    monitorTypes: [] as string[],
    sources: "",
    assets: "",
    chains: "",
    routes: "",
    reasonCodes: "",
    minimumSeverity: "warning" as RadarSeverity,
    deliveryChannels: ["discord"] as RadarWatchlistDeliveryChannel[],
  });
  const [destinationForm, setDestinationForm] = useState({
    name: "",
    channel: "discord" as RadarLiveDeliveryChannel,
    destinationUrl: "",
    minimumSeverity: "warning" as RadarSeverity,
  });

  const isOperator = session?.permissions.canViewGlobalModules ?? false;

  const clientRecords = [
    ...createdClients,
    ...clients.filter((client) => !createdClients.some((item) => item.id === client.id)),
  ];
  const watchlistRecords = [
    ...createdWatchlists,
    ...watchlists.filter((watchlist) => !createdWatchlists.some((item) => item.id === watchlist.id)),
  ];
  const destinationRecords = [
    ...createdDestinations,
    ...deliveryDestinations.filter((destination) => !createdDestinations.some((item) => item.id === destination.id)),
  ];

  const effectiveSelectedClientId = selectedClientId || clientRecords[0]?.id || "";
  const selectedClient = clientRecords.find((client) => client.id === effectiveSelectedClientId) ?? null;
  const selectedClientWatchlists = watchlistRecords.filter((watchlist) => watchlist.clientId === effectiveSelectedClientId);
  const selectedClientDestinations = destinationRecords.filter((destination) => destination.clientId === effectiveSelectedClientId);
  const selectedClientPendingMatches = watchlistMatches.filter(
    (match) => match.clientId === effectiveSelectedClientId && match.status === "pending_delivery",
  );
  const selectedClientLiveDeliveries = liveDeliveries.filter((delivery) => delivery.clientId === effectiveSelectedClientId);
  const effectiveSelectedWatchlistId =
    selectedWatchlistId && selectedClientWatchlists.some((watchlist) => watchlist.id === selectedWatchlistId)
      ? selectedWatchlistId
      : selectedClientWatchlists[0]?.id ?? "";

  const selectedEntitlements =
    entitlementCache[effectiveSelectedClientId] ??
    (entitlementSummary?.clientId === effectiveSelectedClientId ? entitlementSummary : null);
  const selectedClientDraft =
    (selectedClient ? clientDrafts[selectedClient.id] : null) ??
    (selectedClient
      ? {
          plan: selectedClient.plan,
          status: selectedClient.status,
        }
      : null);

  useEffect(() => {
    if (!effectiveSelectedClientId || entitlementCache[effectiveSelectedClientId]) {
      return;
    }

    let active = true;
    const token = getSessionToken(session?.sessionToken);
    if (!token) return;

    void (async () => {
      try {
        const res = await fetch(
          `/api/radar/actions?kind=client-entitlements&clientId=${encodeURIComponent(effectiveSelectedClientId)}`,
          {
            method: "GET",
            headers: { "X-SCE-Session": token },
            cache: "no-store",
          },
        );
        const data = await parseResponse<RadarClientEntitlementSummary | ActionErrorPayload>(res);
        if (!active || !res.ok) return;
        setEntitlementCache((current) => ({
          ...current,
          [effectiveSelectedClientId]: data as RadarClientEntitlementSummary,
        }));
      } catch {
        return;
      }
    })();

    return () => {
      active = false;
    };
  }, [effectiveSelectedClientId, entitlementCache, session?.sessionToken]);

  if (!isOperator) return null;

  async function runAction<T>(action: string, payload?: unknown): Promise<T> {
    const token = getSessionToken(session?.sessionToken);
    if (!token) {
      throw new Error("Authentication required.");
    }

    const res = await fetch("/api/radar/actions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-SCE-Session": token,
      },
      body: JSON.stringify(payload ? { action, payload } : { action }),
    });

    const data = await parseResponse<T | ActionErrorPayload>(res);
    if (!res.ok) {
      const body = (data ?? {}) as ActionErrorPayload;
      throw {
        message: body.error ?? `Request failed (${res.status})`,
        reason: body.reason ?? body.detail?.reason,
        detail: body.detail?.detail,
      };
    }

    return data as T;
  }

  async function refreshEntitlements(clientId: string) {
    const token = getSessionToken(session?.sessionToken);
    if (!token) return;

    const res = await fetch(`/api/radar/actions?kind=client-entitlements&clientId=${encodeURIComponent(clientId)}`, {
      method: "GET",
      headers: { "X-SCE-Session": token },
      cache: "no-store",
    });
    if (!res.ok) return;
    const data = await parseResponse<RadarClientEntitlementSummary>(res);
    setEntitlementCache((current) => ({ ...current, [clientId]: data }));
  }

  async function handleCreateClient() {
    setLoadingAction("create-client");
    setMessage(null);
    try {
      const created = await runAction<RadarClient>("create-client", {
        name: clientForm.name.trim(),
        plan: clientForm.plan,
        status: clientForm.status,
        primaryContactEmail: clientForm.primaryContactEmail?.trim() || null,
        telegramHandle: clientForm.telegramHandle?.trim() || null,
        discordContact: clientForm.discordContact?.trim() || null,
        notes: clientForm.notes?.trim() || null,
        billingProvider: clientForm.billingProvider ?? "manual",
      });
      setCreatedClients((current) => [created, ...current.filter((client) => client.id !== created.id)]);
      setSelectedClientId(created.id);
      setClientForm((current) => ({
        ...current,
        name: "",
        primaryContactEmail: "",
        telegramHandle: "",
        discordContact: "",
        notes: "",
      }));
      await refreshEntitlements(created.id);
      setMessage({
        tone: "success",
        title: "Client created",
        text: `${created.name} is ready for watchlists and delivery setup.`,
      });
      router.refresh();
    } catch (error) {
      setMessage(normalizeError(error));
    } finally {
      setLoadingAction(null);
    }
  }

  async function handleUpdateClient() {
    if (!selectedClient || !selectedClientDraft) {
      setMessage({
        tone: "error",
        title: "Action blocked",
        text: "Select a Radar client account before updating plan or status.",
      });
      return;
    }

    setLoadingAction("update-client");
    setMessage(null);
    try {
      const payload: RadarClientUpdateInput & { clientId: string } = {
        clientId: selectedClient.id,
        plan: selectedClientDraft.plan,
        status: selectedClientDraft.status,
      };
      const updated = await runAction<RadarClient>("update-client", payload);
      setCreatedClients((current) => [updated, ...current.filter((client) => client.id !== updated.id)]);
      setClientDrafts((current) => ({
        ...current,
        [updated.id]: { plan: updated.plan, status: updated.status },
      }));
      await refreshEntitlements(updated.id);
      setMessage({
        tone: "success",
        title: "Client updated",
        text: `${updated.name} is now ${formatPlanLabel(updated.plan)} / ${formatPlanLabel(updated.status)}.`,
      });
      router.refresh();
    } catch (error) {
      setMessage(normalizeError(error));
    } finally {
      setLoadingAction(null);
    }
  }

  async function handleCreateWatchlist() {
    if (!selectedClient) {
      setMessage({
        tone: "error",
        title: "Action blocked",
        text: "Select a client account before creating a watchlist.",
      });
      return;
    }

    setLoadingAction("create-watchlist");
    setMessage(null);
    try {
      const payload: RadarWatchlistCreateInput = {
        clientId: selectedClient.id,
        name: watchlistForm.name.trim(),
        enabled: true,
        plan: selectedEntitlements?.plan ?? selectedClient.plan,
        monitorTypes: watchlistForm.monitorTypes,
        sources: parseList(watchlistForm.sources),
        assets: parseList(watchlistForm.assets),
        chains: parseList(watchlistForm.chains),
        routes: parseList(watchlistForm.routes),
        reasonCodes: parseList(watchlistForm.reasonCodes).map((value) => value.toUpperCase()),
        minimumSeverity: watchlistForm.minimumSeverity,
        deliveryChannels: watchlistForm.deliveryChannels,
      };
      const created = await runAction<RadarWatchlist>("create-watchlist", payload);
      setCreatedWatchlists((current) => [created, ...current.filter((watchlist) => watchlist.id !== created.id)]);
      setSelectedWatchlistId(created.id);
      await refreshEntitlements(created.clientId);
      setMessage({
        tone: "success",
        title: "Watchlist created",
        text: `${created.name} is monitoring ${created.monitorTypes.join(", ") || "all Radar signals"}.`,
      });
      router.refresh();
    } catch (error) {
      setMessage(normalizeError(error));
    } finally {
      setLoadingAction(null);
    }
  }

  async function handleCreateDestination() {
    if (!selectedClient) {
      setMessage({
        tone: "error",
        title: "Action blocked",
        text: "Select a client account before creating a delivery destination.",
      });
      return;
    }

    setLoadingAction("create-destination");
    setMessage(null);
    try {
      const payload: RadarDeliveryDestinationCreateInput = {
        clientId: selectedClient.id,
        name: destinationForm.name.trim(),
        enabled: true,
        channel: destinationForm.channel,
        destinationUrl: destinationForm.destinationUrl.trim(),
        minimumSeverity: destinationForm.minimumSeverity,
        monitorTypes: [],
        sources: [],
        assets: [],
        chains: [],
        routes: [],
      };
      const created = await runAction<RadarDeliveryDestination>("create-destination", payload);
      setCreatedDestinations((current) => [created, ...current.filter((destination) => destination.id !== created.id)]);
      await refreshEntitlements(created.clientId);
      setMessage({
        tone: "success",
        title: "Destination created",
        text: `${created.name} is ready for ${formatChannelLabel(created.channel)} delivery.`,
      });
      router.refresh();
    } catch (error) {
      setMessage(normalizeError(error));
    } finally {
      setLoadingAction(null);
    }
  }

  async function handleMatchAlerts() {
    if (!effectiveSelectedClientId) {
      setMessage({
        tone: "error",
        title: "Action blocked",
        text: "Select a client account before matching active alerts.",
      });
      return;
    }

    setLoadingAction("match-alerts");
    setMessage(null);
    try {
      const result = await runAction<WatchlistMatchRunResult>("match-selected-watchlists", {
        clientId: effectiveSelectedClientId,
        watchlistId: effectiveSelectedWatchlistId || null,
      });
      setMessage({
        tone: "success",
        title: "Matching complete",
        text: `${result.matchesCreated} created, ${result.matchesDeduped} deduped, ${result.errors.length} errors.`,
      });
      router.refresh();
    } catch (error) {
      setMessage(normalizeError(error));
    } finally {
      setLoadingAction(null);
    }
  }

  async function handleDeliverPending() {
    if (!effectiveSelectedClientId) {
      setMessage({
        tone: "error",
        title: "Action blocked",
        text: "Select a client account before delivering pending matches.",
      });
      return;
    }

    setLoadingAction("deliver-pending");
    setMessage(null);
    try {
      const result = await runAction<LiveDeliveryRunResult>("deliver-selected-pending", {
        clientId: effectiveSelectedClientId,
        watchlistId: effectiveSelectedWatchlistId || null,
      });
      setMessage({
        tone: "success",
        title: "Delivery run complete",
        text: `${result.deliveriesSent} sent, ${result.deliveriesSkipped} skipped, ${result.deliveriesFailed} failed.`,
      });
      router.refresh();
    } catch (error) {
      setMessage(normalizeError(error));
    } finally {
      setLoadingAction(null);
    }
  }

  function handleRefresh() {
    setLoadingAction("refresh");
    router.refresh();
    setTimeout(() => setLoadingAction(null), 700);
  }

  return (
    <section style={shellStyle}>
      <div style={headerRowStyle}>
        <div>
          <div style={eyebrowStyle}>RADAR SERVICE OPS</div>
          <div style={subtleTextStyle}>
            Service operations workspace for Radar client accounts, watchlists, delivery destinations, live delivery,
            and entitlement tracking.
          </div>
        </div>
        <button
          type="button"
          onClick={handleRefresh}
          disabled={loadingAction !== null}
          style={secondaryButtonStyle(loadingAction === "refresh")}
        >
          {loadingAction === "refresh" ? "Refreshing..." : "Refresh Radar Data"}
        </button>
      </div>

      {message ? (
        <div
          style={{
            borderRadius: 8,
            border: `1px solid ${message.tone === "success" ? "rgba(34,197,94,0.24)" : "rgba(249,115,22,0.24)"}`,
            background: message.tone === "success" ? "rgba(8,20,12,0.88)" : "rgba(24,12,8,0.88)",
            padding: "12px 14px",
            display: "grid",
            gap: 6,
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.1em",
              color: message.tone === "success" ? "#86EFAC" : "#FDBA74",
            }}
          >
            {message.title.toUpperCase()}
          </div>
          <div style={{ fontSize: 11, color: "#E2E8F0", lineHeight: 1.6 }}>{message.text}</div>
          {message.reason ? (
            <div style={{ fontSize: 10, color: "rgba(203,213,225,0.76)", letterSpacing: "0.06em" }}>
              REASON: {message.reason}
            </div>
          ) : null}
          {message.detail ? (
            <div style={{ fontSize: 10, color: "rgba(148,163,184,0.76)", lineHeight: 1.6 }}>{message.detail}</div>
          ) : null}
        </div>
      ) : null}

      <div style={gridStyle}>
        <section style={cardStyle}>
          <SectionHeader
            title="Client Accounts"
            subtitle="Select a Radar client account, create a new one, and update plan/status."
          />

          <SelectField
            label="Selected Client"
            value={effectiveSelectedClientId}
            onChange={(value) => setSelectedClientId(value)}
            options={clientRecords.map((client) => ({
              value: client.id,
              label: `${client.name} (${formatPlanLabel(client.plan)})`,
            }))}
            placeholder="Select client account"
          />

          <div style={compactGridStyle}>
            <SelectField
              label="Client Plan"
              value={selectedClientDraft?.plan ?? ""}
              onChange={(value) =>
                selectedClient
                  ? setClientDrafts((current) => ({
                      ...current,
                      [selectedClient.id]: {
                        plan: value as RadarWatchlistPlan,
                        status: current[selectedClient.id]?.status ?? selectedClient.status,
                      },
                    }))
                  : undefined
              }
              options={PLAN_OPTIONS.map((value) => ({ value, label: formatPlanLabel(value) }))}
            />
            <SelectField
              label="Client Status"
              value={selectedClientDraft?.status ?? ""}
              onChange={(value) =>
                selectedClient
                  ? setClientDrafts((current) => ({
                      ...current,
                      [selectedClient.id]: {
                        plan: current[selectedClient.id]?.plan ?? selectedClient.plan,
                        status: value as RadarClientStatus,
                      },
                    }))
                  : undefined
              }
              options={STATUS_OPTIONS.map((value) => ({ value, label: formatPlanLabel(value) }))}
            />
          </div>

          <button
            type="button"
            onClick={() => void handleUpdateClient()}
            disabled={loadingAction !== null || !selectedClient}
            style={secondaryButtonStyle(loadingAction === "update-client")}
          >
            {loadingAction === "update-client" ? "Saving..." : "Update Client Plan / Status"}
          </button>

          <div style={dividerStyle} />

          <Field
            label="Create Client Name"
            value={clientForm.name}
            onChange={(value) => setClientForm((current) => ({ ...current, name: value }))}
            placeholder="Acme Security"
          />
          <div style={compactGridStyle}>
            <SelectField
              label="New Client Plan"
              value={clientForm.plan}
              onChange={(value) => setClientForm((current) => ({ ...current, plan: value as RadarWatchlistPlan }))}
              options={PLAN_OPTIONS.map((value) => ({ value, label: formatPlanLabel(value) }))}
            />
            <SelectField
              label="New Client Status"
              value={clientForm.status}
              onChange={(value) => setClientForm((current) => ({ ...current, status: value as RadarClientStatus }))}
              options={STATUS_OPTIONS.map((value) => ({ value, label: formatPlanLabel(value) }))}
            />
          </div>
          <Field
            label="Primary Contact Email"
            value={clientForm.primaryContactEmail ?? ""}
            onChange={(value) => setClientForm((current) => ({ ...current, primaryContactEmail: value }))}
            placeholder="ops@client.example"
          />
          <button
            type="button"
            onClick={() => void handleCreateClient()}
            disabled={loadingAction !== null || clientForm.name.trim() === ""}
            style={primaryButtonStyle(loadingAction === "create-client")}
          >
            {loadingAction === "create-client" ? "Creating..." : "Create Radar Client Account"}
          </button>

          <div style={{ display: "grid", gap: 8 }}>
            {clientRecords.length === 0 ? (
              <EmptyState text="No Radar client accounts exist yet." />
            ) : (
              clientRecords.slice(0, 8).map((client) => (
                <button
                  key={client.id}
                  type="button"
                  onClick={() => setSelectedClientId(client.id)}
                  style={{
                    ...listRowButtonStyle,
                    border:
                      client.id === effectiveSelectedClientId
                        ? "1px solid rgba(212,175,55,0.28)"
                        : "1px solid rgba(148,163,184,0.14)",
                    background:
                      client.id === effectiveSelectedClientId
                        ? "rgba(212,175,55,0.08)"
                        : "rgba(15,23,42,0.45)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                    <div style={{ fontSize: 12, color: "#E2E8F0", fontWeight: 700 }}>{client.name}</div>
                    <Tag text={formatPlanLabel(client.plan)} tone="gold" />
                  </div>
                  <div style={summaryGridStyle}>
                    <SummaryMetric label="Status" value={formatPlanLabel(client.status)} />
                    <SummaryMetric
                      label="Watchlists"
                      value={String(watchlistRecords.filter((watchlist) => watchlist.clientId === client.id).length)}
                    />
                    <SummaryMetric
                      label="Destinations"
                      value={String(destinationRecords.filter((destination) => destination.clientId === client.id).length)}
                    />
                  </div>
                </button>
              ))
            )}
          </div>
        </section>

        <section style={cardStyle}>
          <SectionHeader
            title="Watchlists"
            subtitle="Create Radar watchlists for the selected client and review current coverage."
          />

          <Field
            label="Watchlist Name"
            value={watchlistForm.name}
            onChange={(value) => setWatchlistForm((current) => ({ ...current, name: value }))}
            placeholder="Base Oracle Watch"
          />
          <CheckboxGroup
            label="Monitor Types"
            options={MONITOR_TYPE_OPTIONS.map((value) => ({ value, label: formatPlanLabel(value) }))}
            values={watchlistForm.monitorTypes}
            onToggle={(value) =>
              setWatchlistForm((current) => ({
                ...current,
                monitorTypes: toggleValue(current.monitorTypes, value),
              }))
            }
          />
          <div style={compactGridStyle}>
            <Field
              label="Sources"
              value={watchlistForm.sources}
              onChange={(value) => setWatchlistForm((current) => ({ ...current, sources: value }))}
              placeholder="chainlink, cctp"
            />
            <Field
              label="Assets"
              value={watchlistForm.assets}
              onChange={(value) => setWatchlistForm((current) => ({ ...current, assets: value }))}
              placeholder="ETH, USDC"
            />
          </div>
          <div style={compactGridStyle}>
            <Field
              label="Chains"
              value={watchlistForm.chains}
              onChange={(value) => setWatchlistForm((current) => ({ ...current, chains: value }))}
              placeholder="Base, Arbitrum"
            />
            <Field
              label="Routes"
              value={watchlistForm.routes}
              onChange={(value) => setWatchlistForm((current) => ({ ...current, routes: value }))}
              placeholder="Base -> Arbitrum"
            />
          </div>
          <Field
            label="Reason Codes"
            value={watchlistForm.reasonCodes}
            onChange={(value) => setWatchlistForm((current) => ({ ...current, reasonCodes: value }))}
            placeholder="ORACLE_STALE, BRIDGE_LATENCY_SPIKE"
          />
          <div style={compactGridStyle}>
            <SelectField
              label="Minimum Severity"
              value={watchlistForm.minimumSeverity}
              onChange={(value) =>
                setWatchlistForm((current) => ({ ...current, minimumSeverity: value as RadarSeverity }))
              }
              options={SEVERITY_OPTIONS.map((value) => ({ value, label: value }))}
            />
            <CheckboxGroup
              label="Delivery Channels"
              options={WATCHLIST_CHANNEL_OPTIONS.map((value) => ({ value, label: formatChannelLabel(value) }))}
              values={watchlistForm.deliveryChannels}
              onToggle={(value) =>
                setWatchlistForm((current) => ({
                  ...current,
                  deliveryChannels: toggleValue(current.deliveryChannels, value as RadarWatchlistDeliveryChannel),
                }))
              }
            />
          </div>
          <button
            type="button"
            onClick={() => void handleCreateWatchlist()}
            disabled={loadingAction !== null || !selectedClient || watchlistForm.name.trim() === ""}
            style={primaryButtonStyle(loadingAction === "create-watchlist")}
          >
            {loadingAction === "create-watchlist" ? "Creating..." : "Create Watchlist"}
          </button>

          <div style={{ display: "grid", gap: 8 }}>
            {selectedClientWatchlists.length === 0 ? (
              <EmptyState text="No watchlists exist for the selected client." />
            ) : (
              selectedClientWatchlists.map((watchlist) => (
                <button
                  key={watchlist.id}
                  type="button"
                  onClick={() => setSelectedWatchlistId(watchlist.id)}
                  style={{
                    ...listRowButtonStyle,
                    border:
                      watchlist.id === effectiveSelectedWatchlistId
                        ? "1px solid rgba(212,175,55,0.28)"
                        : "1px solid rgba(148,163,184,0.14)",
                    background:
                      watchlist.id === effectiveSelectedWatchlistId
                        ? "rgba(212,175,55,0.08)"
                        : "rgba(15,23,42,0.45)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                    <div style={{ fontSize: 12, color: "#E2E8F0", fontWeight: 700 }}>{watchlist.name}</div>
                    <Tag text={`${watchlist.minimumSeverity}+`} tone="slate" />
                  </div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {(watchlist.monitorTypes.length > 0 ? watchlist.monitorTypes : ["all"]).slice(0, 3).map((item) => (
                      <Tag key={`${watchlist.id}-${item}`} text={formatPlanLabel(item)} tone="slate" />
                    ))}
                  </div>
                </button>
              ))
            )}
          </div>
        </section>

        <section style={cardStyle}>
          <SectionHeader
            title="Delivery Destinations"
            subtitle="Create Discord, Telegram, or webhook destinations for the selected client."
          />

          <Field
            label="Destination Name"
            value={destinationForm.name}
            onChange={(value) => setDestinationForm((current) => ({ ...current, name: value }))}
            placeholder="Telegram Ops Alerts"
          />
          <div style={compactGridStyle}>
            <SelectField
              label="Channel"
              value={destinationForm.channel}
              onChange={(value) =>
                setDestinationForm((current) => ({ ...current, channel: value as RadarLiveDeliveryChannel }))
              }
              options={DESTINATION_CHANNEL_OPTIONS.map((value) => ({ value, label: formatChannelLabel(value) }))}
            />
            <SelectField
              label="Minimum Severity"
              value={destinationForm.minimumSeverity}
              onChange={(value) =>
                setDestinationForm((current) => ({ ...current, minimumSeverity: value as RadarSeverity }))
              }
              options={SEVERITY_OPTIONS.map((value) => ({ value, label: value }))}
            />
          </div>
          <Field
            label={
              destinationForm.channel === "telegram"
                ? "Chat ID / Target"
                : destinationForm.channel === "webhook"
                  ? "Webhook URL"
                  : "Discord Webhook URL"
            }
            value={destinationForm.destinationUrl}
            onChange={(value) => setDestinationForm((current) => ({ ...current, destinationUrl: value }))}
            placeholder={
              destinationForm.channel === "telegram"
                ? "123456789 or telegram:client:ops"
                : destinationForm.channel === "webhook"
                  ? "https://hooks.client.example/radar"
                  : "https://discord.com/api/webhooks/..."
            }
          />
          <button
            type="button"
            onClick={() => void handleCreateDestination()}
            disabled={
              loadingAction !== null ||
              !selectedClient ||
              destinationForm.name.trim() === "" ||
              destinationForm.destinationUrl.trim() === ""
            }
            style={primaryButtonStyle(loadingAction === "create-destination")}
          >
            {loadingAction === "create-destination" ? "Creating..." : "Create Delivery Destination"}
          </button>

          <div style={{ display: "grid", gap: 8 }}>
            {selectedClientDestinations.length === 0 ? (
              <EmptyState text="No delivery destinations exist for the selected client." />
            ) : (
              selectedClientDestinations.map((destination) => (
                <div key={destination.id} style={listRowStyle}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                    <div style={{ fontSize: 12, color: "#E2E8F0", fontWeight: 700 }}>{destination.name}</div>
                    <Tag text={formatChannelLabel(destination.channel)} tone="gold" />
                  </div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <Tag text={`${destination.minimumSeverity}+`} tone="slate" />
                    <Tag text={destination.enabled ? "Enabled" : "Disabled"} tone="slate" />
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section style={cardStyle}>
          <SectionHeader
            title="Live Delivery"
            subtitle="Match active alerts, deliver pending matches, and inspect recent outbound records."
          />

          <SelectField
            label="Selected Watchlist"
            value={effectiveSelectedWatchlistId}
            onChange={(value) => setSelectedWatchlistId(value)}
            options={[
              { value: "", label: "All enabled client watchlists" },
              ...selectedClientWatchlists.map((watchlist) => ({
                value: watchlist.id,
                label: watchlist.name,
              })),
            ]}
          />

          <div style={{ display: "grid", gap: 8 }}>
            <button
              type="button"
              onClick={() => void handleMatchAlerts()}
              disabled={loadingAction !== null || !selectedClient}
              style={secondaryButtonStyle(loadingAction === "match-alerts")}
            >
              {loadingAction === "match-alerts" ? "Matching..." : "Match Active Alerts"}
            </button>
            <button
              type="button"
              onClick={() => void handleDeliverPending()}
              disabled={loadingAction !== null || !selectedClient}
              style={secondaryButtonStyle(loadingAction === "deliver-pending")}
            >
              {loadingAction === "deliver-pending" ? "Delivering..." : "Deliver Pending Matches"}
            </button>
          </div>

          <div style={summaryGridStyle}>
            <SummaryMetric label="Pending Matches" value={String(selectedClientPendingMatches.length)} />
            <SummaryMetric
              label="Sent"
              value={String(selectedClientLiveDeliveries.filter((delivery) => delivery.status === "sent").length)}
            />
            <SummaryMetric
              label="Failed"
              value={String(selectedClientLiveDeliveries.filter((delivery) => delivery.status === "failed").length)}
            />
          </div>

          <div style={{ display: "grid", gap: 8 }}>
            {selectedClientLiveDeliveries.length === 0 ? (
              <EmptyState text="No live delivery records exist for the selected client." />
            ) : (
              selectedClientLiveDeliveries.slice(0, 6).map((delivery) => (
                <div key={delivery.id} style={listRowStyle}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                    <div style={{ fontSize: 12, color: "#E2E8F0", fontWeight: 700 }}>
                      {formatChannelLabel(delivery.channel)} · {delivery.status}
                    </div>
                    <Tag text={formatTime(delivery.createdAt)} tone="slate" />
                  </div>
                  <div style={{ fontSize: 11, color: "rgba(203,213,225,0.72)", lineHeight: 1.5 }}>
                    Match {delivery.matchId.slice(0, 12)} · Destination {delivery.destinationId.slice(0, 12)}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section style={cardStyle}>
          <SectionHeader
            title="Entitlements"
            subtitle="Selected client plan, status, usage, and enabled delivery channels."
          />

          {selectedClient ? (
            <div style={summaryGridStyle}>
              <SummaryMetric label="Plan" value={formatPlanLabel(selectedEntitlements?.plan ?? selectedClient.plan)} />
              <SummaryMetric label="Status" value={formatPlanLabel(selectedEntitlements?.status ?? selectedClient.status)} />
              <SummaryMetric
                label="Watchlists"
                value={`${selectedEntitlements?.watchlistsUsed ?? selectedClientWatchlists.length} / ${selectedEntitlements?.watchlistsLimit ?? "inf"}`}
              />
              <SummaryMetric
                label="Destinations"
                value={`${selectedEntitlements?.destinationsUsed ?? selectedClientDestinations.length} / ${selectedEntitlements?.destinationsLimit ?? "inf"}`}
              />
              <SummaryMetric label="Live Delivery" value={selectedEntitlements?.liveDeliveryEnabled ? "Enabled" : "Disabled"} />
              <SummaryMetric label="Discord" value={selectedEntitlements?.discordEnabled ? "Enabled" : "Disabled"} />
              <SummaryMetric label="Telegram" value={selectedEntitlements?.telegramEnabled ? "Enabled" : "Disabled"} />
              <SummaryMetric label="Webhook" value={selectedEntitlements?.webhookEnabled ? "Enabled" : "Disabled"} />
            </div>
          ) : (
            <EmptyState text="Select a client account to inspect entitlements." />
          )}
        </section>
      </div>
    </section>
  );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <div style={eyebrowStyle}>{title.toUpperCase()}</div>
      <div style={subtleTextStyle}>{subtitle}</div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label style={{ display: "grid", gap: 5 }}>
      <span style={fieldLabelStyle}>{label.toUpperCase()}</span>
      <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} style={inputStyle} />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
}) {
  return (
    <label style={{ display: "grid", gap: 5 }}>
      <span style={fieldLabelStyle}>{label.toUpperCase()}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} style={inputStyle}>
        {placeholder ? <option value="">{placeholder}</option> : null}
        {options.map((option) => (
          <option key={`${label}-${option.value}`} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function CheckboxGroup({
  label,
  options,
  values,
  onToggle,
}: {
  label: string;
  options: Array<{ value: string; label: string }>;
  values: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div style={{ display: "grid", gap: 5 }}>
      <span style={fieldLabelStyle}>{label.toUpperCase()}</span>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {options.map((option) => {
          const active = values.includes(option.value);
          return (
            <button
              key={`${label}-${option.value}`}
              type="button"
              onClick={() => onToggle(option.value)}
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.04em",
                borderRadius: 999,
                border: active ? "1px solid rgba(212,175,55,0.28)" : "1px solid rgba(148,163,184,0.18)",
                background: active ? "rgba(212,175,55,0.08)" : "rgba(15,23,42,0.55)",
                color: active ? "#D4AF37" : "#CBD5E1",
                padding: "5px 9px",
                cursor: "pointer",
              }}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SummaryMetric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={fieldLabelStyle}>{label.toUpperCase()}</div>
      <div style={{ fontSize: 12, color: "#E2E8F0", fontWeight: 700 }}>{value}</div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div style={{ fontSize: 11, color: "rgba(148,163,184,0.56)", fontStyle: "italic" }}>{text}</div>;
}

function Tag({ text, tone }: { text: string; tone: "gold" | "slate" }) {
  return (
    <span
      style={{
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: "0.06em",
        borderRadius: 999,
        padding: "3px 7px",
        border: tone === "gold" ? "1px solid rgba(212,175,55,0.22)" : "1px solid rgba(148,163,184,0.14)",
        background: tone === "gold" ? "rgba(212,175,55,0.1)" : "rgba(15,23,42,0.55)",
        color: tone === "gold" ? "#D4AF37" : "rgba(203,213,225,0.76)",
      }}
    >
      {text}
    </span>
  );
}

const shellStyle: CSSProperties = {
  background: "linear-gradient(180deg, rgba(15,18,28,0.98), rgba(8,10,14,0.98))",
  border: "1px solid rgba(212,175,55,0.18)",
  borderRadius: 10,
  padding: 18,
  display: "grid",
  gap: 16,
};

const cardStyle: CSSProperties = {
  background: "rgba(10,12,18,0.72)",
  border: "1px solid rgba(148,163,184,0.12)",
  borderRadius: 8,
  padding: 14,
  display: "grid",
  gap: 10,
};

const gridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
  gap: 12,
};

const compactGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 8,
};

const summaryGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))",
  gap: 8,
};

const listRowStyle: CSSProperties = {
  borderRadius: 8,
  border: "1px solid rgba(148,163,184,0.14)",
  background: "rgba(15,23,42,0.45)",
  padding: "10px 12px",
  display: "grid",
  gap: 8,
};

const listRowButtonStyle: CSSProperties = {
  ...listRowStyle,
  textAlign: "left",
  cursor: "pointer",
};

const headerRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: 12,
  flexWrap: "wrap",
};

const dividerStyle: CSSProperties = {
  height: 1,
  background: "rgba(148,163,184,0.14)",
  margin: "2px 0",
};

const eyebrowStyle: CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: "0.14em",
  color: "#D4AF37",
  marginBottom: 4,
};

const subtleTextStyle: CSSProperties = {
  fontSize: 11,
  color: "rgba(203,213,225,0.72)",
  lineHeight: 1.5,
};

const fieldLabelStyle: CSSProperties = {
  fontSize: 9,
  color: "rgba(148,163,184,0.72)",
  letterSpacing: "0.08em",
};

const inputStyle: CSSProperties = {
  width: "100%",
  borderRadius: 6,
  border: "1px solid rgba(148,163,184,0.18)",
  background: "rgba(15,23,42,0.55)",
  color: "#E2E8F0",
  fontSize: 11,
  padding: "8px 10px",
  outline: "none",
};

function primaryButtonStyle(active: boolean): CSSProperties {
  return {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.06em",
    padding: "8px 12px",
    borderRadius: 6,
    border: "1px solid rgba(212,175,55,0.28)",
    background: active ? "rgba(212,175,55,0.18)" : "rgba(212,175,55,0.08)",
    color: "#D4AF37",
    cursor: active ? "wait" : "pointer",
  };
}

function secondaryButtonStyle(active: boolean): CSSProperties {
  return {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.06em",
    padding: "8px 12px",
    borderRadius: 6,
    border: "1px solid rgba(148,163,184,0.2)",
    background: active ? "rgba(51,65,85,0.8)" : "rgba(15,23,42,0.55)",
    color: "#CBD5E1",
    cursor: active ? "wait" : "pointer",
  };
}
