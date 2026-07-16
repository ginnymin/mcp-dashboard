import { useQuery } from "@tanstack/react-query";
import { fetchDeployments } from "@/lib/api/endpoints";
import { queryKeys } from "@/lib/query-keys";

export const useDeployments = (serverId: string | undefined) =>
  useQuery({
    queryKey: queryKeys.servers.deployments(serverId ?? ""),
    queryFn: () => fetchDeployments(serverId!),
    enabled: !!serverId,
  });
