/**
 * AIP Scanner — Static analysis engine for EI/EEX boundary enforcement.
 *
 * Detects two classes of violations:
 *   1. Forbidden AI SDK imports in EEX-layer code (Rule AIP-CORE)
 *   2. MCP components placed in the EI layer instead of EEX (Rule AIP-V10.2)
 *
 * The EEX layer must remain 100% deterministic — no direct access to
 * probabilistic intelligence systems is permitted. MCP connectivity
 * must be encapsulated within the EEX boundary.
 *
 * @module scanner
 */

import fs from "node:fs";
import path from "node:path";
import { glob } from "glob";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Severity = "CRITICAL" | "ERROR" | "WARNING";

export type RuleId = "AIP-CORE" | "AIP-V10.2";

export interface Violation {
  file: string;
  line: number;
  content: string;
  module: string;
  ruleId: RuleId;
  severity: Severity;
  message: string;
}

export interface ScanResult {
  passed: boolean;
  violations: Violation[];
  filesScanned: number;
  timestamp: string;
}

// ---------------------------------------------------------------------------
// Constants — AI SDK forbidden modules (Rule AIP-CORE)
// ---------------------------------------------------------------------------

/** AI SDK modules that must never appear in EEX-layer code. */
const FORBIDDEN_AI_MODULES: readonly string[] = [
  "openai",
  "@anthropic-ai/sdk",
  "anthropic",
  "@langchain/core",
  "@langchain/openai",
  "langchain",
  "@google/generative-ai",
  "google-generative-ai",
  "cohere-ai",
  "ai",
] as const;

// ---------------------------------------------------------------------------
// Constants — MCP modules (Rule AIP-V10.2)
// ---------------------------------------------------------------------------

/** MCP SDK modules subject to boundary placement rules. */
const MCP_MODULES: readonly string[] = [
  "@modelcontextprotocol/sdk",
  "mcp-sdk",
  "@anthropic-ai/mcp",
] as const;

/** MCP runtime symbols that indicate active MCP usage beyond bare imports. */
const MCP_KEYWORDS: readonly string[] = [
  "McpClient",
  "McpServer",
  "StdioClientTransport",
  "StdioServerTransport",
  "SSEClientTransport",
  "SSEServerTransport",
  "StreamableHTTPClientTransport",
  "StreamableHTTPServerTransport",
  "mcp.connect",
  "mcp.listTools",
  "mcp.callTool",
] as const;

// ---------------------------------------------------------------------------
// Constants — Path classification
// ---------------------------------------------------------------------------

/** Path segments that indicate EI (Intelligence) layer placement. */
const EI_PATH_INDICATORS: readonly string[] = [
  "/ei/",
  "/intelligence/",
  "/intelligent/",
  "/brain/",
  "/reasoning/",
] as const;

/** Path segments that indicate EEX (Execution) layer placement. */
const EEX_PATH_INDICATORS: readonly string[] = [
  "/eex/",
  "/execution/",
  "/executor/",
  "/actuator/",
] as const;

/** File extensions eligible for scanning. */
const TARGET_EXTENSIONS: readonly string[] = [
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
] as const;

/** Directories to always exclude from scanning. */
const EXCLUDED_DIRS: readonly string[] = [
  "node_modules",
  "dist",
  "build",
  ".git",
] as const;

// ---------------------------------------------------------------------------
// Path classification
// ---------------------------------------------------------------------------

type LayerHint = "ei" | "eex" | "unknown";

function classifyLayer(filePath: string): LayerHint {
  const normalized = filePath.toLowerCase().replace(/\\/g, "/");
  if (EI_PATH_INDICATORS.some((seg) => normalized.includes(seg))) return "ei";
  if (EEX_PATH_INDICATORS.some((seg) => normalized.includes(seg))) return "eex";
  return "unknown";
}

// ---------------------------------------------------------------------------
// Pattern construction
// ---------------------------------------------------------------------------

function buildImportPattern(modules: readonly string[]): RegExp {
  const escaped = modules.map((m) =>
    m.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  );
  const group = escaped.join("|");

  const pattern = [
    `(?:import\\s+.*?from\\s+["'](?:${group})(?:/[^"']*)?["'])`,
    `(?:import\\s+["'](?:${group})(?:/[^"']*)?["'])`,
    `(?:require\\s*\\(\\s*["'](?:${group})(?:/[^"']*)?["']\\s*\\))`,
    `(?:import\\s*\\(\\s*["'](?:${group})(?:/[^"']*)?["']\\s*\\))`,
  ].join("|");

  return new RegExp(pattern);
}

function buildKeywordPattern(keywords: readonly string[]): RegExp {
  const escaped = keywords.map((k) =>
    k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  );
  return new RegExp(`\\b(?:new\\s+)?(?:${escaped.join("|")})\\b`);
}

// ---------------------------------------------------------------------------
// Violation factories
// ---------------------------------------------------------------------------

function createAiViolation(
  file: string,
  line: number,
  content: string,
  detectedModule: string,
): Violation {
  return {
    file,
    line,
    content,
    module: detectedModule,
    ruleId: "AIP-CORE",
    severity: "ERROR",
    message:
      "Forbidden AI SDK import detected. EEX layer must not import probabilistic intelligence modules.",
  };
}

function createMcpViolation(
  file: string,
  line: number,
  content: string,
  detectedModule: string,
  layer: LayerHint,
): Violation {
  const severity: Severity = layer === "ei" ? "CRITICAL" : "ERROR";
  const locationDetail =
    layer === "ei"
      ? "MCP components detected in Intelligence Layer (EI)."
      : "MCP components detected outside a recognized EEX directory.";

  return {
    file,
    line,
    content,
    module: detectedModule,
    ruleId: "AIP-V10.2",
    severity,
    message:
      `MCP Boundary Violation: ${locationDetail} ` +
      "MCP MUST be encapsulated within the Execution Layer (EEX). " +
      "See AIP Specification Section 10.3.",
  };
}

// ---------------------------------------------------------------------------
// Core scanning logic
// ---------------------------------------------------------------------------

function scanFile(
  filePath: string,
  aiPattern: RegExp,
  mcpImportPattern: RegExp,
  mcpKeywordPattern: RegExp,
): Violation[] {
  const violations: Violation[] = [];
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n");
  const layer = classifyLayer(filePath);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;
    const trimmed = line.trim();

    // --- Rule AIP-CORE: Forbidden AI SDK imports ---
    if (aiPattern.test(line)) {
      const detectedModule =
        FORBIDDEN_AI_MODULES.find((m) => line.includes(m)) ?? "unknown";
      violations.push(createAiViolation(filePath, lineNum, trimmed, detectedModule));
      continue;
    }

    // --- Rule AIP-V10.2: MCP boundary placement ---
    const mcpImportMatch = mcpImportPattern.test(line);
    const mcpKeywordMatch = mcpKeywordPattern.test(line);

    if (mcpImportMatch || mcpKeywordMatch) {
      // If the file is inside a recognized EEX directory, MCP usage is compliant.
      if (layer === "eex") continue;

      const detectedModule = mcpImportMatch
        ? (MCP_MODULES.find((m) => line.includes(m)) ?? "MCP SDK")
        : (MCP_KEYWORDS.find((k) => line.includes(k)) ?? "MCP API");

      violations.push(
        createMcpViolation(filePath, lineNum, trimmed, detectedModule, layer),
      );
    }
  }

  return violations;
}

/**
 * Resolves the list of scannable files under the target directory.
 */
async function resolveFiles(targetDir: string): Promise<string[]> {
  const extPattern =
    TARGET_EXTENSIONS.length === 1
      ? `*${TARGET_EXTENSIONS[0]}`
      : `*{${TARGET_EXTENSIONS.join(",")}}`;

  const ignorePatterns = EXCLUDED_DIRS.map((d) => `**/${d}/**`);

  const files = await glob(`**/${extPattern}`, {
    cwd: targetDir,
    absolute: true,
    ignore: ignorePatterns,
  });

  return files.sort();
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Scans the given directory for AIP boundary violations.
 *
 * Checks enforced:
 *   - AIP-CORE:  AI SDK imports forbidden in EEX-layer code.
 *   - AIP-V10.2: MCP components must reside within the EEX boundary.
 *
 * @param targetDir - Absolute or relative path to the directory to scan.
 * @returns A structured scan result with all detected violations.
 */
export async function scan(targetDir: string): Promise<ScanResult> {
  const resolvedDir = path.resolve(targetDir);

  if (!fs.existsSync(resolvedDir)) {
    throw new Error(`Target directory does not exist: ${resolvedDir}`);
  }

  const aiPattern = buildImportPattern(FORBIDDEN_AI_MODULES);
  const mcpImportPattern = buildImportPattern(MCP_MODULES);
  const mcpKeywordPattern = buildKeywordPattern(MCP_KEYWORDS);
  const files = await resolveFiles(resolvedDir);
  const violations: Violation[] = [];

  for (const file of files) {
    const fileViolations = scanFile(file, aiPattern, mcpImportPattern, mcpKeywordPattern);
    violations.push(...fileViolations);
  }

  return {
    passed: violations.length === 0,
    violations,
    filesScanned: files.length,
    timestamp: new Date().toISOString(),
  };
}

export {
  FORBIDDEN_AI_MODULES,
  MCP_MODULES,
  MCP_KEYWORDS,
  TARGET_EXTENSIONS,
  classifyLayer,
};
