/**
 * AIP Scanner — Static analysis engine for EI/EEX boundary enforcement.
 *
 * Detects forbidden AI SDK imports within EEX (Executive Execution) modules.
 * The EEX layer must remain 100% deterministic — no direct access to
 * probabilistic intelligence systems is permitted.
 *
 * @module scanner
 */

import fs from "node:fs";
import path from "node:path";
import { glob } from "glob";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Violation {
  file: string;
  line: number;
  content: string;
  module: string;
}

export interface ScanResult {
  passed: boolean;
  violations: Violation[];
  filesScanned: number;
  timestamp: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** AI SDK modules that must never appear in EEX-layer code. */
const FORBIDDEN_MODULES: readonly string[] = [
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
// Pattern construction
// ---------------------------------------------------------------------------

/**
 * Builds a regex that matches both ES module `import` and CommonJS `require`
 * statements for any of the forbidden modules.
 *
 * Matched patterns:
 *   import ... from "openai"
 *   import "openai"
 *   require("openai")
 *   import("openai")        // dynamic import
 */
function buildForbiddenImportPattern(): RegExp {
  const escaped = FORBIDDEN_MODULES.map((m) =>
    m.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  );
  const group = escaped.join("|");

  // Match: import ... from "<module>" | import "<module>" | require("<module>") | import("<module>")
  const pattern = [
    `(?:import\\s+.*?from\\s+["'](?:${group})(?:/[^"']*)?["'])`,
    `(?:import\\s+["'](?:${group})(?:/[^"']*)?["'])`,
    `(?:require\\s*\\(\\s*["'](?:${group})(?:/[^"']*)?["']\\s*\\))`,
    `(?:import\\s*\\(\\s*["'](?:${group})(?:/[^"']*)?["']\\s*\\))`,
  ].join("|");

  return new RegExp(pattern);
}

// ---------------------------------------------------------------------------
// Core scanning logic
// ---------------------------------------------------------------------------

/**
 * Scans a single file for forbidden AI SDK imports.
 */
function scanFile(filePath: string, pattern: RegExp): Violation[] {
  const violations: Violation[] = [];
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(pattern);
    if (match) {
      const detectedModule = FORBIDDEN_MODULES.find((m) => line.includes(m));
      violations.push({
        file: filePath,
        line: i + 1,
        content: line.trim(),
        module: detectedModule ?? "unknown",
      });
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
 * Scans the given directory for EI/EEX boundary violations.
 *
 * @param targetDir - Absolute or relative path to the directory to scan.
 * @returns A structured scan result with all detected violations.
 */
export async function scan(targetDir: string): Promise<ScanResult> {
  const resolvedDir = path.resolve(targetDir);

  if (!fs.existsSync(resolvedDir)) {
    throw new Error(`Target directory does not exist: ${resolvedDir}`);
  }

  const pattern = buildForbiddenImportPattern();
  const files = await resolveFiles(resolvedDir);
  const violations: Violation[] = [];

  for (const file of files) {
    const fileViolations = scanFile(file, pattern);
    violations.push(...fileViolations);
  }

  return {
    passed: violations.length === 0,
    violations,
    filesScanned: files.length,
    timestamp: new Date().toISOString(),
  };
}

export { FORBIDDEN_MODULES, TARGET_EXTENSIONS };
