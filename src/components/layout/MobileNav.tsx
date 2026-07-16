import { Menu } from "lucide-react";
import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { AppSidebar } from "./AppSidebar";

export const MobileNav = () => {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button
            variant="outline"
            size="icon-sm"
            className="btn-toolbar xl:hidden"
            aria-label="Open navigation menu"
          />
        }
      >
        <Menu className="size-4" aria-hidden="true" />
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-[236px] border-border-soft bg-sidebar p-0"
      >
        <SheetHeader className="border-b border-border-soft px-4 py-3">
          <SheetTitle className="text-left text-[14px] font-semibold text-text">
            Dashboard
          </SheetTitle>
        </SheetHeader>
        <AppSidebar onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
};
