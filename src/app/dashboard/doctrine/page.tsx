"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { AlertTriangle, BookOpen, ChevronRight, Loader2, Search } from "lucide-react";
import { fetchDoctrineOverview } from "@/lib/case-library/service";
import type { DoctrineOverviewResponse, DoctrineTagRow, CaseSeverity, ReplayStatus } from "@/lib/case-library/types";
import { CARD_STYLE, CLR, formatTs, replayColor, severityColor } from "@/lib/case-library/utils";

type ReplayFilter = ReplayStatus | "all";
type SeverityFilter = CaseSeverity | "all";

function kpiLabel(value: number, suffix = "") {
  return `${value.toLocaleString()}${suffix}`;
}

export default function DoctrineEnginePage() {
  const [data, setData] = useState<DoctrineOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [severity, setSeverity] = useState<SeverityFilter>("all");
  const [replayStatus, setReplayStatus] = useState<ReplayFilter>("all");
  const [selected, setSelected] = useState<DoctrineTagRow | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const result = await fetchDoctrineOverview();
        setData(result);
        setSelected((current) => result.rows.find((row) => row.tag === current?.tag) ?? null);
      } catch (e) {
        setError((e as Error).message ?? "Failed to load doctrine overview.");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (data?.rows ?? []).filter((row) => {
      const haystack = [
        row.tag,
        ...row.topRecommendedActions,
        ...row.topContinuityImplications,
      ].join(" ").toLowerCase();
      const matchesSearch = !q || haystack.includes(q);
      const matchesSeverity =
        severity === "all"
          ? true
          : severity === "critical"
            ? row.criticalCount > 0
            : severity === "high"
              ? row.highCount > 0
              : false;
      const matchesReplay =
        replayStatus === "all"
          ? true
          : replayStatus === "passed"
            ? row.replayPassed > 0
            : replayStatus === "missing"
              ? row.replayMissing > 0
              : false;
      return matchesSearch && matchesSeverity && matchesReplay;
    });
  }, [data?.rows, replayStatus, search, severity]);

  const coverageGaps = Math.max((data?.totalDoctrineCoveredCases ?? 0) - (data?.totalReplayedDoctrineCases ?? 0), 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100%", padding: "20px 18px 28px", background: CLR.bg, gap: 16 }}>
      <section style={{ ...CARD_STYLE, padding: "18px 20px", background: "linear-gradient(135deg, rgba(212,175,55,0.12), rgba(10,12,18,0.96))" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" as const }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, display: "grid", placeItems: "center", border: "1px solid rgba(212,175,55,0.32)", background: "rgba(212,175,55,0.08)" }}>
                <BookOpen size={18} style={{ color: CLR.gold }} />
              </div>
              <div>
                <h1 style={{ margin: 0, color: CLR.text, fontSize: 22, letterSpacing: "0.04em" }}>Doctrine Engine</h1>
                <p style={{ margin: "4px 0 0", color: "rgba(226,232,240,0.72)", fontSize: 12 }}>
                  Continuity doctrine learned from global incidents, CVEs, advisories, and replay outcomes.
                </p>
              </div>
            </div>
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
          { label: "Doctrine Tags", value: kpiLabel(data?.totalDoctrineTags ?? 0), tone: CLR.gold },
          { label: "Doctrine-Covered Cases", value: kpiLabel(data?.totalDoctrineCoveredCases ?? 0), tone: CLR.text },
          { label: "Replay-Validated Doctrine", value: kpiLabel(data?.totalReplayedDoctrineCases ?? 0), tone: CLR.green },
          { label: "Coverage Gaps", value: kpiLabel(coverageGaps), tone: coverageGaps > 0 ? CLR.orange : CLR.green },
        ].map((card) => (
          <div key={card.label} style={{ ...CARD_STYLE, padding: "16px 18px" }}>
            <div style={{ fontSize: 10, color: CLR.muted, textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 8 }}>{card.label}</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: card.tone }}>{loading ? "..." : card.value}</div>
          </div>
        ))}
      </section>

      <section style={{ display: "grid", gridTemplateColumns: selected ? "minmax(0, 1.7fr) minmax(320px, 0.9fr)" : "1fr", gap: 16 }}>
        <div style={CARD_STYLE}>
          <div style={{ padding: "16px 18px", borderBottom: `1px solid ${CLR.border}`, display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" as const }}>
            <div>
              <div style={{ color: CLR.gold, fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" as const }}>Doctrine Matrix</div>
              <div style={{ color: CLR.muted, fontSize: 11, marginTop: 4 }}>
                Coverage {loading ? "..." : `${data?.doctrineCoveragePct ?? 0}%`} across normalized case records.
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" as const }}>
              <label style={{ position: "relative", display: "flex", alignItems: "center" }}>
                <Search size={12} style={{ position: "absolute", left: 10, color: CLR.muted }} />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search doctrine tag/action"
                  style={{ width: 220, padding: "9px 10px 9px 30px", background: "rgba(0,0,0,0.24)", border: `1px solid ${CLR.border}`, borderRadius: 6, color: CLR.text, fontSize: 11 }}
                />
              </label>
              <select value={severity} onChange={(e) => setSeverity(e.target.value as SeverityFilter)} style={selectStyle}>
                <option value="all">All Severity</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
              </select>
              <select value={replayStatus} onChange={(e) => setReplayStatus(e.target.value as ReplayFilter)} style={selectStyle}>
                <option value="all">All Replay</option>
                <option value="passed">Replay Passed</option>
                <option value="missing">Replay Missing</option>
              </select>
            </div>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "rgba(212,175,55,0.04)" }}>
                  {["Doctrine Tag", "Cases", "Critical", "Replay Passed", "Replay Missing", "Confidence", "Top Actions"].map((label) => (
                    <th key={label} style={thStyle}>{label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} style={{ padding: 32, textAlign: "center", color: CLR.muted }}>
                      <Loader2 size={16} style={{ animation: "spin 1s linear infinite", marginBottom: 8 }} />
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: 24, textAlign: "center", color: CLR.muted, fontSize: 11.5 }}>
                      No doctrine tags match the current filters.
                    </td>
                  </tr>
                ) : rows.map((row) => (
                  <tr
                    key={row.tag}
                    onClick={() => setSelected(row)}
                    style={{ cursor: "pointer", borderTop: `1px solid rgba(212,175,55,0.08)`, background: selected?.tag === row.tag ? "rgba(212,175,55,0.06)" : "transparent" }}
                  >
                    <td style={tdStyle}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                        <span style={{ color: CLR.text, fontWeight: 600 }}>{row.tag}</span>
                        <ChevronRight size={14} style={{ color: CLR.muted }} />
                      </div>
                    </td>
                    <td style={tdStyle}>{row.caseCount}</td>
                    <td style={{ ...tdStyle, color: row.criticalCount > 0 ? CLR.red : CLR.muted }}>{row.criticalCount}</td>
                    <td style={{ ...tdStyle, color: CLR.green }}>{row.replayPassed}</td>
                    <td style={{ ...tdStyle, color: row.replayMissing > 0 ? CLR.orange : CLR.muted }}>{row.replayMissing}</td>
                    <td style={tdStyle}>{row.confidenceAvg.toFixed(2)}</td>
                    <td style={tdStyle}>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {row.topRecommendedActions.length > 0 ? row.topRecommendedActions.slice(0, 2).map((action) => (
                          <span key={action} style={chipStyle}>{action}</span>
                        )) : (
                          <span style={{ color: CLR.muted }}>None</span>
                        )}
                      </div>
                    </td>
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
                <div style={{ color: CLR.gold, fontSize: 11, textTransform: "uppercase" as const, letterSpacing: "0.08em" }}>Doctrine Detail</div>
                <div style={{ color: CLR.text, fontSize: 18, fontWeight: 700, marginTop: 4 }}>{selected.tag}</div>
              </div>
              <button onClick={() => setSelected(null)} style={ghostButtonStyle}>Close</button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8, marginBottom: 14 }}>
              <StatPill label="Critical" value={selected.criticalCount} tone={severityColor("critical")} />
              <StatPill label="High" value={selected.highCount} tone={severityColor("high")} />
              <StatPill label="Replay Passed" value={selected.replayPassed} tone={replayColor("passed")} />
              <StatPill label="Replay Missing" value={selected.replayMissing} tone={replayColor("missing")} />
            </div>

            <DetailBlock title="Top Recommended Actions" items={selected.recommendedActions} empty="No actions recorded." />
            <DetailBlock title="Continuity Implications" items={selected.continuityImplications} empty="No continuity implications recorded." />
            <DetailBlock
              title={`Related Case IDs (${selected.relatedCaseIds.length} of ${selected.relatedCaseCount})`}
              items={selected.relatedCaseIds}
              empty="No related cases."
              mono
            />

            <div style={{ marginTop: 16, padding: "12px 14px", borderRadius: 8, border: `1px solid ${CLR.border}`, background: "rgba(255,255,255,0.02)" }}>
              <div style={{ color: CLR.gold, fontSize: 10, textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 6 }}>Replay Gap Summary</div>
              <div style={{ color: CLR.text, fontSize: 12, lineHeight: 1.55 }}>{selected.replayGapSummary}</div>
              <div style={{ color: CLR.muted, fontSize: 10.5, marginTop: 10 }}>Last Updated {formatTs(selected.lastUpdated)}</div>
            </div>

            {(data?.replayCoverageByDoctrineTag ?? []).some((item) => item.tag === selected.tag) && (
              <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${CLR.border}` }}>
                <div style={{ color: CLR.gold, fontSize: 10, textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 8 }}>Replay Coverage</div>
                {data?.replayCoverageByDoctrineTag.filter((item) => item.tag === selected.tag).map((item) => (
                  <div key={item.tag} style={{ display: "flex", justifyContent: "space-between", color: CLR.text, fontSize: 11.5 }}>
                    <span>{item.replayPassed} passed / {item.replayMissing} missing</span>
                    <span>{item.coveragePct}%</span>
                  </div>
                ))}
              </div>
            )}
          </aside>
        )}
      </section>
    </div>
  );
}

function DetailBlock({
  title,
  items,
  empty,
  mono = false,
}: {
  title: string;
  items: string[];
  empty: string;
  mono?: boolean;
}) {
  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ color: CLR.gold, fontSize: 10, textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 8 }}>{title}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {items.length === 0 ? (
          <span style={{ color: CLR.muted, fontSize: 11.5 }}>{empty}</span>
        ) : items.map((item) => (
          <div key={item} style={{ color: CLR.text, fontSize: 11.5, lineHeight: 1.5, fontFamily: mono ? "monospace" : "inherit" }}>{item}</div>
        ))}
      </div>
    </div>
  );
}

function StatPill({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div style={{ border: `1px solid ${CLR.border}`, borderRadius: 8, padding: "10px 12px", background: "rgba(255,255,255,0.02)" }}>
      <div style={{ fontSize: 10, color: CLR.muted, textTransform: "uppercase" as const, letterSpacing: "0.08em" }}>{label}</div>
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

const ghostButtonStyle: CSSProperties = {
  background: "rgba(255,255,255,0.03)",
  border: `1px solid ${CLR.border}`,
  borderRadius: 6,
  color: CLR.muted,
  fontSize: 10.5,
  padding: "7px 10px",
  cursor: "pointer",
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
