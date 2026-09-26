"use client";

import { useCallback, useEffect, useState } from "react";
import { useOrganization, useUser } from "@clerk/nextjs";

import type { QualAiLimitsData } from "@/config/types/ai.types";

export type { QualAiLimitsData };

export function useQualAiLimits(customWorkspaceId?: string) {
  const { organization, isLoaded: isOrgLoaded } = useOrganization();
  const { user, isLoaded: isUserLoaded } = useUser();
  const [limits, setLimits] = useState<QualAiLimitsData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const activeWorkspaceId = customWorkspaceId ?? (organization?.id || user?.id);
  const isOrg = Boolean(customWorkspaceId ? customWorkspaceId.startsWith("org_") : organization?.id);

  const fetchLimits = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (activeWorkspaceId) {
        params.set("workspaceId", activeWorkspaceId);
      }
      if (isOrg) {
        params.set("isOrg", "true");
      }
      const url = params.toString() ? `/api/ai/limits?${params.toString()}` : "/api/ai/limits";
      const res = await fetch(url);
      if (res.ok) {
        const data: QualAiLimitsData = await res.json();
        setLimits(data);
      }
    } catch (e) {
      console.error("Failed to fetch QualAI limits:", e);
    } finally {
      setIsLoading(false);
    }
  }, [activeWorkspaceId, isOrg]);

  useEffect(() => {
    if (!isOrgLoaded || !isUserLoaded) return;
    void fetchLimits();
  }, [fetchLimits, isOrgLoaded, isUserLoaded]);

  return {
    limits,
    isLoading,
    refresh: fetchLimits,
    workspaceId: activeWorkspaceId,
    isOrg,
  };
}
