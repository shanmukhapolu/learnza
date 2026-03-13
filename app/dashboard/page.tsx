"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, Clock, Target, TrendingUp, Play, ExternalLink, BookOpen, Video, Sparkles, Zap } from "lucide-react";
import { storage, type UserStats } from "@/lib/storage";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { AuthGuard } from "@/components/auth/auth-guard";
import { useAuth } from "@/components/auth/auth-provider";

export default function DashboardPage() {
  const { profile } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [totalSessions, setTotalSessions] = useState(0);

  useEffect(() => {
    const loadStats = async () => {
      const calculatedStats = await storage.calculateStats();
      setStats(calculatedStats);
      const sessions = await storage.getAllSessions();
      setTotalSessions(sessions.length);
    };

    loadStats();

    const handleStorage = () => loadStats();
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const accuracy =
    stats && stats.totalAttempts > 0
      ? ((stats.correctAnswers / stats.totalAttempts) * 100).toFixed(1)
      : "0";

  const avgTime = stats?.averageTime ? stats.averageTime.toFixed(1) : "0";

  return (
    <div className="flex min-h-screen w-full">
      <SidebarProvider>
        <AuthGuard>
          <AppSidebar />
          <SidebarInset>
            <div className="flex flex-col flex-1">
              {/* Header */}
              <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="flex h-16 items-center gap-4 px-6">
                  <div className="flex-1">
                    <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Dashboard</h1>
                    <p className="text-sm text-muted-foreground">
                      Hi {profile?.firstName || "there"} — your AP prep overview.
                    </p>
                  </div>
                </div>
              </header>

              {/* Main Content */}
              <main className="flex-1 p-6 space-y-6">
                {/* Command Banner */}
                <div className="rounded-2xl glass-card tech-border p-5 bg-gradient-to-r from-primary/12 via-accent/6 to-transparent">
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    AP Study Command Center
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Track progress, launch practice quickly, and build momentum toward exam day.
                  </p>
                </div>

                {/* Quick Stats */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  {[
                    {
                      label: "Questions Attempted",
                      value: stats?.totalAttempts || 0,
                      sub: "Total practice questions",
                      icon: Target,
                      color: "text-primary",
                    },
                    {
                      label: "Overall Accuracy",
                      value: `${accuracy}%`,
                      sub: "Correct answers rate",
                      icon: TrendingUp,
                      color: "text-accent",
                    },
                    {
                      label: "Avg. Time per Question",
                      value: `${avgTime}s`,
                      sub: "Target: 30-45s per question",
                      icon: Clock,
                      color: "text-chart-3",
                    },
                    {
                      label: "Total Sessions",
                      value: totalSessions,
                      sub: "Completed practice sessions",
                      icon: Brain,
                      color: "text-chart-4",
                    },
                  ].map((stat) => (
                    <Card key={stat.label} className="glass-card hover:-translate-y-0.5 transition-transform">
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
                        <stat.icon className={`h-4 w-4 ${stat.color}`} />
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-extrabold text-foreground">{stat.value}</div>
                        <p className="text-xs text-muted-foreground mt-1">{stat.sub}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Momentum + Quick Launch */}
                <div className="grid gap-4 lg:grid-cols-2">
                  <Card className="glass-card tech-border bg-gradient-to-br from-primary/10 to-transparent">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        Momentum Meter
                      </CardTitle>
                      <CardDescription>How close you are to your accuracy goal.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Accuracy Goal</span>
                        <span className="font-bold">{Math.min(Number(accuracy), 100).toFixed(1)} / 100%</span>
                      </div>
                      <div className="h-3 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all"
                          style={{ width: `${Math.min(Number(accuracy), 100)}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Tip: Consistent daily sessions with review improve retention far faster than long cramming runs.
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="glass-card tech-border bg-gradient-to-br from-accent/10 to-transparent">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Zap className="h-5 w-5 text-accent" />
                        Quick Launch
                      </CardTitle>
                      <CardDescription>Jump into practice with one click.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex gap-3 flex-wrap">
                      <Button asChild variant="secondary" className="font-semibold">
                        <Link href="/courses">Start Practice</Link>
                      </Button>
                      <Button asChild variant="outline" className="font-semibold">
                        <Link href="/courses">Explore Courses</Link>
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                {/* Practice CTA */}
                <Card className="border-border bg-gradient-to-br from-primary/6 to-accent/4">
                  <CardHeader>
                    <CardTitle className="text-foreground">Ready to Practice?</CardTitle>
                    <CardDescription className="text-muted-foreground">
                      {stats && stats.totalAttempts > 0
                        ? "Continue your AP exam prep and keep pushing your score higher"
                        : "Choose an AP course to start practicing and tracking your performance"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button asChild size="lg" className="font-bold yellow-glow-sm">
                      <Link href="/courses">
                        <Play className="mr-2 h-4 w-4" />
                        Browse AP Courses
                      </Link>
                    </Button>
                  </CardContent>
                </Card>

                {/* Resources */}
                <div className="grid gap-4 md:grid-cols-2">
                  {/* Study Resources */}
                  <Card className="border-border">
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-primary" />
                        <CardTitle className="text-foreground">Study Resources</CardTitle>
                      </div>
                      <CardDescription>Official and community AP materials</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {[
                        {
                          label: "AP Central",
                          sub: "Official College Board AP resources",
                          href: "https://apcentral.collegeboard.org",
                        },
                        {
                          label: "Khan Academy AP",
                          sub: "Free College Board-aligned AP prep",
                          href: "https://www.khanacademy.org/college-careers-more/ap",
                        },
                        {
                          label: "AP Classroom",
                          sub: "Official College Board practice portal",
                          href: "https://myap.collegeboard.org",
                        },
                      ].map((res) => (
                        <a
                          key={res.label}
                          href={res.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-primary/6 hover:border-primary/30 transition-colors group"
                        >
                          <div className="flex items-center gap-3">
                            <BookOpen className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-semibold text-foreground">{res.label}</p>
                              <p className="text-xs text-muted-foreground">{res.sub}</p>
                            </div>
                          </div>
                          <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        </a>
                      ))}
                    </CardContent>
                  </Card>

                  {/* Video Resources */}
                  <Card className="border-border">
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <Video className="h-5 w-5 text-accent" />
                        <CardTitle className="text-foreground">Video Resources</CardTitle>
                      </div>
                      <CardDescription>Top YouTube channels for AP subjects</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {[
                        {
                          label: "CrashCourse",
                          sub: "AP History, Bio, Chem, and more",
                          href: "https://www.youtube.com/@crashcourse",
                        },
                        {
                          label: "Bozeman Science",
                          sub: "AP Biology and Chemistry deep dives",
                          href: "https://www.youtube.com/@bozemanscience",
                        },
                        {
                          label: "Tom Richey",
                          sub: "AP World, Euro, and US History",
                          href: "https://www.youtube.com/@tomrichey",
                        },
                      ].map((res) => (
                        <a
                          key={res.label}
                          href={res.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent/6 hover:border-accent/30 transition-colors group"
                        >
                          <div className="flex items-center gap-3">
                            <Video className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-semibold text-foreground">{res.label}</p>
                              <p className="text-xs text-muted-foreground">{res.sub}</p>
                            </div>
                          </div>
                          <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-accent transition-colors" />
                        </a>
                      ))}
                    </CardContent>
                  </Card>
                </div>

                {/* Practice Tips */}
                <Card className="border-border">
                  <CardHeader>
                    <CardTitle className="text-foreground">AP Exam Preparation Tips</CardTitle>
                    <CardDescription>Maximize your performance on exam day</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-3">
                      {[
                        {
                          num: "1",
                          color: "bg-primary/12 text-primary",
                          title: "Practice All Courses",
                          sub: "Explore multiple AP subjects to find where your strengths and weaknesses lie",
                        },
                        {
                          num: "2",
                          color: "bg-accent/12 text-accent",
                          title: "Track Your Progress",
                          sub: "Check the Progress tab in each course to monitor your accuracy and identify areas for improvement",
                        },
                        {
                          num: "3",
                          color: "bg-chart-3/12 text-chart-3",
                          title: "Target Weak Topics",
                          sub: "Focus your remaining prep time on the categories where your accuracy is lowest",
                        },
                      ].map((tip) => (
                        <div key={tip.num} className="flex items-start gap-3">
                          <div className={`flex h-8 w-8 items-center justify-center rounded-full ${tip.color} flex-shrink-0`}>
                            <span className="text-sm font-extrabold">{tip.num}</span>
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-foreground mb-1">{tip.title}</h4>
                            <p className="text-xs text-muted-foreground">{tip.sub}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </main>
            </div>
          </SidebarInset>
        </AuthGuard>
      </SidebarProvider>
    </div>
  );
}
