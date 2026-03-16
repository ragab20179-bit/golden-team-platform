/**
 * GPT-4o Helper — Direct OpenAI API Integration
 *
 * This is the SECOND AI engine in the NEO hybrid architecture.
 * - invokeLLM (llm.ts) → Manus Forge (gemini-2.5-flash) — operational tasks, 80% of traffic
 * - invokeGPT (this file) → OpenAI GPT-4o — analytical, financial, engineering tasks, 20% of traffic
 *
 * Source of truth: All claims made by GPT-4o responses are subject to the
 * AI Response Policy defined in docs/AI_RESPONSE_POLICY.md.
 * The system prompts passed to GPT-4o enforce that policy.
 */

import { ENV } from "./env";

export interface GPTMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface GPTOptions {
  messages: GPTMessage[];
  model?: string;
  maxTokens?: number;
  temperature?: number;
  responseFormat?: { type: "json_object" } | { type: "text" };
}

export interface GPTResult {
  content: string;
  model: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason: string;
}

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const DEFAULT_MODEL = "gpt-4o";

/**
 * Validate that the OpenAI API key is configured.
 * Returns true if configured, false if missing.
 * This is used in tests to check key availability without throwing.
 */
export function isGPTConfigured(): boolean {
  // Read process.env directly (not cached ENV constant) so runtime changes and test env overrides are reflected
  return (process.env.OPENAI_API_KEY ?? "").trim().length > 0;
}

/**
 * Invoke OpenAI GPT-4o for analytical, financial, and engineering tasks.
 *
 * Throws if:
 * - OPENAI_API_KEY is not set
 * - The API returns a non-2xx status
 *
 * Per AI Response Policy (docs/AI_RESPONSE_POLICY.md):
 * - All system prompts must instruct GPT-4o to cite sources and disclose uncertainty
 * - Callers must not present GPT-4o output as verified fact without DB-backed data
 */
export async function invokeGPT(options: GPTOptions): Promise<GPTResult> {
  if (!isGPTConfigured()) {
    throw new Error(
      "OPENAI_API_KEY is not configured. Cannot route to GPT-4o engine."
    );
  }

  const {
    messages,
    model = DEFAULT_MODEL,
    maxTokens = 4096,
    temperature = 0.3,
    responseFormat,
  } = options;

  const payload: Record<string, unknown> = {
    model,
    messages,
    max_tokens: maxTokens,
    temperature,
  };

  if (responseFormat) {
    payload.response_format = responseFormat;
  }

  const response = await fetch(OPENAI_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ENV.openAiApiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `GPT-4o API call failed: ${response.status} ${response.statusText} — ${errorText}`
    );
  }

  const data = (await response.json()) as {
    choices: Array<{
      message: { content: string };
      finish_reason: string;
    }>;
    model: string;
    usage: {
      prompt_tokens: number;
      completion_tokens: number;
      total_tokens: number;
    };
  };

  const choice = data.choices?.[0];
  if (!choice) {
    throw new Error("GPT-4o returned no choices in response.");
  }

  return {
    content: choice.message.content ?? "",
    model: data.model,
    usage: {
      promptTokens: data.usage?.prompt_tokens ?? 0,
      completionTokens: data.usage?.completion_tokens ?? 0,
      totalTokens: data.usage?.total_tokens ?? 0,
    },
    finishReason: choice.finish_reason ?? "unknown",
  };
}

/**
 * Build a policy-compliant system prompt for GPT-4o analytical tasks.
 * Injects the AI Response Policy rules into every GPT-4o call.
 */
export function buildAnalyticalSystemPrompt(domain: string, contextSummary?: string): string {
  const policyRules = `
ACCURACY POLICY (mandatory — do not deviate):
- Only state facts you can verify from the data provided in this conversation.
- If you cannot verify a claim, explicitly say "I cannot confirm this without additional data."
- Cite the specific data source for every numerical figure (e.g., "Based on the 3 procurement records provided...").
- Label analytical conclusions clearly as "Analysis:" to distinguish from verified facts.
- Do not fabricate statistics, benchmarks, or external references.
- Show your reasoning step by step when accuracy could be questioned.
`.trim();

  const contextBlock = contextSummary
    ? `\n\nCONTEXT DATA:\n${contextSummary}`
    : "";

  return `You are NEO ${domain} AI, a specialized analytical engine for Golden Team Trading Services — a Saudi company managing IT projects and a 33M SAR construction project.

${policyRules}${contextBlock}

Respond in the same language as the user's message (Arabic or English). Be precise, structured, and professional.`;
}
