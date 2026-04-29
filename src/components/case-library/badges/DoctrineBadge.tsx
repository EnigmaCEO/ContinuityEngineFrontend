import type { DoctrineStatus } from '@/lib/case-library/types';
import { doctrineColor, doctrineLabel } from '@/lib/case-library/utils';

export function DoctrineBadge({ status }: { status: DoctrineStatus }) {
  const color = doctrineColor(status);
  return (
    <span style={{
      fontSize: 9, fontWeight: 700, letterSpacing: '0.07em',
      color, background: `${color}18`, border: `1px solid ${color}38`,
      borderRadius: 4, padding: '2px 6px', whiteSpace: 'nowrap' as const,
    }}>
      {doctrineLabel(status).toUpperCase()}
    </span>
  );
}
