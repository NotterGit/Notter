"use client";

import { useQuery } from "@tanstack/react-query";
import { getUserById } from "@/api/user";
import { getOrgById } from "@/api/org";
import type { Org, User } from "@/config/types/api.types";

export function useAccountProfile(id?: string | null, isOrg = false) {
  return useQuery<User | Org | null>({
    queryKey: ["account-profile", id, isOrg],
    queryFn: async () => {
      if (!id) return null;
      if (isOrg) {
        return getOrgById(id);
      }
      return getUserById(id);
    },
    enabled: Boolean(id),
    staleTime: 1000 * 60 * 5,
  });
}
