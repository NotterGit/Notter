"use server";

import { auth } from "@clerk/nextjs/server";
import { updateUser } from "@/api/user";
import { createSafeAction } from "@/lib/create-safe-action";
import { isArchiveRetentionAllowed } from "@/lib/plan-limits";
import { SetArchiveRetention } from "./schema";
import { InputType, ReturnType } from "./types";

const handler = async (data: InputType): Promise<ReturnType> => {
  const { userId: clerkUserId, orgId: clerkOrgId } = await auth();
  const orgId = data.userId || clerkOrgId || clerkUserId;
  if (!clerkUserId || !orgId) {
    return { error: "Не авторизован" };
  }

  if (data.userId !== orgId && data.userId !== clerkUserId) {
    return { error: "Доступ запрещен" };
  }

  const premium = data.premiumLevel ?? 0;
  if (!isArchiveRetentionAllowed(data.retentionDays, premium)) {
    return { error: "Выбранный срок хранения недоступен на вашем тарифе" };
  }

  try {
    await updateUser(data.userId, {
      archived_settings: {
        retentionDays: data.retentionDays,
      },
    });

    return {
      data: {
        retentionDays: data.retentionDays,
      },
    };
  } catch (error) {
    console.error("[SET_ARCHIVE_RETENTION_ERROR]", error);
    return { error: "Не удалось сохранить настройки архива" };
  }
};

export const setArchiveRetention = createSafeAction(SetArchiveRetention, handler);
