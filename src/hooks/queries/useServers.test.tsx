import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { TimeRangeProvider } from "@/hooks/useTimeRange";
import { useServers } from "./useServers";
import serversFixture from "@/test/fixtures/servers.json";

const createWrapper = (route = "/") => {
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

describe("useServers", () => {
  it("fetches GET /api/servers via MSW", async () => {
    const { result } = renderHook(() => useServers(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.total).toBe(serversFixture.total);
    expect(result.current.data?.data[0].name).toBe("weather-tools");
  });

  it("uses custom since/until from the URL when present", async () => {
    const route =
      "/?since=2026-06-17T11:00:00.000Z&until=2026-06-17T12:00:00.000Z";

    const { result } = renderHook(() => useServers(), {
      wrapper: createWrapper(route),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.data[0].error_rate_24h).toBe(0.45);
  });
});
