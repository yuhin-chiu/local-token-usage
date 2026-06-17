export function fmtTokens(n: number): string {
  if (!Number.isFinite(n)) return "0";
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(2) + "B";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + "M";
  if (n >= 10_000) return (n / 1_000).toFixed(1) + "K";
  if (n >= 1_000) return (n / 1_000).toFixed(2) + "K";
  return Math.round(n).toString();
}

export function fmtCost(n: number): string {
  if (!Number.isFinite(n)) return "$0.00";
  if (n >= 1000) return "$" + n.toLocaleString(undefined, { maximumFractionDigits: 0 });
  if (n >= 10) return "$" + n.toFixed(2);
  return "$" + n.toFixed(3);
}

export function fmtPct(n: number): string {
  return (n >= 10 ? n.toFixed(0) : n.toFixed(1)) + "%";
}

export function fmtRelative(iso: string): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "—";
  const diff = Date.now() - t;
  if (diff < 0) {
    const a = Math.abs(diff);
    if (a < 60_000) return `in ${Math.floor(a / 1000)}s`;
    if (a < 3_600_000) return `in ${Math.floor(a / 60_000)}m`;
    if (a < 86_400_000) return `in ${Math.floor(a / 3_600_000)}h`;
    return `in ${Math.floor(a / 86_400_000)}d`;
  }
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}

export function fmtShortDay(iso: string): string {
  const d = new Date(iso + "T00:00:00.000Z");
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", timeZone: "UTC" });
}
