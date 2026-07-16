import type { ReactNode } from "react";
import {
  Outlet,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import type { DetailOutletContext } from "@/components/layout/detail-outlet-context";
import { cn } from "@/lib/utils";

type MasterDetailLayoutProps = {
  detailParam: string;
  closePath: string;
  closeLabel: string;
  master: ReactNode;
};

export const MasterDetailLayout = ({
  detailParam,
  closePath,
  closeLabel,
  master,
}: MasterDetailLayoutProps) => {
  const params = useParams();
  const showDetail = Boolean(params[detailParam]);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const handleCloseDetail = () => {
    navigate({
      pathname: closePath,
      search: searchParams.toString(),
    });
  };
  const outletContext: DetailOutletContext = {
    closeDetail: handleCloseDetail,
    closeLabel,
  };

  return (
    <div className="@container/master-detail flex min-h-0 flex-1">
      <div
        className={cn(
          "flex min-h-0 min-w-0 shrink-0 flex-col border-border-soft",
          showDetail
            ? "border-r @max-2xl/master-detail:hidden @2xl/master-detail:w-[min(40%,420px)]"
            : "flex-1 border-r-0",
        )}
        data-testid="master-pane"
      >
        {master}
      </div>
      {showDetail && (
        <div className="flex min-w-0 flex-1 flex-col" data-testid="detail-pane">
          <div className="min-h-0 flex-1 overflow-auto">
            <Outlet context={outletContext} />
          </div>
        </div>
      )}
    </div>
  );
};
