import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { TimeRangeProvider } from "@/hooks/useTimeRange";
import { AppShell } from "./AppShell";

const renderAppShell = (route = "/") => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const router = createMemoryRouter(
    [
      {
        element: (
          <QueryClientProvider client={queryClient}>
            <TimeRangeProvider>
              <AppShell />
            </TimeRangeProvider>
          </QueryClientProvider>
        ),
        children: [
          { path: "/", element: <div>Home content</div> },
          { path: "/logs", element: <div>Logs content</div> },
        ],
      },
    ],
    { initialEntries: [route] },
  );

  return render(<RouterProvider router={router} />);
};

describe("AppShell", () => {
  it("renders primary nav links", () => {
    renderAppShell();
    expect(screen.getByRole("link", { name: "Dashboard" })).toHaveAttribute(
      "href",
      "/",
    );
    expect(
      screen.getAllByRole("link", { name: "Servers" }).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByRole("link", { name: "Logs" }).length,
    ).toBeGreaterThan(0);
  });

  it("renders the global time range picker in the header", () => {
    renderAppShell();

    expect(
      screen.getByRole("button", { name: "Refresh current view" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("group", { name: "Time range" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "24h" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });
  it("opens mobile navigation sheet", async () => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockImplementation((query: string) => ({
        matches: query.includes("min-width: 1024px") ? false : true,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    );
    const user = userEvent.setup();
    renderAppShell();
    const menuButton = screen.getByRole("button", {
      name: "Open navigation menu",
    });
    await user.click(menuButton);
    const dialog = screen.getByRole("dialog");
    expect(
      within(dialog).getByRole("link", { name: "Logs" }),
    ).toBeInTheDocument();
    vi.unstubAllGlobals();
  });
});
