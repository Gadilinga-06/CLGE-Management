"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  GraduationCap,
  Users,
  Calendar,
  FileText,
  Menu,
} from "lucide-react";

interface BottomNavProps {
  permissions: string[];
  roles: string[];
  onMenuClick: () => void;
}

const bottomNavItems = [
  {
    label: "Home",
    icon: LayoutDashboard,
    href: "/",
    requiredPermission: null,
  },
  {
    label: "Students",
    icon: GraduationCap,
    href: "/students",
    requiredPermission: "students.view",
  },
  {
    label: "Faculty",
    icon: Users,
    href: "/faculty",
    requiredPermission: "faculty.view",
  },
  {
    label: "Attendance",
    icon: Calendar,
    href: "/attendance",
    requiredPermission: "attendance.view",
  },
  {
    label: "Reports",
    icon: FileText,
    href: "/reports",
    requiredPermission: "reports.view",
  },
];

export function BottomNav({ permissions, roles, onMenuClick }: BottomNavProps) {
  const pathname = usePathname();

  const filteredItems = bottomNavItems.filter(
    (r) =>
      !r.requiredPermission ||
      permissions.includes(r.requiredPermission) ||
      roles.includes("SUPER_ADMIN")
  );

  // Show max 4 items + menu button
  const navItems = filteredItems.slice(0, 4);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-background border-t border-border safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 min-w-[60px] py-1 rounded-lg transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className={cn("w-5 h-5", isActive && "text-primary")} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
        <button
          onClick={onMenuClick}
          className="flex flex-col items-center justify-center gap-1 min-w-[60px] py-1 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
        >
          <Menu className="w-5 h-5" />
          <span className="text-[10px] font-medium">More</span>
        </button>
      </div>
    </nav>
  );
}
