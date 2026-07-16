import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

type ErrorStateProps = {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
};

export const ErrorState = ({
  title = "Something went wrong",
  message = "We couldn't load this data. Try again.",
  onRetry,
  className,
}: ErrorStateProps) => {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border border-border-soft bg-panel px-6 py-12 text-center",
        className,
      )}
      role="alert"
    >
      <AlertCircle className="mb-3 size-8 text-red" aria-hidden="true" />
      <h3 className="text-[14px] font-semibold text-text">{title}</h3>
      <p className="mt-1 max-w-sm text-[12px] text-muted-foreground">
        {message}
      </p>
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          className="btn-toolbar mt-4 focus-visible:ring-ring"
          onClick={onRetry}
        >
          Retry
        </Button>
      )}
    </div>
  );
};
