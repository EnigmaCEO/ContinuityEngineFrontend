import { useCallback } from 'react';
import { Search, XCircle, Calendar } from 'lucide-react';
import type { CaseSeverity, ReplayStatus, DoctrineStatus, CaseStatus } from '@/lib/case-library/types';
import { CLR } from '@/lib/case-library/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

export type DatePreset = '24h' | '7d' | '30d' | '90d' | 'all' | 'custom' | '';

export interface FilterState {
  search:         string;
  severity:       CaseSeverity | '';
  type:           string;
  source:         string;
  chainSystem:    string;
  replayStatus:   ReplayStatus | '';
  doctrineStatus: DoctrineStatus | '';
  status:         CaseStatus | '';
  ingestedFrom:   string;
  ingestedTo:     string;
  datePreset:     DatePreset;
}

interface Props {
  filters:       FilterState;
  onChange:      (patch: Partial<FilterState>) => void;
  onReset:       () => void;
  uniqueTypes:   string[];
  uniqueSources: string[];
  uniqueChains:  string[];
}

// ─── Date preset helpers ──────────────────────────────────────────────────────

function toYMD(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function presetRange(preset: DatePreset): { from: string; to: string } {
  const now = new Date();
  const today = toYMD(now);
  if (preset === '24h') {
    const d = new Date(now); d.setDate(d.getDate() - 1);
    return { from: toYMD(d), to: today };
  }
  if (preset === '7d') {
    const d = new Date(now); d.setDate(d.getDate() - 7);
    return { from: toYMD(d), to: today };
  }
  if (preset === '30d') {
    const d = new Date(now); d.setDate(d.getDate() - 30);
    return { from: toYMD(d), to: today };
  }
  if (preset === '90d') {
    const d = new Date(now); d.setDate(d.getDate() - 90);
    return { from: toYMD(d), to: today };
  }
  return { from: '', to: '' };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Select({
  value, onChange, options, placeholder,
}: {
  value: string; onChange: (v: string) => void; options: string[]; placeholder: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        background: 'rgba(10,12,18,0.9)', border: `1px solid ${CLR.border}`,
        borderRadius: 5, padding: '4px 7px', fontSize: 10.5,
        color: value ? CLR.text : CLR.muted, cursor: 'pointer',
        outline: 'none', minWidth: 100, height: 27,
      }}
    >
      <option value="">{placeholder}</option>
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

function PresetBtn({
  label, active, onClick,
}: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.03)',
        border: active ? '1px solid rgba(212,175,55,0.5)' : `1px solid ${CLR.border}`,
        borderRadius: 4, padding: '3px 9px', cursor: 'pointer',
        fontSize: 10, fontWeight: active ? 700 : 400,
        color: active ? CLR.gold : CLR.muted, height: 24,
        whiteSpace: 'nowrap' as const,
        transition: 'background 0.1s, color 0.1s, border-color 0.1s',
      }}
    >
      {label}
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function CaseLibraryFilters({
  filters, onChange, onReset, uniqueTypes, uniqueSources, uniqueChains,
}: Props) {
  const hasFilters = (
    !!filters.search || !!filters.severity || !!filters.type ||
    !!filters.source || !!filters.chainSystem || !!filters.replayStatus ||
    !!filters.doctrineStatus || !!filters.status ||
    !!filters.ingestedFrom || !!filters.ingestedTo
  );

  const handlePreset = useCallback((preset: DatePreset) => {
    if (preset === 'all') {
      onChange({ datePreset: 'all', ingestedFrom: '', ingestedTo: '' });
      return;
    }
    if (preset === 'custom') {
      onChange({ datePreset: 'custom' });
      return;
    }
    const { from, to } = presetRange(preset);
    onChange({ datePreset: preset, ingestedFrom: from, ingestedTo: to });
  }, [onChange]);

  const handleFromDate = useCallback((val: string) => {
    onChange({ ingestedFrom: val, datePreset: 'custom' });
  }, [onChange]);

  const handleToDate = useCallback((val: string) => {
    onChange({ ingestedTo: val, datePreset: 'custom' });
  }, [onChange]);

  const dateInputStyle: React.CSSProperties = {
    background: 'rgba(10,12,18,0.9)', border: `1px solid ${CLR.border}`,
    borderRadius: 5, padding: '3px 7px', fontSize: 10.5,
    color: CLR.text, outline: 'none', height: 27, cursor: 'pointer',
    colorScheme: 'dark',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
      {/* Row 1: Search + keyword filters */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' as const }}>
        {/* Search */}
        <div style={{ position: 'relative' }}>
          <Search size={11} style={{
            position: 'absolute', left: 8, top: '50%',
            transform: 'translateY(-50%)', color: CLR.muted,
          }} />
          <input
            value={filters.search}
            onChange={(e) => onChange({ search: e.target.value })}
            placeholder="Search cases, CVEs, GHSAs, sources, subsystems…"
            style={{
              background: 'rgba(255,255,255,0.04)', border: `1px solid ${CLR.border}`,
              borderRadius: 5, padding: '4px 8px 4px 26px', fontSize: 10.5,
              color: CLR.text, outline: 'none', width: 270, height: 27,
            }}
          />
        </div>

        <Select
          value={filters.severity}
          onChange={(v) => onChange({ severity: v as CaseSeverity | '' })}
          options={['critical', 'high', 'medium', 'low']}
          placeholder="Severity"
        />
        <Select
          value={filters.type}
          onChange={(v) => onChange({ type: v })}
          options={uniqueTypes}
          placeholder="Type"
        />
        <Select
          value={filters.source}
          onChange={(v) => onChange({ source: v })}
          options={uniqueSources}
          placeholder="Source"
        />
        <Select
          value={filters.chainSystem}
          onChange={(v) => onChange({ chainSystem: v })}
          options={uniqueChains}
          placeholder="Chain"
        />
        <Select
          value={filters.replayStatus}
          onChange={(v) => onChange({ replayStatus: v as ReplayStatus | '' })}
          options={['available', 'missing', 'passed', 'failed', 'pending']}
          placeholder="Replay"
        />
        <Select
          value={filters.doctrineStatus}
          onChange={(v) => onChange({ doctrineStatus: v as DoctrineStatus | '' })}
          options={['linked', 'pending', 'updated', 'none']}
          placeholder="Doctrine"
        />
        <Select
          value={filters.status}
          onChange={(v) => onChange({ status: v as CaseStatus | '' })}
          options={[
            'ingested', 'normalized', 'classified', 'replay_ready',
            'doctrine_tagged', 'verified', 'needs_review',
            'raw_ingested', 'failed_normalization', 'failed_classification',
          ]}
          placeholder="Status"
        />

        {hasFilters && (
          <button onClick={onReset} style={{
            display: 'flex', alignItems: 'center', gap: 4,
            background: 'transparent', border: `1px solid ${CLR.border}`,
            borderRadius: 5, padding: '3px 9px', fontSize: 10,
            color: CLR.muted, cursor: 'pointer', height: 27,
          }}>
            <XCircle size={10} /> Clear all
          </button>
        )}
      </div>

      {/* Row 2: Date range */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' as const }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <Calendar size={11} style={{ color: CLR.muted }} />
          <span style={{ fontSize: 9.5, color: CLR.muted, letterSpacing: '0.07em', fontWeight: 600 }}>
            INGESTED
          </span>
        </div>

        <PresetBtn label="All time"  active={filters.datePreset === 'all' || filters.datePreset === ''} onClick={() => handlePreset('all')} />
        <PresetBtn label="Last 24h"  active={filters.datePreset === '24h'}  onClick={() => handlePreset('24h')} />
        <PresetBtn label="Last 7d"   active={filters.datePreset === '7d'}   onClick={() => handlePreset('7d')} />
        <PresetBtn label="Last 30d"  active={filters.datePreset === '30d'}  onClick={() => handlePreset('30d')} />
        <PresetBtn label="Last 90d"  active={filters.datePreset === '90d'}  onClick={() => handlePreset('90d')} />
        <PresetBtn label="Custom"    active={filters.datePreset === 'custom'} onClick={() => handlePreset('custom')} />

        {(filters.datePreset === 'custom' || filters.ingestedFrom || filters.ingestedTo) && (
          <>
            <span style={{ fontSize: 9.5, color: CLR.muted }}>From</span>
            <input
              type="date"
              value={filters.ingestedFrom}
              onChange={(e) => handleFromDate(e.target.value)}
              style={dateInputStyle}
            />
            <span style={{ fontSize: 9.5, color: CLR.muted }}>To</span>
            <input
              type="date"
              value={filters.ingestedTo}
              onChange={(e) => handleToDate(e.target.value)}
              style={dateInputStyle}
            />
          </>
        )}
      </div>
    </div>
  );
}
