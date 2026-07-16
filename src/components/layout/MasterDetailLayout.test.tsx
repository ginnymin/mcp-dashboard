import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { DetailCloseButton } from "./DetailCloseButton";
import { MasterDetailLayout } from "./MasterDetailLayout";

const TestDetailContent = () => (
  <div data-testid="detail-content">
    <DetailCloseButton />
    Server detail
  </div>
);

const renderLayout = (route: string, containerWidth: number) => {
  const router = createMemoryRouter(
    [
      {
        path: "/",
        element: (
          <MasterDetailLayout
            detailParam="serverId"
            closePath="/"
            closeLabel="Back to servers"
            master={<div data-testid="master-content">Master list</div>}
          />
        ),
        children: [
          { index: true, element: null },
          {
            path: "servers/:serverId",
            element: <TestDetailContent />,
          },
        ],
      },
    ],
    { initialEntries: [route] },
  );

  return render(
    <div style={{ width: containerWidth }}>
      <RouterProvider router={router} />
    </div>,
  );
};

describe("MasterDetailLayout", () => {
  it("shows master full width when no detail is selected", () => {
    renderLayout("/", 900);
    expect(screen.getByTestId("master-content")).toBeVisible();
    expect(screen.queryByTestId("detail-pane")).not.toBeInTheDocument();
  });
  it("applies narrow-container hide class on master when detail param is set", () => {
    renderLayout("/servers/srv_test001", 360);
    const masterPane = screen.getByTestId("master-pane");
    expect(masterPane.className).toContain("@max-2xl/master-detail:hidden");
    expect(screen.getByTestId("detail-content")).toBeVisible();
  });
  it("shows split panes in wide container when detail param is set", () => {
    renderLayout("/servers/srv_test001", 900);
    expect(screen.getByTestId("master-content")).toBeVisible();
    expect(screen.getByTestId("detail-content")).toBeVisible();
  });
});
