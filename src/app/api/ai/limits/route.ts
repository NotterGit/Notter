import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { QUALAI_API_URL } from "@/config/const/api.const";
import { getUserById } from "@/api/user";
import { getOrgById } from "@/api/org";
import { getPlanLimits } from "@/lib/plan-limits";
import type { PremiumLevel } from "@/config/const/limits.const";

export async function GET(req: NextRequest) {
  try {
    const { userId, orgId } = await auth();
    const searchParams = req.nextUrl.searchParams;
    const requestedWorkspaceId = searchParams.get("workspaceId") || searchParams.get("orgId");
    const requestedIsOrg = searchParams.get("isOrg");
    const fallbackPremiumParam = Number(searchParams.get("fallbackPremium")) || 0;

    const accountId = requestedWorkspaceId || orgId || userId || "guest";
    const isOrg = Boolean(
      (requestedWorkspaceId && requestedWorkspaceId.startsWith("org_")) ||
      (!requestedWorkspaceId && orgId) ||
      requestedIsOrg === "true"
    );

    // Fetch user or organization from Notter backend to resolve exact subscription tier
    const [targetUser, targetOrg] = await Promise.all([
      isOrg ? Promise.resolve(null) : getUserById(accountId).catch(() => null),
      isOrg ? getOrgById(accountId).catch(() => null) : Promise.resolve(null),
    ]);

    const userPremium = Math.max(
      Number(targetUser?.premium ?? targetOrg?.premium ?? 0),
      fallbackPremiumParam
    ) as PremiumLevel;
    const planLimits = getPlanLimits(userPremium, isOrg);

    const forwardedFor = req.headers.get("x-forwarded-for");
    const realIp = req.headers.get("x-real-ip");

    const queryParams = new URLSearchParams({
      account_id: accountId,
      ...(isOrg ? { is_org: "true" } : {}),
      premium: String(userPremium),
    });

    try {
      const res = await fetch(`${QUALAI_API_URL}/limits?${queryParams.toString()}`, {
        headers: {
          ...(forwardedFor ? { "X-Forwarded-For": forwardedFor } : {}),
          ...(realIp ? { "X-Real-IP": realIp } : {}),
        },
        cache: "no-store",
      });

      if (res.ok) {
        const data = await res.json();
        const maxLimit = Math.max(Number(data.limit) || 0, planLimits.aiGenerationsPerWeek);
        const used = Number(data.used) || 0;
        const remaining = Math.max(0, maxLimit - used);

        return NextResponse.json({
          ...data,
          tier: planLimits.name,
          premium: userPremium,
          limit: maxLimit,
          used,
          remaining,
          is_org: isOrg,
        });
      }
    } catch {
      // QUALAI backend is down or unreachable, continue with plan limits
    }

    return NextResponse.json({
      account_id: accountId,
      tier: planLimits.name,
      premium: userPremium,
      limit: planLimits.aiGenerationsPerWeek,
      used: 0,
      remaining: planLimits.aiGenerationsPerWeek,
      period: "week",
      is_org: isOrg,
    });
  } catch {
    return NextResponse.json({
      account_id: "guest",
      tier: "Diamond",
      premium: 2,
      limit: 150,
      used: 0,
      remaining: 150,
      period: "week",
    });
  }
}
