import type { ReactNode } from "react";
import {
  Outlet,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import type { DetailOutletContext } from "@/components/layout/detail-outlet-context";
import { cn } from "@/lib/utils";

type DetailDrawerProps = {
  drawerParam: "deploymentId" | "sessionId";
  parentSegment: "deployments" | "sessions";
  closeLabel: string;
  tabContent: ReactNode;
};

export const DetailDrawer = ({
  drawerParam,
  parentSegment,
  closeLabel,
  tabContent,
}: DetailDrawerProps) => {
  const params = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const showDrawer = Boolean(params[drawerParam]);

  const handleClose = () => {
    navigate({
      pathname: `/servers/${params.serverId}/${parentSegment}`,
      search: searchParams.toString(),
    });
  };

  const outletContext: DetailOutletContext = {
    closeDetail: handleClose,
    closeLabel,
  };

  return (
    <div
      className="@container/detail-drawer relative flex min-h-0 h-full flex-1"
      data-testid="detail-drawer"
    >
      <div
        className={cn(
          "min-h-0 min-w-0 flex-1",
          showDrawer && "@max-2xl/detail-drawer:hidden",
        )}
        data-testid="drawer-tab-content"
      >
        {tabContent}
      </div>
      {showDrawer && (
        <div
          className={cn(
            "flex min-h-0 min-w-0 flex-col border-border-soft bg-panel",
            "w-full @min-2xl/detail-drawer:w-[60%] @2xl/detail-drawer:shrink-0 @2xl/detail-drawer:border-l",
          )}
          data-testid="drawer-pane"
        >
          <div className="min-h-0 flex-1 overflow-auto p-4">
            <Outlet context={outletContext} />
          </div>
        </div>
      )}
    </div>
  );
};
