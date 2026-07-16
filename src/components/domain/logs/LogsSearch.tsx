import { LogFilters } from "@/components/domain/logs/LogFilters";
import { LogsTable } from "@/components/domain/logs/LogsTable";
import { useTimeRange } from "@/hooks/useTimeRange";
import { formatTimeRangeLabel } from "../servers/server-list-utils";

export const LogsSearch = () => {
  const { preset, customRange } = useTimeRange();

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="px-4 pt-5 pb-1">
        <p className="text-[12px] text-muted-foreground">
          {formatTimeRangeLabel(preset, customRange?.since, customRange?.until)}{" "}
          · Search MCP request logs across servers.
        </p>
      </div>
      <LogFilters />
      <LogsTable />
    </div>
  );
};
