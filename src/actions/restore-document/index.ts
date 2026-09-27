"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { createSafeAction } from "@/lib/create-safe-action";
import { createAuditLog } from "@/lib/audit-log";
import { ACTION, NOTE_ENTITY_TYPE } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { pages } from "@/config/routing/pages.route";
import { RestoreDocument } from "./schema";
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

    const updates: {
      isArchived: boolean;
      archivedTime: null;
      parentDocumentId?: string | null;
    } = {
      isArchived: false,
      archivedTime: null,
    };

    if (existing.parentDocumentId) {
      const parent = await db.document.findUnique({
        where: { id: existing.parentDocumentId },
      });
      if (!parent || parent.isArchived) {
        updates.parentDocumentId = null;
      }
    }

    const recursiveRestore = async (docId: string) => {
      const children = await db.document.findMany({
        where: {
          parentDocumentId: docId,
          userId: orgId,
        },
        select: { id: true },
      });

      for (const child of children) {
        await db.document.update({
          where: { id: child.id },
          data: { isArchived: false, archivedTime: null },
        });
        await recursiveRestore(child.id);
      }
    };

    const document = await db.document.update({
      where: { id: data.id },
      data: updates,
    });

    await recursiveRestore(data.id);

    await createAuditLog({
      entityId: document.id,
      entityTitle: document.title,
      entityType: NOTE_ENTITY_TYPE.DOCUMENT,
      action: ACTION.UPDATE,
      orgId,
    });

    revalidatePath(pages.DASHBOARD());
    revalidatePath(pages.DASHBOARD(document.id));

    return { data: document };
  } catch (error) {
    console.error("[RESTORE_DOCUMENT_ERROR]", error);
    return { error: "Не удалось восстановить заметку" };
  }
};

export const restoreDocument = createSafeAction(RestoreDocument, handler);
