"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Target,
  TrendingUp,
  Clock,
  BarChart3,
  Zap,
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  BarChart,
  Brain,
  RefreshCw,
  Users,
  Trophy,
  Sparkles,
  X,
  Check,
  BookOpen,
} from "lucide-react";
import { AP_COURSES } from "@/lib/events";

export default function HomePage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const totalSlides = AP_COURSES.length;

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animate-in");
          }
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll(".fade-in-section").forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % totalSlides);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  const goToSlide = (index: number) => setCurrentSlide(index);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Dot-grid background pattern */}
      <div className="fixed inset-0 -z-10 dot-grid-bg opacity-40" />

      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-border/50">
        {/* Top nav buttons */}
        <div className="absolute top-6 right-6 z-20 flex gap-3">
          <Button asChild variant="outline" className="border-primary/40 bg-background/80 backdrop-blur-sm font-semibold">
            <Link href="/auth/signin">Log In</Link>
          </Button>
          <Button asChild className="shadow-none yellow-glow-sm font-bold">
            <Link href="/auth/signup">Sign Up Free</Link>
          </Button>
        </div>

        {/* Warm yellow glow blobs */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-accent/5 to-transparent" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[500px] w-[700px] bg-primary/10 rounded-full blur-[120px] -z-10" />

        <div className="container relative mx-auto px-6 py-28 md:py-36 lg:py-44">
          <div className="mx-auto max-w-5xl text-center">
            {/* Brand pill */}
            <div className="mb-8 inline-flex items-center gap-3 rounded-full border border-primary/40 bg-primary/10 backdrop-blur-sm px-6 py-3 text-base font-semibold shadow-md animate-fade-in-up">
              <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center yellow-glow-sm">
                <span className="text-primary-foreground font-extrabold text-base leading-none">L</span>
              </div>
              <span className="text-foreground font-bold text-lg">Learnza</span>
              <span className="h-5 w-px bg-border" />
              <span className="text-muted-foreground text-sm">AP Exam Prep</span>
            </div>

            <h1 className="mb-8 text-6xl font-extrabold tracking-tight text-foreground md:text-8xl text-balance animate-fade-in-up animation-delay-100 leading-tight">
              Ace Your AP Exams with
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_auto] animate-[shimmer_3s_ease-in-out_infinite]">
                Confidence
              </span>
            </h1>

            <p className="mx-auto mb-12 max-w-2xl text-xl text-muted-foreground animate-fade-in-up animation-delay-200 leading-relaxed">
              Precision-focused practice for AP exams. Train smarter, score higher, and walk into test day ready.
            </p>

            <div className="flex flex-wrap justify-center gap-4 animate-fade-in-up animation-delay-300">
              <Button asChild size="lg" className="h-14 px-8 text-lg yellow-glow font-bold transition-all duration-300 hover:scale-105">
                <Link href="/auth/signup">
                  Start Practicing Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="h-14 px-8 text-lg border-2 border-primary/40 text-foreground hover:text-foreground hover:bg-primary/8 font-semibold"
              >
                <Link href="/courses">Browse Courses</Link>
              </Button>
            </div>

            {/* Stat pills */}
            <div className="mt-14 flex flex-wrap justify-center gap-6 animate-fade-in-up animation-delay-300">
              {[
                { label: "AP Courses", value: "6" },
                { label: "Practice Questions", value: "500+" },
                { label: "Free Forever", value: "100%" },
              ].map((stat) => (
                <div key={stat.label} className="flex flex-col items-center gap-1 px-6 py-3 rounded-2xl border border-primary/25 bg-primary/8">
                  <span className="text-2xl font-extrabold text-primary">{stat.value}</span>
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{stat.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Problem vs Solution */}
      <section className="border-b border-border/50">
        <div className="container mx-auto px-6 py-24 md:py-32">
          <div className="mx-auto max-w-6xl">
            <div className="text-center mb-12 fade-in-section">
              <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4 text-balance">
                AP Exams Aren{"'"}t About Memorizing —
                <br />They{"'"}re About <span className="text-primary">Precision</span>
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-10 items-start fade-in-section">
              {/* Problem Side */}
              <div className="relative">
                <div className="absolute -inset-4 bg-destructive/5 rounded-3xl blur-2xl" />
                <Card className="relative border-2 border-destructive/20 bg-card/90 backdrop-blur-sm">
                  <CardContent className="p-8">
                    <h3 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
                        <X className="h-6 w-6 text-destructive" />
                      </div>
                      Most students:
                    </h3>
                    <ul className="space-y-4 text-lg">
                      {[
                        "Cram from random Quizlets the night before",
                        "Don't know which topics they're actually weak in",
                        "Walk into exam day hoping they studied the right stuff",
                      ].map((item) => (
                        <li key={item} className="flex items-start gap-3 text-muted-foreground">
                          <div className="mt-1 h-6 w-6 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
                            <div className="h-2 w-2 rounded-full bg-destructive" />
                          </div>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>

              {/* Solution Side */}
              <div className="relative">
                <div className="absolute -inset-4 bg-primary/10 rounded-3xl blur-2xl" />
                <Card className="relative border-2 border-primary/35 bg-gradient-to-br from-primary/10 to-accent/8 backdrop-blur-sm">
                  <CardContent className="p-8">
                    <h3 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center yellow-glow-sm">
                        <Check className="h-6 w-6 text-primary-foreground" />
                      </div>
                      Learnza fixes that.
                    </h3>
                    <p className="text-lg text-foreground leading-relaxed mb-6">
                      We organize practice by AP course, track your performance with real data, and guide you to focus where it actually matters for your score.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <div className="px-4 py-2 rounded-full bg-primary/15 border border-primary/30 text-sm font-semibold text-primary">
                        Organized Practice
                      </div>
                      <div className="px-4 py-2 rounded-full bg-accent/15 border border-accent/30 text-sm font-semibold text-accent">
                        Performance Tracking
                      </div>
                      <div className="px-4 py-2 rounded-full bg-chart-3/10 border border-chart-3/20 text-sm font-medium text-chart-3">
                        Focused Learning
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How Learnza Is Different */}
      <section className="border-b border-border/50 bg-muted/30">
        <div className="container mx-auto px-6 py-24 md:py-32">
          <div className="mx-auto max-w-6xl">
            <div className="text-center mb-16 fade-in-section">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/12 border border-primary/30 text-primary text-sm font-bold mb-4">
                <Sparkles className="h-4 w-4" />
                What Makes Us Different
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4 text-balance">
                Why Learnza Works
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Learnza isn{"'"}t built like a typical study site.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 fade-in-section mb-12">
              {[
                {
                  icon: Target,
                  title: "Course Organization",
                  desc: "Questions are grouped by AP course, not random topics from every subject",
                  border: "border-primary/25",
                  iconBg: "from-primary/20 to-primary/5",
                  iconColor: "text-primary",
                },
                {
                  icon: BarChart,
                  title: "Real Data",
                  desc: "Practice sessions generate detailed performance data, not just a score at the end",
                  border: "border-accent/25",
                  iconBg: "from-accent/20 to-accent/5",
                  iconColor: "text-accent",
                },
                {
                  icon: RefreshCw,
                  title: "Smart Review",
                  desc: "Missed questions are automatically queued for redemption in your next session",
                  border: "border-chart-3/20",
                  iconBg: "from-chart-3/20 to-chart-3/5",
                  iconColor: "text-chart-3",
                },
              ].map((item) => (
                <Card
                  key={item.title}
                  className={`${item.border} bg-card/80 backdrop-blur-sm hover:shadow-2xl transition-all hover:-translate-y-2 duration-300`}
                >
                  <CardContent className="p-8 text-center">
                    <div className={`h-16 w-16 rounded-2xl bg-gradient-to-br ${item.iconBg} flex items-center justify-center mx-auto mb-6`}>
                      <item.icon className={`h-8 w-8 ${item.iconColor}`} />
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-3">{item.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{item.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="text-center fade-in-section">
              <p className="text-lg text-foreground font-semibold italic border-l-4 border-primary pl-4 inline-block">
                Every part of the platform is designed to push your AP score forward.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Credibility */}
      <section className="border-b border-border/50">
        <div className="container mx-auto px-6 py-24 md:py-32">
          <div className="mx-auto max-w-4xl fade-in-section">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/15 to-accent/12 rounded-3xl blur-3xl" />
              <Card className="relative border-2 border-primary/25 bg-card/90 backdrop-blur-sm">
                <CardContent className="p-12 text-center">
                  <div className="inline-flex items-center justify-center gap-3 mb-6">
                    <div className="h-12 w-12 rounded-full bg-primary/12 flex items-center justify-center">
                      <Trophy className="h-6 w-6 text-primary" />
                    </div>
                    <h2 className="text-3xl md:text-4xl font-bold text-foreground text-balance">
                      Built by Students Who Know AP Exams
                    </h2>
                  </div>
                  <p className="text-xl text-muted-foreground leading-relaxed">
                    Designed specifically for AP exam prep — not generic test practice. Every question, every feature, every data point is built around what matters for your score.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Who This Is For */}
      <section className="border-b border-border/50 bg-muted/30">
        <div className="container mx-auto px-6 py-24 md:py-32">
          <div className="mx-auto max-w-6xl">
            <div className="text-center mb-16 fade-in-section">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/12 border border-accent/25 text-accent text-sm font-bold mb-4">
                <Users className="h-4 w-4" />
                Who It{"'"}s For
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4 text-balance">
                Who Learnza Is Built For
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-6 fade-in-section mb-12">
              {[
                {
                  icon: Brain,
                  title: "AP Students",
                  desc: "Enrolled in any AP course and serious about maximizing your exam score",
                  border: "border-primary/25",
                  iconBg: "from-primary/20 to-primary/5",
                  iconColor: "text-primary",
                },
                {
                  icon: Target,
                  title: "Structured Learners",
                  desc: "Students who want organized, data-driven practice — not random chaos",
                  border: "border-accent/25",
                  iconBg: "from-accent/20 to-accent/5",
                  iconColor: "text-accent",
                },
                {
                  icon: Zap,
                  title: "Score Maximizers",
                  desc: "Aiming for a 4 or 5 and want to walk in confident, not uncertain",
                  border: "border-chart-3/20",
                  iconBg: "from-chart-3/20 to-chart-3/5",
                  iconColor: "text-chart-3",
                },
              ].map((item) => (
                <Card
                  key={item.title}
                  className={`border-2 ${item.border} bg-card/80 backdrop-blur-sm hover:${item.border.replace("/25", "/45").replace("/20", "/40")} transition-all hover:scale-105 duration-300 group`}
                >
                  <CardContent className="p-8 text-center">
                    <div className={`h-20 w-20 rounded-full bg-gradient-to-br ${item.iconBg} flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform`}>
                      <item.icon className={`h-10 w-10 ${item.iconColor}`} />
                    </div>
                    <h3 className="text-2xl font-bold text-foreground mb-3">{item.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{item.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="text-center fade-in-section">
              <p className="text-2xl text-foreground font-bold">
                If you care about your AP score, this was built for you.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Courses Slider */}
      <section className="border-b border-border/50">
        <div className="container mx-auto px-6 py-24 md:py-32">
          <div className="mx-auto max-w-6xl">
            <div className="text-center mb-16 fade-in-section">
              <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4 text-balance">
                Train for Real AP Exams
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Focused practice built around actual AP exam content — organized by course, no fluff.
              </p>
            </div>

            {/* Course Slider */}
            <div className="relative fade-in-section max-w-4xl mx-auto">
              <div className="overflow-hidden rounded-2xl">
                <div
                  className="flex transition-transform duration-500 ease-out"
                  style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                >
                  {AP_COURSES.map((course) => {
                    const IconComponent = course.icon;
                    return (
                      <div key={course.id} className="min-w-full px-2">
                        <Card className="border-2 border-primary/25 bg-gradient-to-br from-card/90 to-muted/50 backdrop-blur-sm shadow-none">
                          <CardContent className="p-12">
                            <div className="flex flex-col md:flex-row items-center gap-8">
                              <div className="flex-shrink-0 h-24 w-24 rounded-3xl bg-gradient-to-br from-primary/25 to-accent/12 flex items-center justify-center yellow-glow-sm">
                                <IconComponent className="h-12 w-12 text-primary" />
                              </div>
                              <div className="flex-1 text-center md:text-left">
                                <h3 className="mb-3 text-3xl font-extrabold text-foreground">
                                  {course.name}
                                </h3>
                                <p className="mb-6 text-lg text-muted-foreground leading-relaxed">
                                  {course.description}
                                </p>
                                <Button asChild size="lg" className="yellow-glow-sm font-bold">
                                  <Link href={`/practice/${course.id}`}>
                                    Practice Now
                                    <ChevronRight className="ml-2 h-5 w-5" />
                                  </Link>
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Navigation Arrows */}
              <button
                onClick={prevSlide}
                aria-label="Previous course"
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-6 md:-translate-x-16 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-2xl yellow-glow hover:scale-110 transition-all flex items-center justify-center disabled:opacity-40"
                disabled={currentSlide === 0}
              >
                <ChevronLeft className="h-7 w-7" />
              </button>
              <button
                onClick={nextSlide}
                aria-label="Next course"
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-6 md:translate-x-16 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-2xl yellow-glow hover:scale-110 transition-all flex items-center justify-center disabled:opacity-40"
                disabled={currentSlide === totalSlides - 1}
              >
                <ChevronRight className="h-7 w-7" />
              </button>

              {/* Slide Indicators */}
              <div className="flex justify-center gap-2 mt-8">
                {AP_COURSES.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToSlide(index)}
                    aria-label={`Go to course ${index + 1}`}
                    className={`h-2 rounded-full transition-all ${
                      index === currentSlide
                        ? "w-8 bg-primary"
                        : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="mt-12 text-center fade-in-section">
              <Button asChild variant="outline" size="lg" className="border-2 border-primary/35 hover:bg-primary/8 font-semibold">
                <Link href="/courses">
                  View All Courses
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="border-b border-border/50 bg-muted/30">
        <div className="container mx-auto px-6 py-24 md:py-32">
          <div className="mx-auto max-w-6xl">
            <div className="text-center mb-16 fade-in-section">
              <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
                Study Smarter. Score Higher.
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-8 fade-in-section">
              {[
                {
                  icon: Target,
                  title: "Course-Specific Practice",
                  desc: "Practice questions written specifically for each AP course — no generic, one-size-fits-all studying.",
                  iconBg: "from-primary/20 to-primary/5",
                  iconColor: "text-primary",
                  border: "border-primary/20",
                },
                {
                  icon: BarChart3,
                  title: "Advanced Performance Analytics",
                  desc: "See accuracy, timing, and trends across sessions so you know exactly where to focus your energy.",
                  iconBg: "from-accent/20 to-accent/5",
                  iconColor: "text-accent",
                  border: "border-accent/20",
                },
                {
                  icon: RefreshCw,
                  title: "Redemption System",
                  desc: "Miss a question? You'll see it again — and track whether you actually improved on the retry.",
                  iconBg: "from-chart-3/20 to-chart-3/5",
                  iconColor: "text-chart-3",
                  border: "border-chart-3/20",
                },
                {
                  icon: TrendingUp,
                  title: "Progress Tracking",
                  desc: "Visual dashboards that show how far you've come across practice sessions and AP courses.",
                  iconBg: "from-chart-4/20 to-chart-4/5",
                  iconColor: "text-chart-4",
                  border: "border-chart-4/20",
                },
              ].map((item) => (
                <Card
                  key={item.title}
                  className={`${item.border} bg-card/80 backdrop-blur-sm hover:shadow-2xl transition-all group`}
                >
                  <CardContent className="p-10">
                    <div className={`h-16 w-16 rounded-2xl bg-gradient-to-br ${item.iconBg} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                      <item.icon className={`h-8 w-8 ${item.iconColor}`} />
                    </div>
                    <h3 className="text-2xl font-bold text-foreground mb-4">{item.title}</h3>
                    <p className="text-lg text-muted-foreground leading-relaxed">{item.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Data Dashboard Preview */}
      <section className="border-b border-border/50">
        <div className="container mx-auto px-6 py-24 md:py-32">
          <div className="mx-auto max-w-6xl">
            <div className="grid md:grid-cols-2 gap-16 items-center fade-in-section">
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/12 border border-primary/30 text-primary text-sm font-bold mb-6">
                  <BarChart className="h-4 w-4" />
                  Performance Metrics
                </div>
                <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6 text-balance">
                  Data-Driven Score Improvement
                </h2>
                <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                  After every session, Learnza records:
                </p>
                <ul className="space-y-5">
                  {[
                    {
                      icon: Target,
                      color: "text-primary",
                      bg: "bg-primary/10",
                      title: "Accuracy by course",
                      sub: "See your precision across all AP subjects",
                    },
                    {
                      icon: Clock,
                      color: "text-accent",
                      bg: "bg-accent/10",
                      title: "Time per question",
                      sub: "Optimize speed without sacrificing accuracy",
                    },
                    {
                      icon: TrendingUp,
                      color: "text-chart-3",
                      bg: "bg-chart-3/10",
                      title: "Performance trends over time",
                      sub: "Visualize your growth across sessions",
                    },
                  ].map((item) => (
                    <li key={item.title} className="flex items-start gap-4">
                      <div className={`h-12 w-12 rounded-xl ${item.bg} flex items-center justify-center flex-shrink-0`}>
                        <item.icon className={`h-6 w-6 ${item.color}`} />
                      </div>
                      <div>
                        <div className="font-bold text-foreground text-lg mb-1">{item.title}</div>
                        <div className="text-muted-foreground">{item.sub}</div>
                      </div>
                    </li>
                  ))}
                </ul>
                <p className="mt-8 text-lg text-foreground font-semibold border-l-4 border-primary pl-4">
                  You don{"'"}t just study — you measure progress.
                </p>
              </div>

              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/15 rounded-3xl blur-3xl" />
                <Card className="relative border-2 border-primary/25 bg-card/90 backdrop-blur-sm shadow-2xl">
                  <CardContent className="p-10">
                    <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wide mb-6">Live Performance Dashboard</h4>
                    <div className="space-y-5">
                      {[
                        { name: "AP World History", score: 88, color: "from-primary to-accent" },
                        { name: "AP Biology", score: 82, color: "from-accent to-chart-3" },
                        { name: "AP Chemistry", score: 75, color: "from-chart-3 to-chart-4" },
                        { name: "AP European History", score: 91, color: "from-chart-4 to-chart-5" },
                        { name: "AP Precalculus", score: 94, color: "from-chart-5 to-primary" },
                        { name: "AP Macroeconomics", score: 79, color: "from-primary to-chart-3" },
                      ].map((item, idx) => (
                        <div key={idx}>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-semibold text-foreground">{item.name}</span>
                            <span className="text-sm font-bold text-primary font-mono">{item.score}%</span>
                          </div>
                          <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full bg-gradient-to-r ${item.color} transition-all duration-1000`}
                              style={{ width: `${item.score}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Practice Flow */}
      <section className="border-b border-border/50 bg-muted/30">
        <div className="container mx-auto px-6 py-24 md:py-32">
          <div className="mx-auto max-w-5xl">
            <div className="text-center mb-16 fade-in-section">
              <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
                How Practice Sessions Work
              </h2>
              <p className="text-xl text-muted-foreground">
                No guessing what to study next — the system guides you.
              </p>
            </div>

            <div className="relative fade-in-section">
              <div className="space-y-8 md:space-y-10">
                {[
                  {
                    num: 1,
                    title: "Choose an AP course",
                    desc: "Select from AP World, AP Bio, AP Chem, AP Euro, AP Precalc, or AP Macro",
                    color: "bg-primary/15 text-primary",
                  },
                  {
                    num: 2,
                    title: "Complete a focused practice session",
                    desc: "Answer course-specific questions with real-time feedback and explanations",
                    color: "bg-accent/15 text-accent",
                  },
                  {
                    num: 3,
                    title: "Review accuracy, timing, and weak areas",
                    desc: "Detailed analytics show exactly which topics need more work",
                    color: "bg-chart-3/15 text-chart-3",
                  },
                  {
                    num: 4,
                    title: "Revisit missed questions automatically",
                    desc: "The redemption system ensures you master every concept before exam day",
                    color: "bg-chart-4/15 text-chart-4",
                  },
                ].map((step, idx) => (
                  <div
                    key={idx}
                    className="practice-step grid grid-cols-[72px_1fr] items-start gap-6 rounded-2xl border border-border/60 bg-card/70 px-6 py-6 shadow-sm md:grid-cols-[96px_1fr]"
                    style={{ transitionDelay: `${idx * 120}ms` }}
                  >
                    <div className="flex items-start justify-center pt-1">
                      <div className={`h-14 w-14 rounded-full ${step.color} flex items-center justify-center font-extrabold text-xl`}>
                        {step.num}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-foreground mb-2">{step.title}</h3>
                      <p className="text-muted-foreground text-lg">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-b border-border/50">
        <div className="container mx-auto px-6 py-24 md:py-32">
          <div className="mx-auto max-w-5xl fade-in-section">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-accent/15 to-chart-3/10 rounded-3xl blur-3xl" />
              <Card className="relative border-2 border-primary/30 bg-gradient-to-br from-card/90 to-muted/50 backdrop-blur-sm shadow-2xl">
                <CardContent className="p-16 text-center">
                  <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-primary mb-8 yellow-glow mx-auto">
                    <BookOpen className="h-8 w-8 text-primary-foreground" />
                  </div>
                  <h2 className="text-5xl md:text-6xl font-extrabold text-foreground mb-6 text-balance">
                    Ready to Score a{" "}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
                      5?
                    </span>
                  </h2>
                  <p className="text-2xl text-muted-foreground mb-12 leading-relaxed max-w-2xl mx-auto">
                    Stop guessing. Start training with purpose.
                  </p>
                  <Button
                    asChild
                    size="lg"
                    className="h-16 px-12 text-xl yellow-glow font-extrabold transition-all duration-300 hover:scale-105"
                  >
                    <Link href="/auth/signup">
                      Start Practicing Free
                      <ArrowRight className="ml-3 h-6 w-6" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted/50 border-t border-border/50">
        <div className="container mx-auto px-6 py-12">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center yellow-glow-sm">
                <span className="text-primary-foreground font-extrabold text-sm leading-none">L</span>
              </div>
              <span className="text-lg font-extrabold text-foreground">Learnza</span>
            </div>
            <div className="text-sm text-muted-foreground">
              {/* eslint-disable-next-line react/no-unescaped-entities */}
              &copy; 2025 Learnza. Built for AP students.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
