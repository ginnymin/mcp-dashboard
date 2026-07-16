import { cn } from "@/lib/utils";
import { TIME_RANGE_PRESETS } from "@/lib/url-state";
import { useTimeRange } from "@/hooks/useTimeRange";

export const TimeRangePicker = () => {
  const { preset, setPreset } = useTimeRange();

  return (
    <div
      className="flex items-center rounded-md border border-border bg-surface-button p-0.5"
      role="group"
      aria-label="Time range"
    >
      {TIME_RANGE_PRESETS.map((option) => (
        <button
          key={option}
          type="button"
          aria-pressed={preset === option}
          className={cn(
            "cursor-pointer rounded-[5px] px-2.5 py-1 text-[11px] font-medium transition-colors",
            "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
            "hover:bg-white/12 active:bg-panel-3",
            preset === option
              ? "bg-white/9 text-white"
              : "hover:text-tag-text text-tag-text",
          )}
          onClick={() => setPreset(option)}
        >
          {option}
        </button>
      ))}
    </div>
  );
};
