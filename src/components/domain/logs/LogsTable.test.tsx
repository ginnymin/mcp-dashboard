import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, Outlet, RouterProvider } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { MasterDetailLayout } from "@/components/layout/MasterDetailLayout";
import { LogsSearch } from "@/components/domain/logs/LogsSearch";
import { TimeRangeProvider } from "@/hooks/useTimeRange";

const logsTimeRange =
  "?since=2026-06-10T00:00:00.000Z&until=2026-06-18T00:00:00.000Z";

const renderLogsSearch = (route: string) => {
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
              <MasterDetailLayout
                detailParam="logId"
                closePath="/logs"
                closeLabel="Back to logs"
                master={<LogsSearch />}
              />
            ),
            children: [
              { index: true, element: null },
              {
                path: ":logId",
                element: <div data-testid="log-detail">Log detail</div>,
              },
            ],
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

describe("LogsTable", () => {
  it("renders logs from the API fixture", async () => {
    renderLogsSearch(`/logs${logsTimeRange}`);

    expect(await screen.findByText("get_forecast")).toBeInTheDocument();
    expect(screen.getByText("Showing 3 of 3")).toBeInTheDocument();
  });

  it("navigates to log detail when a row is clicked", async () => {
    const user = userEvent.setup();
    const { router } = renderLogsSearch(`/logs${logsTimeRange}`);

    await user.click(await screen.findByTestId("log-row-log_test003"));

    expect(router.state.location.pathname).toBe("/logs/log_test003");
    expect(screen.getByTestId("log-detail")).toBeInTheDocument();
    expect(screen.getByTestId("log-row-log_test003")).toHaveAttribute(
      "data-state",
      "selected",
    );
  });

  it("filters logs by regex on tool name", async () => {
    renderLogsSearch(`/logs${logsTimeRange}&toolName=^get_forecast$`);

    expect(await screen.findByText("get_forecast")).toBeInTheDocument();
    expect(screen.getByText("Showing 1 of 1")).toBeInTheDocument();
  });

  it("paginates logs with previous and next page buttons", async () => {
    const user = userEvent.setup();
    renderLogsSearch(`/logs${logsTimeRange}&limit=1&offset=0`);

    expect(await screen.findByText("Showing 1 of 3")).toBeInTheDocument();
    expect(screen.getByTestId("log-row-log_test003")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Previous page" }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Next page" }));

    expect(await screen.findByText("Showing 2 of 3")).toBeInTheDocument();
    expect(screen.getByTestId("log-row-log_test002")).toBeInTheDocument();
    expect(screen.queryByTestId("log-row-log_test003")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Previous page" }));

    expect(await screen.findByText("Showing 1 of 3")).toBeInTheDocument();
    expect(screen.getByTestId("log-row-log_test003")).toBeInTheDocument();
  });
});
