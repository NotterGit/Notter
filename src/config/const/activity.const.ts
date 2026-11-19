import { ACTION, NOTE_ENTITY_TYPE } from "@prisma/client";
import type { ActivityFiltersState } from "@/config/types/activity.types";

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
