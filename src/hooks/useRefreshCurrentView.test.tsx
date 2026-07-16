import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { useRefreshCurrentView } from "./useRefreshCurrentView";

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const refetchQueries = vi.spyOn(queryClient, "refetchQueries");

  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  return { Wrapper, refetchQueries };
};

describe("useRefreshCurrentView", () => {
  it("refetches every active query", async () => {
    const { Wrapper, refetchQueries } = createWrapper();

    const { result } = renderHook(() => useRefreshCurrentView(), {
      wrapper: Wrapper,
    });

    await result.current.refresh();

    expect(refetchQueries).toHaveBeenCalledWith({ type: "active" });
  });
});
