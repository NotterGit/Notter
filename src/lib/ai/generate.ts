import { AiProviderId } from "@/config/types/ai.types";

export interface GenerateTextOptions {
  provider: AiProviderId;
  model: string;
  prompt: string;
  systemPrompt?: string;
  apiKey?: string;
  baseUrl?: string;
}

export async function generateAiText(options: GenerateTextOptions): Promise<string> {
  const { provider, model, prompt, systemPrompt, apiKey = "", baseUrl } = options;

  const isLocalCustom =
    provider === "custom" &&
    baseUrl &&
    (baseUrl.includes("localhost") || baseUrl.includes("127.0.0.1"));

  if (isLocalCustom) {
    const targetBase = baseUrl.trim() || "http://localhost:11434/v1";
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
      throw new Error(errorData?.error?.message || `Ошибка локального агента (${res.status})`);
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content ?? "";
  }

  const res = await fetch("/api/ai/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      provider,
      model,
      prompt,
      systemPrompt,
      apiKey,
      baseUrl,
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.error || `Ошибка генерации (${res.status})`);
  }

  return data.text ?? "";
}
