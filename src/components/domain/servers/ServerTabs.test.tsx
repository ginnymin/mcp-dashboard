import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { ServerTabs } from "./ServerTabs";
import { TimeRangeProvider } from "@/hooks/useTimeRange";
import type { Server } from "@/lib/api/types";
import serverDetailFixture from "@/test/fixtures/server-detail.json";

const renderServerTabs = (route: string) => {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <TimeRangeProvider>
        <Routes>
          <Route
            path="/servers/:serverId/*"
            element={<ServerTabs server={serverDetailFixture as Server} />}
          />
        </Routes>
      </TimeRangeProvider>
    </MemoryRouter>,
  );
};

describe("ServerTabs", () => {
  it("does not add time range params when using preset navigation", () => {
    renderServerTabs("/servers/srv_weather/sessions?clientName=vscode");

    expect(screen.getByRole("link", { name: "Overview" })).toHaveAttribute(
      "href",
      "/servers/srv_weather/overview",
    );
    expect(screen.getByRole("link", { name: "Audit" })).toHaveAttribute(
      "href",
      "/servers/srv_weather/audit",
    );
  });

  it("preserves custom time range params when switching tabs", () => {
    renderServerTabs(
      "/servers/srv_weather/sessions?since=2026-06-10T00:00:00.000Z&until=2026-06-18T00:00:00.000Z&clientName=vscode",
    );

    expect(screen.getByRole("link", { name: "Overview" })).toHaveAttribute(
      "href",
      "/servers/srv_weather/overview?since=2026-06-10T00%3A00%3A00.000Z&until=2026-06-18T00%3A00%3A00.000Z",
    );
    expect(screen.getByRole("link", { name: "Deployments" })).toHaveAttribute(
      "href",
      "/servers/srv_weather/deployments?since=2026-06-10T00%3A00%3A00.000Z&until=2026-06-18T00%3A00%3A00.000Z",
    );
  });
});
