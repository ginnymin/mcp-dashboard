import type { KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";
import type { LogSummary } from "@/lib/api/types";
import {
  MethodBadge,
  type McpMethod,
} from "@/components/domain/shared/MethodBadge";
import { StatusBadge } from "@/components/domain/shared/StatusBadge";
import { formatLatency, formatTimestamp } from "@/lib/filter-links";
import { cn } from "@/lib/utils";

const MCP_METHODS = new Set<McpMethod>([
  "initialize",
  "tools/list",
  "tools/call",
]);

const isMcpMethod = (method: string): method is McpMethod =>
  MCP_METHODS.has(method as McpMethod);

type TimelineEntryProps = {
  log: LogSummary;
};

export const TimelineEntry = ({ log }: TimelineEntryProps) => {
  const navigate = useNavigate();
  const isError = log.status === "error";

  const handleActivate = () => {
    navigate(`/logs/${log.id}`);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleActivate();
    }
  };

  return (
    <button
      type="button"
      data-testid={`timeline-entry-${log.id}`}
      aria-label={`View log ${log.method}${log.tool_name ? ` ${log.tool_name}` : ""}`}
      className={cn(
        "group/timeline-entry flex w-full items-start gap-3 rounded-lg border px-3 py-2.5 text-left outline-none transition-colors",
        "cursor-pointer hover:border-border-hover hover:bg-panel-2 focus-visible:bg-panel-2 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset active:bg-panel-3",
        isError
          ? "border-error-border/75 hover:border-error-border-hover bg-tag-bg"
          : "border-border-soft bg-panel",
      )}
      onClick={handleActivate}
      onKeyDown={handleKeyDown}
    >
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[12px] tabular-nums text-table-cell">
            {formatTimestamp(log.ts)}
          </span>
          {isMcpMethod(log.method) && <MethodBadge method={log.method} />}
          {log.tool_name && (
            <span className="text-[12px] font-medium text-text">
              {log.tool_name}
            </span>
          )}
          <span className="text-[12px] text-muted-foreground ml-auto">
            {formatLatency(log.latency_ms)}
          </span>
        </div>
        <div className="flex items-start gap-2">
          <StatusBadge status={isError ? "error" : "success"}>
            {log.status}
          </StatusBadge>
          {log.error_message && (
            <span className="text-[12px] text-muted-foreground truncate">
              {log.error_message}
            </span>
          )}
        </div>
      </div>
    </button>
  );
};
