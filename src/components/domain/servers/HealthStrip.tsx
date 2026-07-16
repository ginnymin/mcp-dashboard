import type { ServerStats } from "@/lib/api/types";
import {
  formatErrorRate,
  normalizeErrorRate,
} from "@/components/domain/servers/server-list-utils";
import { formatLatency } from "@/lib/filter-links";
import { cn } from "@/lib/utils";

type HealthStripProps = {
  stats: ServerStats;
  className?: string;
};

const METRICS = [
  {
    label: "Total requests",
    value: (stats: ServerStats) => stats.total_requests.toLocaleString(),
  },
  {
    label: "Error rate",
    value: (stats: ServerStats) =>
      formatErrorRate(normalizeErrorRate(stats.error_rate)),
  },
  {
    label: "p50 latency",
    value: (stats: ServerStats) => formatLatency(stats.p50_latency_ms),
  },
  {
    label: "p95 latency",
    value: (stats: ServerStats) => formatLatency(stats.p95_latency_ms),
  },
] as const;

export const HealthStrip = ({ stats, className }: HealthStripProps) => {
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-3 @min-md/overview:grid-cols-4",
        className,
      )}
    >
      {METRICS.map(({ label, value }) => (
        <div
          key={label}
          className="rounded-lg border border-border-soft bg-panel px-3 py-2.5"
        >
          <p className="text-[11px] font-medium text-faint">{label}</p>
          <p className="mt-1 text-[18px] font-semibold tabular-nums text-text">
            {value(stats)}
          </p>
        </div>
      ))}
    </div>
  );
};
