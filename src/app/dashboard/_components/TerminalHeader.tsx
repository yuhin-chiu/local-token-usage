"use client";

import { Activity, RefreshCw } from "lucide-react";
import { fmtRelative } from "@/lib/format";

type Props = {
  range: 7 | 30 | 90;
  setRange: (r: 7 | 30 | 90) => void;
  metric: "tokens" | "cost";
  setMetric: (m: "tokens" | "cost") => void;
  generatedAt?: string;
  loading: boolean;
  onRefresh: () => void;
};

const styles = {
  bar: {
    background: "rgba(12,12,22,0.8)",
    border: "1px solid rgba(35,35,60,0.4)",
    borderRadius: 6,
  } as const,
  chip: (active: boolean) =>
    ({
      padding: "3px 10px",
      fontSize: 10,
      fontWeight: 600,
      fontFamily: "'JetBrains Mono', 'Cascadia Code', 'Fira Code', monospace",
      borderRadius: 4,
      border: "none",
      background: active ? "rgba(255,255,255,0.06)" : "transparent",
      color: active ? "#c8c8e0" : "#4a4a68",
      cursor: "pointer",
      transition: "all 0.12s ease",
      letterSpacing: "0.04em",
      textTransform: "uppercase" as const,
    } as const),
};

export function TerminalHeader({ range, setRange, metric, setMetric, generatedAt, loading, onRefresh }: Props) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4 pb-4"
      style={{ borderBottom: "1px solid rgba(30,30,55,0.3)" }}>
      {/* Left brand */}
      <div className="flex items-center gap-3">
        <div style={{
          width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(232,129,92,0.08)", borderRadius: 7,
          border: "1px solid rgba(232,129,92,0.15)",
        }}>
          <Activity size={16} style={{ color: "#e8815c" }} />
        </div>
        <div>
          <h1 className="text-[14px] font-bold tracking-tight font-mono" style={{ color: "#d4d4dc" }}>
            AI<span style={{ color: "#e8815c" }}>:</span>USAGE
          </h1>
          <div className="flex items-center gap-2 text-[10px] font-mono mt-0.5" style={{ color: "#4a4a68" }}>
            <span className="size-1.5 rounded-full" style={{ background: "#34d399", animation: "pulse 1.6s ease-in-out infinite" }} />
            <span style={{ color: "#34d399" }}>LIVE</span>
            {generatedAt && <span>· {fmtRelative(generatedAt)}</span>}
          </div>
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2">
        <div style={styles.bar}>
          {(["tokens", "cost"] as const).map((m) => (
            <button key={m} onClick={() => setMetric(m)} style={styles.chip(metric === m)}>
              {m}
            </button>
          ))}
        </div>

        <div style={styles.bar}>
          {([7, 30, 90] as const).map((d) => (
            <button key={d} onClick={() => setRange(d)} style={styles.chip(range === d)}>
              {d}D
            </button>
          ))}
        </div>

        <button
          onClick={onRefresh}
          disabled={loading}
          style={{
            ...styles.bar,
            padding: "5px 10px",
            display: "flex",
            alignItems: "center",
            cursor: loading ? "default" : "pointer",
            opacity: loading ? 0.3 : 1,
            color: "#60607a",
          }}
          aria-label="Refresh"
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
        </button>
      </div>
    </header>
  );
}
