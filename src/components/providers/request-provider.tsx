"use client";

import { useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { setClerkTokenGetter } from "@/api/client";

export function RequestProvider() {
  const { getToken } = useAuth();

  useEffect(() => {
    setClerkTokenGetter(getToken);
    return () => {
      setClerkTokenGetter(null);
    };
  }, [getToken]);

  return null;
}
