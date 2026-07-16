import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "group/badge inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden border font-medium whitespace-nowrap [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        default:
          "h-5 rounded-4xl border-transparent px-2 py-0.5 text-xs transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 bg-primary text-primary-foreground [a]:hover:bg-primary/80",
        secondary:
          "h-5 rounded-4xl border-transparent px-2 py-0.5 text-xs transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 bg-secondary text-secondary-foreground [a]:hover:bg-secondary/80",
        destructive:
          "h-5 rounded-4xl border-transparent px-2 py-0.5 text-xs transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 bg-destructive/10 text-destructive dark:bg-destructive/20 [a]:hover:bg-destructive/20",
        outline:
          "h-5 rounded-4xl px-2 py-0.5 text-xs transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 border-border text-foreground [a]:hover:bg-muted [a]:hover:text-muted-foreground",
        ghost:
          "h-5 rounded-4xl border-transparent px-2 py-0.5 text-xs transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 hover:bg-muted hover:text-muted-foreground dark:hover:bg-muted/50",
        link: "h-5 rounded-4xl border-transparent px-2 py-0.5 text-xs text-primary underline-offset-4 hover:underline",
        tag: "min-h-[21px] rounded-[5px] border-tag-border bg-tag-bg px-[7px] text-[11px] text-tag-text",
        "tag-success":
          "min-h-[21px] rounded-[5px] border-success-border bg-tag-bg px-[7px] text-[11px] text-success-text",
        "tag-warning":
          "min-h-[21px] rounded-[5px] border-warning-border bg-tag-bg px-[7px] text-[11px] text-warning-text",
        "tag-error":
          "min-h-[21px] rounded-[5px] border-error-border bg-tag-bg px-[7px] text-[11px] text-error-text",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

const Badge = ({
  className,
  variant = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) => {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant }), className),
      },
      props,
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  });
};

export { Badge };
