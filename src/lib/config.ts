import { readFileSync } from "node:fs";
import path from "node:path";
import type { SourceId } from "./types";

/**
 * App-level configuration, read from `ai-usage.config.json` in the project root.
 * The file is optional — when absent or malformed, sensible defaults are used so
 * existing single/dual-source installs keep working with zero config.
 */
export type AppConfig = {
  version: number;
  enabledSources: SourceId[];
  port: number;
};

/** Sources the dashboard currently knows how to read. */
const KNOWN_SOURCES: readonly SourceId[] = ["claude-code", "codex"];

const DEFAULT_CONFIG: AppConfig = {
  version: 1,
  enabledSources: ["claude-code", "codex"],
  port: 3002,
};

const CONFIG_FILENAME = "ai-usage.config.json";

function sanitizeSources(raw: unknown): SourceId[] {
  if (!Array.isArray(raw)) return [...DEFAULT_CONFIG.enabledSources];
  const seen = new Set<SourceId>();
  for (const item of raw) {
    if (typeof item === "string" && (KNOWN_SOURCES as readonly string[]).includes(item)) {
      seen.add(item as SourceId);
    }
  }
  // Filtering may leave nothing (all unknown / empty) — fall back to defaults.
  return seen.size > 0 ? [...seen] : [...DEFAULT_CONFIG.enabledSources];
}

function sanitizePort(raw: unknown): number {
  return typeof raw === "number" && Number.isInteger(raw) && raw > 0 && raw < 65536
    ? raw
    : DEFAULT_CONFIG.port;
}

function sanitizeVersion(raw: unknown): number {
  return typeof raw === "number" && Number.isInteger(raw) && raw > 0
    ? raw
    : DEFAULT_CONFIG.version;
}

/**
 * Load and validate the app config. Never throws — any read/parse/validation
 * failure degrades field-by-field to defaults.
 */
export function loadConfig(): AppConfig {
  const file = path.join(process.cwd(), CONFIG_FILENAME);

  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(file, "utf8"));
  } catch {
    // Missing file or invalid JSON → full defaults.
    return { ...DEFAULT_CONFIG, enabledSources: [...DEFAULT_CONFIG.enabledSources] };
  }

  if (typeof parsed !== "object" || parsed === null) {
    return { ...DEFAULT_CONFIG, enabledSources: [...DEFAULT_CONFIG.enabledSources] };
  }

  const obj = parsed as Record<string, unknown>;
  return {
    version: sanitizeVersion(obj.version),
    enabledSources: sanitizeSources(obj.enabledSources),
    port: sanitizePort(obj.port),
  };
}

/** Convenience: list of enabled source IDs (validated). */
export function getEnabledSources(): SourceId[] {
  return loadConfig().enabledSources;
}

/** Convenience: configured port (validated, defaults to 3002). */
export function getPort(): number {
  return loadConfig().port;
}
