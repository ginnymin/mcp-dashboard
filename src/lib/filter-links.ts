import { serializeFilters } from "@/lib/url-state";

export const buildFilteredPath = (
  pathname: string,
  filters: Record<string, string | number | undefined>,
  customRange?: { since: string; until: string } | null,
) => {
  const params = serializeFilters(
    customRange ? { ...filters, ...customRange } : filters,
  );
  const query = params.toString();

  return query ? `${pathname}?${query}` : pathname;
};

export const formatTimestamp = (
  value: string,
  options: Intl.DateTimeFormatOptions = {
    dateStyle: "medium",
    timeStyle: "short",
  },
) => new Date(value).toLocaleString(undefined, options);

export const formatLatency = (latencyMs: number | null | undefined) => {
  if (latencyMs == null) {
    return "—";
  }

  return `${latencyMs} ms`;
};
