"use client";

import { CandidateProvider } from "@/src/context/CandidateContext";
import { SavedJobsProvider } from "@/src/context/SavedJobsContext";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <CandidateProvider>
      <SavedJobsProvider>{children}</SavedJobsProvider>
    </CandidateProvider>
  );
}
