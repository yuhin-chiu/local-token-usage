import { loadConfig } from "./config";
import { SOURCE_REGISTRY, getSourceModules } from "./sources/registry";
import type { UsageEvent, UsageSnapshot, SourceId, DailyBucket, ModelBreakdown } from "./types";

const ALL_SOURCE_IDS = Object.keys(SOURCE_REGISTRY) as SourceId[];

function ymd(iso: string): string {
  return iso.slice(0, 10);
}

function emptySourceMap(): Record<SourceId, { tokens: number; costUSD: number; sessions: number }> {
  const m = {} as Record<SourceId, { tokens: number; costUSD: number; sessions: number }>;
  for (const id of ALL_SOURCE_IDS) m[id] = { tokens: 0, costUSD: 0, sessions: 0 };
  return m;
}

function emptyDailyBySource(): Record<SourceId, { tokens: number; costUSD: number }> {
  const m = {} as Record<SourceId, { tokens: number; costUSD: number }>;
  for (const id of ALL_SOURCE_IDS) m[id] = { tokens: 0, costUSD: 0 };
  return m;
}

function emptyDaily(date: string): DailyBucket {
  return {
    date,
    totalTokens: 0,
    inputTokens: 0,
    outputTokens: 0,
    cacheCreateTokens: 0,
    cacheReadTokens: 0,
    costUSD: 0,
    bySource: emptyDailyBySource(),
  };
}

function eventTokens(e: UsageEvent): number {
  return e.inputTokens + e.outputTokens + e.cacheCreateTokens + e.cacheReadTokens;
}

export async function buildSnapshot(daysBack = 30): Promise<UsageSnapshot> {
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const sinceDate = new Date(today.getTime() - daysBack * 86400 * 1000).toISOString().slice(0, 10);

  const warnings: string[] = [];
  const { enabledSources } = loadConfig();
  const modules = getSourceModules(enabledSources);
  const results = await Promise.allSettled(modules.map((m) => m.read(sinceDate)));

  const events: UsageEvent[] = [];
  let rateLimit: UsageSnapshot["rateLimit"] = null;
  results.forEach((res, i) => {
    const id = modules[i].id;
    if (res.status === "fulfilled") {
      events.push(...res.value.events);
      if (res.value.rateLimit && !rateLimit) rateLimit = res.value.rateLimit;
    } else {
      warnings.push(`${id} source failed: ${String(res.reason)}`);
    }
  });

  const dailyMap = new Map<string, DailyBucket>();
  for (let i = 0; i <= daysBack; i++) {
    const d = new Date(today.getTime() - i * 86400 * 1000).toISOString().slice(0, 10);
    dailyMap.set(d, emptyDaily(d));
  }

  const modelMap = new Map<string, ModelBreakdown>();
  const todayModelMap = new Map<string, ModelBreakdown>();
  const todayModelSessions = new Map<string, Set<string>>();
  const todayBySource = emptySourceMap();
  const todaySessions = new Set<string>();
  const allSessions = new Set<string>();
  const sessionsPerSource = {} as Record<SourceId, Set<string>>;
  const todaySessionsPerSource = {} as Record<SourceId, Set<string>>;
  for (const id of ALL_SOURCE_IDS) {
    sessionsPerSource[id] = new Set();
    todaySessionsPerSource[id] = new Set();
  }
  const modelSessions = new Map<string, Set<string>>();

  let todayInput = 0, todayOutput = 0, todayCacheCreate = 0, todayCacheRead = 0, todayCost = 0;
  let totalTokens = 0, totalCost = 0;

  for (const e of events) {
    const day = ymd(e.timestamp);
    const tokens = eventTokens(e);
    totalTokens += tokens;
    totalCost += e.costUSD;
    allSessions.add(`${e.source}:${e.sessionId}`);
    sessionsPerSource[e.source].add(e.sessionId);

    const bucket = dailyMap.get(day);
    if (bucket) {
      bucket.totalTokens += tokens;
      bucket.inputTokens += e.inputTokens;
      bucket.outputTokens += e.outputTokens;
      bucket.cacheCreateTokens += e.cacheCreateTokens;
      bucket.cacheReadTokens += e.cacheReadTokens;
      bucket.costUSD += e.costUSD;
      bucket.bySource[e.source].tokens += tokens;
      bucket.bySource[e.source].costUSD += e.costUSD;
    }

    const modelKey = `${e.source}::${e.model}`;
    let m = modelMap.get(modelKey);
    if (!m) {
      m = { model: e.model, source: e.source, tokens: 0, costUSD: 0, sessions: 0 };
      modelMap.set(modelKey, m);
      modelSessions.set(modelKey, new Set());
    }
    m.tokens += tokens;
    m.costUSD += e.costUSD;
    modelSessions.get(modelKey)!.add(e.sessionId);

    if (day === todayStr) {
      todayInput += e.inputTokens;
      todayOutput += e.outputTokens;
      todayCacheCreate += e.cacheCreateTokens;
      todayCacheRead += e.cacheReadTokens;
      todayCost += e.costUSD;
      todayBySource[e.source].tokens += tokens;
      todayBySource[e.source].costUSD += e.costUSD;
      todaySessions.add(`${e.source}:${e.sessionId}`);
      todaySessionsPerSource[e.source].add(e.sessionId);

      let tm = todayModelMap.get(modelKey);
      if (!tm) {
        tm = { model: e.model, source: e.source, tokens: 0, costUSD: 0, sessions: 0 };
        todayModelMap.set(modelKey, tm);
        todayModelSessions.set(modelKey, new Set());
      }
      tm.tokens += tokens;
      tm.costUSD += e.costUSD;
      todayModelSessions.get(modelKey)!.add(e.sessionId);
    }
  }

  for (const [key, set] of modelSessions) {
    const m = modelMap.get(key);
    if (m) m.sessions = set.size;
  }
  for (const [key, set] of todayModelSessions) {
    const m = todayModelMap.get(key);
    if (m) m.sessions = set.size;
  }

  const daily = [...dailyMap.values()].sort((a, b) => a.date.localeCompare(b.date));
  const models = [...modelMap.values()].sort((a, b) => b.tokens - a.tokens);
  const todayModels = [...todayModelMap.values()].sort((a, b) => b.tokens - a.tokens);

  return {
    generatedAt: new Date().toISOString(),
    today: {
      date: todayStr,
      totalTokens: todayInput + todayOutput + todayCacheCreate + todayCacheRead,
      inputTokens: todayInput,
      outputTokens: todayOutput,
      cacheCreateTokens: todayCacheCreate,
      cacheReadTokens: todayCacheRead,
      costUSD: todayCost,
      sessions: todaySessions.size,
      bySource: (() => {
        const m = {} as Record<SourceId, { tokens: number; costUSD: number; sessions: number }>;
        for (const id of ALL_SOURCE_IDS) {
          m[id] = {
            tokens: todayBySource[id].tokens,
            costUSD: todayBySource[id].costUSD,
            sessions: todaySessionsPerSource[id].size,
          };
        }
        return m;
      })(),
    },
    totals: {
      tokens: totalTokens,
      costUSD: totalCost,
      sessions: allSessions.size,
      sinceDate,
    },
    daily,
    models,
    todayModels,
    sources: modules.map((m) => ({ id: m.id, capability: m.capability })),
    rateLimit,
    warnings,
  };
}
