import { useQuery } from "@tanstack/react-query";
import { useTimeRange } from "@/hooks/useTimeRange";
import { fetchSessions } from "@/lib/api/endpoints";
import { queryKeys } from "@/lib/query-keys";
import type { SessionFilters } from "@/lib/api/types";

export const useSessions = (filters: SessionFilters = {}) => {
  const { preset, customRange, getApiParams } = useTimeRange();
  const timeRangeKey = customRange ?? { preset };

  return useQuery({
    queryKey: queryKeys.sessions.list({ ...filters, ...timeRangeKey }),
    queryFn: () => fetchSessions({ ...filters, ...getApiParams() }),
  });
};
