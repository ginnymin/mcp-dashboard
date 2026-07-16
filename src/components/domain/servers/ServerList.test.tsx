import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, Outlet, RouterProvider } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { TimeRangeProvider } from "@/hooks/useTimeRange";
import { ServerList } from "./ServerList";
import serversFixture from "@/test/fixtures/servers.json";

const renderServerListRoute = (route = "/") => {
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
            path: "/",
            element: (
              <>
                <ServerList />
                <Outlet />
              </>
            ),
            children: [
              { index: true, element: null },
              {
                path: "servers/:serverId/overview",
                element: <div data-testid="server-overview">Overview</div>,
              },
            ],
          },
        ],
      },
    ],
    { initialEntries: [route] },
  );

  return render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
};

describe("ServerList", () => {
  it("renders server rows from the API fixture", async () => {
    renderServerListRoute("/");

    expect(await screen.findByText("Weather Tools")).toBeInTheDocument();
    expect(screen.getByText("weather-tools")).toBeInTheDocument();
    expect(screen.getByText("1.25%")).toBeInTheDocument();
    expect(screen.getByText("Auth")).toBeInTheDocument();
    expect(
      screen.getByText(String(serversFixture.data[0].deployment_count)),
    ).toBeInTheDocument();
  });

  it("navigates to server overview when a row is selected", async () => {
    const user = userEvent.setup();
    renderServerListRoute("/");

    const row = await screen.findByRole("link", { name: "View Weather Tools" });
    await user.click(row);

    expect(await screen.findByTestId("server-overview")).toBeInTheDocument();
  });

  it("marks the active server row when detail is open", async () => {
    renderServerListRoute("/servers/srv_weather/overview");

    const row = await screen.findByRole("link", { name: "View Weather Tools" });
    expect(row).toHaveAttribute("data-state", "selected");
    expect(row).toHaveAttribute("aria-current", "true");
  });

  it("hides governance, deployments, and sessions columns when detail is open", async () => {
    renderServerListRoute("/servers/srv_weather/overview");

    await screen.findByRole("link", { name: "View Weather Tools" });

    expect(screen.queryByText("Governance")).not.toBeInTheDocument();
    expect(screen.queryByText("Deployments")).not.toBeInTheDocument();
    expect(screen.queryByText("Open sessions")).not.toBeInTheDocument();
    expect(screen.queryByText("Auth")).not.toBeInTheDocument();
    expect(screen.getByText("Errors")).toBeInTheDocument();
  });
});
