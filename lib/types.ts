export type Website = {
  id: string;
  url: string;
  intervalMinutes: number;
  active: boolean;
  createdAt: string;
  lastCheckedAt: string | null;
  lastStatus: "online" | "offline" | "pending" | null;
  lastResponseMs: number | null;
  lastError: string | null;
};

export type Store = { websites: Website[] };
