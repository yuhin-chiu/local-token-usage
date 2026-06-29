import { promises as fs } from "node:fs";
import { CLAUDE_DIR, readClaudeUsage } from "./claude";
import { CODEX_DIR, readCodexUsage } from "./codex";
import type { SourceCapability, SourceId, UsageEvent, UsageSnapshot } from "../types";

/** Uniform result every source reader returns, smoothing over per-source shapes. */
export type SourceReadResult = {
  events: UsageEvent[];
  /** Only sources that expose rate-limit windows (e.g. codex) populate this. */
  rateLimit?: UsageSnapshot["rateLimit"];
};

export type SourceModule = {
  id: SourceId;
  capability: SourceCapability;
  /** Whether this source's local data directory exists on disk. */
  detect: () => Promise<boolean>;
  /** Read usage events (and optional rate-limit) since the given YYYY-MM-DD date. */
  read: (sinceDate: string) => Promise<SourceReadResult>;
};

async function dirExists(dir: string): Promise<boolean> {
  try {
    return (await fs.stat(dir)).isDirectory();
  } catch {
    return false;
  }
}

const claudeModule: SourceModule = {
  id: "claude-code",
  capability: "token",
  detect: () => dirExists(CLAUDE_DIR),
  read: async (sinceDate) => ({ events: await readClaudeUsage(sinceDate) }),
};

const codexModule: SourceModule = {
  id: "codex",
  capability: "token",
  detect: () => dirExists(CODEX_DIR),
  read: async (sinceDate) => {
    const { events, latestRateLimit } = await readCodexUsage(sinceDate);
    const rateLimit: UsageSnapshot["rateLimit"] = latestRateLimit
      ? {
          source: "codex",
          primaryUsedPercent: latestRateLimit.primaryUsedPercent,
          primaryResetsAt: latestRateLimit.primaryResetsAt,
          secondaryUsedPercent: latestRateLimit.secondaryUsedPercent,
          secondaryResetsAt: latestRateLimit.secondaryResetsAt,
          planType: latestRateLimit.planType,
        }
      : null;
    return { events, rateLimit };
  },
};

/** Every source the dashboard knows how to read, keyed by id. */
export const SOURCE_REGISTRY: Record<SourceId, SourceModule> = {
  "claude-code": claudeModule,
  codex: codexModule,
};

/**
 * Resolve enabled source IDs to their registered modules, preserving order and
 * silently skipping any id that isn't in the registry.
 */
export function getSourceModules(enabled: SourceId[]): SourceModule[] {
  return enabled
    .map((id) => SOURCE_REGISTRY[id])
    .filter((m): m is SourceModule => Boolean(m));
}
