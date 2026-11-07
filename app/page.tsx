"use client";

import { useEffect, useState } from "react";

type Website = {
  id: string;
  url: string;
  intervalMinutes: number;
  active: boolean;
  lastCheckedAt: string | null;
  lastStatus: "online" | "offline" | "pending" | null;
  lastResponseMs: number | null;
  lastError: string | null;
  nextCheckAt: string | null;
};

function formatDate(value: string | null) {
  if (!value) return "Waiting for the first check";
  return new Date(value).toLocaleString();
}

export default function Home() {
  const [website, setWebsite] = useState<Website | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadStatus() {
    try {
      const response = await fetch("/api/websites", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not load website status.");
      setWebsite(data.websites?.[0] ?? null);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load status.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStatus();
    const interval = window.setInterval(loadStatus, 60_000);
    return () => window.clearInterval(interval);
  }, []);

  const online = website?.lastStatus === "online";
  const statusLabel = website?.lastStatus === "online"
    ? "Healthy"
    : website?.lastStatus === "offline" ? "Not responding" : "Waiting for check";

  return (
    <main className="min-h-screen px-5 py-12 md:px-8">
      <div className="mx-auto max-w-3xl">
        <header className="mb-14 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-400/15 text-2xl text-cyan-300">◉</div>
          <div>
            <div className="font-display text-xl font-bold tracking-tight">KeepAlive</div>
            <div className="text-xs muted">Personal website status</div>
          </div>
        </header>

        <section className="mb-9">
          <div className="mb-3 inline-flex rounded-full border border-cyan-400/25 bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-300">AUTOMATIC UPTIME CHECKS</div>
          <h1 className="font-display max-w-2xl text-4xl font-bold leading-tight md:text-6xl">Your website, <span className="text-cyan-300">at a glance.</span></h1>
          <p className="mt-4 max-w-xl leading-7 text-slate-400">This page shows the website configured in the code and the latest result from its scheduled health check.</p>
        </section>

        <section className="panel rounded-3xl p-6 md:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-xl font-semibold">Website status</h2>
            <button onClick={loadStatus} className="rounded-xl border border-slate-700 px-3 py-2 text-sm hover:bg-slate-800">Refresh status</button>
          </div>

          {loading ? (
            <div className="py-12 text-center text-sm muted">Loading status…</div>
          ) : error ? (
            <div className="mt-6 rounded-2xl border border-rose-900/70 bg-rose-950/20 p-4 text-sm text-rose-300">{error}</div>
          ) : website ? (
            <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="text-xs uppercase tracking-wider muted">Configured website</div>
                  <a href={website.url} target="_blank" rel="noreferrer" className="mt-2 block break-all text-lg font-semibold text-cyan-200 hover:underline">{website.url}</a>
                </div>
                <span className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold ${online ? "bg-emerald-400/10 text-emerald-300" : website.lastStatus === "offline" ? "bg-rose-400/10 text-rose-300" : "bg-slate-700 text-slate-300"}`}>
                  <span className={`h-2 w-2 rounded-full ${online ? "bg-emerald-400" : website.lastStatus === "offline" ? "bg-rose-400" : "bg-slate-400"}`} />
                  {statusLabel}
                </span>
              </div>

              <div className="mt-7 grid gap-5 border-t border-slate-800 pt-5 sm:grid-cols-2">
                <Info label="Check frequency" value={`Every ${website.intervalMinutes} minutes`} />
                <Info label="Last checked" value={formatDate(website.lastCheckedAt)} />
                <Info label="Next scheduled check" value={formatDate(website.nextCheckAt)} />
                <Info label="Response time" value={website.lastResponseMs === null ? "—" : `${website.lastResponseMs} ms`} />
              </div>
              {website.lastError && <p className="mt-5 rounded-xl bg-rose-950/30 p-3 text-sm text-rose-300">{website.lastError}</p>}
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-dashed border-slate-700 p-8 text-center text-sm muted">No website is configured. Add your URL in <code>lib/config.ts</code> and redeploy.</div>
          )}
          <p className="mt-5 text-xs leading-6 muted">The page refreshes status automatically every minute. Actual checks run according to your scheduler. Health checks are not real visitor traffic and cannot guarantee that a hosting provider will keep a service awake.</p>
        </section>

        <footer className="mt-8 border-t border-slate-800 pt-5 text-xs leading-6 muted">A simple, open-source personal uptime monitor. Configure your own website in the source code before deploying.</footer>
      </div>
    </main>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div><div className="text-xs muted">{label}</div><div className="mt-1 text-sm font-medium text-slate-200">{value}</div></div>;
}
