import { contrastRatio, isHexColor } from "./color.js";
import { normalizeBrandTokens } from "./tokens.js";
import type { BrandTokens, ValidationIssue, ValidationReport } from "./types.js";

export function validateBrandTokens(input: Partial<BrandTokens> = {}): ValidationReport {
  const tokens = normalizeBrandTokens(input);
  const issues: ValidationIssue[] = [];

  if (!input.name?.trim()) {
    issues.push(error("missing-name", "Missing brand name", "Add a brand name so generated assets are identifiable.", "name"));
  }

  if (tokens.name.length === 1) {
    issues.push(info("short-name", "One-character name", "One-letter names work, but long-form logo variants will have very little text.", "name"));
  }

  if (Array.from(tokens.name).length > 48) {
    issues.push(warning("long-name", "Long brand name", "Very long names are scaled down in previews and may need a shorter display name.", "name"));
  }

  if (tokens.description.length > 180) {
    issues.push(warning("long-description", "Long description", "Social previews usually perform better with descriptions under 180 characters.", "description"));
  }

  for (const field of ["primary", "secondary", "accent", "background", "foreground"] as const) {
    const value = input[field] ?? tokens[field];
    if (!isHexColor(value)) {
      issues.push(error(`invalid-${field}`, `Invalid ${field} color`, `${field} must be a 3- or 6-digit hex color.`, field));
    }
  }

  const textContrast = contrastRatio(tokens.foreground, tokens.background);
  if (textContrast < 4.5) {
    issues.push(error("foreground-contrast", "Foreground contrast fails AA", `Foreground and background contrast is ${textContrast.toFixed(2)}:1. Use 4.5:1 or higher.`, "foreground"));
  }

  const primaryContrast = contrastRatio(tokens.primary, tokens.background);
  if (primaryContrast < 3) {
    issues.push(warning("primary-contrast", "Primary contrast is low", `Primary and background contrast is ${primaryContrast.toFixed(2)}:1. Icons and controls may need stronger contrast.`, "primary"));
  }

  if (tokens.radius > 48) {
    issues.push(info("large-radius", "Large radius", "Large radii are supported and may crop dense marks on small favicons.", "radius"));
  }

  const errorCount = issues.filter((issue) => issue.severity === "error").length;
  const warningCount = issues.filter((issue) => issue.severity === "warning").length;
  const score = Math.max(0, 100 - errorCount * 28 - warningCount * 12 - issues.length * 2);

  return {
    ok: errorCount === 0,
    score,
    issues
  };
}

function error(id: string, title: string, message: string, path?: ValidationIssue["path"]): ValidationIssue {
  return issue("error", id, title, message, path);
}

function warning(id: string, title: string, message: string, path?: ValidationIssue["path"]): ValidationIssue {
  return issue("warning", id, title, message, path);
}

function info(id: string, title: string, message: string, path?: ValidationIssue["path"]): ValidationIssue {
  return issue("info", id, title, message, path);
}

function issue(severity: ValidationIssue["severity"], id: string, title: string, message: string, path?: ValidationIssue["path"]): ValidationIssue {
  const next: ValidationIssue = { id, severity, title, message };
  if (path) {
    next.path = path;
  }

  return next;
}
