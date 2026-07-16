import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { createMemoryRouter, Outlet, RouterProvider } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { ServerDetailPanel } from "./ServerDetailPanel";
import { TimeRangeProvider } from "@/hooks/useTimeRange";
import serverDetailFixture from "@/test/fixtures/server-detail.json";
import { server } from "@/test/setup";

const renderServerDetail = (route: string) => {
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
                  closeLabel: "Back to servers",
                }}
              />
            </TimeRangeProvider>
          </QueryClientProvider>
        ),
        children: [
          {
            path: "/servers/:serverId",
            element: <ServerDetailPanel />,
            children: [
              { index: true, element: <div>Overview content</div> },
              { path: "overview", element: <div>Overview content</div> },
              { path: "audit", element: <div>Audit content</div> },
            ],
          },
        ],
      },
    ],
    { initialEntries: [route] },
  );

  return render(<RouterProvider router={router} />);
};

describe("ServerDetailPanel", () => {
  it("renders tabs and header with the server name from the API", async () => {
    renderServerDetail("/servers/srv_weather/overview");

    expect(
      await screen.findByRole("heading", { name: "Weather Tools" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Overview" })).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Deployments" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Sessions" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Audit" })).toBeInTheDocument();
    expect(screen.getByText("acme/weather-tools · main")).toBeInTheDocument();
    expect(screen.getByText("Auth")).toBeInTheDocument();
  });

  it("hides the audit tab when audit is disabled", async () => {
    server.use(
      http.get("/api/servers/:id", () =>
        HttpResponse.json({
          ...serverDetailFixture,
          audit_enabled: false,
        }),
      ),
    );

    renderServerDetail("/servers/srv_weather/overview");

    expect(
      await screen.findByRole("heading", { name: "Weather Tools" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Audit" }),
    ).not.toBeInTheDocument();
  });

  it("shows a friendly error for an unknown server id", async () => {
    renderServerDetail("/servers/unknown/overview");

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Server not found",
    );
    expect(screen.getByText(/does not exist/i)).toBeInTheDocument();
  });
});
