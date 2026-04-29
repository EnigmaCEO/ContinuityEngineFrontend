"use client";

import { useEffect, useState } from 'react';
import { X, ExternalLink, Play, BookOpen, Loader2, AlertTriangle } from 'lucide-react';
import type { CaseLibraryRecord } from '@/lib/case-library/types';
import { CLR, formatTs } from '@/lib/case-library/utils';
import { enrichDoctrine, runReplay } from '@/lib/case-library/service';
import { SeverityBadge } from './badges/SeverityBadge';
import { StatusBadge }   from './badges/StatusBadge';
import { ReplayBadge }   from './badges/ReplayBadge';
import { DoctrineBadge } from './badges/DoctrineBadge';

interface Props {
  record:     CaseLibraryRecord;
  onClose:    () => void;
  onRefresh?: () => void;
}

const DRAWER_WIDTH = 500;

// ── Shared sub-components ─────────────────────────────────────────────────────

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '130px 1fr', gap: 8,
      alignItems: 'start', padding: '6px 0',
      borderBottom: '1px solid rgba(212,175,55,0.07)',
    }}>
      <span style={{
        fontSize: 9.5, color: CLR.muted, letterSpacing: '0.08em',
        fontWeight: 600, textTransform: 'uppercase' as const, paddingTop: 2,
      }}>
        {label}
      </span>
      <div style={{ fontSize: 11, color: CLR.text, wordBreak: 'break-word' as const }}>
        {children}
      </div>
    </div>
  );
}

function FooterButton({
  icon, label, onClick, disabled = false, loading = false,
}: {
  icon: React.ReactNode; label: string;
  onClick?: () => void; disabled?: boolean; loading?: boolean;
}) {
  return (
    <button
      disabled={disabled || loading}
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        background: disabled ? 'rgba(255,255,255,0.03)' : 'rgba(212,175,55,0.1)',
        border: `1px solid ${disabled ? CLR.border : 'rgba(212,175,55,0.3)'}`,
        borderRadius: 6, padding: '7px 14px',
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        fontSize: 11, color: disabled ? CLR.muted : CLR.text,
        opacity: disabled ? 0.55 : 1, fontWeight: 500,
      }}
    >
      {loading ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : icon}
      {label}
    </button>
  );
}

// ── Inline Replay Panel ───────────────────────────────────────────────────────
// Always visible — shows action button + eligibility reason + result output.

function ReplayPanel({
  c, replaying, replayError, onReplay,
}: {
  c: CaseLibraryRecord;
  replaying: boolean;
  replayError: string | null;
  onReplay: () => void;
}) {
  const eligible            = c.replayEligibility === true;
  const hasResult           = !!(c.replaySummary || c.replayScenario);
  const doctrineOk          = c.doctrineStatus === 'linked' || c.doctrineStatus === 'updated';
  const hasDoctrineTags     = !!(c.doctrineTags && c.doctrineTags.length > 0);
  const hasRecommendedActs  = !!(c.recommendedActions && c.recommendedActions.length > 0);

  const disabledReason = eligible ? null
    : !doctrineOk
      ? 'Doctrine enrichment required'
      : !hasDoctrineTags
        ? 'Doctrine tags missing — re-run doctrine enrichment'
        : !hasRecommendedActs
          ? 'Recommended actions missing — re-run doctrine enrichment'
          : 'Replay not eligible for this case type';

  return (
    <div style={{
      marginTop: 14, borderRadius: 7,
      border: `1px solid ${hasResult ? 'rgba(16,185,129,0.28)' : 'rgba(255,255,255,0.08)'}`,
      background: hasResult ? 'rgba(16,185,129,0.04)' : 'rgba(255,255,255,0.02)',
      overflow: 'hidden',
    }}>
      {/* Panel header row */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '9px 12px',
        borderBottom: hasResult ? '1px solid rgba(16,185,129,0.12)' : 'none',
        background: hasResult ? 'rgba(16,185,129,0.06)' : 'transparent',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontSize: 9.5, color: '#10B981', fontWeight: 700,
            letterSpacing: '0.12em', textTransform: 'uppercase' as const,
          }}>
            Case Replay
          </span>
          <ReplayBadge status={c.replayStatus} />
        </div>

        {/* Action button */}
        <button
          onClick={eligible && !replaying ? onReplay : undefined}
          disabled={!eligible || replaying}
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            background: eligible ? 'rgba(16,185,129,0.14)' : 'rgba(255,255,255,0.04)',
            border: `1px solid ${eligible ? 'rgba(16,185,129,0.35)' : 'rgba(255,255,255,0.1)'}`,
            borderRadius: 5, padding: '5px 12px',
            cursor: eligible && !replaying ? 'pointer' : 'not-allowed',
            fontSize: 10.5, fontWeight: 600,
            color: eligible ? '#10B981' : CLR.muted,
            opacity: !eligible || replaying ? 0.7 : 1,
            transition: 'opacity 0.15s',
          }}
        >
          {replaying
            ? <Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} />
            : <Play size={11} />}
          {replaying ? 'Running…' : c.replayStatus === 'passed' ? 'Re-run Replay' : 'Run Replay'}
        </button>
      </div>

      {/* Eligibility reason */}
      {!eligible && disabledReason && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '7px 12px',
          fontSize: 10, color: '#F59E0B',
          borderBottom: '1px solid rgba(245,158,11,0.1)',
          background: 'rgba(245,158,11,0.04)',
        }}>
          <AlertTriangle size={10} style={{ flexShrink: 0 }} />
          {disabledReason}
        </div>
      )}

      {/* Replay result output */}
      {hasResult && (
        <div style={{ padding: '10px 12px' }}>
          {c.replayScenario && (
            <div style={{ marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 9, color: CLR.muted, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' as const }}>Scenario</span>
              <span style={{
                fontFamily: 'var(--font-geist-mono,monospace)', color: '#10B981', fontSize: 9,
                padding: '1px 6px', borderRadius: 3,
                background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)',
              }}>
                {c.replayScenario}
              </span>
            </div>
          )}

          {c.replaySummary && (
            <div style={{
              fontSize: 10.5, color: 'rgba(226,232,240,0.75)', lineHeight: '1.55', marginBottom: 8,
            }}>
              {c.replaySummary}
            </div>
          )}

          {c.expectedControl && (
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 9, color: CLR.muted, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase' as const, marginBottom: 3 }}>Expected Control</div>
              <div style={{ fontSize: 10.5, color: 'rgba(226,232,240,0.75)' }}>{c.expectedControl}</div>
            </div>
          )}

          {c.affectedInvariants && c.affectedInvariants.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 9, color: CLR.muted, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase' as const, marginBottom: 4 }}>Affected Invariants</div>
              <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 4 }}>
                {c.affectedInvariants.map((inv) => (
                  <span key={inv} style={{
                    fontSize: 9, padding: '2px 7px', borderRadius: 4,
                    background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)',
                    color: '#10B981', fontFamily: 'var(--font-geist-mono,monospace)',
                  }}>
                    {inv}
                  </span>
                ))}
              </div>
            </div>
          )}

          {c.replayConfidence != null && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 9.5, color: CLR.muted }}>
              <span>Confidence: <span style={{ color: 'rgba(226,232,240,0.85)' }}>{Math.round(c.replayConfidence * 100)}%</span></span>
              {c.replayResult && (
                <span style={{
                  fontWeight: 700, fontSize: 9, letterSpacing: '0.08em',
                  color: c.replayResult === 'pass' ? '#10B981' : '#EF4444',
                }}>
                  {c.replayResult.toUpperCase()}
                </span>
              )}
              {c.replayedAt && (
                <span style={{ fontFamily: 'var(--font-geist-mono,monospace)', fontSize: 9 }}>
                  {formatTs(c.replayedAt)}
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Inline error */}
      {replayError && (
        <div style={{
          margin: '0 12px 10px', padding: '6px 10px', borderRadius: 5,
          background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)',
          fontSize: 10, color: '#FCA5A5',
        }}>
          {replayError}
        </div>
      )}
    </div>
  );
}

// ── Doctrine Enrichment Section ───────────────────────────────────────────────

function EnrichmentSection({ c }: { c: CaseLibraryRecord }) {
  if (!c.enrichmentSummary && (!c.doctrineTags || c.doctrineTags.length === 0)) return null;

  return (
    <div style={{
      marginTop: 14, padding: '10px 12px',
      background: 'rgba(212,175,55,0.04)',
      border: '1px solid rgba(212,175,55,0.18)',
      borderRadius: 6,
    }}>
      <div style={{ fontSize: 9.5, color: CLR.gold, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const, marginBottom: 8 }}>
        Doctrine Enrichment
      </div>

      {c.enrichmentSummary && (
        <div style={{ fontSize: 10.5, color: 'rgba(226,232,240,0.7)', lineHeight: '1.5', marginBottom: 8 }}>
          {c.enrichmentSummary}
        </div>
      )}

      {c.doctrineTags && c.doctrineTags.length > 0 && (
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 9, color: CLR.muted, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase' as const, marginBottom: 4 }}>Tags</div>
          <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 4 }}>
            {c.doctrineTags.map((t) => (
              <span key={t} style={{
                fontSize: 9, padding: '2px 7px', borderRadius: 4,
                background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.25)',
                color: CLR.gold, fontFamily: 'var(--font-geist-mono,monospace)',
              }}>
                {t}
              </span>
            ))}
          </div>
        </div>
      )}

      {c.continuityImplications && c.continuityImplications.length > 0 && (
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 9, color: CLR.muted, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase' as const, marginBottom: 4 }}>Continuity Implications</div>
          <ul style={{ margin: 0, paddingLeft: 14, display: 'flex', flexDirection: 'column', gap: 3 }}>
            {c.continuityImplications.map((imp, i) => (
              <li key={i} style={{ fontSize: 10.5, color: 'rgba(226,232,240,0.75)', lineHeight: '1.45' }}>{imp}</li>
            ))}
          </ul>
        </div>
      )}

      {c.recommendedActions && c.recommendedActions.length > 0 && (
        <div>
          <div style={{ fontSize: 9, color: CLR.muted, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase' as const, marginBottom: 4 }}>Recommended Actions</div>
          <ul style={{ margin: 0, paddingLeft: 14, display: 'flex', flexDirection: 'column', gap: 3 }}>
            {c.recommendedActions.map((act, i) => (
              <li key={i} style={{ fontSize: 10.5, color: 'rgba(226,232,240,0.75)', lineHeight: '1.45' }}>{act}</li>
            ))}
          </ul>
        </div>
      )}

      {c.enrichmentConfidence != null && (
        <div style={{ marginTop: 8, fontSize: 9.5, color: CLR.muted }}>
          Confidence: <span style={{ color: CLR.text }}>{Math.round(c.enrichmentConfidence * 100)}%</span>
          {c.replayEligibility && (
            <span style={{ marginLeft: 10, color: '#10B981' }}>Replay eligible</span>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Drawer ───────────────────────────────────────────────────────────────

export function CasePreviewDrawer({ record: initialRecord, onClose, onRefresh }: Props) {
  const [c, setC] = useState<CaseLibraryRecord>(initialRecord);
  const [enriching,   setEnriching]   = useState(false);
  const [enrichError, setEnrichError] = useState<string | null>(null);
  const [replaying,   setReplaying]   = useState(false);
  const [replayError, setReplayError] = useState<string | null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function handleEnrichDoctrine() {
    setEnriching(true);
    setEnrichError(null);
    try {
      const enriched = await enrichDoctrine(c.caseId);
      setC(enriched);
      onRefresh?.();
    } catch (e) {
      setEnrichError((e as Error).message ?? 'Enrichment failed');
    } finally {
      setEnriching(false);
    }
  }

  async function handleRunReplay() {
    setReplaying(true);
    setReplayError(null);
    try {
      const replayed = await runReplay(c.caseId);
      setC(replayed);
      onRefresh?.();
    } catch (e) {
      setReplayError((e as Error).message ?? 'Replay failed');
    } finally {
      setReplaying(false);
    }
  }

  const alreadyEnriched = c.doctrineStatus === 'linked' || c.doctrineStatus === 'updated';

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 900 }}
      />

      {/* Panel */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: DRAWER_WIDTH, zIndex: 901,
        background: '#0d0f16',
        borderLeft: `1px solid rgba(212,175,55,0.2)`,
        display: 'flex', flexDirection: 'column',
        boxShadow: '-8px 0 40px rgba(0,0,0,0.6)',
      }}>

        {/* Header */}
        <div style={{
          padding: '14px 18px',
          borderBottom: `1px solid ${CLR.border}`,
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10,
        }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{
                fontSize: 9, fontFamily: 'var(--font-geist-mono,monospace)',
                color: CLR.gold, letterSpacing: '0.05em', fontWeight: 700,
              }}>
                {c.caseId}
              </span>
              <SeverityBadge severity={c.severity} />
              <StatusBadge status={c.status} />
            </div>
            <div style={{
              fontSize: 12.5, fontWeight: 600, color: CLR.text, lineHeight: '1.35',
              overflow: 'hidden', display: '-webkit-box',
              WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const,
            }}>
              {c.title}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.05)', border: `1px solid ${CLR.border}`,
              borderRadius: 6, padding: '6px', cursor: 'pointer',
              color: CLR.muted, display: 'flex', alignItems: 'center', flexShrink: 0,
            }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 18px' }}>

          {/* Summary */}
          {c.summary && (
            <div style={{
              fontSize: 11, color: 'rgba(226,232,240,0.75)', lineHeight: '1.55',
              padding: '10px 12px', background: 'rgba(255,255,255,0.03)',
              borderRadius: 6, border: `1px solid ${CLR.border}`, marginBottom: 14,
            }}>
              {c.summary}
            </div>
          )}

          {/* Field rows */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <Row label="Source">
              {c.sources && c.sources.length > 1 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 4 }}>
                  {Array.from(new Set([c.source, ...c.sources])).map((s) => (
                    <span key={s} style={{
                      fontSize: 9.5, padding: '2px 7px', borderRadius: 4,
                      background: s === c.source ? 'rgba(212,175,55,0.12)' : 'rgba(255,255,255,0.05)',
                      border: `1px solid ${s === c.source ? 'rgba(212,175,55,0.3)' : 'rgba(255,255,255,0.1)'}`,
                      color: s === c.source ? CLR.gold : CLR.muted,
                    }}>
                      {s}
                    </span>
                  ))}
                </div>
              ) : c.source}
            </Row>
            <Row label="Type">{c.type}</Row>
            <Row label="Chain">{c.chainSystem}{c.subsystem ? ` / ${c.subsystem}` : ''}</Row>
            <Row label="Doctrine"><DoctrineBadge status={c.doctrineStatus} /></Row>

            {c.cveRefs && c.cveRefs.length > 0 && (
              <Row label="CVE / GHSA">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {c.cveRefs.map((ref) => (
                    <span key={ref} style={{
                      fontSize: 10, fontFamily: 'var(--font-geist-mono,monospace)', color: '#F97316',
                    }}>
                      {ref}
                    </span>
                  ))}
                </div>
              </Row>
            )}

            {c.tags && c.tags.length > 0 && (
              <Row label="Tags">
                <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 4 }}>
                  {c.tags.map((t) => (
                    <span key={t} style={{
                      fontSize: 9, color: CLR.muted,
                      background: 'rgba(255,255,255,0.05)', borderRadius: 4, padding: '2px 6px',
                    }}>
                      {t}
                    </span>
                  ))}
                </div>
              </Row>
            )}

            {c.sourceRefs && c.sourceRefs.length > 0 && (
              <Row label="Source Refs">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {c.sourceRefs.map((ref, i) => (
                    <div key={i} style={{
                      fontSize: 10, padding: '5px 8px', borderRadius: 4,
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.08)',
                    }}>
                      <div style={{ fontWeight: 600, color: CLR.text, marginBottom: 2 }}>{ref.source}</div>
                      {ref.externalId && (
                        <div style={{ fontFamily: 'var(--font-geist-mono,monospace)', color: '#F97316', fontSize: 9.5 }}>
                          {ref.externalId}
                        </div>
                      )}
                      {ref.referenceUrls && ref.referenceUrls.length > 0 && (
                        <div style={{ marginTop: 2 }}>
                          {ref.referenceUrls.slice(0, 2).map((url) => (
                            <a
                              key={url} href={url} target="_blank" rel="noopener noreferrer"
                              style={{
                                display: 'block', fontSize: 9, color: CLR.muted,
                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const,
                              }}
                            >
                              {url}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Row>
            )}

            <Row label="Ingested">
              <span style={{ fontFamily: 'var(--font-geist-mono,monospace)', fontSize: 10.5 }}>
                {formatTs(c.ingestedAt)}
              </span>
            </Row>
            <Row label="Updated">
              <span style={{ fontFamily: 'var(--font-geist-mono,monospace)', fontSize: 10.5 }}>
                {formatTs(c.updatedAt)}
              </span>
            </Row>

            {c.rawId && (
              <Row label="Raw ID">
                <span style={{ fontFamily: 'var(--font-geist-mono,monospace)', fontSize: 10, color: CLR.muted }}>
                  {c.rawId}
                </span>
              </Row>
            )}
            {c.confidence != null && (
              <Row label="Confidence">
                <span style={{ fontSize: 11 }}>{Math.round(c.confidence * 100)}%</span>
              </Row>
            )}
            {c.outcome && <Row label="Outcome">{c.outcome}</Row>}
          </div>

          {/* ── Inline Replay Panel (always visible) ─────────────────────── */}
          <ReplayPanel
            c={c}
            replaying={replaying}
            replayError={replayError}
            onReplay={handleRunReplay}
          />

          {/* ── Doctrine Enrichment Section ───────────────────────────────── */}
          <EnrichmentSection c={c} />

          {/* Doctrine enrichment error */}
          {enrichError && (
            <div style={{
              marginTop: 10, padding: '8px 12px', borderRadius: 5,
              background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)',
              fontSize: 10.5, color: '#FCA5A5',
            }}>
              {enrichError}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 18px',
          borderTop: `1px solid ${CLR.border}`,
          display: 'flex', flexWrap: 'wrap' as const, gap: 8,
        }}>
          <FooterButton icon={<ExternalLink size={12} />} label="View Full Case" disabled />
          <FooterButton
            icon={<BookOpen size={12} />}
            label={alreadyEnriched ? 'Re-enrich Doctrine' : 'Enrich Doctrine'}
            onClick={handleEnrichDoctrine}
            loading={enriching}
          />
        </div>
      </div>
    </>
  );
}
