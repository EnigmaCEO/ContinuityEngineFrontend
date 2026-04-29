import type { CaseSeverity } from '@/lib/case-library/types';
import { severityColor, severityLabel } from '@/lib/case-library/utils';

export function SeverityBadge({ severity }: { severity: CaseSeverity }) {
  const color = severityColor(severity);
  return (
    <span style={{
      fontSize: 9, fontWeight: 700, letterSpacing: '0.07em',
      color, background: `${color}18`, border: `1px solid ${color}38`,
      borderRadius: 4, padding: '2px 6px', whiteSpace: 'nowrap' as const,
    }}>
      {severityLabel(severity).toUpperCase()}
    </span>
  );
}
