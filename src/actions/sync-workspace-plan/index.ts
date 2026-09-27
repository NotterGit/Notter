"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { createSafeAction } from "@/lib/create-safe-action";
import { SyncWorkspacePlan } from "./schema";
import { InputType, ReturnType } from "./types";

const handler = async (data: InputType): Promise<ReturnType> => {
  const { userId: clerkUserId, orgId: clerkOrgId } = await auth();
  const orgId = clerkOrgId || clerkUserId;
  if (!clerkUserId || !orgId) {
    return { error: "Не авторизован" };
  }

  try {
    const workspace = await db.workspace.upsert({
      where: { userId: data.userId },
      create: {
        userId: data.userId,
        premiumLevel: data.premiumLevel,
        isOrg: data.isOrg,
      },
      update: {
        premiumLevel: data.premiumLevel,
        isOrg: data.isOrg,
      },
    });

    return { data: workspace };
  } catch (error) {
    console.error("[SYNC_WORKSPACE_PLAN_ERROR]", error);
    return { error: "Не удалось синхронизировать тариф" };
  }
};

export const syncWorkspacePlan = createSafeAction(SyncWorkspacePlan, handler);
