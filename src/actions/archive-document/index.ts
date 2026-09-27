"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { createSafeAction } from "@/lib/create-safe-action";
import { createAuditLog } from "@/lib/audit-log";
import { ACTION, NOTE_ENTITY_TYPE } from "@prisma/client";
import { revalidatePath } from "next/cache";
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
    });

    if (!existing) {
      return { error: "Заметка не найдена" };
    }

    if (existing.userId !== orgId && existing.userId !== clerkUserId) {
      return { error: "Доступ запрещен" };
    }

    const now = new Date();

    const archiveChildren = async (parentId: string) => {
      const children = await db.document.findMany({
        where: {
          parentDocumentId: parentId,
          userId: orgId,
          isArchived: false,
        },
        select: { id: true },
      });

      for (const child of children) {
        await db.document.update({
          where: { id: child.id },
          data: { isArchived: true, archivedTime: now },
        });
        await archiveChildren(child.id);
      }
    };

    const document = await db.document.update({
      where: { id: data.id },
      data: { isArchived: true, archivedTime: now },
    });

    await archiveChildren(data.id);

    const archiveSetting = await db.archiveSettings.findUnique({
      where: { userId: orgId },
    });
    const retentionDays = archiveSetting?.retentionDays ?? 7;
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
