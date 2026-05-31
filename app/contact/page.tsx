import type { Metadata } from "next";

import { PageTitleBanner } from "@/app/components/site/PageTitleBanner";
import { siteAsset } from "@/app/components/site/paths";
import { CONTACT_MAPS, CONTACT_SECTION, FOOTER_OFFICES, SOCIAL_LINKS } from "@/app/content/site";
import { getWhatsAppChatUrl } from "@/src/lib/whatsapp";
import { buildPageMetadata, pageTitle } from "@/src/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: pageTitle("Contact Pharma Openings"),
  description:
    "Contact Pharma Openings for candidate support, employer partnerships, and pharmaceutical job listings. Offices in Pune, India and Stuttgart, Germany.",
  path: "/contact",
  keywords: [
    "contact pharma openings",
    "pharmaceutical recruitment contact",
    "pharma jobs support",
    "Pharma Openings Pune",
  ],
});

export default function ContactPage() {
  const [indiaOffice, europeOffice] = FOOTER_OFFICES;

  return (
    <>
      <PageTitleBanner
        title="Contact us"
        crumbs={[
          { label: "Home", href: "/" },
          { label: "Contact us" },
        ]}
      />

      <section className="contact-section pt_110 pb_30">
        <div className="auto-container">
          <div className="inner-container po-contact-inner">
            <div className="info-box po-contact-info-full">
              <h3>Contact information</h3>
              <p className="po-contact-intro">{CONTACT_SECTION.intro}</p>

              <div className="row clearfix po-contact-info-grid">
                <div className="col-lg-6 col-md-12 col-sm-12">
                  <div className="single-item">
                    <div className="icon-box">
                      <img src={siteAsset("images/icons/icon-27.png")} alt="" aria-hidden />
                    </div>
                    <h4>{indiaOffice.region} office</h4>
                    <p>
                      {indiaOffice.lines.map((line) => (
                        <span key={line}>
                          {line}
                          <br />
                        </span>
                      ))}
                    </p>
                  </div>
                </div>

                <div className="col-lg-6 col-md-12 col-sm-12">
                  <div className="single-item">
                    <div className="icon-box">
                      <img src={siteAsset("images/icons/icon-27.png")} alt="" aria-hidden />
                    </div>
                    <h4>{europeOffice.region} office</h4>
                    <p>
                      {europeOffice.lines.map((line) => (
                        <span key={line}>
                          {line}
                          <br />
                        </span>
                      ))}
                    </p>
                  </div>
                </div>

                <div className="col-lg-6 col-md-12 col-sm-12">
                  <div className="single-item">
                    <div className="icon-box">
                      <img src={siteAsset("images/icons/icon-28.png")} alt="" aria-hidden />
                    </div>
                    <h4>Email</h4>
                    <p>
                      <a href={`mailto:${CONTACT_SECTION.email}`}>{CONTACT_SECTION.email}</a>
                    </p>
                  </div>
                </div>

                <div className="col-lg-6 col-md-12 col-sm-12">
                  <div className="single-item">
                    <div className="icon-box">
                      <img src={siteAsset("images/icons/icon-29.png")} alt="" aria-hidden />
                    </div>
                    <h4>Phone & WhatsApp</h4>
                    <p>
                      <a href={`tel:${CONTACT_SECTION.phoneTel}`}>{CONTACT_SECTION.phone}</a>
                      <br />
                      <a href={getWhatsAppChatUrl()} target="_blank" rel="noopener noreferrer">
                        Chat on WhatsApp
                      </a>
                    </p>
                  </div>
                </div>

                <div className="col-lg-12 col-md-12 col-sm-12">
                  <div className="single-item po-contact-social">
                    <h4>Follow Pharma Openings</h4>
                    <ul className="social-links clearfix po-contact-social__links">
                      {SOCIAL_LINKS.map((item) => (
                        <li key={item.label}>
                          <a
                            href={item.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={item.label}
                          >
                            <i className={item.icon} aria-hidden />
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="google-map pb_80 po-contact-maps">
        <div className="auto-container">
          <div className="row clearfix">
            <div className="col-lg-6 col-md-12 col-sm-12 po-contact-maps__col">
              <div className="inner-container">
                <h3 className="po-contact-maps__title">{indiaOffice.region}</h3>
                <iframe
                  title="Pharma Openings India office map"
                  src={CONTACT_MAPS.india}
                  width="100%"
                  height="420"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                />
              </div>
            </div>
            <div className="col-lg-6 col-md-12 col-sm-12 po-contact-maps__col">
              <div className="inner-container">
                <h3 className="po-contact-maps__title">{europeOffice.region}</h3>
                <iframe
                  title="Pharma Openings Europe office map"
                  src={CONTACT_MAPS.europe}
                  width="100%"
                  height="420"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="subscribe-section pt_100 pb_100 centred">
        <div
          className="bg-layer parallax-bg"
          data-parallax='{"y": 100}'
          style={{ backgroundImage: `url(${siteAsset("images/background/subscribe-bg.jpg")})` }}
        />
        <div className="auto-container">
          <div className="content-box">
            <h2>{CONTACT_SECTION.title}</h2>
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
