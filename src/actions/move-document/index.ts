"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { createSafeAction } from "@/lib/create-safe-action";
import { createAuditLog } from "@/lib/audit-log";
import { ACTION, NOTE_ENTITY_TYPE } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { pages } from "@/config/routing/pages.route";
import { MoveDocument } from "./schema";
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
      select: { id: true, userId: true, parentDocumentId: true, order: true },
    });

    if (!existing) {
      return { error: "Заметка не найдена" };
    }

    if (existing.userId !== orgId && existing.userId !== clerkUserId) {
      return { error: "Доступ запрещен" };
    }

    const targetParentId =
      data.targetParentId !== undefined
        ? data.targetParentId
        : (data.parentDocument ?? null);

    if (targetParentId === data.id) {
      return { error: "Нельзя переместить заметку внутрь самой себя" };
    }

    if (targetParentId) {
      let currentId: string | null = targetParentId;
      while (currentId) {
        if (currentId === data.id) {
          return { error: "Нельзя переместить заметку в ее дочернюю заметку" };
        }
        const parentDoc: { parentDocumentId: string | null } | null =
          await db.document.findUnique({
            where: { id: currentId },
            select: { parentDocumentId: true },
          });
        currentId = parentDoc?.parentDocumentId || null;
      }
    }

    const siblings = await db.document.findMany({
      where: {
        userId: orgId,
        parentDocumentId: targetParentId,
        isArchived: false,
        id: { not: data.id },
      },
      select: { id: true, order: true, parentDocumentId: true },
      orderBy: { order: "asc" },
    });

    const newOrder =
      data.newOrder !== undefined
        ? Math.max(0, Math.min(data.newOrder, siblings.length))
        : siblings.length;
    siblings.splice(newOrder, 0, existing);

    const updatePromises = siblings
      .map((doc, idx) => {
        const isCurrent = doc.id === data.id;
        const orderChanged = doc.order !== idx;
        const parentChanged = doc.parentDocumentId !== targetParentId;
        if (!orderChanged && !parentChanged && !isCurrent) {
          return null;
        }
        return db.document.update({
          where: { id: doc.id },
          data: {
            order: idx,
            parentDocumentId: targetParentId,
            ...(isCurrent && data.lastEditor ? { lastEditor: data.lastEditor } : {}),
            ...(isCurrent && data.lastEditTime ? { lastEditTime: data.lastEditTime } : {}),
          },
          select: { id: true },
        });
      })
      .filter(Boolean);

    await Promise.all(updatePromises);

    const updated = await db.document.findUnique({
      where: { id: data.id },
    });

    if (updated) {
      await createAuditLog({
        entityId: updated.id,
        entityTitle: updated.title,
        entityType: NOTE_ENTITY_TYPE.DOCUMENT,
        action: ACTION.UPDATE,
        orgId,
      });
    }

    revalidatePath(pages.DASHBOARD());
    revalidatePath(pages.DASHBOARD(data.id));

    return { data: updated! };
  } catch (error) {
    console.error("[MOVE_DOCUMENT_ERROR]", error);
    return { error: "Не удалось переместить заметку" };
  }
};

export const moveDocument = createSafeAction(MoveDocument, handler);
