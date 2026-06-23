import { type ReactNode } from "react";

type Props = {
  label: string;
  accent: string;
  value: string;
  details?: string[];
  children?: ReactNode;
};

export function SignalCard({ label, accent, value, details, children }: Props) {
  return (
    <div className="relative overflow-hidden group" style={{
      background: "linear-gradient(180deg, rgba(10,10,20,0.9), rgba(6,6,13,0.8))",
      border: `1px solid ${accent}20`,
      borderRadius: 8,
      padding: "14px 16px",
    }}>
      {/* Accent corner glow */}
      <div className="absolute top-0 left-0 w-6 h-px"
        style={{ background: `linear-gradient(90deg, ${accent}60, transparent)` }} />

      {/* Hover background lift */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{ background: `radial-gradient(200px at 100% 0%, ${accent}05, transparent 70%)` }} />

      <div className="relative">
        {/* Label */}
        <div className="text-[9px] tracking-[0.14em] font-bold font-mono mb-2.5"
          style={{ color: "#60607a" }}>
          {label}
        </div>

        {/* Value */}
        <div className="text-[24px] font-bold tracking-tight font-mono num"
          style={{ color: "#e8e8f4" }}>
          {value}
        </div>

        {/* Detail lines */}
        {details && details.length > 0 && (
          <div className="mt-2 space-y-0.5">
            {details.map((d, i) => (
              <div key={i} className="text-[10px] font-mono num"
                style={{ color: "#3a3a58" }}>
                {d}
              </div>
            ))}
          </div>
        )}

        {/* Extra content (sparkline etc) */}
        {children && <div className="mt-3">{children}</div>}
      </div>
    </div>
  );
}
