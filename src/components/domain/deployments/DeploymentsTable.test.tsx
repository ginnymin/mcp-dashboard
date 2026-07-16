import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, Outlet, RouterProvider } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { DetailDrawer } from "@/components/layout/DetailDrawer";
import { TimeRangeProvider } from "@/hooks/useTimeRange";
import { DeploymentsTable } from "./DeploymentsTable";
import { DeploymentDetail } from "./DeploymentDetail";

const renderDeploymentsRoute = (route: string) => {
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
            path: "/servers/:serverId/deployments",
            element: (
              <DetailDrawer
                drawerParam="deploymentId"
                parentSegment="deployments"
                closeLabel="Close deployment detail"
                tabContent={<DeploymentsTable />}
              />
            ),
            children: [
              { index: true, element: null },
              { path: ":deploymentId", element: <DeploymentDetail /> },
            ],
          },
        ],
      },
    ],
    { initialEntries: [route] },
  );

  return render(<RouterProvider router={router} />);
};

describe("DeploymentsTable", () => {
  it("renders deployments from the API fixture", async () => {
    renderDeploymentsRoute("/servers/srv_weather/deployments");

    expect(await screen.findByText("2.0.0")).toBeInTheDocument();
    expect(screen.getByText("Live")).toBeInTheDocument();
  });

  it("opens deployment detail in the drawer and shows the tool catalog", async () => {
    const user = userEvent.setup();
    renderDeploymentsRoute("/servers/srv_weather/deployments");

    await user.click(
      await screen.findByRole("link", { name: "View deployment 2.0.0" }),
    );

    expect(await screen.findByText("Tool catalog")).toBeInTheDocument();
    expect(screen.getByText("get_forecast")).toBeInTheDocument();
    expect(screen.getByText("Multi-day forecast")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View logs" })).toHaveAttribute(
      "href",
      expect.stringContaining("deploymentId=dep_weather_4"),
    );
    expect(screen.getByTestId("deployment-row-dep_weather_4")).toHaveAttribute(
      "data-state",
      "selected",
    );
    expect(
      screen.queryByRole("columnheader", { name: "Created" }),
    ).not.toBeInTheDocument();
  });

  it("shows the created column when no deployment detail is open", async () => {
    renderDeploymentsRoute("/servers/srv_weather/deployments");

    expect(
      await screen.findByRole("columnheader", { name: "Created" }),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("deployment-row-dep_weather_4"),
    ).not.toHaveAttribute("data-state", "selected");
  });

  it("closes deployment detail from the header close button", async () => {
    const user = userEvent.setup();
    renderDeploymentsRoute("/servers/srv_weather/deployments/dep_weather_4");

    await screen.findByText("Tool catalog");
    await user.click(screen.getByTestId("detail-close-button"));

    expect(screen.queryByText("Tool catalog")).not.toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: "Created" }),
    ).toBeInTheDocument();
  });
});
