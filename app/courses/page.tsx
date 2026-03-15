"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AuthGuard } from "@/components/auth/auth-guard";
import { storage } from "@/lib/storage";
import { AP_COURSES } from "@/lib/events";
import { Plus, Check, ChevronRight, TrendingUp, Clock, Search } from "lucide-react";

export default function CoursesPage() {
  return (
    <SidebarProvider>
      <AuthGuard>
        <AppSidebar />
        <SidebarInset>
          <CoursesContent />
        </SidebarInset>
      </AuthGuard>
    </SidebarProvider>
  );
}

function CoursesContent() {
  const router = useRouter();
  const [courseStats, setCourseStats] = useState<Record<string, { attempted: number; accuracy: number }>>({});
  const [addedCourses, setAddedCourses] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const loadData = async () => {
      // Load course stats
      const sessions = await storage.getAllSessions();
      const stats: Record<string, { correct: number; total: number }> = {};

      sessions.forEach((session) => {
        session.attempts.forEach((attempt) => {
          const courseId = attempt.eventId || session.event || "unknown";
          if (!stats[courseId]) {
            stats[courseId] = { correct: 0, total: 0 };
          }
          stats[courseId].total++;
          if (attempt.isCorrect) {
            stats[courseId].correct++;
          }
        });
      });

      const formatted: Record<string, { attempted: number; accuracy: number }> = {};
      Object.entries(stats).forEach(([courseId, data]) => {
        formatted[courseId] = {
          attempted: data.total,
          accuracy: data.total > 0 ? (data.correct / data.total) * 100 : 0,
        };
      });

      setCourseStats(formatted);

      // Load added courses
      const added = await storage.getAddedCourses();
      setAddedCourses(added);
    };

    loadData();
  }, []);

  const handleAddCourse = async (courseId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (addedCourses.includes(courseId)) {
      await storage.removeCourse(courseId);
      setAddedCourses(prev => prev.filter(id => id !== courseId));
    } else {
      await storage.addCourse(courseId);
      setAddedCourses(prev => [...prev, courseId]);
    }
  };

  const filteredCourses = AP_COURSES.filter(course =>
    course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 overflow-auto">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Explore Courses</h1>
              <p className="text-muted-foreground mt-1">
                Browse and add courses to your study plan
              </p>
            </div>
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
              />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 max-w-6xl">
        <div className="space-y-4">
          {filteredCourses.map((course) => {
            const stats = courseStats[course.id];
            const Icon = course.icon;
            const isAdded = addedCourses.includes(course.id);

            return (
              <Card
                key={course.id}
                onClick={() => router.push(`/course/${course.id}`)}
                className="border-border hover:border-primary/50 transition-all duration-200 hover:shadow-xl cursor-pointer group"
              >
                <CardContent className="p-5">
                  <div className="flex items-center gap-5">
                    {/* Icon */}
                    <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-primary/12 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <Icon className="h-7 w-7 text-primary" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-lg font-bold text-foreground truncate">{course.name}</h3>
                        {stats && (
                          <span className="flex-shrink-0 text-xs font-semibold text-success bg-success/10 px-2 py-0.5 rounded-full">
                            {stats.accuracy.toFixed(0)}% accuracy
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-1">{course.description}</p>
                      
                      {/* Stats row */}
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        {stats ? (
                          <>
                            <span className="flex items-center gap-1">
                              <TrendingUp className="h-3 w-3" />
                              {stats.attempted} practiced
                            </span>
                          </>
                        ) : (
                          <span className="text-muted-foreground/70">Not started</span>
                        )}
                        {course.examDate && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Exam: {course.examDate}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <Button
                        variant={isAdded ? "default" : "outline"}
                        size="sm"
                        onClick={(e) => handleAddCourse(course.id, e)}
                        className={isAdded ? "bg-primary text-primary-foreground" : "bg-transparent"}
                      >
                        {isAdded ? (
                          <>
                            <Check className="h-4 w-4 mr-1" />
                            Added
                          </>
                        ) : (
                          <>
                            <Plus className="h-4 w-4 mr-1" />
                            Add
                          </>
                        )}
                      </Button>
                      <div className="hidden sm:flex items-center gap-2 text-primary font-semibold text-sm group-hover:translate-x-1 transition-transform">
                        View
                        <ChevronRight className="h-4 w-4" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredCourses.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No courses found matching "{searchQuery}"
          </div>
        )}
      </main>
    </div>
  );
}
