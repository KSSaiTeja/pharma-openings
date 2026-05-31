import Link from "next/link";
import { Check } from "lucide-react";

import { ABOUT_SECTION } from "@/app/content/home";
import { siteAsset } from "../paths";

export function HomeAboutIntro() {
  return (
    <section id="about" className="about-section po-about-intro pt_120 pb_90 scroll-mt-24">
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
              <div className="content-box ml_80 po-about-intro__content">
                <div className="sec-title pb_20 sec-title-animation animation-style2">
                  <span className="sub-title mb_10 title-animation">{ABOUT_SECTION.eyebrow}</span>
                  <h2 className="title-animation po-about-intro__title">
                    {ABOUT_SECTION.titleLead} <span>{ABOUT_SECTION.titleHighlight}</span>
                  </h2>
                </div>
                <div className="text-box">
                  {ABOUT_SECTION.paragraphs.map((paragraph) => (
                    <p key={paragraph.slice(0, 48)}>{paragraph}</p>
                  ))}
                </div>
                <div className="po-about-intro__actions mt_30">
                  <Link href="/jobs" className="theme-btn btn-one">
                    Browse openings
                  </Link>
                  <Link href="/register" className="theme-btn btn-two">
                    Create profile
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function HomeWhyChooseSection() {
  return (
    <section id="why-us" className="chooseus-section po-about-why pt_120 pb_90 scroll-mt-24">
      <div
        className="pattern-layer"
        style={{ backgroundImage: `url(${siteAsset("images/shape/shape-2.png")})` }}
      />
      <div className="auto-container">
        <div className="sec-title centred pb_50 sec-title-animation animation-style2">
          <span className="sub-title mb_10 title-animation">{ABOUT_SECTION.whyChooseEyebrow}</span>
          <h2 className="title-animation">{ABOUT_SECTION.whyChooseTitle}</h2>
        </div>
        <div className="po-about-why__grid">
          {ABOUT_SECTION.whyChoosePoints.map((point) => (
            <article key={point} className="po-about-why-card">
              <span className="po-about-why-card__icon" aria-hidden>
                <Check className="po-about-why-card__check" strokeWidth={2.5} />
              </span>
              <p className="po-about-why-card__text">{point}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function HomeVisionMissionSection() {
  return (
    <section id="vision-mission" className="po-vision-mission-section pt_90 pb_120 scroll-mt-24">
      <div className="auto-container">
        <div className="row clearfix">
          <div className="col-lg-6 col-md-12 col-sm-12 po-vision-mission-section__col">
            <article className="po-vision-mission-card">
              <span className="po-vision-mission-card__eyebrow">Vision</span>
              <h3>{ABOUT_SECTION.vision.title}</h3>
              <p>{ABOUT_SECTION.vision.body}</p>
            </article>
          </div>
          <div className="col-lg-6 col-md-12 col-sm-12 po-vision-mission-section__col">
            <article className="po-vision-mission-card">
              <span className="po-vision-mission-card__eyebrow">Mission</span>
              <h3>{ABOUT_SECTION.mission.title}</h3>
              <p>{ABOUT_SECTION.mission.body}</p>
            </article>
          </div>
        </div>
      </div>
    </section>
  );
}
