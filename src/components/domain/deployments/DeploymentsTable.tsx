import type { KeyboardEvent } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { DeploymentStatusBadge } from "@/components/domain/deployments/DeploymentStatusBadge";
import { EmptyState } from "@/components/domain/shared/EmptyState";
import { ErrorState } from "@/components/domain/shared/ErrorState";
import { LoadingTableSkeleton } from "@/components/domain/shared/LoadingTableSkeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import { useDeployments } from "@/hooks/queries/useDeployments";
import { formatTimestamp } from "@/lib/filter-links";
import { cn } from "@/lib/utils";

export const DeploymentsTable = () => {
  const { serverId, deploymentId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { data, isLoading, isError, refetch } = useDeployments(serverId);

  const deployments = data?.data ?? [];
  const isDetailOpen = Boolean(deploymentId);

  const handleSelect = (deploymentId: string) => {
    navigate({
      pathname: deploymentId,
      search: searchParams.toString(),
    });
  };

  const handleKeyDown = (
    event: KeyboardEvent<HTMLTableRowElement>,
    deploymentId: string,
  ) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleSelect(deploymentId);
    }
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

  if (deployments.length === 0) {
    return (
      <div className="p-4">
        <EmptyState
          title="No deployments"
          description="This server does not have any deployments yet."
        />
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="overflow-hidden rounded-lg border border-border-soft bg-panel">
        <Table>
          <TableHeader>
            <TableRow className="border-table-row-border hover:bg-transparent">
              <TableHead className="h-8 text-[11px] font-semibold uppercase text-faint px-2">
                Version
              </TableHead>
              {!isDetailOpen && (
                <TableHead className="h-8 text-[11px] font-semibold uppercase text-faint px-2">
                  Created
                </TableHead>
              )}
              {!isDetailOpen && (
                <TableHead className="h-8 text-center text-[11px] font-semibold uppercase text-faint px-2">
                  Tools
                </TableHead>
              )}
              <TableHead className="h-8 text-center text-[11px] font-semibold uppercase text-faint px-2">
                Sessions
              </TableHead>
              <TableHead className="h-8 text-center text-[11px] font-semibold uppercase text-faint px-2">
                Errors
              </TableHead>
              <TableHead className="h-8 text-[11px] font-semibold uppercase text-faint px-2">
                Status
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {deployments.map((deployment) => {
              const isSelected = deployment.id === deploymentId;

              return (
                <TableRow
                  key={deployment.id}
                  data-testid={`deployment-row-${deployment.id}`}
                  data-state={isSelected ? "selected" : undefined}
                  tabIndex={0}
                  role="link"
                  aria-label={`View deployment ${deployment.version}`}
                  aria-current={isSelected ? "true" : undefined}
                  className={cn(
                    "group/deployment-row cursor-pointer border-table-row-border outline-none",
                    "hover:bg-panel-2 focus-visible:bg-panel-2 active:bg-panel-3",
                    "data-[state=selected]:bg-panel-3",
                    "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
                  )}
                  onClick={() => handleSelect(deployment.id)}
                  onKeyDown={(event) => handleKeyDown(event, deployment.id)}
                >
                  <TableCell className="text-[12px] font-medium text-text">
                    {deployment.version}
                  </TableCell>
                  {!isDetailOpen && (
                    <TableCell className="text-[12px] text-table-cell">
                      {formatTimestamp(deployment.created_at)}
                    </TableCell>
                  )}
                  {!isDetailOpen && (
                    <TableCell className="text-center text-[12px] text-table-cell">
                      {deployment.tool_count ?? "—"}
                    </TableCell>
                  )}
                  <TableCell className="text-center text-[12px] text-table-cell">
                    {deployment.session_count ?? "—"}
                  </TableCell>
                  <TableCell className="text-center text-[12px] text-table-cell">
                    {deployment.error_count ?? "—"}
                  </TableCell>
                  <TableCell>
                    <DeploymentStatusBadge status={deployment.status} />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
