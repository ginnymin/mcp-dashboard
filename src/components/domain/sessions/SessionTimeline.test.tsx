import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, Outlet, RouterProvider } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { DetailDrawer } from "@/components/layout/DetailDrawer";
import { TimeRangeProvider } from "@/hooks/useTimeRange";
import { SessionsRoute } from "@/routes/servers/SessionsRoute";
import { SessionTimeline } from "./SessionTimeline";

const renderSessionTimelineRoute = (route: string) => {
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
            path: "/logs/:logId",
            element: <div data-testid="log-detail">Log detail</div>,
          },
          {
            path: "/servers/:serverId/sessions",
            element: (
              <DetailDrawer
                drawerParam="sessionId"
                parentSegment="sessions"
                closeLabel="Close session timeline"
                tabContent={<SessionsRoute />}
              />
            ),
            children: [
              { index: true, element: null },
              { path: ":sessionId", element: <SessionTimeline /> },
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

describe("SessionTimeline", () => {
  it("renders ordered timeline entries inside the drawer context", async () => {
    renderSessionTimelineRoute(
      "/servers/srv_weather/sessions/ses_test001?since=2026-06-10T00:00:00.000Z&until=2026-06-18T00:00:00.000Z",
    );

    expect(await screen.findByText("Timeline")).toBeInTheDocument();
    expect(
      screen.getByTestId("timeline-entry-log_test001"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("timeline-entry-log_test002"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("timeline-entry-log_test003"),
    ).toBeInTheDocument();

    const entries = screen.getAllByTestId(/^timeline-entry-/);
    expect(entries.map((entry) => entry.getAttribute("data-testid"))).toEqual([
      "timeline-entry-log_test001",
      "timeline-entry-log_test002",
      "timeline-entry-log_test003",
    ]);
  });

  it("links to filtered logs and closes back to the sessions tab", async () => {
    const user = userEvent.setup();
    const { router } = renderSessionTimelineRoute(
      "/servers/srv_weather/sessions/ses_test001?since=2026-06-10T00:00:00.000Z&until=2026-06-18T00:00:00.000Z",
    );

    expect(
      await screen.findByRole("link", { name: "View in Logs" }),
    ).toHaveAttribute("href", expect.stringContaining("sessionId=ses_test001"));

    await user.click(screen.getByTestId("detail-close-button"));

    expect(router.state.location.pathname).toBe(
      "/servers/srv_weather/sessions",
    );
    expect(router.state.location.search).toContain("since=2026-06-10");
  });

  it("navigates to log detail when a timeline entry is clicked", async () => {
    const user = userEvent.setup();
    const { router } = renderSessionTimelineRoute(
      "/servers/srv_weather/sessions/ses_test001?since=2026-06-10T00:00:00.000Z&until=2026-06-18T00:00:00.000Z",
    );

    await user.click(await screen.findByTestId("timeline-entry-log_test003"));

    expect(router.state.location.pathname).toBe("/logs/log_test003");
    expect(screen.getByTestId("log-detail")).toBeInTheDocument();
  });
});
