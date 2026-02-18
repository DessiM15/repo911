import { Badge } from '@/components/ui/badge';
import type { CaseStatus } from '@/types';

const STATUS_CONFIG: Record<CaseStatus, { label: string; variant: 'info' | 'warning' | 'success' | 'default' }> = {
  open: { label: 'Open', variant: 'info' },
  in_progress: { label: 'In Progress', variant: 'warning' },
  settled: { label: 'Settled', variant: 'success' },
  dismissed: { label: 'Dismissed', variant: 'default' },
  closed: { label: 'Closed', variant: 'default' },
  paid: { label: 'Paid', variant: 'success' },
};

export function CaseStatusBadge({ status }: { status: CaseStatus }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.open;
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
