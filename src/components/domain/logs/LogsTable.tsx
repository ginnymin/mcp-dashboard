import type { KeyboardEvent } from "react";
import { useMemo } from "react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import {
  formatDeploymentLabel,
  isMcpMethod,
} from "@/components/domain/logs/log-utils";
import { EmptyState } from "@/components/domain/shared/EmptyState";
import { ErrorState } from "@/components/domain/shared/ErrorState";
import { LoadingTableSkeleton } from "@/components/domain/shared/LoadingTableSkeleton";
import { MethodBadge } from "@/components/domain/shared/MethodBadge";
import { StatusBadge } from "@/components/domain/shared/StatusBadge";
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
import { useUrlFilters } from "@/hooks/useUrlFilters";
import { useDeployments } from "@/hooks/queries/useDeployments";
import { useLogs } from "@/hooks/queries/useLogs";
import { useServers } from "@/hooks/queries/useServers";
import {
  buildFilteredPath,
  formatLatency,
  formatTimestamp,
} from "@/lib/filter-links";
import { logFilterDefaults, logFilterSchema } from "@/lib/url-state";
import { cn } from "@/lib/utils";

export const LogsTable = () => {
  const { logId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { customRange } = useTimeRange();
  const { filters, setFilters } = useUrlFilters(
    logFilterSchema,
    logFilterDefaults,
  );
  const { data, isLoading, isError, refetch } = useLogs({
    ...filters,
  });
  const { data: serversData } = useServers();
  const { data: deploymentsData } = useDeployments(filters.serverId);

  const logs = data?.data ?? [];
  const total = data?.total ?? 0;
  const limit = filters.limit ?? logFilterDefaults.limit ?? 100;
  const offset = filters.offset ?? 0;
  const isDetailOpen = Boolean(logId);
  const hasPrevious = offset > 0;
  const hasNext = offset + logs.length < total;

  const serverNames = useMemo(() => {
    const names = new Map<string, string>();

    for (const server of serversData?.data ?? []) {
      names.set(server.id, server.display_name);
    }

    return names;
  }, [serversData?.data]);

  const deploymentVersions = useMemo(() => {
    const versions = new Map<string, string>();

    for (const deployment of deploymentsData?.data ?? []) {
      versions.set(deployment.id, deployment.version);
    }

    return versions;
  }, [deploymentsData?.data]);

  const handleSelect = (id: string) => {
    navigate({
      pathname: id,
      search: searchParams.toString(),
    });
  };

  const handleKeyDown = (
    event: KeyboardEvent<HTMLTableRowElement>,
    id: string,
  ) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleSelect(id);
    }
  };

  const handlePreviousPage = () => {
    setFilters({ offset: Math.max(0, offset - limit) });
  };

  const handleNextPage = () => {
    setFilters({ offset: offset + limit });
  };

  if (isLoading) {
    return (
      <div className="p-4">
        <LoadingTableSkeleton columns={isDetailOpen ? 6 : 8} rows={4} />
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

  if (logs.length === 0) {
    return (
      <div className="p-4">
        <EmptyState
          title="No logs found"
          description="No logs match the current filters in the selected time range."
        />
      </div>
    );
  }

  return (
    <div className="space-y-3 p-4 overflow-y-auto">
      <div className="overflow-hidden rounded-lg border border-border-soft bg-panel">
        <Table>
          <TableHeader>
            <TableRow className="border-table-row-border hover:bg-transparent">
              <TableHead className="h-8 px-2 text-[11px] font-semibold uppercase text-faint">
                Timestamp
              </TableHead>
              {!isDetailOpen && (
                <TableHead className="h-8 px-2 text-[11px] font-semibold uppercase text-faint">
                  Server
                </TableHead>
              )}
              {!isDetailOpen && (
                <TableHead className="h-8 px-2 text-[11px] font-semibold uppercase text-faint">
                  Deployment
                </TableHead>
              )}
              <TableHead className="h-8 px-2 text-[11px] font-semibold uppercase text-faint">
                Method
              </TableHead>
              <TableHead className="h-8 px-2 text-[11px] font-semibold uppercase text-faint">
                Tool
              </TableHead>
              <TableHead className="h-8 px-2 text-[11px] font-semibold uppercase text-faint">
                Status
              </TableHead>
              <TableHead className="h-8 px-2 text-right text-[11px] font-semibold uppercase text-faint">
                Latency
              </TableHead>
              <TableHead className="h-8 px-2 text-[11px] font-semibold uppercase text-faint">
                Session
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => {
              const isSelected = log.id === logId;
              const isError = log.status === "error";

              return (
                <TableRow
                  key={log.id}
                  data-testid={`log-row-${log.id}`}
                  data-state={isSelected ? "selected" : undefined}
                  tabIndex={0}
                  role="link"
                  aria-label={`View log ${log.method}${log.tool_name ? ` ${log.tool_name}` : ""}`}
                  aria-current={isSelected ? "true" : undefined}
                  className={cn(
                    "group/log-row cursor-pointer border-table-row-border outline-none",
                    "hover:bg-panel-2 focus-visible:bg-panel-2 active:bg-panel-3",
                    "data-[state=selected]:bg-panel-3",
                    "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
                    isError && "bg-tag-bg/40 hover:bg-tag-bg/60",
                  )}
                  onClick={() => handleSelect(log.id)}
                  onKeyDown={(event) => handleKeyDown(event, log.id)}
                >
                  <TableCell className="px-2 text-[12px] text-table-cell">
                    {formatTimestamp(log.ts)}
                  </TableCell>
                  {!isDetailOpen && (
                    <TableCell className="px-2 text-[12px] font-medium text-text">
                      {serverNames.get(log.server_id) ?? log.server_id}
                    </TableCell>
                  )}
                  {!isDetailOpen && (
                    <TableCell className="px-2 text-[12px] text-table-cell">
                      {formatDeploymentLabel(
                        log.deployment_id,
                        deploymentVersions,
                      )}
                    </TableCell>
                  )}
                  <TableCell className="px-2 text-[12px]">
                    {isMcpMethod(log.method) ? (
                      <MethodBadge method={log.method} />
                    ) : (
                      <span className="text-table-cell">{log.method}</span>
                    )}
                  </TableCell>
                  <TableCell className="px-2 text-[12px] text-table-cell">
                    {log.tool_name ?? "—"}
                  </TableCell>
                  <TableCell className="px-2 text-[12px]">
                    <StatusBadge status={isError ? "error" : "success"}>
                      {log.status}
                    </StatusBadge>
                  </TableCell>
                  <TableCell className="px-2 text-right text-[12px] text-table-cell">
                    {formatLatency(log.latency_ms)}
                  </TableCell>
                  <TableCell className="px-2 text-[12px]">
                    <Link
                      to={buildFilteredPath(
                        `/servers/${log.server_id}/sessions/${log.session_id}`,
                        {},
                        customRange,
                      )}
                      className="text-primary underline-offset-2 hover:underline"
                      onClick={(event) => event.stopPropagation()}
                    >
                      {log.session_id}
                    </Link>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-[12px] text-muted-foreground">
          Showing {Math.min(offset + logs.length, total)} of {total}
        </p>
        <div className="flex items-center gap-2">
          {hasPrevious && (
            <Button
              variant="outline"
              size="sm"
              className="btn-toolbar focus-visible:ring-ring"
              onClick={handlePreviousPage}
            >
              Previous page
            </Button>
          )}
          {hasNext && (
            <Button
              variant="outline"
              size="sm"
              className="btn-toolbar focus-visible:ring-ring"
              onClick={handleNextPage}
            >
              Next page
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
