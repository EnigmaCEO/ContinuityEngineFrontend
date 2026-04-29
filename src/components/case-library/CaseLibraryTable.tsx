import {
  ChevronUp, ChevronDown, ChevronsUpDown,
  ChevronLeft, ChevronRight, FolderOpen, DatabaseZap,
} from 'lucide-react';
import type { CaseLibraryRecord } from '@/lib/case-library/types';
import type { CaseLibraryTableSortKey } from '@/lib/case-library/types';
import { CLR, formatRelative, formatTs } from '@/lib/case-library/utils';
import { SeverityBadge }  from './badges/SeverityBadge';
import { StatusBadge }    from './badges/StatusBadge';
import { ReplayBadge }    from './badges/ReplayBadge';
import { DoctrineBadge }  from './badges/DoctrineBadge';

interface Props {
  cases:        CaseLibraryRecord[];
  total:        number;
  page:         number;
  pageSize:     number;
  sortBy:       CaseLibraryTableSortKey;
  sortDir:      'asc' | 'desc';
  loading:      boolean;
  hasAnyFilter: boolean;
  onSort:       (key: CaseLibraryTableSortKey) => void;
  onPageChange: (page: number) => void;
  onRowClick:   (c: CaseLibraryRecord) => void;
}

const COL_HEADERS: { key: CaseLibraryTableSortKey; label: string; width: number | 'auto' }[] = [
  { key: 'caseId',         label: 'Case ID',   width: 136 },
  { key: 'title',          label: 'Title',     width: 'auto' },
  { key: 'source',         label: 'Source',    width: 90  },
  { key: 'type',           label: 'Type',      width: 118 },
  { key: 'severity',       label: 'Sev.',      width: 68  },
  { key: 'cveCount',       label: 'CVE / GHSA',width: 120 },
  { key: 'replayStatus',   label: 'Replay',    width: 82  },
  { key: 'doctrineStatus', label: 'Doctrine',  width: 78  },
  { key: 'status',         label: 'Status',    width: 108 },
  { key: 'ingestedAt',     label: 'Ingested',  width: 96  },
  { key: 'updatedAt',      label: 'Updated',   width: 96  },
];

function SortIcon({ active, dir }: { active: boolean; dir: 'asc' | 'desc' }) {
  if (!active) return <ChevronsUpDown size={9} style={{ color: 'rgba(140,140,170,0.3)', flexShrink: 0 }} />;
  return dir === 'asc'
    ? <ChevronUp   size={9} style={{ color: CLR.gold, flexShrink: 0 }} />
    : <ChevronDown size={9} style={{ color: CLR.gold, flexShrink: 0 }} />;
}

function SkeletonRow({ idx }: { idx: number }) {
  return (
    <tr style={{ borderBottom: `1px solid rgba(212,175,55,0.06)`, background: idx % 2 !== 0 ? 'rgba(255,255,255,0.012)' : 'transparent' }}>
      {COL_HEADERS.map((c) => (
        <td key={c.key} style={{ padding: '8px 10px' }}>
          <div style={{ height: 10, borderRadius: 3, background: 'rgba(255,255,255,0.05)', width: c.key === 'title' ? '80%' : '55%' }} />
        </td>
      ))}
    </tr>
  );
}

function CveCell({ refs, count }: { refs?: string[]; count: number }) {
  if (!refs || refs.length === 0) {
    return <span style={{ color: 'rgba(140,140,170,0.4)', fontSize: 10.5 }}>—</span>;
  }
  const first = refs[0];
  const extra = refs.length - 1;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'nowrap' as const }}>
      <span style={{
        fontSize: 9.5, fontFamily: 'var(--font-geist-mono,monospace)',
        color: '#F97316', letterSpacing: '0.01em',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const,
        maxWidth: extra > 0 ? 72 : 110,
      }}>
        {first}
      </span>
      {extra > 0 && (
        <span style={{
          fontSize: 8.5, color: CLR.muted,
          background: 'rgba(249,115,22,0.1)', borderRadius: 3,
          padding: '1px 4px', flexShrink: 0,
        }}>
          +{extra}
        </span>
      )}
    </div>
  );
}

function SourceCell({ primary, sources }: { primary: string; sources?: string[] }) {
  const allSources = sources && sources.length > 0 ? sources : [primary];
  const unique = Array.from(new Set([primary, ...allSources]));
  const extra = unique.length - 1;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span style={{ fontSize: 10.5, color: CLR.muted, lineHeight: '1.3' }}>{primary}</span>
      {extra > 0 && (
        <span style={{
          fontSize: 8.5, color: CLR.muted,
          background: 'rgba(255,255,255,0.05)', borderRadius: 3,
          padding: '1px 4px', alignSelf: 'flex-start',
        }}>
          +{extra} source{extra > 1 ? 's' : ''}
        </span>
      )}
    </div>
  );
}

function DateCell({ iso }: { iso: string }) {
  return (
    <span
      title={new Date(iso).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
      style={{ fontSize: 9.5, color: CLR.muted, fontFamily: 'var(--font-geist-mono,monospace)', cursor: 'default' }}
    >
      {formatTs(iso)}
    </span>
  );
}

export function CaseLibraryTable({
  cases, total, page, pageSize, sortBy, sortDir,
  loading, hasAnyFilter, onSort, onPageChange, onRowClick,
}: Props) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // Build paginator page numbers with ellipsis for large ranges
  function buildPages(): (number | '…')[] {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages: (number | '…')[] = [1];
    if (page > 3)       pages.push('…');
    for (let p = Math.max(2, page - 1); p <= Math.min(totalPages - 1, page + 1); p++) pages.push(p);
    if (page < totalPages - 2) pages.push('…');
    pages.push(totalPages);
    return pages;
  }

  return (
    <div>
      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
          <colgroup>
            {COL_HEADERS.map((c) => (
              <col key={c.key} style={{ width: c.width === 'auto' ? undefined : c.width }} />
            ))}
          </colgroup>
          <thead>
            <tr style={{ borderBottom: `1px solid ${CLR.border}`, height: 31 }}>
              {COL_HEADERS.map(({ key, label }) => {
                const active = sortBy === key;
                return (
                  <th
                    key={key}
                    onClick={() => onSort(key)}
                    style={{
                      padding: '0 10px', textAlign: 'left', cursor: 'pointer',
                      userSelect: 'none' as const, whiteSpace: 'nowrap' as const,
                      background: active ? 'rgba(212,175,55,0.04)' : 'transparent',
                      color: active ? CLR.gold : CLR.muted,
                      fontSize: 8.5, fontWeight: 600, letterSpacing: '0.1em',
                      textTransform: 'uppercase' as const,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                      {label}
                      <SortIcon active={active} dir={sortDir} />
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 8 }, (_, i) => <SkeletonRow key={i} idx={i} />)
              : cases.length === 0
                ? (
                  <tr>
                    <td colSpan={COL_HEADERS.length} style={{ padding: '48px 20px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                        {hasAnyFilter
                          ? <>
                              <FolderOpen size={30} style={{ color: 'rgba(212,175,55,0.18)' }} />
                              <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(148,163,184,0.7)', letterSpacing: '0.04em' }}>
                                No cases found
                              </div>
                              <div style={{ fontSize: 10.5, color: CLR.muted }}>
                                Adjust search, filters, or date range.
                              </div>
                            </>
                          : <>
                              <DatabaseZap size={30} style={{ color: 'rgba(212,175,55,0.18)' }} />
                              <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(148,163,184,0.7)', letterSpacing: '0.04em' }}>
                                No cases ingested yet
                              </div>
                              <div style={{ fontSize: 10.5, color: CLR.muted }}>
                                Run Sync Sources to populate the global archive.
                              </div>
                            </>
                        }
                      </div>
                    </td>
                  </tr>
                )
                : cases.map((c, idx) => (
                  <tr
                    key={c.caseId}
                    onClick={() => onRowClick(c)}
                    style={{
                      borderBottom: `1px solid rgba(212,175,55,0.06)`,
                      background: idx % 2 !== 0 ? 'rgba(255,255,255,0.012)' : 'transparent',
                      cursor: 'pointer', transition: 'background 0.1s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(212,175,55,0.05)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = idx % 2 !== 0 ? 'rgba(255,255,255,0.012)' : 'transparent')}
                  >
                    {/* Case ID */}
                    <td style={{ padding: '7px 10px' }}>
                      <span style={{ fontSize: 9.5, fontFamily: 'var(--font-geist-mono,monospace)', color: CLR.gold, letterSpacing: '0.02em' }}>
                        {c.caseId}
                      </span>
                    </td>
                    {/* Title + subsystem */}
                    <td style={{ padding: '7px 10px' }}>
                      <div style={{ overflow: 'hidden' }}>
                        <div style={{
                          fontSize: 11, color: CLR.text,
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const,
                          lineHeight: '1.35',
                        }}>
                          {c.title}
                        </div>
                        {(c.subsystem || c.chainSystem) && (
                          <div style={{ fontSize: 9, color: CLR.muted, marginTop: 1 }}>
                            {[c.chainSystem, c.subsystem].filter(Boolean).join(' / ')}
                          </div>
                        )}
                      </div>
                    </td>
                    {/* Source */}
                    <td style={{ padding: '7px 10px' }}>
                      <SourceCell primary={c.source} sources={c.sources} />
                    </td>
                    {/* Type */}
                    <td style={{ padding: '7px 10px' }}>
                      <span style={{ fontSize: 10.5, color: CLR.muted }}>{c.type}</span>
                    </td>
                    {/* Severity */}
                    <td style={{ padding: '7px 10px' }}>
                      <SeverityBadge severity={c.severity} />
                    </td>
                    {/* CVE / GHSA */}
                    <td style={{ padding: '7px 10px' }}>
                      <CveCell refs={c.cveRefs} count={c.cveCount} />
                    </td>
                    {/* Replay */}
                    <td style={{ padding: '7px 10px' }}>
                      <ReplayBadge status={c.replayStatus} />
                    </td>
                    {/* Doctrine */}
                    <td style={{ padding: '7px 10px' }}>
                      <DoctrineBadge status={c.doctrineStatus} />
                    </td>
                    {/* Status */}
                    <td style={{ padding: '7px 10px' }}>
                      <StatusBadge status={c.status} />
                    </td>
                    {/* Ingested */}
                    <td style={{ padding: '7px 10px' }}>
                      <DateCell iso={c.ingestedAt} />
                    </td>
                    {/* Updated */}
                    <td style={{ padding: '7px 10px' }}>
                      <DateCell iso={c.updatedAt} />
                    </td>
                  </tr>
                ))
            }
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div style={{
        padding: '10px 14px', borderTop: `1px solid ${CLR.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{ fontSize: 10, color: CLR.muted }}>
          {total} record{total !== 1 ? 's' : ''} · page {page} of {totalPages}
        </span>
        <div style={{ display: 'flex', gap: 4 }}>
          <PaginationBtn disabled={page === 1} onClick={() => onPageChange(page - 1)}>
            <ChevronLeft size={11} />
          </PaginationBtn>
          {buildPages().map((p, i) =>
            p === '…'
              ? <span key={`e${i}`} style={{ display: 'flex', alignItems: 'center', padding: '0 2px', fontSize: 10, color: CLR.muted }}>…</span>
              : <PaginationBtn key={p} active={page === p} onClick={() => onPageChange(p as number)}>
                  {p}
                </PaginationBtn>
          )}
          <PaginationBtn disabled={page === totalPages} onClick={() => onPageChange(page + 1)}>
            <ChevronRight size={11} />
          </PaginationBtn>
        </div>
      </div>
    </div>
  );
}

function PaginationBtn({
  children, onClick, disabled, active,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background: active ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.04)',
        border: active ? '1px solid rgba(212,175,55,0.5)' : `1px solid ${CLR.border}`,
        borderRadius: 4, padding: '3px 8px', cursor: disabled ? 'default' : 'pointer',
        fontSize: 10, color: active ? CLR.gold : disabled ? CLR.muted : CLR.text,
        fontWeight: active ? 700 : 400, display: 'flex', alignItems: 'center',
        opacity: disabled ? 0.35 : 1, minWidth: 26, justifyContent: 'center',
      }}
    >
      {children}
    </button>
  );
}
