"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { createSafeAction } from "@/lib/create-safe-action";
import { revalidatePath } from "next/cache";
import { pages } from "@/config/routing/pages.route";
import { ReorderDocuments } from "./schema";
import { InputType, ReturnType } from "./types";

const handler = async (data: InputType): Promise<ReturnType> => {
  const { userId: clerkUserId, orgId: clerkOrgId } = await auth();
  const orgId = data.userId || clerkOrgId || clerkUserId;
  if (!clerkUserId || !orgId) {
    return { error: "Не авторизован" };
  }

  try {
    await db.$transaction(
      data.items.map((item) =>
        db.document.update({
          where: { id: item.id },
          data: {
            order: item.order,
            parentDocumentId: item.parentDocument === undefined ? undefined : item.parentDocument,
            ...(data.lastEditor ? { lastEditor: data.lastEditor } : {}),
            ...(data.lastEditTime ? { lastEditTime: data.lastEditTime } : {}),
          },
        })
      )
    );

    revalidatePath(pages.DASHBOARD());
    return { data: { success: true } };
  } catch (error) {
    console.error("[REORDER_DOCUMENTS_ERROR]", error);
    return { error: "Не удалось изменить порядок" };
  }
};

export const reorderDocuments = createSafeAction(ReorderDocuments, handler);
