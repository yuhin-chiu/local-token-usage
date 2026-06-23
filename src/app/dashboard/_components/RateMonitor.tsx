import { Gauge, Timer } from "lucide-react";
import { fmtPct, fmtRelative } from "@/lib/format";

type Props = {
  primaryUsedPercent?: number;
  primaryResetsAt?: string;
  secondaryUsedPercent?: number;
  secondaryResetsAt?: string;
  planType?: string;
};

function GaugeBar({ percent }: { percent?: number }) {
  const p = Math.max(0, Math.min(100, percent ?? 0));
  const color =
    p < 50 ? "linear-gradient(90deg, #34d399, #6ee7b7)" :
    p < 80 ? "linear-gradient(90deg, #fbbf24, #fcd34d)" :
    "linear-gradient(90deg, #fb7185, #fda4af)";
  return (
    <div className="h-1.5 w-full rounded-full overflow-hidden"
      style={{ background: "rgba(8,8,16,0.8)", boxShadow: "inset 0 1px 2px rgba(0,0,0,0.5)" }}>
      <div className="h-full rounded-full transition-[width] duration-700 ease-out"
        style={{ width: `${p}%`, background: color }} />
    </div>
  );
}

export function RateMonitor({ primaryUsedPercent, primaryResetsAt, secondaryUsedPercent, secondaryResetsAt, planType }: Props) {
  const empty = primaryUsedPercent === undefined && secondaryUsedPercent === undefined;

  return (
    <div style={{
      background: "linear-gradient(180deg, rgba(10,10,20,0.9), rgba(6,6,13,0.8))",
      border: "1px solid rgba(40,40,70,0.4)",
      borderRadius: 8,
      padding: "16px 20px",
      height: "100%",
    }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-[9px] tracking-[0.14em] font-bold font-mono"
          style={{ color: "#60607a" }}>
          <Gauge size={12} /> RATE LIMITS
        </div>
        {planType && (
          <span className="text-[8px] font-bold px-1.5 py-0.5 rounded font-mono uppercase tracking-wider"
            style={{ background: "rgba(139,124,240,0.1)", color: "#b0a5f8", border: "1px solid rgba(139,124,240,0.2)" }}>
            {planType}
          </span>
        )}
      </div>

      {empty ? (
        <div className="text-[10px] font-mono" style={{ color: "#3a3a58" }}>NO SIGNAL</div>
      ) : (
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between text-[10px] font-mono mb-1.5">
              <span style={{ color: "#4a4a68" }}>5H WINDOW</span>
              <span className="num font-semibold" style={{ color: "#c8c8e0" }}>
                {fmtPct(primaryUsedPercent ?? 0)}
              </span>
            </div>
            <GaugeBar percent={primaryUsedPercent} />
            {primaryResetsAt && (
              <div className="flex items-center gap-1 mt-1.5 text-[9px] font-mono" style={{ color: "#3a3a58" }}>
                <Timer size={9} />{fmtRelative(primaryResetsAt)}
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center justify-between text-[10px] font-mono mb-1.5">
              <span style={{ color: "#4a4a68" }}>WEEKLY</span>
              <span className="num font-semibold" style={{ color: "#c8c8e0" }}>
                {fmtPct(secondaryUsedPercent ?? 0)}
              </span>
            </div>
            <GaugeBar percent={secondaryUsedPercent} />
            {secondaryResetsAt && (
              <div className="flex items-center gap-1 mt-1.5 text-[9px] font-mono" style={{ color: "#3a3a58" }}>
                <Timer size={9} />{fmtRelative(secondaryResetsAt)}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
