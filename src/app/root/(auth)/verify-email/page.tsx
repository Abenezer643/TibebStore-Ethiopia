"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { CheckCircle, XCircle, Loader2, Mail, ArrowLeft, RefreshCw } from "lucide-react";

function VerifyEmailPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();

  const success = searchParams.get("success");
  const error = searchParams.get("error");
  const token = searchParams.get("token");
  const emailParam = searchParams.get("email");

  const [email, setEmail] = useState(emailParam || "");
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [canResend, setCanResend] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);

  // Timer for resend button
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [resendTimer]);

  // Auto-verify if token is in URL
  useEffect(() => {
    if (token && !success && !error) {
      // Token verification is handled by GET endpoint which redirects
    }
  }, [token, success, error]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast("error", "Email is required");
      return;
    }

    if (!code || code.length !== 6) {
      toast("error", "Please enter the 6-digit code");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, code }),
      });

      const json = await res.json();
      if (res.ok) {
        toast("success", "Email verified successfully!");
        router.push("/sign-in?verified=true");
      } else {
        toast("error", json.error || "Invalid code");
      }
    } catch (error) {
      toast("error", "Failed to verify email");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      toast("error", "Email is required");
      return;
    }

    setIsResending(true);
    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const json = await res.json();
      if (res.ok) {
        toast("success", "New verification code sent!");
        setCanResend(false);
        setResendTimer(60);
        setCode("");
      } else {
        toast("error", json.error || "Failed to resend code");
      }
    } catch (error) {
      toast("error", "Failed to resend code");
    } finally {
      setIsResending(false);
    }
  };

  // Success state
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="w-full max-w-md p-8">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-black uppercase tracking-tight mb-2">Email Verified!</h1>
            <p className="text-text-secondary mb-6">
              Your email has been verified successfully. You can now sign in to your account.
            </p>
            <Link href="/sign-in">
              <Button className="w-full">Sign In</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="w-full max-w-md p-8">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-black uppercase tracking-tight mb-2">Verification Failed</h1>
            <p className="text-text-secondary mb-6">
              {error === "invalid" 
                ? "This verification link is invalid or has expired." 
                : "Something went wrong. Please try again."}
            </p>
            <Link href="/sign-in">
              <Button variant="outline" className="w-full">Back to Sign In</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  // Token verification in progress
  if (token && !success && !error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="w-full max-w-md p-8">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
            <h1 className="text-2xl font-black uppercase tracking-tight mb-2">Verifying Email...</h1>
            <p className="text-text-secondary">Please wait while we verify your email address.</p>
          </div>
        </Card>
      </div>
    );
  }

  // Code verification form
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-100 flex items-center justify-center">
            <Mail className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-black uppercase tracking-tight mb-2">Verify Your Email</h1>
          <p className="text-text-secondary">
            We've sent a 6-digit code to <strong>{email || "your email"}</strong>
          </p>
        </div>

        <form onSubmit={handleVerify} className="space-y-4">
          {!email && (
            <div>
              <label className="block text-sm font-bold uppercase tracking-tight text-text-secondary mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-[rgba(255,255,255,0.50)] backdrop-filter-[saturate(180%)_blur(20px)] border border-[rgba(15,23,42,0.12)] rounded-2xl px-4 py-3 text-base text-text-primary placeholder:text-text-secondary transition-all duration-150 ease-out focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/15"
                disabled={isLoading}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-bold uppercase tracking-tight text-text-secondary mb-2">
              Verification Code
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="000000"
              maxLength={6}
              className="w-full bg-[rgba(255,255,255,0.50)] backdrop-filter-[saturate(180%)_blur(20px)] border border-[rgba(15,23,42,0.12)] rounded-2xl px-4 py-4 text-center text-2xl font-bold tracking-[0.5em] text-text-primary placeholder:text-text-secondary transition-all duration-150 ease-out focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/15"
              disabled={isLoading}
            />
          </div>

          <Button type="submit" className="w-full" isLoading={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Verifying...
              </>
            ) : (
              "Verify Email"
            )}
          </Button>
        </form>

        <div className="mt-6 text-center space-y-3">
          <button
            onClick={handleResend}
            disabled={!canResend || isResending}
            className="text-sm text-primary hover:underline disabled:text-text-secondary disabled:no-underline disabled:cursor-not-allowed flex items-center justify-center mx-auto"
          >
            {isResending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : canResend ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Resend Code
              </>
            ) : (
              `Resend code in ${resendTimer}s`
            )}
          </button>

          <Link href="/sign-in" className="text-sm text-text-secondary hover:text-primary flex items-center justify-center">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Sign In
          </Link>
        </div>
      </Card>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      }
    >
      <VerifyEmailPageInner />
    </Suspense>
  );
}
