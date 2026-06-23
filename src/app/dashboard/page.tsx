"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { fmtTokens, fmtCost, fmtRelative } from "@/lib/format";
import type { DailyBucket, ModelBreakdown, UsageSnapshot } from "@/lib/types";

type Range = "today" | "yesterday" | 7 | 30 | 90;

// ─── utils ───────────────────────────────────────────────────────────────────

function apiDays(r: Range): number {
  return typeof r === "number" ? r : 14;
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

const TODAY_STR = isoDate(new Date());
const YESTERDAY_STR = (() => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return isoDate(d);
})();

function shortDay(iso: string) {
  const d = new Date(iso + "T00:00:00.000Z");
  return isNaN(d.getTime()) ? iso : d.toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric", timeZone: "UTC",
  });
}

function pct(v: number, max: number) {
  return max > 0 ? Math.min(100, (v / max) * 100) : 0;
}

// ─── StatCard ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, accent }: {
  label: string; value: string; sub?: string; accent?: string;
}) {
  return (
    <div style={{
      padding: "16px 18px",
      background: "rgba(255,255,255,0.025)",
      border: "1px solid rgba(255,255,255,0.06)",
      borderRadius: 12,
    }}>
      <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.14em", color: "#5a5a72", fontWeight: 700, marginBottom: 8 }}>
        {label}
      </div>
      <div style={{
        fontFamily: "'DM Mono', var(--font-dm-mono), monospace",
        fontSize: 26, fontWeight: 500, color: accent ?? "#e8e8f2",
        letterSpacing: "-0.02em", lineHeight: 1,
      }}>
        {value}
      </div>
      {sub && <div style={{ marginTop: 7, fontSize: 11, color: "#44445a" }}>{sub}</div>}
    </div>
  );
}

// ─── DailyRow ─────────────────────────────────────────────────────────────────

function DailyRow({ bucket, maxTokens, isToday }: {
  bucket: DailyBucket; maxTokens: number; isToday: boolean;
}) {
  const claude = bucket.bySource["claude-code"]?.tokens ?? 0;
  const codex  = bucket.bySource.codex?.tokens ?? 0;
  const total  = bucket.totalTokens;
  const empty  = total === 0;
  const claudeW = pct(claude, maxTokens);
  const codexW  = pct(codex, maxTokens);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "132px 1fr 88px 72px 80px 76px",
        gap: "0 12px",
        alignItems: "center",
        padding: "11px 16px",
        borderRadius: 8,
        background: isToday ? "rgba(217,119,87,0.05)" : "transparent",
        borderLeft: isToday ? "2px solid rgba(217,119,87,0.5)" : "2px solid transparent",
        transition: "background 0.12s",
      }}
      onMouseEnter={e => { if (!isToday) e.currentTarget.style.background = "rgba(255,255,255,0.022)"; }}
      onMouseLeave={e => { if (!isToday) e.currentTarget.style.background = "transparent"; }}
    >
      <div style={{
        fontFamily: "var(--font-syne), Syne, sans-serif",
        fontSize: 12, fontWeight: isToday ? 700 : 500,
        color: isToday ? "#d97757" : "#8888a8",
        display: "flex", alignItems: "center", gap: 7,
      }}>
        {shortDay(bucket.date)}
        {isToday && (
          <span style={{
            fontSize: 8, fontWeight: 800, padding: "1px 5px",
            background: "rgba(217,119,87,0.15)", color: "#d97757",
            borderRadius: 3, letterSpacing: "0.06em",
          }}>TODAY</span>
        )}
      </div>

      <div style={{ position: "relative", height: 5, borderRadius: 3, background: "rgba(255,255,255,0.04)" }}>
        {!empty && (
          <>
            <div style={{
              position: "absolute", top: 0, left: 0, bottom: 0,
              width: `${claudeW}%`, background: "#d97757", opacity: 0.8,
              borderRadius: "3px 0 0 3px",
            }} />
            <div style={{
              position: "absolute", top: 0, bottom: 0,
              left: `${claudeW}%`, width: `${codexW}%`,
              background: "#a78bfa", opacity: 0.8,
              borderRadius: codexW > 0 ? "0 3px 3px 0" : 0,
            }} />
          </>
        )}
      </div>

      <div style={{ textAlign: "right", fontFamily: "'DM Mono', var(--font-dm-mono), monospace", fontSize: 12, fontWeight: 500, color: empty ? "#2e2e42" : "#d0d0e0" }}>
        {empty ? "—" : fmtTokens(total)}
      </div>
      <div style={{ textAlign: "right", fontFamily: "'DM Mono', var(--font-dm-mono), monospace", fontSize: 12, color: empty ? "#2e2e42" : "#6868a0" }}>
        {empty ? "—" : fmtCost(bucket.costUSD)}
      </div>
      <div style={{ textAlign: "right", fontFamily: "'DM Mono', var(--font-dm-mono), monospace", fontSize: 11, color: claude > 0 ? "#c07040" : "#2e2e42" }}>
        {claude > 0 ? fmtTokens(claude) : "—"}
      </div>
      <div style={{ textAlign: "right", fontFamily: "'DM Mono', var(--font-dm-mono), monospace", fontSize: 11, color: codex > 0 ? "#8870cc" : "#2e2e42" }}>
        {codex > 0 ? fmtTokens(codex) : "—"}
      </div>
    </div>
  );
}

// ─── ModelRow ─────────────────────────────────────────────────────────────────

function ModelRow({ model, maxTokens, rank }: {
  model: ModelBreakdown; maxTokens: number; rank: number;
}) {
  const w = pct(model.tokens, maxTokens);
  const name = model.model
    .replace(/^claude-/, "")
    .replace(/-\d{8}$/, "")
    .replace(/-/g, " ");

  return (
    <div
      style={{ display: "grid", gridTemplateColumns: "22px 1fr 88px 76px 48px", gap: "0 12px", alignItems: "center", padding: "9px 12px", borderRadius: 6, transition: "background 0.12s" }}
      onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.025)"}
      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
    >
      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#38384e", textAlign: "right" }}>{rank}</div>
      <div>
        <div style={{ fontSize: 12, color: "#c0c0d8", fontWeight: 500, textTransform: "capitalize" }}>{name}</div>
        <div style={{ marginTop: 4, height: 2, borderRadius: 1, background: "rgba(255,255,255,0.04)", overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${w}%`, background: model.source === "claude-code" ? "#d97757" : "#a78bfa", opacity: 0.6, borderRadius: 1 }} />
        </div>
      </div>
      <div style={{ textAlign: "right", fontFamily: "'DM Mono', monospace", fontSize: 12, color: "#b0b0c8" }}>{fmtTokens(model.tokens)}</div>
      <div style={{ textAlign: "right", fontFamily: "'DM Mono', monospace", fontSize: 12, color: "#606080" }}>{fmtCost(model.costUSD)}</div>
      <div style={{ textAlign: "right", fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#3e3e58" }}>×{model.sessions}</div>
    </div>
  );
}

// ─── TrendChart ───────────────────────────────────────────────────────────────

function TrendChart({ data }: { data: DailyBucket[] }) {
  const n = data.length;
  if (n === 0) return null;

  const maxVal = Math.max(1, ...data.map(d => d.totalTokens));
  const BAR_H = 130; // max bar height in px
  const showValueLabel = n <= 14;

  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: n > 30 ? 1 : n > 14 ? 2 : 4, padding: "8px 4px 0" }}>
      {data.map((d, i) => {
        const claude = d.bySource["claude-code"]?.tokens ?? 0;
        const codex  = d.bySource.codex?.tokens ?? 0;
        const total  = d.totalTokens;

        const claudeH = (claude / maxVal) * BAR_H;
        const codexH  = (codex  / maxVal) * BAR_H;

        const showDate = n <= 14 || i % 7 === 0;

        return (
          <div key={d.date} style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", alignItems: "center" }}>
            {/* Value label */}
            <div style={{ height: 18, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
              {showValueLabel && total > 0 && (
                <span style={{
                  fontSize: 9, color: "#5858a0", lineHeight: 1, marginBottom: 3,
                  fontFamily: "'DM Mono', var(--font-dm-mono), monospace",
                  whiteSpace: "nowrap",
                }}>
                  {fmtTokens(total)}
                </span>
              )}
            </div>

            {/* Bar */}
            <div style={{ width: "100%", height: BAR_H, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
              {total > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", borderRadius: "3px 3px 0 0", overflow: "hidden" }}>
                  {/* Claude on top */}
                  {claude > 0 && (
                    <div style={{ height: claudeH, background: "#d97757", opacity: 0.85 }} />
                  )}
                  {/* Codex at bottom */}
                  {codex > 0 && (
                    <div style={{ height: codexH, background: "#a78bfa", opacity: 0.85 }} />
                  )}
                </div>
              ) : (
                <div style={{ height: 2, background: "rgba(255,255,255,0.05)", borderRadius: 1 }} />
              )}
            </div>

            {/* Baseline */}
            <div style={{ width: "100%", height: 1, background: "rgba(255,255,255,0.05)" }} />

            {/* Date label */}
            <div style={{ height: 20, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {showDate && (
                <span style={{
                  fontSize: 9, color: "#38385a", textAlign: "center",
                  fontFamily: "'DM Mono', var(--font-dm-mono), monospace",
                  whiteSpace: "nowrap",
                }}>
                  {shortDay(d.date).replace(/\s\d+$/, m => m).slice(0, n <= 14 ? 6 : 3)}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── RangeBtn helper ──────────────────────────────────────────────────────────

const RANGE_BTNS: { r: Range; label: string }[] = [
  { r: "today",     label: "Today"     },
  { r: "yesterday", label: "Yesterday" },
  { r: 7,           label: "7d"        },
  { r: 30,          label: "30d"       },
  { r: 90,          label: "90d"       },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [range, setRange] = useState<Range>(7);
  const [data, setData] = useState<UsageSnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/usage?days=${apiDays(range)}`, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setData(await res.json() as UsageSnapshot);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, 30_000);
    return () => clearInterval(id);
  }, [fetchData]);

  // All available daily buckets from API
  const allDays = useMemo(() => data?.daily ?? [], [data]);

  // Filtered rows for the selected range
  const recent = useMemo(() => {
    if (range === "today")     return allDays.filter(d => d.date === TODAY_STR);
    if (range === "yesterday") return allDays.filter(d => d.date === YESTERDAY_STR);
    return allDays.slice(-range);
  }, [allDays, range]);

  // Trend chart always shows last 14 days for today/yesterday, otherwise the selected range
  const trendData = useMemo(() => {
    if (range === "today" || range === "yesterday") return allDays.slice(-14);
    return allDays.slice(-range);
  }, [allDays, range]);

  const listRows     = useMemo(() => [...recent].reverse(), [recent]);
  const maxTokens    = useMemo(() => Math.max(1, ...recent.map(d => d.totalTokens)), [recent]);
  const periodTokens = useMemo(() => recent.reduce((s, d) => s + d.totalTokens, 0), [recent]);
  const periodCost   = useMemo(() => recent.reduce((s, d) => s + d.costUSD, 0), [recent]);
  const activeDays   = useMemo(() => recent.filter(d => d.totalTokens > 0).length, [recent]);

  // For single-day views: pull the target bucket
  const targetBucket = useMemo(() => {
    if (range === "today")     return allDays.find(d => d.date === TODAY_STR);
    if (range === "yesterday") return allDays.find(d => d.date === YESTERDAY_STR);
    return undefined;
  }, [allDays, range]);

  // Models: today uses todayModels; everything else uses data.models
  const topModels = useMemo(() => {
    const src = range === "today" ? (data?.todayModels ?? []) : (data?.models ?? []);
    return src.slice(0, 12);
  }, [data, range]);
  const maxModel = useMemo(() => Math.max(1, ...topModels.map(m => m.tokens)), [topModels]);

  // Source display for stat section
  const claudeSrc = range === "today"
    ? data?.today.bySource["claude-code"]
    : targetBucket?.bySource["claude-code"] ?? data?.today.bySource["claude-code"];
  const codexSrc = range === "today"
    ? data?.today.bySource.codex
    : targetBucket?.bySource.codex ?? data?.today.bySource.codex;

  // Stat card values
  const statTokens = range === "today" ? (data?.today.totalTokens ?? 0) : periodTokens;
  const statCost   = range === "today" ? (data?.today.costUSD ?? 0) : periodCost;
  const statSub1   = range === "today"
    ? `In ${fmtTokens(data?.today.inputTokens ?? 0)}  ·  Out ${fmtTokens(data?.today.outputTokens ?? 0)}`
    : `${activeDays} active day${activeDays !== 1 ? "s" : ""}`;
  const statSub2   = range === "today"
    ? `${data?.today.sessions ?? 0} sessions`
    : `avg ${fmtCost(periodCost / Math.max(1, activeDays))}/day`;

  const rangeLabel = range === "today" ? "Today" : range === "yesterday" ? "Yesterday" : `${range}d`;
  const todayDate  = data?.today.date ?? TODAY_STR;

  // Shared styles
  const section: React.CSSProperties = {
    background: "rgba(255,255,255,0.02)",
    border: "1px solid rgba(255,255,255,0.055)",
    borderRadius: 14, overflow: "hidden",
    marginBottom: 12,
  };
  const sectionHead: React.CSSProperties = { padding: "14px 20px 12px", borderBottom: "1px solid rgba(255,255,255,0.05)" };
  const colHead: React.CSSProperties = { fontSize: 10, textTransform: "uppercase", letterSpacing: "0.12em", color: "#38384e", fontWeight: 700 };

  return (
    <div style={{ minHeight: "100vh", background: "#07090e", fontFamily: "var(--font-syne), Syne, system-ui, sans-serif", color: "#e0e0f0" }}>
      {/* Ambient glows */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none",
        background: [
          "radial-gradient(ellipse 60% 40% at 15% 0%, rgba(217,119,87,0.07) 0%, transparent 60%)",
          "radial-gradient(ellipse 50% 35% at 85% 0%, rgba(167,139,250,0.08) 0%, transparent 60%)",
        ].join(", "),
      }} />

      <div style={{ position: "relative", maxWidth: 1080, margin: "0 auto", padding: "28px 24px 56px" }}>

        {/* ── HEADER ─────────────────────────────────────────── */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 24, gap: 16, flexWrap: "wrap" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, letterSpacing: "-0.03em", color: "#eeeef8" }}>AI Usage</h1>
            <p style={{ margin: "4px 0 0", fontSize: 12, color: "#44445a" }}>Claude Code · Codex CLI · local data only</p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* Range selector */}
            <div style={{ display: "flex", gap: 2, padding: 2, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 9 }}>
              {RANGE_BTNS.map(({ r, label }) => (
                <button key={String(r)} onClick={() => setRange(r)} style={{
                  padding: "5px 12px", border: "none", borderRadius: 7,
                  background: range === r ? "rgba(255,255,255,0.09)" : "transparent",
                  color: range === r ? "#e0e0f0" : "#5a5a72",
                  fontSize: 12, fontWeight: 700, cursor: "pointer",
                  fontFamily: "inherit", transition: "all 0.15s",
                }}>
                  {label}
                </button>
              ))}
            </div>

            <button onClick={fetchData} disabled={loading} style={{
              padding: "6px 14px", border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 8, background: "rgba(255,255,255,0.04)",
              color: loading ? "#3a3a52" : "#6a6a82", fontSize: 12, fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit", transition: "all 0.15s",
            }}>
              {loading ? "…" : "Refresh"}
            </button>

            {data && (
              <span style={{ fontSize: 11, color: "#32324a", fontFamily: "'DM Mono', var(--font-dm-mono), monospace" }}>
                {fmtRelative(data.generatedAt)}
              </span>
            )}
          </div>
        </div>

        {error && (
          <div style={{ marginBottom: 16, padding: "10px 16px", background: "rgba(251,113,133,0.06)", border: "1px solid rgba(251,113,133,0.18)", borderRadius: 8, fontSize: 12, color: "#fb7185" }}>
            {error}
          </div>
        )}

        {/* ── STAT CARDS ─────────────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 12 }}>
          <StatCard label={`${rangeLabel} · Tokens`} accent="#d97757" value={fmtTokens(statTokens)} sub={statSub1} />
          <StatCard label={`${rangeLabel} · Cost`}   accent="#34d399" value={fmtCost(statCost)}      sub={statSub2} />
          <StatCard label="Claude" accent="#d97757" value={fmtTokens(claudeSrc?.tokens ?? 0)} sub={fmtCost(claudeSrc?.costUSD ?? 0)} />
          <StatCard label="Codex"  accent="#a78bfa" value={fmtTokens(codexSrc?.tokens ?? 0)}  sub={fmtCost(codexSrc?.costUSD ?? 0)} />
        </div>

        {/* ── SOURCE SPLIT ───────────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
          <div style={{ padding: "14px 18px", borderRadius: 12, background: "rgba(217,119,87,0.04)", border: "1px solid rgba(217,119,87,0.14)", display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#d97757", flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#a05030", marginBottom: 3, letterSpacing: "0.04em" }}>Claude Code</div>
              <div style={{ fontFamily: "'DM Mono', var(--font-dm-mono), monospace", fontSize: 20, fontWeight: 500, color: "#d97757" }}>
                {fmtTokens(claudeSrc?.tokens ?? 0)}
                <span style={{ fontSize: 12, color: "#505068", marginLeft: 8 }}>{fmtCost(claudeSrc?.costUSD ?? 0)}</span>
              </div>
            </div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#3e3e58" }}>
              {(range === "today" ? data?.today.bySource["claude-code"]?.sessions : undefined) ?? 0} sessions
            </div>
          </div>

          <div style={{ padding: "14px 18px", borderRadius: 12, background: "rgba(167,139,250,0.04)", border: "1px solid rgba(167,139,250,0.14)", display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#a78bfa", flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#7060a8", marginBottom: 3, letterSpacing: "0.04em" }}>Codex CLI</div>
              <div style={{ fontFamily: "'DM Mono', var(--font-dm-mono), monospace", fontSize: 20, fontWeight: 500, color: "#a78bfa" }}>
                {fmtTokens(codexSrc?.tokens ?? 0)}
                <span style={{ fontSize: 12, color: "#505068", marginLeft: 8 }}>{fmtCost(codexSrc?.costUSD ?? 0)}</span>
              </div>
            </div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#3e3e58" }}>
              {(range === "today" ? data?.today.bySource.codex?.sessions : undefined) ?? 0} sessions
            </div>
          </div>
        </div>

        {/* ── RATE LIMITS ────────────────────────────────────── */}
        {data?.rateLimit && (data.rateLimit.primaryUsedPercent !== undefined || data.rateLimit.secondaryUsedPercent !== undefined) && (
          <div style={{ padding: "14px 20px", borderRadius: 12, marginBottom: 12, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
            <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.14em", color: "#3e3e58", fontWeight: 700, marginBottom: 10 }}>
              Rate Limits{data.rateLimit.planType ? ` · ${data.rateLimit.planType}` : ""}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {data.rateLimit.primaryUsedPercent !== undefined && (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <span style={{ fontSize: 11, color: "#606078" }}>5h window</span>
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#8888a8" }}>
                      {data.rateLimit.primaryUsedPercent.toFixed(1)}%
                      {data.rateLimit.primaryResetsAt && ` · resets ${fmtRelative(data.rateLimit.primaryResetsAt)}`}
                    </span>
                  </div>
                  <div style={{ height: 3, borderRadius: 2, background: "rgba(255,255,255,0.05)", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${Math.min(100, data.rateLimit.primaryUsedPercent)}%`, borderRadius: 2, background: data.rateLimit.primaryUsedPercent > 80 ? "#fb7185" : data.rateLimit.primaryUsedPercent > 60 ? "#fbbf24" : "#34d399" }} />
                  </div>
                </div>
              )}
              {data.rateLimit.secondaryUsedPercent !== undefined && (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <span style={{ fontSize: 11, color: "#606078" }}>Weekly window</span>
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#8888a8" }}>
                      {data.rateLimit.secondaryUsedPercent.toFixed(1)}%
                      {data.rateLimit.secondaryResetsAt && ` · resets ${fmtRelative(data.rateLimit.secondaryResetsAt)}`}
                    </span>
                  </div>
                  <div style={{ height: 3, borderRadius: 2, background: "rgba(255,255,255,0.05)", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${Math.min(100, data.rateLimit.secondaryUsedPercent)}%`, borderRadius: 2, background: data.rateLimit.secondaryUsedPercent > 80 ? "#fb7185" : data.rateLimit.secondaryUsedPercent > 60 ? "#fbbf24" : "#a78bfa" }} />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── DAILY LIST ─────────────────────────────────────── */}
        <div style={section}>
          <div style={sectionHead}>
            <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.14em", color: "#3e3e58", fontWeight: 700 }}>Daily Breakdown</div>
            <div style={{ marginTop: 3, fontSize: 14, fontWeight: 700, color: "#d0d0e8" }}>
              {range === "today" ? "Today" : range === "yesterday" ? "Yesterday" : `Last ${range} days · newest first`}
            </div>
          </div>

          {/* Legend */}
          <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "8px 18px 0", fontSize: 11, color: "#40405a" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ display: "inline-block", width: 8, height: 4, borderRadius: 2, background: "#d97757", opacity: 0.8 }} />Claude
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ display: "inline-block", width: 8, height: 4, borderRadius: 2, background: "#a78bfa", opacity: 0.8 }} />Codex
            </div>
          </div>

          {/* Column headers */}
          <div style={{ display: "grid", gridTemplateColumns: "132px 1fr 88px 72px 80px 76px", gap: "0 12px", padding: "6px 16px 6px", ...colHead }}>
            <div>Date</div>
            <div>Distribution</div>
            <div style={{ textAlign: "right" }}>Tokens</div>
            <div style={{ textAlign: "right" }}>Cost</div>
            <div style={{ textAlign: "right", color: "#603020" }}>Claude</div>
            <div style={{ textAlign: "right", color: "#503880" }}>Codex</div>
          </div>

          <div style={{ padding: "2px 4px 8px" }}>
            {listRows.length > 0
              ? listRows.map(b => <DailyRow key={b.date} bucket={b} maxTokens={maxTokens} isToday={b.date === todayDate} />)
              : <div style={{ padding: "32px 16px", textAlign: "center", fontSize: 12, color: "#32324a" }}>{loading ? "Loading…" : "No data"}</div>
            }
          </div>
        </div>

        {/* ── MODEL TABLE ────────────────────────────────────── */}
        <div style={section}>
          <div style={sectionHead}>
            <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.14em", color: "#3e3e58", fontWeight: 700 }}>Top Models</div>
            <div style={{ marginTop: 3, fontSize: 14, fontWeight: 700, color: "#d0d0e8" }}>
              By token usage · {rangeLabel}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "22px 1fr 88px 76px 48px", gap: "0 12px", padding: "6px 12px 6px", ...colHead }}>
            <div>#</div>
            <div>Model</div>
            <div style={{ textAlign: "right" }}>Tokens</div>
            <div style={{ textAlign: "right" }}>Cost</div>
            <div style={{ textAlign: "right" }}>Sessions</div>
          </div>

          <div style={{ padding: "2px 4px 8px" }}>
            {topModels.length > 0
              ? topModels.map((m, i) => <ModelRow key={`${m.model}-${m.source}`} model={m} maxTokens={maxModel} rank={i + 1} />)
              : <div style={{ padding: "24px 16px", textAlign: "center", fontSize: 12, color: "#32324a" }}>{loading ? "Loading…" : "No data"}</div>
            }
          </div>
        </div>

        {/* ── TREND CHART ────────────────────────────────────── */}
        <div style={{ ...section, marginBottom: 0 }}>
          <div style={sectionHead}>
            <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.14em", color: "#3e3e58", fontWeight: 700 }}>Usage Trend</div>
            <div style={{ marginTop: 3, fontSize: 14, fontWeight: 700, color: "#d0d0e8", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span>
                {(range === "today" || range === "yesterday") ? "Last 14 days context" : `Last ${range} days · daily tokens`}
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 11, fontWeight: 400, color: "#40405a" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 2, background: "#d97757", opacity: 0.85 }} />Claude
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 2, background: "#a78bfa", opacity: 0.85 }} />Codex
                </div>
              </div>
            </div>
          </div>

          <div style={{ padding: "4px 16px 4px" }}>
            {trendData.length > 0
              ? <TrendChart data={trendData} />
              : <div style={{ padding: "32px 0", textAlign: "center", fontSize: 12, color: "#32324a" }}>{loading ? "Loading…" : "No data"}</div>
            }
          </div>
        </div>

        {/* ── FOOTER ─────────────────────────────────────────── */}
        <div style={{ marginTop: 28, textAlign: "center" }}>
          <p style={{ fontSize: 11, color: "#222232", fontFamily: "'DM Mono', var(--font-dm-mono), monospace" }}>
            reads ~/.claude/projects & ~/.codex/sessions · no data leaves your machine
          </p>
        </div>
      </div>
    </div>
  );
}
