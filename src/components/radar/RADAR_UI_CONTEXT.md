# Radar UI Context

## RadarOperatorConsole

**File:** `apps/web/src/components/radar/RadarOperatorConsole.tsx`

The central operator action panel. Renders action buttons grouped by section (Oracle, Bridge, LP). Dispatches actions to `apps/web/src/app/api/radar/actions/route.ts` which proxies to the backend API.

Key types:
- `ActionKey` — union of all valid action strings
- `ORACLE_GROUPS` — groups for the oracle-monitor section
- `BRIDGE_GROUPS` — groups for the bridge-monitor section
- `LP_GROUPS` — groups for the lp-monitor section
- `UNIFIED_RADAR_GROUPS` — consolidated groups for the `radar-monitor` section
- `buildActionResult(d)` — renders result payload; discriminated by fields present in `d`

## Visible Menu / Nav Expectations

Sidebar navigation (`apps/web/src/components/layout/Sidebar.tsx`) — ACCOUNT OPERATIONS section:

```
Radar Monitor
```

The sidebar should show one unified entry:
- `/dashboard/radar-monitor` → unified Radar Monitor page → `RadarOperatorConsole section="radar-monitor"`

Legacy direct routes must remain valid for backward compatibility:
- `/dashboard/bridge-monitor` → BridgeMonitorPage → RadarOperatorConsole section="bridge-monitor"
- `/dashboard/lp-monitor` → LpMonitorPage → RadarOperatorConsole section="lp-monitor"
- `/dashboard/oracle-monitor` → OracleMonitorPage → RadarOperatorConsole section="oracle-monitor"

**Rule:** A backend feature is not complete until it is reachable from the sidebar or console menu.

## Unified Radar Monitor

The unified Radar Monitor page lives at `/dashboard/radar-monitor` and should expose tabs / sections for:
- Overview
- Oracle
- Bridge
- LP
- Public Preview
- Distribution
- Readiness

This page is the primary operator entrypoint for the unified Radar product shape. The legacy Oracle / Bridge / LP routes remain available but should not appear as separate sidebar items.

## Sections That Must Exist

### Radar Readiness (`section="oracle-monitor"`, `section="bridge-monitor"`, and `section="radar-monitor"`)

Button: "Radar Readiness" (appears at top of both Oracle and Bridge groups)
Action key: `radar-readiness`
Renders: `RadarReadinessSummary` — Oracle Radar, Bridge Radar, Active Alerts, Broadcast Summary, Coverage Summary, Risk Gaps, Next Action rows.

Discriminator: `"overallReadinessLabel" in d && "oracleReadiness" in d && "bridgeReadiness" in d`

### Oracle Monitor (`section="oracle-monitor"`)

Actions available:
- Radar Readiness
- Chainlink Staleness Check
- Reference Check (Chainlink vs Pyth)
- Oracle Coverage
- Oracle Signal Quality
- Broadcast Candidates
- Recompute Signal Quality
- Oracle Readiness
- Run Oracle Pilot Drill
- Oracle Pilot Drill Latest
- Generate Broadcast Brief
- Run Full Radar Preview
- Preview Public Radar Alerts
- Copy Full Thread
- Approve Preview
- Revoke Approval
- Dry Run Approved Thread
- Send Approved Public Thread

### Bridge Monitor (`section="bridge-monitor"`)

Actions available:
- Radar Readiness
- Run Bridge Monitor (canonical)
- Run CCTP Route Check (diagnostic)
- Legacy Bridge Routes (diagnostic)
- Bridge Activation Matrix
- Bridge Brief Preview
- Verify Circle CCTP API
- Bridge Coverage
- Run Full Radar Preview
- Preview Public Radar Alerts
- Copy Full Thread
- Approve Preview
- Revoke Approval
- Dry Run Approved Thread
- Send Approved Public Thread

### LP Monitor (`section="lp-monitor"`)

Actions available:
- LP Coverage
- Run LP Smoke
- Run LP Monitor
- LP Fresh Preview
- Run Full Radar Preview
- Preview Public Radar Alerts
- Copy Full Thread
- Approve Preview
- Revoke Approval
- Dry Run Approved Thread
- Send Approved Public Thread

### Unified Radar Monitor (`section="radar-monitor"`)

Groups available:
- Readiness
- Oracle
- Bridge
- LP
- Public Preview
- Distribution

Within the unified route, keep all existing Oracle, Bridge, LP, preview, approval, and distribution actions reachable through those groups.

## Operator Actions by Section

All action buttons POST to `/api/radar/actions` with `{ action: ActionKey }`. The proxy route dispatches GET or POST to the backend as needed.

STATIC_ACTIONS (GET proxy): `oracle-diagnostics`, `oracle-readiness`, `oracle-pilot-drill-latest`, `bridge-brief-preview`, `bridge-activation-matrix`, `cctp-circle-verify`, `radar-readiness`

All others: POST proxy. `public-alerts-preview` is a POST proxy to `/v1/sce/radar/public-alerts/preview` and `public-alerts-preview-fresh` is a POST proxy to `/v1/sce/radar/public-alerts/preview/fresh`; both send `{ editorial: true }` so the operator console can show deterministic and editorial preview layers when configured. Approval actions (`public-alerts-preview-approve`, `public-alerts-preview-revoke`, `public-alerts-preview-copy`, `public-alerts-preview-dry-run`) POST the current `previewHash` from the latest rendered public preview context. `public-alerts-preview-send-approved` POSTs the current `previewHash`, current `approvalId`, requested channels, and the `dryRun` toggle state to `/v1/sce/radar/public-alerts/send-approved`.

The unified `radar-monitor` route reuses the same action proxy and backend endpoints; navigation consolidation must not change monitoring or delivery logic.

## UI Rule: Backend → Menu Completeness

Adding a new backend endpoint is not complete until:
1. `ActionKey` in `RadarOperatorConsole.tsx` includes the new action key
2. The action appears in the appropriate group array (`ORACLE_GROUPS`, `BRIDGE_GROUPS`, or `LP_GROUPS`)
3. `buildActionResult` has a discriminator branch that renders the response
4. `apps/web/src/app/api/radar/actions/route.ts` has the proxy handler
5. TypeScript types are added to `apps/web/src/lib/radar/types.ts`

## Active Alert Display Rules

Alert cards in `apps/web/src/app/dashboard/[section]/page.tsx`:
- Show "Alert Confidence: High / 92" format (confidence score + label)
- Oracle `ORACLE_STALE` cards show compact evidence block: Price, Round, Updated, Feed age, Warning after, Critical after, Purpose
- Bridge alert cards show `BridgeAlertEvidenceSection` when `alert.monitorType === "bridge" && alert.bridgeEvidence`
- LP monitor cards and summary timestamps use `updatedAt` so refreshed active LP alerts lead the operator surface by latest signal update time
- Alert provenance badges distinguish `sample` / `live` / `runtime` / `manual`

## Provider-Specific Label Rules

- No oracle labels on bridge/LP cards
- No bridge labels on oracle/LP cards
- No LP labels on oracle/bridge cards

In `RadarOperatorConsole.tsx`, each `buildActionResult` branch is discriminated by unique fields in the response. Take care when adding new discriminators — place more specific checks before less specific ones.

Example correct ordering:
1. `"overallReadinessLabel" in d && "oracleReadiness" in d && "bridgeReadiness" in d` → readiness
2. `"publicBroadcastEnabled" in d && "candidateSections" in d` → bridge brief preview
3. `"futureDailyBriefCandidates" in d && "routeResults" in d` → canonical bridge monitor
4. `"providersTotal" in d && "routeRows" in d` → activation matrix
5. `"poolHighlights" in d` → LP fresh preview
6. `"totalPools" in d.summary` (LP coverage) before `"routesChecked" in d` (bridge legacy)

Unified preview note:
Place the `"stepResults" in d && "oracleStatus" in d && "bridgeStatus" in d && "lpStatus" in d` discriminator before the plain unified preview, bridge brief preview, and LP fresh preview branches so the one-button fresh preview renders through its dedicated layout. Keep the `"threadPosts" in d && "oracleSignals" in d && "bridgeSignals" in d && "lpSignals" in d` discriminator ahead of the bridge brief preview and LP fresh preview branches for the existing unified preview action.
Place the manual approval / copy / dry-run / send-approved discriminators after the unified preview branches and before LP/bridge preview branches. Unified preview responses now include `previewHash`, `threadHash`, `postCount`, approval status fields, and inline preview-context controls.

## Result Rendering Expectations

**Oracle smoke / Chainlink check:** Per-feed rows with chain, pair, status badge, last success, Chainlink evidence details (Price, Round ID, Updated At, Decimals).

**Bridge canonical monitor:** Summary cards (Status, Provider Lanes, Routes Configured/Enabled/Checked/Succeeded/Skipped/Failed, Alerts Created/Resolved, Bridge Signals Scored, Future Daily Brief, Future Urgent, Internal Only, Policy Enabled, CCTP Source Mode, Across Source Mode, Routes Delayed, Routes Errored). Per-route rows: Route, Provider, Asset, Source Chain, Destination Chain, Status, Latest Checked, Latest Success, Observed Latency, Max Pending Age, Pending Messages, Alert Action, Next Action.

**LP coverage:** Summary cards + per-pool rows with doctrine thresholds and coverage note.

**LP fresh preview:** Summary cards (Status, Pools Checked/Succeeded/Failed, Alerts Created/Resolved, LP Signals Scored, Future Daily Brief, Future Urgent, Internal Only, Policy Enabled, Public Broadcast). Pool Highlights section (status, human price + label, normalized price, liquidity, note). Candidate sections. Internal-only sections.

**Unified public preview:** Summary cards (Status, Total Signals, Oracle Signals, Bridge Signals, LP Signals, Critical, Warning, Watches, Coverage, Diagnostics / Excluded, Public Broadcast, Mode, Editorial). Then show Headline, Summary, Provider Summary, Risk Summary, Deterministic Preview, LLM Editorial Preview, blocked claims/blocked edits, Deterministic Safety Checks, Editorial Safety Checks, Included Alerts, Excluded Reasons, Diagnostics, and Recommendations.
Also show Approval Status, Approval ID, Approved At, Expires At, Preview Hash, Thread Hash, Post Count, and Preview Changed. Render inline controls for Copy Full Thread, Approve Preview, Revoke Approval, Dry Run Approved Thread, and Send Approved Public Thread using the latest preview hash context.
Render a compact distribution control panel with Discord / Telegram / X checkboxes, a `Dry Run Send` checkbox, and a warning that only approved preview threads can be sent.

Watch / coverage rendering rules:
- Bridge Coverage and LP Coverage are first-class deterministic posts, not generic footer text
- LP Watch must render as `watch`, not as `suppressed`
- Diagnostics stay out of public thread posts and appear through Excluded Reasons / Diagnostics rows instead

**Fresh public preview pipeline:** Summary cards (Status, Oracle, Bridge, LP, Public Broadcast, Delivery Sent, Approval Required, Alerts, Warnings, Watches, Coverage, Diagnostics, Unified Preview, Editorial). Then show step results for Oracle refresh, Bridge Monitor, Bridge Brief Preview, LP Monitor, LP Fresh Preview, unified public preview, and optional editorial preview. Render deterministic preview posts, editorial posts, blocked claims, deterministic/editorial safety checks, diagnostics, warnings, and recommendations from the combined result.
Manual approval fields come from the nested unified preview inside the fresh-preview response; approval actions always target that current nested `previewHash`.

Editorial rendering expectations:
- Show a clear preview-only label: no public post sent
- For each editorial post, render `rawText`, `editedText`, `editorialStatus`, `publicSignalClass`, and `blockedReason`
- Always show operator approval required when the unified preview branch includes `editorialPreview`

Manual approval rendering expectations:
- Approval does not imply send. Keep preview-only / no-delivery language visible.
- If `previewChanged` is true, render the approval state as invalid for the current preview and require re-approval.
- `Copy Full Thread` may return full text for operator copy/export even when approval is not present.
- `Dry Run Approved Thread` must show approval-required when the current preview hash is not approved.
- `Send Approved Public Thread` must send the exact approved thread only; render delivery ID, channel status, message counts, external IDs, and sanitized errors.
- The send-approved control must pass channel toggles and `dryRun` state without exposing webhook URLs, bot tokens, API keys, or raw provider URLs.

## After-Action Refresh

Some sections trigger a re-fetch after action completion (e.g., alert list refresh after monitor run). This is implemented in `page.tsx` where the action proxy response triggers a state update. Do not assume all sections have after-action refresh — check `page.tsx` for the specific section.

## Key Files

| File | Role |
|------|------|
| `RadarOperatorConsole.tsx` | Central action console |
| `apps/web/src/app/api/radar/actions/route.ts` | Action proxy to backend |
| `apps/web/src/lib/radar/types.ts` | TypeScript types for all Radar models |
| `apps/web/src/lib/radar/service.ts` | Frontend fetch helpers |
| `apps/web/src/app/dashboard/[section]/page.tsx` | Section page with alert cards |
| `apps/web/src/components/layout/Sidebar.tsx` | Navigation sidebar |
| `OracleCoveragePanel.tsx` | Oracle coverage tab |
| `BridgeCoveragePanel.tsx` | Bridge coverage tab |
| `BridgeSignalQualityPanel.tsx` | Bridge signal quality tab |
| `OracleReadinessPanel.tsx` | Oracle readiness tab |
| `OraclePilotDrillPanel.tsx` | Oracle pilot drill tab |
| `OracleBroadcastCandidatesPanel.tsx` | Broadcast candidates tab |
