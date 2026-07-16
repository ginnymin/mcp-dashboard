import { z } from "zod";
import type { AuditFilters, LogFilters, SessionFilters } from "@/lib/api/types";

const optionalString = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().optional(),
);

const optionalLimit = z.preprocess((value) => {
  if (value === undefined || value === "") {
    return undefined;
  }

  const parsed = Number(value);

  if (Number.isNaN(parsed)) {
    return undefined;
  }

  return parsed;
}, z.number().int().min(1).max(500).optional());

const optionalOffset = z.preprocess((value) => {
  if (value === undefined || value === "") {
    return undefined;
  }

  const parsed = Number(value);

  if (Number.isNaN(parsed)) {
    return undefined;
  }

  return parsed;
}, z.number().int().min(0).optional());

export const logFilterSchema = z.object({
  serverId: optionalString,
  deploymentId: optionalString,
  sessionId: optionalString,
  toolName: optionalString,
  status: optionalString,
  errorCode: optionalString,
  method: optionalString,
  limit: optionalLimit,
  offset: optionalOffset,
});

export const sessionFilterSchema = z.object({
  deploymentId: optionalString,
  clientName: optionalString,
  status: optionalString,
  limit: optionalLimit,
  offset: optionalOffset,
});

export const auditFilterSchema = z.object({
  eventType: optionalString,
});

export const logFilterDefaults: LogFilters = {
  limit: 100,
  offset: 0,
};

export const sessionFilterDefaults: SessionFilters = {
  limit: 100,
  offset: 0,
};

export const auditFilterDefaults: AuditFilters = {};

export type TimeRangePreset = "1h" | "24h" | "7d" | "custom";

export const TIME_RANGE_PRESETS = ["1h", "24h", "7d"] as const;

const PRESET_MS: Record<(typeof TIME_RANGE_PRESETS)[number], number> = {
  "1h": 60 * 60 * 1000,
  "24h": 24 * 60 * 60 * 1000,
  "7d": 7 * 24 * 60 * 60 * 1000,
};

export const DEFAULT_TIME_RANGE_PRESET: Exclude<TimeRangePreset, "custom"> =
  "24h";

export const computeSinceFromPreset = (
  preset: Exclude<TimeRangePreset, "custom">,
  now = new Date(),
) => new Date(now.getTime() - PRESET_MS[preset]).toISOString();

export const readCustomRangeFromParams = (searchParams: URLSearchParams) => {
  const since = searchParams.get("since");
  const until = searchParams.get("until");

  if (since && until) {
    return { since, until };
  }

  return null;
};

export const resolveTimeRangeApiParams = (
  preset: Exclude<TimeRangePreset, "custom">,
  customRange: { since: string; until: string } | null,
  now = new Date(),
): { since: string; until?: string } => {
  if (customRange) {
    return customRange;
  }

  return { since: computeSinceFromPreset(preset, now) };
};

const pickKnownParams = (
  searchParams: URLSearchParams,
  keys: readonly string[],
) => {
  const raw: Record<string, string> = {};

  for (const key of keys) {
    const value = searchParams.get(key);

    if (value !== null) {
      raw[key] = value;
    }
  }

  return raw;
};

export const parseSearchParams = <T extends Record<string, unknown>>(
  searchParams: URLSearchParams,
  schema: z.ZodObject<z.ZodRawShape>,
  defaults: T,
): T => {
  const keys = Object.keys(schema.shape);
  const result = schema.safeParse(pickKnownParams(searchParams, keys));

  if (!result.success) {
    return defaults;
  }

  return {
    ...defaults,
    ...stripEmpty(result.data),
  };
};

export const stripEmpty = <T extends Record<string, unknown>>(values: T) => {
  const cleaned: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined && value !== null && value !== "") {
      cleaned[key] = value;
    }
  }

  return cleaned as Partial<T>;
};

export const serializeFilters = (filters: Record<string, unknown>) => {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(stripEmpty(filters))) {
    params.set(key, String(value));
  }

  return params;
};

export const patchSearchParams = (
  current: URLSearchParams,
  updates: Record<string, unknown>,
) => {
  const params = new URLSearchParams(current);

  for (const [key, value] of Object.entries(updates)) {
    if (value === undefined || value === null || value === "") {
      params.delete(key);
    } else {
      params.set(key, String(value));
    }
  }

  return params;
};
