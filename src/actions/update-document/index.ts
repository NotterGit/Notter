"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { createSafeAction } from "@/lib/create-safe-action";
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

    revalidatePath(pages.DASHBOARD(document.id));
    revalidatePath(pages.DASHBOARD());

    return { data: document };
  } catch (error) {
    console.error("[UPDATE_DOCUMENT_ERROR]", error);
    return { error: "Не удалось обновить заметку" };
  }
};

export const updateDocument = createSafeAction(UpdateDocument, handler);
