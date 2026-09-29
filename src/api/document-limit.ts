import { FREE_LIMITS } from "@/config/const/limits.const";

export const getCreateDocumentErrorMessage = (error: unknown) => {
  const message = error instanceof Error ? error.message : typeof error === "string" ? error : "";

  if (message.includes("Rate limit exceeded")) {
    return "Вы превысили лимит на создание документов. Попробуйте позже";
  }

  if (message.includes("Rate limited note") || message.includes("лимита на создание")) {
    const [, rawLimit] = message.split(":");
    const documentLimit = Number(rawLimit) || FREE_LIMITS.documents;

    return `Вы достигли лимита на создание в ${documentLimit} заметок`;
  }

  if (message.includes("Public document limit reached")) {
    const [, rawLimit] = message.split(":");
    return `Вы достигли лимита на публикацию в ${Number(rawLimit) || 10} публичных заметок`;
  }

  return message || "Не удалось создать заметку";
};

export type CreateDocumentArgs = {
  title: string;
  userId: string;
  lastEditor: string;
  creatorName: string;
  lastEditTime?: string;
  parentDocument?: string | null;
  premiumLevel?: number;
  isOrg?: boolean;
};

export type CreateDocumentMutation = (
  args: CreateDocumentArgs
) => Promise<string>;

export const createDocumentWithFallback = async (
  create: CreateDocumentMutation,
  args: CreateDocumentArgs
) => {
  return create(args);
};
