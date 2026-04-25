"use client";

import { CandidateProvider } from "@/src/context/CandidateContext";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return <CandidateProvider>{children}</CandidateProvider>;
}
