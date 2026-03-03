#!/usr/bin/env node

import { Command } from "commander";
import chalk from "chalk";
import fs from "node:fs";
import path from "node:path";

const VERSION = "0.1.0-alpha";

const BANNER = `
  ╔══════════════════════════════════════════════╗
  ║         AIP Compliance Auditor v${VERSION}      ║
  ║         Agentic Interaction Protocol         ║
  ╚══════════════════════════════════════════════╝
`;

const CHECKS = [
  {
    name: "Protocol Specification",
    description: "SPEC.md exists and is non-empty",
    check: (rootDir) => {
      const filePath = path.join(rootDir, "SPEC.md");
      return fs.existsSync(filePath) && fs.statSync(filePath).size > 0;
    },
  },
  {
    name: "Development Guidelines",
    description: "CLAUDE.md exists and is non-empty",
    check: (rootDir) => {
      const filePath = path.join(rootDir, "CLAUDE.md");
      return fs.existsSync(filePath) && fs.statSync(filePath).size > 0;
    },
  },
  {
    name: "Contribution Guide",
    description: "CONTRIBUTING.md exists and is non-empty",
    check: (rootDir) => {
      const filePath = path.join(rootDir, "CONTRIBUTING.md");
      return fs.existsSync(filePath) && fs.statSync(filePath).size > 0;
    },
  },
  {
    name: "License Declaration",
    description: "LICENSE file is present",
    check: (rootDir) => {
      return fs.existsSync(path.join(rootDir, "LICENSE"));
    },
  },
  {
    name: "Reference Implementations",
    description: "examples/ directory exists",
    check: (rootDir) => {
      const dirPath = path.join(rootDir, "examples");
      return fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory();
    },
  },
  {
    name: "Compliance Directory",
    description: "compliance/ directory exists",
    check: (rootDir) => {
      const dirPath = path.join(rootDir, "compliance");
      return fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory();
    },
  },
];

function formatStatus(passed) {
  return passed
    ? chalk.green.bold("PASS")
    : chalk.red.bold("FAIL");
}

function runScan(targetDir) {
  const rootDir = path.resolve(targetDir);

  console.log(chalk.cyan.bold(BANNER));
  console.log(chalk.dim(`  Target: ${rootDir}`));
  console.log(chalk.dim(`  Date:   ${new Date().toISOString()}`));
  console.log();
  console.log(chalk.white.bold("  ── Compliance Checks ──────────────────────"));
  console.log();

  let passed = 0;
  let failed = 0;

  for (const item of CHECKS) {
    const result = item.check(rootDir);
    const status = formatStatus(result);

    if (result) {
      passed++;
    } else {
      failed++;
    }

    console.log(`  ${status}  ${chalk.white(item.name)}`);
    console.log(chalk.dim(`        ${item.description}`));
    console.log();
  }

  console.log(chalk.white.bold("  ── Summary ───────────────────────────────"));
  console.log();
  console.log(`  Total:  ${CHECKS.length} checks`);
  console.log(`  Passed: ${chalk.green(passed)}`);
  console.log(`  Failed: ${chalk.red(failed)}`);
  console.log();

  if (failed === 0) {
    console.log(chalk.green.bold("  Status: DRAFT_COMPLIANT (v0.1.0-alpha)"));
  } else {
    console.log(chalk.yellow.bold("  Status: NON_COMPLIANT — resolve failed checks above"));
  }

  console.log();
  return failed === 0 ? 0 : 1;
}

const program = new Command();

program
  .name("aip-check")
  .description("AIP Compliance Auditor — Validate adherence to the Agentic Interaction Protocol.")
  .version(VERSION);

program
  .command("scan")
  .description("Scan a directory for AIP protocol compliance.")
  .option("-p, --path <dir>", "Target directory to scan", "..")
  .option("--format <type>", "Output format (text, json)", "text")
  .action((options) => {
    const exitCode = runScan(options.path);
    process.exit(exitCode);
  });

program.parse();
