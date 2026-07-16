import type { KeyboardEvent } from "react";
import type { Server } from "@/lib/api/types";
import { GovernanceBadges } from "@/components/domain/servers/GovernanceBadges";
import { ErrorRateBadge } from "@/components/domain/servers/ErrorRateBadge";
import { SourceIcon } from "@/components/domain/servers/SourceIcon";
import { TableCell, TableRow } from "@/components/ui/Table";
import { cn } from "@/lib/utils";

type ServerRowProps = {
  server: Server;
  isSelected?: boolean;
  compact?: boolean;
  onSelect: (serverId: string) => void;
};

export const ServerRow = ({
  server,
  isSelected = false,
  compact = false,
  onSelect,
}: ServerRowProps) => {
  const handleActivate = () => {
    onSelect(server.id);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTableRowElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelect(server.id);
    }
  };

  return (
    <TableRow
      data-testid={`server-row-${server.id}`}
      data-state={isSelected ? "selected" : undefined}
      tabIndex={0}
      role="link"
      aria-label={`View ${server.display_name}`}
      aria-current={isSelected ? "true" : undefined}
      className={cn(
        "group/server-row cursor-pointer border-table-row-border outline-none",
        "hover:bg-panel-2 focus-visible:bg-panel-2 active:bg-panel-3",
        "data-[state=selected]:bg-panel-3",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
      )}
      onClick={handleActivate}
      onKeyDown={handleKeyDown}
    >
      <TableCell className="min-w-[180px] text-[12px] text-table-cell">
        <div className="flex flex-col gap-0.5">
          <span className="font-medium text-text">{server.display_name}</span>
          <span className="text-[11px] text-muted-foreground">
            {server.name}
          </span>
        </div>
      </TableCell>
      <TableCell>
        <SourceIcon type={server.source_type} />
      </TableCell>
      <TableCell>
        <ErrorRateBadge errorRate={server.error_rate_24h} />
      </TableCell>
      {!compact && (
        <>
          <TableCell>
            <GovernanceBadges server={server} />
          </TableCell>
          <TableCell className="text-[12px] text-table-cell">
            {server.deployment_count ?? "—"}
          </TableCell>
          <TableCell className="text-[12px] text-table-cell">
            {server.open_session_count ?? "—"}
          </TableCell>
        </>
      )}
    </TableRow>
  );
};
