import { useParams } from "react-router-dom";
import { AuditTimelineEntry } from "@/components/domain/audit/AuditTimelineEntry";
import { EmptyState } from "@/components/domain/shared/EmptyState";
import { ErrorState } from "@/components/domain/shared/ErrorState";
import { LoadingTableSkeleton } from "@/components/domain/shared/LoadingTableSkeleton";
import { useUrlFilters } from "@/hooks/useUrlFilters";
import { useAuditEvents } from "@/hooks/queries/useAuditEvents";
import { auditFilterDefaults, auditFilterSchema } from "@/lib/url-state";

export const AuditTimeline = () => {
  const { serverId } = useParams();
  const { filters } = useUrlFilters(auditFilterSchema, auditFilterDefaults);
  const { data, isLoading, isError, refetch } = useAuditEvents(
    serverId,
    filters,
  );

  const events = data?.data ?? [];

  if (isLoading) {
    return (
      <div className="p-4">
        <LoadingTableSkeleton columns={2} rows={4} />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-4">
        <ErrorState onRetry={() => refetch()} />
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="p-4">
        <EmptyState
          title="No audit events"
          description="No governance events match the current filters."
        />
      </div>
    );
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto p-4">
      <div className="space-y-2">
        {events.map((event) => (
          <AuditTimelineEntry
            key={event.id}
            event={event}
            serverId={serverId!}
          />
        ))}
      </div>
    </div>
  );
};
