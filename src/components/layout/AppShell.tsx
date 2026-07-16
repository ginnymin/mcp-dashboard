import { Link, Outlet } from "react-router-dom";
import { RefreshButton } from "@/components/domain/shared/RefreshButton";
import { TimeRangePicker } from "@/components/domain/shared/TimeRangePicker";
import { AppSidebar } from "./AppSidebar";
import { MobileNav } from "./MobileNav";

export const AppShell = () => {
  return (
    <div className="flex min-h-screen max-h-screen w-full min-w-0 flex-col">
      <header className="flex h-12 shrink-0 items-center gap-3 border-b border-border-soft bg-surface-header px-4">
        <MobileNav />
        <Link
          to="/"
          className="flex items-center gap-2 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="text-[14px] font-semibold text-text">Dashboard</span>
        </Link>
        <div className="ml-auto flex items-center gap-2">
          <RefreshButton />
          <TimeRangePicker />
        </div>
      </header>
      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-[236px] shrink-0 border-r border-border-soft bg-sidebar xl:block">
          <AppSidebar />
        </aside>
        <main className="bg-main-gradient flex min-h-0 min-w-0 flex-1 flex-col">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
