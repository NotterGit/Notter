import type { NoteAuditLog } from "@prisma/client";

export interface ActivityFiltersState {
  search: string;
  entityType: string;
  action: string;
  dateRange: string;
}

export interface ActivityItemProps {
  data: NoteAuditLog;
}

export interface ActivityFiltersProps {
  filters: ActivityFiltersState;
  onChange: (filters: ActivityFiltersState) => void;
  onReset: () => void;
  hasActiveFilters: boolean;
  isExtendedAudit: boolean;
  totalCount: number;
  filteredCount: number;
}

export interface ActivityViewProps {
  initialLogs: NoteAuditLog[];
  isExtendedAudit: boolean;
}

export interface AuditPlanNoticeProps {
  scope: "note" | "workspace";
}
