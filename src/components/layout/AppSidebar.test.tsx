import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { TimeRangeProvider } from "@/hooks/useTimeRange";
import { AppSidebar } from "./AppSidebar";

const renderSidebar = (route: string) => {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <TimeRangeProvider>
        <AppSidebar />
      </TimeRangeProvider>
    </MemoryRouter>,
  );
};

describe("AppSidebar", () => {
  it("highlights Servers on home route", () => {
    renderSidebar("/");
    expect(screen.getByRole("link", { name: "Servers" })).toHaveClass(
      "bg-nav-active",
    );
  });
  it("highlights Servers on server detail routes", () => {
    renderSidebar("/servers/srv_test001/overview");
    expect(screen.getByRole("link", { name: "Servers" })).toHaveClass(
      "bg-nav-active",
    );
    expect(screen.getByRole("link", { name: "Logs" })).not.toHaveClass(
      "bg-nav-active",
    );
  });
  it("highlights Logs on log detail routes", () => {
    renderSidebar("/logs/log_123");
    expect(screen.getByRole("link", { name: "Logs" })).toHaveClass(
      "bg-nav-active",
    );
    expect(screen.getByRole("link", { name: "Servers" })).not.toHaveClass(
      "bg-nav-active",
    );
  });

  it("does not add time range params for preset navigation", () => {
    renderSidebar("/logs/log_123");

    expect(screen.getByRole("link", { name: "Servers" })).toHaveAttribute(
      "href",
      "/",
    );
    expect(screen.getByRole("link", { name: "Logs" })).toHaveAttribute(
      "href",
      "/logs",
    );
  });

  it("does not carry custom time range params in sidebar links", () => {
    renderSidebar(
      "/logs/log_123?since=2026-06-10T00:00:00.000Z&until=2026-06-18T00:00:00.000Z",
    );

    expect(screen.getByRole("link", { name: "Servers" })).toHaveAttribute(
      "href",
      "/",
    );
    expect(screen.getByRole("link", { name: "Logs" })).toHaveAttribute(
      "href",
      "/logs",
    );
  });
});
