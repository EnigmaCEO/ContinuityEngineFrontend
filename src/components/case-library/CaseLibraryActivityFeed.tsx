import {
  Database, Zap, BookOpen, RefreshCw,
  AlertTriangle, CheckCircle2, FileText, Tag,
} from 'lucide-react';
import type { CaseLibraryActivityItem } from '@/lib/case-library/types';
import { CLR, CARD_STYLE, activityColor, formatRelative } from '@/lib/case-library/utils';

interface Props {
  items:   CaseLibraryActivityItem[];
  loading: boolean;
}

const CATEGORY_ICON: Record<CaseLibraryActivityItem['category'], React.ElementType> = {
  ingest:     Database,
  normalize:  CheckCircle2,
  classify:   Tag,
  sync:       RefreshCw,
  replay:     Zap,
  doctrine:   BookOpen,
  error:      AlertTriangle,
  escalation: AlertTriangle,
};

function severityAccent(sev: CaseLibraryActivityItem['severity']): string | undefined {
  if (!sev || sev === 'info') return undefined;
  if (sev === 'critical') return CLR.red;
  if (sev === 'high')     return CLR.orange;
  if (sev === 'medium')   return CLR.gold;
  return undefined;
}

function SkeletonItem({ idx }: { idx: number }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 0',
      borderBottom: idx < 4 ? `1px solid rgba(212,175,55,0.06)` : 'none',
    }}>
      <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', flexShrink: 0 }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ height: 10, borderRadius: 3, background: 'rgba(255,255,255,0.05)', width: '75%' }} />
        <div style={{ height: 9,  borderRadius: 3, background: 'rgba(255,255,255,0.04)', width: '40%' }} />
      </div>
    </div>
  );
}

export function CaseLibraryActivityFeed({ items, loading }: Props) {
  return (
    <div style={{ ...CARD_STYLE, padding: '14px 16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 20, height: 20, borderRadius: '50%',
            background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.28)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <RefreshCw size={10} style={{ color: CLR.gold }} />
          </div>
          <span style={{ fontSize: 9.5, fontWeight: 600, letterSpacing: '0.13em', color: CLR.gold, textTransform: 'uppercase' as const }}>
            Recent Activity
          </span>
          <span style={{ fontSize: 9, color: CLR.muted }}>· live events</span>
        </div>
        {/* Live indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 5, height: 5, borderRadius: '50%', background: CLR.green, boxShadow: `0 0 4px ${CLR.green}` }} />
          <span style={{ fontSize: 9, color: CLR.green, letterSpacing: '0.08em', fontWeight: 600 }}>LIVE</span>
        </div>
      </div>

      {/* Items */}
      <div>
        {loading
          ? Array.from({ length: 6 }, (_, i) => <SkeletonItem key={i} idx={i} />)
          : items.length === 0
            ? (
              <div style={{ padding: '20px 0', textAlign: 'center', color: CLR.muted, fontSize: 11 }}>
                No recent activity to display.
              </div>
            )
            : items.map((item, idx) => {
              const color  = activityColor(item.category);
              const accent = severityAccent(item.severity);
              const Icon   = CATEGORY_ICON[item.category] ?? FileText;
              return (
                <div
                  key={item.id}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 0',
                    borderBottom: idx < items.length - 1 ? `1px solid rgba(212,175,55,0.06)` : 'none',
                  }}
                >
                  {/* Icon */}
                  <div style={{
                    width: 22, height: 22, borderRadius: '50%', flexShrink: 0, marginTop: 1,
                    background: `${accent ?? color}14`, border: `1px solid ${accent ?? color}30`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon size={10} style={{ color: accent ?? color }} />
                  </div>

                  {/* Message */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: 11, color: accent ? accent : '#CBD5E1', lineHeight: 1.45 }}>
                      {item.message}
                    </span>
                    {item.severity && item.severity !== 'info' && (
                      <span style={{
                        display: 'inline-block', marginLeft: 6,
                        fontSize: 8.5, fontWeight: 700, letterSpacing: '0.07em',
                        color: accent ?? CLR.muted, background: `${accent ?? CLR.muted}18`,
                        border: `1px solid ${accent ?? CLR.muted}30`,
                        borderRadius: 3, padding: '1px 5px', verticalAlign: 'middle',
                      }}>
                        {item.severity.toUpperCase()}
                      </span>
                    )}
                  </div>

                  {/* Timestamp */}
                  <span style={{ fontSize: 9.5, color: CLR.muted, whiteSpace: 'nowrap' as const, flexShrink: 0, marginTop: 2 }}>
                    {formatRelative(item.timestamp)}
                  </span>
                </div>
              );
            })
        }
      </div>
    </div>
  );
}
