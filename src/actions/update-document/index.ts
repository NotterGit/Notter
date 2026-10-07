"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { createSafeAction } from "@/lib/create-safe-action";
import { createAuditLog } from "@/lib/audit-log";
import { ACTION, NOTE_ENTITY_TYPE } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { pages } from "@/config/routing/pages.route";
import { UpdateDocument } from "./schema";
import { InputType, ReturnType } from "./types";

const handler = async (data: InputType): Promise<ReturnType> => {
  const { userId: clerkUserId, orgId: clerkOrgId } = await auth();
  const orgId = data.userId || clerkOrgId || clerkUserId;
  if (!clerkUserId || !orgId) {
    return { error: "Не авторизован" };
  }

  const { id, userId, ...values } = data;

  try {
    const existing = await db.document.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        shortId: true,
      },
    });

    if (!existing) {
      return { error: "Заметка не найдена" };
    }

    if (existing.userId !== orgId && existing.userId !== clerkUserId) {
      return { error: "Доступ запрещен" };
    }

    if (values.shortId && values.shortId !== existing.shortId) {
      const conflict = await db.document.findUnique({
        where: { shortId: values.shortId },
        select: { id: true },
      });
      if (conflict) {
        return { error: "Данный короткий адрес уже занят" };
      }
    }

    const document = await db.document.update({
      where: { id },
      data: {
        ...values,
      },
    });

    const isStructuralChange =
      values.title !== undefined ||
      values.parentDocumentId !== undefined ||
      values.order !== undefined ||
      values.isPublished !== undefined ||
      values.shortId !== undefined;

    const isSignificantChange =
      isStructuralChange ||
      values.icon !== undefined ||
      values.coverImage !== undefined ||
      values.isPinned !== undefined;

    if (isSignificantChange) {
      await createAuditLog({
        entityId: document.id,
        entityTitle: document.title,
        entityType: NOTE_ENTITY_TYPE.DOCUMENT,
        action: ACTION.UPDATE,
        orgId: existing.userId,
      });
    }

    if (isStructuralChange) {
      revalidatePath(pages.DASHBOARD(document.id));
      revalidatePath(pages.DASHBOARD());
    }

    return { data: document };
  } catch (error) {
    console.error("[UPDATE_DOCUMENT_ERROR]", error);
    return { error: "Не удалось обновить заметку" };
  }
};

export const updateDocument = createSafeAction(UpdateDocument, handler);
