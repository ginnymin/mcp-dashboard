import { Link } from "react-router-dom";
import {
  computeTrafficWindow,
  formatEventTypeLabel,
} from "@/components/domain/audit/audit-utils";
import { StatusBadge } from "@/components/domain/shared/StatusBadge";
import type { AuditEvent } from "@/lib/api/types";
import { buildFilteredPath, formatTimestamp } from "@/lib/filter-links";

type AuditTimelineEntryProps = {
  event: AuditEvent;
  serverId: string;
};

export const AuditTimelineEntry = ({
  event,
  serverId,
}: AuditTimelineEntryProps) => {
  const trafficWindow = computeTrafficWindow(event.ts);
  const trafficLink = buildFilteredPath("/logs", { serverId }, trafficWindow);

  return (
    <article
      data-testid={`audit-entry-${event.id}`}
      className="rounded-lg border border-border-soft bg-panel px-3 py-2.5"
    >
      <div className="flex flex-wrap items-center gap-2">
        <time
          dateTime={event.ts}
          className="text-[12px] tabular-nums text-table-cell"
        >
          {formatTimestamp(event.ts)}
        </time>
        <StatusBadge status="default">
          {formatEventTypeLabel(event.event_type)}
        </StatusBadge>
      </div>
      <p className="mt-1.5 text-[12px] font-medium text-text">
        {event.summary}
      </p>
      <p className="mt-1 text-[12px] text-muted-foreground">{event.actor}</p>
      <Link
        to={trafficLink}
        className="mt-2 inline-block text-[12px] text-primary underline-offset-2 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        View traffic around this time
      </Link>
    </article>
  );
};
