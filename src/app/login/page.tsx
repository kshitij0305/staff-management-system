import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { LoginForm } from "@/features/auth/components/login-form";
import { AuthAside } from "@/features/auth/components/auth-aside";
import { APP_NAME } from "@/lib/constants";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      {/* Left: form */}
      <div className="flex flex-col px-6 py-8 sm:px-12">
        <Link href="/" className="w-fit rounded-lg transition-opacity hover:opacity-80">
          <Logo />
        </Link>
        <div className="flex flex-1 flex-col items-center justify-center py-10">
          <div className="w-full max-w-sm">
            <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
            <p className="mt-1.5 mb-8 text-sm text-muted-foreground">
              Sign in to your {APP_NAME} workspace.
            </p>
            <Suspense>
              <LoginForm />
            </Suspense>
          </div>
        </div>
        <p className="text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} {APP_NAME}
        </p>
      </div>

      <AuthAside
        headline={
          <>
            Your org. Your structure.{" "}
            <span className="text-emerald-300">Your CRM.</span>
          </>
        }
        sub="Sign in to manage your team, track prospects and watch performance roll up your own hierarchy."
      />
    </div>
  );
}
