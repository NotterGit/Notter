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
      select: { id: true, userId: true, title: true, parentDocumentId: true },
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
        select: { id: true, isArchived: true },
      });
      if (!parent || parent.isArchived) {
        updates.parentDocumentId = null;
      }
    }

    const getAllDescendantIdsToRestore = async (parentIds: string[]): Promise<string[]> => {
      if (parentIds.length === 0) return [];
      const children = await db.document.findMany({
        where: {
          parentDocumentId: { in: parentIds },
          userId: orgId,
        },
        select: { id: true },
      });
      if (children.length === 0) return [];
      const childIds = children.map((c) => c.id);
      const subChildIds = await getAllDescendantIdsToRestore(childIds);
      return [...childIds, ...subChildIds];
    };

    const document = await db.document.update({
      where: { id: data.id },
      data: updates,
    });

    const descendantIds = await getAllDescendantIdsToRestore([data.id]);
    if (descendantIds.length > 0) {
      await db.document.updateMany({
        where: { id: { in: descendantIds } },
        data: { isArchived: false, archivedTime: null },
      });
    }

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
