"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { AlertTriangle, Loader2, Network, Search, ShieldAlert } from "lucide-react";
import { fetchThreatMatrixOverview } from "@/lib/case-library/service";
import type { CaseSeverity, ReplayStatus, ThreatMatrixOverviewResponse, ThreatMatrixRow } from "@/lib/case-library/types";
import { CARD_STYLE, CLR, formatTs, replayColor, severityColor } from "@/lib/case-library/utils";

type SeverityFilter = CaseSeverity | "all";
type ReplayFilter = ReplayStatus | "all";

export default function ThreatMatrixPage() {
  const [data, setData] = useState<ThreatMatrixOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [severity, setSeverity] = useState<SeverityFilter>("all");
  const [replayStatus, setReplayStatus] = useState<ReplayFilter>("all");
  const [source, setSource] = useState("all");
  const [selected, setSelected] = useState<ThreatMatrixRow | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const result = await fetchThreatMatrixOverview();
        setData(result);
        setSelected((current) => result.rows.find((row) => row.threatFamily === current?.threatFamily) ?? null);
      } catch (e) {
        setError((e as Error).message ?? "Failed to load threat matrix.");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  const sourceOptions = useMemo(() => {
    const values = new Set<string>();
    for (const row of data?.rows ?? []) {
      for (const item of row.topSources) values.add(item);
      for (const item of row.relatedSources) values.add(item);
    }
    return ["all", ...Array.from(values).sort((a, b) => a.localeCompare(b))];
  }, [data?.rows]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (data?.rows ?? []).filter((row) => {
      const haystack = [
        row.threatFamily,
        row.summary,
        ...row.topDoctrineTags,
        ...row.topRecommendedActions,
        ...row.topSources,
      ].join(" ").toLowerCase();
      const matchesSearch = !q || haystack.includes(q);
      const matchesSeverity =
        severity === "all" ? true : severity === "critical" ? row.criticalCount > 0 : severity === "high" ? row.highCount > 0 : row.caseCount > row.criticalCount + row.highCount;
      const matchesReplay =
        replayStatus === "all" ? true : replayStatus === "passed" ? row.replayPassed > 0 : replayStatus === "missing" ? row.replayMissing > 0 : false;
      const matchesSource = source === "all" ? true : row.relatedSources.includes(source) || row.topSources.includes(source);
      return matchesSearch && matchesSeverity && matchesReplay && matchesSource;
    });
  }, [data?.rows, replayStatus, search, severity, source]);

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100%", padding: "20px 18px 28px", background: CLR.bg, gap: 16 }}>
      <section style={{ ...CARD_STYLE, padding: "18px 20px", background: "linear-gradient(135deg, rgba(212,175,55,0.12), rgba(10,12,18,0.96))" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, display: "grid", placeItems: "center", border: "1px solid rgba(212,175,55,0.32)", background: "rgba(212,175,55,0.08)" }}>
            <Network size={18} style={{ color: CLR.gold }} />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <h1 style={{ margin: 0, color: CLR.text, fontSize: 22, letterSpacing: "0.04em" }}>Threat Matrix</h1>
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", color: CLR.gold, background: "rgba(212,175,55,0.1)", border: "1px solid rgba(212,175,55,0.28)", borderRadius: 4, padding: "2px 7px" }}>
                GLOBAL THREAT MODEL
              </span>
            </div>
            <p style={{ margin: "4px 0 0", color: "rgba(226,232,240,0.72)", fontSize: 12 }}>
              Global threat families derived from case intelligence, doctrine coverage, and case-indexed coverage.
            </p>
          </div>
        </div>
      </section>

      {error && (
        <div style={{ ...CARD_STYLE, padding: "12px 14px", borderColor: "rgba(239,68,68,0.28)", color: "#FCA5A5", display: "flex", alignItems: "center", gap: 8 }}>
          <AlertTriangle size={14} />
          <span style={{ fontSize: 11.5 }}>{error}</span>
        </div>
      )}

      <section style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 12 }}>
        {[
          { label: "Active Threat Families", value: data?.activeThreatFamilies ?? 0, tone: CLR.gold },
          { label: "Critical Exposure", value: data?.criticalExposure ?? 0, tone: CLR.red },
          { label: "Replay Gaps", value: data?.replayGaps ?? 0, tone: CLR.orange },
          { label: "Highest Threat Score", value: data?.highestThreatScore ?? 0, tone: CLR.text },
        ].map((card) => (
          <div key={card.label} style={{ ...CARD_STYLE, padding: "16px 18px" }}>
            <div style={{ fontSize: 10, color: CLR.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>{card.label}</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: card.tone }}>{loading ? "..." : card.value.toLocaleString()}</div>
          </div>
        ))}
      </section>

      <section style={{ display: "grid", gridTemplateColumns: selected ? "minmax(0, 1.7fr) minmax(320px, 0.9fr)" : "1fr", gap: 16 }}>
        <div style={CARD_STYLE}>
          <div style={{ padding: "16px 18px", borderBottom: `1px solid ${CLR.border}`, display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div>
              <div style={{ color: CLR.gold, fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>Threat Matrix</div>
              <div style={{ color: CLR.muted, fontSize: 11, marginTop: 4 }}>
                Deterministic global family aggregation across normalized case records.
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <label style={{ position: "relative", display: "flex", alignItems: "center" }}>
                <Search size={12} style={{ position: "absolute", left: 10, color: CLR.muted }} />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search family, tag, action" style={{ width: 220, padding: "9px 10px 9px 30px", background: "rgba(0,0,0,0.24)", border: `1px solid ${CLR.border}`, borderRadius: 6, color: CLR.text, fontSize: 11 }} />
              </label>
              <select value={severity} onChange={(e) => setSeverity(e.target.value as SeverityFilter)} style={selectStyle}>
                <option value="all">All Severity</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              <select value={replayStatus} onChange={(e) => setReplayStatus(e.target.value as ReplayFilter)} style={selectStyle}>
                <option value="all">All Replay</option>
                <option value="passed">Replay Passed</option>
                <option value="missing">Replay Missing</option>
              </select>
              <select value={source} onChange={(e) => setSource(e.target.value)} style={selectStyle}>
                {sourceOptions.map((option) => (
                  <option key={option} value={option}>{option === "all" ? "All Sources" : option}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "rgba(212,175,55,0.04)" }}>
                  {["Threat Family", "Cases", "Critical", "Replay Coverage", "Doctrine Coverage", "Threat Score", "Top Doctrine Tags", "Top Actions"].map((label) => (
                    <th key={label} style={thStyle}>{label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} style={{ padding: 32, textAlign: "center", color: CLR.muted }}><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /></td></tr>
                ) : rows.length === 0 ? (
                  <tr><td colSpan={8} style={{ padding: 24, textAlign: "center", color: CLR.muted, fontSize: 11.5 }}>No threat families match the current filters.</td></tr>
                ) : rows.map((row) => (
                  <tr key={row.threatFamily} onClick={() => setSelected(row)} style={{ cursor: "pointer", borderTop: `1px solid rgba(212,175,55,0.08)`, background: selected?.threatFamily === row.threatFamily ? "rgba(212,175,55,0.06)" : "transparent" }}>
                    <td style={tdStyle}><div style={{ color: CLR.text, fontWeight: 600 }}>{row.threatFamily}</div></td>
                    <td style={tdStyle}>{row.caseCount}</td>
                    <td style={{ ...tdStyle, color: row.criticalCount > 0 ? CLR.red : CLR.muted }}>{row.criticalCount}</td>
                    <td style={{ ...tdStyle, color: row.replayMissing > 0 ? CLR.orange : CLR.green }}>{row.replayCoveragePct}%</td>
                    <td style={tdStyle}>{row.doctrineCoveragePct}%</td>
                    <td style={{ ...tdStyle, color: row.threatScore >= 30 ? CLR.red : row.threatScore >= 20 ? CLR.orange : CLR.gold }}>{row.threatScore}</td>
                    <td style={tdStyle}><ChipRow items={row.topDoctrineTags} empty="None" /></td>
                    <td style={tdStyle}><ChipRow items={row.topRecommendedActions} empty="None" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {selected && (
          <aside style={{ ...CARD_STYLE, padding: "16px 18px", alignSelf: "start" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 14 }}>
              <div>
                <div style={{ color: CLR.gold, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em" }}>Threat Family Detail</div>
                <div style={{ color: CLR.text, fontSize: 18, fontWeight: 700, marginTop: 4 }}>{selected.threatFamily}</div>
              </div>
              <button onClick={() => setSelected(null)} style={ghostButtonStyle}>Close</button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8, marginBottom: 14 }}>
              <StatPill label="Critical" value={selected.criticalCount} tone={severityColor("critical")} />
              <StatPill label="High" value={selected.highCount} tone={severityColor("high")} />
              <StatPill label="Replay Passed" value={selected.replayPassed} tone={replayColor("passed")} />
              <StatPill label="Replay Missing" value={selected.replayMissing} tone={replayColor("missing")} />
            </div>

            <DetailSection title="Summary" icon={<ShieldAlert size={13} style={{ color: CLR.gold }} />}>
              <div style={{ color: CLR.text, fontSize: 12, lineHeight: 1.55 }}>{selected.summary}</div>
            </DetailSection>
            <DetailList title="Top Cases" items={selected.topCases} empty="No related cases." mono />
            <DetailList title="Doctrine Tags" items={selected.doctrineTags} empty="No doctrine tags recorded." mono />
            <DetailList title="Recommended Actions" items={selected.recommendedActions} empty="No recommended actions recorded." />
            <DetailList title="Continuity Implications" items={selected.continuityImplications} empty="No continuity implications recorded." />
            <DetailSection title="Replay Gap Explanation">
              <div style={{ color: CLR.text, fontSize: 12, lineHeight: 1.55 }}>{selected.replayGapExplanation}</div>
            </DetailSection>
            <DetailList title="Related Sources" items={selected.relatedSources} empty="No related sources recorded." />

            <div style={{ color: CLR.muted, fontSize: 10.5, marginTop: 14 }}>Last Observed {formatTs(selected.lastObservedAt)}</div>
          </aside>
        )}
      </section>
    </div>
  );
}

function ChipRow({ items, empty }: { items: string[]; empty: string }) {
  if (items.length === 0) return <span style={{ color: CLR.muted }}>{empty}</span>;
  return <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>{items.slice(0, 2).map((item) => <span key={item} style={chipStyle}>{item}</span>)}</div>;
}

function DetailSection({ title, children, icon }: { title: string; children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, color: CLR.gold, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>{icon}{title}</div>
      {children}
    </div>
  );
}

function DetailList({
  title,
  items,
  empty,
  mono = false,
}: {
  title: string;
  items?: string[];
  empty: string;
  mono?: boolean;
}) {
  const safeItems = Array.isArray(items) ? items : [];

  return (
    <DetailSection title={title}>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {safeItems.length === 0 ? (
          <span style={{ color: CLR.muted, fontSize: 11.5 }}>{empty}</span>
        ) : (
          safeItems.map((item) => (
            <div
              key={item}
              style={{
                color: CLR.text,
                fontSize: 11.5,
                lineHeight: 1.5,
                fontFamily: mono ? "monospace" : "inherit",
              }}
            >
              {item}
            </div>
          ))
        )}
      </div>
    </DetailSection>
  );
}

function StatPill({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div style={{ border: `1px solid ${CLR.border}`, borderRadius: 8, padding: "10px 12px", background: "rgba(255,255,255,0.02)" }}>
      <div style={{ fontSize: 10, color: CLR.muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</div>
      <div style={{ marginTop: 6, color: tone, fontSize: 18, fontWeight: 700 }}>{value}</div>
    </div>
  );
}

const selectStyle: CSSProperties = {
  background: "rgba(0,0,0,0.24)",
  border: `1px solid ${CLR.border}`,
  borderRadius: 6,
  color: CLR.text,
  fontSize: 11,
  padding: "8px 10px",
};

const thStyle: CSSProperties = {
  padding: "12px 14px",
  color: CLR.muted,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  fontSize: 10,
  textAlign: "left",
};

const tdStyle: CSSProperties = {
  padding: "14px",
  color: CLR.text,
  fontSize: 11.5,
  verticalAlign: "top",
};

const chipStyle: CSSProperties = {
  maxWidth: 220,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  padding: "4px 8px",
  borderRadius: 999,
  border: `1px solid rgba(212,175,55,0.2)`,
  background: "rgba(212,175,55,0.08)",
  color: CLR.text,
  fontSize: 10.5,
};

const ghostButtonStyle: CSSProperties = {
  background: "rgba(255,255,255,0.03)",
  border: `1px solid ${CLR.border}`,
  borderRadius: 6,
  color: CLR.muted,
  fontSize: 10.5,
  padding: "7px 10px",
  cursor: "pointer",
};
