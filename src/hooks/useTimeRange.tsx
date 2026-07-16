import {
  createContext,
  use,
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useSearchParams } from "react-router-dom";
import {
  DEFAULT_TIME_RANGE_PRESET,
  readCustomRangeFromParams,
  resolveTimeRangeApiParams,
  type TimeRangePreset,
} from "@/lib/url-state";

export type TimeRangeApiParams = {
  since: string;
  until?: string;
};

export type CustomTimeRange = {
  since: string;
  until: string;
};

type TimeRangeContextValue = {
  preset: TimeRangePreset;
  setPreset: (preset: Exclude<TimeRangePreset, "custom">) => void;
  customRange: CustomTimeRange | null;
  getApiParams: () => TimeRangeApiParams;
};

const TimeRangeContext = createContext<TimeRangeContextValue | null>(null);

type TimeRangeProviderProps = {
  children: ReactNode;
};

export const TimeRangeProvider = ({ children }: TimeRangeProviderProps) => {
  const [preset, setPresetState] = useState<Exclude<TimeRangePreset, "custom">>(
    DEFAULT_TIME_RANGE_PRESET,
  );
  const [searchParams, setSearchParams] = useSearchParams();
  const customRange = useMemo(
    () => readCustomRangeFromParams(searchParams),
    [searchParams],
  );
  const activePreset: TimeRangePreset = customRange ? "custom" : preset;

  const setPreset = useCallback(
    (next: Exclude<TimeRangePreset, "custom">) => {
      setPresetState(next);
      setSearchParams(
        (current) => {
          const params = new URLSearchParams(current);
          params.delete("since");
          params.delete("until");

          return params;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const getApiParams = useCallback(
    () => resolveTimeRangeApiParams(preset, customRange),
    [customRange, preset],
  );

  const value = useMemo(
    () => ({
      preset: activePreset,
      setPreset,
      customRange,
      getApiParams,
    }),
    [activePreset, customRange, getApiParams, setPreset],
  );

  return <TimeRangeContext value={value}>{children}</TimeRangeContext>;
};

export const useTimeRange = () => {
  const context = use(TimeRangeContext);

  if (!context) {
    throw new Error("useTimeRange must be used within TimeRangeProvider");
  }

  return context;
};
