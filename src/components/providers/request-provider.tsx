"use client";

import { useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { setClerkTokenGetter } from "@/api/client";
import { useRequestOrg } from "@/components/hooks/use-request-org";
import { useRequestUser } from "@/components/hooks/use-request-user";

export function RequestProvider({ children }: { children: React.ReactNode }) {
  const { getToken } = useAuth();

  useEffect(() => {
    setClerkTokenGetter(getToken);
    return () => {
      setClerkTokenGetter(null);
    };
  }, [getToken]);

  useRequestUser();
  useRequestOrg();

  return <>{children}</>;
}