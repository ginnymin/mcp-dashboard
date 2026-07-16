import { Outlet, useParams } from "react-router-dom";
import { ServerDetailHeader } from "@/components/domain/servers/ServerDetailHeader";
import { ServerTabs } from "@/components/domain/servers/ServerTabs";
import { ErrorState } from "@/components/domain/shared/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { useServer } from "@/hooks/queries/useServer";
import { ApiError } from "@/lib/api/client";

const ServerDetailSkeleton = () => {
  return (
    <div
      className="flex min-h-0 flex-1 flex-col"
      aria-busy="true"
      aria-label="Loading server"
    >
      <div className="shrink-0 space-y-3 border-b border-border-soft px-4 py-3">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-5 w-56" />
        <Skeleton className="h-4 w-72" />
        <Skeleton className="h-5 w-48" />
      </div>
      <div className="flex gap-2 px-4 py-3">
        <Skeleton className="h-7 w-20" />
        <Skeleton className="h-7 w-24" />
        <Skeleton className="h-7 w-20" />
      </div>
    </div>
  );
};

export const ServerDetailPanel = () => {
  const { serverId } = useParams();
  const {
    data: server,
    isLoading,
    isError,
    error,
    refetch,
  } = useServer(serverId);

  if (isLoading) {
    return <ServerDetailSkeleton />;
  }

  if (isError) {
    const isNotFound = error instanceof ApiError && error.status === 404;

    return (
      <div className="p-4">
        <ErrorState
          title={isNotFound ? "Server not found" : "Something went wrong"}
          message={
            isNotFound
              ? "This server does not exist or may have been removed."
              : "We couldn't load this server. Try again."
          }
          onRetry={isNotFound ? undefined : () => refetch()}
        />
      </div>
    );
  }

  if (!server) {
    return null;
  }

  return (
    <div className="flex min-h-0 h-full flex-1 flex-col">
      <ServerDetailHeader server={server} />
      <div className="shrink-0 border-b border-border-soft px-4 py-2">
        <ServerTabs server={server} />
      </div>
      <div className="min-h-0 h-full flex-1 overflow-auto">
        <Outlet />
      </div>
    </div>
  );
};
