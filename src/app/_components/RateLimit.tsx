import { Gauge, Timer } from "lucide-react";
import { fmtPct, fmtRelative } from "@/lib/format";

type Props = {
  primaryUsedPercent?: number;
  primaryResetsAt?: string;
  secondaryUsedPercent?: number;
  secondaryResetsAt?: string;
  planType?: string;
};

function Bar({ percent }: { percent?: number }) {
  const p = Math.max(0, Math.min(100, percent ?? 0));
  const color =
    p < 50 ? "from-emerald-400 to-emerald-500" :
    p < 80 ? "from-amber-300 to-amber-500" :
    "from-rose-400 to-rose-500";
  return (
    <div className="h-2 w-full bg-zinc-800/70 rounded-full overflow-hidden">
      <div
        className={`h-full bg-gradient-to-r ${color} rounded-full transition-[width] duration-700`}
        style={{ width: `${p}%` }}
      />
    </div>
  );
}

export function RateLimit({ primaryUsedPercent, primaryResetsAt, secondaryUsedPercent, secondaryResetsAt, planType }: Props) {
  if (primaryUsedPercent === undefined && secondaryUsedPercent === undefined) {
    return (
      <div className="card p-5">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] text-zinc-400 font-medium">
          <Gauge size={14} /> Codex Rate Limits
        </div>
        <div className="mt-4 text-sm text-zinc-500">No rate-limit signal yet.</div>
      </div>
    );
  }
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] text-zinc-400 font-medium">
          <Gauge size={14} /> Codex Rate Limits
        </div>
        {planType && (
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-violet-400/10 text-violet-300 ring-1 ring-inset ring-violet-400/30 uppercase tracking-wider">
            {planType}
          </span>
        )}
      </div>
      <div className="mt-4 space-y-4">
        <div>
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-1.5">
            <span>5-hour window</span>
            <span className="num text-zinc-100 font-medium">{fmtPct(primaryUsedPercent ?? 0)}</span>
          </div>
          <Bar percent={primaryUsedPercent} />
          {primaryResetsAt && (
            <div className="mt-1.5 text-[11px] text-zinc-500 num flex items-center gap-1">
              <Timer size={11} /> resets {fmtRelative(primaryResetsAt)}
            </div>
          )}
        </div>
        <div>
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-1.5">
            <span>Weekly window</span>
            <span className="num text-zinc-100 font-medium">{fmtPct(secondaryUsedPercent ?? 0)}</span>
          </div>
          <Bar percent={secondaryUsedPercent} />
          {secondaryResetsAt && (
            <div className="mt-1.5 text-[11px] text-zinc-500 num flex items-center gap-1">
              <Timer size={11} /> resets {fmtRelative(secondaryResetsAt)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
