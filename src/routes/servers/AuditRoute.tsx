import { useParams } from "react-router-dom";
import { AuditFilters } from "@/components/domain/audit/AuditFilters";
import { AuditTimeline } from "@/components/domain/audit/AuditTimeline";
import { EmptyState } from "@/components/domain/shared/EmptyState";
import { LoadingTableSkeleton } from "@/components/domain/shared/LoadingTableSkeleton";
import { useServer } from "@/hooks/queries/useServer";

export const AuditRoute = () => {
  const { serverId } = useParams();
  const { data: server, isLoading } = useServer(serverId);

  if (isLoading) {
    return (
      <div className="p-4">
        <LoadingTableSkeleton columns={2} rows={3} />
      </div>
    );
  }

  if (!server?.audit_enabled) {
    return (
      <div className="p-4">
        <EmptyState
          title="Audit logging disabled"
          description="This server does not have audit logging enabled. Governance events are not recorded."
        />
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <AuditFilters />
      <AuditTimeline />
    </div>
  );
};
