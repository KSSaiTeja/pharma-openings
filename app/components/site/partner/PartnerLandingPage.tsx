import Link from "next/link";
import {
  Activity,
  Award,
  BadgeCheck,
  Building2,
  Clock,
  Dna,
  FlaskConical,
  Headphones,
  IndianRupee,
  Lock,
  MapPin,
  Microscope,
  Pill,
  Target,
  Truck,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react";

import {
  PARTNER_BENEFITS,
  PARTNER_FORM,
  PARTNER_HERO,
  PARTNER_PROMO,
  PARTNER_STATS,
  PARTNER_STEPS,
  PARTNER_TESTIMONIAL,
  PARTNER_TRUST,
  PARTNER_WHO_TAGS,
} from "@/app/content/partner";
import { siteAsset } from "../paths";
import { PartnerForm } from "./PartnerForm";

const BENEFIT_ICONS: Record<(typeof PARTNER_BENEFITS)[number]["icon"], LucideIcon> = {
  rupee: IndianRupee,
  users: Users,
  target: Target,
  bolt: Zap,
  map: MapPin,
  award: Award,
};

const WHO_ICONS: Record<(typeof PARTNER_WHO_TAGS)[number]["icon"], LucideIcon> = {
  pill: Pill,
  flask: FlaskConical,
  dna: Dna,
  activity: Activity,
  hospital: Building2,
  truck: Truck,
  microscope: Microscope,
  certificate: BadgeCheck,
};

const TRUST_ICONS: Record<(typeof PARTNER_TRUST)[number]["icon"], LucideIcon> = {
  lock: Lock,
  rupee: IndianRupee,
  clock: Clock,
  headset: Headphones,
};

export function PartnerLandingPage() {
  return (
    <main className="po-partner-page" id="main-content">
      <section
        className="about-section po-partner-hero po-partner-section po-partner-section--hero"
        aria-labelledby="partner-hero-heading"
      >
        <div
          className="pattern-layer"
          style={{ backgroundImage: `url(${siteAsset("images/shape/shape-2.png")})` }}
          aria-hidden
        />
        <div className="auto-container">
          <div className="row align-items-center clearfix">
            <div className="col-lg-6 col-md-12 col-sm-12 content-column">
              <div className="content_block_one">
                <div className="content-box po-partner-hero__content">
                  <div className="sec-title pb_20 sec-title-animation animation-style2">
                    <span className="sub-title mb_10 title-animation">{PARTNER_PROMO.eyebrow}</span>
                    <h1
                      id="partner-hero-heading"
                      className="title-animation po-partner-hero__title"
                    >
                      {PARTNER_HERO.title}
                    </h1>
                  </div>
                  <div className="text-box">
                    <p>{PARTNER_HERO.lead}</p>
                    <aside className="po-partner-hero__value" aria-label="Partnership offer summary">
                      <p className="po-partner-hero__value-headline">
                        <strong>
                          {PARTNER_PROMO.title}{" "}
                          <span>{PARTNER_PROMO.titleEmphasis}</span> {PARTNER_PROMO.titleSuffix}
                        </strong>
                      </p>
                      <p className="po-partner-hero__value-detail">{PARTNER_PROMO.lead}</p>
                    </aside>
                  </div>
                  <div className="po-partner-hero__actions mt_30">
                    <a href="#partner-form" className="theme-btn btn-one">
                      {PARTNER_HERO.cta}
                    </a>
                    <Link href="/contact" className="theme-btn btn-two">
                      Talk to our team
                    </Link>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-lg-6 col-md-12 col-sm-12 video-column">
              <figure className="po-partner-hero__visual">
                <img
                  src={siteAsset(PARTNER_HERO.image)}
                  alt="Illustration of pharma hiring teams connecting with GxP-ready candidates"
                  width={640}
                  height={420}
                  loading="eager"
                  decoding="async"
                />
              </figure>
            </div>
          </div>
        </div>
      </section>

      <section
        className="funfact-section alternat-2 po-partner-stats po-partner-section"
        aria-labelledby="partner-stats-heading"
      >
        <div className="auto-container">
          <h2 id="partner-stats-heading" className="sr-only">
            Partnership highlights
          </h2>
          <ul className="row clearfix po-partner-stats__list">
            {PARTNER_STATS.map((stat) => (
              <li key={stat.label} className="col-lg-4 col-md-6 col-sm-12 funfact-block">
                <div className="funfact-block-one">
                  <div className="inner-box">
                    <p className="count-outer">{stat.value}</p>
                    <p>{stat.label}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section
        className="chooseus-section po-partner-benefits po-partner-section"
        aria-labelledby="partner-benefits-heading"
      >
        <div
          className="pattern-layer"
          style={{ backgroundImage: `url(${siteAsset("images/shape/shape-2.png")})` }}
          aria-hidden
        />
        <div className="auto-container">
          <div className="sec-title centred pb_60 sec-title-animation animation-style2">
            <span className="sub-title mb_10 title-animation">Why partner with us</span>
            <h2 id="partner-benefits-heading" className="title-animation">
              Everything your HR team needs,
              <br />
              at no cost
            </h2>
          </div>
          <ul className="row clearfix po-partner-benefits__list">
            {PARTNER_BENEFITS.map((item) => {
              const Icon = BENEFIT_ICONS[item.icon];
              return (
                <li key={item.title} className="col-lg-4 col-md-6 col-sm-12 chooseus-block">
                  <article className="chooseus-block-one">
                    <div className="inner-box">
                      <div className="icon-box po-partner-benefit-icon" aria-hidden>
                        <Icon size={36} strokeWidth={1.75} />
                      </div>
                      <h3>{item.title}</h3>
                      <p>{item.body}</p>
                    </div>
                  </article>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <section
        className="process-section po-partner-process po-partner-section"
        aria-labelledby="partner-process-heading"
      >
        <div
          className="pattern-layer"
          style={{ backgroundImage: `url(${siteAsset("images/shape/shape-3.png")})` }}
          aria-hidden
        />
        <div className="auto-container">
          <div className="sec-title light centred pb_60 sec-title-animation animation-style2">
            <span className="sub-title mb_10 title-animation">Process</span>
            <h2 id="partner-process-heading" className="title-animation">
              3 steps to your first applicant
            </h2>
          </div>
          <ol className="row clearfix po-partner-process__list">
            {PARTNER_STEPS.map((step, index) => (
              <li key={step.title} className="col-lg-4 col-md-6 col-sm-12 processing-block">
                <article className="processing-block-one po-partner-step">
                  <div className="inner-box">
                    <span className="count-text" aria-hidden>
                      {index + 1}
                    </span>
                    <h3>{step.title}</h3>
                    <p>{step.body}</p>
                  </div>
                </article>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section
        className="po-partner-audience po-partner-section"
        aria-labelledby="partner-audience-heading"
      >
        <div className="auto-container">
          <div className="sec-title centred pb_60 sec-title-animation animation-style2">
            <span className="sub-title mb_10 title-animation">Who this is for</span>
            <h2 id="partner-audience-heading" className="title-animation">
              Companies across the pharma value chain
            </h2>
          </div>
          <ul className="po-partner-audience__grid">
            {PARTNER_WHO_TAGS.map((tag) => {
              const Icon = WHO_ICONS[tag.icon];
              return (
                <li key={tag.label}>
                  <article className="po-partner-audience__card">
                    <div className="po-partner-audience__icon" aria-hidden>
                      <Icon size={28} strokeWidth={1.75} />
                    </div>
                    <h3>{tag.label}</h3>
                  </article>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <section
        className="subscribe-section po-partner-quote po-partner-section centred"
        aria-labelledby="partner-quote-heading"
      >
        <div
          className="bg-layer parallax-bg"
          data-parallax='{"y": 100}'
          style={{ backgroundImage: `url(${siteAsset("images/background/subscribe-bg.jpg")})` }}
          aria-hidden
        />
        <div className="auto-container">
          <figure className="content-box po-partner-quote__box">
            <span className="po-partner-quote__mark" aria-hidden>
              &ldquo;
            </span>
            <blockquote>
              <p id="partner-quote-heading" className="po-partner-quote__text">
                {PARTNER_TESTIMONIAL.quote}
              </p>
            </blockquote>
            <figcaption className="po-partner-quote__author">
              <cite>{PARTNER_TESTIMONIAL.name}</cite>
              <span>{PARTNER_TESTIMONIAL.role}</span>
            </figcaption>
          </figure>
        </div>
      </section>

      <section
        id="partner-form"
        className="contact-section po-partner-contact po-partner-section po-partner-section--form scroll-mt-24"
        aria-labelledby="partner-form-heading"
      >
        <div className="auto-container">
          <div className="sec-title centred po-partner-contact__header sec-title-animation animation-style2">
            <span className="sub-title mb_10 title-animation">Get started</span>
            <h2 id="partner-form-heading" className="title-animation">
              {PARTNER_FORM.title}
            </h2>
            <p className="po-partner-contact__lead title-animation">{PARTNER_FORM.lead}</p>
          </div>
          <div className="inner-container po-partner-contact__panel">
            <div className="row clearfix po-partner-contact__row">
              <div className="col-lg-5 col-md-12 col-sm-12 po-partner-contact__col-aside">
                <aside className="info-box po-partner-contact__aside" aria-label="Partnership benefits">
                  <h3>Why employers choose us</h3>
                  <ul className="po-partner-contact__trust-list">
                    {PARTNER_TRUST.map((item) => {
                      const Icon = TRUST_ICONS[item.icon];
                      return (
                        <li key={item.label} className="po-partner-contact__trust-item">
                          <span className="po-partner-contact__trust-icon" aria-hidden>
                            <Icon size={22} strokeWidth={1.75} />
                          </span>
                          <span className="po-partner-contact__trust-label">{item.label}</span>
                        </li>
                      );
                    })}
                  </ul>
                </aside>
              </div>
              <div className="col-lg-7 col-md-12 col-sm-12 po-partner-contact__col-form">
                <PartnerForm />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        className="category-section po-partner-cta po-partner-section centred"
        aria-labelledby="partner-cta-heading"
      >
        <div className="auto-container">
          <div className="sec-title pb_30 sec-title-animation animation-style2">
            <span className="sub-title mb_10 title-animation">Candidates</span>
            <h2 id="partner-cta-heading" className="title-animation">
              Hiring and job search, one platform
            </h2>
            <p className="po-partner-cta__lead">
              Browse how candidates discover roles, or return to the homepage.
            </p>
          </div>
          <div className="btn-box centred po-partner-cta__actions">
            <Link href="/jobs" className="theme-btn btn-one">
              View open roles
            </Link>
            <Link href="/" className="theme-btn btn-two">
              Back to home
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
