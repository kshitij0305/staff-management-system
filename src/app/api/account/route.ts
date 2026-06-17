import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { logActivity } from "@/features/activity/log";

const accountSchema = z
  .object({
    name: z.string().trim().min(2).max(80).optional(),
    phone: z
      .string()
      .trim()
      .regex(/^[0-9+\-\s]{8,15}$/, "Enter a valid phone number")
      .optional(),
    city: z.string().trim().max(60).optional().or(z.literal("")),
    state: z.string().trim().max(60).optional().or(z.literal("")),
    currentPassword: z.string().optional(),
    newPassword: z.string().min(8, "New password must be at least 8 characters").max(72).optional(),
  })
  .refine((d) => !d.newPassword || !!d.currentPassword, {
    message: "Enter your current password to set a new one",
    path: ["currentPassword"],
  });

/** Self-service profile + password update for the signed-in user. */
export async function PATCH(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = accountSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }
  const input = parsed.data;

  const user = await prisma.user.findUnique({ where: { id: session.sub } });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const data: Prisma.UserUpdateInput = {};
  if (input.name) data.name = input.name;
  if (input.phone) data.phone = input.phone;
  if (input.city !== undefined) data.city = input.city || null;
  if (input.state !== undefined) data.state = input.state || null;

  if (input.newPassword) {
    const ok = await bcrypt.compare(input.currentPassword!, user.passwordHash);
    if (!ok) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
    }
    data.passwordHash = await bcrypt.hash(input.newPassword, 10);
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  await prisma.user.update({ where: { id: user.id }, data });
  await logActivity({
    actorId: user.id,
    action: "EMPLOYEE_UPDATED",
    targetType: "USER",
    targetId: user.id,
    summary: input.newPassword ? "updated their account & password" : "updated their account",
  });

  return NextResponse.json({ ok: true });
}
