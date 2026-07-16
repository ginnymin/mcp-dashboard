import { useQuery } from "@tanstack/react-query";
import { useTimeRange } from "@/hooks/useTimeRange";
import { fetchServerStats } from "@/lib/api/endpoints";
import { queryKeys } from "@/lib/query-keys";

export const useServerStats = (id: string | undefined) => {
  const { preset, customRange, getApiParams } = useTimeRange();
  const timeRangeKey = customRange ?? { preset };

  return useQuery({
    queryKey: queryKeys.servers.stats(id ?? "", timeRangeKey),
    queryFn: () => fetchServerStats(id!, getApiParams().since),
    enabled: !!id,
  });
};
