import { ACTION, NOTE_ENTITY_TYPE } from "@prisma/client";
import { Plus, Pencil, Trash2, FileText, Settings, LayoutGrid } from "lucide-react";
import type { ActivityFiltersState } from "@/config/types/activity.types";

export const ACTION_BADGE_CONFIG: Record<
  ACTION,
  { label: string; icon: typeof Plus; className: string }
> = {
  [ACTION.CREATE]: {
    label: "Создание",
    icon: Plus,
    className:
      "text-emerald-700 dark:text-emerald-400 bg-emerald-500/15 dark:bg-emerald-500/10 border-emerald-500/30",
  },
  [ACTION.UPDATE]: {
    label: "Изменение",
    icon: Pencil,
    className:
      "text-blue-700 dark:text-blue-400 bg-blue-500/15 dark:bg-blue-500/10 border-blue-500/30",
  },
  [ACTION.DELETE]: {
    label: "Удаление",
    icon: Trash2,
    className:
      "text-rose-700 dark:text-rose-400 bg-rose-500/15 dark:bg-rose-500/10 border-rose-500/30",
  },
};

export const NOTE_ENTITY_BADGE_CONFIG: Record<
  NOTE_ENTITY_TYPE,
  { label: string; icon: typeof FileText; className: string }
> = {
  [NOTE_ENTITY_TYPE.DOCUMENT]: {
    label: "Заметка",
    icon: FileText,
    className:
      "text-cyan-700 dark:text-cyan-400 bg-cyan-500/15 dark:bg-cyan-500/10 border-cyan-500/30",
  },
  [NOTE_ENTITY_TYPE.SETTINGS]: {
    label: "Настройки",
    icon: Settings,
    className:
      "text-indigo-700 dark:text-indigo-400 bg-indigo-500/15 dark:bg-indigo-500/10 border-indigo-500/30",
  },
  [NOTE_ENTITY_TYPE.WORKSPACE]: {
    label: "Пространство",
    icon: LayoutGrid,
    className:
      "text-amber-700 dark:text-amber-400 bg-amber-500/15 dark:bg-amber-500/10 border-amber-500/30",
  },
};

export const ACTIVITY_ENTITY_OPTIONS = [
  { value: "ALL", label: "Все сущности" },
  { value: NOTE_ENTITY_TYPE.DOCUMENT, label: "Заметки" },
  { value: NOTE_ENTITY_TYPE.SETTINGS, label: "Настройки" },
  { value: NOTE_ENTITY_TYPE.WORKSPACE, label: "Пространство" },
];

export const ACTIVITY_ACTION_OPTIONS = [
  { value: "ALL", label: "Все действия" },
  { value: ACTION.CREATE, label: "Создание" },
  { value: ACTION.UPDATE, label: "Изменение" },
  { value: ACTION.DELETE, label: "Удаление" },
];

export const ACTIVITY_DATE_OPTIONS = [
  { value: "ALL", label: "За всё время" },
  { value: "TODAY", label: "Сегодня" },
  { value: "7DAYS", label: "7 дней" },
  { value: "30DAYS", label: "30 дней" },
];

export const INITIAL_ACTIVITY_FILTERS: ActivityFiltersState = {
  search: "",
  entityType: "ALL",
  action: "ALL",
  dateRange: "ALL",
};
