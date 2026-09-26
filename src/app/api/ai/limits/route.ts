import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

const QUALAI_API_URL = (process.env.QUALAI_API_URL || "http://localhost:8010").replace(/\/+$/, "");

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    const accountId = userId || "guest";
    const forwardedFor = req.headers.get("x-forwarded-for");
    const realIp = req.headers.get("x-real-ip");

    const res = await fetch(`${QUALAI_API_URL}/limits?account_id=${encodeURIComponent(accountId)}`, {
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
      });
    }

    const data = await res.json();
    return NextResponse.json(data);
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
