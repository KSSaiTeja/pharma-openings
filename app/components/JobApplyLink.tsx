"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { useCandidate } from "@/src/context/CandidateContext";
import { setPostAuthRedirect } from "@/src/lib/authSession";

const btnClass =
  "inline-flex items-center justify-center rounded-full bg-[var(--color-po-navy)] px-8 py-3 text-sm font-semibold text-white shadow-[0_10px_32px_rgba(30,27,54,0.22)] transition-[filter,transform] hover:brightness-110 active:translate-y-px active:brightness-95 disabled:cursor-not-allowed disabled:opacity-60";

type JobApplyLinkProps = {
  jobId: string;
};

export function JobApplyLink({ jobId }: JobApplyLinkProps) {
  const router = useRouter();
  const { isAuthenticated, loading } = useCandidate();

  if (loading) {
    return (
      <span
        className={`${btnClass} pointer-events-none`}
        aria-busy="true"
        aria-live="polite"
      >
        Apply now
      </span>
    );
  }

  if (!isAuthenticated) {
    return (
      <button
        type="button"
        className={btnClass}
        onClick={() => {
          setPostAuthRedirect(`/apply/${jobId}`);
          router.push("/register");
        }}
      >
        Apply now
      </button>
    );
  }

  return (
    <Link href={`/apply/${jobId}`} className={btnClass}>
      Apply now
    </Link>
  );
}
