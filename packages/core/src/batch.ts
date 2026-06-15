import type {
  BatchParseResult,
  BatchRow,
  BrandMode,
  BrandTheme,
  LogoShape,
  LogoStyle,
  MetaGradient,
  MetaLayout,
  MetaPattern,
} from "./types.js";

const KNOWN_COLUMNS = new Set([
  "name",
  "description",
  "font",
  "radius",
  "primary",
  "secondary",
  "accent",
  "background",
  "foreground",
  "mode",
  "theme",
  "logoSource",
  "logoDataUri",
  "logoShape",
  "logoStyle",
  "metaGradient",
  "metaPattern",
  "metaPatternScale",
  "metaIntensity",
  "metaLayout",
]);

export function parseBatchInput(raw: string): BatchParseResult {
  const input = raw.trim();
  if (!input) {
    return { rows: [], errors: [] };
  }

  if (input.startsWith("[") || input.startsWith("{")) {
    return parseJson(input);
  }

  return parseDelimited(input);
}

function parseJson(input: string): BatchParseResult {
  try {
    const parsed = JSON.parse(input) as unknown;
    const rows = Array.isArray(parsed) ? parsed : [parsed];
    const normalized = rows.flatMap((row, index) => {
      if (!isRecord(row)) {
        return [];
      }

      return [recordToRow(row, index)];
    });

    return {
      rows: normalized,
      errors:
        normalized.length === rows.length
          ? []
          : ["Some JSON rows were not objects and were skipped."],
    };
  } catch (error) {
    return {
      rows: [],
      errors: [
        `Invalid JSON: ${error instanceof Error ? error.message : "Unable to parse input."}`,
      ],
    };
  }
}

function parseDelimited(input: string): BatchParseResult {
  const lines = input.split(/\r?\n/u).filter((line) => line.trim().length > 0);
  if (lines.length === 0) {
    return { rows: [], errors: [] };
  }

  const headerLine = lines[0] ?? "";
  const delimiter = headerLine.includes("\t") ? "\t" : ",";
  const headers = splitRow(headerLine, delimiter).map((header) =>
    header.trim(),
  );
  const unknownColumns = headers.filter((header) => !KNOWN_COLUMNS.has(header));
  const rows = lines.slice(1).map((line, index) => {
    const values = splitRow(line, delimiter);
    const record: Record<string, string> = {};
    headers.forEach((header, headerIndex) => {
      record[header] = values[headerIndex] ?? "";
    });
    return recordToRow(record, index);
  });

  return {
    rows,
    errors:
      unknownColumns.length > 0
        ? [`Unknown columns ignored: ${unknownColumns.join(", ")}`]
        : [],
  };
}

function recordToRow(record: Record<string, unknown>, index: number): BatchRow {
  const row: BatchRow = {
    name: toStringValue(record.name) || `Brand ${index + 1}`,
  };
  const stringFields = [
    "description",
    "font",
    "primary",
    "secondary",
    "accent",
    "background",
    "foreground",
    "logoDataUri",
  ] as const;

  for (const field of stringFields) {
    const value = toOptionalString(record[field]);
    if (value) {
      row[field] = value;
    }
  }

  const radius = toOptionalNumber(record.radius);
  if (radius !== undefined) {
    row.radius = radius;
  }

  if (record.mode === "dark" || record.mode === "light") {
    row.mode = record.mode as BrandMode;
  }

  if (record.logoSource === "generated" || record.logoSource === "uploaded") {
    row.logoSource = record.logoSource;
  }

  const logoShape = toOptionalString(record.logoShape);
  if (logoShape) {
    row.logoShape = logoShape as LogoShape;
  }

  const logoStyle = toOptionalString(record.logoStyle);
  if (logoStyle) {
    row.logoStyle = logoStyle as LogoStyle;
  }

  const metaGradient = toOptionalString(record.metaGradient);
  if (metaGradient) {
    row.metaGradient = metaGradient as MetaGradient;
  }

  const metaPattern = toOptionalString(record.metaPattern);
  if (metaPattern) {
    row.metaPattern = metaPattern as MetaPattern;
  }

  const metaLayout = toOptionalString(record.metaLayout);
  if (metaLayout) {
    row.metaLayout = metaLayout as MetaLayout;
  }

  const theme = toOptionalString(record.theme);
  if (theme) {
    row.theme = theme as BrandTheme;
  }

  const metaPatternScale = toOptionalNumber(record.metaPatternScale);
  if (metaPatternScale !== undefined) {
    row.metaPatternScale = metaPatternScale;
  }

  const metaIntensity = toOptionalNumber(record.metaIntensity);
  if (metaIntensity !== undefined) {
    row.metaIntensity = metaIntensity;
  }

  return row;
}

function splitRow(line: string, delimiter: string): string[] {
  const values: string[] = [];
  let current = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"' && quoted && next === '"') {
      current += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      quoted = !quoted;
      continue;
    }

    if (char === delimiter && !quoted) {
      values.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current.trim());
  return values;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toStringValue(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function toOptionalString(value: unknown): string | undefined {
  const result = toStringValue(value);
  return result.length > 0 ? result : undefined;
}

function toOptionalNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
}
