"use server";

import { db } from "@/lib/db";
import { createSafeAction } from "@/lib/create-safe-action";
import { IncrementViews } from "./schema";
import { InputType, ReturnType } from "./types";

const handler = async (data: InputType): Promise<ReturnType> => {
  try {
    const document = await db.document.update({
      where: { id: data.id },
      data: {
        views: {
          increment: 1,
        },
      },
    });

    return { data: document };
  } catch (error) {
    console.error("[INCREMENT_VIEWS_ERROR]", error);
    return { error: "Не удалось обновить просмотры" };
  }
};

export const incrementViews = createSafeAction(IncrementViews, handler);
