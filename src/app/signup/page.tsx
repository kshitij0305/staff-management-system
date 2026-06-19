import type { Metadata } from "next";
import { Logo } from "@/components/logo";
import { LoginArt } from "@/components/illustrations/login-art";
import { SignupForm } from "@/features/auth/components/signup-form";
import { APP_NAME } from "@/lib/constants";

export const metadata: Metadata = { title: "Start free" };

export default function SignupPage() {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="flex flex-col px-6 py-8 sm:px-12">
        <Logo />
        <div className="flex flex-1 flex-col items-center justify-center">
          <div className="w-full max-w-sm">
            <h1 className="text-2xl font-semibold tracking-tight">Create your workspace</h1>
            <p className="mt-1.5 mb-8 text-sm text-muted-foreground">
              Spin up your company on {APP_NAME} and design your own hierarchy in minutes.
            </p>
            <SignupForm />
          </div>
        </div>
        <p className="text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} {APP_NAME}
        </p>
      </div>

      <div className="relative hidden overflow-hidden bg-[#04140d] lg:flex lg:flex-col lg:items-center lg:justify-center">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(60% 50% at 50% 20%, rgba(16,185,129,0.20) 0%, transparent 70%), radial-gradient(40% 40% at 80% 80%, rgba(5,150,105,0.12) 0%, transparent 70%)",
          }}
        />
        <LoginArt className="relative z-10 w-full max-w-lg px-10" />
        <div className="relative z-10 mt-10 max-w-md px-10 text-center">
          <p className="text-lg font-medium text-stone-100">Your org. Your structure.</p>
          <p className="mt-2 text-sm leading-relaxed text-stone-400">
            Name your own levels, build your team tree and start tracking prospects — a CRM shaped
            exactly like your company.
          </p>
        </div>
      </div>
    </div>
  );
}
