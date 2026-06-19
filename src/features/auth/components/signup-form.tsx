"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SignupForm() {
  const router = useRouter();
  const [form, setForm] = useState({ orgName: "", name: "", email: "", password: "", confirm: "" });
  const [loading, setLoading] = useState(false);

  function set<K extends keyof typeof form>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function submit(e?: React.FormEvent) {
    e?.preventDefault();
    if (loading) return;
    if (form.password !== form.confirm) {
      toast.error("Passwords don't match");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, email: form.email.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Could not create your workspace");
        return;
      }
      toast.success("Workspace created — let's set up your hierarchy");
      router.push("/onboarding");
      router.refresh();
    } catch {
      toast.error("Could not reach the server. Try again.");
    } finally {
      setLoading(false);
    }
  }

  const canSubmit =
    form.orgName.trim().length >= 2 &&
    form.name.trim().length >= 2 &&
    form.email.includes("@") &&
    form.password.length >= 8 &&
    form.password === form.confirm;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="w-full max-w-sm"
    >
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="su-org">Company name</Label>
          <Input id="su-org" value={form.orgName} onChange={(e) => set("orgName", e.target.value)} placeholder="Acme Inc." required className="h-10" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="su-name">Your name</Label>
          <Input id="su-name" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Jordan Lee" required className="h-10" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="su-email">Work email</Label>
          <Input id="su-email" type="email" autoComplete="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="you@acme.com" required className="h-10" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="su-pass">Password</Label>
          <Input id="su-pass" type="password" autoComplete="new-password" value={form.password} onChange={(e) => set("password", e.target.value)} placeholder="min 8 characters" required className="h-10" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="su-confirm">Confirm password</Label>
          <Input id="su-confirm" type="password" autoComplete="new-password" value={form.confirm} onChange={(e) => set("confirm", e.target.value)} placeholder="re-enter password" required className="h-10" />
          {form.confirm.length > 0 && form.confirm !== form.password && (
            <p className="text-xs text-destructive">Passwords don&apos;t match</p>
          )}
        </div>
        <Button type="submit" size="lg" className="w-full" disabled={!canSubmit || loading}>
          {loading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
          Create workspace
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-foreground hover:text-primary">
          Sign in
        </Link>
      </p>
    </motion.div>
  );
}
