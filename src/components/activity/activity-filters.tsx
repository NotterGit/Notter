"use client";

import { Search, RotateCcw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AuditPlanNotice } from "@/components/activity/audit-plan-notice";
import type { ActivityFiltersProps } from "@/config/types/activity.types";
import {
  ACTIVITY_ACTION_OPTIONS,
  ACTIVITY_DATE_OPTIONS,
  ACTIVITY_ENTITY_OPTIONS,
} from "@/config/const/activity.const";

export function ActivityFilters({
  filters,
  onChange,
  onReset,
  hasActiveFilters,
  isExtendedAudit,
  totalCount,
  filteredCount,
}: ActivityFiltersProps) {
  if (!isExtendedAudit) {
    return <AuditPlanNotice scope="workspace" />;
  }

  const groups = [
    { key: "entityType", label: "Тип объекта", options: ACTIVITY_ENTITY_OPTIONS },
    { key: "action", label: "Действие", options: ACTIVITY_ACTION_OPTIONS },
    { key: "dateRange", label: "Период", options: ACTIVITY_DATE_OPTIONS },
  ] as const;

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <Input
          value={filters.search}
          onChange={(event) => onChange({ ...filters, search: event.target.value })}
          placeholder="Поиск по названию или автору"
          aria-label="Поиск по названию или автору"
          className="h-10 rounded-xl border-0 bg-muted/40 pl-9 text-base shadow-none sm:text-sm"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {groups.map(({ key, label, options }) => (
          <select
            key={key}
            aria-label={label}
            value={filters[key]}
            onChange={(event) => onChange({ ...filters, [key]: event.target.value })}
            className="min-h-10 max-w-full rounded-lg bg-secondary px-2 text-base text-secondary-foreground focus-visible:ring-2 focus-visible:ring-ring dark:scheme-dark sm:text-sm"
          >
            {options.map(({ value, label: optionLabel }) => (
              <option key={value} value={value}>{optionLabel}</option>
            ))}
          </select>
        ))}
      </div>

      {hasActiveFilters && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-sm tabular-nums text-muted-foreground" role="status">
            Показано {filteredCount} из {totalCount}
          </span>
          <Button variant="ghost" size="sm" onClick={onReset}>
            <RotateCcw aria-hidden="true" />
            Сбросить фильтры
          </Button>
        </div>
      )}
    </div>
  );
}
