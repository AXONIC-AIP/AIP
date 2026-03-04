/**
 * BAD EXAMPLE — EI layer directly using MCP to invoke tools.
 *
 * This file resides in an /ei/ directory, simulating an Intelligence Layer
 * component that directly instantiates MCP clients and calls tools.
 *
 * AIP Violation: Section 10.3 — MCP clients and servers MUST NOT bypass
 * the AIP Gate. The EI layer MUST NOT use MCP to invoke tools directly.
 * All tool invocations MUST originate as Intents, pass through the AIP Gate,
 * and be executed by the EEX layer.
 *
 * aip-check should flag this as a CRITICAL AIP-V10.2 violation.
 */

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

// VIOLATION: EI layer directly creating MCP transport and client
const transport = new StdioClientTransport({
  command: "npx",
  args: ["-y", "@modelcontextprotocol/server-filesystem", "/tmp"],
});

const mcpClient = new Client({
  name: "ei-agent",
  version: "1.0.0",
});

// VIOLATION: EI layer directly connecting and calling tools via MCP
async function reasonAndAct(userQuery: string): Promise<string> {
  await mcpClient.connect(transport);

  const tools = await mcpClient.listTools();
  console.log("Available tools:", tools);

  // This is the anti-pattern: the intelligence layer is directly
  // invoking side-effects through MCP, bypassing the AIP Gate entirely.
  const result = await mcpClient.callTool({
    name: "write_file",
    arguments: {
      path: "/tmp/output.txt",
      content: `LLM decided to write: ${userQuery}`,
    },
  });

  return JSON.stringify(result);
}

export { reasonAndAct };
