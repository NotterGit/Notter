import { Id } from "../../convex/_generated/dataModel";
import { FREE_LIMITS } from "@/config/const/limits.const";

export const getCreateDocumentErrorMessage = (error: unknown) => {
  const message = error instanceof Error ? error.message : "";

  if (message.includes("Rate limit exceeded")) {
    return "Вы превысили лимит на создание документов. Попробуйте позже";
  }

  if (message.includes("Rate limited note")) {
    const [, rawLimit] = message.split(":");
    const documentLimit = Number(rawLimit) || FREE_LIMITS.documents;

    return `Вы достигли лимита на создание в ${documentLimit} заметок`;
  }

  if (message.includes("Public document limit reached")) {
    const [, rawLimit] = message.split(":");
    return `Вы достигли лимита на публикацию в ${Number(rawLimit) || 10} публичных заметок`;
  }

  return "Не удалось создать заметку";
};

type CreateDocumentArgs = {
  title: string;
  userId: string;
  lastEditor: string;
  creatorName: string;
  lastEditTime?: string;
  parentDocument?: Id<"documents">;
};

type CreateDocumentMutation = (
  args: CreateDocumentArgs
) => Promise<Id<"documents">>;

export const createDocumentWithFallback = async (
  create: CreateDocumentMutation,
  args: CreateDocumentArgs
) => {
  return create(args);
};
