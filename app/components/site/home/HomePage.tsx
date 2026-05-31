import Link from "next/link";

import { CONTACT_SECTION } from "@/app/content/site";
import { COVERAGE_AREAS } from "@/app/content/home";
import { JobListByFitScore } from "../JobListByFitScore";
import { CoverageAreaIcon } from "./CoverageAreaIcon";
import { HomeAboutIntro, HomeVisionMissionSection, HomeWhyChooseSection } from "./HomeAboutSection";
import { siteAsset } from "../paths";

import type { JobRow } from "@/types/database.types";

const HERO_AUTHORS = [
  { id: "author-1", label: "R&D", image: "images/resource/hero-author-1.jpg", size: 140 },
  { id: "author-2", label: "Clinical", image: "images/resource/hero-author-2.jpg", size: 110 },
  { id: "author-3", label: "QA", image: "images/resource/hero-author-3.jpg", size: 90 },
  { id: "author-4", label: "Regulatory", image: "images/resource/hero-author-4.jpg", size: 110 },
  { id: "author-5", label: "Mfg", image: "images/resource/hero-author-5.jpg", size: 90 },
  { id: "author-6", label: "Medical", image: "images/resource/hero-author-6.jpg", size: 140 },
] as const;

type HomePageProps = {
  homeJobs: JobRow[];
  homeJobsLoadError: boolean;
};

export function HomePage({ homeJobs, homeJobsLoadError }: HomePageProps) {
  const showJobs = !homeJobsLoadError && homeJobs.length > 0;

  return (
    <>
      <section className="banner-section po-hero p_relative centred">
        <div
          className="pattern-layer"
          style={{ backgroundImage: `url(${siteAsset("images/shape/shape-1.png")})` }}
        />
        <div className="author-box">
          {HERO_AUTHORS.map((person) => (
            <div key={person.id} className={`author ${person.id}`}>
              <div className="author-thumb">
                <img
                  src={siteAsset(person.image)}
                  alt={`Pharma professional — ${person.label}`}
                  width={person.size}
                  height={person.size}
                  loading="eager"
                  decoding="async"
                />
              </div>
              <span>{person.label}</span>
            </div>
          ))}
        </div>
        <div className="auto-container">
          <div className="content-box">
            <h1>Global opportunities for pharma sector employees</h1>
            <p>
              Explore curated roles from leading pharmaceutical employers—whether you are
              advancing your career or taking your first step into regulated industries.
            </p>
            <form method="get" action="/jobs" className="banner-search-form">
              <div className="form-group">
                <fieldset>
                  <input
                    type="search"
                    name="q"
                    className="form-control"
                    placeholder="Role, keyword, or company"
                  />
                  <input
                    type="text"
                    name="location"
                    className="form-control"
                    placeholder="City, state, or country"
                  />
                  <button type="submit" className="theme-btn btn-one">
                    <span>Search jobs</span>
                  </button>
                </fieldset>
              </div>
            </form>
          </div>
        </div>
      </section>

      <HomeAboutIntro />

      <div className="slide-text po-areas-ribbon">
        <div className="text-inner">
          <ul className="text-list">
            {[...COVERAGE_AREAS, ...COVERAGE_AREAS, ...COVERAGE_AREAS].map((label, i) => (
              <li key={`${label}-${i}`}>{label}</li>
            ))}
          </ul>
        </div>
      </div>

      <HomeWhyChooseSection />
      <HomeVisionMissionSection />

      <section className="category-section centred pt_120 pb_70">
        <div className="bg-box">
          <div
            className="bg-layer parallax-bg"
            data-parallax='{"y": 100}'
            style={{ backgroundImage: `url(${siteAsset("images/background/category-bg.jpg")})` }}
          />
        </div>
        <div className="auto-container">
          <div className="sec-title light pb_60 sec-title-animation animation-style2">
            <span className="sub-title mb_10 title-animation">Get started</span>
            <h2 className="title-animation">
              Find your next role <br />
              in pharma
            </h2>
          </div>
          <div className="row clearfix">
            <div className="col-lg-6 col-md-6 col-sm-12 category-block">
              <div className="category-block-one">
                <div className="inner-box">
                  <h2>For candidates</h2>
                  <p>
                    Browse active openings, save roles, and apply with a profile built for
                    regulated hiring.
                  </p>
                  <Link href="/jobs" className="theme-btn btn-one">
                    Find Opportunities
                  </Link>
                  <figure className="image-box image-hov-one">
                    <img src={siteAsset("images/resource/category-1.jpg")} alt="" />
                  </figure>
                </div>
              </div>
            </div>
            <div className="col-lg-6 col-md-6 col-sm-12 category-block">
              <div className="category-block-one">
                <div className="inner-box">
                  <h2>For hiring teams</h2>
                  <p>
                    Reach candidates who understand GxP, protocols, and cross-functional science.
                  </p>
                  <a href={`mailto:${CONTACT_SECTION.email}`} className="theme-btn btn-one">
                    Partner with us
                  </a>
                  <figure className="image-box image-hov-two">
                    <img src={siteAsset("images/resource/category-2.jpg")} alt="" />
                  </figure>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="industries-section po-areas-grid pt_20 pb_120">
        <div className="auto-container">
          <div className="sec-title centred pb_60 sec-title-animation animation-style2">
            <span className="sub-title mb_10 title-animation">Functions</span>
            <h2 className="title-animation">Areas we cover</h2>
          </div>
          <div className="inner-container po-areas-grid__inner">
            {COVERAGE_AREAS.map((title) => (
              <div key={title} className="industries-block-one">
                <div className="inner-box">
                  <div className="icon-box">
                    <CoverageAreaIcon area={title} />
                  </div>
                  <h3>
                    <Link href="/jobs">{title}</Link>
                  </h3>
                </div>
              </div>
            ))}
          </div>
          <div className="btn-box centred mt_60">
            <Link href="/jobs" className="theme-btn btn-one">
              View all jobs
            </Link>
          </div>
        </div>
      </section>

      <section id="featured-jobs" className="job-section po-featured-jobs pt_120 pb_90 scroll-mt-24">
        <div className="auto-container">
          <header className="po-featured-jobs__header sec-title-animation animation-style2">
            <p className="po-featured-jobs__eyebrow title-animation">Featured roles</p>
            <h2 className="po-featured-jobs__title title-animation">Latest openings</h2>
            <p className="po-featured-jobs__lead title-animation">
              Recently posted roles from PharmaOpenings — apply directly or view full details.
            </p>
          </header>
          {homeJobsLoadError ? (
            <p className="centred">
              We couldn&apos;t load live listings. Please try again or browse all jobs.
            </p>
          ) : null}
          {!homeJobsLoadError && homeJobs.length === 0 ? (
            <div className="centred pb_30">
              <p>No openings currently. Register your profile and we&apos;ll reach out.</p>
              <Link href="/register" className="theme-btn btn-one mt_20">
                Register profile
              </Link>
            </div>
          ) : null}
          {showJobs ? (
            <div className="po-featured-jobs__list">
              <JobListByFitScore jobs={homeJobs} />
            </div>
          ) : null}
          <div className="btn-box centred mt_40">
            <Link href="/jobs" className="theme-btn btn-one">
              Browse all jobs
            </Link>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="process-section pt_120 pb_90 scroll-mt-24">
        <div
          className="pattern-layer"
          style={{ backgroundImage: `url(${siteAsset("images/shape/shape-3.png")})` }}
        />
        <div className="auto-container">
          <div className="sec-title light centred pb_60 sec-title-animation animation-style2">
            <span className="sub-title mb_10 title-animation">Process</span>
            <h2 className="title-animation">How it works</h2>
          </div>
          <div className="tabs-box">
            <div className="tabs-content">
              <div className="tab active-tab" id="tab-1">
                <div className="row clearfix">
                  <div className="col-lg-4 col-md-6 col-sm-12 processing-block">
                    <div className="processing-block-one">
                      <div className="inner-box">
                        <span className="count-text">1</span>
                        <h3>
                          <Link href="/register">Create your profile</Link>
                        </h3>
                        <p>Register with your mobile number and build a compliance-ready dossier.</p>
                      </div>
                    </div>
                  </div>
                  <div className="col-lg-4 col-md-6 col-sm-12 processing-block">
                    <div className="processing-block-one">
                      <div className="inner-box">
                        <span className="count-text">2</span>
                        <h3>
                          <Link href="/jobs">Explore openings</Link>
                        </h3>
                        <p>Search and filter roles across departments, locations, and role types.</p>
                      </div>
                    </div>
                  </div>
                  <div className="col-lg-4 col-md-6 col-sm-12 processing-block">
                    <div className="processing-block-one">
                      <div className="inner-box">
                        <span className="count-text">3</span>
                        <h3>
                          <Link href="/login">Apply with OTP</Link>
                        </h3>
                        <p>Sign in securely and submit applications in a structured flow.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="contact" className="subscribe-section pt_100 pb_100 centred scroll-mt-24">
        <div
          className="bg-layer parallax-bg"
          data-parallax='{"y": 100}'
          style={{ backgroundImage: `url(${siteAsset("images/background/subscribe-bg.jpg")})` }}
        />
        <div className="auto-container">
          <div className="content-box">
            <h2>Let&apos;s start a conversation</h2>
            <p>{CONTACT_SECTION.body}</p>
            <div className="btn-box mt_30">
              <a href={`mailto:${CONTACT_SECTION.email}`} className="theme-btn btn-one">
                {CONTACT_SECTION.email}
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
