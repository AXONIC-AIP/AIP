# AIP Compliance Checklist

**Version**: 1.0.0-draft
**Status**: Draft
**Maintained by**: AXONIC Inc.
**Last updated**: 2026-03-03

---

## Introduction

This document defines the formal compliance criteria for the Agentic Interaction Protocol (AIP). Any autonomous system that claims AIP compliance MUST satisfy these criteria. There are no partial passes — each criterion is binary: the system either satisfies it or it does not.

The checklist operationalizes the "Digital Spinal Cord" architecture defined in [SPEC.md](../SPEC.md). Where the specification describes *what* the protocol requires, this checklist defines *how to verify* that an implementation meets those requirements.

Compliance is assessed at three levels. Each level represents a progressively stricter guarantee of structural safety.

---

## The 10-Item Compliance Checklist

### C1: Structural Isolation

> The EI (Executive Intelligence) and EEX (Executive Execution) layers MUST operate in separate execution contexts. The EI layer MUST NOT hold direct references to EEX internals, system APIs, or any mechanism capable of producing side-effects.

- [ ] EI and EEX run in distinct modules, processes, or runtime contexts.
- [ ] No import path exists from the EI layer to any side-effect-producing function.
- [ ] Removing the EEX layer does not cause the EI layer to fail (it simply cannot execute).

**Verification**: Static analysis of import graphs. Confirm that the EI module dependency tree contains zero references to I/O libraries, network clients, database drivers, or file system APIs.

---

### C2: Intent Schema Conformity

> Every action request from the EI to the EEX MUST be expressed as a structured Intent conforming to a registered JSON Schema. Free-form strings, untyped objects, and ad-hoc command formats are non-compliant.

- [ ] All Intents include the mandatory fields: `intentId`, `intentType`, `agentIdentity`, `authorityScope`, `parameters`, `timestamp`, and `nonce`.
- [ ] Each `intentType` has a corresponding registered JSON Schema.
- [ ] Intents that do not conform to their schema are rejected before reaching the EEX.

**Verification**: Submit a malformed Intent (missing `intentId`, invalid `parameters` type). Confirm the AIP Gate rejects it with `INVALID_INTENT_SCHEMA`.

---

### C3: Deterministic EEX

> The EEX layer MUST be fully deterministic. Given an identical validated Intent and identical external system state, the EEX MUST produce an identical result. The EEX MUST NOT invoke LLMs, generative models, or any probabilistic reasoning system.

- [ ] No LLM client, generative model, or probabilistic library exists in the EEX dependency tree.
- [ ] No use of non-deterministic primitives (`Math.random`, uncontrolled `Date.now` in logic branches) in EEX code paths.
- [ ] Replay test: submitting the same Intent twice against the same state produces the same output.

**Verification**: Dependency audit of the EEX module. Replay testing with identical Intents and controlled state.

---

### C4: Encapsulation of Side-Effects

> All operations that mutate external state — file writes, network requests, database mutations, process management, infrastructure changes — MUST be confined exclusively to the EEX layer. No other component may perform side-effects.

- [ ] The EI layer performs zero I/O operations under any code path.
- [ ] The AIP Gate performs zero mutations to external systems (logging is permitted as a read-append operation).
- [ ] All side-effect-producing functions reside within EEX-designated modules.

**Verification**: Instrument the EI and Gate layers with I/O interceptors. Run a full session and confirm zero external mutations originate from non-EEX components.

---

### C5: Mandatory Gate Mediation

> 100% of communication from the EI layer to the EEX layer MUST pass through the AIP Gate. There MUST be no bypass channel, backdoor, or direct invocation path.

- [ ] The EI layer submits Intents exclusively through the Gate's public API.
- [ ] No direct function call, event emission, or shared-memory channel exists between EI and EEX.
- [ ] Disabling the Gate makes the EI unable to trigger any execution.

**Verification**: Disable or remove the AIP Gate from the runtime. Confirm that the EI layer cannot cause any side-effect execution.

---

### C6: Authority Scoping

> The AIP Gate MUST enforce per-agent, per-action permission checks. An agent MUST only be able to submit Intent types that fall within its declared authority scope. Authority scopes MUST NOT be modifiable by the EI layer.

- [ ] Each agent has a registered authority scope defining permitted `intentType` values and parameter constraints.
- [ ] The Gate rejects Intents outside the agent's scope with `AUTHORITY_EXCEEDED`.
- [ ] Authority scope configuration is stored in a location not writable by the EI layer.
- [ ] An agent cannot escalate its own permissions through Intent submission.

**Verification**: Submit an Intent with a valid schema but an `intentType` outside the agent's scope. Confirm rejection with `AUTHORITY_EXCEEDED`.

---

### C7: Active Spike Defense (DSD)

> The AIP Gate MUST implement Dopamine Spike Defense — a structural rate-limiting and circuit breaker mechanism that detects and blocks abnormally high-frequency or repetitive destructive Intent patterns.

- [ ] Per-agent, per-intent-type frequency tracking is active with a configurable sliding window.
- [ ] A configurable threshold triggers the circuit breaker when exceeded.
- [ ] The circuit breaker enforces a mandatory cooldown period during which all matching Intents are rejected.
- [ ] Spike events are logged with full context (agent identity, intent sequence, threshold values).

**Verification**: Submit destructive Intents at a rate exceeding the configured threshold. Confirm the Gate returns `SPIKE_DETECTED_COOLDOWN` and blocks subsequent Intents for the cooldown duration.

---

### C8: Standardized Error Responses

> All Intent rejections from the AIP Gate MUST return structured error responses using the official AIP error code vocabulary. Generic exceptions, untyped error strings, and silent failures are non-compliant.

- [ ] Every rejection includes: `status`, `code`, `intentId`, `message`, and `timestamp`.
- [ ] The `code` field uses one of the registered AIP error codes: `INVALID_INTENT_SCHEMA`, `AUTHORITY_EXCEEDED`, `SPIKE_DETECTED_COOLDOWN`, `NONCE_REUSED`, `GATE_AUDIT_FAILURE`, `EEX_RUNTIME_FAILURE`, `INTENT_TIMEOUT`.
- [ ] No rejection produces an unstructured error (e.g., a raw stack trace or generic "Error" string).

**Verification**: Trigger each error condition and confirm the response conforms to the standard error schema with the correct code.

---

### C9: Independent EEX Testability

> The EEX layer MUST be fully testable in isolation, using static mock Intents, without requiring an active EI (LLM) or a live AIP Gate.

- [ ] EEX modules expose a public interface that accepts validated Intent objects.
- [ ] A test suite exists that exercises EEX logic using hardcoded Intent fixtures.
- [ ] No EEX test depends on LLM output, network access, or non-deterministic input.

**Verification**: Run the EEX test suite in an environment with no LLM access and no network. All tests must pass.

---

### C10: Immutable Audit Logging

> Every AIP Gate decision (approval or rejection) and every EEX execution result MUST be recorded in an append-only, tamper-evident audit log.

- [ ] All Intent submissions are logged with the full Intent payload and a timestamp.
- [ ] All Gate decisions are logged with the verdict (`forwarded` or `rejected`) and the reason.
- [ ] All EEX execution results are logged with the output and a timestamp.
- [ ] The audit log is append-only — no entry can be modified or deleted during normal operation.
- [ ] The log integrity can be verified (e.g., cryptographic chaining, content-addressable storage, or checksum validation).

**Verification**: Process a sequence of Intents (mix of approved and rejected). Inspect the audit log and confirm every event is recorded with complete metadata. Attempt to modify an existing entry and confirm the integrity check detects tampering.

---

## Compliance Levels

AIP defines three compliance levels. Each level includes all criteria from the previous level.

| Level | Name | Required Criteria | Intended Use |
|-------|------|-------------------|--------------|
| **Level 1** | Development | C1 – C5 | Internal development and prototyping. The core architectural invariants are enforced, but operational safeguards may be incomplete. |
| **Level 2** | Production | C1 – C8 | Production deployment. All structural and operational safety mechanisms are active, including authority scoping, spike defense, and standardized error handling. |
| **Level 3** | Certified | C1 – C10 | Full certification. The system satisfies all protocol requirements, including independent testability and immutable audit logging. Required for enterprise and regulated environments. |

### Level Summary

```
Level 1 (Development):  C1 ✓  C2 ✓  C3 ✓  C4 ✓  C5 ✓  C6 ·  C7 ·  C8 ·  C9 ·  C10 ·
Level 2 (Production):   C1 ✓  C2 ✓  C3 ✓  C4 ✓  C5 ✓  C6 ✓  C7 ✓  C8 ✓  C9 ·  C10 ·
Level 3 (Certified):    C1 ✓  C2 ✓  C3 ✓  C4 ✓  C5 ✓  C6 ✓  C7 ✓  C8 ✓  C9 ✓  C10 ✓
```

---

## Automated Verification

The [`aip-check`](../aip-check/) CLI tool automates compliance verification against this checklist.

```bash
# Run a full compliance scan
node ./aip-check/bin/aip-check.js scan --path .

# Generate a structured compliance report
node ./aip-check/bin/aip-check.js report --format json
```

Criteria C1–C5 are verifiable through static analysis and structural checks. Criteria C6–C10 require runtime testing with controlled Intent sequences. The `aip-check` tool will progressively support automated verification for all 10 criteria.

For manual assessment, use the checkboxes in this document as a working checklist. Copy this file into your project and mark each item as you verify it.

---

## References

- [AIP Protocol Specification (SPEC.md)](../SPEC.md)
- [AIP Compliance Auditor (aip-check)](../aip-check/)
- [Contributing Guidelines](../CONTRIBUTING.md)
