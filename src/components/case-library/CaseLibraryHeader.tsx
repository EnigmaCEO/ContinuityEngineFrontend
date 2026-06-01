import { FolderOpen, PlusCircle, RefreshCw, Download } from 'lucide-react';
import type { CaseLibrarySummaryStats } from '@/lib/case-library/types';
import {
  CLR, formatRelative,
  pipelineHealthColor, pipelineHealthLabel,
  libraryMaturityColor, libraryMaturityLabel,
} from '@/lib/case-library/utils';

interface Props {
  stats:     CaseLibrarySummaryStats | null;
  syncing:   boolean;
  canManageSources: boolean;
  onSync:    () => void;
  onIngest:  () => void;
  onExport:  () => void;
}

function StatusDot({ color }: { color: string }) {
  return (
    <span style={{
      display: 'inline-block', width: 6, height: 6, borderRadius: '50%',
      background: color, boxShadow: `0 0 5px ${color}80`, flexShrink: 0,
    }} />
  );
}

export function CaseLibraryHeader({ stats, syncing, canManageSources, onSync, onIngest, onExport }: Props) {
  const pipeColor   = stats?.pipelineHealth  ? pipelineHealthColor(stats.pipelineHealth)   : CLR.muted;
  const pipeLabel   = stats?.pipelineHealth  ? pipelineHealthLabel(stats.pipelineHealth)   : '—';
  const libColor    = stats?.libraryMaturity ? libraryMaturityColor(stats.libraryMaturity) : CLR.muted;
  const libLabel    = stats?.libraryMaturity ? libraryMaturityLabel(stats.libraryMaturity) : '—';
  const lastSync    = stats?.lastSyncAt      ? formatRelative(stats.lastSyncAt) : '—';
  const replayCov   = stats ? `${stats.replayCoveragePct}% covered` : '—';
  const doctrinePct = stats ? `${stats.doctrineLinkedPct}% covered` : '—';

  return (
    <div style={{ paddingBottom: 16, borderBottom: '1px solid rgba(212,175,55,0.12)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>

        {/* Title */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 10, flexShrink: 0,
            background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <FolderOpen size={20} style={{ color: CLR.green }} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700, letterSpacing: '0.06em', color: CLR.text }}>
                Case Library
              </h1>
              <span style={{
                fontSize: 8.5, fontWeight: 700, letterSpacing: '0.12em', color: CLR.gold,
                background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.3)',
                borderRadius: 4, padding: '2px 7px',
              }}>
                GLOBAL INTELLIGENCE
              </span>
            </div>
            <p style={{ margin: 0, fontSize: 11.5, color: CLR.muted, lineHeight: 1.5, maxWidth: 560 }}>
              Global archive of incidents, CVEs, advisories, and validation-ready continuity intelligence.
            </p>
          </div>
        </div>

        {/* Actions */}
        {canManageSources && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <button onClick={onIngest} style={actionBtn(true)}>
            <PlusCircle size={12} /> Ingest Case
          </button>
          <button onClick={onSync} disabled={syncing} style={actionBtn(false, syncing)}>
            <RefreshCw size={12} style={{ animation: syncing ? 'spin 1s linear infinite' : 'none' }} />
            {syncing ? 'Syncing…' : 'Sync Sources'}
          </button>
          <button onClick={onExport} style={actionBtn(false)}>
            <Download size={12} /> Export
          </button>
        </div>
        )}
      </div>

      {/* Status sub-row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 22, marginTop: 12 }}>
        {[
          { label: 'Last Sync',  value: lastSync,      color: CLR.green  },
          { label: 'Pipeline',   value: pipeLabel,     color: pipeColor  },
          { label: 'Library',    value: libLabel,      color: libColor   },
          { label: 'Validation',     value: replayCov,     color: CLR.blue   },
          { label: 'Doctrine',   value: doctrinePct,   color: CLR.gold   },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <StatusDot color={color} />
            <span style={{ fontSize: 9.5, color: CLR.muted, letterSpacing: '0.06em' }}>{label}:</span>
            <span style={{ fontSize: 9.5, fontWeight: 600, color }}>{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function actionBtn(primary: boolean, disabled = false): React.CSSProperties {
  return {
    display: 'flex', alignItems: 'center', gap: 5,
    background: primary ? 'rgba(34,197,94,0.12)' : 'rgba(10,12,18,0.8)',
    border: primary ? '1px solid rgba(34,197,94,0.4)' : `1px solid ${CLR.border}`,
    borderRadius: 6, padding: '6px 12px', cursor: disabled ? 'not-allowed' : 'pointer',
    fontSize: 11, fontWeight: 600, color: primary ? CLR.green : disabled ? CLR.muted : CLR.text,
    letterSpacing: '0.04em', opacity: disabled ? 0.65 : 1,
    transition: 'opacity 0.15s',
  };
}
