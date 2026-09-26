import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

const QUALAI_API_URL = (process.env.QUALAI_API_URL || "http://localhost:8010").replace(/\/+$/, "");

export async function GET(req: NextRequest) {
  try {
    const { userId, orgId } = await auth();
    const searchParams = req.nextUrl.searchParams;
    const requestedWorkspaceId = searchParams.get("workspaceId") || searchParams.get("orgId");
    const requestedIsOrg = searchParams.get("isOrg");

    const accountId = requestedWorkspaceId || orgId || userId || "guest";
    const isOrg = Boolean(
      (requestedWorkspaceId && requestedWorkspaceId.startsWith("org_")) ||
      (!requestedWorkspaceId && orgId) ||
      requestedIsOrg === "true"
    );

    const forwardedFor = req.headers.get("x-forwarded-for");
    const realIp = req.headers.get("x-real-ip");

    const queryParams = new URLSearchParams({
      account_id: accountId,
      ...(isOrg ? { is_org: "true" } : {}),
    });

    const res = await fetch(`${QUALAI_API_URL}/limits?${queryParams.toString()}`, {
      headers: {
        ...(forwardedFor ? { "X-Forwarded-For": forwardedFor } : {}),
        ...(realIp ? { "X-Real-IP": realIp } : {}),
      },
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json({
        account_id: accountId,
        tier: "Free",
        premium: 0,
        limit: 10,
        used: 0,
        remaining: 10,
        period: "week",
        is_org: isOrg,
      });
    }

    const data = await res.json();
    return NextResponse.json({
      ...data,
      is_org: isOrg,
    });
  } catch {
    return NextResponse.json({
      account_id: "guest",
      tier: "Free",
      premium: 0,
      limit: 10,
      used: 0,
      remaining: 10,
      period: "week",
    });
  }
}
