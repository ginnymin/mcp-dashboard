import type { AuditFilters, LogFilters, SessionFilters } from "@/lib/api/types";

type TimeRangeQueryKey = { preset: string } | { since: string; until: string };

export const queryKeys = {
  servers: {
    list: (range: TimeRangeQueryKey) => ["servers", "list", range] as const,
    detail: (id: string) => ["servers", id] as const,
    stats: (id: string, range: TimeRangeQueryKey) =>
      ["servers", id, "stats", range] as const,
    deployments: (id: string) => ["servers", id, "deployments"] as const,
    audit: (id: string, filters: AuditFilters) =>
      ["servers", id, "audit", filters] as const,
  },
  deployments: {
    detail: (id: string) => ["deployments", id] as const,
  },
  sessions: {
    list: (filters: SessionFilters) => ["sessions", filters] as const,
    detail: (id: string) => ["sessions", id] as const,
  },
  logs: {
    list: (filters: LogFilters) => ["logs", filters] as const,
    detail: (id: string) => ["logs", id] as const,
  },
};
