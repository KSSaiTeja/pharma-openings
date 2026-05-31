import Link from "next/link";

import { CONTACT_SECTION } from "@/app/content/site";
import { JobListByFitScore } from "../JobListByFitScore";
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

const PHARMA_SLIDE = [
  "Research & development",
  "Clinical operations",
  "Regulatory affairs",
  "Quality & GMP",
  "Manufacturing",
  "Medical affairs",
  "Commercial",
  "Pharmacovigilance",
];

const INDUSTRIES = [
  { icon: "icon-9", title: "R&D", count: "Discovery" },
  { icon: "icon-10", title: "Clinical", count: "Trials" },
  { icon: "icon-11", title: "Regulatory", count: "Submissions" },
  { icon: "icon-12", title: "Quality", count: "GMP" },
  { icon: "icon-13", title: "Manufacturing", count: "Production" },
  { icon: "icon-14", title: "Medical", count: "Affairs" },
  { icon: "icon-15", title: "Commercial", count: "Launch" },
  { icon: "icon-16", title: "PV", count: "Safety" },
];

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
            <h2>Global opportunities for pharma sector employees</h2>
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

      <section id="about" className="about-section pt_120 pb_120 scroll-mt-24">
        <div className="auto-container">
          <div className="row align-items-center">
            <div className="col-lg-6 col-md-12 col-sm-12 video-column">
              <div className="po-about-visual">
                <div className="po-about-visual__accent po-about-visual__accent--tl">
                  <img
                    src={siteAsset("images/resource/about-accent-1.jpg")}
                    alt=""
                    width={140}
                    height={100}
                    loading="lazy"
                    decoding="async"
                  />
                  <span className="po-about-visual__tag">Research</span>
                </div>
                <div className="po-about-visual__accent po-about-visual__accent--br">
                  <img
                    src={siteAsset("images/resource/about-accent-2.jpg")}
                    alt=""
                    width={140}
                    height={100}
                    loading="lazy"
                    decoding="async"
                  />
                  <span className="po-about-visual__tag">Quality</span>
                </div>
                <figure className="po-about-visual__main">
                  <img
                    src={siteAsset("images/resource/video-1.jpg")}
                    alt="Pharmaceutical research and development professionals"
                    width={520}
                    height={400}
                    loading="lazy"
                    decoding="async"
                  />
                </figure>
              </div>
            </div>
            <div className="col-lg-6 col-md-12 col-sm-12 content-column">
              <div className="content_block_one">
                <div className="content-box ml_80">
                  <div className="sec-title pb_20 sec-title-animation animation-style2">
                    <span className="sub-title mb_10 title-animation">About us</span>
                    <h2 className="title-animation">
                      A focused platform for <span>pharmaceutical talent</span>
                    </h2>
                  </div>
                  <div className="text-box">
                    <p>
                      PharmaOpenings connects exceptional people with organizations advancing
                      therapies and standards of care—from discovery labs to commercial launch.
                    </p>
                    <ul className="list-style-one clearfix">
                      <li>Curated roles across research, clinical, regulatory, and commercial</li>
                      <li>Profiles built for compliance-ready hiring in regulated industries</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="slide-text">
        <div className="text-inner">
          <ul className="text-list">
            {[...PHARMA_SLIDE, ...PHARMA_SLIDE, ...PHARMA_SLIDE].map((label, i) => (
              <li key={`${label}-${i}`}>{label}</li>
            ))}
          </ul>
        </div>
      </div>

      <section className="chooseus-section pt_200 pb_90">
        <div
          className="pattern-layer"
          style={{ backgroundImage: `url(${siteAsset("images/shape/shape-2.png")})` }}
        />
        <div className="auto-container">
          <div className="sec-title centred pb_60 sec-title-animation animation-style2">
            <span className="sub-title mb_10 title-animation">Why us</span>
            <h2 className="title-animation">Why choose PharmaOpenings</h2>
          </div>
          <div className="inner-container">
            <div className="row clearfix">
              <div className="col-lg-4 col-md-6 col-sm-12 chooseus-block">
                <div className="chooseus-block-one">
                  <div className="inner-box">
                    <div className="icon-box">
                      <i className="icon-4" />
                    </div>
                    <h3>
                      <Link href="/jobs">Curated opportunities</Link>
                    </h3>
                    <p>Roles refreshed for relevance across therapeutic and functional areas.</p>
                    <div className="link">
                      <Link href="/jobs">
                        Browse jobs
                        <i className="icon-7" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-lg-4 col-md-6 col-sm-12 chooseus-block">
                <div className="chooseus-block-one">
                  <div className="inner-box">
                    <div className="icon-box">
                      <i className="icon-5" />
                    </div>
                    <h3>
                      <Link href="/register">Compliance-ready profiles</Link>
                    </h3>
                    <p>Education, experience, and documents organized the way pharma teams expect.</p>
                    <div className="link">
                      <Link href="/register">
                        Get started
                        <i className="icon-7" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-lg-4 col-md-6 col-sm-12 chooseus-block">
                <div className="chooseus-block-one">
                  <div className="inner-box">
                    <div className="icon-box">
                      <i className="icon-6" />
                    </div>
                    <h3>
                      <Link href="/login">Simple applications</Link>
                    </h3>
                    <p>Sign in with mobile OTP and apply in a clear, structured flow.</p>
                    <div className="link">
                      <Link href="/login">
                        Sign in
                        <i className="icon-7" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

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
                    Find work
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

      <section className="industries-section pt_20 pb_120">
        <div className="auto-container">
          <div className="sec-title centred pb_60 sec-title-animation animation-style2">
            <span className="sub-title mb_10 title-animation">Functions</span>
            <h2 className="title-animation">Areas we cover</h2>
          </div>
          <div className="inner-container clearfix">
            {INDUSTRIES.map((item) => (
              <div key={item.title} className="industries-block-one">
                <div className="inner-box">
                  <div className="icon-box">
                    <i className={item.icon} />
                  </div>
                  <h3>
                    <Link href="/jobs">{item.title}</Link>
                  </h3>
                  <p>{item.count}</p>
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
            <p className="mt_20">{CONTACT_SECTION.footnote}</p>
          </div>
        </div>
      </section>
    </>
  );
}
