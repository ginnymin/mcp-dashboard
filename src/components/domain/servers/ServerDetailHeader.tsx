import type { Server } from "@/lib/api/types";
import { GovernanceBadges } from "@/components/domain/servers/GovernanceBadges";
import { SourceIcon } from "@/components/domain/servers/SourceIcon";
import { DetailCloseButton } from "@/components/layout/DetailCloseButton";
import { cn } from "@/lib/utils";

const formatSourceMetadata = (server: Server) => {
  const source = server.source;

  switch (server.source_type) {
    case "github":
    case "gitlab":
    case "bitbucket": {
      const owner = source.owner as string | undefined;
      const repo = source.repo as string | undefined;
      const branch = (source.branch ?? source.default_branch) as
        | string
        | undefined;
      const repoPath = owner && repo ? `${owner}/${repo}` : null;

      if (repoPath && branch) {
        return repoPath + " · " + branch;
      }

      return repoPath;
    }
    case "local":
      return "Local upload";
    default:
      return null;
  }
};

type ServerDetailHeaderProps = {
  server: Server;
  className?: string;
};

export const ServerDetailHeader = ({
  server,
  className,
}: ServerDetailHeaderProps) => {
  const sourceMetadata = formatSourceMetadata(server);
  const repoUrl = server.source.repo_url as string | undefined;

  return (
    <div
      className={cn(
        "shrink-0 border-b border-border-soft px-4 py-3",
        className,
      )}
    >
      <div className="space-y-2">
        <div className="flex justify-between">
          <div>
            <h2 className="text-[14px] font-semibold text-text">
              {server.display_name}
            </h2>
            {server.description && (
              <p className="mt-0.5 text-[12px] text-muted-foreground">
                {server.description}
              </p>
            )}
          </div>
          <DetailCloseButton />
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[12px] text-muted-foreground">
          <SourceIcon type={server.source_type} showLabel />
          {sourceMetadata &&
            (repoUrl ? (
              <a
                href={repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="truncate text-table-cell underline-offset-2 hover:text-text hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                {sourceMetadata}
              </a>
            ) : (
              <span className="text-table-cell">{sourceMetadata}</span>
            ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <GovernanceBadges server={server} />
          {server.rate_limit_enabled && server.rate_limit_rpm != null && (
            <span className="text-[11px] text-muted-foreground">
              {server.rate_limit_rpm} req/min
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
