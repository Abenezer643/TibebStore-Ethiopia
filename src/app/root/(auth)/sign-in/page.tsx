"use client";

import Link from "next/link";
import { Sparkles } from 'lucide-react';
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signInSchema, type SignInInput } from "@/lib/validations/auth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toast";
import { SUPER_ADMIN_EMAIL, useAuth } from "@/hooks/useAuth";

function SignInPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { signIn, user, isHydrated, isAuthenticated } = useAuth();

  const verified = searchParams.get("verified");

  useEffect(() => {
    if (verified) {
      toast("success", "Email verified! You can now sign in.");
    }
  }, [verified, toast]);

  useEffect(() => {
    if (!isHydrated) return;
    if (!isAuthenticated || !user) return;
    router.replace(user.email.trim().toLowerCase() === SUPER_ADMIN_EMAIL ? "/super-admin" : "/account");
  }, [isHydrated, isAuthenticated, user, router]);
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
  });

  const onSubmit = async (data: SignInInput) => {
    try {
      const res = await fetch("/api/auth/sign-in", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: data.email, password: data.password }),
      });

      const json = await res.json();

      if (res.ok) {
        // Sign in successful - update auth state
        await signIn({ email: data.email, password: data.password });
        toast("success", "Welcome back! Redirecting...");
        router.push(
          data.email.trim().toLowerCase() === SUPER_ADMIN_EMAIL ? "/super-admin" : "/account"
        );
      } else if (json.needsVerification) {
        // Email not verified - redirect to verification
        toast("info", "Please verify your email first.");
        router.push(`/verify-email?email=${encodeURIComponent(data.email)}`);
      } else {
        toast("error", json.error || "Invalid email or password");
      }
    } catch (error) {
      toast("error", error instanceof Error ? error.message : "Invalid email or password");
    }
  };

  return (
    <div className="container mx-auto flex min-h-[calc(100vh-80px)] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md p-8">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-3 mb-6 group">
            <img src="/Headerlogo.png" alt="TibebStore" className="h-14 w-auto group-hover:scale-105 transition-all" />
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-text-primary">Welcome Back</h1>
          <p className="text-text-secondary mt-2">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Input
            label="Email Address"
            type="email"
            placeholder="email@example.com"
            {...register("email")}
            error={errors.email?.message}
          />
          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            {...register("password")}
            error={errors.password?.message}
          />

          <div className="text-right">
            <Link href="/forgot-password" className="text-sm text-primary hover:underline">
              Forgot password?
            </Link>
          </div>

          <Button type="submit" className="w-full" isLoading={isSubmitting}>
            Sign In
          </Button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-sm font-bold text-text-secondary uppercase">
            Don't have an account?{" "}
            <Link href="/sign-up" className="text-primary hover:underline">
              Create one now
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
      <SignInPageInner />
    </Suspense>
  );
}
