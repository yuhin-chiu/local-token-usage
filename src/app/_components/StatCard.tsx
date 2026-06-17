import { type ReactNode } from "react";
import { clsx } from "clsx";

type Props = {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  icon?: ReactNode;
  accent?: "claude" | "codex" | "emerald" | "amber" | "violet";
  trend?: { value: number; positive?: boolean } | null;
};

const ACCENTS: Record<NonNullable<Props["accent"]>, string> = {
  claude: "from-[#d97757]/30 via-[#d97757]/10 to-transparent",
  codex: "from-[#a78bfa]/30 via-[#a78bfa]/10 to-transparent",
  emerald: "from-emerald-400/25 via-emerald-400/8 to-transparent",
  amber: "from-amber-400/25 via-amber-400/8 to-transparent",
  violet: "from-violet-400/25 via-violet-400/8 to-transparent",
};

export function StatCard({ label, value, sub, icon, accent = "violet" }: Props) {
  return (
    <div className="card relative overflow-hidden p-5">
      <div
        className={clsx(
          "absolute inset-x-0 -top-12 h-32 blur-2xl bg-gradient-to-b pointer-events-none",
          ACCENTS[accent]
        )}
      />
      <div className="relative flex items-start justify-between gap-3">
        <div className="text-[11px] uppercase tracking-[0.14em] text-zinc-400 font-medium">
          {label}
        </div>
        <div className="text-zinc-400">{icon}</div>
      </div>
      <div className="relative mt-3 num text-3xl font-semibold tracking-tight text-zinc-50">
        {value}
      </div>
      {sub && <div className="relative mt-2 text-xs text-zinc-400">{sub}</div>}
    </div>
  );
}
