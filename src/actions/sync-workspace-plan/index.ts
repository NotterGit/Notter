"use server";

import { auth } from "@clerk/nextjs/server";
import { updateUser } from "@/api/user";
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
    if (!data.isOrg) {
      await updateUser(data.userId, {
        workspaces: {
          premiumLevel: data.premiumLevel,
          isOrg: false,
        },
      }).catch(() => {});
    }

    return {
      data: {
        userId: data.userId,
        premiumLevel: data.premiumLevel,
        isOrg: data.isOrg,
      },
    };
  } catch (error) {
    console.error("[SYNC_WORKSPACE_PLAN_ERROR]", error);
    return { error: "Не удалось синхронизировать тариф" };
  }
};

export const syncWorkspacePlan = createSafeAction(SyncWorkspacePlan, handler);
