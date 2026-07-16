import { useQuery } from "@tanstack/react-query";
import { useTimeRange } from "@/hooks/useTimeRange";
import { fetchLogs } from "@/lib/api/endpoints";
import { queryKeys } from "@/lib/query-keys";
import type { LogFilters } from "@/lib/api/types";

export const useLogs = (filters: LogFilters = {}) => {
  const { preset, customRange, getApiParams } = useTimeRange();
  const timeRangeKey = customRange ?? { preset };

  return useQuery({
    queryKey: queryKeys.logs.list({ ...filters, ...timeRangeKey }),
    queryFn: () => fetchLogs({ ...filters, ...getApiParams() }),
  });
};
