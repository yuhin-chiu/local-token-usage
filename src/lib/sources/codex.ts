import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
import readline from "node:readline";
import { createReadStream } from "node:fs";
import { costFor } from "../pricing";
import type { UsageEvent } from "../types";

export const CODEX_DIR = path.join(os.homedir(), ".codex", "sessions");

async function walkJsonl(root: string): Promise<string[]> {
  const out: string[] = [];
  async function walk(dir: string) {
    let entries;
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) await walk(p);
      else if (e.isFile() && e.name.endsWith(".jsonl")) out.push(p);
    }
  }
  await walk(root);
  return out;
}

export type CodexRateLimit = {
  primaryUsedPercent?: number;
  primaryResetsAt?: string;
  secondaryUsedPercent?: number;
  secondaryResetsAt?: string;
  planType?: string;
  observedAt: string;
};

export async function readCodexUsage(
  sinceDate: string
): Promise<{ events: UsageEvent[]; latestRateLimit: CodexRateLimit | null }> {
  const files = await walkJsonl(CODEX_DIR);
  const since = new Date(sinceDate + "T00:00:00.000Z").getTime();
  const events: UsageEvent[] = [];
  let latest: CodexRateLimit | null = null;

  for (const file of files) {
    const stat = await fs.stat(file).catch(() => null);
    if (!stat) continue;
    if (stat.mtimeMs < since) continue;

    const sessionId = path.basename(file).replace(/^rollout-.*-([0-9a-f-]{36})\.jsonl$/, "$1");

    let sessionModel = "gpt-5";
    let project: string | undefined;
    let lastInput = 0;
    let lastOutput = 0;
    let lastCached = 0;
    let lastEventTs = "";

    const rl = readline.createInterface({
      input: createReadStream(file, { encoding: "utf8" }),
      crlfDelay: Infinity,
    });

    for await (const line of rl) {
      if (!line) continue;
      let row: Record<string, unknown>;
      try {
        row = JSON.parse(line);
      } catch {
        continue;
      }
      const type = row.type as string;
      const payload = row.payload as Record<string, unknown> | undefined;

      if (type === "session_meta" && payload) {
        const cwd = payload.cwd as string | undefined;
        if (cwd) project = cwd;
        const model = payload.model as string | undefined;
        if (model) sessionModel = model;
        continue;
      }

      if (type === "event_msg" && payload && payload.type === "token_count") {
        const ts = (row.timestamp as string) ?? "";
        const info = payload.info as Record<string, unknown> | null | undefined;
        if (info) {
          const total = (info.total_token_usage ?? info.last_token_usage) as Record<string, unknown> | undefined;
          if (total) {
            const input = Number(total.input_tokens ?? 0);
            const output = Number(total.output_tokens ?? 0);
            const cached = Number(total.cached_input_tokens ?? total.cache_read_input_tokens ?? 0);
            if (input > lastInput || output > lastOutput) {
              const dInput = Math.max(0, input - lastInput);
              const dOutput = Math.max(0, output - lastOutput);
              const dCached = Math.max(0, cached - lastCached);
              lastInput = input;
              lastOutput = output;
              lastCached = cached;
              lastEventTs = ts;
              if (ts && (dInput + dOutput) > 0) {
                const tsMs = new Date(ts).getTime();
                if (!Number.isNaN(tsMs) && tsMs >= since) {
                  const billableInput = Math.max(0, dInput - dCached);
                  events.push({
                    source: "codex",
                    timestamp: ts,
                    model: sessionModel,
                    inputTokens: billableInput,
                    outputTokens: dOutput,
                    cacheCreateTokens: 0,
                    cacheReadTokens: dCached,
                    project,
                    sessionId,
                    costUSD: costFor(sessionModel, {
                      input: billableInput,
                      output: dOutput,
                      cacheRead: dCached,
                    }),
                  });
                }
              }
            }
          }
        }
        const rateLimits = payload.rate_limits as Record<string, unknown> | undefined;
        if (rateLimits && ts) {
          const primary = rateLimits.primary as Record<string, unknown> | undefined;
          const secondary = rateLimits.secondary as Record<string, unknown> | undefined;
          const observed: CodexRateLimit = {
            primaryUsedPercent: primary ? Number(primary.used_percent) : undefined,
            primaryResetsAt: primary?.resets_at
              ? new Date(Number(primary.resets_at) * 1000).toISOString()
              : undefined,
            secondaryUsedPercent: secondary ? Number(secondary.used_percent) : undefined,
            secondaryResetsAt: secondary?.resets_at
              ? new Date(Number(secondary.resets_at) * 1000).toISOString()
              : undefined,
            planType: rateLimits.plan_type as string | undefined,
            observedAt: ts,
          };
          if (!latest || observed.observedAt > latest.observedAt) {
            latest = observed;
          }
        }
      }
    }
    void lastEventTs;
  }
  return { events, latestRateLimit: latest };
}
