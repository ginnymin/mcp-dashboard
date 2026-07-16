import { Link, useParams } from "react-router-dom";
import { DeploymentStatusBadge } from "@/components/domain/deployments/DeploymentStatusBadge";
import { EmptyState } from "@/components/domain/shared/EmptyState";
import { ErrorState } from "@/components/domain/shared/ErrorState";
import { LoadingTableSkeleton } from "@/components/domain/shared/LoadingTableSkeleton";
import { DetailCloseButton } from "@/components/layout/DetailCloseButton";
import { Button } from "@/components/ui/Button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import { useTimeRange } from "@/hooks/useTimeRange";
import { useDeployment } from "@/hooks/queries/useDeployment";
import { ApiError } from "@/lib/api/client";
import { buildFilteredPath, formatTimestamp } from "@/lib/filter-links";

export const DeploymentDetail = () => {
  const { serverId, deploymentId } = useParams();
  const { customRange } = useTimeRange();
  const { data, isLoading, isError, error, refetch } =
    useDeployment(deploymentId);

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
          title={isNotFound ? "Deployment not found" : "Something went wrong"}
          message={
            isNotFound
              ? "This deployment does not exist or may have been removed."
              : "We couldn't load this deployment. Try again."
          }
          onRetry={isNotFound ? undefined : () => refetch()}
        />
      </div>
    );
  }

  if (!data || !serverId) {
    return null;
  }

  const sessionsLink = buildFilteredPath(
    `/servers/${serverId}/sessions`,
    { deploymentId: data.id },
    customRange,
  );
  const logsLink = buildFilteredPath(
    "/logs",
    { serverId, deploymentId: data.id },
    customRange,
  );

  return (
    <div className="space-y-5">
      <div>
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-[14px] font-semibold text-text">
              {data.version}
            </h3>
            <DeploymentStatusBadge status={data.status} />
          </div>
          <DetailCloseButton />
        </div>
        <dl className="grid gap-2 text-[12px] text-table-cell">
          <div className="flex gap-2">
            <dt className="text-muted-foreground">Created</dt>
            <dd>{formatTimestamp(data.created_at)}</dd>
          </div>
          {data.git_sha && (
            <div className="flex gap-2">
              <dt className="text-muted-foreground">Git SHA</dt>
              <dd className="font-mono">{data.git_sha.slice(0, 12)}</dd>
            </div>
          )}
          {data.build_info?.commit_message != null && (
            <div className="flex gap-2">
              <dt className="shrink-0 text-muted-foreground">Build</dt>
              <dd>{String(data.build_info.commit_message)}</dd>
            </div>
          )}
        </dl>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          className="btn-toolbar focus-visible:ring-ring"
          render={<Link to={sessionsLink} />}
        >
          View sessions
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="btn-toolbar focus-visible:ring-ring"
          render={<Link to={logsLink} />}
        >
          View logs
        </Button>
      </div>

      <section className="space-y-2">
        <h4 className="text-[13px] font-semibold text-text">Tool catalog</h4>
        {data.tools.length === 0 ? (
          <EmptyState
            title="No tools"
            description="This deployment exposes no tools."
            className="py-8"
          />
        ) : (
          <div className="overflow-hidden rounded-lg border border-border-soft bg-panel">
            <Table>
              <TableHeader>
                <TableRow className="border-table-row-border hover:bg-transparent">
                  <TableHead className="h-8 text-[11px] font-semibold uppercase text-faint px-2">
                    Tool
                  </TableHead>
                  <TableHead className="h-8 text-[11px] font-semibold uppercase text-faint px-2">
                    Description
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.tools.map((tool) => (
                  <TableRow
                    key={tool.id}
                    className="border-table-row-border hover:bg-transparent"
                  >
                    <TableCell className="text-[12px] font-medium text-text">
                      {tool.name}
                    </TableCell>
                    <TableCell className="text-[12px] text-table-cell">
                      {tool.description ?? "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>
    </div>
  );
};
