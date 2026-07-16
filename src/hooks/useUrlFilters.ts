import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import type { z } from "zod";
import { parseSearchParams, patchSearchParams } from "@/lib/url-state";

export const useUrlFilters = <T extends Record<string, unknown>>(
  schema: z.ZodObject<z.ZodRawShape>,
  defaults: T,
) => {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = useMemo(
    () => parseSearchParams(searchParams, schema, defaults),
    [defaults, schema, searchParams],
  );

  const setFilters = useCallback(
    (next: Partial<T> | ((previous: T) => Partial<T>)) => {
      setSearchParams(
        (current) => {
          const previous = parseSearchParams(current, schema, defaults);
          const updates = typeof next === "function" ? next(previous) : next;

          return patchSearchParams(current, updates);
        },
        { replace: true },
      );
    },
    [defaults, schema, setSearchParams],
  );

  return { filters, setFilters };
};
