"use client";

import { Area, AreaChart, ResponsiveContainer } from "recharts";
import type { DailyBucket } from "@/lib/types";

type Props = {
  data: DailyBucket[];
  metric: "tokens" | "cost";
  accent: string;
};

export function SparkLine({ data, metric, accent }: Props) {
  const rows = data.map((d) => ({
    d: d.date,
    v: metric === "tokens" ? d.totalTokens : d.costUSD,
  }));

  return (
    <ResponsiveContainer width="100%" height={32}>
      <AreaChart data={rows} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={`sl-${accent.slice(1)}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={accent} stopOpacity={0.25} />
            <stop offset="100%" stopColor={accent} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="v"
          stroke={accent}
          strokeWidth={1.5}
          fill={`url(#sl-${accent.slice(1)})`}
          dot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
