import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
};

export const EmptyState = ({
  title,
  description,
  icon,
  action,
  className,
}: EmptyStateProps) => {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border border-border-soft bg-panel px-6 py-12 text-center",
        className,
      )}
      role="status"
    >
      {icon && (
        <div className="mb-3 text-faint" aria-hidden="true">
          {icon}
        </div>
      )}
      <h3 className="text-[14px] font-semibold text-text">{title}</h3>
      {description && (
        <p className="mt-1 max-w-sm text-[12px] text-muted-foreground">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
};
