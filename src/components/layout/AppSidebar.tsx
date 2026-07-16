import { NavLink, useLocation } from "react-router-dom";
import { useTimeRange } from "@/hooks/useTimeRange";
import { DEFAULT_TIME_RANGE_PRESET } from "@/lib/url-state";
import { cn } from "@/lib/utils";

const navItems = [
  {
    label: "Servers",
    to: "/",
    isActive: (pathname: string) =>
      pathname === "/" || pathname.startsWith("/servers"),
  },
  {
    label: "Logs",
    to: "/logs",
    isActive: (pathname: string) =>
      pathname === "/logs" || pathname.startsWith("/logs/"),
  },
] as const;

type AppSidebarProps = {
  onNavigate?: () => void;
  className?: string;
};

export const AppSidebar = ({ onNavigate, className }: AppSidebarProps) => {
  const { pathname } = useLocation();
  const { customRange, setPreset } = useTimeRange();

  const handleNavigate = () => {
    if (customRange) {
      setPreset(DEFAULT_TIME_RANGE_PRESET);
    }

    onNavigate?.();
  };

  return (
    <nav
      className={cn("flex flex-col gap-1 px-3 py-4", className)}
      aria-label="Primary"
    >
      {navItems.map(({ label, to, isActive }) => {
        const active = isActive(pathname);

        return (
          <NavLink
            key={to}
            to={to}
            onClick={handleNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "group/nav-item rounded-md px-2.5 py-2 text-[13px] text-nav-text transition-colors",
              "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
              "active:bg-nav-active",
              active
                ? "bg-nav-active font-medium text-white"
                : "hover:bg-nav-hover hover:text-white",
            )}
          >
            {label}
          </NavLink>
        );
      })}
    </nav>
  );
};
