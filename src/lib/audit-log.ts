import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "./db";
import type { CreateAuditLogProps } from "@/config/types/actions.types";

export async function createAuditLog(props: CreateAuditLogProps) {
  try {
    const { orgId: clerkOrgId } = await auth();
    const user = await currentUser();
    const orgId = props.orgId || clerkOrgId || user?.id;

    if (!user || !orgId) {
      throw new Error("User not found!");
    }

    const { entityId, entityTitle, entityType, action } = props;
    const userName =
      [user.firstName, user.lastName].filter(Boolean).join(" ") ||
      user.username ||
      "Пользователь";

    await db.noteAuditLog.create({
      data: {
        orgId,
        entityId,
        entityType,
        entityTitle,
        action,
        userId: user.id,
        userImage: user?.imageUrl,
        userName,
      },
    });
  } catch (error) {
    console.error("[AUDIT_LOG_ERROR]", error);
  }
}
