"use client";

import { useState } from "react";
import type { OracleActivationDiagnostic, OracleActivationDiagnosticsResult } from "@/lib/radar/types";

function statusColor(diag: OracleActivationDiagnostic): string {
  if (!diag.enabledValue) return "#94A3B8";
  if (!diag.rpcUrlPresent || !diag.contractAddressPresent) return "#FCD34D";
  return "#22C55E";
}

export function OracleActivationDiagnosticsPanel({
  diagnostics,
}: {
  diagnostics: OracleActivationDiagnosticsResult;
}) {
  const [selected, setSelected] = useState(0);
  const feeds = diagnostics.feeds;
  const feed = feeds[selected] ?? null;

  return (
    <div
      style={{
        padding: "12px 16px",
        borderRadius: 8,
        background: "rgba(8,10,16,0.65)",
        border: "1px solid rgba(148,163,184,0.1)",
        display: "grid",
        gap: 10,
      }}
    >
      <div
        style={{
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: "0.12em",
          color: "rgba(212,175,55,0.7)",
        }}
      >
        ACTIVATION DIAGNOSTICS
      </div>

      <div
        style={{
          display: "flex",
          gap: 16,
          fontSize: 9,
          color: "rgba(148,163,184,0.7)",
        }}
      >
        <span>
          Runtime enabled:{" "}
          <span style={{ color: diagnostics.runtimeEnabled ? "#22C55E" : "#94A3B8", fontWeight: 600 }}>
            {diagnostics.runtimeEnabled ? "Yes" : "No"}
          </span>
        </span>
        <span>
          Oracle monitor enabled:{" "}
          <span style={{ color: diagnostics.oracleMonitorEnabled ? "#22C55E" : "#94A3B8", fontWeight: 600 }}>
            {diagnostics.oracleMonitorEnabled ? "Yes" : "No"}
          </span>
        </span>
      </div>

      <div
        style={{
          display: "flex",
          gap: 4,
          overflowX: "auto",
          paddingBottom: 2,
        }}
      >
        {feeds.map((diag, index) => {
          const isActive = index === selected;
          const color = statusColor(diag);
          return (
            <button
              key={diag.objectId}
              type="button"
              onClick={() => setSelected(index)}
              style={{
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                gap: 5,
                fontSize: 10,
                fontWeight: isActive ? 700 : 500,
                padding: "5px 10px",
                borderRadius: 5,
                border: isActive
                  ? "1px solid rgba(148,163,184,0.35)"
                  : "1px solid rgba(148,163,184,0.14)",
                background: isActive ? "rgba(148,163,184,0.1)" : "transparent",
                color: isActive ? "#E2E8F0" : "rgba(148,163,184,0.55)",
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "background 0.12s, color 0.12s",
              }}
            >
              <span
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  background: color,
                  flexShrink: 0,
                }}
              />
              {diag.pair} · {diag.chain}
            </button>
          );
        })}
      </div>

      {feed ? (
        <div
          style={{
            borderRadius: 6,
            border: "1px solid rgba(148,163,184,0.14)",
            background: "rgba(15,23,42,0.55)",
            padding: "10px 14px",
            display: "grid",
            gap: 8,
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
              gap: "6px 12px",
            }}
          >
            {[
              { label: "Object ID", value: feed.objectId },
              { label: "Source", value: feed.source },
              { label: "Status", value: feed.status },
              { label: "Enabled", value: feed.enabledValue ? "Yes" : "No", ok: feed.enabledValue },
              { label: "Enabled Env", value: feed.enabledEnv },
              { label: "RPC Env", value: feed.rpcUrlEnv },
              { label: "RPC Present", value: feed.rpcUrlPresent ? "Yes" : "No", ok: feed.rpcUrlPresent },
              {
                label: "Feed Address Present",
                value: feed.contractAddressPresent ? "Yes" : "No",
                ok: feed.contractAddressPresent,
              },
              ...(feed.contractAddressEnvsChecked.length > 0
                ? [{ label: "Feed Address Env", value: feed.contractAddressEnvsChecked[0] ?? "" }]
                : []),
            ].map(({ label, value, ok }) => (
              <div key={label}>
                <div
                  style={{
                    fontSize: 9,
                    color: "rgba(148,163,184,0.6)",
                    letterSpacing: "0.08em",
                    marginBottom: 2,
                  }}
                >
                  {label.toUpperCase()}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    color: ok === true ? "#22C55E" : ok === false ? "#94A3B8" : "#CBD5E1",
                    lineHeight: 1.4,
                    overflowWrap: "anywhere",
                  }}
                >
                  {value}
                </div>
              </div>
            ))}
          </div>
          {feed.nextAction ? (
            <div
              style={{
                fontSize: 9,
                color: "rgba(148,163,184,0.45)",
                fontStyle: "italic",
                borderTop: "1px solid rgba(148,163,184,0.08)",
                paddingTop: 6,
              }}
            >
              → {feed.nextAction}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
