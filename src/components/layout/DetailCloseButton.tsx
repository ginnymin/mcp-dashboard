import { X } from "lucide-react";
import { useOutletContext } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import type { DetailOutletContext } from "@/components/layout/detail-outlet-context";
import { cn } from "@/lib/utils";

type DetailCloseButtonProps = {
  className?: string;
};

export const DetailCloseButton = ({ className }: DetailCloseButtonProps) => {
  const { closeDetail, closeLabel } = useOutletContext<DetailOutletContext>();

  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn(
        "shrink-0 hover:bg-panel-2 hover:text-text focus-visible:ring-ring inline-flex cursor-pointer",
        className,
      )}
      onClick={closeDetail}
      aria-label={closeLabel}
      data-testid="detail-close-button"
    >
      <X className="size-4" aria-hidden="true" />
      <span className="sr-only">Close</span>
    </Button>
  );
};
