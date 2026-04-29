import { Database, Layers, AlertTriangle, Zap, BookOpen } from 'lucide-react';
import type { CaseLibraryMetrics } from '@/lib/case-library/types';
import { CLR, CARD_STYLE, severityColor, formatRelative } from '@/lib/case-library/utils';

interface Props {
  metrics: CaseLibraryMetrics | null;
  loading: boolean;
}

// ─── Shared sub-components ────────────────────────────────────────────────────

function PanelHead({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
      <div style={{
        width: 20, height: 20, borderRadius: '50%',
        background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.28)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={10} style={{ color: CLR.gold }} />
      </div>
      <span style={{ fontSize: 9.5, fontWeight: 600, letterSpacing: '0.13em', color: CLR.gold, textTransform: 'uppercase' as const }}>
        {title}
      </span>
    </div>
  );
}

function MetricRow({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: 10.5, color: CLR.muted }}>{label}</span>
      <span style={{ fontSize: 11, fontWeight: 700, color }}>{value}</span>
    </div>
  );
}

function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 2 }} />
      </div>
      <span style={{ fontSize: 10, color: CLR.muted, minWidth: 20, textAlign: 'right' as const }}>{value}</span>
    </div>
  );
}

function SkeletonLine() {
  return <div style={{ height: 11, borderRadius: 3, background: 'rgba(255,255,255,0.05)', marginBottom: 8 }} />;
}

// ─── Individual panels ────────────────────────────────────────────────────────

function IngestionPanel({ stats, loading }: { stats: CaseLibraryMetrics['ingestionStats'] | undefined; loading: boolean }) {
  return (
    <div style={{ ...CARD_STYLE, padding: '14px 16px' }}>
      <PanelHead icon={Database} title="Ingestion Pipeline" />
      {loading || !stats
        ? <>{Array.from({ length: 5 }, (_, i) => <SkeletonLine key={i} />)}</>
        : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <MetricRow label="Raw Ingests Today"   value={stats.rawIngestsToday}              color={CLR.blue}   />
            <MetricRow label="Normalized Today"    value={stats.normalizedToday}              color={CLR.green}  />
            <MetricRow label="Failed Ingestions"   value={stats.failedIngestions}             color={CLR.red}    />
            <MetricRow label="Pending Review"      value={stats.pendingReview}                color={CLR.orange} />
            <MetricRow label="Avg Process Time"    value={`${stats.avgProcessTimeSec}s`}      color={CLR.muted}  />
            <MetricRow label="Last Sync"           value={formatRelative(stats.lastSyncAt)}   color={CLR.green}  />
          </div>
        )
      }
    </div>
  );
}

function SourcePanel({ sources, loading }: { sources: CaseLibraryMetrics['sourceBreakdown'] | undefined; loading: boolean }) {
  const total = sources ? sources.reduce((s, x) => s + x.count, 0) : 1;
  return (
    <div style={{ ...CARD_STYLE, padding: '14px 16px' }}>
      <PanelHead icon={Layers} title="Source Coverage" />
      {loading || !sources
        ? <>{Array.from({ length: 4 }, (_, i) => <SkeletonLine key={i} />)}</>
        : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontSize: 9.5, color: CLR.muted, marginBottom: 2 }}>
              Cumulative cases by contributing source.
            </div>
            {sources.map(({ source, count, color }) => (
              <div key={source}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ fontSize: 10.5, color: CLR.muted }}>{source}</span>
                </div>
                <MiniBar value={count} max={total} color={color} />
              </div>
            ))}
          </div>
        )
      }
    </div>
  );
}

function SeverityPanel({ dist, loading }: { dist: CaseLibraryMetrics['severityDistribution'] | undefined; loading: boolean }) {
  const total = dist ? dist.reduce((s, x) => s + x.count, 0) : 1;
  const order = ['critical', 'high', 'medium', 'low'];
  const sorted = dist ? [...dist].sort((a, b) => order.indexOf(a.severity) - order.indexOf(b.severity)) : [];
  return (
    <div style={{ ...CARD_STYLE, padding: '14px 16px' }}>
      <PanelHead icon={AlertTriangle} title="Severity Distribution" />
      {loading || !dist
        ? <>{Array.from({ length: 4 }, (_, i) => <SkeletonLine key={i} />)}</>
        : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {sorted.map(({ severity, count }) => (
              <div key={severity}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ fontSize: 10.5, color: CLR.muted, textTransform: 'capitalize' as const }}>{severity}</span>
                </div>
                <MiniBar value={count} max={total} color={severityColor(severity)} />
              </div>
            ))}
          </div>
        )
      }
    </div>
  );
}

function ReplayPanel({ stats, loading }: { stats: CaseLibraryMetrics['replayStats'] | undefined; loading: boolean }) {
  return (
    <div style={{ ...CARD_STYLE, padding: '14px 16px' }}>
      <PanelHead icon={Zap} title="Replay Coverage" />
      {loading || !stats
        ? <>{Array.from({ length: 5 }, (_, i) => <SkeletonLine key={i} />)}</>
        : (
          <>
            <div style={{ textAlign: 'center', margin: '2px 0 10px' }}>
              <span style={{ fontSize: 28, fontWeight: 800, color: CLR.blue, lineHeight: 1 }}>{stats.coveragePct}%</span>
              <div style={{ fontSize: 9.5, color: CLR.muted, marginTop: 2 }}>coverage</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <MetricRow label="Available" value={stats.available} color={CLR.blue}   />
              <MetricRow label="Passed"    value={stats.passed}    color={CLR.green}  />
              <MetricRow label="Failed"    value={stats.failed}    color={CLR.red}    />
              <MetricRow label="Pending"   value={stats.pending}   color={CLR.gold}   />
              <MetricRow label="Missing"   value={stats.missing}   color={CLR.muted}  />
            </div>
          </>
        )
      }
    </div>
  );
}

function DoctrinePanel({ stats, loading }: { stats: CaseLibraryMetrics['doctrineStats'] | undefined; loading: boolean }) {
  return (
    <div style={{ ...CARD_STYLE, padding: '14px 16px' }}>
      <PanelHead icon={BookOpen} title="Doctrine Outcomes" />
      {loading || !stats
        ? <>{Array.from({ length: 5 }, (_, i) => <SkeletonLine key={i} />)}</>
        : (
          <>
            <div style={{ textAlign: 'center', margin: '2px 0 10px' }}>
              <span style={{ fontSize: 28, fontWeight: 800, color: CLR.gold, lineHeight: 1 }}>{stats.linkedPct}%</span>
              <div style={{ fontSize: 9.5, color: CLR.muted, marginTop: 2 }}>covered</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <MetricRow label="Linked"    value={stats.linked}    color={CLR.green}  />
              <MetricRow label="Updated"   value={stats.updated}   color={CLR.gold}   />
              <MetricRow label="Pending"   value={stats.pending}   color={CLR.orange} />
              <MetricRow label="Unlinked"  value={stats.none}      color={CLR.muted}  />
            </div>
          </>
        )
      }
    </div>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────

export function CaseLibraryMetricsPanel({ metrics, loading }: Props) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
      <IngestionPanel stats={metrics?.ingestionStats}    loading={loading} />
      <SourcePanel    sources={metrics?.sourceBreakdown} loading={loading} />
      <SeverityPanel  dist={metrics?.severityDistribution} loading={loading} />
      <ReplayPanel    stats={metrics?.replayStats}       loading={loading} />
      <DoctrinePanel  stats={metrics?.doctrineStats}     loading={loading} />
    </div>
  );
}
