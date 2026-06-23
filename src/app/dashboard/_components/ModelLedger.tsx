import type { ModelBreakdown, SourceId } from "@/lib/types";
import { fmtTokens, fmtCost } from "@/lib/format";

type Props = {
  models: ModelBreakdown[];
};

function srcBadge(s: SourceId) {
  return s === "claude-code"
    ? { label: "C", color: "#f0a070", bg: "rgba(232,129,92,0.1)", ring: "rgba(232,129,92,0.2)" }
    : { label: "X", color: "#b0a5f8", bg: "rgba(139,124,240,0.1)", ring: "rgba(139,124,240,0.2)" };
}

function barGradient(s: SourceId) {
  return s === "claude-code"
    ? "linear-gradient(90deg, #e8815c, #f0a070)"
    : "linear-gradient(90deg, #8b7cf0, #b0a5f8)";
}

export function ModelLedger({ models }: Props) {
  const top = models.slice(0, 10);
  const maxTokens = Math.max(1, ...top.map((m) => m.tokens));

  if (top.length === 0) {
    return (
      <div className="text-[10px] font-mono py-10 text-center" style={{ color: "#3a3a58" }}>
        — NO DATA —
      </div>
    );
  }

  return (
    <div className="overflow-x-auto" style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(50,50,80,0.3) transparent" }}>
      <table className="w-full font-mono text-[11px] num">
        <thead>
          <tr className="text-[9px] tracking-[0.1em] uppercase" style={{ color: "#3a3a58" }}>
            <th className="font-medium pb-2.5 text-left w-[32%]">Model</th>
            <th className="font-medium pb-2.5 text-left w-[8%]">Src</th>
            <th className="font-medium pb-2.5 text-right w-[16%]">Tokens</th>
            <th className="font-medium pb-2.5 text-right w-[14%]">Cost</th>
            <th className="font-medium pb-2.5 text-right w-[30%]">Share</th>
          </tr>
        </thead>
        <tbody className="divide-y" style={{ borderColor: "rgba(25,25,45,0.3)" }}>
          {top.map((m) => {
            const pct = (m.tokens / maxTokens) * 100;
            const b = srcBadge(m.source);
            return (
              <tr
                key={`${m.source}-${m.model}`}
                className="group hover:transition-colors"
                style={{ background: "transparent" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.01)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
              >
                <td className="py-2 pr-2">
                  <span
                    className="truncate block max-w-[170px]"
                    style={{ color: "#b0b0c8" }}
                    title={m.model}
                  >
                    {m.model}
                  </span>
                </td>
                <td className="py-2 pr-2">
                  <span style={{
                    display: "inline-block",
                    fontSize: 8,
                    fontWeight: 700,
                    padding: "1px 5px",
                    borderRadius: 3,
                    background: b.bg,
                    color: b.color,
                    border: `1px solid ${b.ring}`,
                    lineHeight: "14px",
                    letterSpacing: "0.04em",
                  }}>
                    {b.label}
                  </span>
                </td>
                <td className="py-2 pr-2 text-right" style={{ color: "#c8c8e0" }}>
                  {fmtTokens(m.tokens)}
                </td>
                <td className="py-2 pr-2 text-right" style={{ color: "#6a6a88" }}>
                  {fmtCost(m.costUSD)}
                </td>
                <td className="py-2">
                  <div className="flex items-center gap-2">
                    <div className="h-1 flex-1 rounded-full overflow-hidden"
                      style={{ background: "rgba(8,8,16,0.8)" }}>
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, background: barGradient(m.source) }}
                      />
                    </div>
                    <span className="text-[9px] w-7 text-right tabular-nums" style={{ color: "#3a3a58" }}>
                      {pct.toFixed(0)}%
                    </span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
