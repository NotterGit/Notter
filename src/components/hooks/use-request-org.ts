import { useEffect } from "react";
import { useOrganization, useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";

import { createOrg, getOrgById, updateOrg } from "@/api/org";
import { useDocumentStats } from "@/components/hooks/use-document-stats";
import type { UseRequestOrgFunction } from "@/config/types/api.types";

export const useRequestOrg: UseRequestOrgFunction = () => {
  const { organization, isLoaded } = useOrganization();
  const { isSignedIn } = useUser();
  const syncWorkspacePlan = useMutation(api.document.syncWorkspacePlan);
  const { documentCount, documentPublicCount, documentVerifiedCount, isReady } =
    useDocumentStats(organization?.id);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !organization?.id) return;

    const syncOrgPlan = async () => {
      try {
        const org = await getOrgById(organization.id);
        if (org && org.premium !== undefined) {
          await syncWorkspacePlan({
            userId: organization.id,
            premiumLevel: org.premium,
            isOrg: true,
          });
        }
      } catch {}
    };

    syncOrgPlan();
  }, [isLoaded, isSignedIn, organization?.id, syncWorkspacePlan]);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !organization || !isReady) return;

    const syncOrg = async () => {
      const memberships = await organization.getMemberships();
      const members = memberships.data.flatMap((member) => {
        const userId = member.publicUserData?.userId;
        return userId ? [userId] : [];
      });
      const admin = memberships.data.find((member) => member.role === "org:admin");
      const adminId = admin?.publicUserData?.userId ?? null;

      const existingOrg = await getOrgById(organization.id);
      if (!existingOrg) {
        const createdOrg = await createOrg(organization.id, {
          username: organization.slug,
          owner: adminId,
          created: organization.createdAt,
          name: organization.name,
          members,
          avatar: organization.imageUrl || null,
          documents: documentCount,
          publicDocuments: documentPublicCount,
          verifiedDocuments: documentVerifiedCount,
        });

        if (createdOrg?.premium !== undefined) {
          await syncWorkspacePlan({
            userId: organization.id,
            premiumLevel: createdOrg.premium,
            isOrg: true,
          }).catch(() => {});
        }
        return;
      }

      await updateOrg(organization.id, {
        username: organization.slug,
        owner: adminId,
        name: organization.name,
        avatar: organization.imageUrl || null,
        documents: documentCount,
        publicDocuments: documentPublicCount,
        members,
        verifiedDocuments: documentVerifiedCount,
      });

      if (existingOrg.premium !== undefined) {
        await syncWorkspacePlan({
          userId: organization.id,
          premiumLevel: existingOrg.premium,
          isOrg: true,
        }).catch(() => {});
      }
    };

    syncOrg();
  }, [
    isLoaded,
    isSignedIn,
    organization,
    documentCount,
    documentPublicCount,
    documentVerifiedCount,
    isReady,
    syncWorkspacePlan,
  ]);

  return null;
};
