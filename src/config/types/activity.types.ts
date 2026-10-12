import type { NoteAuditLog } from "@prisma/client";

export interface ActivityFiltersState {
  search: string;
  entityType: string;
  action: string;
  dateRange: string;
}

export interface ActivityItemProps {
  data: NoteAuditLog;
  extended?: boolean;
}

export interface ActivityFiltersProps {
  filters: ActivityFiltersState;
  onChange: (filters: ActivityFiltersState) => void;
  onReset: () => void;
  hasActiveFilters: boolean;
  isExtendedAudit: boolean;
  tariffName?: string;
  totalCount: number;
  filteredCount: number;
  showEntityFilter?: boolean;
}

export interface ActivityViewProps {
  initialLogs: NoteAuditLog[];
  isExtendedAudit: boolean;
  tariffName?: string;
  showEntityFilter?: boolean;
}
