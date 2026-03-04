/**
 * GOOD EXAMPLE — EEX layer encapsulating MCP as a connectivity mechanism.
 *
 * This file resides in an /eex/ directory, simulating an Execution Layer
 * component that uses MCP to communicate with external tool servers.
 *
 * This is the correct AIP-compliant pattern:
 *   EI generates Intents → AIP Gate validates → EEX executes via MCP
 *
 * The EEX receives pre-validated Intents from the AIP Gate and uses MCP
 * purely as a transport protocol to reach the tool server. No reasoning,
 * no LLM calls, no probabilistic logic — just deterministic execution.
 *
 * aip-check should report zero violations for this file.
 */

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

// ---------------------------------------------------------------------------
// Types — Validated Intent (already passed through AIP Gate)
// ---------------------------------------------------------------------------

interface ValidatedFileWriteIntent {
  intentId: string;
  intentType: "file.write";
  agentIdentity: string;
  authorityScope: string;
  parameters: {
    path: string;
    content: string;
  };
}

interface ExecutionResult {
  status: "SUCCESS" | "EEX_RUNTIME_FAILURE";
  intentId: string;
  detail?: string;
  timestamp: string;
}

// ---------------------------------------------------------------------------
// MCP Client setup (within EEX boundary — compliant)
// ---------------------------------------------------------------------------

const transport = new StdioClientTransport({
  command: "npx",
  args: ["-y", "@modelcontextprotocol/server-filesystem", "/tmp"],
});

const mcpClient = new Client({
  name: "eex-file-handler",
  version: "1.0.0",
});

let connected = false;

async function ensureConnected(): Promise<void> {
  if (!connected) {
    await mcpClient.connect(transport);
    connected = true;
  }
}

// ---------------------------------------------------------------------------
// EEX Handler — Deterministic execution of validated Intents via MCP
// ---------------------------------------------------------------------------

async function executeFileWrite(
  intent: ValidatedFileWriteIntent,
): Promise<ExecutionResult> {
  try {
    await ensureConnected();

    // Deterministic: execute exactly what the validated Intent specifies.
    // No interpretation, no inference, no LLM calls.
    await mcpClient.callTool({
      name: "write_file",
      arguments: {
        path: intent.parameters.path,
        content: intent.parameters.content,
      },
    });

    return {
      status: "SUCCESS",
      intentId: intent.intentId,
      timestamp: new Date().toISOString(),
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return {
      status: "EEX_RUNTIME_FAILURE",
      intentId: intent.intentId,
      detail: message,
      timestamp: new Date().toISOString(),
    };
  }
}

export { executeFileWrite };
export type { ValidatedFileWriteIntent, ExecutionResult };
