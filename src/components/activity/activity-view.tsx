"use client";

import { useMemo, useState } from "react";
import type { NoteAuditLog } from "@prisma/client";
import { ActivityItem } from "./activity-item";
import { ActivityFilters } from "./activity-filters";
import { isToday, isWithinInterval, subDays } from "date-fns";
import { SearchX, Inbox } from "lucide-react";
import type { ActivityFiltersState, ActivityViewProps } from "@/config/types/activity.types";
import { INITIAL_ACTIVITY_FILTERS } from "@/config/const/activity.const";

export function ActivityView({
  initialLogs,
  isExtendedAudit,
}: ActivityViewProps) {
  const [filters, setFilters] = useState<ActivityFiltersState>(INITIAL_ACTIVITY_FILTERS);

  const hasActiveFilters = useMemo(() => {
    return (
      filters.search.trim().length > 0 ||
      filters.entityType !== "ALL" ||
      filters.action !== "ALL" ||
      filters.dateRange !== "ALL"
    );
  }, [filters]);

  const handleReset = () => {
    setFilters(INITIAL_ACTIVITY_FILTERS);
  };

  const filteredLogs = useMemo(() => {
    if (!isExtendedAudit) {
      return initialLogs;
    }

    return initialLogs.filter((log) => {
      if (filters.search.trim()) {
        const query = filters.search.toLowerCase();
        const matchesTitle = log.entityTitle.toLowerCase().includes(query);
        const matchesUser = (log.userName || "").toLowerCase().includes(query);
        if (!matchesTitle && !matchesUser) {
          return false;
        }
      }

      if (filters.entityType !== "ALL" && log.entityType !== filters.entityType) {
        return false;
      }

      if (filters.action !== "ALL" && log.action !== filters.action) {
        return false;
      }

      if (filters.dateRange !== "ALL") {
        const logDate = new Date(log.createdAt);
        const now = new Date();

        if (filters.dateRange === "TODAY") {
          if (!isToday(logDate)) return false;
        } else if (filters.dateRange === "7DAYS") {
          const sevenDaysAgo = subDays(now, 7);
          if (
            !isWithinInterval(logDate, {
              start: sevenDaysAgo,
              end: now,
            })
          ) {
            return false;
          }
        } else if (filters.dateRange === "30DAYS") {
          const thirtyDaysAgo = subDays(now, 30);
          if (
            !isWithinInterval(logDate, {
              start: thirtyDaysAgo,
              end: now,
            })
          ) {
            return false;
          }
        }
      }

      return true;
    });
  }, [initialLogs, filters, isExtendedAudit]);

  return (
    <div className="space-y-4">
      <ActivityFilters
        filters={filters}
        onChange={setFilters}
        onReset={handleReset}
        hasActiveFilters={hasActiveFilters}
        isExtendedAudit={isExtendedAudit}
        totalCount={initialLogs.length}
        filteredCount={filteredLogs.length}
      />

      {filteredLogs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 px-4 text-center rounded-xl bg-muted/10">
          {hasActiveFilters ? (
            <>
              <SearchX className="h-9 w-9 text-muted-foreground mb-2" />
              <p className="font-semibold text-sm text-foreground">
                Ничего не найдено
              </p>
            </>
          ) : (
            <>
              <Inbox className="h-9 w-9 text-muted-foreground/60 mb-2" />
              <p className="font-semibold text-sm text-foreground">
                Здесь пока нет активности
              </p>
            </>
          )}
        </div>
      ) : (
        <ol className="divide-y divide-border/40">
          {filteredLogs.map((log) => (
            <ActivityItem
              key={log.id}
              data={log}
            />
          ))}
        </ol>
      )}
    </div>
  );
}
