import type { Server } from "@/lib/api/types";
import { formatTimestamp } from "@/lib/filter-links";

export type ServerSortKey = "name" | "error_rate" | "sessions";

export type ServerSortDirection = "asc" | "desc";

const compareStrings = (left: string, right: string) =>
  left.localeCompare(right, undefined, { sensitivity: "base" });

const compareNullableNumbers = (
  left: number | null | undefined,
  right: number | null | undefined,
) => {
  if (left == null && right == null) {
    return 0;
  }

  if (left == null) {
    return -1;
  }

  if (right == null) {
    return 1;
  }

  return left - right;
};

export const sortServers = (
  servers: Server[],
  sortKey: ServerSortKey,
  direction: ServerSortDirection,
) => {
  const sorted = [...servers].sort((left, right) => {
    let result = 0;

    switch (sortKey) {
      case "name":
        result = compareStrings(left.display_name, right.display_name);
        break;
      case "error_rate":
        result =
          normalizeErrorRate(left.error_rate_24h) -
          normalizeErrorRate(right.error_rate_24h);
        break;
      case "sessions":
        result = compareNullableNumbers(
          left.open_session_count,
          right.open_session_count,
        );
        break;
    }

    return direction === "asc" ? result : -result;
  });

  return sorted;
};

type ErrorRateLevel = "low" | "medium" | "high";

export const normalizeErrorRate = (
  errorRate: number | null | undefined,
): number => errorRate ?? 0;

export const getErrorRateLevel = (
  errorRate: number | null | undefined,
): ErrorRateLevel => {
  const rate = normalizeErrorRate(errorRate);

  if (rate >= 10) {
    return "high";
  }

  if (rate >= 1) {
    return "medium";
  }

  return "low";
};

export const formatErrorRate = (errorRate: number | null | undefined) =>
  `${normalizeErrorRate(errorRate).toFixed(2)}%`;

export const formatTimeRangeLabel = (
  preset: string,
  since?: string,
  until?: string,
) => {
  const dateRange =
    since && until
      ? `${formatTimestamp(since, { dateStyle: "short", timeStyle: "short" })} - ${formatTimestamp(until, { dateStyle: "short", timeStyle: "short" })}`
      : null;

  switch (preset) {
    case "1h":
      return "Last 1 hour";
    case "24h":
      return "Last 24 hours";
    case "7d":
      return "Last 7 days";
    default:
      return `Custom range${dateRange ? `: ${dateRange}` : ""}`;
  }
};
