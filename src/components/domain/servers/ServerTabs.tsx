import { NavLink, useParams } from "react-router-dom";
import type { Server } from "@/lib/api/types";
import { useTimeRange } from "@/hooks/useTimeRange";
import { buildFilteredPath } from "@/lib/filter-links";
import { cn } from "@/lib/utils";

const SERVER_TABS = [
  { label: "Overview", segment: "overview" },
  { label: "Deployments", segment: "deployments" },
  { label: "Sessions", segment: "sessions" },
  { label: "Audit", segment: "audit", requiresAudit: true },
] as const;

type ServerTabsProps = {
  server: Server;
  className?: string;
};

export const ServerTabs = ({ server, className }: ServerTabsProps) => {
  const { serverId } = useParams();
  const { customRange } = useTimeRange();
  const tabs = SERVER_TABS.filter(
    (tab) =>
      !("requiresAudit" in tab && tab.requiresAudit) || server.audit_enabled,
  );

  return (
    <nav
      className={cn("flex flex-wrap gap-1", className)}
      aria-label="Server sections"
    >
      {tabs.map(({ label, segment }) => (
        <NavLink
          key={segment}
          to={buildFilteredPath(
            `/servers/${serverId}/${segment}`,
            {},
            customRange,
          )}
          className={({ isActive }) =>
            cn(
              "rounded-md border border-transparent px-2.5 py-1.5 text-[12px] text-muted-foreground transition-colors",
              "hover:border-border hover:bg-panel-2 hover:text-text focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
              "active:bg-panel-3",
              isActive && "border-border bg-panel-2 font-medium text-text",
            )
          }
        >
          {label}
        </NavLink>
      ))}
    </nav>
  );
};
