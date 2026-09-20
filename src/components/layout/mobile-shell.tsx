"use client";

import { useState } from "react";
import { BottomNav } from "./bottom-nav";
import { MobileNav } from "./mobile-nav";

interface MobileShellProps {
  permissions: string[];
  roles: string[];
}

export function MobileShell({ permissions, roles }: MobileShellProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
      <BottomNav
        permissions={permissions}
        roles={roles}
        onMenuClick={() => setIsMenuOpen(true)}
      />
      <MobileNav
        permissions={permissions}
        roles={roles}
        open={isMenuOpen}
        onOpenChange={setIsMenuOpen}
      />
    </>
  );
}
