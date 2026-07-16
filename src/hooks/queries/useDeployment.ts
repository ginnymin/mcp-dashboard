import { useQuery } from "@tanstack/react-query";
import { fetchDeployment } from "@/lib/api/endpoints";
import { queryKeys } from "@/lib/query-keys";

export const useDeployment = (id: string | undefined) =>
  useQuery({
    queryKey: queryKeys.deployments.detail(id ?? ""),
    queryFn: () => fetchDeployment(id!),
    enabled: !!id,
  });
