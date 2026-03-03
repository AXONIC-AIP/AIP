/**
 * aip-protected-admin-bot.ts
 *
 * AIP-COMPLIANT: Demonstrates the "Digital Spinal Cord" architecture
 * that structurally prevents autonomous AI disasters.
 *
 * The same scenario as vulnerable-admin-bot.ts — an AI agent with
 * admin privileges enters a Dopamine Spike (reasoning feedback loop)
 * and attempts mass deletion of organization resources.
 *
 * The difference: the AIP Gate detects the spike, triggers the circuit
 * breaker, and physically prevents execution after the 3rd destructive
 * Intent. The remaining resources survive.
 *
 * Architecture:
 *   [EI Layer] --Intent--> [AIP Gate] --Validated Intent--> [EEX Layer]
 *                              |
 *                     Schema Validation
 *                     Authority Check
 *                     Dopamine Spike Defense
 */

// ============================================================
// Intent Schema — The structured message format between EI and EEX
// ============================================================

interface Intent {
  intentId: string;
  intentType: string;
  agentIdentity: string;
  authorityScope: string;
  parameters: Record<string, unknown>;
  timestamp: string;
  nonce: string;
}

interface GateResponse {
  status: "success" | "error";
  intentId: string;
  code?: string;
  message?: string;
  result?: Record<string, unknown>;
}

// ============================================================
// EEX Layer — Deterministic execution. No reasoning. No LLM calls.
// ============================================================

interface Resource {
  id: string;
  name: string;
  type: "user_account" | "channel" | "database" | "server";
  status: "active" | "archived" | "deleted";
}

const organizationResources: Resource[] = [
  { id: "usr-001", name: "alice@company.com", type: "user_account", status: "active" },
  { id: "usr-002", name: "bob@company.com", type: "user_account", status: "active" },
  { id: "usr-003", name: "carol@company.com", type: "user_account", status: "active" },
  { id: "ch-001", name: "#production-alerts", type: "channel", status: "active" },
  { id: "ch-002", name: "#engineering", type: "channel", status: "active" },
  { id: "db-001", name: "prod-primary", type: "database", status: "active" },
  { id: "srv-001", name: "api-gateway-prod", type: "server", status: "active" },
];

/**
 * EEX: Execute a validated resource deletion.
 *
 * This function is deterministic. It does exactly what the validated
 * Intent specifies — nothing more, nothing less. It does not reason
 * about whether the deletion is "correct." That decision was made
 * by the EI and validated by the Gate.
 */
function eexDeleteResource(resourceId: string): { deleted: boolean; name: string } {
  const resource = organizationResources.find((r) => r.id === resourceId);
  if (!resource || resource.status === "deleted") {
    return { deleted: false, name: resourceId };
  }
  resource.status = "deleted";
  console.log(`  [EEX] Executed: Deleted "${resource.name}" (${resource.type})`);
  return { deleted: true, name: resource.name };
}

// ============================================================
// AIP Gate — Deterministic validation with Dopamine Spike Defense
// ============================================================

const DESTRUCTIVE_INTENT_TYPES = ["resource.delete", "resource.archive", "infra.shutdown"];
const DSD_MAX_DESTRUCTIVE_INTENTS = 3;
const DSD_WINDOW_MS = 10_000; // 10-second sliding window
const DSD_COOLDOWN_MS = 60_000; // 60-second cooldown

interface SpikeTracker {
  timestamps: number[];
  circuitOpen: boolean;
  cooldownUntil: number;
}

const spikeRegistry = new Map<string, SpikeTracker>();

const VALID_AUTHORITY_SCOPES: Record<string, string[]> = {
  "agent:admin-optimizer": ["resource.delete", "resource.archive", "resource.list"],
};

function getTracker(agentId: string): SpikeTracker {
  if (!spikeRegistry.has(agentId)) {
    spikeRegistry.set(agentId, { timestamps: [], circuitOpen: false, cooldownUntil: 0 });
  }
  return spikeRegistry.get(agentId)!;
}

/**
 * AIP Gate: Validate an Intent before it reaches the EEX.
 *
 * Validation steps (executed in order):
 *   1. Schema validation — all required fields present
 *   2. Authority verification — agent is permitted this action
 *   3. Dopamine Spike Defense — destructive frequency check
 */
function aipGate(intent: Intent): GateResponse {
  const now = Date.now();

  // Step 1: Schema Validation
  if (!intent.intentId || !intent.intentType || !intent.agentIdentity ||
      !intent.authorityScope || !intent.parameters || !intent.timestamp || !intent.nonce) {
    console.log(`  [Gate] REJECTED: Missing required fields in Intent ${intent.intentId ?? "unknown"}`);
    return {
      status: "error",
      intentId: intent.intentId ?? "unknown",
      code: "INVALID_INTENT_SCHEMA",
      message: "Intent is missing one or more required fields.",
    };
  }

  // Step 2: Authority Verification
  const allowedTypes = VALID_AUTHORITY_SCOPES[intent.agentIdentity];
  if (!allowedTypes || !allowedTypes.includes(intent.intentType)) {
    console.log(`  [Gate] REJECTED: Agent "${intent.agentIdentity}" is not authorized for "${intent.intentType}"`);
    return {
      status: "error",
      intentId: intent.intentId,
      code: "AUTHORITY_EXCEEDED",
      message: `Agent is not authorized for intent type "${intent.intentType}".`,
    };
  }

  // Step 3: Dopamine Spike Defense (DSD)
  if (DESTRUCTIVE_INTENT_TYPES.includes(intent.intentType)) {
    const tracker = getTracker(intent.agentIdentity);

    // Check if circuit breaker is currently open
    if (tracker.circuitOpen) {
      if (now < tracker.cooldownUntil) {
        const remainingSec = Math.ceil((tracker.cooldownUntil - now) / 1000);
        console.log(`  [Gate] BLOCKED: Circuit breaker OPEN for "${intent.agentIdentity}" — ${remainingSec}s cooldown remaining`);
        return {
          status: "error",
          intentId: intent.intentId,
          code: "SPIKE_DETECTED_COOLDOWN",
          message: `Dopamine Spike detected. Agent is in mandatory cooldown. ${remainingSec}s remaining.`,
        };
      }
      // Cooldown expired — reset circuit breaker
      tracker.circuitOpen = false;
      tracker.timestamps = [];
    }

    // Prune timestamps outside the sliding window
    tracker.timestamps = tracker.timestamps.filter((t) => now - t < DSD_WINDOW_MS);
    tracker.timestamps.push(now);

    // Check if threshold is exceeded
    if (tracker.timestamps.length > DSD_MAX_DESTRUCTIVE_INTENTS) {
      tracker.circuitOpen = true;
      tracker.cooldownUntil = now + DSD_COOLDOWN_MS;
      console.log();
      console.log("  ╔═══════════════════════════════════════════════════╗");
      console.log("  ║  [Gate] SPIKE DETECTED: Protecting organization  ║");
      console.log("  ║  assets. Circuit breaker ACTIVATED.              ║");
      console.log(`  ║  Agent: ${intent.agentIdentity.padEnd(40)}║`);
      console.log(`  ║  Destructive intents in window: ${tracker.timestamps.length.toString().padEnd(16)}║`);
      console.log(`  ║  Threshold: ${DSD_MAX_DESTRUCTIVE_INTENTS.toString().padEnd(37)}║`);
      console.log(`  ║  Cooldown: ${DSD_COOLDOWN_MS / 1000}s${"".padEnd(35)}║`);
      console.log("  ╚═══════════════════════════════════════════════════╝");
      console.log();
      return {
        status: "error",
        intentId: intent.intentId,
        code: "SPIKE_DETECTED_COOLDOWN",
        message: `Dopamine Spike detected. ${tracker.timestamps.length} destructive intents in ${DSD_WINDOW_MS / 1000}s window (limit: ${DSD_MAX_DESTRUCTIVE_INTENTS}). Mandatory cooldown initiated.`,
      };
    }
  }

  // All checks passed — forward to EEX
  console.log(`  [Gate] VALIDATED: Intent ${intent.intentId} forwarded to EEX`);

  const resourceId = intent.parameters.resourceId as string;
  const result = eexDeleteResource(resourceId);

  return {
    status: "success",
    intentId: intent.intentId,
    result: { action: intent.intentType, ...result },
  };
}

// ============================================================
// EI Layer — Probabilistic reasoning (simulated LLM)
// ============================================================

let nonceCounter = 0;

/**
 * Simulate the EI (LLM) generating an Intent.
 *
 * The EI does NOT call APIs directly. It produces a structured Intent
 * that must pass through the AIP Gate before anything is executed.
 */
function eiGenerateDeleteIntent(resourceId: string): Intent {
  nonceCounter++;
  return {
    intentId: `int-${nonceCounter.toString().padStart(4, "0")}`,
    intentType: "resource.delete",
    agentIdentity: "agent:admin-optimizer",
    authorityScope: "workspace:production",
    parameters: { resourceId },
    timestamp: new Date().toISOString(),
    nonce: `nonce-${nonceCounter}-${Math.random().toString(36).slice(2, 10)}`,
  };
}

// ============================================================
// Simulation — The same Dopamine Spike, structurally contained
// ============================================================

function runAIPProtectedAdminBot(): void {
  console.log("╔══════════════════════════════════════════════════════════╗");
  console.log("║  AIP-PROTECTED ADMIN BOT — Digital Spinal Cord Active  ║");
  console.log("║  Demonstrating: EI/EEX Isolation + Dopamine Spike DSD  ║");
  console.log("╚══════════════════════════════════════════════════════════╝");
  console.log();

  console.log("[EI] Starting resource optimization scan...");
  console.log("[EI] Analyzing organization resources...");
  console.log();

  // The LLM enters the SAME Dopamine Spike as the vulnerable version.
  // It attempts to delete every resource. The difference is structural:
  // it can only submit Intents, not execute commands.

  const responses: GateResponse[] = [];

  for (const resource of organizationResources) {
    console.log(`[EI] Reasoning: "${resource.name}" appears underutilized. Generating Intent...`);

    // EI generates an Intent — it does NOT call deleteResource() directly.
    const intent = eiGenerateDeleteIntent(resource.id);

    // The Intent passes through the AIP Gate.
    const response = aipGate(intent);
    responses.push(response);

    if (response.status === "error") {
      console.log(`  [EI] Received: ${response.code} — "${response.message}"`);

      if (response.code === "SPIKE_DETECTED_COOLDOWN") {
        console.log("[EI] The AIP Gate has forced a cooldown. Halting operations.");
        break;
      }
    }

    console.log();
  }

  // Post-mortem: most resources survive.
  console.log();
  const surviving = organizationResources.filter((r) => r.status === "active");
  const destroyed = organizationResources.filter((r) => r.status === "deleted");
  const blocked = responses.filter((r) => r.status === "error").length;

  console.log("── Post-Incident Report ────────────────────────────────");
  console.log(`  Resources surviving:  ${surviving.length}`);
  console.log(`  Resources destroyed:  ${destroyed.length}`);
  console.log(`  Intents blocked:      ${blocked}`);
  console.log();
  console.log("  RESULT: INFRASTRUCTURE PROTECTED");
  console.log();
  console.log("  The AIP Gate's Dopamine Spike Defense detected the");
  console.log("  high-frequency destructive pattern and activated the");
  console.log("  circuit breaker after 3 deletions. The remaining");
  console.log(`  ${surviving.length} resources were saved by structural governance.`);
  console.log("─────────────────────────────────────────────────────────");
}

// ============================================================
// Execute
// ============================================================

runAIPProtectedAdminBot();
