import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";

import { createUser, getUserById, updateUser } from "@/api/user";
import { useDocumentStats } from "@/components/hooks/use-document-stats";
import type { UseRequestUserFunction } from "@/config/types/api.types";

export const useRequestUser: UseRequestUserFunction = () => {
  const { user, isLoaded, isSignedIn } = useUser();
  const { documentCount, documentPublicCount, documentVerifiedCount, isReady } =
    useDocumentStats(user?.id);

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
        return;
      }

      await createUser(user.id, {
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
  ]);

  return null;
};
