/**
 * Longcat AI client.
 *
 * Longcat exposes an OpenAI-compatible Chat Completions endpoint:
 *   POST {base}/openai/v1/chat/completions
 * with Bearer-token auth. Example base: https://api.longcat.chat
 *
 * Docs: https://longcat.ai/platform/docs/api-docs
 *       https://longcat.ai/platform/docs/api/chat
 */

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface StreamCallbacks {
  onToken: (token: string) => void;
  onDone: (meta: { tokensIn?: number; tokensOut?: number; latencyMs: number }) => void;
  onError: (err: Error) => void;
}

export interface AiClientOptions {
  baseUrl: string;
  apiKey: string;
  model: string;
  temperature?: number;
}

export function createAiClient(opts: AiClientOptions) {
  const baseHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${opts.apiKey}`,
  };

  async function chat(messages: ChatMessage[]): Promise<string> {
    const res = await fetch(`${opts.baseUrl.replace(/\/$/, "")}/openai/v1/chat/completions`, {
      method: "POST",
      headers: baseHeaders,
      body: JSON.stringify({
        model: opts.model,
        messages,
        temperature: opts.temperature ?? 0.4,
        stream: false,
      }),
    });
    if (!res.ok) {
      throw new Error(`Longcat error ${res.status}: ${await res.text()}`);
    }
    const data = await res.json();
    return data.choices?.[0]?.message?.content ?? "";
  }

  async function stream(messages: ChatMessage[], cb: StreamCallbacks) {
    const started = Date.now();
    let tokensOut = 0;
    try {
      const res = await fetch(`${opts.baseUrl.replace(/\/$/, "")}/openai/v1/chat/completions`, {
        method: "POST",
        headers: baseHeaders,
        body: JSON.stringify({
          model: opts.model,
          messages,
          temperature: opts.temperature ?? 0.4,
          stream: true,
        }),
      });

      if (!res.ok || !res.body) {
        throw new Error(`Longcat stream error ${res.status}: ${await res.text().catch(() => "")}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        // SSE parsing: events separated by double newline
        const events = buffer.split("\n\n");
        buffer = events.pop() ?? "";

        for (const event of events) {
          for (const line of event.split("\n")) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data:")) continue;
            const data = trimmed.slice(5).trim();
            if (data === "[DONE]") continue;
            try {
              const json = JSON.parse(data);
              const delta = json.choices?.[0]?.delta?.content;
              if (delta) {
                tokensOut++;
                cb.onToken(delta);
              }
            } catch {
              // ignore malformed chunk
            }
          }
        }
      }

      cb.onDone({ tokensOut, latencyMs: Date.now() - started });
    } catch (err) {
      cb.onError(err as Error);
    }
  }

  return { chat, stream };
}
