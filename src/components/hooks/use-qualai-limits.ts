"use client";

import { useQuery } from "@tanstack/react-query";
import { useOrganization, useUser } from "@clerk/nextjs";

import type { QualAiLimitsData } from "@/config/types/ai.types";
import { useAccountProfile } from "@/hooks/use-account-profile";

export type { QualAiLimitsData };

export function useQualAiLimits(customWorkspaceId?: string) {
  const { organization, isLoaded: isOrgLoaded } = useOrganization();
  const { user, isLoaded: isUserLoaded } = useUser();

  const activeWorkspaceId = customWorkspaceId ?? (organization?.id || user?.id);
  const isOrg = Boolean(
    customWorkspaceId
      ? customWorkspaceId.startsWith("org_")
      : organization?.id
  );
  const { data: profile } = useAccountProfile(activeWorkspaceId, isOrg);

  const {
    data: limits = null,
    isLoading,
    refetch,
  } = useQuery<QualAiLimitsData | null>({
    queryKey: [
      "qualai-limits",
      activeWorkspaceId,
      isOrg,
      profile?.premium,
    ],
    queryFn: async () => {
      if (!activeWorkspaceId) return null;
      const params = new URLSearchParams();
      params.set("workspaceId", activeWorkspaceId);
      if (isOrg) {
        params.set("isOrg", "true");
      }
      if (profile?.premium !== undefined) {
        params.set("fallbackPremium", String(profile.premium));
      }
      const url = `/api/ai/limits?${params.toString()}`;
      const res = await fetch(url);
      if (!res.ok) {
        return null;
      }
      return res.json();
    },
    enabled: Boolean(isOrgLoaded && isUserLoaded && activeWorkspaceId),
    staleTime: 1000 * 60, // Cache for 60 seconds
    gcTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  return {
    limits,
    isLoading,
    refresh: refetch,
    workspaceId: activeWorkspaceId,
    isOrg,
  };
}
