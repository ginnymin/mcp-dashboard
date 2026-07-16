import { Link, useParams } from "react-router-dom";
import { TimelineEntry } from "@/components/domain/sessions/TimelineEntry";
import { formatSessionDuration } from "@/components/domain/sessions/session-utils";
import { EmptyState } from "@/components/domain/shared/EmptyState";
import { ErrorState } from "@/components/domain/shared/ErrorState";
import { LoadingTableSkeleton } from "@/components/domain/shared/LoadingTableSkeleton";
import { StatusBadge } from "@/components/domain/shared/StatusBadge";
import { DetailCloseButton } from "@/components/layout/DetailCloseButton";
import { Button } from "@/components/ui/Button";
import { useTimeRange } from "@/hooks/useTimeRange";
import { useDeployments } from "@/hooks/queries/useDeployments";
import { useSession } from "@/hooks/queries/useSession";
import { ApiError } from "@/lib/api/client";
import { buildFilteredPath, formatTimestamp } from "@/lib/filter-links";

export const SessionTimeline = () => {
  const { serverId, sessionId } = useParams();
  const { customRange } = useTimeRange();
  const { data, isLoading, isError, error, refetch } = useSession(sessionId);
  const { data: deploymentsData } = useDeployments(serverId);

  if (isLoading) {
    return (
      <div>
        <LoadingTableSkeleton columns={2} rows={4} />
      </div>
    );
  }

  if (isError) {
    const isNotFound = error instanceof ApiError && error.status === 404;

    return (
      <div>
        <ErrorState
          title={isNotFound ? "Session not found" : "Something went wrong"}
          message={
            isNotFound
              ? "This session does not exist or may have been removed."
              : "We couldn't load this session. Try again."
          }
          onRetry={isNotFound ? undefined : () => refetch()}
        />
      </div>
    );
  }

  if (!data || !serverId) {
    return null;
  }

  const deployment = deploymentsData?.data.find(
    (item) => item.id === data.deployment_id,
  );
  const logsLink = buildFilteredPath(
    "/logs",
    { serverId, sessionId: data.id },
    customRange,
  );
  const deploymentLink = customRange
    ? `/servers/${serverId}/deployments/${data.deployment_id}?${new URLSearchParams(customRange).toString()}`
    : `/servers/${serverId}/deployments/${data.deployment_id}`;

  const handleCopySessionId = async () => {
    await navigator.clipboard.writeText(data.id);
  };

  return (
    <div className="space-y-5">
      <div>
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-[14px] font-semibold text-text">
              {data.client_name}
            </h3>
            <StatusBadge
              status={data.status === "open" ? "success" : "default"}
            >
              {data.status}
            </StatusBadge>
          </div>
          <DetailCloseButton />
        </div>

        <dl className="grid gap-2 text-[12px] text-table-cell">
          <div className="flex flex-wrap items-center gap-2">
            <dt className="text-muted-foreground">Session ID</dt>
            <dd className="font-mono">{data.id}</dd>
            <Button
              variant="outline"
              size="sm"
              className="btn-toolbar h-6 px-2 text-[11px] focus-visible:ring-ring"
              onClick={() => void handleCopySessionId()}
            >
              Copy
            </Button>
          </div>
          <div className="flex gap-2">
            <dt className="text-muted-foreground">Deployment</dt>
            <dd>
              <Link
                to={deploymentLink}
                className="text-text underline-offset-2 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                {deployment?.version ?? data.deployment_id}
              </Link>
            </dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-muted-foreground">Started</dt>
            <dd>{formatTimestamp(data.started_at)}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-muted-foreground">Ended</dt>
            <dd>
              {data.ended_at ? formatTimestamp(data.ended_at) : "Still open"}
            </dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-muted-foreground">Duration</dt>
            <dd>{formatSessionDuration(data.started_at, data.ended_at)}</dd>
          </div>
        </dl>
      </div>

      <div>
        <Button
          variant="outline"
          size="sm"
          className="btn-toolbar focus-visible:ring-ring"
          render={<Link to={logsLink} />}
        >
          View in Logs
        </Button>
      </div>

      <section className="space-y-2">
        <h4 className="text-[13px] font-semibold text-text">Timeline</h4>
        {data.logs.length === 0 ? (
          <EmptyState
            title="No log entries"
            description="This session has no recorded MCP calls yet."
            className="py-8"
          />
        ) : (
          <div className="space-y-2">
            {data.logs.map((log) => (
              <TimelineEntry key={log.id} log={log} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
