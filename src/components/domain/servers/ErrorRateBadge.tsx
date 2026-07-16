import {
  formatErrorRate,
  getErrorRateLevel,
} from "@/components/domain/servers/server-list-utils";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

const ERROR_RATE_VARIANT = {
  low: "tag-success",
  medium: "tag-warning",
  high: "tag-error",
} as const;

type ErrorRateBadgeProps = {
  errorRate: number | null | undefined;
  className?: string;
};

export const ErrorRateBadge = ({
  errorRate,
  className,
}: ErrorRateBadgeProps) => {
  const level = getErrorRateLevel(errorRate);

  return (
    <Badge
      variant={ERROR_RATE_VARIANT[level]}
      className={cn("min-w-[52px] rounded-lg", className)}
    >
      {formatErrorRate(errorRate)}
    </Badge>
  );
};
