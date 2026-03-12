"use client";

import Image from "next/image";
import { Home, Layers, BarChart3, BookOpen } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from "@/components/ui/sidebar";

const navItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: Home,
  },
  {
    title: "Courses",
    href: "/courses",
    icon: BookOpen,
  },
  {
    title: "Analytics",
    href: "/analytics",
    icon: BarChart3,
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, user, signOut } = useAuth();
  const fallbackName = user?.displayName?.trim() || "Student";
  const resolvedName = [profile?.firstName, profile?.lastName].filter(Boolean).join(" ") || fallbackName;

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border p-6">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary yellow-glow-sm">
            <span className="text-primary-foreground font-bold text-lg leading-none">L</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-extrabold text-sidebar-foreground tracking-tight">Learnza</span>
            <span className="text-xs text-muted-foreground font-medium">AP Exam Prep</span>
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent className="p-4">
        <SidebarMenu className="space-y-2">
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={pathname === item.href || pathname.startsWith(item.href + "/")}
                tooltip={item.title}
                className="py-6"
              >
                <Link href={item.href}>
                  <item.icon className="h-5 w-5" />
                  <span className="text-base">{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border p-4">
        <div className="space-y-3">
          <p className="text-sm font-medium text-sidebar-foreground truncate">
            {resolvedName}
          </p>
          <Button
            size="sm"
            className="w-full"
            onClick={() => {
              signOut();
              router.push("/auth/signin");
            }}
          >
            Sign out
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
