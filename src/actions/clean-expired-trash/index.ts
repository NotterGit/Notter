"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { getUserById } from "@/api/user";
import { createSafeAction } from "@/lib/create-safe-action";
import { revalidatePath } from "next/cache";
import { pages } from "@/config/routing/pages.route";
import { CleanExpiredTrash } from "./schema";
import { InputType, ReturnType } from "./types";

const handler = async (data: InputType): Promise<ReturnType> => {
  const { userId: clerkUserId, orgId: clerkOrgId } = await auth();
  const orgId = data.userId || clerkOrgId || clerkUserId;
  if (!clerkUserId || !orgId) {
    return { error: "Не авторизован" };
  }

  try {
    const user = await getUserById(orgId).catch(() => null);
    const retentionDays = user?.archived_settings?.retentionDays ?? 7;
    const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

    const result = await db.document.deleteMany({
      where: {
        userId: orgId,
        isArchived: true,
        archivedTime: { lte: cutoff },
      },
    });

    if (result.count > 0) {
      revalidatePath(pages.DASHBOARD());
    }

    return { data: { deletedCount: result.count } };
  } catch (error) {
    console.error("[CLEAN_EXPIRED_TRASH_ERROR]", error);
    return { error: "Не удалось очистить корзину" };
  }
};

export const cleanExpiredTrash = createSafeAction(CleanExpiredTrash, handler);
