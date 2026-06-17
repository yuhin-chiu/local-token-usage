"use client";

import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { DailyBucket } from "@/lib/types";
import { fmtTokens, fmtCost, fmtShortDay } from "@/lib/format";

export function TrendChart({ data, metric }: { data: DailyBucket[]; metric: "tokens" | "cost" }) {
  const rows = data.map((d) => ({
    date: d.date,
    v: metric === "tokens" ? d.totalTokens : d.costUSD,
  }));

  return (
    <ResponsiveContainer width="100%" height={140}>
      <AreaChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: -10 }}>
        <defs>
          <linearGradient id="g-trend" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#34d399" stopOpacity={0.55} />
            <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="date" hide />
        <YAxis hide domain={[0, "auto"]} />
        <Tooltip
          cursor={{ stroke: "rgba(161,161,170,0.25)" }}
          content={({ active, payload }) => {
            if (!active || !payload || !payload.length) return null;
            const row = payload[0].payload as { date: string; v: number };
            return (
              <div className="card !rounded-lg px-2.5 py-1.5 text-xs num shadow-xl">
                <div className="text-zinc-400">{fmtShortDay(row.date)}</div>
                <div className="text-zinc-50 font-medium">
                  {metric === "tokens" ? fmtTokens(row.v) : fmtCost(row.v)}
                </div>
              </div>
            );
          }}
        />
        <Area
          type="monotone"
          dataKey="v"
          stroke="#34d399"
          strokeWidth={2}
          fill="url(#g-trend)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
