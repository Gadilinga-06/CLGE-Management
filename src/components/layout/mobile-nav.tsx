"use client";

import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Sidebar } from "./sidebar";
import { useSyncExternalStore } from "react";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

interface MobileNavProps {
  permissions?: string[];
  roles?: string[];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function MobileNav({ permissions, roles, open: controlledOpen, onOpenChange }: MobileNavProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const pathname = usePathname();

  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;

  useEffect(() => {
    setOpen(false);
  }, [pathname, setOpen]);

  if (!isMounted) {
    return null;
  }

  return (
    <Sheet open={isOpen} onOpenChange={setOpen}>
      <SheetContent side="left" className="p-0 bg-slate-900 border-none w-[85vw] max-w-[320px]">
        <Sidebar permissions={permissions || []} roles={roles || []} />
      </SheetContent>
    </Sheet>
  );
}
