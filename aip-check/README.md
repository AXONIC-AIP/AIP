# aip-check

**AIP Compliance Auditor** — A CLI tool for verifying adherence to the [Agentic Interaction Protocol](../README.md).

`aip-check` scans your project structure and source code to determine whether it satisfies the AIP protocol constraints: EI/EEX isolation, Intent schema validity, and Dopamine Spike Defense implementation.

> **Status**: v0.1.0-alpha — Structural checks only. Static analysis passes are under active development.

---

## Quick Start

```bash
cd aip-check
npm install
npm run scan
```

This runs a compliance scan against the parent AIP repository directory and outputs a draft compliance report.

### CLI Usage

```bash
# Scan the default parent directory
node ./bin/aip-check.js scan

# Scan a specific project directory
node ./bin/aip-check.js scan --path /path/to/project

# Display version
node ./bin/aip-check.js --version
```

---

## Current Checks (v0.1.0-alpha)

| Check | Description |
|-------|-------------|
| Protocol Specification | Verifies `SPEC.md` exists and is non-empty. |
| Development Guidelines | Verifies `CLAUDE.md` exists and is non-empty. |
| Contribution Guide | Verifies `CONTRIBUTING.md` exists and is non-empty. |
| License Declaration | Verifies `LICENSE` file is present. |
| Reference Implementations | Verifies `examples/` directory exists. |
| Compliance Directory | Verifies `compliance/` directory exists. |

---

## Planned Features

- **EI/EEX Isolation Analysis**: Static analysis to detect prohibited imports and non-deterministic logic within EEX modules.
- **Intent Schema Validation**: Automated validation of Intent objects against registered JSON Schemas using Ajv.
- **Dopamine Spike Defense Detection**: Pattern matching to verify that AIP Gate implementations include rate-limiting and circuit breaker logic.
- **JSON & SARIF Output**: Machine-readable report formats for CI/CD pipeline integration.
- **Configurable Rule Sets**: Allow projects to define custom compliance rules via `.aiprc` configuration files.
- **Spike Defense Stress Testing**: Simulated high-frequency Intent streams to verify DSD behavior under load.

---

## License

Apache-2.0 — See [LICENSE](../LICENSE).
