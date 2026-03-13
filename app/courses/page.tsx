"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AuthGuard } from "@/components/auth/auth-guard";
import { storage } from "@/lib/storage";
import { AP_COURSES } from "@/lib/events";
import { Play, TrendingUp, BookOpen, Target } from "lucide-react";

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
  const [courseStats, setCourseStats] = useState<Record<string, { attempted: number; accuracy: number }>>({});

  useEffect(() => {
    const loadCourseStats = async () => {
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
    };

    loadCourseStats();
  }, []);

  return (
    <div className="flex-1 overflow-auto">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-6">
          <div>
            <h1 className="text-3xl font-extrabold text-foreground tracking-tight">AP Courses</h1>
            <p className="text-muted-foreground mt-1">
              Choose a course and start building your score
            </p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 max-w-7xl">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {AP_COURSES.map((course) => {
            const stats = courseStats[course.id];
            const Icon = course.icon;

            return (
              <Card
                key={course.id}
                className="border-border hover:border-primary/50 transition-all duration-200 hover:shadow-xl hover:-translate-y-1 group"
              >
                <CardHeader>
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-12 h-12 rounded-xl bg-primary/12 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    {stats && (
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">Accuracy</div>
                        <div className="text-lg font-bold font-mono text-accent">
                          {stats.accuracy.toFixed(0)}%
                        </div>
                      </div>
                    )}
                  </div>
                  <CardTitle className="text-xl font-extrabold">{course.name}</CardTitle>
                  <CardDescription className="text-sm leading-relaxed">{course.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {stats && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <TrendingUp className="h-4 w-4" />
                        <span>{stats.attempted} questions practiced</span>
                      </div>
                    )}
                    <Button asChild className="w-full font-bold yellow-glow-sm" size="lg">
                      <Link href={`/practice/${course.id}`}>
                        <Play className="mr-2 h-4 w-4" />
                        Practice Now
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Tips Card */}
        <Card className="mt-8 border-primary/20 bg-gradient-to-br from-primary/6 to-transparent">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              AP Prep Tips
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3 text-sm">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/12 flex-shrink-0">
                  <span className="text-sm font-extrabold text-primary">1</span>
                </div>
                <div>
                  <h4 className="font-bold mb-1">Start Early</h4>
                  <p className="text-muted-foreground">
                    Begin practicing at least 2 months before your AP exam for the best results
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/12 flex-shrink-0">
                  <span className="text-sm font-extrabold text-accent">2</span>
                </div>
                <div>
                  <h4 className="font-bold mb-1">Practice Consistently</h4>
                  <p className="text-muted-foreground">
                    Short daily sessions outperform long occasional cramming sessions
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-chart-3/12 flex-shrink-0">
                  <span className="text-sm font-extrabold text-chart-3">3</span>
                </div>
                <div>
                  <h4 className="font-bold mb-1">Track Your Weaknesses</h4>
                  <p className="text-muted-foreground">
                    Use the analytics page to find exactly which topics to prioritize
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resource Links */}
        <Card className="mt-6 border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BookOpen className="h-5 w-5 text-primary" />
              Official AP Resources
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-3 text-sm">
              {[
                {
                  label: "College Board AP Central",
                  desc: "Official AP course descriptions and exam info",
                  href: "https://apcentral.collegeboard.org",
                },
                {
                  label: "Khan Academy AP Courses",
                  desc: "Free AP prep aligned to College Board",
                  href: "https://www.khanacademy.org/college-careers-more/ap",
                },
                {
                  label: "AP Classroom",
                  desc: "Official College Board practice portal",
                  href: "https://myap.collegeboard.org",
                },
              ].map((res) => (
                <a
                  key={res.label}
                  href={res.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col gap-1 p-3 rounded-lg border border-border hover:bg-primary/6 hover:border-primary/30 transition-colors"
                >
                  <span className="font-semibold text-foreground">{res.label}</span>
                  <span className="text-muted-foreground text-xs">{res.desc}</span>
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
