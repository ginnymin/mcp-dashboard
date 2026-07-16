import type { KeyboardEvent } from "react";
import { useMemo } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { formatSessionDuration } from "@/components/domain/sessions/session-utils";
import { EmptyState } from "@/components/domain/shared/EmptyState";
import { ErrorState } from "@/components/domain/shared/ErrorState";
import { LoadingTableSkeleton } from "@/components/domain/shared/LoadingTableSkeleton";
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
import { useUrlFilters } from "@/hooks/useUrlFilters";
import { useDeployments } from "@/hooks/queries/useDeployments";
import { useSessions } from "@/hooks/queries/useSessions";
import { formatTimestamp } from "@/lib/filter-links";
import { sessionFilterDefaults, sessionFilterSchema } from "@/lib/url-state";
import { cn } from "@/lib/utils";

export const SessionsTable = () => {
  const { serverId, sessionId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { filters, setFilters } = useUrlFilters(
    sessionFilterSchema,
    sessionFilterDefaults,
  );
  const { data, isLoading, isError, refetch } = useSessions({
    serverId,
    ...filters,
  });
  const { data: deploymentsData } = useDeployments(serverId);

  const sessions = data?.data ?? [];
  const total = data?.total ?? 0;
  const limit = filters.limit ?? sessionFilterDefaults.limit ?? 100;
  const offset = filters.offset ?? 0;
  const isDetailOpen = Boolean(sessionId);
  const hasMore = offset + sessions.length < total;

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

  const handleLoadMore = () => {
    setFilters({ offset: offset + limit });
  };

  if (isLoading) {
    return (
      <div className="p-4">
        <LoadingTableSkeleton columns={isDetailOpen ? 5 : 6} rows={4} />
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

  if (sessions.length === 0) {
    return (
      <div className="p-4">
        <EmptyState
          title="No sessions found"
          description="No sessions match the current filters in the selected time range."
        />
      </div>
    );
  }

  return (
    <div className="space-y-3 p-4">
      <div className="overflow-hidden rounded-lg border border-border-soft bg-panel">
        <Table>
          <TableHeader>
            <TableRow className="border-table-row-border hover:bg-transparent">
              <TableHead className="h-8 px-2 text-[11px] font-semibold uppercase text-faint">
                Started
              </TableHead>
              <TableHead className="h-8 px-2 text-[11px] font-semibold uppercase text-faint">
                Client
              </TableHead>
              {!isDetailOpen && (
                <TableHead className="h-8 px-2 text-[11px] font-semibold uppercase text-faint">
                  Deployment
                </TableHead>
              )}
              <TableHead className="h-8 px-2 text-[11px] font-semibold uppercase text-faint">
                Status
              </TableHead>
              {!isDetailOpen && (
                <TableHead className="h-8 px-2 text-right text-[11px] font-semibold uppercase text-faint">
                  Duration
                </TableHead>
              )}
              <TableHead className="h-8 px-2 text-right text-[11px] font-semibold uppercase text-faint">
                Errors
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sessions.map((session) => {
              const isSelected = session.id === sessionId;

              return (
                <TableRow
                  key={session.id}
                  data-testid={`session-row-${session.id}`}
                  data-state={isSelected ? "selected" : undefined}
                  tabIndex={0}
                  role="link"
                  aria-label={`View session ${session.client_name}`}
                  aria-current={isSelected ? "true" : undefined}
                  className={cn(
                    "group/session-row cursor-pointer border-table-row-border outline-none",
                    "hover:bg-panel-2 focus-visible:bg-panel-2 active:bg-panel-3",
                    "data-[state=selected]:bg-panel-3",
                    "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
                  )}
                  onClick={() => handleSelect(session.id)}
                  onKeyDown={(event) => handleKeyDown(event, session.id)}
                >
                  <TableCell className="px-2 text-[12px] text-table-cell">
                    {formatTimestamp(session.started_at)}
                  </TableCell>
                  <TableCell className="px-2 text-[12px] font-medium text-text">
                    {session.client_name}
                  </TableCell>
                  {!isDetailOpen && (
                    <TableCell className="px-2 text-[12px] text-table-cell">
                      {deploymentVersions.get(session.deployment_id) ?? "—"}
                    </TableCell>
                  )}
                  <TableCell className="px-2 text-[12px]">
                    <StatusBadge
                      status={session.status === "open" ? "success" : "default"}
                    >
                      {session.status}
                    </StatusBadge>
                  </TableCell>
                  {!isDetailOpen && (
                    <TableCell className="px-2 text-right text-[12px] text-table-cell">
                      {formatSessionDuration(
                        session.started_at,
                        session.ended_at,
                      )}
                    </TableCell>
                  )}
                  <TableCell className="px-2 text-right text-[12px] text-table-cell">
                    {session.error_count}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-[12px] text-muted-foreground">
          Showing {Math.min(offset + sessions.length, total)} of {total}
        </p>
        {hasMore && (
          <Button
            variant="outline"
            size="sm"
            className="btn-toolbar focus-visible:ring-ring"
            onClick={handleLoadMore}
          >
            Load more
          </Button>
        )}
      </div>
    </div>
  );
};
