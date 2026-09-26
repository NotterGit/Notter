"use client";

import { useCallback, useEffect, useState } from "react";

export interface QualAiLimitsData {
  account_id: string;
  tier: string;
  premium: number;
  limit: number;
  used: number;
  remaining: number;
  period?: string;
  week?: string;
  date?: string;
  reset_at?: string;
}

export function useQualAiLimits() {
  const [limits, setLimits] = useState<QualAiLimitsData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchLimits = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/ai/limits");
      if (res.ok) {
        const data: QualAiLimitsData = await res.json();
        setLimits(data);
      }
    } catch (e) {
      console.error("Failed to fetch QualAI limits:", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchLimits();
  }, [fetchLimits]);

  return {
    limits,
    isLoading,
    refresh: fetchLimits,
  };
}
