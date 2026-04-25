"use client";

import { useEffect, useState } from "react";

type ScenarioType = "stablecoin_depeg" | "oracle_stale" | "chain_halt";

type AuditStatus = "local" | "exported" | "failed";

type DecisionRecord = {
  decision_id: string;
  timestamp: string;
  system_name: string;
  scenario_type: ScenarioType;
  severity: "low" | "medium" | "high" | "catastrophic";
  doctrine: "monitor" | "freeze" | "degrade" | "evacuate" | "substitute";
  invariant_breached: string;
  recommended_action: string;
  blocked_action: string;
  explanation: string;
  decision_hash: string;
  audit_status: AuditStatus;
  external_audit_id: string | null;
};

type MonitorStatus = {
    stablecoin_price: number;
    oracle_staleness: number;
    chain_halt_minutes: number;
    last_tick: string | null;
  };

export default function DecisionsPage() {
  const [decisions, setDecisions] = useState<DecisionRecord[]>([]);
  const [scenario, setScenario] = useState<ScenarioType>("stablecoin_depeg");
  const [observedValue, setObservedValue] = useState<number>(0.82);
  const [status, setStatus] = useState<MonitorStatus | null>(null);

  const fetchDecisions = () => {
    fetch("http://127.0.0.1:8000/decisions")
      .then(res => res.json())
      .then(data => setDecisions(data));
  };

  const fetchStatus = () => {
    fetch("http://127.0.0.1:8000/monitors/status")
      .then(res => res.json())
      .then(data => setStatus(data));
  };

  useEffect(() => {
    fetchDecisions();
    fetchStatus();
  
    const interval = setInterval(() => {
      fetchDecisions();
      fetchStatus();
    }, 30000);
  
    return () => clearInterval(interval);
  }, []);

  const runScenario = async () => {
    await fetch("http://127.0.0.1:8000/scenarios/run", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        scenario_type: scenario,
        system_name: "Sagitta Protocol",
        observed_value: observedValue,
        expected_value: scenario === "stablecoin_depeg" ? 1 : undefined,
      }),
    });

    fetchDecisions();
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>SCE Control Room</h1>

      {/* Run Scenario Panel */}
      <div
        style={{
          border: "2px solid black",
          padding: 16,
          marginBottom: 20,
        }}
      >
        <h2>Run Scenario</h2>

        <select
          value={scenario}
          onChange={(e) => setScenario(e.target.value as ScenarioType)}
        >
          <option value="stablecoin_depeg">Stablecoin Depeg</option>
          <option value="oracle_stale">Oracle Stale</option>
          <option value="chain_halt">Chain Halt</option>
        </select>

        <br /><br />

        <input
          type="number"
          value={observedValue}
          onChange={(e) => setObservedValue(Number(e.target.value))}
          step="0.01"
        />

        <br /><br />

        <button onClick={runScenario}>
          Run Scenario
        </button>
        <br />
        <button onClick={async () => {
        await fetch("http://127.0.0.1:8000/monitors/tick", {
            method: "POST",
        });
        fetchDecisions();
        }}>
        Run Monitor Tick
        </button>
      </div>

      <div
        style={{
            border: "2px solid black",
            padding: 16,
            marginBottom: 20,
        }}
        >
        <h2>Live System Status</h2>

        {status && (
            <>
            <p>Stablecoin Price: {status.stablecoin_price}</p>
            <p>Oracle Staleness (sec): {status.oracle_staleness}</p>
            <p>Chain Halt (min): {status.chain_halt_minutes}</p>
            <p>Last Tick: {status.last_tick}</p>
            </>
        )}
        </div>

      {/* Decision Records */}
      <h2>Decision Records</h2>

      {decisions.length === 0 && <p>No decisions yet.</p>}

      {decisions.map((d) => (
        <div
          key={d.decision_id}
          style={{
            border: "1px solid #ccc",
            padding: 12,
            marginTop: 12,
          }}
        >
          <strong>{d.scenario_type}</strong> — {d.severity} — {d.doctrine}
          <span style={{
            marginLeft: 8,
            padding: "2px 6px",
            fontSize: 11,
            fontWeight: "bold",
            borderRadius: 3,
            background:
              d.audit_status === "exported" ? "#d4edda" :
              d.audit_status === "failed"   ? "#f8d7da" :
                                             "#e2e3e5",
            color:
              d.audit_status === "exported" ? "#155724" :
              d.audit_status === "failed"   ? "#721c24" :
                                             "#383d41",
          }}>
            {d.audit_status === "exported" ? "EXPORTED"
              : d.audit_status === "failed" ? "FAILED"
              : "LOCAL"}
          </span>
          <p>{d.explanation}</p>
          <small>{d.decision_hash}</small>
        </div>
      ))}
    </div>
  );
}