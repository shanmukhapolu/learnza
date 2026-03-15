"use client";

import { useState, useEffect, useMemo, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AuthGuard } from "@/components/auth/auth-guard";
import { storage, type SessionData, type QuestionAttempt } from "@/lib/storage";
import { getCourseById, getCourseName } from "@/lib/events";
import { QuestionTimelineChart } from "@/components/question-timeline-chart";
import { formatDuration, buildSessionBreakdown, getDifficultyTimeSplits, getSessionTotalTime } from "@/lib/session-analytics";
import {
  ArrowLeft,
  BookOpen,
  Play,
  GraduationCap,
  BarChart3,
  Calendar,
  Clock,
  Target,
  Flame,
  Sparkles,
  Medal,
  Timer,
  TrendingUp,
  ListChecks,
  Activity,
  Plus,
  Check,
} from "lucide-react";

export default function CoursePage({ params }: { params: Promise<{ courseId: string }> }) {
  const resolvedParams = use(params);

  return (
    <SidebarProvider>
      <AuthGuard>
        <AppSidebar />
        <SidebarInset>
          <CourseContent courseId={resolvedParams.courseId} />
        </SidebarInset>
      </AuthGuard>
    </SidebarProvider>
  );
}

function CourseContent({ courseId }: { courseId: string }) {
  const router = useRouter();
  const course = getCourseById(courseId);
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [selectedSession, setSelectedSession] = useState<SessionData | null>(null);
  const [isAdded, setIsAdded] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    const loadData = async () => {
      const allSessions = await storage.getAllSessions();
      const courseSessions = allSessions.filter(s => s.event === courseId);
      setSessions(courseSessions);

      const addedCourses = await storage.getAddedCourses();
      setIsAdded(addedCourses.includes(courseId));
    };
    loadData();
  }, [courseId]);

  const handleToggleAdd = async () => {
    if (isAdded) {
      await storage.removeCourse(courseId);
      setIsAdded(false);
    } else {
      await storage.addCourse(courseId);
      setIsAdded(true);
    }
  };

  if (!course) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Course Not Found</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              The course you're looking for doesn't exist.
            </p>
            <Button asChild>
              <Link href="/courses">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Courses
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const Icon = course.icon;

  // Calculate days until exam
  const daysUntilExam = useMemo(() => {
    if (!course.examDate) return null;
    const examDate = new Date(course.examDate + ", 2025");
    const today = new Date();
    const diffTime = examDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  }, [course.examDate]);

  return (
    <div className="flex-1 overflow-auto">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/courses">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Courses
              </Link>
            </Button>
            <div className="flex-1 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/12 flex items-center justify-center">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">{course.name}</h1>
                {course.examDate && (
                  <p className="text-sm text-muted-foreground">Exam: {course.examDate}</p>
                )}
              </div>
            </div>
            <Button
              variant={isAdded ? "default" : "outline"}
              size="sm"
              onClick={handleToggleAdd}
              className={isAdded ? "" : "bg-transparent"}
            >
              {isAdded ? (
                <>
                  <Check className="h-4 w-4 mr-1" />
                  Added
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-1" />
                  Add to Sidebar
                </>
              )}
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-6 max-w-6xl">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 h-auto">
            <TabsTrigger value="overview" className="py-3">
              <BookOpen className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="practice" className="py-3">
              <Play className="h-4 w-4 mr-2" />
              Practice
            </TabsTrigger>
            <TabsTrigger value="exam" className="py-3">
              <GraduationCap className="h-4 w-4 mr-2" />
              Exam Mode
            </TabsTrigger>
            <TabsTrigger value="progress" className="py-3">
              <BarChart3 className="h-4 w-4 mr-2" />
              Progress
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <OverviewTab course={course} daysUntilExam={daysUntilExam} sessions={sessions} />
          </TabsContent>

          {/* Practice Tab */}
          <TabsContent value="practice" className="space-y-6">
            <PracticeTab courseId={courseId} courseName={course.name} />
          </TabsContent>

          {/* Exam Mode Tab */}
          <TabsContent value="exam" className="space-y-6">
            <ExamModeTab courseId={courseId} courseName={course.name} sessions={sessions} />
          </TabsContent>

          {/* Progress Tab */}
          <TabsContent value="progress" className="space-y-6">
            <ProgressTab sessions={sessions} courseId={courseId} onOpenSession={setSelectedSession} />
          </TabsContent>
        </Tabs>
      </main>

      {/* Session Detail Modal */}
      {selectedSession && (
        <SessionDetailModal session={selectedSession} onClose={() => setSelectedSession(null)} />
      )}
    </div>
  );
}

// Overview Tab Component
function OverviewTab({ course, daysUntilExam, sessions }: { course: any; daysUntilExam: number | null; sessions: SessionData[] }) {
  const totalQuestions = sessions.reduce((sum, s) => sum + s.totalQuestions, 0);
  const totalCorrect = sessions.reduce((sum, s) => sum + s.correctCount, 0);
  const accuracy = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;

  return (
    <>
      {/* Countdown Card */}
      {daysUntilExam !== null && (
        <Card className="border-primary/25 bg-gradient-to-r from-primary/10 via-accent/10 to-transparent">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-foreground">AP Exam Countdown</h3>
                <p className="text-sm text-muted-foreground">{course.examDate}, 2025</p>
              </div>
              <div className="text-right">
                <div className="text-4xl font-extrabold text-primary font-mono">{daysUntilExam}</div>
                <div className="text-sm text-muted-foreground">days remaining</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/12 flex items-center justify-center">
                <Target className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Questions Practiced</p>
                <p className="text-2xl font-bold">{totalQuestions}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-success/12 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Accuracy</p>
                <p className="text-2xl font-bold">{accuracy.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent/12 flex items-center justify-center">
                <Activity className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Sessions Completed</p>
                <p className="text-2xl font-bold">{sessions.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Exam Format */}
      {course.examFormat && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <GraduationCap className="h-5 w-5 text-primary" />
              Exam Format
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{course.examFormat}</p>
          </CardContent>
        </Card>
      )}

      {/* Course Units */}
      {course.units && course.units.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ListChecks className="h-5 w-5 text-primary" />
              Course Units
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 md:grid-cols-2">
              {course.units.map((unit: string, index: number) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-primary/12 flex items-center justify-center text-sm font-bold text-primary">
                    {index + 1}
                  </div>
                  <span className="text-sm font-medium">{unit.replace(/^Unit \d+: /, "")}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}

// Practice Tab Component
function PracticeTab({ courseId, courseName }: { courseId: string; courseName: string }) {
  return (
    <Card className="border-primary/20">
      <CardContent className="p-8 text-center">
        <div className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-6">
          <Play className="h-10 w-10 text-primary" />
        </div>
        <h2 className="text-2xl font-bold mb-3">Practice Mode</h2>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          Practice questions at your own pace. Get instant feedback and explanations.
          Missed questions will automatically reappear for redemption.
        </p>
        <Button asChild size="lg" className="yellow-glow font-bold">
          <Link href={`/practice/${courseId}`}>
            <Play className="mr-2 h-5 w-5" />
            Start Practice Session
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

// Exam Mode Tab Component
function ExamModeTab({ courseId, courseName, sessions }: { courseId: string; courseName: string; sessions: SessionData[] }) {
  // Calculate predicted AP score based on accuracy
  const totalQuestions = sessions.reduce((sum, s) => sum + s.totalQuestions, 0);
  const totalCorrect = sessions.reduce((sum, s) => sum + s.correctCount, 0);
  const accuracy = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;
  
  const getPredictedScore = (acc: number): number => {
    if (acc >= 85) return 5;
    if (acc >= 70) return 4;
    if (acc >= 55) return 3;
    if (acc >= 40) return 2;
    return 1;
  };

  const predictedScore = getPredictedScore(accuracy);

  return (
    <div className="space-y-6">
      {/* Predicted Score Card */}
      {totalQuestions >= 10 && (
        <Card className="border-primary/25 bg-gradient-to-r from-primary/10 via-accent/10 to-transparent">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-foreground">AP Score Prediction</h3>
                <p className="text-sm text-muted-foreground">Based on {totalQuestions} practice questions</p>
              </div>
              <div className="text-right">
                <div className="text-5xl font-extrabold text-primary font-mono">{predictedScore}</div>
                <div className="text-sm text-muted-foreground">predicted score</div>
              </div>
            </div>
            <div className="mt-4 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-accent transition-all"
                style={{ width: `${(predictedScore / 5) * 100}%` }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-accent/20">
        <CardContent className="p-8 text-center">
          <div className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-accent/20 to-chart-3/20 flex items-center justify-center mb-6">
            <GraduationCap className="h-10 w-10 text-accent" />
          </div>
          <h2 className="text-2xl font-bold mb-3">Exam Simulation Mode</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Simulate real AP exam conditions with timed sections and authentic question formats.
            Test your readiness under pressure.
          </p>
          <Button size="lg" className="font-bold" disabled>
            <Clock className="mr-2 h-5 w-5" />
            Coming Soon
          </Button>
          <p className="text-xs text-muted-foreground mt-4">
            Exam mode will be available in the next update
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// Progress Tab Component (Analytics moved here)
function ProgressTab({ sessions, courseId, onOpenSession }: { sessions: SessionData[]; courseId: string; onOpenSession: (session: SessionData) => void }) {
  const attempts = sessions.flatMap((s) => s.attempts);
  
  if (attempts.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
            <BarChart3 className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-bold mb-2">No Progress Data Yet</h3>
          <p className="text-muted-foreground mb-4">Complete some practice sessions to see your progress breakdown.</p>
          <Button asChild>
            <Link href={`/practice/${courseId}`}>
              <Play className="mr-2 h-4 w-4" />
              Start Practicing
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const totalQuestions = attempts.length;
  const correct = attempts.filter((a) => a.isCorrect).length;
  const incorrect = totalQuestions - correct;
  const totalThink = attempts.reduce((sum, a) => sum + a.thinkTime, 0);
  const totalExplanation = attempts.reduce((sum, a) => sum + a.explanationTime, 0);
  const totalTime = totalThink + totalExplanation;
  const avgTime = totalQuestions ? totalThink / totalQuestions : 0;
  const avgCorrectTime = correct ? attempts.filter((a) => a.isCorrect).reduce((s, a) => s + a.thinkTime, 0) / correct : 0;
  const avgWrongTime = incorrect ? attempts.filter((a) => !a.isCorrect).reduce((s, a) => s + a.thinkTime, 0) / incorrect : 0;

  const streak = getHighestStreak(attempts);
  const avgSessionLength = sessions.length ? sessions.reduce((s, session) => s + getSessionTotalTime(session), 0) / sessions.length : 0;

  const redemptionAttempts = attempts.filter((a) => a.isRedemption);
  const redemptionCorrect = redemptionAttempts.filter((a) => a.isCorrect).length;

  const category = groupByCategory(attempts);
  const sortedCategories = Object.entries(category)
    .map(([name, stats]) => ({
      name,
      accuracy: stats.attempts ? (stats.correct / stats.attempts) * 100 : 0,
      ...stats,
    }))
    .sort((a, b) => b.accuracy - a.accuracy);

  const bestCategory = sortedCategories[0]?.name ?? "N/A";
  const worstCategory = sortedCategories[sortedCategories.length - 1]?.name ?? "N/A";
  const difficulty = getDifficultyTimeSplits(attempts);

  return (
    <div className="space-y-5">
      <SectionCard title="Performance Overview" subtitle="Core metrics" icon={<Target className="h-5 w-5 text-primary" />}>
        <MetricGrid>
          <Metric label="Questions Answered" value={`${totalQuestions}`} accent="primary" />
          <Metric label="Accuracy" value={`${((correct / totalQuestions) * 100).toFixed(1)}%`} accent="success" />
          <Metric label="Avg Time" value={`${avgTime.toFixed(1)}s`} />
          <Metric label="Avg Time (Correct)" value={`${avgCorrectTime.toFixed(1)}s`} />
          <Metric label="Avg Time (Wrong)" value={`${avgWrongTime.toFixed(1)}s`} />
          <Metric label="Highest Streak" value={`${streak}`} />
          <Metric label="Total Time Practicing" value={formatDuration(totalTime)} accent="primary" />
          <Metric label="Avg Session Length" value={formatDuration(avgSessionLength)} />
        </MetricGrid>
      </SectionCard>

      <SectionCard
        title="Redemption Stats"
        subtitle="Retry performance"
        icon={<Sparkles className="h-5 w-5 text-accent" />}
        className="border-accent/20 bg-accent/5"
      >
        <MetricGrid>
          <Metric label="Redemption Attempts" value={`${redemptionAttempts.length}`} accent="accent" />
          <Metric label="Redemption Performance" value={`${(redemptionAttempts.length ? (redemptionCorrect / redemptionAttempts.length) * 100 : 0).toFixed(1)}%`} accent="accent" />
          <Metric label="Redemption Avg Think" value={`${(redemptionAttempts.length ? redemptionAttempts.reduce((s, a) => s + a.thinkTime, 0) / redemptionAttempts.length : 0).toFixed(1)}s`} accent="accent" />
        </MetricGrid>
      </SectionCard>

      {sortedCategories.length > 0 && (
        <SectionCard title="Category Mastery" subtitle="Topic strengths and weaknesses" icon={<Medal className="h-5 w-5 text-primary" />}>
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-sm mb-3">
            Best category: <strong>{bestCategory}</strong> • Worst category: <strong>{worstCategory}</strong>
          </div>
          <div className="space-y-2">
            {sortedCategories.map((cat) => (
              <div key={cat.name} className="flex items-center justify-between p-3 rounded-lg border border-border">
                <span className="font-medium">{cat.name}</span>
                <span className="text-sm text-muted-foreground">
                  {cat.accuracy.toFixed(1)}% ({cat.correct}/{cat.attempts})
                </span>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      <SectionCard title="Difficulty Breakdown" subtitle="Per-difficulty pacing" icon={<Flame className="h-5 w-5 text-chart-3" />}>
        <div className="grid gap-3 md:grid-cols-3">
          {Object.entries(difficulty).map(([d, s]) => (
            <div key={d} className="p-3 rounded-lg border border-border">
              <div className="text-sm font-medium mb-1">{d}</div>
              <div className="text-xl font-bold">{(s.attempts ? s.think / s.attempts : 0).toFixed(1)}s</div>
              <div className="text-xs text-muted-foreground">avg think time</div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SessionLogCard sessions={sessions} onOpenSession={onOpenSession} />
    </div>
  );
}

// Helper Components
function SectionCard({ title, subtitle, children, icon, className }: { title: string; subtitle: string; children: React.ReactNode; icon?: React.ReactNode; className?: string }) {
  return (
    <Card className={`border ${className ?? "bg-card/70"}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">{icon}{title}</CardTitle>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function MetricGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-3 md:grid-cols-4">{children}</div>;
}

function Metric({ label, value, accent, compact }: { label: string; value: string; accent?: string; compact?: boolean }) {
  const accentClass = accent === "primary" ? "text-primary" : accent === "success" ? "text-success" : accent === "accent" ? "text-accent" : "text-foreground";
  return (
    <div className={`rounded-lg border p-3 ${compact ? "" : ""}`}>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`text-xl font-bold ${accentClass}`}>{value}</div>
    </div>
  );
}

function SessionLogCard({ sessions, onOpenSession }: { sessions: SessionData[]; onOpenSession: (session: SessionData) => void }) {
  const rows = [...sessions]
    .sort((a, b) => (a.startTimestamp < b.startTimestamp ? 1 : -1))
    .slice(0, 10);

  if (rows.length === 0) return null;

  return (
    <SectionCard title="Session Log" subtitle="Click any session for detailed timeline" icon={<Timer className="h-5 w-5 text-primary" />}>
      <div className="space-y-2 text-sm">
        <div className="grid grid-cols-4 gap-2 text-xs uppercase tracking-wide text-muted-foreground px-3">
          <span>Date</span><span>Questions</span><span>Accuracy</span><span>Time</span>
        </div>
        {rows.map((session) => (
          <button
            key={session.sessionId}
            onClick={() => onOpenSession(session)}
            className="w-full text-left grid grid-cols-4 gap-2 items-center rounded-lg border p-3 hover:bg-primary/10 hover:border-primary/40 transition-colors"
          >
            <span className="truncate">{new Date(session.startTimestamp).toLocaleDateString()}</span>
            <span>{session.totalQuestions} Q</span>
            <span>{session.accuracy.toFixed(1)}%</span>
            <span>{formatDuration(getSessionTotalTime(session))}</span>
          </button>
        ))}
      </div>
    </SectionCard>
  );
}

function SessionDetailModal({ session, onClose }: { session: SessionData; onClose: () => void }) {
  const breakdown = buildSessionBreakdown(session);
  const avgThinkTime = session.totalQuestions > 0 ? session.totalThinkTime / session.totalQuestions : 0;
  const avgExplanationTime = session.totalQuestions > 0 ? session.totalExplanationTime / session.totalQuestions : 0;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm overflow-auto p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <Card className="border-primary/25">
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle className="text-2xl">Session Detail</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">{new Date(session.startTimestamp).toLocaleString()} • {getCourseName(session.event)}</p>
              </div>
              <button className="text-sm underline" onClick={onClose}>Close</button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-3 md:grid-cols-3">
              <Metric label="Accuracy" value={`${session.accuracy.toFixed(1)}%`} compact />
              <Metric label="Total Questions" value={`${session.totalQuestions}`} compact />
              <Metric label="Total Think Time" value={formatDuration(session.totalThinkTime)} compact />
              <Metric label="Total Explanation Time" value={formatDuration(session.totalExplanationTime)} compact />
              <Metric label="Avg Think / Q" value={`${avgThinkTime.toFixed(1)}s`} compact />
              <Metric label="Avg Explanation / Q" value={`${avgExplanationTime.toFixed(1)}s`} compact />
            </div>

            <div>
              <h3 className="font-semibold mb-3">Question Timeline</h3>
              <QuestionTimelineChart attempts={session.attempts} />
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <Metric label="Longest Correct Streak" value={`${breakdown.longestCorrectStreak}`} compact />
              <Metric label="Longest Incorrect Streak" value={`${breakdown.longestIncorrectStreak}`} compact />
              <Metric label="Hardest Topic" value={breakdown.hardestTopic} compact />
              <Metric label="Easiest Topic" value={breakdown.easiestTopic} compact />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Helper functions
function groupByCategory(attempts: QuestionAttempt[]) {
  const result: Record<string, { attempts: number; correct: number }> = {};
  attempts.forEach((attempt) => {
    if (!result[attempt.category]) result[attempt.category] = { attempts: 0, correct: 0 };
    result[attempt.category].attempts += 1;
    if (attempt.isCorrect) result[attempt.category].correct += 1;
  });
  return result;
}

function getHighestStreak(attempts: QuestionAttempt[]) {
  let max = 0;
  let current = 0;
  attempts.forEach((attempt) => {
    if (attempt.isCorrect) {
      current += 1;
      max = Math.max(max, current);
    } else {
      current = 0;
    }
  });
  return max;
}
