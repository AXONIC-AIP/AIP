/**
 * BAD EXAMPLE — EEX module that violates AIP protocol.
 *
 * This file simulates an EEX (Executive Execution) component that
 * directly imports AI SDKs. This is a critical AIP violation:
 * the EEX layer must remain fully deterministic and must never
 * invoke probabilistic intelligence systems.
 *
 * aip-check should flag every import below.
 */

import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { ChatGoogleGenerativeAI } from "@langchain/openai";

const openai = new OpenAI();
const anthropic = new Anthropic();

// EEX must NEVER do this — calling an LLM directly from the execution layer
async function executeIntent(intent: Record<string, unknown>): Promise<string> {
  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{ role: "user", content: JSON.stringify(intent) }],
  });
  return response.choices[0].message.content ?? "";
}

export { executeIntent };
