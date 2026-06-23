"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { DailyBucket } from "@/lib/types";
import { fmtTokens, fmtCost, fmtShortDay } from "@/lib/format";

type Props = {
  data: DailyBucket[];
  metric: "tokens" | "cost";
};

export function DailyStack({ data, metric }: Props) {
  const rows = data.map((d) => ({
    date: d.date,
    claude: metric === "tokens" ? d.bySource["claude-code"].tokens : d.bySource["claude-code"].costUSD,
    codex: metric === "tokens" ? d.bySource.codex.tokens : d.bySource.codex.costUSD,
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: -4 }} barGap={0}>
        <CartesianGrid stroke="rgba(30,30,55,0.2)" vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="date"
          tickFormatter={fmtShortDay}
          tick={{ fill: "#4a4a68", fontSize: 10, fontFamily: "'JetBrains Mono','Cascadia Code',monospace" }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
          minTickGap={28}
        />
        <YAxis
          tickFormatter={(v: number) => (metric === "tokens" ? fmtTokens(v) : fmtCost(v))}
          tick={{ fill: "#4a4a68", fontSize: 10, fontFamily: "'JetBrains Mono','Cascadia Code',monospace" }}
          axisLine={false}
          tickLine={false}
          width={50}
        />
        <Tooltip
          cursor={{ fill: "rgba(255,255,255,0.015)" }}
          content={({ active, payload }) => {
            if (!active || !payload || !payload.length) return null;
            const row = payload[0]?.payload as { date: string; claude: number; codex: number };
            if (!row) return null;
            const total = row.claude + row.codex;
            return (
              <div style={{
                background: "#0c0c1a",
                border: "1px solid rgba(40,40,75,0.6)",
                borderRadius: 6,
                padding: "8px 12px",
                fontSize: 11,
                fontFamily: "'JetBrains Mono','Cascadia Code',monospace",
                boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
              }}>
                <div style={{ color: "#8888a8", marginBottom: 6, fontWeight: 600 }}>
                  {fmtShortDay(row.date)}
                </div>
                <div className="flex items-center gap-2" style={{ color: "#4a4a68" }}>
                  <span className="size-1.5 rounded-full" style={{ background: "#e8815c" }} />
                  CLAUDE
                  <span className="ml-4" style={{ color: "#d4d4dc" }}>
                    {metric === "tokens" ? fmtTokens(row.claude) : fmtCost(row.claude)}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1" style={{ color: "#4a4a68" }}>
                  <span className="size-1.5 rounded-full" style={{ background: "#8b7cf0" }} />
                  CODEX
                  <span className="ml-4" style={{ color: "#d4d4dc" }}>
                    {metric === "tokens" ? fmtTokens(row.codex) : fmtCost(row.codex)}
                  </span>
                </div>
                <div className="mt-2 pt-1.5 flex items-center" style={{ borderTop: "1px solid rgba(30,30,55,0.4)", color: "#4a4a68" }}>
                  TOTAL
                  <span className="ml-auto font-semibold" style={{ color: "#e8e8f4" }}>
                    {metric === "tokens" ? fmtTokens(total) : fmtCost(total)}
                  </span>
                </div>
              </div>
            );
          }}
        />
        <Bar dataKey="claude" stackId="s" fill="url(#claude-grad)" radius={[0, 0, 0, 0]} />
        <Bar dataKey="codex" stackId="s" fill="url(#codex-grad)" radius={[3, 3, 0, 0]} />
        <defs>
          <linearGradient id="claude-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f0a070" stopOpacity={1} />
            <stop offset="100%" stopColor="#e8815c" stopOpacity={0.65} />
          </linearGradient>
          <linearGradient id="codex-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#b0a5f8" stopOpacity={1} />
            <stop offset="100%" stopColor="#8b7cf0" stopOpacity={0.65} />
          </linearGradient>
        </defs>
      </BarChart>
    </ResponsiveContainer>
  );
}
