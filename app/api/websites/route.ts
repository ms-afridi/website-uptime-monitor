import { NextResponse } from "next/server";
import { getConfiguredWebsite } from "@/lib/config";
import { readStore } from "@/lib/github-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function nextScheduledCheck(lastCheckedAt: string | null, intervalMinutes: number) {
  if (!lastCheckedAt) return null;
  const dueAt = new Date(lastCheckedAt).getTime() + intervalMinutes * 60_000;
  // cron-job.org is configured to run every 10 minutes; round up to its next tick.
  const schedulerTick = 10 * 60_000;
  return new Date(Math.ceil(dueAt / schedulerTick) * schedulerTick).toISOString();
}

export async function GET() {
  try {
    const configured = getConfiguredWebsite();
    const { store } = await readStore();
    const saved = store.websites.find((site) => site.id === configured.id);
    const website = {
      ...configured,
      createdAt: saved?.createdAt ?? new Date().toISOString(),
      lastCheckedAt: saved?.lastCheckedAt ?? null,
      lastStatus: saved?.lastStatus ?? "pending",
      lastResponseMs: saved?.lastResponseMs ?? null,
      lastError: saved?.lastError ?? null,
      nextCheckAt: nextScheduledCheck(saved?.lastCheckedAt ?? null, configured.intervalMinutes),
    };

    return NextResponse.json({ websites: [website] });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not load monitor status." },
      { status: 500 },
    );
  }
}
