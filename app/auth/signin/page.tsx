"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { GoogleSignInButton } from "@/components/auth/google-signin-button";
import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center p-4 text-muted-foreground">Loading sign in...</div>}>
      <SignInContent />
    </Suspense>
  );
}

function SignInContent() {
  const { signIn, signInWithGoogleCredential, user } = useAuth();
  const router = useRouter();
  const params = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const next = params.get("next") || "/dashboard";

  useEffect(() => {
    if (user) {
      router.replace(next);
    }
  }, [next, router, user]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signIn(email, password);
      router.replace(next);
    } catch (err) {
      setError((err as Error).message || "Sign in failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Brand */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center yellow-glow">
              <span className="text-primary-foreground font-extrabold text-xl leading-none">L</span>
            </div>
            <span className="text-2xl font-extrabold text-foreground">Learnza</span>
          </div>
          <p className="text-muted-foreground text-sm">AP Exam Prep</p>
        </div>

        <Card className="glass-card tech-border">
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl font-extrabold">Sign in to Learnza</CardTitle>
            <p className="text-sm text-muted-foreground">Welcome back — your AP prep awaits</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={onSubmit} className="space-y-3">
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11"
              />
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-11"
              />
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full h-11 font-bold yellow-glow-sm" disabled={loading}>
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">or</span>
              </div>
            </div>

            <GoogleSignInButton
              onCredential={async (credential) => {
                setError("");
                setLoading(true);
                try {
                  await signInWithGoogleCredential(credential);
                  router.replace(next);
                } catch (err) {
                  setError((err as Error).message || "Google sign in failed");
                } finally {
                  setLoading(false);
                }
              }}
            />

            <p className="text-sm text-center text-muted-foreground">
              New to Learnza?{" "}
              <Link className="font-semibold text-primary underline underline-offset-2" href="/auth/signup">
                Create an account
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
