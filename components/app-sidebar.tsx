"use client";

import { useEffect, useState } from "react";
import { Home, BookOpen } from "lucide-react";
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
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { storage, storageEvents } from "@/lib/storage";
import { getCourseById } from "@/lib/events";

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, user, signOut } = useAuth();
  const fallbackName = user?.displayName?.trim() || "Student";
  const resolvedName = [profile?.firstName, profile?.lastName].filter(Boolean).join(" ") || fallbackName;
  
  const [addedCourses, setAddedCourses] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    const loadCourses = async () => {
      const courses = await storage.getAddedCourses();
      if (!cancelled) setAddedCourses(courses);
    };
    loadCourses();

    // Re-fetch whenever addCourse / removeCourse is called anywhere
    storageEvents.on("addedCourses", loadCourses);
    return () => {
      cancelled = true;
      storageEvents.off("addedCourses", loadCourses);
    };
  }, []);

  const mainNavItems = [
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
  ];

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
        <SidebarMenu className="space-y-1">
          {/* Dashboard */}
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname === "/dashboard"}
              tooltip="Dashboard"
              className="py-6"
            >
              <Link href="/dashboard">
                <Home className="h-5 w-5" />
                <span className="text-base">Dashboard</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          {/* Courses with subitems */}
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname === "/courses" || pathname.startsWith("/course/")}
              tooltip="Courses"
              className="py-6"
            >
              <Link href="/courses">
                <BookOpen className="h-5 w-5" />
                <span className="text-base">Courses</span>
              </Link>
            </SidebarMenuButton>
            
            {/* Added courses as subitems - always visible */}
            {addedCourses.length > 0 && (
              <SidebarMenuSub>
                {addedCourses.map((courseId) => {
                  const course = getCourseById(courseId);
                  if (!course) return null;
                  const Icon = course.icon;
                  const isActive = pathname === `/course/${courseId}` || pathname.startsWith(`/practice/${courseId}`);
                  
                  return (
                    <SidebarMenuSubItem key={courseId}>
                      <SidebarMenuSubButton
                        asChild
                        isActive={isActive}
                      >
                        <Link href={`/course/${courseId}`} className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          <span className="truncate">{course.name.replace("AP ", "")}</span>
                        </Link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  );
                })}
              </SidebarMenuSub>
            )}
          </SidebarMenuItem>
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
