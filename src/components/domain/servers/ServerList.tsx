import { ArrowUpDown } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ServerRow } from "@/components/domain/servers/ServerRow";
import {
  formatTimeRangeLabel,
  sortServers,
  type ServerSortDirection,
  type ServerSortKey,
} from "@/components/domain/servers/server-list-utils";
import { EmptyState } from "@/components/domain/shared/EmptyState";
import { ErrorState } from "@/components/domain/shared/ErrorState";
import { LoadingTableSkeleton } from "@/components/domain/shared/LoadingTableSkeleton";
import { Button } from "@/components/ui/Button";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import { useTimeRange } from "@/hooks/useTimeRange";
import { useServers } from "@/hooks/queries/useServers";
import { cn } from "@/lib/utils";

const SORT_COLUMNS: Array<{
  key: ServerSortKey | null;
  label: string;
  sortable: boolean;
  hideWhenDetailOpen?: boolean;
}> = [
  { key: "name", label: "Server", sortable: true },
  { key: null, label: "Source", sortable: false },
  { key: "error_rate", label: "Errors", sortable: true },
  {
    key: null,
    label: "Governance",
    sortable: false,
    hideWhenDetailOpen: true,
  },
  {
    key: null,
    label: "Deployments",
    sortable: false,
    hideWhenDetailOpen: true,
  },
  {
    key: "sessions",
    label: "Open sessions",
    sortable: true,
    hideWhenDetailOpen: true,
  },
];

export const ServerList = () => {
  const navigate = useNavigate();
  const { serverId: selectedServerId } = useParams();
  const [searchParams] = useSearchParams();
  const { preset, customRange } = useTimeRange();
  const { data, isLoading, isError, refetch } = useServers();
  const [sortKey, setSortKey] = useState<ServerSortKey>("name");
  const [sortDirection, setSortDirection] =
    useState<ServerSortDirection>("asc");

  const servers = useMemo(
    () => sortServers(data?.data ?? [], sortKey, sortDirection),
    [data?.data, sortDirection, sortKey],
  );
  const isDetailOpen = Boolean(selectedServerId);
  const visibleColumns = useMemo(
    () =>
      SORT_COLUMNS.filter(
        (column) => !isDetailOpen || !column.hideWhenDetailOpen,
      ),
    [isDetailOpen],
  );

  const handleSort = (nextKey: ServerSortKey) => {
    if (sortKey === nextKey) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));

      return;
    }

    setSortKey(nextKey);
    setSortDirection(nextKey === "name" ? "asc" : "desc");
  };

  const handleSelectServer = (serverId: string) => {
    navigate({
      pathname: `/servers/${serverId}/overview`,
      search: searchParams.toString(),
    });
  };

  if (isLoading) {
    return (
      <div className="p-4">
        <ServerListHeader preset={preset} customRange={customRange} />
        <LoadingTableSkeleton columns={isDetailOpen ? 3 : 6} rows={6} />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-4">
        <ServerListHeader preset={preset} customRange={customRange} />
        <ErrorState onRetry={() => refetch()} />
      </div>
    );
  }

  if (servers.length === 0) {
    return (
      <div className="p-4">
        <ServerListHeader preset={preset} customRange={customRange} />
        <EmptyState
          title="No servers connected"
          description="Connect an MCP server to the gateway or run npm run seed to load sample data."
        />
      </div>
    );
  }

  return (
    <div className="p-4">
      <ServerListHeader
        preset={preset}
        customRange={customRange}
        count={servers.length}
      />

      <div className="overflow-hidden rounded-lg border border-border-soft bg-panel">
        <Table>
          <TableHeader>
            <TableRow className="border-table-row-border hover:bg-transparent">
              {visibleColumns.map(({ key, label, sortable }) => {
                const isActive = sortable && sortKey === key;

                return (
                  <TableHead
                    key={label}
                    className="h-8 text-[11px] font-semibold text-faint"
                    aria-sort={
                      isActive
                        ? sortDirection === "asc"
                          ? "ascending"
                          : "descending"
                        : "none"
                    }
                  >
                    {sortable && key ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className={cn(
                          "h-7 px-1.5 text-[11px] font-semibold uppercase hover:bg-panel-2 hover:text-text",
                          isActive ? "text-text" : "text-faint",
                        )}
                        onClick={() => handleSort(key)}
                      >
                        {label}
                        <ArrowUpDown className="size-3" aria-hidden="true" />
                      </Button>
                    ) : (
                      <span className="px-1.5 uppercase">{label}</span>
                    )}
                  </TableHead>
                );
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            {servers.map((server) => (
              <ServerRow
                key={server.id}
                server={server}
                isSelected={server.id === selectedServerId}
                compact={isDetailOpen}
                onSelect={handleSelectServer}
              />
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

type ServerListHeaderProps = {
  preset: string;
  customRange?: { since: string; until: string } | null;
  count?: number;
};

const ServerListHeader = ({
  preset,
  customRange,
  count,
}: ServerListHeaderProps) => {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <p className="mt-1 text-[12px] text-muted-foreground">
        {formatTimeRangeLabel(preset, customRange?.since, customRange?.until)}
        {count != null ? ` · ${count} connected` : ""}
      </p>
    </div>
  );
};
