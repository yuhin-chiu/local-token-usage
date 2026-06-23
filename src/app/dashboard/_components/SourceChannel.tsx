import type { UsageSnapshot } from "@/lib/types";
import { fmtTokens, fmtCost } from "@/lib/format";

export function SourceChannel({ today }: { today: UsageSnapshot["today"] }) {
  const total = Math.max(1, today.totalTokens);
  const claude = today.bySource["claude-code"];
  const codex = today.bySource.codex;
  const cPct = (claude.tokens / total) * 100;
  const xPct = (codex.tokens / total) * 100;

  return (
    <div style={{
      background: "linear-gradient(180deg, rgba(10,10,20,0.9), rgba(6,6,13,0.8))",
      border: "1px solid rgba(40,40,70,0.4)",
      borderRadius: 8,
      padding: "16px 20px",
      height: "100%",
    }}>
      <div className="text-[9px] tracking-[0.14em] font-bold font-mono mb-4"
        style={{ color: "#60607a" }}>
        SIGNAL SOURCE
      </div>

      {/* Split bar */}
      <div className="h-2 w-full rounded-full overflow-hidden flex"
        style={{ background: "rgba(8,8,16,0.8)", boxShadow: "inset 0 1px 2px rgba(0,0,0,0.5)" }}>
        <div className="h-full transition-[width] duration-700 ease-out"
          style={{ width: `${cPct}%`, background: "linear-gradient(90deg, #e8815c, #f0a070)" }} />
        <div className="h-full transition-[width] duration-700 ease-out"
          style={{ width: `${xPct}%`, background: "linear-gradient(90deg, #8b7cf0, #b0a5f8)" }} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-6">
        <ChannelBlock
          label="CLAUDE CODE"
          color="#e8815c"
          tokens={claude.tokens}
          cost={claude.costUSD}
          sessions={claude.sessions}
          pct={cPct}
        />
        <ChannelBlock
          label="CODEX CLI"
          color="#8b7cf0"
          tokens={codex.tokens}
          cost={codex.costUSD}
          sessions={codex.sessions}
          pct={xPct}
        />
      </div>
    </div>
  );
}

function ChannelBlock({
  label, color, tokens, cost, sessions, pct,
}: {
  label: string; color: string; tokens: number; cost: number; sessions: number; pct: number;
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1">
        <span className="size-1.5 rounded-full flex-shrink-0" style={{ background: color }} />
        <span className="text-[9px] font-bold tracking-[0.08em] font-mono" style={{ color }}>
          {label}
        </span>
        <span className="ml-auto text-[9px] font-mono" style={{ color: "#3a3a58" }}>
          {pct.toFixed(0)}%
        </span>
      </div>
      <div className="text-[20px] font-bold tracking-tight font-mono num" style={{ color: "#d4d4dc" }}>
        {fmtTokens(tokens)}
      </div>
      <div className="text-[10px] font-mono num mt-0.5" style={{ color: "#4a4a68" }}>
        {fmtCost(cost)} · {sessions} session{sessions === 1 ? "" : "s"}
      </div>
    </div>
  );
}
