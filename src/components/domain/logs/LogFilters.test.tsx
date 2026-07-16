import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, Outlet, RouterProvider } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { LogFilters } from "./LogFilters";
import { LogsTable } from "./LogsTable";
import { TimeRangeProvider } from "@/hooks/useTimeRange";

const logsTimeRange =
  "?since=2026-06-10T00:00:00.000Z&until=2026-06-18T00:00:00.000Z";

const renderLogFilters = (route: string) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const router = createMemoryRouter(
    [
      {
        element: (
          <QueryClientProvider client={queryClient}>
            <TimeRangeProvider>
              <Outlet />
            </TimeRangeProvider>
          </QueryClientProvider>
        ),
        children: [
          {
            path: "/logs",
            element: (
              <>
                <LogFilters />
                <LogsTable />
              </>
            ),
          },
        ],
      },
    ],
    { initialEntries: [route] },
  );

  return {
    router,
    ...render(<RouterProvider router={router} />),
  };
};

describe("LogFilters", () => {
  it("updates the URL when the server filter changes", async () => {
    const user = userEvent.setup();
    const { router } = renderLogFilters(`/logs${logsTimeRange}`);

    await user.click(screen.getByRole("combobox", { name: "Server" }));
    await user.click(
      await screen.findByRole("option", { name: "Weather Tools" }),
    );

    await waitFor(() => {
      expect(router.state.location.search).toContain("serverId=srv_weather");
    });
  });

  it("updates the URL when the session ID filter changes", async () => {
    const user = userEvent.setup();
    const { router } = renderLogFilters(`/logs${logsTimeRange}`);

    await user.type(screen.getByLabelText("Session ID"), "ses_test001");

    await waitFor(
      () => {
        expect(router.state.location.search).toContain("sessionId=ses_test001");
      },
      { timeout: 1000 },
    );
  });

  it("disables the deployment filter until a server is selected", () => {
    renderLogFilters(`/logs${logsTimeRange}`);

    expect(screen.getByRole("combobox", { name: "Deployment" })).toBeDisabled();
  });

  it("keeps the server filter after selection", async () => {
    const user = userEvent.setup();
    const { router } = renderLogFilters(`/logs${logsTimeRange}`);

    await user.click(screen.getByRole("combobox", { name: "Server" }));
    await user.click(
      await screen.findByRole("option", { name: "Weather Tools" }),
    );

    await waitFor(() => {
      expect(router.state.location.search).toContain("serverId=srv_weather");
    });

    await new Promise((resolve) => setTimeout(resolve, 600));

    expect(router.state.location.search).toContain("serverId=srv_weather");
    expect(screen.getByRole("combobox", { name: "Server" })).toHaveTextContent(
      "Weather Tools",
    );
  });

  it("keeps the server filter when a debounced text filter is pending", async () => {
    const user = userEvent.setup();
    const { router } = renderLogFilters(`/logs${logsTimeRange}`);

    await user.type(screen.getByLabelText("Session ID"), "ses_test001");
    await user.click(screen.getByRole("combobox", { name: "Server" }));
    await user.click(
      await screen.findByRole("option", { name: "Weather Tools" }),
    );

    expect(router.state.location.search).toContain("serverId=srv_weather");

    await waitFor(
      () => {
        expect(router.state.location.search).toContain("sessionId=ses_test001");
        expect(router.state.location.search).toContain("serverId=srv_weather");
      },
      { timeout: 1000 },
    );
  });
});
