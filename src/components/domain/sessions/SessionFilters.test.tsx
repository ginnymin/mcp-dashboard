import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, Outlet, RouterProvider } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { SessionFilters } from "./SessionFilters";
import { TimeRangeProvider } from "@/hooks/useTimeRange";

const renderSessionFilters = (route: string) => {
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
            element: <SessionFilters />,
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

describe("SessionFilters", () => {
  it("updates the URL when the client name filter changes", async () => {
    const user = userEvent.setup();
    const { router } = renderSessionFilters("/servers/srv_weather/sessions");

    await user.type(screen.getByLabelText("Client name"), "vscode");

    await waitFor(
      () => {
        expect(router.state.location.search).toContain("clientName=vscode");
      },
      { timeout: 1000 },
    );
  });

  it("updates the URL when the status filter changes", async () => {
    const user = userEvent.setup();
    const { router } = renderSessionFilters("/servers/srv_weather/sessions");

    await user.click(screen.getByRole("combobox", { name: "Status" }));
    await user.click(await screen.findByRole("option", { name: "Closed" }));

    await waitFor(() => {
      expect(router.state.location.search).toContain("status=closed");
    });
  });
});
