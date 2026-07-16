import { RefreshCw } from "lucide-react";
import { useState } from "react";
import { useRefreshCurrentView } from "@/hooks/useRefreshCurrentView";
import { cn } from "@/lib/utils";

export const RefreshButton = () => {
  const { refresh } = useRefreshCurrentView();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);

    void refresh().finally(() => {
      setIsRefreshing(false);
    });
  };

  return (
    <button
      type="button"
      aria-label="Refresh current view"
      disabled={isRefreshing}
      className={cn(
        "flex size-7 cursor-pointer items-center justify-center rounded-md border border-border bg-surface-button text-tag-text transition-colors",
        "hover:bg-white/12 active:bg-panel-3",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
        "disabled:cursor-not-allowed disabled:opacity-60",
      )}
      onClick={handleRefresh}
    >
      <RefreshCw
        className={cn("size-3.5", isRefreshing && "animate-spin")}
        aria-hidden="true"
      />
    </button>
  );
};
