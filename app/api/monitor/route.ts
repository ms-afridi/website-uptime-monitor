import { NextResponse } from "next/server";
import { getConfiguredWebsite } from "@/lib/config";
import { isCronAuthorized } from "@/lib/auth";
import { readStore, writeStore } from "@/lib/github-store";
import type { Website } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 10;

function nextScheduledCheck(lastCheckedAt: string | null, intervalMinutes: number) {
  if (!lastCheckedAt) return null;
  const dueAt = new Date(lastCheckedAt).getTime() + intervalMinutes * 60_000;
  const schedulerTick = 10 * 60_000;
  return new Date(Math.ceil(dueAt / schedulerTick) * schedulerTick).toISOString();
}

async function checkWebsite(url: string) {
  const started = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 7000);
  try {
    const response = await fetch(url, {
      method: "GET",
      redirect: "manual",
      signal: controller.signal,
      cache: "no-store",
      headers: { "User-Agent": "KeepAlive-Uptime-Monitor/1.0" },
    });
    const responseMs = Date.now() - started;
    const online = response.status >= 200 && response.status < 500;
    return {
      status: online ? "online" as const : "offline" as const,
      responseMs,
      error: online ? null : `HTTP ${response.status}`,
    };
  } catch (error) {
    return {
      status: "offline" as const,
      responseMs: Date.now() - started,
      error: error instanceof Error
        ? error.name === "AbortError" ? "Request timed out" : error.message.slice(0, 180)
        : "Request failed",
    };
  } finally {
    clearTimeout(timer);
  }
}

export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized. Check your cron secret." }, { status: 401 });
  }

  try {
    const configured = getConfiguredWebsite();
    const { store, sha } = await readStore();
    const now = Date.now();
    let site = store.websites.find((item) => item.id === configured.id);

    if (!site) {
      site = {
        ...configured,
        createdAt: new Date().toISOString(),
        lastCheckedAt: null,
        lastStatus: "pending",
        lastResponseMs: null,
        lastError: null,
      } as Website;
      store.websites = [site];
    }

    const due = !site.lastCheckedAt ||
      now - new Date(site.lastCheckedAt).getTime() >= configured.intervalMinutes * 60_000;

    if (due) {
      const result = await checkWebsite(configured.url);
      site.lastCheckedAt = new Date().toISOString();
      site.lastStatus = result.status;
      site.lastResponseMs = result.responseMs;
      site.lastError = result.error;
      await writeStore(store, sha, `Check ${new URL(configured.url).hostname}`);
    }

    return NextResponse.json({
      success: true,
      checked: due ? 1 : 0,
      url: configured.url,
      status: site.lastStatus,
      lastCheckedAt: site.lastCheckedAt,
      nextCheckAt: nextScheduledCheck(site.lastCheckedAt, configured.intervalMinutes),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Monitoring failed." },
      { status: 500 },
    );
  }
}
