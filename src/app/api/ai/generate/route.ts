import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

const QUALAI_API_URL = (process.env.QUALAI_API_URL || "http://localhost:8010").replace(/\/+$/, "");

interface GeneratePayload {
  provider: "openai" | "claude" | "gemini" | "deepseek" | "qwen" | "openrouter" | "qualai" | "custom";
  model: string;
  prompt: string;
  systemPrompt?: string;
  apiKey?: string;
  baseUrl?: string;
  workspaceId?: string;
  isOrg?: boolean;
}

export async function POST(req: NextRequest) {
  try {
    const { userId, orgId } = await auth();
    const body: GeneratePayload = await req.json();
    const { provider, model, prompt, systemPrompt, apiKey = "", baseUrl, workspaceId, isOrg: payloadIsOrg } = body;

    const accountId = workspaceId || orgId || userId || "guest";
    const isOrg = Boolean(
      (workspaceId && workspaceId.startsWith("org_")) ||
      (!workspaceId && orgId) ||
      payloadIsOrg
    );

    if (!prompt || !prompt.trim()) {
      return NextResponse.json({ error: "Промпт не может быть пустым" }, { status: 400 });
    }

    if (!model || !model.trim()) {
      return NextResponse.json({ error: "Не выбрана модель" }, { status: 400 });
    }

    if (provider !== "custom" && provider !== "qualai" && !apiKey.trim()) {
      return NextResponse.json({ error: `Отсутствует API ключ для ${provider}` }, { status: 400 });
    }

    if (
      provider === "openai" ||
      provider === "deepseek" ||
      provider === "qwen" ||
      provider === "openrouter"
    ) {
      const endpoints: Record<string, string> = {
        openai: "https://api.openai.com/v1/chat/completions",
        deepseek: "https://api.deepseek.com/chat/completions",
        qwen: "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
        openrouter: "https://openrouter.ai/api/v1/chat/completions",
      };
      const endpoint = endpoints[provider];

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      };
      if (provider === "openrouter") {
        headers["HTTP-Referer"] = "https://notter.app";
        headers["X-Title"] = "Notter";
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify({
          model,
          messages: [
            ...(systemPrompt ? [{ role: "system", content: systemPrompt }] : []),
            { role: "user", content: prompt },
          ],
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        const errMsg = errorData?.error?.message || `Ошибка API ${provider} (${res.status})`;
        return NextResponse.json({ error: errMsg }, { status: res.status });
      }

      const data = await res.json();
      const text = data.choices?.[0]?.message?.content ?? "";
      return NextResponse.json({ text });
    }

    if (provider === "claude") {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model,
          max_tokens: 4096,
          ...(systemPrompt ? { system: systemPrompt } : {}),
          messages: [{ role: "user", content: prompt }],
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        const errMsg = errorData?.error?.message || `Ошибка API Claude (${res.status})`;
        return NextResponse.json({ error: errMsg }, { status: res.status });
      }

      const data = await res.json();
      const text = data.content?.[0]?.text ?? "";
      return NextResponse.json({ text });
    }

    if (provider === "gemini") {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...(systemPrompt
            ? {
                systemInstruction: {
                  parts: [{ text: systemPrompt }],
                },
              }
            : {}),
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        const errMsg = errorData?.error?.message || `Ошибка API Gemini (${res.status})`;
        return NextResponse.json({ error: errMsg }, { status: res.status });
      }

      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
      return NextResponse.json({ text });
    }

    if (provider === "qualai") {
      const forwardedFor = req.headers.get("x-forwarded-for");
      const realIp = req.headers.get("x-real-ip");

      const res = await fetch(`${QUALAI_API_URL}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(forwardedFor ? { "X-Forwarded-For": forwardedFor } : {}),
          ...(realIp ? { "X-Real-IP": realIp } : {}),
        },
        signal: req.signal,
        body: JSON.stringify({
          account_id: accountId,
          is_org: isOrg,
          session_id: crypto.randomUUID(),
          model_id: model,
          message: prompt,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        const errMsg = errorData?.detail || `Ошибка API QualAI (${res.status})`;
        return NextResponse.json({ error: errMsg }, { status: res.status });
      }

      const data = await res.json();
      return NextResponse.json({ text: data.response ?? "" });
    }

    if (provider === "custom") {
      const targetBase = baseUrl?.trim() || "http://localhost:11434/v1";
      const endpoint = `${targetBase.replace(/\/+$/, "")}/chat/completions`;

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (apiKey.trim()) {
        headers["Authorization"] = `Bearer ${apiKey.trim()}`;
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify({
          model,
          messages: [
            ...(systemPrompt ? [{ role: "system", content: systemPrompt }] : []),
            { role: "user", content: prompt },
          ],
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        const errMsg = errorData?.error?.message || `Ошибка Custom API (${res.status})`;
        return NextResponse.json({ error: errMsg }, { status: res.status });
      }

      const data = await res.json();
      const text = data.choices?.[0]?.message?.content ?? "";
      return NextResponse.json({ text });
    }

    return NextResponse.json({ error: "Неизвестный провайдер" }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Не удалось сгенерировать текст";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
