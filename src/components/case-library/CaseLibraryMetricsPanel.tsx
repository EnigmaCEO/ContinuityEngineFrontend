import { useState } from 'react';
import { Database, Layers, AlertTriangle, Zap, BookOpen, ChevronDown, ChevronRight } from 'lucide-react';
import type { CaseLibraryMetrics, CorpusReconciliation, SourceProviderStatus } from '@/lib/case-library/types';
import { CLR, CARD_STYLE, severityColor, formatRelative } from '@/lib/case-library/utils';

interface Props {
  metrics:        CaseLibraryMetrics | null;
  loading:        boolean;
  providerStatus?: SourceProviderStatus[];
  corpusReconciliation?: CorpusReconciliation | null;
  onViewProviders?: () => void;
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

function Pill({ label, color, mono = false }: { label: string; color: string; mono?: boolean }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      fontSize: 8.5, padding: '2px 7px', borderRadius: 4, fontWeight: 650,
      color, background: `${color}16`, border: `1px solid ${color}32`,
      fontFamily: mono ? 'var(--font-geist-mono,monospace)' : undefined,
      whiteSpace: 'nowrap' as const,
    }}>
      {label}
    </span>
  );
}

function priorityColor(priority: string): string {
  if (priority === 'critical') return '#EF4444';
  if (priority === 'high') return '#F97316';
  if (priority === 'medium') return '#F59E0B';
  return '#64748B';
}

function SkeletonLine() {
  return <div style={{ height: 11, borderRadius: 3, background: 'rgba(255,255,255,0.05)', marginBottom: 8 }} />;
}

function validationVocabulary(text: string): string {
  return text
    .replaceAll('Auto-replay', 'Auto-validation')
    .replaceAll('auto-replay', 'auto-validation')
    .replaceAll('replayed', 'validated')
    .replaceAll('Replayable', 'Ready for Validation')
    .replaceAll('replayable', 'ready for validation')
    .replaceAll('replaying', 'validating')
    .replaceAll('Replay', 'Validation')
    .replaceAll('replay', 'validation')
    .replaceAll('REPLAY', 'VALIDATION');
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
            <MetricRow label="Pending Review"      value={stats.pendingReview}                color={stats.reviewQueueUnconsumed ? CLR.muted : CLR.orange} />
            {stats.reviewQueueUnconsumed && stats.reviewQueueSeamNote && (
              /* A 0 here looks like "nothing to do". It is a computed queue with
                 no consumer — the seam where White Team attaches. */
              <div style={{ fontSize: 10, color: CLR.muted, lineHeight: 1.5, paddingLeft: 2, marginTop: -4 }}>
                {stats.reviewQueueSeamNote}
              </div>
            )}
            <MetricRow label="Avg Process Time"    value={`${stats.avgProcessTimeSec}s`}      color={CLR.muted}  />
            <MetricRow label="Last Sync"           value={formatRelative(stats.lastSyncAt)}   color={CLR.green}  />
          </div>
        )
      }
    </div>
  );
}

const SOURCE_COLORS: Record<string, string> = {
  'CISA KEV':          '#EF4444',
  'NVD CVE':           '#3B82F6',
  'GitHub Advisories': '#8B5CF6',
  'De.Fi REKT':        '#F59E0B',
  'OSV':               '#6366F1',
  'FIRST EPSS':        '#F97316',
  'Exploit-DB':         '#DC2626',
};

function providerDisplayStatus(p: SourceProviderStatus): { label: string; color: string } {
  if (!p.enabled)    return { label: 'DISABLED',    color: '#64748B' };
  if (p.lastError)   return { label: 'ERROR',        color: '#EF4444' };
  if (p.lastWarning) return { label: 'WARNING',      color: '#F59E0B' };
  if (!p.lastRun)    return { label: 'REGISTERED',   color: '#475569' };
  return               { label: 'ACTIVE',            color: '#10B981' };
}

const ROLE_LABELS: Record<string, { label: string; color: string }> = {
  creates:  { label: 'creates cases',  color: '#3B82F6' },
  enriches: { label: 'enriches cases', color: '#10B981' },
};

const TAG_COLORS: Record<string, string> = {
  package_intelligence: '#6366F1',
  vulnerability_feed:   '#8B5CF6',
  incident_source:      '#F59E0B',
  known_exploited:      '#EF4444',
  exploit_pressure:     '#F97316',
  cve_enrichment:       '#10B981',
  cve_database:         '#3B82F6',
  web3:                 '#F97316',
  public_exploit_signal:'#DC2626',
};

function ProviderDrilldown({ p, srcColor }: { p: SourceProviderStatus; srcColor: string }) {
  return (
    <div style={{
      marginTop: 8, padding: '9px 10px',
      background: 'rgba(255,255,255,0.025)',
      border: `1px solid ${srcColor}28`,
      borderRadius: 5,
    }}>
      {/* Description */}
      {p.description && (
        <div style={{ fontSize: 9.5, color: 'rgba(226,232,240,0.65)', lineHeight: '1.5', marginBottom: 8 }}>
          {p.description}
        </div>
      )}

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: 8 }}>
        {[
          { label: 'Registered', value: p.registered ? 'Yes' : 'No', color: CLR.green },
          { label: 'Enabled',    value: p.enabled    ? 'Yes' : 'No', color: p.enabled ? CLR.green : '#64748B' },
          { label: 'Contributed', value: String(p.contributedRecords), color: srcColor },
        ].map(({ label, value, color }) => (
          <div key={label} style={{
            padding: '5px 7px', borderRadius: 4,
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.07)',
          }}>
            <div style={{ fontSize: 8, color: CLR.muted, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase' as const, marginBottom: 2 }}>{label}</div>
            <div style={{ fontSize: 11, fontWeight: 700, color }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Roles */}
      {p.roles && p.roles.length > 0 && (
        <div style={{ marginBottom: 7 }}>
          <div style={{ fontSize: 8, color: CLR.muted, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase' as const, marginBottom: 4 }}>Role</div>
          <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 4 }}>
            {p.roles.map((r) => {
              const rl = ROLE_LABELS[r] ?? { label: r, color: CLR.muted };
              return <Pill key={r} label={rl.label} color={rl.color} />;
            })}
          </div>
        </div>
      )}

      {/* Tags */}
      {p.tags && p.tags.length > 0 && (
        <div style={{ marginBottom: 7 }}>
          <div style={{ fontSize: 8, color: CLR.muted, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase' as const, marginBottom: 4 }}>Tags</div>
          <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 4 }}>
            {p.tags.map((t) => {
              const tc = TAG_COLORS[t] ?? '#475569';
              return <Pill key={t} label={t.replace(/_/g, ' ')} color={tc} mono />;
            })}
          </div>
        </div>
      )}

      {/* Last run */}
      <div style={{ marginBottom: p.lastActivityLine || p.lastWarning || p.lastError ? 7 : 0 }}>
        <div style={{ fontSize: 8, color: CLR.muted, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase' as const, marginBottom: 2 }}>Last Run</div>
        <span style={{ fontSize: 9.5, color: p.lastRun ? CLR.text : CLR.muted, fontFamily: 'var(--font-geist-mono,monospace)' }}>
          {p.lastRun ? formatRelative(p.lastRun) : 'never'}
        </span>
      </div>

      {/* Last activity line */}
      {p.lastActivityLine && (
        <div style={{ marginBottom: p.lastWarning || p.lastError ? 7 : 0 }}>
          <div style={{ fontSize: 8, color: CLR.muted, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase' as const, marginBottom: 2 }}>Last Activity</div>
          <div style={{
            fontSize: 8.5, color: 'rgba(226,232,240,0.55)', lineHeight: '1.4',
            fontFamily: 'var(--font-geist-mono,monospace)',
            overflow: 'hidden', display: '-webkit-box',
            WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const,
          }}>
            {validationVocabulary(p.lastActivityLine)}
          </div>
        </div>
      )}

      {/* Warning */}
      {p.lastWarning && (
        <div style={{ marginBottom: p.lastError ? 5 : 0 }}>
          <div style={{ fontSize: 8, color: '#F59E0B', fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase' as const, marginBottom: 2 }}>Last Warning</div>
          <div style={{ fontSize: 9, color: '#FCD34D', lineHeight: '1.4', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
            {validationVocabulary(p.lastWarning)}
          </div>
        </div>
      )}

      {/* Error */}
      {p.lastError && (
        <div>
          <div style={{ fontSize: 8, color: '#EF4444', fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase' as const, marginBottom: 2 }}>Last Error</div>
          <div style={{ fontSize: 9, color: '#FCA5A5', lineHeight: '1.4', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
            {validationVocabulary(p.lastError)}
          </div>
        </div>
      )}
    </div>
  );
}

function ProviderHealthPanel({
  providerStatus, corpusReconciliation, lastSyncAt, loading, onViewProviders,
}: {
  providerStatus?: SourceProviderStatus[];
  corpusReconciliation?: CorpusReconciliation | null;
  lastSyncAt?: string;
  loading: boolean;
  onViewProviders?: () => void;
}) {
  const providers = providerStatus ?? [];
  const total = providers.filter((p) => p.registered).length;
  const active = providers.filter((p) => providerDisplayStatus(p).label === 'ACTIVE').length;
  const warnings = providers.filter((p) => providerDisplayStatus(p).label === 'WARNING').length;
  const errors = providers.filter((p) => providerDisplayStatus(p).label === 'ERROR').length;
  const disabled = providers.filter((p) => providerDisplayStatus(p).label === 'DISABLED').length;
  const latestProviderRun = providers
    .map((p) => p.lastRun)
    .filter((ts): ts is string => Boolean(ts))
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0];
  const syncTime = latestProviderRun ?? lastSyncAt;
  const roleCounts = [
    { label: 'Case Sources', value: providers.filter((p) => p.roles.includes('creates')).length, color: '#3B82F6' },
    { label: 'Enrichers', value: providers.filter((p) => p.roles.includes('enriches')).length, color: '#10B981' },
    { label: 'Package Intel', value: providers.filter((p) => p.tags.includes('package_intelligence')).length, color: '#6366F1' },
    { label: 'Exploit Signals', value: providers.filter((p) => p.tags.includes('public_exploit_signal') || p.tags.includes('exploit_pressure') || p.source === 'Exploit-DB').length, color: '#DC2626' },
    { label: 'Advisory Sources', value: providers.filter((p) => p.tags.includes('incident_source')).length, color: '#F59E0B' },
  ];

  return (
    <div style={{ ...CARD_STYLE, padding: '14px 16px' }}>
      <PanelHead icon={Layers} title="Provider Health" />
      {loading
        ? <>{Array.from({ length: 5 }, (_, i) => <SkeletonLine key={i} />)}</>
        : providers.length > 0
          ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <div style={{ fontSize: 26, fontWeight: 850, color: CLR.green, lineHeight: 1 }}>{active}</div>
                <div style={{ fontSize: 9.5, color: CLR.muted, marginTop: 3 }}>
                  {active} active · {warnings} warnings · {errors} errors · {disabled} disabled
                </div>
                {corpusReconciliation && corpusReconciliation.deduplicated > 0 && (
                  /* Provider contributions exceed the corpus because an advisory
                     confirmed by several providers is one case. Without the dedup
                     figure the two totals simply look contradictory. */
                  <div style={{ fontSize: 9.5, color: CLR.muted, marginTop: 6, lineHeight: 1.5 }}>
                    {corpusReconciliation.providerContributions.toLocaleString()} contributions →{' '}
                    {corpusReconciliation.corpusTotal.toLocaleString()} cases ·{' '}
                    <span style={{ color: CLR.green }}>{corpusReconciliation.deduplicated.toLocaleString()} deduplicated</span>
                  </div>
                )}
                <div style={{ fontSize: 9, color: CLR.muted, marginTop: 3 }}>
                  {total} registered{syncTime ? ` · last sync ${formatRelative(syncTime)}` : ''}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px 12px', paddingTop: 2 }}>
                {roleCounts.map((item) => (
                  <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                    <span style={{ fontSize: 9.5, color: CLR.muted }}>{item.label}</span>
                    <span style={{ fontSize: 10, fontWeight: 750, color: item.color }}>{item.value}</span>
                  </div>
                ))}
              </div>
              {onViewProviders && (
                <button
                  type="button"
                  onClick={onViewProviders}
                  style={{
                    alignSelf: 'flex-start',
                    background: 'rgba(212,175,55,0.08)',
                    border: '1px solid rgba(212,175,55,0.24)',
                    color: CLR.gold,
                    borderRadius: 5,
                    padding: '5px 8px',
                    fontSize: 9.5,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  View Intelligence Providers
                </button>
              )}
            </div>
          )
          : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontSize: 10, color: CLR.muted }}>No provider status yet.</div>
              {onViewProviders && (
                <button
                  type="button"
                  onClick={onViewProviders}
                  style={{
                    alignSelf: 'flex-start',
                    background: 'rgba(212,175,55,0.08)',
                    border: '1px solid rgba(212,175,55,0.24)',
                    color: CLR.gold,
                    borderRadius: 5,
                    padding: '5px 8px',
                    fontSize: 9.5,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  View Intelligence Providers
                </button>
              )}
            </div>
          )
      }
    </div>
  );
}

export function IntelligenceProvidersSection({
  providerStatus, loading,
}: {
  providerStatus?: SourceProviderStatus[];
  loading: boolean;
}) {
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const providers = providerStatus ?? [];
  const maxContrib = Math.max(...providers.map((p) => p.contributedRecords), 1);

  return (
    <section style={{ ...CARD_STYLE, padding: '16px 18px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
        <PanelHead icon={Layers} title="Intelligence Providers" />
        <div style={{ fontSize: 9, color: CLR.muted, textAlign: 'right' as const }}>
          Operational visibility for case sources, enrichment providers, package intelligence, and exploit signals
        </div>
      </div>

      {loading
        ? <>{Array.from({ length: 5 }, (_, i) => <SkeletonLine key={i} />)}</>
        : providers.length === 0
          ? <div style={{ fontSize: 10.5, color: CLR.muted }}>No provider status available.</div>
          : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, overflowX: 'auto' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(170px, 1.1fr) 86px minmax(130px, 0.8fr) minmax(170px, 1fr) 80px 82px minmax(120px, 1fr) minmax(120px, 1fr)',
                gap: 10,
                padding: '0 8px 7px',
                minWidth: 1080,
                borderBottom: `1px solid ${CLR.border}`,
                color: CLR.muted,
                fontSize: 8.5,
                fontWeight: 750,
                letterSpacing: '0.08em',
                textTransform: 'uppercase' as const,
              }}>
                {['Provider', 'Status', 'Roles', 'Tags', 'Records', 'Last Run', 'Warning', 'Error'].map((label) => <span key={label}>{label}</span>)}
              </div>
              {providers.map((p) => {
                const { label, color } = providerDisplayStatus(p);
                const srcColor = SOURCE_COLORS[p.source] ?? '#6B7280';
                const isOpen = expandedKey === p.sourceKey;
                return (
                  <div key={p.sourceKey} style={{
                    border: `1px solid ${isOpen ? `${srcColor}45` : 'rgba(255,255,255,0.07)'}`,
                    borderRadius: 6,
                    background: isOpen ? `${srcColor}08` : 'rgba(255,255,255,0.018)',
                    overflow: 'hidden',
                  }}>
                    <div
                      onClick={() => setExpandedKey(isOpen ? null : p.sourceKey)}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'minmax(170px, 1.1fr) 86px minmax(130px, 0.8fr) minmax(170px, 1fr) 80px 82px minmax(120px, 1fr) minmax(120px, 1fr)',
                        gap: 10,
                        alignItems: 'center',
                        minWidth: 1080,
                        padding: '9px 10px',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
                        {isOpen
                          ? <ChevronDown size={12} style={{ color: CLR.muted, flexShrink: 0 }} />
                          : <ChevronRight size={12} style={{ color: CLR.muted, flexShrink: 0 }} />
                        }
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 11.5, color: CLR.text, fontWeight: 700, whiteSpace: 'nowrap' as const, overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.source}</div>
                          <div style={{ fontSize: 8.5, color: CLR.muted, fontFamily: 'var(--font-geist-mono,monospace)' }}>{p.sourceKey}</div>
                        </div>
                      </div>
                      <Pill label={label} color={color} />
                      <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 4 }}>
                        {p.roles.map((role) => {
                          const rl = ROLE_LABELS[role] ?? { label: role, color: CLR.muted };
                          return <Pill key={role} label={rl.label} color={rl.color} />;
                        })}
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 4 }}>
                        {p.tags.map((tag) => <Pill key={tag} label={tag} color={TAG_COLORS[tag] ?? '#64748B'} mono />)}
                      </div>
                      <div>
                        <span style={{ fontSize: 11, color: CLR.text, fontWeight: 750 }}>{p.contributedRecords}</span>
                        <MiniBar value={p.contributedRecords} max={maxContrib} color={p.enabled ? srcColor : '#374151'} />
                      </div>
                      <span style={{ fontSize: 9.5, color: p.lastRun ? CLR.text : CLR.muted }}>{p.lastRun ? formatRelative(p.lastRun) : 'never'}</span>
                      <span style={{ fontSize: 9, color: p.lastWarning ? '#FCD34D' : CLR.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                        {p.lastWarning ? validationVocabulary(p.lastWarning) : 'none'}
                      </span>
                      <span style={{ fontSize: 9, color: p.lastError ? '#FCA5A5' : CLR.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                        {p.lastError ? validationVocabulary(p.lastError) : 'none'}
                      </span>
                    </div>
                    {isOpen && (
                      <div style={{ padding: '0 10px 10px 29px' }}>
                        <ProviderDrilldown p={p} srcColor={srcColor} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )
      }
    </section>
  );
}

function SeverityPanel({ dist, loading }: { dist: CaseLibraryMetrics['severityDistribution'] | undefined; loading: boolean }) {
  const total = dist ? dist.reduce((s, x) => s + x.count, 0) : 1;
  const order = ['critical', 'high', 'medium', 'low'] as const;
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

function PriorityPanel({ dist, loading }: { dist: CaseLibraryMetrics['priorityDistribution'] | undefined; loading: boolean }) {
  const order = ['critical', 'high', 'medium', 'low'] as const;
  const values = new Map((dist ?? []).map((item) => [item.priorityBand, item.count]));
  const total = Math.max(1, [...values.values()].reduce((sum, count) => sum + count, 0));
  const topCount = (values.get('critical') ?? 0) + (values.get('high') ?? 0);

  return (
    <div style={{
      ...CARD_STYLE,
      padding: '14px 16px',
      borderColor: 'rgba(249,115,22,0.34)',
      background: 'linear-gradient(180deg, rgba(249,115,22,0.055), rgba(255,255,255,0.018))',
    }}>
      <PanelHead icon={AlertTriangle} title="Review Priority" />
      {loading || !dist
        ? <>{Array.from({ length: 4 }, (_, i) => <SkeletonLine key={i} />)}</>
        : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }}>
              <div style={{ fontSize: 28, fontWeight: 850, color: '#F97316', lineHeight: 1 }}>
                {topCount}
              </div>
              <div style={{ fontSize: 9.5, color: CLR.muted, lineHeight: '1.35', textAlign: 'right' as const }}>
                critical or high<br />priority cases
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {order.map((priority) => {
                const count = values.get(priority) ?? 0;
                return (
                  <div key={priority}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                      <span style={{ fontSize: 10.5, color: CLR.muted, textTransform: 'capitalize' as const }}>{priority}</span>
                    </div>
                    <MiniBar value={count} max={total} color={priorityColor(priority)} />
                  </div>
                );
              })}
            </div>
          </div>
        )
      }
    </div>
  );
}

function ReplayPanel({ stats, loading }: { stats: CaseLibraryMetrics['replayStats'] | undefined; loading: boolean }) {
  return (
    <div style={{ ...CARD_STYLE, padding: '14px 16px' }}>
      <PanelHead icon={Zap} title="Validation Coverage" />
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

export function CaseLibraryMetricsPanel({ metrics, loading, providerStatus, onViewProviders }: Props) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(185px, 1fr))', gap: 10 }}>
      <IngestionPanel       stats={metrics?.ingestionStats}       loading={loading} />
      <ProviderHealthPanel  providerStatus={providerStatus}
                            lastSyncAt={metrics?.ingestionStats?.lastSyncAt}
                            loading={loading}
                            onViewProviders={onViewProviders} />
      <SeverityPanel        dist={metrics?.severityDistribution}  loading={loading} />
      <PriorityPanel        dist={metrics?.priorityDistribution}  loading={loading} />
      <ReplayPanel          stats={metrics?.replayStats}          loading={loading} />
      <DoctrinePanel        stats={metrics?.doctrineStats}        loading={loading} />
    </div>
  );
}
