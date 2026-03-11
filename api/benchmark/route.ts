import { NextRequest, NextResponse } from "next/server";
import type { Provider } from "@/lib/types";

interface BenchmarkRequest {
  provider: Provider;
  modelId: string;
  prompt: string;
  systemPrompt?: string;
  apiKey: string;
}

async function callOpenAI(apiKey: string, modelId: string, prompt: string, systemPrompt?: string) {
  const messages: Array<{ role: string; content: string }> = [];
  if (systemPrompt) messages.push({ role: "system", content: systemPrompt });
  messages.push({ role: "user", content: prompt });

  const isO1 = modelId.startsWith("o1") || modelId.startsWith("o3");

  const body: Record<string, unknown> = {
    model: modelId,
    messages: isO1
      ? [{ role: "user", content: systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt }]
      : messages,
    max_completion_tokens: 2048,
  };

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `OpenAI API error: ${res.status}`);
  }

  const data = await res.json();
  return {
    output: data.choices[0]?.message?.content || "",
    inputTokens: data.usage?.prompt_tokens || 0,
    outputTokens: data.usage?.completion_tokens || 0,
  };
}

async function callAnthropic(apiKey: string, modelId: string, prompt: string, systemPrompt?: string) {
  const body: Record<string, unknown> = {
    model: modelId,
    max_tokens: 2048,
    messages: [{ role: "user", content: prompt }],
  };
  if (systemPrompt) body.system = systemPrompt;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Anthropic API error: ${res.status}`);
  }

  const data = await res.json();
  const output = data.content?.map((b: { text?: string }) => b.text || "").join("") || "";
  return {
    output,
    inputTokens: data.usage?.input_tokens || 0,
    outputTokens: data.usage?.output_tokens || 0,
  };
}

async function callGoogle(apiKey: string, modelId: string, prompt: string, systemPrompt?: string) {
  const fullPrompt = systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: fullPrompt }] }],
      generationConfig: { maxOutputTokens: 2048 },
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Google API error: ${res.status}`);
  }

  const data = await res.json();
  const output = data.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text || "").join("") || "";
  const usage = data.usageMetadata || {};
  return {
    output,
    inputTokens: usage.promptTokenCount || 0,
    outputTokens: usage.candidatesTokenCount || 0,
  };
}

async function callGroq(apiKey: string, modelId: string, prompt: string, systemPrompt?: string) {
  const messages: Array<{ role: string; content: string }> = [];
  if (systemPrompt) messages.push({ role: "system", content: systemPrompt });
  messages.push({ role: "user", content: prompt });

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model: modelId, messages, max_tokens: 2048 }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Groq API error: ${res.status}`);
  }

  const data = await res.json();
  return {
    output: data.choices[0]?.message?.content || "",
    inputTokens: data.usage?.prompt_tokens || 0,
    outputTokens: data.usage?.completion_tokens || 0,
  };
}

async function callMistral(apiKey: string, modelId: string, prompt: string, systemPrompt?: string) {
  const messages: Array<{ role: string; content: string }> = [];
  if (systemPrompt) messages.push({ role: "system", content: systemPrompt });
  messages.push({ role: "user", content: prompt });

  const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model: modelId, messages, max_tokens: 2048 }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Mistral API error: ${res.status}`);
  }

  const data = await res.json();
  return {
    output: data.choices[0]?.message?.content || "",
    inputTokens: data.usage?.prompt_tokens || 0,
    outputTokens: data.usage?.completion_tokens || 0,
  };
}

async function callDeepSeek(apiKey: string, modelId: string, prompt: string, systemPrompt?: string) {
  const messages: Array<{ role: string; content: string }> = [];
  if (systemPrompt) messages.push({ role: "system", content: systemPrompt });
  messages.push({ role: "user", content: prompt });

  const res = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model: modelId, messages, max_tokens: 2048 }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `DeepSeek API error: ${res.status}`);
  }

  const data = await res.json();
  return {
    output: data.choices[0]?.message?.content || "",
    inputTokens: data.usage?.prompt_tokens || 0,
    outputTokens: data.usage?.completion_tokens || 0,
  };
}

export async function POST(req: NextRequest) {
  try {
    const body: BenchmarkRequest = await req.json();
    const { provider, modelId, prompt, systemPrompt, apiKey } = body;

    if (!apiKey) {
      return NextResponse.json({ error: "API key is required" }, { status: 400 });
    }

    const startTime = Date.now();
    let result: { output: string; inputTokens: number; outputTokens: number };

    switch (provider) {
      case "openai":
        result = await callOpenAI(apiKey, modelId, prompt, systemPrompt);
        break;
      case "anthropic":
        result = await callAnthropic(apiKey, modelId, prompt, systemPrompt);
        break;
      case "google":
        result = await callGoogle(apiKey, modelId, prompt, systemPrompt);
        break;
      case "groq":
        result = await callGroq(apiKey, modelId, prompt, systemPrompt);
        break;
      case "mistral":
        result = await callMistral(apiKey, modelId, prompt, systemPrompt);
        break;
      case "deepseek":
        result = await callDeepSeek(apiKey, modelId, prompt, systemPrompt);
        break;
      default:
        return NextResponse.json({ error: `Unsupported provider: ${provider}` }, { status: 400 });
    }

    const latencyMs = Date.now() - startTime;

    return NextResponse.json({
      ...result,
      latencyMs,
      totalTokens: result.inputTokens + result.outputTokens,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
