import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { HealthStrip } from "@/components/domain/servers/HealthStrip";
import { StatsTable } from "@/components/domain/servers/StatsTable";
import {
  formatErrorRate,
  getErrorRateLevel,
  normalizeErrorRate,
} from "@/components/domain/servers/server-list-utils";
import { EmptyState } from "@/components/domain/shared/EmptyState";
import { ErrorState } from "@/components/domain/shared/ErrorState";
import { LoadingTableSkeleton } from "@/components/domain/shared/LoadingTableSkeleton";
import { StatusBadge } from "@/components/domain/shared/StatusBadge";
import { useTimeRange } from "@/hooks/useTimeRange";
import { useServerStats } from "@/hooks/queries/useServerStats";
import { useSessions } from "@/hooks/queries/useSessions";
import type {
  ServerStatsDeploymentRow,
  ServerStatsToolRow,
} from "@/lib/api/types";
import {
  buildFilteredPath,
  formatLatency,
  formatTimestamp,
} from "@/lib/filter-links";
import { cn } from "@/lib/utils";

const errorRateStatus = (
  errorRate: number | null | undefined,
): "success" | "default" | "error" => {
  const level = getErrorRateLevel(errorRate);

  if (level === "high") {
    return "error";
  }

  if (level === "medium") {
    return "default";
  }

  return "success";
};

export const ServerOverview = () => {
  const { serverId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { customRange } = useTimeRange();

  const {
    data: stats,
    isLoading: statsLoading,
    isError: statsError,
    refetch: refetchStats,
  } = useServerStats(serverId);
  const {
    data: sessionsData,
    isLoading: sessionsLoading,
    isError: sessionsError,
    refetch: refetchSessions,
  } = useSessions({
    serverId,
    limit: 10,
  });

  const isLoading = statsLoading || sessionsLoading;
  const isError = statsError || sessionsError;
  const recentSessions = sessionsData?.data ?? [];

  const refetchAll = () => {
    void refetchStats();
    void refetchSessions();
  };

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        <div className="@container/overview grid grid-cols-4 gap-3 @max-md/overview:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-[72px] animate-pulse rounded-lg border border-border-soft bg-panel"
            />
          ))}
        </div>
        <LoadingTableSkeleton columns={4} rows={3} />
        <LoadingTableSkeleton columns={3} rows={3} />
      </div>
    );
  }

  if (isError || !stats) {
    return (
      <div className="p-4">
        <ErrorState onRetry={refetchAll} />
      </div>
    );
  }

  const deploymentsLink = buildFilteredPath(
    `/servers/${serverId}/deployments`,
    {},
    customRange,
  );
  const sessionsLink = buildFilteredPath(
    `/servers/${serverId}/sessions`,
    {},
    customRange,
  );
  const viewAllLinkClassName =
    "text-[12px] text-muted-foreground underline-offset-2 hover:text-text hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none";

  const handleToolRowClick = (row: ServerStatsToolRow) => {
    navigate(
      buildFilteredPath(
        "/logs",
        { serverId, toolName: row.tool_name },
        customRange,
      ),
    );
  };

  const handleDeploymentRowClick = (row: ServerStatsDeploymentRow) => {
    navigate({
      pathname: `/servers/${serverId}/deployments/${row.deployment_id}`,
      search: searchParams.toString(),
    });
  };

  return (
    <div className="@container/overview space-y-6 p-4">
      <HealthStrip stats={stats} />

      <StatsTable
        title="By tool"
        rows={stats.by_tool}
        getRowKey={(row) => row.tool_name}
        onRowClick={handleToolRowClick}
        columns={[
          { key: "tool", header: "Tool", cell: (row) => row.tool_name },
          {
            key: "requests",
            header: "Requests",
            cell: (row) => row.count.toLocaleString(),
            className: "text-right",
          },
          {
            key: "errors",
            header: "Errors",
            cell: (row) => row.error_count.toLocaleString(),
            className: "text-right",
          },
          {
            key: "error_rate",
            header: "Error rate",
            cell: (row) => (
              <StatusBadge status={errorRateStatus(row.error_rate)}>
                {formatErrorRate(normalizeErrorRate(row.error_rate))}
              </StatusBadge>
            ),
            className: "text-right",
          },
          {
            key: "max_latency",
            header: "Max latency",
            cell: (row) => formatLatency(row.max_latency_ms),
            className: "text-right",
          },
        ]}
      />

      <StatsTable
        title="By deployment"
        headerAction={
          <Link to={deploymentsLink} className={viewAllLinkClassName}>
            View all
          </Link>
        }
        rows={stats.by_deployment}
        getRowKey={(row) => row.deployment_id}
        onRowClick={handleDeploymentRowClick}
        columns={[
          { key: "version", header: "Version", cell: (row) => row.version },
          {
            key: "requests",
            header: "Requests",
            cell: (row) => row.count.toLocaleString(),
            className: "text-right",
          },
          {
            key: "errors",
            header: "Errors",
            cell: (row) => row.error_count.toLocaleString(),
            className: "text-right",
          },
          {
            key: "error_rate",
            header: "Error rate",
            cell: (row) => (
              <StatusBadge status={errorRateStatus(row.error_rate)}>
                {formatErrorRate(normalizeErrorRate(row.error_rate))}
              </StatusBadge>
            ),
            className: "text-right",
          },
        ]}
      />

      <section className="space-y-2">
        <div className="flex items-center gap-3">
          <h3 className="text-[13px] font-semibold text-text">
            Recent sessions
          </h3>
          <Link to={sessionsLink} className={viewAllLinkClassName}>
            View all
          </Link>
        </div>

        {recentSessions.length === 0 ? (
          <EmptyState
            title="No recent sessions"
            description="No sessions recorded for this server in the selected time range."
            className="py-8"
          />
        ) : (
          <div className="overflow-hidden rounded-lg border border-border-soft bg-panel">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-table-row-border">
                  <th className="h-8 px-2 text-left text-[11px] font-semibold uppercase text-faint">
                    Started
                  </th>
                  <th className="h-8 px-2 text-left text-[11px] font-semibold uppercase text-faint">
                    Client
                  </th>
                  <th className="h-8 px-2 text-left text-[11px] font-semibold uppercase text-faint">
                    Status
                  </th>
                  <th className="h-8 px-2 text-right text-[11px] font-semibold uppercase text-faint">
                    Errors
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentSessions.map((session) => (
                  <tr
                    key={session.id}
                    tabIndex={0}
                    role="link"
                    className={cn(
                      "group/session-row cursor-pointer border-b border-table-row-border outline-none last:border-b-0",
                      "hover:bg-panel-2 focus-visible:bg-panel-2 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset active:bg-panel-3",
                    )}
                    onClick={() =>
                      navigate({
                        pathname: `/servers/${serverId}/sessions/${session.id}`,
                        search: searchParams.toString(),
                      })
                    }
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        navigate({
                          pathname: `/servers/${serverId}/sessions/${session.id}`,
                          search: searchParams.toString(),
                        });
                      }
                    }}
                  >
                    <td className="px-2 py-2 text-[12px] text-table-cell">
                      {formatTimestamp(session.started_at)}
                    </td>
                    <td className="px-2 py-2 text-[12px] text-table-cell">
                      {session.client_name}
                    </td>
                    <td className="px-2 py-2 text-[12px]">
                      <StatusBadge
                        status={
                          session.status === "open" ? "success" : "default"
                        }
                      >
                        {session.status}
                      </StatusBadge>
                    </td>
                    <td className="px-2 py-2 text-right text-[12px] text-table-cell">
                      {session.error_count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};
