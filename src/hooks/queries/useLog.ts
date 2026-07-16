import { useQuery } from "@tanstack/react-query";
import { fetchLog } from "@/lib/api/endpoints";
import { queryKeys } from "@/lib/query-keys";

export const useLog = (id: string | undefined) =>
  useQuery({
    queryKey: queryKeys.logs.detail(id ?? ""),
    queryFn: () => fetchLog(id!),
    enabled: !!id,
  });
