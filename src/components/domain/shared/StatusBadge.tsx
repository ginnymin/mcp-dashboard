import { cva, type VariantProps } from "class-variance-authority";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const statusBadgeVariants = cva(
  "inline-flex min-h-[21px] items-center rounded-[5px] border px-[7px] text-[11px] font-medium uppercase tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-bg",
  {
    variants: {
      status: {
        default:
          "border-border bg-tag-bg text-tag-text hover:border-border-hover hover:bg-tag-bg-hover",
        success:
          "border-success-border bg-tag-bg text-success-text hover:border-success-border-hover hover:bg-tag-bg-hover",
        error:
          "border-error-border bg-tag-bg text-error-text hover:border-error-border-hover hover:bg-tag-bg-hover",
      },
    },
    defaultVariants: {
      status: "success",
    },
  },
);

type StatusBadgeProps = VariantProps<typeof statusBadgeVariants> & {
  status: "success" | "error" | "default";
  className?: string;
  children?: ReactNode;
};

export const StatusBadge = ({
  status,
  className,
  children,
}: StatusBadgeProps) => {
  const label = children ?? (status === "success" ? "success" : "error");

  return (
    <span className={cn(statusBadgeVariants({ status }), className)}>
      {label}
    </span>
  );
};
