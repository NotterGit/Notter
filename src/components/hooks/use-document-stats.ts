import { useQuery } from "@tanstack/react-query";
import { fetcher } from "@/lib/fetcher";
import { API } from "@/config/routing/api.route";
import type { UseDocumentStatsFunction } from "@/config/types/api.types";

interface StatsResponse {
  documentCount?: number;
  documentPublicCount?: number;
  documentVerifiedCount?: number;
}

export const useDocumentStats: UseDocumentStatsFunction = (userId) => {
  const { data, isSuccess } = useQuery<StatsResponse>({
    queryKey: ["document-stats", userId],
    queryFn: () => fetcher(API.DOCUMENTS.STATS(userId || undefined)),
    enabled: Boolean(userId),
    staleTime: 1000 * 60,
  });

  return {
    documentCount: data?.documentCount,
    documentPublicCount: data?.documentPublicCount,
    documentVerifiedCount: data?.documentVerifiedCount,
    isReady: isSuccess && data !== undefined,
  };
};
