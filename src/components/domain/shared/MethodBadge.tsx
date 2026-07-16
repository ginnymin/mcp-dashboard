import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export type McpMethod = "initialize" | "tools/list" | "tools/call";

const methodBadgeVariants = cva(
  "inline-flex min-h-[21px] items-center rounded-[5px] border px-[7px] text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-bg",
  {
    variants: {
      method: {
        initialize:
          "border-method-init-border bg-tag-bg text-method-init-text hover:border-method-init-border-hover hover:bg-tag-bg-hover",
        "tools/list":
          "border-method-list-border bg-tag-bg text-method-list-text hover:border-method-list-border-hover hover:bg-tag-bg-hover",
        "tools/call":
          "border-method-call-border bg-tag-bg text-method-call-text hover:border-method-call-border-hover hover:bg-tag-bg-hover",
      },
    },
    defaultVariants: {
      method: "initialize",
    },
  },
);

const METHOD_LABELS: Record<McpMethod, string> = {
  initialize: "initialize",
  "tools/list": "tools/list",
  "tools/call": "tools/call",
};

type MethodBadgeProps = VariantProps<typeof methodBadgeVariants> & {
  method: McpMethod;
  className?: string;
};

export const MethodBadge = ({ method, className }: MethodBadgeProps) => {
  return (
    <span className={cn(methodBadgeVariants({ method }), className)}>
      {METHOD_LABELS[method]}
    </span>
  );
};
