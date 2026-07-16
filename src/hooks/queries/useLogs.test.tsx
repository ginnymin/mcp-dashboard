import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { TimeRangeProvider } from "@/hooks/useTimeRange";
import { useLog } from "./useLog";
import { useLogs } from "./useLogs";
import logsFixture from "@/test/fixtures/logs.json";

const logsCustomRange =
  "?since=2026-06-10T00:00:00.000Z&until=2026-06-18T00:00:00.000Z";

const createWrapper = (route = "/logs") => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[route]}>
        <TimeRangeProvider>{children}</TimeRangeProvider>
      </MemoryRouter>
    </QueryClientProvider>
  );

  return Wrapper;
};

describe("useLogs", () => {
  it("fetches GET /api/logs via MSW", async () => {
    const { result } = renderHook(() => useLogs(), {
      wrapper: createWrapper(`/logs${logsCustomRange}`),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.total).toBe(logsFixture.total);
    expect(result.current.data?.data[0].tool_name).toBe("get_forecast");
  });
});

describe("useLog", () => {
  it("does not fetch when id is undefined", () => {
    const { result } = renderHook(() => useLog(undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current.isFetching).toBe(false);
    expect(result.current.fetchStatus).toBe("idle");
    expect(result.current.data).toBeUndefined();
  });

  it("fetches GET /api/logs/:id when id is present", async () => {
    const { result } = renderHook(() => useLog("log_test001"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.request_body).toBeDefined();
    expect(result.current.data?.response_body).toBeDefined();
  });
});
