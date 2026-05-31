"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { useCandidate } from "@/src/context/CandidateContext";
import { setPostAuthRedirect } from "@/src/lib/authSession";

const defaultBtnClass =
  "theme-btn btn-one inline-flex items-center justify-center disabled:cursor-not-allowed disabled:opacity-60";

type JobApplyLinkProps = {
  jobId: string;
  className?: string;
};

export function JobApplyLink({ jobId, className }: JobApplyLinkProps) {
  const btnClass = className ?? defaultBtnClass;
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
