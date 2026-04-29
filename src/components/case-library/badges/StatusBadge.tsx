import type { CaseStatus } from '@/lib/case-library/types';
import { statusColor, statusLabel } from '@/lib/case-library/utils';

export function StatusBadge({ status }: { status: CaseStatus }) {
  const color = statusColor(status);
  return (
    <span style={{
      fontSize: 9, fontWeight: 700, letterSpacing: '0.07em',
      color, background: `${color}18`, border: `1px solid ${color}38`,
      borderRadius: 4, padding: '2px 6px', whiteSpace: 'nowrap' as const,
    }}>
      {statusLabel(status).toUpperCase()}
    </span>
  );
}
