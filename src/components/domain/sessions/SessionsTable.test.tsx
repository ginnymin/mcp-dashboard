import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, Outlet, RouterProvider } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { DetailDrawer } from "@/components/layout/DetailDrawer";
import { TimeRangeProvider } from "@/hooks/useTimeRange";
import { SessionsRoute } from "@/routes/servers/SessionsRoute";

const renderSessionsRoute = (route: string) => {
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
              {
                path: ":sessionId",
                element: <div data-testid="session-timeline">Timeline</div>,
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

const sessionsTimeRange =
  "?since=2026-06-10T00:00:00.000Z&until=2026-06-18T00:00:00.000Z";

describe("SessionsTable", () => {
  it("renders sessions from the API fixture", async () => {
    renderSessionsRoute(`/servers/srv_weather/sessions${sessionsTimeRange}`);

    expect(await screen.findByText("vscode")).toBeInTheDocument();
    expect(screen.getAllByText("cursor")).toHaveLength(2);
    expect(screen.getByText("Showing 3 of 3")).toBeInTheDocument();
  });

  it("navigates to session timeline when a row is clicked", async () => {
    const user = userEvent.setup();
    const { router } = renderSessionsRoute(
      `/servers/srv_weather/sessions${sessionsTimeRange}`,
    );

    await user.click(await screen.findByTestId("session-row-ses_test001"));

    expect(router.state.location.pathname).toBe(
      "/servers/srv_weather/sessions/ses_test001",
    );
    expect(screen.getByTestId("session-timeline")).toBeInTheDocument();
    expect(screen.getByTestId("session-row-ses_test001")).toHaveAttribute(
      "data-state",
      "selected",
    );
  });

  it("loads more sessions when pagination requires it", async () => {
    const user = userEvent.setup();
    renderSessionsRoute(
      "/servers/srv_weather/sessions?limit=1&offset=0&since=2026-06-10T00:00:00.000Z&until=2026-06-18T00:00:00.000Z",
    );

    expect(await screen.findByText("Showing 1 of 3")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Load more" }));

    expect(await screen.findByText("Showing 2 of 3")).toBeInTheDocument();
  });

  it("filters sessions by regex on client name", async () => {
    renderSessionsRoute(
      `/servers/srv_weather/sessions${sessionsTimeRange}&clientName=vscode`,
    );

    expect(await screen.findByText("vscode")).toBeInTheDocument();
    expect(screen.queryByText("cursor")).not.toBeInTheDocument();
    expect(screen.getByText("Showing 1 of 1")).toBeInTheDocument();
  });
});
