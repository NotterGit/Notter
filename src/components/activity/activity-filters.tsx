"use client";

import { Search, X, RotateCcw, Lock, Gem } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { links } from "@/config/routing/links.route";
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
  tariffName,
  totalCount,
  filteredCount,
  showEntityFilter = true,
}: ActivityFiltersProps) {
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isExtendedAudit) return;
    onChange({ ...filters, search: e.target.value });
  };

  const handleEntityChange = (entityType: string) => {
    if (!isExtendedAudit) return;
    onChange({ ...filters, entityType });
  };

  const handleActionChange = (action: string) => {
    if (!isExtendedAudit) return;
    onChange({ ...filters, action });
  };

  const handleDateChange = (dateRange: string) => {
    if (!isExtendedAudit) return;
    onChange({ ...filters, dateRange });
  };

  return (
    <div className="space-y-4 pt-1">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          {isExtendedAudit ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold border bg-yellow-500/10 dark:bg-yellow-500/15 text-amber-600 dark:text-yellow-400 border-yellow-500/30">
              <Gem className="h-3.5 w-3.5" />
              <span>Расширенный аудит{tariffName ? ` (${tariffName})` : ""}</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-medium bg-muted/60 text-muted-foreground border border-border/50">
              <span>Базовый журнал</span>
            </span>
          )}

          <span className="text-muted-foreground">
            {hasActiveFilters ? (
              <span>
                Показано: <strong className="text-foreground">{filteredCount}</strong> из{" "}
                {totalCount}
              </span>
            ) : (
              <span>
                Всего событий: <strong className="text-foreground">{totalCount}</strong>
              </span>
            )}
          </span>
        </div>

        {hasActiveFilters && isExtendedAudit && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="h-7 text-xs text-muted-foreground hover:text-foreground rounded-lg"
          >
            <RotateCcw className="h-3 w-3 mr-1" />
            Сбросить фильтры
          </Button>
        )}
      </div>

      {!isExtendedAudit && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-yellow-500/30 bg-yellow-500/5 dark:bg-yellow-500/10 text-xs">
          <div className="flex items-start sm:items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-yellow-500/15 text-amber-600 dark:text-yellow-400 shrink-0">
              <Lock className="h-4 w-4" />
            </div>
            <div>
              <p className="font-semibold text-neutral-800 dark:text-neutral-200">
                Расширенный поиск и фильтрация
              </p>
              <p className="text-muted-foreground">
                Фильтрация по типам действий, датам и полная история доступны в тарифах{" "}
                <span className="font-semibold text-amber-500 dark:text-yellow-400">Amber</span>
                {" "}и{" "}
                <span className="font-semibold text-cyan-500 dark:text-cyan-400">Diamond</span>
              </p>
            </div>
          </div>
          <Link
            href={links.NOTTER_GEM}
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-yellow-400 border border-amber-500/30 transition-colors shrink-0"
          >
            <Gem className="h-3.5 w-3.5" />
            <span>Улучшить тариф</span>
          </Link>
        </div>
      )}

      <div
        className={cn(
          "space-y-3 p-3 rounded-xl border border-border/40 bg-muted/20 dark:bg-zinc-800/20 transition-opacity",
          !isExtendedAudit && "opacity-60 select-none pointer-events-none"
        )}
      >
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={filters.search}
            onChange={handleSearchChange}
            disabled={!isExtendedAudit}
            placeholder={
              isExtendedAudit
                ? "Поиск по названию сущности или автору..."
                : "Поиск доступен на тарифах Amber и Diamond"
            }
            className="pl-9 pr-8 h-9 rounded-xl text-xs bg-background/80 border-border/50 focus-visible:ring-1"
          />
          {filters.search && isExtendedAudit && (
            <button
              onClick={() => onChange({ ...filters, search: "" })}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded-md"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {showEntityFilter && (
            <div className="flex flex-wrap items-center gap-1">
              <span className="text-[11px] font-medium text-muted-foreground mr-1">
                Сущность:
              </span>
              {ACTIVITY_ENTITY_OPTIONS.map((opt) => {
                const isSelected = filters.entityType === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleEntityChange(opt.value)}
                    disabled={!isExtendedAudit}
                    className={cn(
                      "px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors border",
                      isSelected
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background/60 hover:bg-muted text-muted-foreground hover:text-foreground border-border/40"
                    )}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-1">
            <span className="text-[11px] font-medium text-muted-foreground mr-1">
              Действие:
            </span>
            {ACTIVITY_ACTION_OPTIONS.map((opt) => {
              const isSelected = filters.action === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleActionChange(opt.value)}
                  disabled={!isExtendedAudit}
                  className={cn(
                    "px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors border",
                    isSelected
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background/60 hover:bg-muted text-muted-foreground hover:text-foreground border-border/40"
                  )}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-1">
            <span className="text-[11px] font-medium text-muted-foreground mr-1">
              Период:
            </span>
            {ACTIVITY_DATE_OPTIONS.map((opt) => {
              const isSelected = filters.dateRange === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleDateChange(opt.value)}
                  disabled={!isExtendedAudit}
                  className={cn(
                    "px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors border",
                    isSelected
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background/60 hover:bg-muted text-muted-foreground hover:text-foreground border-border/40"
                  )}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
