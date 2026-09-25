import { NextRequest, NextResponse } from "next/server";

interface GeneratePayload {
  provider: "openai" | "claude" | "gemini" | "deepseek" | "custom";
  model: string;
  prompt: string;
  systemPrompt?: string;
  apiKey?: string;
  baseUrl?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: GeneratePayload = await req.json();
    const { provider, model, prompt, systemPrompt, apiKey = "", baseUrl } = body;

    if (!prompt || !prompt.trim()) {
      return NextResponse.json({ error: "Промпт не может быть пустым" }, { status: 400 });
    }

    if (!model || !model.trim()) {
      return NextResponse.json({ error: "Не выбрана модель" }, { status: 400 });
    }

    if (provider !== "custom" && !apiKey.trim()) {
      return NextResponse.json({ error: `Отсутствует API ключ для ${provider}` }, { status: 400 });
    }

    if (provider === "openai" || provider === "deepseek") {
      const endpoint =
        provider === "openai"
          ? "https://api.openai.com/v1/chat/completions"
          : "https://api.deepseek.com/chat/completions";

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
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
