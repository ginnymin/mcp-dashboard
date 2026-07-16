import {
  Archive,
  Github,
  GitBranch,
  Gitlab,
  type LucideIcon,
} from "lucide-react";
import type { Server } from "@/lib/api/types";
import { cn } from "@/lib/utils";

type SourceType = Server["source_type"];

const SOURCE_ICONS: Record<SourceType, LucideIcon> = {
  github: Github,
  gitlab: Gitlab,
  bitbucket: GitBranch,
  local: Archive,
};

const SOURCE_LABELS: Record<SourceType, string> = {
  github: "GitHub",
  gitlab: "GitLab",
  bitbucket: "Bitbucket",
  local: "Local upload",
};

type SourceIconProps = {
  type: SourceType;
  className?: string;
  showLabel?: boolean;
};

export const SourceIcon = ({
  type,
  className,
  showLabel = false,
}: SourceIconProps) => {
  const Icon = SOURCE_ICONS[type];
  const label = SOURCE_LABELS[type];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-muted-foreground",
        className,
      )}
      title={label}
    >
      <Icon className="size-3.5 shrink-0" aria-hidden="true" />
      {showLabel && <span className="text-[12px]">{label}</span>}
      {!showLabel && <span className="sr-only">{label}</span>}
    </span>
  );
};
