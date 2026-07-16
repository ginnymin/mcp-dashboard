import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { TimelineEntry } from "./TimelineEntry";
import type { LogSummary } from "@/lib/api/types";
import sessionDetailFixture from "@/test/fixtures/session-detail.json";

const errorLog = sessionDetailFixture.logs[2] as LogSummary;

const renderTimelineEntry = (route = "/logs") => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const router = createMemoryRouter(
    [
      {
        path: "/logs/:logId?",
        element: <TimelineEntry log={errorLog} />,
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

describe("TimelineEntry", () => {
  it("navigates to log detail when clicked", async () => {
    const user = userEvent.setup();
    const { router } = renderTimelineEntry();

    await user.click(screen.getByTestId("timeline-entry-log_test003"));

    expect(router.state.location.pathname).toBe("/logs/log_test003");
  });

  it("applies error styling for failed log entries", () => {
    renderTimelineEntry();

    expect(
      screen.getByTestId("timeline-entry-log_test003").className,
    ).toContain("border-error-border");
  });
});
