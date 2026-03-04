/**
 * AIP Check CLI — Command-line interface for the AIP Compliance Auditor.
 *
 * Provides the `scan` command that inspects code for:
 *   - Forbidden AI SDK imports in EEX-layer code (AIP-CORE)
 *   - MCP components placed outside the EEX boundary (AIP-V10.2)
 *
 * @module cli
 */

import { Command } from "commander";
import chalk from "chalk";
import { scan } from "./scanner.js";
import type { Violation, Severity } from "./scanner.js";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const VERSION = "0.1.0";

const BANNER = `
  ${chalk.cyan.bold("╔══════════════════════════════════════════════╗")}
  ${chalk.cyan.bold("║")}    ${chalk.white.bold("AIP Compliance Auditor")} ${chalk.dim(`v${VERSION}`)}            ${chalk.cyan.bold("║")}
  ${chalk.cyan.bold("║")}    ${chalk.dim("Digital Spinal Cord — EI/EEX Boundary")}     ${chalk.cyan.bold("║")}
  ${chalk.cyan.bold("╚══════════════════════════════════════════════╝")}
`;

// ---------------------------------------------------------------------------
// Output formatting
// ---------------------------------------------------------------------------

function severityBadge(severity: Severity): string {
  switch (severity) {
    case "CRITICAL":
      return chalk.bgRed.white.bold(" CRITICAL ");
    case "ERROR":
      return chalk.red.bold("ERROR");
    case "WARNING":
      return chalk.yellow.bold("WARNING");
  }
}

function printViolation(v: Violation, index: number): void {
  console.log(
    `  ${chalk.red.bold(`[${index + 1}]`)} ${severityBadge(v.severity)} ${chalk.dim(`(${v.ruleId})`)}`
  );
  console.log(
    `      ${chalk.yellow("File:")}   ${chalk.white(v.file)}${chalk.dim(`:${v.line}`)}`
  );
  console.log(`      ${chalk.yellow("Module:")} ${chalk.red.bold(v.module)}`);
  console.log(`      ${chalk.yellow("Source:")} ${chalk.dim(v.content)}`);
  console.log(`      ${chalk.yellow("Detail:")} ${v.message}`);
  console.log();
}

function printSummary(
  filesScanned: number,
  violations: Violation[],
  passed: boolean,
): void {
  const criticalCount = violations.filter((v) => v.severity === "CRITICAL").length;
  const errorCount = violations.filter((v) => v.severity === "ERROR").length;
  const warningCount = violations.filter((v) => v.severity === "WARNING").length;

  console.log(
    chalk.white.bold("  ── Summary ───────────────────────────────")
  );
  console.log();
  console.log(`  Files scanned: ${chalk.white(filesScanned)}`);

  if (violations.length > 0) {
    console.log(
      `  Violations:    ${chalk.red.bold(violations.length)}` +
        (criticalCount > 0 ? chalk.bgRed.white.bold(` ${criticalCount} CRITICAL `) : "") +
        (errorCount > 0 ? chalk.red(` ${errorCount} error`) : "") +
        (warningCount > 0 ? chalk.yellow(` ${warningCount} warning`) : ""),
    );
  } else {
    console.log(`  Violations:    ${chalk.green("0")}`);
  }
  console.log();

  if (passed) {
    console.log(
      chalk.green.bold(
        "  🟢 [PASSED] No EI/EEX boundary violations detected."
      )
    );
  } else {
    if (criticalCount > 0) {
      console.log(
        chalk.red.bold(
          "  🔴 [FAILED] CRITICAL: MCP Boundary Violations detected. See AIP Spec Section 10."
        )
      );
    }
    if (errorCount > 0) {
      console.log(
        chalk.red.bold(
          "  🔴 [FAILED] EI/EEX boundary violations found. EEX layer must not import AI SDKs."
        )
      );
    }
  }
  console.log();
}

// ---------------------------------------------------------------------------
// CLI definition
// ---------------------------------------------------------------------------

export function createProgram(): Command {
  const program = new Command();

  program
    .name("aip-check")
    .description(
      "AIP Compliance Auditor — Enforce EI/EEX boundary isolation in your codebase."
    )
    .version(VERSION);

  program
    .command("scan")
    .description(
      "Scan a directory for AIP boundary violations (AI SDK imports and MCP placement)."
    )
    .argument("[dir]", "Target directory to scan", ".")
    .option(
      "--format <type>",
      "Output format: text or json",
      "text"
    )
    .action(async (dir: string, options: { format: string }) => {
      console.log(BANNER);

      try {
        const result = await scan(dir);

        if (options.format === "json") {
          console.log(JSON.stringify(result, null, 2));
          process.exit(result.passed ? 0 : 1);
          return;
        }

        console.log(chalk.dim(`  Target: ${dir}`));
        console.log(chalk.dim(`  Date:   ${result.timestamp}`));
        console.log();

        if (result.violations.length > 0) {
          console.log(
            chalk.white.bold(
              "  ── Violations ────────────────────────────"
            )
          );
          console.log();
          result.violations.forEach((v, i) => printViolation(v, i));
        }

        printSummary(result.filesScanned, result.violations, result.passed);
        process.exit(result.passed ? 0 : 1);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Unknown error occurred";
        console.error(chalk.red.bold(`  Error: ${message}`));
        process.exit(2);
      }
    });

  return program;
}

export async function run(): Promise<void> {
  const program = createProgram();
  await program.parseAsync(process.argv);
}
