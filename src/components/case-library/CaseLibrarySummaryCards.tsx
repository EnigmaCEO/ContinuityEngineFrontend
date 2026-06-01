import { ArrowUpRight } from 'lucide-react';
import type { CaseLibrarySummaryStats } from '@/lib/case-library/types';
import {
  CLR, CARD_STYLE,
  pipelineHealthColor, pipelineHealthLabel,
} from '@/lib/case-library/utils';

interface Props {
  stats:   CaseLibrarySummaryStats | null;
  loading: boolean;
}

// ─── Sparkline ────────────────────────────────────────────────────────────────

const INGEST_DATA  = [4, 7, 5, 8, 6, 9, 11, 8, 12, 10, 12];
const CVE_DATA     = [1, 2, 1, 3, 2, 4,  3, 5,  6,  8, 12];
const HEALTH_DATA  = [99, 100, 98, 100, 99, 100, 97, 100, 99, 100, 100];
const PENDING_DATA = [8, 7, 9, 6, 8, 7, 5, 6, 4, 5, 4];

function Sparkline({ data, color = CLR.gold, w = 62, h = 20 }: {
  data: number[]; color?: string; w?: number; h?: number;
}) {
  const max = Math.max(...data), min = Math.min(...data), range = max - min || 1;
  const pad = h * 0.12;
  const pts = data.map((v, i) => ({
    x: (i / (data.length - 1)) * w,
    y: pad + (h - pad * 2) * (1 - (v - min) / range),
  }));
  const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} style={{ display: 'block', flexShrink: 0 }}>
      <path d={d} fill="none" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Single KPI card ──────────────────────────────────────────────────────────

function KpiCard({
  label, value, sub, delta, deltaUp, spark, sparkColor, valueColor, badge, loading,
}: {
  label:       string;
  value:       string;
  sub?:        string;
  delta?:      string;
  deltaUp?:    boolean;
  spark:       number[];
  sparkColor:  string;
  valueColor?: string;
  badge?:      string;
  loading:     boolean;
}) {
  return (
    <div style={{ ...CARD_STYLE, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.12em', color: CLR.muted, textTransform: 'uppercase' as const }}>
        {label}
      </div>
      {loading ? (
        <div style={{ height: 28, borderRadius: 4, background: 'rgba(255,255,255,0.05)', width: '60%' }} />
      ) : (
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 8 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' as const }}>
              <span style={{ fontSize: 24, fontWeight: 800, color: valueColor ?? CLR.text, lineHeight: 1 }}>
                {value}
              </span>
              {badge && (
                <span style={{
                  fontSize: 9, fontWeight: 700, letterSpacing: '0.07em',
                  color: valueColor ?? CLR.gold, background: `${valueColor ?? CLR.gold}18`,
                  border: `1px solid ${valueColor ?? CLR.gold}38`, borderRadius: 4, padding: '2px 6px',
                }}>
                  {badge}
                </span>
              )}
            </div>
            {sub && <div style={{ fontSize: 10, color: CLR.muted, marginTop: 3 }}>{sub}</div>}
            {delta && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginTop: 4 }}>
                <ArrowUpRight
                  size={10}
                  style={{ color: deltaUp ? CLR.green : CLR.red, transform: deltaUp ? 'none' : 'rotate(90deg)' }}
                />
                <span style={{ fontSize: 9.5, color: deltaUp ? CLR.green : CLR.red }}>{delta}</span>
              </div>
            )}
          </div>
          <Sparkline data={spark} color={sparkColor} />
        </div>
      )}
    </div>
  );
}

// ─── Secondary metric tile ────────────────────────────────────────────────────

function MetricTile({
  label, value, sub, color, Icon, loading,
}: {
  label: string; value: string; sub: string; color: string;
  Icon: React.ElementType; loading: boolean;
}) {
  return (
    <div style={{ ...CARD_STYLE, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div>
        <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.12em', color: CLR.muted, textTransform: 'uppercase' as const, marginBottom: 5 }}>
          {label}
        </div>
        {loading
          ? <div style={{ height: 24, borderRadius: 4, background: 'rgba(255,255,255,0.05)', width: 48 }} />
          : <div style={{ fontSize: 20, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
        }
        <div style={{ fontSize: 10, color: CLR.muted, marginTop: 3 }}>{sub}</div>
      </div>
      <div style={{
        width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
        background: `${color}12`, border: `1px solid ${color}30`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={15} style={{ color }} />
      </div>
    </div>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────

export function CaseLibrarySummaryCards({ stats, loading }: Props) {
  const pipeColor = stats?.pipelineHealth ? pipelineHealthColor(stats.pipelineHealth) : CLR.muted;
  const pipeLabel = stats?.pipelineHealth ? pipelineHealthLabel(stats.pipelineHealth) : '—';

  const pendingSub = loading ? undefined : (() => {
    const r = stats?.pendingReplayCount   ?? 0;
    const d = stats?.pendingDoctrineCount ?? 0;
    const v = stats?.pendingReviewCount   ?? 0;
    const f = stats?.failedIngestionCount ?? 0;
    const parts = [`Validation ${r}`, `Doctrine ${d}`, `Review ${v}`];
    if (f > 0) parts.push(`Failed ${f}`);
    return parts.join(' · ');
  })();

  const pendingHasFailures = (stats?.failedIngestionCount ?? 0) > 0;
  const pendingDelta = loading ? undefined : (() => {
    const d = stats?.pendingDoctrineCount ?? 0;
    const r = stats?.pendingReplayCount ?? 0;
    const v = stats?.pendingReviewCount ?? 0;
    if (d > 0) return 'Doctrine enrichment queued';
    if (r > 0) return 'Validation coverage gap';
    if (v > 0) return 'Review required';
    return 'No pending actions';
  })();
  const pendingColor = pendingHasFailures ? CLR.red
    : (stats?.pendingActions ?? 0) > 0   ? CLR.gold
    : CLR.green;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Primary row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
        <KpiCard
          label="Active Records"
          value={loading ? '—' : String(stats?.activeRecords ?? 0)}
          sub={loading ? undefined : `${stats ? stats.activeRecords : 0} normalized · 0 failed`}
          delta={loading ? undefined : `+${stats?.activeRecordsDelta ?? 0} this week`}
          deltaUp={true}
          spark={INGEST_DATA} sparkColor={CLR.green} loading={loading}
        />
        <KpiCard
          label="New CVEs Added"
          value={loading ? '—' : String(stats?.newCvesAdded ?? 0)}
          sub="Last 24h · 3 sources active"
          delta="+4 vs yesterday"
          deltaUp={true}
          spark={CVE_DATA} sparkColor={CLR.blue} loading={loading}
        />
        <KpiCard
          label="Pipeline Health"
          value={loading ? '—' : pipeLabel}
          sub={loading ? undefined : `${stats?.normalizationSuccessRate ?? 0}% normalization · ${stats?.failedIngestions ?? 0} failed`}
          spark={HEALTH_DATA} sparkColor={pipeColor} valueColor={pipeColor}
          badge={loading ? undefined : stats?.pipelineHealth === 'healthy' ? 'NOMINAL' : undefined}
          loading={loading}
        />
        <KpiCard
          label="Pending Actions"
          value={loading ? '—' : String(stats?.pendingActions ?? 0)}
          sub={pendingSub}
          delta={pendingHasFailures ? 'Failures need attention' : pendingDelta}
          deltaUp={false}
          spark={PENDING_DATA} sparkColor={pendingColor}
          valueColor={pendingColor}
          loading={loading}
        />
      </div>
    </div>
  );
}
