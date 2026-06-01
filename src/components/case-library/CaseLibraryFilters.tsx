import { useCallback } from 'react';
import { Search, XCircle, Calendar } from 'lucide-react';
import type { ArchiveFacetOption, CasePriorityBand, CaseSeverity, ReplayStatus, DoctrineStatus, CaseStatus } from '@/lib/case-library/types';
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
  priorityBand:   CasePriorityBand | '';
  ingestedFrom:   string;
  ingestedTo:     string;
  datePreset:     DatePreset;
}

interface Props {
  filters:       FilterState;
  onChange:      (patch: Partial<FilterState>) => void;
  onReset:       () => void;
  uniqueTypes:   ArchiveFacetOption[];
  uniqueSources: ArchiveFacetOption[];
  uniqueChains:  ArchiveFacetOption[];
  severities:    ArchiveFacetOption[];
  replayStatuses:   ArchiveFacetOption[];
  doctrineStatuses: ArchiveFacetOption[];
  caseStatuses:     ArchiveFacetOption[];
  facetsLoading?: boolean;
}

const PRIORITY_OPTIONS: ArchiveFacetOption[] = [
  { value: 'critical', label: 'Priority Critical', count: 0 },
  { value: 'high', label: 'Priority High', count: 0 },
  { value: 'medium', label: 'Priority Medium', count: 0 },
  { value: 'low', label: 'Priority Low', count: 0 },
];

function validationVocabulary(text: string): string {
  return text
    .replaceAll('replayed', 'validated')
    .replaceAll('Replayable', 'Ready for Validation')
    .replaceAll('replayable', 'ready for validation')
    .replaceAll('replaying', 'validating')
    .replaceAll('Replay', 'Validation')
    .replaceAll('replay', 'validation')
    .replaceAll('REPLAY', 'VALIDATION');
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
  value, onChange, options, placeholder, disabled,
}: {
  value: string; onChange: (v: string) => void; options: ArchiveFacetOption[]; placeholder: string; disabled?: boolean;
}) {
  const visibleOptions = value && !options.some((o) => o.value === value)
    ? [{ value, label: value, count: 0 }, ...options]
    : options;

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      style={{
        background: 'rgba(10,12,18,0.9)', border: `1px solid ${CLR.border}`,
        borderRadius: 5, padding: '4px 7px', fontSize: 10.5,
        color: value ? CLR.text : CLR.muted, cursor: disabled ? 'not-allowed' : 'pointer',
        outline: 'none', minWidth: 100, height: 27,
        opacity: disabled ? 0.62 : 1,
      }}
    >
      <option value="">{disabled ? `${placeholder} loading` : placeholder}</option>
      {visibleOptions.map((o) => (
        <option key={o.value} value={o.value}>
          {o.count > 0 ? `${validationVocabulary(o.label)} (${o.count})` : validationVocabulary(o.label)}
        </option>
      ))}
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
  severities, replayStatuses, doctrineStatuses, caseStatuses, facetsLoading,
}: Props) {
  const hasFilters = (
    !!filters.search || !!filters.severity || !!filters.type ||
    !!filters.source || !!filters.chainSystem || !!filters.replayStatus ||
    !!filters.doctrineStatus || !!filters.status || !!filters.priorityBand ||
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
          options={severities}
          placeholder="Severity"
          disabled={facetsLoading && severities.length === 0}
        />
        <Select
          value={filters.priorityBand}
          onChange={(v) => onChange({ priorityBand: v as CasePriorityBand | '' })}
          options={PRIORITY_OPTIONS}
          placeholder="Priority"
        />
        <Select
          value={filters.type}
          onChange={(v) => onChange({ type: v })}
          options={uniqueTypes}
          placeholder="Type"
          disabled={facetsLoading && uniqueTypes.length === 0}
        />
        <Select
          value={filters.source}
          onChange={(v) => onChange({ source: v })}
          options={uniqueSources}
          placeholder="Source"
          disabled={facetsLoading && uniqueSources.length === 0}
        />
        <Select
          value={filters.chainSystem}
          onChange={(v) => onChange({ chainSystem: v })}
          options={uniqueChains}
          placeholder="Chain"
          disabled={facetsLoading && uniqueChains.length === 0}
        />
        <Select
          value={filters.replayStatus}
          onChange={(v) => onChange({ replayStatus: v as ReplayStatus | '' })}
          options={replayStatuses}
          placeholder="Validation"
          disabled={facetsLoading && replayStatuses.length === 0}
        />
        <Select
          value={filters.doctrineStatus}
          onChange={(v) => onChange({ doctrineStatus: v as DoctrineStatus | '' })}
          options={doctrineStatuses}
          placeholder="Doctrine"
          disabled={facetsLoading && doctrineStatuses.length === 0}
        />
        <Select
          value={filters.status}
          onChange={(v) => onChange({ status: v as CaseStatus | '' })}
          options={caseStatuses}
          placeholder="Status"
          disabled={facetsLoading && caseStatuses.length === 0}
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
