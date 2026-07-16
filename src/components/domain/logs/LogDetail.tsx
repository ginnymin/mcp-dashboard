import { Link, useParams } from "react-router-dom";
import { isMcpMethod } from "@/components/domain/logs/log-utils";
import { JsonViewer } from "@/components/domain/shared/JsonViewer";
import { MethodBadge } from "@/components/domain/shared/MethodBadge";
import { ErrorState } from "@/components/domain/shared/ErrorState";
import { LoadingTableSkeleton } from "@/components/domain/shared/LoadingTableSkeleton";
import { StatusBadge } from "@/components/domain/shared/StatusBadge";
import { DetailCloseButton } from "@/components/layout/DetailCloseButton";
import { Button } from "@/components/ui/Button";
import { useTimeRange } from "@/hooks/useTimeRange";
import { useDeployments } from "@/hooks/queries/useDeployments";
import { useLog } from "@/hooks/queries/useLog";
import { useServers } from "@/hooks/queries/useServers";
import { ApiError } from "@/lib/api/client";
import {
  buildFilteredPath,
  formatLatency,
  formatTimestamp,
} from "@/lib/filter-links";

export const LogDetail = () => {
  const { logId } = useParams();
  const { customRange } = useTimeRange();
  const { data, isLoading, isError, error, refetch } = useLog(logId);
  const { data: serversData } = useServers();
  const { data: deploymentsData } = useDeployments(data?.server_id);

  if (isLoading) {
    return (
      <div className="p-4">
        <LoadingTableSkeleton columns={2} rows={4} />
      </div>
    );
  }

  if (isError) {
    const isNotFound = error instanceof ApiError && error.status === 404;

    return (
      <div className="p-4">
        <ErrorState
          title={isNotFound ? "Log not found" : "Something went wrong"}
          message={
            isNotFound
              ? "This log entry does not exist or may have been removed."
              : "We couldn't load this log entry. Try again."
          }
          onRetry={isNotFound ? undefined : () => refetch()}
        />
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const server = serversData?.data.find((item) => item.id === data.server_id);
  const deployment = deploymentsData?.data.find(
    (item) => item.id === data.deployment_id,
  );
  const isErrorStatus = data.status === "error";
  const sessionLink = buildFilteredPath(
    `/servers/${data.server_id}/sessions/${data.session_id}`,
    {},
    customRange,
  );
  const deploymentLink = customRange
    ? `/servers/${data.server_id}/deployments/${data.deployment_id}?${new URLSearchParams(customRange).toString()}`
    : `/servers/${data.server_id}/deployments/${data.deployment_id}`;
  const serverLink = buildFilteredPath(
    "/logs",
    { serverId: data.server_id },
    customRange,
  );

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
  };

  return (
    <div className="@container/log-detail space-y-5 p-4">
      <div>
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-[14px] font-semibold text-text">Log detail</h3>
            <StatusBadge status={isErrorStatus ? "error" : "success"}>
              {data.status}
            </StatusBadge>
          </div>
          <DetailCloseButton />
        </div>

        <dl className="grid gap-2 text-[12px] text-table-cell">
          <div className="flex flex-wrap items-center gap-2">
            <dt className="text-muted-foreground">Log ID</dt>
            <dd className="font-mono">{data.id}</dd>
            <Button
              variant="outline"
              size="sm"
              className="btn-toolbar h-6 px-2 text-[11px] focus-visible:ring-ring"
              onClick={() => void handleCopyLink()}
            >
              Copy link
            </Button>
          </div>
          <div className="flex gap-2">
            <dt className="text-muted-foreground">Timestamp</dt>
            <dd>{formatTimestamp(data.ts)}</dd>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <dt className="text-muted-foreground">Method</dt>
            <dd>
              {isMcpMethod(data.method) ? (
                <MethodBadge method={data.method} />
              ) : (
                data.method
              )}
            </dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-muted-foreground">Tool</dt>
            <dd>{data.tool_name ?? "—"}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-muted-foreground">Latency</dt>
            <dd>{formatLatency(data.latency_ms)}</dd>
          </div>
          {data.error_code != null && (
            <div className="flex gap-2">
              <dt className="text-muted-foreground">Error code</dt>
              <dd className="font-mono">{data.error_code}</dd>
            </div>
          )}
          {data.error_message && (
            <div className="flex gap-2">
              <dt className="text-muted-foreground">Error</dt>
              <dd>{data.error_message}</dd>
            </div>
          )}
          <div className="flex gap-2">
            <dt className="text-muted-foreground">Session</dt>
            <dd>
              <Link
                to={sessionLink}
                className="text-text underline-offset-2 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                {data.session_id}
              </Link>
            </dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-muted-foreground">Server</dt>
            <dd>
              <Link
                to={serverLink}
                className="text-text underline-offset-2 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                {server?.display_name ?? data.server_id}
              </Link>
            </dd>
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
        </dl>
      </div>

      <div className="grid gap-4 @min-xl/log-detail:grid-cols-2">
        <JsonViewer title="Request" value={data.request_body} />
        <JsonViewer
          title={isErrorStatus ? "Error" : "Response"}
          value={data.response_body}
        />
      </div>
    </div>
  );
};
