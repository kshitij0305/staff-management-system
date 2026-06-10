import type { Metadata } from "next";
import { Suspense } from "react";
import { Logo } from "@/components/logo";
import { LoginArt } from "@/components/illustrations/login-art";
import { LoginForm } from "@/features/auth/components/login-form";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      {/* Left: form */}
      <div className="flex flex-col px-6 py-8 sm:px-12">
        <Logo />
        <div className="flex flex-1 flex-col items-center justify-center">
          <div className="w-full max-w-sm">
            <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
            <p className="mt-1.5 mb-8 text-sm text-muted-foreground">
              Sign in to manage your team and prospects.
            </p>
            <Suspense>
              <LoginForm />
            </Suspense>
          </div>
        </div>
        <p className="text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} VK Group · APN Solar Energy Pvt. Ltd.
        </p>
      </div>

      {/* Right: illustration panel */}
      <div className="relative hidden overflow-hidden bg-stone-950 lg:flex lg:flex-col lg:items-center lg:justify-center">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(60% 50% at 50% 20%, rgba(245,158,11,0.18) 0%, transparent 70%), radial-gradient(40% 40% at 80% 80%, rgba(234,88,12,0.10) 0%, transparent 70%)",
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        <LoginArt className="relative z-10 w-full max-w-lg px-10" />
        <div className="relative z-10 mt-10 max-w-md px-10 text-center">
          <p className="text-lg font-medium text-stone-100">
            One portal for the whole hierarchy.
          </p>
          <p className="mt-2 text-sm leading-relaxed text-stone-400">
            From the Chairman&apos;s overview to every prospect a CPE collects in the field —
            track performance, manage your team and grow together.
          </p>
        </div>
      </div>
    </div>
  );
}
