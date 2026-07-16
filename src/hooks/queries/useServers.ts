import { useQuery } from "@tanstack/react-query";
import { useTimeRange } from "@/hooks/useTimeRange";
import { fetchServers } from "@/lib/api/endpoints";
import { queryKeys } from "@/lib/query-keys";

export const useServers = () => {
  const { preset, customRange, getApiParams } = useTimeRange();
  const timeRangeKey = customRange ?? { preset };

  return useQuery({
    queryKey: queryKeys.servers.list(timeRangeKey),
    queryFn: () => fetchServers(getApiParams()),
  });
};
