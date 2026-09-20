"use client";

import { ThemeToggle } from "./theme-toggle";
import { Button } from "@/components/ui/button";
import { UserCircle } from "lucide-react";
import Link from "next/link";
import { logout } from "./actions";
import { AuthUser, UserProfile } from "@/lib/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  user?: AuthUser | null;
  profile?: UserProfile | null;
  permissions?: string[];
  roles?: string[];
}

export function Header({ profile, permissions, roles }: HeaderProps) {
  return (
    <div className="border-b bg-background h-16 flex items-center px-4 md:px-8 shadow-sm justify-between safe-area-top">
      <div className="flex items-center gap-x-3">
        <span className="text-lg font-semibold md:hidden">College ERP</span>
      </div>
      <div className="flex items-center gap-x-4">
        <ThemeToggle />
        <DropdownMenu>
          {/* @ts-expect-error React 19 type issue with radix-ui */}
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <UserCircle className="w-6 h-6" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>
              {profile ? (
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{profile.first_name} {profile.last_name}</p>
                  <p className="text-xs leading-none text-muted-foreground">{profile.email}</p>
                </div>
              ) : (
                "My Account"
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {/* @ts-expect-error React 19 type issue with radix-ui */}
            <DropdownMenuItem asChild>
              <Link href="/profile" className="w-full cursor-pointer">Profile</Link>
            </DropdownMenuItem>
            {/* @ts-expect-error React 19 type issue with radix-ui */}
            <DropdownMenuItem asChild>
              <Link href="/settings" className="w-full cursor-pointer">Settings</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-red-600 cursor-pointer"
              onClick={async () => {
                await logout();
              }}
            >
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
