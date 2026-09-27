"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { createSafeAction } from "@/lib/create-safe-action";
import { createAuditLog } from "@/lib/audit-log";
import { ACTION, NOTE_ENTITY_TYPE } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { pages } from "@/config/routing/pages.route";
import { DeleteDocument } from "./schema";
import { InputType, ReturnType } from "./types";

const handler = async (data: InputType): Promise<ReturnType> => {
  const { userId: clerkUserId, orgId: clerkOrgId } = await auth();
  const orgId = data.userId || clerkOrgId || clerkUserId;
  if (!clerkUserId || !orgId) {
    return { error: "Не авторизован" };
  }

  try {
    const existing = await db.document.findUnique({
      where: { id: data.id },
    });

    if (!existing) {
      return { error: "Заметка не найдена" };
    }

    if (existing.userId !== orgId && existing.userId !== clerkUserId) {
      return { error: "Доступ запрещен" };
    }

    await db.document.updateMany({
      where: { parentDocumentId: data.id },
      data: { parentDocumentId: existing.parentDocumentId || null },
    });

    const document = await db.document.delete({
      where: { id: data.id },
    });

    await createAuditLog({
      entityId: document.id,
      entityTitle: document.title,
      entityType: NOTE_ENTITY_TYPE.DOCUMENT,
      action: ACTION.DELETE,
      orgId,
    });

    revalidatePath(pages.DASHBOARD());

    return { data: document };
  } catch (error) {
    console.error("[DELETE_DOCUMENT_ERROR]", error);
    return { error: "Не удалось удалить заметку" };
  }
};

export const deleteDocument = createSafeAction(DeleteDocument, handler);
