import { NextResponse } from "next/server";
import { buildSnapshot } from "@/lib/aggregate";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const days = Math.min(365, Math.max(7, Number(url.searchParams.get("days") ?? 30)));
  try {
    const snapshot = await buildSnapshot(days);
    return NextResponse.json(snapshot, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
