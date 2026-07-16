import { useQuery } from "@tanstack/react-query";
import { fetchServer } from "@/lib/api/endpoints";
import { queryKeys } from "@/lib/query-keys";

export const useServer = (id: string | undefined) =>
  useQuery({
    queryKey: queryKeys.servers.detail(id ?? ""),
    queryFn: () => fetchServer(id!),
    enabled: !!id,
  });
