import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";

import { createUser, getUserById, updateUser } from "@/api/user";
import { useDocumentStats } from "@/components/hooks/use-document-stats";
import type { UseRequestUserFunction } from "@/config/types/api.types";

export const useRequestUser: UseRequestUserFunction = () => {
  const { user, isLoaded, isSignedIn } = useUser();
  const syncWorkspacePlan = useMutation(api.document.syncWorkspacePlan);
  const { documentCount, documentPublicCount, documentVerifiedCount, isReady } =
    useDocumentStats(user?.id);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user?.id) return;

    const syncPlan = async () => {
      try {
        const u = await getUserById(user.id);
        if (u && u.premium !== undefined) {
          await syncWorkspacePlan({
            userId: user.id,
            premiumLevel: u.premium,
            isOrg: false,
          });
        }
      } catch {}
    };

    syncPlan();
  }, [isLoaded, isSignedIn, user?.id, syncWorkspacePlan]);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user?.username || !isReady) return;

    const syncUser = async () => {
      const existingUser = await getUserById(user.id);

      if (existingUser) {
        await updateUser(user.id, {
          username: user.username,
          firstname: user.firstName,
          lastname: user.lastName,
          avatar: user.imageUrl || null,
          documents: documentCount,
          publicDocuments: documentPublicCount,
          verifiedDocuments: documentVerifiedCount,
          mail: user.emailAddresses[0]?.emailAddress ?? null,
        });

        if (existingUser.premium !== undefined) {
          await syncWorkspacePlan({
            userId: user.id,
            premiumLevel: existingUser.premium,
            isOrg: false,
          }).catch(() => {});
        }
        return;
      }

      const createdUser = await createUser(user.id, {
        username: user.username as string,
        created: user.createdAt,
        firstname: user.firstName,
        lastname: user.lastName,
        avatar: user.imageUrl || null,
        documents: documentCount,
        publicDocuments: documentPublicCount,
        verifiedDocuments: documentVerifiedCount,
        mail: user.emailAddresses[0]?.emailAddress ?? null,
      });

      if (createdUser?.premium !== undefined) {
        await syncWorkspacePlan({
          userId: user.id,
          premiumLevel: createdUser.premium,
          isOrg: false,
        }).catch(() => {});
      }
    };

    syncUser();
  }, [
    isLoaded,
    isSignedIn,
    user,
    documentCount,
    documentPublicCount,
    documentVerifiedCount,
    isReady,
    syncWorkspacePlan,
  ]);

  return null;
};
