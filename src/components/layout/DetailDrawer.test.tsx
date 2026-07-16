import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { DetailCloseButton } from "./DetailCloseButton";
import { DetailDrawer } from "./DetailDrawer";

const DrawerDetailContent = () => (
  <div data-testid="drawer-content">
    Deployment detail
    <DetailCloseButton />
  </div>
);

const renderDrawer = (route: string, containerWidth: number) => {
  const router = createMemoryRouter(
    [
      {
        path: "/servers/:serverId/deployments",
        element: (
          <DetailDrawer
            drawerParam="deploymentId"
            parentSegment="deployments"
            closeLabel="Close deployment detail"
            tabContent={<div data-testid="tab-content">Deployments tab</div>}
          />
        ),
        children: [
          { index: true, element: null },
          {
            path: ":deploymentId",
            element: <DrawerDetailContent />,
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

describe("DetailDrawer", () => {
  it("applies narrow-container hide class on tab content when drawer is open", () => {
    renderDrawer("/servers/srv_test001/deployments/dep_test001", 360);
    const tabPane = screen.getByTestId("drawer-tab-content");
    expect(tabPane.className).toContain("@max-2xl/detail-drawer:hidden");
    expect(screen.getByTestId("drawer-content")).toBeVisible();
  });
  it("shows tab content beside drawer in wide container", () => {
    renderDrawer("/servers/srv_test001/deployments/dep_test001", 900);
    expect(screen.getByTestId("tab-content")).toBeVisible();
    expect(screen.getByTestId("drawer-content")).toBeVisible();
  });
});
