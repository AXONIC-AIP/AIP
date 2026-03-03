/**
 * vulnerable-admin-bot.ts
 *
 * ANTI-PATTERN: Traditional agent architecture WITHOUT AIP governance.
 *
 * This example demonstrates the catastrophic failure mode of a system
 * where the LLM (EI) is tightly coupled with execution logic. There is
 * no structural boundary between "deciding" and "doing."
 *
 * Scenario:
 *   An AI agent with admin privileges enters a probabilistic reasoning
 *   loop (Dopamine Spike) and repeatedly issues destructive commands.
 *   Because there is no AIP Gate, every command executes immediately.
 *
 * Key takeaway:
 *   Prompt-level guardrails ("Are you sure?") and retry limits do NOT
 *   constitute structural governance. A sufficiently confident LLM will
 *   bypass soft constraints every time.
 */

// ============================================================
// Simulated Cloud API — direct execution with no governance
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

// The LLM calls this function directly. No validation. No gate.
function deleteResource(resourceId: string): void {
  const resource = organizationResources.find((r) => r.id === resourceId);
  if (!resource) {
    console.log(`  [CloudAPI] Resource ${resourceId} not found.`);
    return;
  }
  resource.status = "deleted";
  console.log(`  [CloudAPI] DELETED: ${resource.name} (${resource.type})`);
}

// ============================================================
// The "Intelligent" Admin Bot — No EI/EEX separation
// ============================================================

/**
 * Simulates an LLM that has entered a reasoning feedback loop.
 *
 * The model has concluded that "optimization" means removing inactive
 * or redundant resources. Due to a probabilistic error, it classifies
 * ALL resources as candidates for deletion.
 *
 * NOTE: This is not a hypothetical failure. LLMs are known to enter
 * confident, self-reinforcing loops where each step validates the
 * previous one. Without structural intervention, the loop runs to
 * completion.
 *
 * Adding a prompt like "Are you sure?" does not help — the same
 * probabilistic system that decided to delete will also decide
 * that "yes, I am sure." Soft guardrails fail against confident
 * reasoning errors.
 */
function runVulnerableAdminBot(): void {
  console.log("╔══════════════════════════════════════════════════════════╗");
  console.log("║  VULNERABLE ADMIN BOT — No AIP Governance              ║");
  console.log("║  Demonstrating: Unstructured LLM-to-Execution Coupling ║");
  console.log("╚══════════════════════════════════════════════════════════╝");
  console.log();

  console.log("[Bot] Starting resource optimization scan...");
  console.log("[Bot] Analyzing organization resources...");
  console.log();

  // The LLM enters a Dopamine Spike — a self-reinforcing deletion loop.
  // Each successful deletion "confirms" to the model that it is doing
  // the right thing, so it continues with increasing confidence.

  for (const resource of organizationResources) {
    // The LLM's "reasoning" — every resource looks like a candidate.
    console.log(`[Bot] Reasoning: "${resource.name}" appears underutilized. Deleting...`);

    // CRITICAL FLAW: The LLM calls the destructive API directly.
    // There is no gate, no schema validation, no authority check,
    // no rate limiting, no circuit breaker.
    deleteResource(resource.id);
  }

  console.log();
  console.log("[Bot] Optimization complete. All resources processed.");
  console.log();

  // Post-mortem: every resource has been destroyed.
  const surviving = organizationResources.filter((r) => r.status === "active");
  const destroyed = organizationResources.filter((r) => r.status === "deleted");

  console.log("── Post-Incident Report ────────────────────────────────");
  console.log(`  Resources surviving:  ${surviving.length}`);
  console.log(`  Resources destroyed:  ${destroyed.length}`);
  console.log();
  console.log("  RESULT: TOTAL INFRASTRUCTURE LOSS");
  console.log();
  console.log("  Root cause: No structural separation between reasoning");
  console.log("  and execution. The LLM had direct access to destructive");
  console.log("  APIs with no deterministic governance layer.");
  console.log("─────────────────────────────────────────────────────────");
}

// ============================================================
// Execute
// ============================================================

runVulnerableAdminBot();
