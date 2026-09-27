"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { createSafeAction } from "@/lib/create-safe-action";
import { createAuditLog } from "@/lib/audit-log";
import { ACTION, NOTE_ENTITY_TYPE } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { pages } from "@/config/routing/pages.route";
import { getPlanLimits } from "@/lib/plan-limits";
import { getUserById } from "@/api/user";
import { getOrgById } from "@/api/org";
import { generateRandomId } from "@/lib/gen-id";
import { CreateDocument } from "./schema";
import { InputType, ReturnType } from "./types";

const handler = async (data: InputType): Promise<ReturnType> => {
  const { userId: clerkUserId, orgId: clerkOrgId } = await auth();
  const orgId = data.userId || clerkOrgId || clerkUserId;
  if (!clerkUserId || !orgId) {
    return { error: "Не авторизован" };
  }

  try {
    const isOrg =
      data.isOrg ??
      (orgId.startsWith("org_") || Boolean(clerkOrgId && clerkOrgId === orgId));
    const profile = isOrg ? await getOrgById(orgId) : await getUserById(orgId);
    const effectivePremium = Math.max(
      Number(profile?.premium ?? 0),
      Number(data.premiumLevel ?? 0)
    );
    const planLimits = getPlanLimits(effectivePremium, isOrg);

    const count = await db.document.count({
      where: {
        userId: orgId,
        isArchived: false,
      },
    });

    if (count >= planLimits.documents) {
      return {
        error: `Вы достигли лимита на создание в ${planLimits.documents} заметок`,
      };
    }

    let shortId = generateRandomId(4);
    let exists = await db.document.findUnique({ where: { shortId } });
    while (exists) {
      shortId = generateRandomId(4);
      exists = await db.document.findUnique({ where: { shortId } });
    }

    const parentDocId = data.parentDocumentId ?? data.parentDocument ?? null;

    const lastDoc = await db.document.findFirst({
      where: {
        userId: orgId,
        parentDocumentId: parentDocId,
        isArchived: false,
      },
      orderBy: { order: "desc" },
      select: { order: true },
    });
    const order = (lastDoc?.order ?? -1) + 1;

    const document = await db.document.create({
      data: {
        title: data.title,
        userId: orgId,
        userName: data.lastEditor || null,
        creatorName: data.creatorName || null,
        lastEditor: data.lastEditor || null,
        lastEditTime: data.lastEditTime || new Date().toISOString(),
        parentDocumentId: parentDocId,
        shortId,
        order,
      },
    });

    await createAuditLog({
      entityId: document.id,
      entityTitle: document.title,
      entityType: NOTE_ENTITY_TYPE.DOCUMENT,
      action: ACTION.CREATE,
      orgId,
    });

    revalidatePath(pages.DASHBOARD());
    revalidatePath(pages.DASHBOARD(document.id));

    return { data: document };
  } catch (error) {
    console.error("[CREATE_DOCUMENT_ERROR]", error);
    return { error: "Не удалось создать заметку" };
  }
};

export const createDocument = createSafeAction(CreateDocument, handler);
