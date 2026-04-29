import type {
  CaseSeverity, CaseStatus, ReplayStatus, DoctrineStatus,
  HealthStatus, PipelineHealth, LibraryMaturity, ActivityCategory,
} from './types';

// ─── Design tokens (shared across case-library components) ────────────────────

export const CLR = {
  gold:    '#D4AF37',
  muted:   'rgba(140,140,170,0.65)',
  surface: 'rgba(10,12,18,0.92)',
  border:  'rgba(212,175,55,0.14)',
  green:   '#22C55E',
  red:     '#EF4444',
  orange:  '#F97316',
  blue:    '#3B82F6',
  purple:  '#8B5CF6',
  text:    '#E2E8F0',
  bg:      '#080a0e',
} as const;

export const CARD_STYLE: React.CSSProperties = {
  background: CLR.surface,
  border:     `1px solid ${CLR.border}`,
  borderRadius: 8,
};

// ─── Severity ────────────────────────────────────────────────────────────────

export function severityColor(s: CaseSeverity): string {
  return s === 'critical' ? CLR.red : s === 'high' ? CLR.orange : s === 'medium' ? CLR.gold : CLR.purple;
}

export function severityLabel(s: CaseSeverity): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ─── Status ──────────────────────────────────────────────────────────────────

export function statusColor(s: CaseStatus): string {
  switch (s) {
    case 'verified':       return CLR.green;
    case 'needs_review':   return CLR.red;
    case 'doctrine_tagged':return CLR.gold;
    case 'replay_ready':   return CLR.blue;
    case 'classified':     return '#22D3EE';
    case 'normalized':     return CLR.purple;
    case 'ingested':       return CLR.muted;
    default:               return CLR.muted;
  }
}

export function statusLabel(s: CaseStatus): string {
  switch (s) {
    case 'replay_ready':   return 'Replay Ready';
    case 'doctrine_tagged':return 'Doctrine Tagged';
    case 'needs_review':   return 'Needs Review';
    default:               return s.charAt(0).toUpperCase() + s.slice(1);
  }
}

// ─── Replay ──────────────────────────────────────────────────────────────────

export function replayColor(r: ReplayStatus): string {
  switch (r) {
    case 'passed':    return CLR.green;
    case 'failed':    return CLR.red;
    case 'available': return CLR.blue;
    case 'pending':   return CLR.gold;
    case 'missing':   return CLR.muted;
    default:          return CLR.muted;
  }
}

export function replayLabel(r: ReplayStatus): string {
  return r.charAt(0).toUpperCase() + r.slice(1);
}

// ─── Doctrine ─────────────────────────────────────────────────────────────────

export function doctrineColor(d: DoctrineStatus): string {
  switch (d) {
    case 'linked':  return CLR.green;
    case 'updated': return CLR.gold;
    case 'pending': return CLR.orange;
    case 'none':    return CLR.muted;
    default:        return CLR.muted;
  }
}

export function doctrineLabel(d: DoctrineStatus): string {
  return d.charAt(0).toUpperCase() + d.slice(1);
}

// ─── Health ──────────────────────────────────────────────────────────────────

export function healthColor(h: HealthStatus): string {
  switch (h) {
    case 'healthy':      return CLR.green;
    case 'degraded':     return CLR.orange;
    case 'sync_delay':   return CLR.gold;
    case 'needs_review': return CLR.red;
    default:             return CLR.muted;
  }
}

export function healthLabel(h: HealthStatus): string {
  switch (h) {
    case 'sync_delay':   return 'Sync Delay';
    case 'needs_review': return 'Needs Review';
    default:             return h.charAt(0).toUpperCase() + h.slice(1);
  }
}

// ─── Pipeline health ──────────────────────────────────────────────────────────

export function pipelineHealthColor(h: PipelineHealth): string {
  switch (h) {
    case 'healthy':  return CLR.green;
    case 'partial':  return CLR.gold;
    case 'degraded': return CLR.orange;
    case 'offline':  return CLR.red;
    default:         return CLR.muted;
  }
}

export function pipelineHealthLabel(h: PipelineHealth): string {
  switch (h) {
    case 'healthy':  return 'Healthy';
    case 'partial':  return 'Partial';
    case 'degraded': return 'Degraded';
    case 'offline':  return 'Offline';
    default:         return 'Unknown';
  }
}

// ─── Library maturity ─────────────────────────────────────────────────────────

export function libraryMaturityColor(m: LibraryMaturity): string {
  switch (m) {
    case 'raw':              return CLR.muted;
    case 'needs_enrichment': return CLR.gold;
    case 'enriched':         return CLR.green;
    case 'verified':         return CLR.green;
    default:                 return CLR.muted;
  }
}

export function libraryMaturityLabel(m: LibraryMaturity): string {
  switch (m) {
    case 'raw':              return 'Raw';
    case 'needs_enrichment': return 'Needs Enrichment';
    case 'enriched':         return 'Enriched';
    case 'verified':         return 'Verified';
    default:                 return 'Unknown';
  }
}

// ─── Activity ─────────────────────────────────────────────────────────────────

export function activityColor(c: ActivityCategory): string {
  switch (c) {
    case 'error':      return CLR.red;
    case 'escalation': return CLR.orange;
    case 'ingest':     return CLR.blue;
    case 'replay':     return CLR.purple;
    case 'doctrine':   return CLR.gold;
    case 'normalize':  return CLR.green;
    default:           return CLR.muted;
  }
}

// ─── Time formatting ──────────────────────────────────────────────────────────

export function formatTs(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('en-US', {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false,
  });
}

export function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}
