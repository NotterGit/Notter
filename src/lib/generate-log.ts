import { ACTION, NOTE_ENTITY_TYPE, type NoteAuditLog } from "@prisma/client";

const entityNames: Record<NOTE_ENTITY_TYPE, string> = {
  [NOTE_ENTITY_TYPE.DOCUMENT]: "заметку",
  [NOTE_ENTITY_TYPE.SETTINGS]: "настройки",
  [NOTE_ENTITY_TYPE.WORKSPACE]: "пространство",
};

export const generateLogMessage = (log: NoteAuditLog) => {
  const { action, entityTitle, entityType } = log;
  const entityName = entityNames[entityType] || entityType.toLowerCase();

  switch (action) {
    case ACTION.CREATE:
      return `создал(а) ${entityName} "${entityTitle}"`;
    case ACTION.UPDATE:
      return `обновил(а) ${entityName} "${entityTitle}"`;
    case ACTION.DELETE:
      return `удалил(а) ${entityName} "${entityTitle}"`;
    default:
      return `неизвестное действие с ${entityName} "${entityTitle}"`;
  }
};
