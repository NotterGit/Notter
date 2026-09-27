"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { createSafeAction } from "@/lib/create-safe-action";
import { createAuditLog } from "@/lib/audit-log";
import { ACTION, NOTE_ENTITY_TYPE } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { getUserById } from "@/api/user";
import { pages } from "@/config/routing/pages.route";
import { ArchiveDocument } from "./schema";
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
      select: { id: true, userId: true, title: true },
    });

    if (!existing) {
      return { error: "Заметка не найдена" };
    }

    if (existing.userId !== orgId && existing.userId !== clerkUserId) {
      return { error: "Доступ запрещен" };
    }

    const now = new Date();

    const getAllDescendantIds = async (parentIds: string[]): Promise<string[]> => {
      if (parentIds.length === 0) return [];
      const children = await db.document.findMany({
        where: {
          parentDocumentId: { in: parentIds },
          userId: orgId,
          isArchived: false,
        },
        select: { id: true },
      });
      if (children.length === 0) return [];
      const childIds = children.map((c) => c.id);
      const subChildIds = await getAllDescendantIds(childIds);
      return [...childIds, ...subChildIds];
    };

    const document = await db.document.update({
      where: { id: data.id },
      data: { isArchived: true, archivedTime: now },
    });

    const descendantIds = await getAllDescendantIds([data.id]);
    if (descendantIds.length > 0) {
      await db.document.updateMany({
        where: { id: { in: descendantIds } },
        data: { isArchived: true, archivedTime: now },
      });
    }

    const user = await getUserById(orgId).catch(() => null);
    const retentionDays = user?.archived_settings?.retentionDays ?? 7;
    const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

    await db.document.deleteMany({
      where: {
        userId: orgId,
        isArchived: true,
        archivedTime: { lte: cutoff },
        id: { not: data.id },
      },
    });

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
    console.error("[ARCHIVE_DOCUMENT_ERROR]", error);
    return { error: "Не удалось архивировать заметку" };
  }
};

export const archiveDocument = createSafeAction(ArchiveDocument, handler);
