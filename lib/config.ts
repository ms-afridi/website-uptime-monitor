/**
 * PERSONAL CONFIGURATION
 * Replace the URL below with the website you own or are authorised to monitor.
 * The interval is in minutes. The external scheduler should call /api/monitor
 * every 10 minutes; smaller intervals will not make checks run more frequently.
 */
export const monitoredWebsite = {
  url: "https://attention-lens-vp0n.onrender.com/",
  intervalMinutes: 10,
};

export function getConfiguredWebsite() {
  const url = new URL(monitoredWebsite.url);
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("The configured website URL must start with http:// or https://");
  }
  if (![10, 20, 30, 60].includes(monitoredWebsite.intervalMinutes)) {
    throw new Error("CHECK interval must be 10, 20, 30, or 60 minutes.");
  }

  return {
    id: "main-website",
    url: url.toString(),
    intervalMinutes: monitoredWebsite.intervalMinutes,
    active: true,
  };
}
