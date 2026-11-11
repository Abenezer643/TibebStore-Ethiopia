"use client";

// Sign-up page with email verification
import Link from "next/link";
import { Sparkles } from 'lucide-react';
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signUpSchema, type SignUpInput } from "@/lib/validations/auth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toast";
import * as React from "react";

export default function SignUpPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<any>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    }
  });

  const onSubmit = async (data: any) => {
    try {
      const res = await fetch("/api/auth/sign-up", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: data.email,
          username: data.username,
          password: data.password,
        }),
      });

      const json = await res.json();
      
      if (res.ok) {
        if (json.verified) {
          // Super admin - auto verified, go to sign-in
          toast("success", "Super admin account created! You can now sign in.");
          router.push("/sign-in");
        } else {
          // Regular user - needs verification
          toast("success", "Account created! Please verify your email.");
          router.push(`/verify-email?email=${encodeURIComponent(data.email)}`);
        }
      } else {
        toast("error", json.error || "Something went wrong");
      }
    } catch (error) {
      toast("error", "Something went wrong. Please try again.");
    }
  };

  return (
    <div className="container mx-auto flex min-h-[calc(100vh-80px)] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md p-8">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-3 mb-6 group">
            <img src="/Headerlogo.png" alt="TibebStore" className="h-14 w-auto group-hover:scale-105 transition-all" />
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-text-primary">Join TibebStore</h1>
          <p className="text-text-secondary mt-2">Create your account</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Input
            label="Username"
            type="text"
            placeholder="artisan_name"
            {...register("username")}
            error={errors.username?.message as string}
          />
          <Input
            label="Email Address"
            type="email"
            placeholder="email@example.com"
            {...register("email")}
            error={errors.email?.message as string}
          />
          <Input
            label="Password"
            type="password"
            placeholder="Enter your password"
            {...register("password")}
            error={errors.password?.message as string}
          />
          <Input
            label="Confirm Password"
            type="password"
            placeholder="Confirm your password"
            {...register("confirmPassword")}
            error={errors.confirmPassword?.message as string}
          />

          <Button type="submit" className="w-full" isLoading={isSubmitting}>
            Create Account
          </Button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-sm text-text-secondary">
            Already have an account?{" "}
            <Link href="/sign-in" className="text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
}
