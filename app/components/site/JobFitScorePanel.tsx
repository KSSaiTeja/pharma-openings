"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import {
  computeMockJobFitScore,
  jobFitPotentialScore,
  jobFitScoreLabel,
  type JobFitScoreJobInput,
} from "@/src/lib/jobFitScore.mock";
import { useCandidate } from "@/src/context/CandidateContext";
import { useJobFitScoresOptional } from "@/src/context/JobFitScoresContext";

type JobFitScorePanelProps = JobFitScoreJobInput;

const RING_RADIUS = 15;
const RING_CIRC = 2 * Math.PI * RING_RADIUS;

export function JobFitScorePanel({
  jobId,
  title,
  department,
  module,
  qualification,
  location,
  jobType,
  description,
}: JobFitScorePanelProps) {
  const { candidate, isAuthenticated, loading } = useCandidate();
  const fitScoresCtx = useJobFitScoresOptional();
  const [aiFit, setAiFit] = useState<ReturnType<typeof computeMockJobFitScore> | null>(null);

  const mockFit = useMemo(() => {
    if (!candidate) return null;
    return computeMockJobFitScore(
      { jobId, title, department, module, qualification, location, jobType, description },
      candidate,
    );
  }, [
    candidate,
    department,
    description,
    jobId,
    jobType,
    location,
    module,
    qualification,
    title,
  ]);

  useEffect(() => {
    if (fitScoresCtx?.enabled) {
      setAiFit(null);
      return;
    }

    if (!candidate || !isAuthenticated) {
      setAiFit(null);
      return;
    }

    const cacheKey = `po_job_fit:v2:${candidate.id}:${candidate.updated_at}:${jobId}`;
    if (typeof window !== "undefined") {
      const cachedRaw = window.sessionStorage.getItem(cacheKey);
      if (cachedRaw) {
        try {
          const parsed = JSON.parse(cachedRaw) as ReturnType<typeof computeMockJobFitScore>;
          if (parsed && typeof parsed.score === "number") {
            setAiFit(parsed);
          }
        } catch {
          // Ignore invalid cache.
        }
      }
    }

    const controller = new AbortController();

    const fetchAiFit = async () => {
      try {
        const response = await fetch("/api/ai/job-fit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            candidate: {
              id: candidate.id,
              profileVersion: candidate.updated_at,
              highestQualification: candidate.highest_qualification,
              currentDesignation: candidate.current_designation ?? candidate.designation_custom,
              currentDepartment: candidate.current_department ?? candidate.department_custom,
              currentSubDepartment:
                candidate.current_sub_department ?? candidate.sub_department_custom,
              currentCompany: candidate.current_company,
              preferredLocation: candidate.preferred_location,
              preferredModules: candidate.preferred_modules,
              noticePeriod: candidate.notice_period,
              hasResume: Boolean(candidate.resume_url),
            },
            job: {
              jobId,
              title,
              department,
              module,
              qualification,
              location,
              jobType,
              description,
            },
          }),
        });

        if (!response.ok) return;
        const data = (await response.json()) as ReturnType<typeof computeMockJobFitScore>;
        if (!data || typeof data.score !== "number" || !Array.isArray(data.improvements)) return;

        setAiFit(data);
        if (typeof window !== "undefined") {
          window.sessionStorage.setItem(cacheKey, JSON.stringify(data));
        }
      } catch {
        // Keep mock score on API/network errors.
      }
    };

    void fetchAiFit();
    return () => controller.abort();
  }, [
    candidate,
    department,
    description,
    fitScoresCtx?.enabled,
    isAuthenticated,
    jobId,
    jobType,
    location,
    module,
    qualification,
    title,
  ]);

  const fitFromBatch = fitScoresCtx?.getScore(jobId) ?? null;
  const fit = fitFromBatch ?? aiFit ?? mockFit;
  const potentialScore = useMemo(() => {
    if (!fit) return null;
    return jobFitPotentialScore(fit.score, fit.improvements);
  }, [fit]);

  if (loading || !isAuthenticated || !candidate || !fit || potentialScore == null) {
    return null;
  }

  const ringFill = (fit.score / 100) * RING_CIRC;

  return (
    <section
      className={`po-job-fit po-job-fit--${fit.tier}`}
      aria-label={`Profile fit score ${fit.score} percent for ${title}`}
    >
      <div className="po-job-fit__inner">
        <div className="po-job-fit__top">
          <div className="po-job-fit__score-group">
            <div className="po-job-fit__ring-wrap" aria-hidden>
              <svg className="po-job-fit__ring" viewBox="0 0 36 36">
                <circle className="po-job-fit__ring-bg" cx="18" cy="18" r={RING_RADIUS} />
                <circle
                  className="po-job-fit__ring-fill"
                  cx="18"
                  cy="18"
                  r={RING_RADIUS}
                  strokeDasharray={`${ringFill} ${RING_CIRC}`}
                  transform="rotate(-90 18 18)"
                />
              </svg>
              <span className="po-job-fit__ring-value">{fit.score}</span>
            </div>

            <div className="po-job-fit__copy">
              <p className="po-job-fit__title">
                {jobFitScoreLabel(fit.tier)}
                <span className="po-job-fit__title-sep" aria-hidden>
                  ·
                </span>
                <span className="po-job-fit__title-score">{fit.score}% fit</span>
              </p>
              <p className="po-job-fit__sub">
                Reach up to <strong>{potentialScore}%</strong> with profile updates
              </p>
            </div>
          </div>

          <Link href="/profile" className="po-job-fit__cta">
            Improve profile
            <ChevronRight size={18} strokeWidth={2.25} aria-hidden />
          </Link>
        </div>

        <ul className="po-job-fit__tips" aria-label="Top ways to improve your score">
          {fit.improvements.map((item) => (
            <li key={item.id} className="po-job-fit__tip">
              <span className="po-job-fit__tip-label">{item.title}</span>
              <span className="po-job-fit__tip-boost">+{item.pointsGain}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
