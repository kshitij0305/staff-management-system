import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { SignupForm } from "@/features/auth/components/signup-form";
import { AuthAside } from "@/features/auth/components/auth-aside";
import { APP_NAME } from "@/lib/constants";

export const metadata: Metadata = { title: "Start free" };

export default function SignupPage() {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="flex flex-col px-6 py-8 sm:px-12">
        <Link href="/" className="w-fit rounded-lg transition-opacity hover:opacity-80">
          <Logo />
        </Link>
        <div className="flex flex-1 flex-col items-center justify-center py-10">
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

      <AuthAside
        headline={
          <>
            Build a CRM shaped{" "}
            <span className="text-emerald-300">exactly like your company.</span>
          </>
        }
        sub="Name your own levels, build your team tree and start tracking prospects — ready in minutes, free to start."
      />
    </div>
  );
}
