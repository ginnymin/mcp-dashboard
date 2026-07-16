import { useQuery } from "@tanstack/react-query";
import { fetchSession } from "@/lib/api/endpoints";
import { queryKeys } from "@/lib/query-keys";

export const useSession = (id: string | undefined) =>
  useQuery({
    queryKey: queryKeys.sessions.detail(id ?? ""),
    queryFn: () => fetchSession(id!),
    enabled: !!id,
  });
