#!/usr/bin/env node
import { constants } from "node:fs";
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import JSZip from "jszip";
import {
  DEFAULT_BRAND_TOKENS,
  generateBrandAssets,
  getBrandKitToolManifest,
  normalizeBrandTokens,
  parseBatchInput,
  slugify,
  validateBrandTokens,
} from "@brandkit/core";
import type { BrandAsset, BrandTokens, ValidationIssue } from "@brandkit/core";

type Command =
  | "init"
  | "generate"
  | "export"
  | "build"
  | "sync"
  | "doctor"
  | "validate"
  | "batch"
  | "mcp"
  | "help";

interface ProjectCheck {
  file: string;
  message: string;
  severity: "error" | "warning" | "info";
}

const args = process.argv.slice(2);
const command = (args[0] ?? "help") as Command;
const cwd = process.cwd();

main().catch((error: unknown) => {
  console.error(
    `brandkit: ${error instanceof Error ? error.message : "Unknown error"}`,
  );
  process.exitCode = 1;
});

async function main(): Promise<void> {
  switch (command) {
    case "init":
      await init(cwd);
      break;
    case "generate":
      await generate(cwd, "brandkit-assets");
      break;
    case "build":
      await generate(cwd, "brandkit-assets");
      break;
    case "export":
      await exportZip(cwd);
      break;
    case "sync":
      await sync(cwd);
      break;
    case "doctor":
      await doctor(cwd);
      break;
    case "validate":
      await validate(cwd);
      break;
    case "batch":
      await batch(cwd, args[1]);
      break;
    case "mcp":
      printMcpManifest();
      break;
    default:
      printHelp();
  }
}

async function init(root: string): Promise<void> {
  const target = path.join(root, "brand.json");
  if (await exists(target)) {
    console.log("brand.json already exists.");
    return;
  }

  await writeFile(
    target,
    `${JSON.stringify(DEFAULT_BRAND_TOKENS, null, 2)}\n`,
    "utf8",
  );
  console.log("Created brand.json");
}

async function generate(root: string, outputDir: string): Promise<void> {
  const tokens = await readBrand(root);
  const assets = generateBrandAssets(tokens);
  await writeAssets(path.join(root, outputDir), assets);
  console.log(`Generated ${assets.length} assets in ${outputDir}/`);
}

async function exportZip(root: string): Promise<void> {
  const tokens = await readBrand(root);
  const assets = generateBrandAssets(tokens);
  const zip = new JSZip();
  assets.forEach((asset) => zip.file(asset.filename, asset.content));
  const output = await zip.generateAsync({
    type: "uint8array",
    compression: "DEFLATE",
  });
  const outputDir = path.join(root, "brandkit-assets");
  await mkdir(outputDir, { recursive: true });
  const zipPath = path.join(outputDir, `${slugify(tokens.name)}-brandkit.zip`);
  await writeFile(zipPath, output);
  console.log(
    `Exported ${assets.length} assets to ${path.relative(root, zipPath)}`,
  );
}

async function sync(root: string): Promise<void> {
  const tokens = await readBrand(root);
  const assets = generateBrandAssets(tokens).filter((asset) =>
    [
      "favicon.svg",
      "apple-touch-icon.svg",
      "android-chrome-192x192.svg",
      "android-chrome-512x512.svg",
      "site.webmanifest",
      "og-image.svg",
      "twitter-card.svg",
      "robots.txt",
    ].includes(asset.filename),
  );
  await writeAssets(path.join(root, "public"), assets);
  console.log(`Synced ${assets.length} web assets to public/`);
}

async function doctor(root: string): Promise<void> {
  const tokens = await readBrand(root);
  const validation = validateBrandTokens(tokens);
  const projectChecks = await scanProject(root);

  printValidation(validation.issues);
  printProjectChecks(projectChecks);
  console.log(
    `Score: ${Math.max(0, validation.score - projectChecks.filter((check) => check.severity !== "info").length * 6)}/100`,
  );

  if (
    !validation.ok ||
    projectChecks.some((check) => check.severity === "error")
  ) {
    process.exitCode = 1;
  }
}

async function validate(root: string): Promise<void> {
  const tokens = await readBrand(root);
  const validation = validateBrandTokens(tokens);
  printValidation(validation.issues);
  console.log(
    validation.ok
      ? `Valid brand kit. Score: ${validation.score}/100`
      : `Brand kit needs attention. Score: ${validation.score}/100`,
  );
  process.exitCode = validation.ok ? 0 : 1;
}

async function batch(
  root: string,
  filePath: string | undefined,
): Promise<void> {
  if (!filePath) {
    throw new Error("Pass a CSV, TSV, or JSON batch file.");
  }

  const source = await readFile(path.resolve(root, filePath), "utf8");
  const result = parseBatchInput(source);
  result.errors.forEach((error) => console.warn(error));

  const outputRoot = path.join(root, "brandkit-assets", "batch");
  for (const row of result.rows) {
    const tokens = normalizeBrandTokens(row);
    await writeAssets(
      path.join(outputRoot, slugify(tokens.name)),
      generateBrandAssets(tokens),
    );
  }

  console.log(
    `Generated ${result.rows.length} brand kits in ${path.relative(root, outputRoot)}/`,
  );
}

async function readBrand(root: string): Promise<BrandTokens> {
  const target = path.join(root, "brand.json");
  if (!(await exists(target))) {
    throw new Error("No brand.json found. Run `brandkit init` first.");
  }

  try {
    const parsed = JSON.parse(
      await readFile(target, "utf8"),
    ) as Partial<BrandTokens>;
    return normalizeBrandTokens(parsed);
  } catch (error) {
    throw new Error(
      `Unable to read brand.json: ${error instanceof Error ? error.message : "Invalid JSON"}`,
    );
  }
}

async function writeAssets(
  outputDir: string,
  assets: BrandAsset[],
): Promise<void> {
  await mkdir(outputDir, { recursive: true });
  await Promise.all(
    assets.map((asset) =>
      writeFile(path.join(outputDir, asset.filename), asset.content, "utf8"),
    ),
  );
}

async function scanProject(root: string): Promise<ProjectCheck[]> {
  const expected = [
    "brand.json",
    "public/favicon.svg",
    "public/site.webmanifest",
    "public/apple-touch-icon.svg",
    "public/og-image.svg",
    "public/twitter-card.svg",
    "public/robots.txt",
  ];

  const checks: ProjectCheck[] = [];
  for (const file of expected) {
    if (!(await exists(path.join(root, file)))) {
      checks.push({
        file,
        severity: file === "brand.json" ? "error" : "warning",
        message: `${file} is missing.`,
      });
    }
  }

  if (await exists(path.join(root, "app"))) {
    checks.push({
      file: "app/",
      severity: "info",
      message: "Next.js app directory detected.",
    });
  }

  return checks;
}

function printValidation(issues: ValidationIssue[]): void {
  if (issues.length === 0) {
    console.log("No token validation issues.");
    return;
  }

  console.log("Token validation:");
  for (const issue of issues) {
    console.log(
      `- ${issue.severity.toUpperCase()} ${issue.title}: ${issue.message}`,
    );
  }
}

function printProjectChecks(checks: ProjectCheck[]): void {
  if (checks.length === 0) {
    console.log("Project scan passed.");
    return;
  }

  console.log("Project scan:");
  for (const check of checks) {
    console.log(
      `- ${check.severity.toUpperCase()} ${check.file}: ${check.message}`,
    );
  }
}

async function exists(filePath: string): Promise<boolean> {
  try {
    await access(filePath, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

function printHelp(): void {
  console.log(`BrandKit OS

Usage:
  brandkit init
  brandkit generate
  brandkit export
  brandkit build
  brandkit sync
  brandkit doctor
  brandkit validate
  brandkit batch <file.csv|file.json>
  brandkit mcp
`);
}

function printMcpManifest(): void {
  console.log(`${JSON.stringify(getBrandKitToolManifest(), null, 2)}\n`);
}
