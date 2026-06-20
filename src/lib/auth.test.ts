import { describe, it, expect, beforeAll } from "vitest";
import { signSession, verifySessionToken, type SessionPayload } from "./auth";

/**
 * Auth tokens carry the tenant (`orgId`) and the caller's position in the
 * hierarchy. A forged or tampered token must never verify — otherwise the
 * whole RBAC layer downstream is trusting a lie.
 */

const SECRET = "test-secret-at-least-16-chars-long";

beforeAll(() => {
  process.env.JWT_SECRET = SECRET;
});

const payload: SessionPayload = {
  sub: "user-123",
  name: "Ada",
  employeeId: "EMP-0007",
  orgId: "org-A",
  levelRank: 3,
  seesAll: false,
};

describe("signSession / verifySessionToken round-trip", () => {
  it("preserves every claim through sign → verify", async () => {
    const token = await signSession(payload);
    const out = await verifySessionToken(token);
    expect(out).toEqual(payload);
  });

  it("rejects a tampered token", async () => {
    const token = await signSession(payload);
    const tampered = token.slice(0, -3) + "xyz";
    expect(await verifySessionToken(tampered)).toBeNull();
  });

  it("rejects garbage", async () => {
    expect(await verifySessionToken("not.a.jwt")).toBeNull();
    expect(await verifySessionToken("")).toBeNull();
  });

  it("rejects a token signed with a different secret", async () => {
    const token = await signSession(payload);
    process.env.JWT_SECRET = "a-completely-different-secret-key";
    const out = await verifySessionToken(token);
    process.env.JWT_SECRET = SECRET; // restore
    expect(out).toBeNull();
  });
});

describe("secret validation", () => {
  it("refuses to sign when JWT_SECRET is too short", async () => {
    process.env.JWT_SECRET = "short";
    await expect(signSession(payload)).rejects.toThrow(/JWT_SECRET/);
    process.env.JWT_SECRET = SECRET; // restore
  });

  it("refuses the shipped dev secret in production", async () => {
    const prevEnv = process.env.NODE_ENV;
    process.env.JWT_SECRET = "dev-only-secret-do-not-use";
    // NODE_ENV is read-only in @types/node; assign through a cast.
    (process.env as Record<string, string>).NODE_ENV = "production";
    await expect(signSession(payload)).rejects.toThrow(/dev default/);
    (process.env as Record<string, string>).NODE_ENV = prevEnv ?? "test";
    process.env.JWT_SECRET = SECRET; // restore
  });
});
