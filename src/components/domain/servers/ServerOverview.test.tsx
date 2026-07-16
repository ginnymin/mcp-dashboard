import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, Outlet, RouterProvider } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { TimeRangeProvider } from "@/hooks/useTimeRange";
import { ServerOverview } from "./ServerOverview";
import serverStatsFixture from "@/test/fixtures/server-stats.json";

const renderServerOverview = (route: string) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const router = createMemoryRouter(
    [
      {
        element: (
          <TimeRangeProvider>
            <Outlet />
          </TimeRangeProvider>
        ),
        children: [
          {
            path: "/servers/:serverId/overview",
            element: <ServerOverview />,
          },
        ],
      },
    ],
    { initialEntries: [route] },
  );

  return {
    router,
    ...render(
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>,
    ),
  };
};

describe("ServerOverview", () => {
  it("renders health stats from the MSW fixture", async () => {
    renderServerOverview("/servers/srv_weather/overview");

    expect(
      await screen.findByText(
        serverStatsFixture.total_requests.toLocaleString(),
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("1.25%")).toBeInTheDocument();
    expect(screen.getByText("120 ms")).toBeInTheDocument();
    expect(screen.getByText("890 ms")).toBeInTheDocument();
    expect(screen.getByText("get_forecast")).toBeInTheDocument();
  });

  it("links deployments and recent sessions to the expected routes", async () => {
    renderServerOverview(
      "/servers/srv_weather/overview?since=2026-06-16T12:00:00.000Z&until=2026-06-17T12:00:00.000Z",
    );

    const byDeployment = await screen.findByRole("heading", {
      name: "By deployment",
    });
    expect(
      within(byDeployment.parentElement!).getByRole("link", {
        name: "View all",
      }),
    ).toHaveAttribute(
      "href",
      expect.stringContaining("/servers/srv_weather/deployments"),
    );

    const recentSessions = screen.getByRole("heading", {
      name: "Recent sessions",
    });
    expect(
      within(recentSessions.parentElement!).getByRole("link", {
        name: "View all",
      }),
    ).toHaveAttribute(
      "href",
      expect.stringContaining("/servers/srv_weather/sessions"),
    );
    expect(screen.getByText("cursor")).toBeInTheDocument();
  });

  it("navigates to deployment detail when a deployment row is clicked", async () => {
    const user = userEvent.setup();
    const { router } = renderServerOverview(
      "/servers/srv_weather/overview?since=2026-06-16T12:00:00.000Z&until=2026-06-17T12:00:00.000Z",
    );

    const deploymentRow = await screen.findByRole("link", {
      name: "2.0.0 900 10 1.11%",
    });
    await user.click(deploymentRow);

    expect(router.state.location.pathname).toBe(
      "/servers/srv_weather/deployments/dep_weather_4",
    );
    expect(router.state.location.search).toContain("since=2026-06-16");
  });
});
