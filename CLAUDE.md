# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AIP (Agentic Interaction Protocol) is a governance protocol that enforces strict separation between Executive Intelligence (EI) and Executive Execution (EEX). The EI layer (LLM) produces Intents; the EEX layer executes them. These two layers must never be conflated.

## Guiding Principles

### EI/EEX Isolation
Never generate code that allows an LLM (EI) to directly execute side-effects. All side-effects — file writes, network calls, database mutations — must be routed through the EEX layer via validated Intents.

### Deterministic EEX
All execution logic in EEX modules must be 100% deterministic. No probabilistic reasoning, no LLM calls, no "creative" branching inside EEX. Given the same Intent, the EEX must always produce the same result.

### Validation First
Every EEX component must implement strict schema validation for incoming Intents before execution. Reject malformed or unauthorized Intents at the gate, not downstream.

## Technical Standards

- **Language Policy**: All code comments, commit messages, documentation, and PR descriptions must be written in English.
- **Languages**: TypeScript (CLI/Web), Python (AI integration).
- **Naming**: PascalCase for classes, camelCase for variables/functions, UPPER_SNAKE_CASE for constants.
- **Error Handling**: Use structured error responses with explicit rejection reasons (e.g., `AUTHORITY_ERROR`, `SPIKE_DETECTED`, `SCHEMA_VALIDATION_FAILED`). Do not throw generic errors.

## Development Commands

```bash
npm run build        # Build the project
npm test             # Run the test suite
npm run lint         # Lint all source files
node ./bin/aip-check.js scan   # Run AIP protocol audit
```

To run a single test file:
```bash
npx jest path/to/test.ts
```

## Key Terminology

| Term | Definition |
|------|-----------|
| **EI (Executive Intelligence)** | The LLM layer that reasons and produces Intents. Must never execute side-effects directly. |
| **EEX (Executive Execution)** | The deterministic execution layer that receives validated Intents and performs side-effects. |
| **Intent** | A structured, schema-validated message passed from EI to EEX describing a desired action. |
| **AIP Gate** | The verification bridge between EI and EEX. Validates authority, schema, and rate limits before forwarding an Intent to execution. |
| **Dopamine Spike Defense** | Throttling mechanism that detects and blocks high-frequency request bursts to prevent runaway execution loops. |
