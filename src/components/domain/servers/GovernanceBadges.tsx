import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

type GovernanceFlags = {
  auth_enabled?: boolean;
  audit_enabled?: boolean;
  rate_limit_enabled?: boolean;
};

type GovernanceBadgesProps = {
  server: GovernanceFlags;
  className?: string;
};

export const GovernanceBadges = ({
  server,
  className,
}: GovernanceBadgesProps) => {
  const badges: string[] = [];
  if (server.auth_enabled) badges.push("Auth");
  if (server.audit_enabled) badges.push("Audit");
  if (server.rate_limit_enabled) badges.push("Rate limit");
  if (badges.length === 0) return null;

  return (
    <div className={cn("flex flex-nowrap gap-1.5", className)}>
      {badges.map((label) => (
        <Badge key={label} variant="tag">
          {label}
        </Badge>
      ))}
    </div>
  );
};
