export const REQUEST_STATUS = {
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  AWAITING_APPROVAL: 'AWAITING_APPROVAL',
  COMPLETED: 'COMPLETED',
  REJECTED: 'REJECTED',
} as const;

export type RequestStatus = typeof REQUEST_STATUS[keyof typeof REQUEST_STATUS];

export const STATUS_CONFIG: Record<RequestStatus, {
  label: string;
  variant: 'warning' | 'info' | 'success' | 'danger' | 'gray';
  icon: string;
}> = {
  PENDING: { label: 'รอรับเรื่อง', variant: 'warning', icon: 'Clock' },
  IN_PROGRESS: { label: 'กำลังดำเนินการ', variant: 'info', icon: 'Eye' },
  AWAITING_APPROVAL: { label: 'รออนุมัติ', variant: 'warning', icon: 'Clock' },
  COMPLETED: { label: 'ดำเนินการแล้ว', variant: 'success', icon: 'CheckCircle2' },
  REJECTED: { label: 'ปฏิเสธ', variant: 'danger', icon: 'AlertCircle' },
};

export function normalizeStatus(status: string): RequestStatus | undefined {
  const upper = status.toUpperCase().replace(/ /g, '_') as RequestStatus;
  return upper in REQUEST_STATUS ? upper : undefined;
}

export function getStatusLabel(status: string): string {
  const normalized = normalizeStatus(status);
  return normalized ? STATUS_CONFIG[normalized].label : status;
}

export function getStatusVariant(status: string): string {
  const normalized = normalizeStatus(status);
  return normalized ? STATUS_CONFIG[normalized].variant : 'gray';
}
