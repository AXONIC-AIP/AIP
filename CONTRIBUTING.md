# Contributing to AIP

Thank you for your interest in the Agentic Interaction Protocol. AIP is building the structural governance layer — the "Digital Spinal Cord" — for autonomous AI systems. This is a community-driven standard, and we welcome contributors from every discipline: security engineering, AI research, systems architecture, formal verification, and beyond.

Your expertise matters. The safety challenges of agentic AI are too broad for any single team to solve alone. Whether you bring deep knowledge of protocol design, real-world experience with LLM-based agents, or a sharp eye for edge cases, there is meaningful work for you here.

---

## Types of Contributions

### Specification Proposals

The protocol specification (`SPEC.md`) is the foundation of AIP. Proposals to refine, extend, or clarify the specification are highly valued. This includes:

- Strengthening the EI/EEX invariant definitions.
- Adding new Intent types or validation rules.
- Identifying ambiguities or gaps in the current draft.
- Proposing new error codes or security considerations.

### Reference Implementations

AIP is language-agnostic by design. We need reference implementations that demonstrate compliant architectures in diverse ecosystems:

- TypeScript / Node.js (primary)
- Python (AI integration layer)
- Go, Rust, Java, and others

Reference implementations live in the `examples/` directory and MUST demonstrate strict EI/EEX separation.

### Tooling

The `aip-check` CLI tool is the primary mechanism for automated compliance verification. Contributions include:

- New compliance rules and detection logic.
- Performance improvements to the scanning engine.
- Output format support (JSON, SARIF, etc.).
- Integration guides for CI/CD pipelines.

### Bug Reports & Documentation

Edge cases are where protocols fail. If you identify a scenario where the AIP specification is ambiguous, a compliance rule produces a false positive, or the documentation is unclear, please report it. These contributions are as valuable as code.

---

## Discussions-First Policy

**For any change that affects the core protocol semantics, the EI/EEX separation logic, or the AIP Gate validation rules, you MUST open a GitHub Discussion or Issue before writing code.**

This is not bureaucracy. AIP is a governance protocol — changes to its core invariants have cascading implications for every compliant system. The discussion phase ensures that:

- The community aligns on the philosophical and technical rationale.
- Edge cases are surfaced before implementation begins.
- The change is consistent with AIP's design principles.

Minor changes (typo fixes, documentation clarifications, test additions) do not require prior discussion. Use your judgment — when in doubt, open an Issue first.

---

## Development Workflow

### 1. Fork & Clone

```bash
git clone https://github.com/<your-username>/AIP.git
cd AIP
npm install
```

### 2. Create a Branch

Always create your branch from the latest `main` branch of your fork:

```bash
git checkout main
git pull origin main
git checkout -b feat/add-intent-validation-rule
```

#### Branch Naming Conventions

Branch names MUST use **lowercase kebab-case** (words separated by hyphens). Each branch name starts with a prefix that indicates the type of change, followed by a `/` and a short, descriptive slug.

| Prefix | Purpose | Example |
|-----------|----------------------------------------------|--------------------------------------|
| `feat/` | New features or significant functional changes | `feat/add-python-sdk` |
| `fix/` | Bug fixes or error handling improvements | `fix/gate-validation-logic` |
| `spec/` | Changes or proposals to `SPEC.md` | `spec/clarify-dsd-cooldown-rules` |
| `docs/` | Documentation updates (README, guides, inline comments) | `docs/add-intent-lifecycle-diagram` |
| `refactor/` | Code restructuring that does not change behavior | `refactor/extract-gate-validator` |
| `test/` | Adding missing tests or correcting existing tests | `test/dsd-circuit-breaker-edge-case` |

**Guidelines**:

- Keep branch names concise but descriptive enough to convey the intent at a glance.
- Do not include issue numbers in the branch name — reference them in the PR description instead.
- If your change spans multiple categories, use the prefix that best represents the primary purpose.

### 3. Make Your Changes

- Follow the coding standards described below.
- Write or update tests for any logic changes.
- Ensure all EEX logic remains strictly deterministic.

### 4. Validate Locally

```bash
npm run lint
npm test
node ./bin/aip-check.js scan
```

All three checks MUST pass before submitting a Pull Request.

### 5. Commit with Clear Messages

Write descriptive commit messages that explain **why** the change was made, not just what changed.

```
feat: add frequency-based DSD detection for batch intents

The existing DSD algorithm only tracked individual intent frequency.
This extends detection to cover batch submission patterns where
multiple intents are submitted in a single request to bypass
per-intent rate limiting.
```

All commit messages, code comments, and documentation MUST be written in English.

### 6. Open a Pull Request

- Target the `main` branch.
- Provide a clear description of the change and its impact on the protocol.
- Reference any related Issues or Discussions.
- Be prepared for rigorous review — this is expected and welcome.

---

## Coding Standards

### The EI/EEX Boundary is Inviolable

This is the single most important rule. Any contribution that blurs the boundary between Executive Intelligence and Executive Execution will be rejected, regardless of its other merits.

Specifically:

- **EEX modules MUST NOT** import, invoke, or depend on any LLM, generative model, or probabilistic reasoning system.
- **EI modules MUST NOT** perform file I/O, network requests, database writes, or any other side-effects.
- **The AIP Gate MUST** remain the sole communication pathway between EI and EEX.

### Language & Style

- **TypeScript**: Follow the project's ESLint configuration. Use strict mode.
- **Python**: Follow PEP 8. Use type hints for all function signatures.
- **Naming**: PascalCase for classes, camelCase for variables and functions, UPPER_SNAKE_CASE for constants.
- **Error Handling**: Use structured error responses with standard AIP error codes. Do not throw generic exceptions.

### Testing

- All new `aip-check` rules MUST include unit tests covering both compliant and non-compliant cases.
- Reference implementations MUST include integration tests demonstrating the full Intent lifecycle.
- Tests MUST be deterministic. No reliance on external services, network access, or timing-sensitive logic.

---

## Code of Conduct

AIP is a technical project focused on the safety and governance of autonomous systems. We expect all interactions — in Issues, Discussions, Pull Requests, and reviews — to be:

- **Professional**: Focus on technical merit. Critique ideas, not people.
- **Respectful**: We are a global community with diverse backgrounds and perspectives.
- **Constructive**: If you identify a problem, propose a path forward when possible.
- **Safety-Oriented**: The purpose of this project is to make AI systems safer. Contributions that undermine this goal will not be accepted.

Harassment, discrimination, and personal attacks are not tolerated under any circumstances.

---

## Attribution

Contributors who make meaningful contributions to the AIP ecosystem will be recognized in the `CONTRIBUTORS.md` file. This includes specification authors, implementation contributors, tooling developers, and those who identify critical edge cases.

You are not just contributing to a repository. You are helping define the governance standard for the next generation of autonomous systems.

---

## Questions?

If you are unsure where to start or how your expertise fits, open a GitHub Discussion with the **question** label. The community and maintainers are here to help you find the right entry point.

We look forward to building this with you.
