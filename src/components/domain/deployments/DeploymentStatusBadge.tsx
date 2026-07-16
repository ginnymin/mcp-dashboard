import type { DeploymentStatus } from "@/lib/api/types";
import { Badge } from "@/components/ui/Badge";

const STATUS_LABELS: Record<DeploymentStatus, string> = {
  live: "Live",
  superseded: "Superseded",
  rolled_back: "Rolled back",
  draining: "Draining",
  build_failed: "Build failed",
  building: "Building",
};

const STATUS_VARIANT = {
  live: "tag-success",
  superseded: "tag",
  rolled_back: "tag-error",
  draining: "tag-warning",
  build_failed: "tag-error",
  building: "tag-warning",
} as const;

type DeploymentStatusBadgeProps = {
  status: DeploymentStatus;
  className?: string;
};

export const DeploymentStatusBadge = ({
  status,
  className,
}: DeploymentStatusBadgeProps) => {
  return (
    <Badge variant={STATUS_VARIANT[status]} className={className}>
      {STATUS_LABELS[status]}
    </Badge>
  );
};
