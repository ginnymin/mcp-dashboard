import { useQuery } from "@tanstack/react-query";
import { fetchAuditEvents } from "@/lib/api/endpoints";
import { queryKeys } from "@/lib/query-keys";
import type { AuditFilters } from "@/lib/api/types";

export const useAuditEvents = (
  serverId: string | undefined,
  filters: AuditFilters = {},
) =>
  useQuery({
    queryKey: queryKeys.servers.audit(serverId ?? "", filters),
    queryFn: () => fetchAuditEvents(serverId!, filters),
    enabled: !!serverId,
  });
