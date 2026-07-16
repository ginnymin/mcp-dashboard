import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { createMemoryRouter, Outlet, RouterProvider } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { LogDetail } from "./LogDetail";
import { TimeRangeProvider } from "@/hooks/useTimeRange";
import logDetailFixture from "@/test/fixtures/log-detail.json";

const logsTimeRange =
  "?since=2026-06-10T00:00:00.000Z&until=2026-06-18T00:00:00.000Z";

const renderLogDetail = (route: string) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const router = createMemoryRouter(
    [
      {
        element: (
          <QueryClientProvider client={queryClient}>
            <TimeRangeProvider>
              <Outlet
                context={{
                  closeDetail: () => {},
                  closeLabel: "Close log detail",
                }}
              />
            </TimeRangeProvider>
          </QueryClientProvider>
        ),
        children: [{ path: "/logs/:logId", element: <LogDetail /> }],
      },
    ],
    { initialEntries: [route] },
  );

  return render(<RouterProvider router={router} />);
};

describe("LogDetail", () => {
  it("renders request and response JSON from the API fixture", async () => {
    renderLogDetail(`/logs/log_test001${logsTimeRange}`);

    expect(await screen.findByText("Log detail")).toBeInTheDocument();
    expect(screen.getByText(/"postal_code": "94107"/)).toBeInTheDocument();
    expect(
      screen.getByText(/"message": "Upstream timeout"/),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Request" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Error" })).toBeInTheDocument();
  });

  it("uses container query layout classes for JSON panels", async () => {
    const { container } = renderLogDetail(`/logs/log_test001${logsTimeRange}`);

    await screen.findByText("Log detail");

    expect(container.querySelector(".\\@container\\/log-detail")).toBeTruthy();
    expect(
      container.querySelector(".\\@min-xl\\/log-detail\\:grid-cols-2"),
    ).toBeTruthy();
  });

  it("shows a friendly 404 state for unknown log IDs", async () => {
    renderLogDetail(`/logs/log_missing${logsTimeRange}`);

    expect(await screen.findByText("Log not found")).toBeInTheDocument();
    expect(
      screen.getByText(
        "This log entry does not exist or may have been removed.",
      ),
    ).toBeInTheDocument();
  });

  it("renders links to the parent session, server, and deployment", async () => {
    renderLogDetail(`/logs/log_test001${logsTimeRange}`);

    expect(await screen.findByText("Log detail")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: logDetailFixture.session_id }),
    ).toHaveAttribute(
      "href",
      `/servers/${logDetailFixture.server_id}/sessions/${logDetailFixture.session_id}?since=2026-06-10T00%3A00%3A00.000Z&until=2026-06-18T00%3A00%3A00.000Z`,
    );
    expect(
      screen.getByRole("link", { name: "Weather Tools" }),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole("link", { name: "2.0.0" }),
    ).toBeInTheDocument();
  });
});
