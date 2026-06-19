"use client";

import { createContext, useContext } from "react";

export interface ClientSession {
  id: string;
  name: string;
  email: string;
  employeeId: string;
  orgId: string;
  orgName: string;
  levelName: string; // the name of this user's hierarchy level (e.g. "Owner", "Agent")
  levelRank: number; // 1 = leaf … N = top
  seesAll: boolean; // top level → company-wide visibility
}

const SessionContext = createContext<ClientSession | null>(null);

export function SessionProvider({
  session,
  children,
}: {
  session: ClientSession;
  children: React.ReactNode;
}) {
  return <SessionContext.Provider value={session}>{children}</SessionContext.Provider>;
}

export function useSession(): ClientSession {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used inside SessionProvider");
  return ctx;
}
