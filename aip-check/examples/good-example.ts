/**
 * GOOD EXAMPLE — A compliant EEX module.
 *
 * This file demonstrates a proper EEX (Executive Execution) component
 * that follows AIP protocol. It receives validated Intents and executes
 * them deterministically — no AI SDK imports, no probabilistic reasoning.
 *
 * aip-check should report zero violations for this file.
 */

import fs from "node:fs";
import path from "node:path";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FileWriteIntent {
  type: "FILE_WRITE";
  authority: string;
  payload: {
    filePath: string;
    content: string;
  };
}

interface ExecutionResult {
  status: "SUCCESS" | "REJECTED";
  reason?: string;
  timestamp: string;
}

// ---------------------------------------------------------------------------
// Validation (deterministic, schema-based)
// ---------------------------------------------------------------------------

function validateIntent(intent: FileWriteIntent): string | null {
  if (!intent.type || intent.type !== "FILE_WRITE") {
    return "SCHEMA_VALIDATION_FAILED: Invalid intent type";
  }
  if (!intent.authority) {
    return "AUTHORITY_ERROR: Missing authority field";
  }
  if (!intent.payload?.filePath || !intent.payload?.content) {
    return "SCHEMA_VALIDATION_FAILED: Missing payload fields";
  }
  return null;
}

// ---------------------------------------------------------------------------
// Execution (100% deterministic)
// ---------------------------------------------------------------------------

function executeFileWrite(intent: FileWriteIntent): ExecutionResult {
  const error = validateIntent(intent);
  if (error) {
    return {
      status: "REJECTED",
      reason: error,
      timestamp: new Date().toISOString(),
    };
  }

  const targetPath = path.resolve(intent.payload.filePath);
  fs.writeFileSync(targetPath, intent.payload.content, "utf-8");

  return {
    status: "SUCCESS",
    timestamp: new Date().toISOString(),
  };
}

export { executeFileWrite, validateIntent };
export type { FileWriteIntent, ExecutionResult };
