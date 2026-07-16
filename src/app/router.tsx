import { createBrowserRouter, Navigate } from "react-router-dom";
import { TimeRangeProvider } from "@/hooks/useTimeRange";
import { AppShell } from "@/components/layout/AppShell";
import { DetailDrawer } from "@/components/layout/DetailDrawer";
import { MasterDetailLayout } from "@/components/layout/MasterDetailLayout";
import { LogDetailRoute } from "@/routes/logs/LogDetailRoute";
import { LogsSearchRoute } from "@/routes/logs/LogsSearchRoute";
import { NotFoundRoute } from "@/routes/NotFoundRoute";
import { AuditRoute } from "@/routes/servers/AuditRoute";
import { DeploymentDetailRoute } from "@/routes/servers/DeploymentDetailRoute";
import { DeploymentsRoute } from "@/routes/servers/DeploymentsRoute";
import { ServerDetailPanel } from "@/routes/servers/ServerDetailPanel";
import { ServerListRoute } from "@/routes/servers/ServerListRoute";
import { ServerOverviewRoute } from "@/routes/servers/ServerOverviewRoute";
import { SessionTimelineRoute } from "@/routes/servers/SessionTimelineRoute";
import { SessionsRoute } from "@/routes/servers/SessionsRoute";

export const router = createBrowserRouter([
  {
    element: (
      <TimeRangeProvider>
        <AppShell />
      </TimeRangeProvider>
    ),
    children: [
      {
        element: (
          <MasterDetailLayout
            detailParam="serverId"
            closePath="/"
            closeLabel="Back to servers"
            master={<ServerListRoute />}
          />
        ),
        children: [
          { index: true, element: null },
          {
            path: "servers/:serverId",
            element: <ServerDetailPanel />,
            children: [
              { index: true, element: <Navigate to="overview" replace /> },
              { path: "overview", element: <ServerOverviewRoute /> },
              {
                path: "deployments",
                element: (
                  <DetailDrawer
                    drawerParam="deploymentId"
                    parentSegment="deployments"
                    closeLabel="Close deployment detail"
                    tabContent={<DeploymentsRoute />}
                  />
                ),
                children: [
                  { index: true, element: null },
                  {
                    path: ":deploymentId",
                    element: <DeploymentDetailRoute />,
                  },
                ],
              },
              {
                path: "sessions",
                element: (
                  <DetailDrawer
                    drawerParam="sessionId"
                    parentSegment="sessions"
                    closeLabel="Close session timeline"
                    tabContent={<SessionsRoute />}
                  />
                ),
                children: [
                  { index: true, element: null },
                  {
                    path: ":sessionId",
                    element: <SessionTimelineRoute />,
                  },
                ],
              },
              { path: "audit", element: <AuditRoute /> },
            ],
          },
        ],
      },
      {
        path: "logs",
        element: (
          <MasterDetailLayout
            detailParam="logId"
            closePath="/logs"
            closeLabel="Back to logs"
            master={<LogsSearchRoute />}
          />
        ),
        children: [
          { index: true, element: null },
          { path: ":logId", element: <LogDetailRoute /> },
        ],
      },
      { path: "*", element: <NotFoundRoute /> },
    ],
  },
]);
