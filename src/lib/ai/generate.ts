import { AiProviderId, GenerateTextOptions } from "@/config/types/ai.types";
import { generateLoremIpsum } from "./lorem";

export type { GenerateTextOptions };

export async function generateAiText(options: GenerateTextOptions): Promise<string> {
  const { provider, model, prompt, systemPrompt, apiKey = "", baseUrl, workspaceId, isOrg, signal } = options;

  if (provider === "mock") {
    await new Promise((resolve) => setTimeout(resolve, 150));
    if (signal?.aborted) {
      const err = new Error("Aborted");
      err.name = "AbortError";
      throw err;
    }
    const words = parseInt(prompt.trim(), 10) || 100;
    const withMarkdown = model !== "lorem-plain";
    return generateLoremIpsum(words, withMarkdown);
  }

  const isLocalCustom =
    (provider === "custom" || provider.startsWith("custom") || Boolean(baseUrl)) &&
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
      signal,
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
    signal,
    body: JSON.stringify({
      provider,
      model,
      prompt,
      systemPrompt,
      apiKey,
      baseUrl,
      workspaceId,
      isOrg,
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.error || `Ошибка генерации (${res.status})`);
  }

  return data.text ?? "";
}
