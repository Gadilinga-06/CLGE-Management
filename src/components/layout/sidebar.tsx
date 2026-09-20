"use client";

import { memo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  Library,
  Bus,
  FileText,
  Settings,
  Layers,
  Calendar,
  Grid,
  Hash,
  BookOpenCheck,
  Building,
  Zap,
  Bot,
} from "lucide-react";

const sidebarRoutes = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/",
    color: "text-sky-500",
    requiredPermission: null,
  },
  {
    label: "Students",
    icon: GraduationCap,
    href: "/students",
    color: "text-violet-500",
    requiredPermission: "students.view",
  },
  {
    label: "Faculty",
    icon: Users,
    href: "/faculty",
    color: "text-pink-700",
    requiredPermission: "faculty.view",
  },
  {
    label: "Departments",
    icon: BookOpen,
    href: "/departments",
    color: "text-orange-700",
    requiredPermission: "departments.view",
  },
  {
    label: "Library",
    icon: Library,
    href: "/library",
    color: "text-emerald-500",
    requiredPermission: "library.view",
  },
  {
    label: "Transport",
    icon: Bus,
    href: "/transport",
    color: "text-gray-500",
    requiredPermission: "transport.view",
  },
  {
    label: "Results",
    icon: FileText,
    href: "/results",
    color: "text-green-700",
    requiredPermission: "results.view",
  },
  {
    label: "Settings",
    icon: Settings,
    href: "/settings/college",
    requiredPermission: "settings.view",
  },
  {
    label: "Programs",
    icon: Layers,
    href: "/programs",
    color: "text-blue-500",
    requiredPermission: "departments.view",
  },
  {
    label: "Academic Years",
    icon: Calendar,
    href: "/academic-years",
    color: "text-amber-500",
    requiredPermission: "settings.view",
  },
  {
    label: "Semesters",
    icon: Grid,
    href: "/semesters",
    color: "text-indigo-500",
    requiredPermission: "departments.view",
  },
  {
    label: "Sections",
    icon: Hash,
    href: "/sections",
    color: "text-rose-500",
    requiredPermission: "departments.view",
  },
  {
    label: "Subjects",
    icon: BookOpenCheck,
    href: "/subjects",
    color: "text-cyan-500",
    requiredPermission: "departments.view",
  },
  {
    label: "Rooms",
    icon: Building,
    href: "/rooms",
    color: "text-stone-500",
    requiredPermission: "settings.view",
  },
  {
    label: "Automation",
    icon: Zap,
    href: "/automation",
    color: "text-yellow-500",
    requiredPermission: "settings.view",
  },
  {
    label: "AI Assistant",
    icon: Bot,
    href: "/chat",
    color: "text-cyan-500",
    requiredPermission: null,
  },
];

interface SidebarProps {
  permissions: string[];
  roles: string[];
}

export const Sidebar = memo(function Sidebar({ permissions, roles }: SidebarProps) {
  const pathname = usePathname();

  return (
    <div className="space-y-4 py-4 flex flex-col h-full bg-slate-900 text-white">
      <div className="px-3 py-2 flex-1">
        <Link href="/" className="flex items-center pl-3 mb-14">
          <div className="relative w-8 h-8 mr-4 bg-white rounded-full flex items-center justify-center">
             <GraduationCap className="text-slate-900 w-5 h-5" />
          </div>
          <h1 className="text-2xl font-bold">College ERP</h1>
        </Link>
        <div className="space-y-1">
          {sidebarRoutes
            .filter((r) => !r.requiredPermission || permissions.includes(r.requiredPermission) || roles.includes("SUPER_ADMIN"))
            .map((route) => (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                "text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:text-white hover:bg-white/10 rounded-lg transition",
                pathname === route.href
                  ? "text-white bg-white/10"
                  : "text-zinc-400"
              )}
            >
              <div className="flex items-center flex-1">
                <route.icon className={cn("h-5 w-5 mr-3", route.color)} />
                {route.label}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
});
