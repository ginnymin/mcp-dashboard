import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { createMemoryRouter, Outlet, RouterProvider } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { AuditTimeline } from "@/components/domain/audit/AuditTimeline";
import { AuditRoute } from "@/routes/servers/AuditRoute";
import { TimeRangeProvider } from "@/hooks/useTimeRange";
import serverDetailFixture from "@/test/fixtures/server-detail.json";
import { server } from "@/test/setup";

const auditTimeRange =
  "?since=2026-06-10T00:00:00.000Z&until=2026-06-18T00:00:00.000Z";

const renderAuditRoute = (route: string) => {
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
            path: "/servers/:serverId/audit",
            element: <AuditRoute />,
          },
        ],
      },
    ],
    { initialEntries: [route] },
  );

  return render(<RouterProvider router={router} />);
};

const renderAuditTimeline = (route: string) => {
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
            path: "/servers/:serverId/audit",
            element: <AuditTimeline />,
          },
        ],
      },
    ],
    { initialEntries: [route] },
  );

  return render(<RouterProvider router={router} />);
};

describe("AuditTimeline", () => {
  it("renders audit events from the API fixture", async () => {
    renderAuditRoute(`/servers/srv_weather/audit${auditTimeRange}`);

    expect(
      await screen.findByText("Deployment 2.0.0 created"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("API key key_live_c2d8 rotated"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Rate limit changed from 60 to 120 rpm"),
    ).toBeInTheDocument();
  });

  it("shows a disabled state when audit logging is not enabled", async () => {
    server.use(
      http.get("/api/servers/:id", () =>
        HttpResponse.json({
          ...serverDetailFixture,
          audit_enabled: false,
        }),
      ),
    );

    renderAuditRoute(`/servers/srv_weather/audit${auditTimeRange}`);

    expect(
      await screen.findByText("Audit logging disabled"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/does not have audit logging enabled/i),
    ).toBeInTheDocument();
  });

  it("filters events by event type from the URL", async () => {
    renderAuditTimeline(
      `/servers/srv_weather/audit${auditTimeRange}&eventType=api_key.rotated`,
    );

    expect(
      await screen.findByText("API key key_live_c2d8 rotated"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Deployment 2.0.0 created"),
    ).not.toBeInTheDocument();
  });

  it("shows all events regardless of the global time range query params", async () => {
    renderAuditTimeline(
      "/servers/srv_weather/audit?since=2026-06-17T00:00:00.000Z&until=2026-06-17T01:00:00.000Z",
    );

    expect(
      await screen.findByText("Deployment 2.0.0 created"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("API key key_live_c2d8 rotated"),
    ).toBeInTheDocument();
  });

  it("links traffic around an event to a narrowed logs time window", async () => {
    renderAuditTimeline(`/servers/srv_weather/audit${auditTimeRange}`);

    expect(
      await screen.findByText("Deployment 2.0.0 created"),
    ).toBeInTheDocument();

    const deploymentEntry = screen.getByTestId("audit-entry-aud_test001");
    const trafficLink = within(deploymentEntry).getByRole("link", {
      name: "View traffic around this time",
    });

    expect(trafficLink).toHaveAttribute(
      "href",
      expect.stringContaining("/logs?"),
    );
    expect(trafficLink.getAttribute("href")).toContain("serverId=srv_weather");
    expect(trafficLink.getAttribute("href")).toContain(
      "since=2026-06-16T07%3A45%3A00.000Z",
    );
    expect(trafficLink.getAttribute("href")).toContain(
      "until=2026-06-16T08%3A15%3A00.000Z",
    );
  });
});
