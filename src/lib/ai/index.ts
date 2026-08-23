import { createAiClient, type ChatMessage } from "./client";
import { SYSTEM_PROMPT, buildKnowledgePrompt } from "./knowledge";

/**
 * The Ramat AI runtime.
 *
 * Composes the system prompt (with the Echo Systems knowledge base),
 * manages conversation history, and streams responses from Longcat.
 */

let _client: ReturnType<typeof createAiClient> | null = null;

function getClient() {
  if (_client) return _client;
  const baseUrl = process.env.LONGCAT_BASE_URL;
  const apiKey = process.env.LONGCAT_API_KEY;
  const model = process.env.LONGCAT_MODEL ?? "LongCat-2.0";

  if (!baseUrl || !apiKey) {
    throw new Error(
      "Longcat is not configured. Set LONGCAT_BASE_URL and LONGCAT_API_KEY in your environment."
    );
  }
  _client = createAiClient({ baseUrl, apiKey, model });
  return _client;
}

export interface RamatOptions {
  /** Past messages in this conversation (user + assistant). */
  history: ChatMessage[];
  /** Optional visitor context appended to the system prompt. */
  visitorContext?: {
    name?: string | null;
    email?: string | null;
    page?: string | null;
  };
}

export function buildSystemMessage(visitorContext?: RamatOptions["visitorContext"]): ChatMessage {
  let prompt = SYSTEM_PROMPT + "\n\n" + buildKnowledgePrompt();
  if (visitorContext?.name || visitorContext?.email || visitorContext?.page) {
    prompt += `\n\n## Current visitor context\n`;
    if (visitorContext.name) prompt += `- Name: ${visitorContext.name}\n`;
    if (visitorContext.email) prompt += `- Email: ${visitorContext.email}\n`;
    if (visitorContext.page) prompt += `- Viewing page: ${visitorContext.page}\n`;
  }
  return { role: "system", content: prompt };
}

/** Non-streaming single response (used by scripts / fallback). */
export async function askRamat(input: RamatOptions): Promise<string> {
  const system = buildSystemMessage(input.visitorContext);
  const messages = [system, ...input.history];
  return getClient().chat(messages);
}

export { getClient as getAiClient };
