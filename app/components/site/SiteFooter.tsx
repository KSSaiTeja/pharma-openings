import Link from "next/link";

import { CONTACT_SECTION } from "@/app/content/site";
import { NAV_SECTIONS } from "./navConfig";
import { siteAsset } from "./paths";
import { SiteNavLink } from "./SiteNavLink";

export function SiteFooter() {
  return (
    <footer className="main-footer">
      <div className="widget-section p_relative pt_80 pb_100">
        <div className="auto-container">
          <div className="row clearfix">
            <div className="col-lg-4 col-md-6 col-sm-12 footer-column">
              <div className="footer-widget logo-widget mr_30">
                <figure className="footer-logo mb_20">
                  <Link href="/">
                    <img src={siteAsset("images/logo.png")} alt="PharmaOpenings" />
                  </Link>
                </figure>
                <p>
                  PharmaOpenings connects pharma sector talent with global opportunities—from
                  discovery and clinical development to manufacturing and commercial roles.
                </p>
              </div>
            </div>
            <div className="col-lg-2 col-md-4 col-sm-12 footer-column">
              <div className="footer-widget links-widget">
                <div className="widget-title">
                  <h4>For candidates</h4>
                </div>
                <div className="widget-content">
                  <ul className="links-list clearfix">
                    <li>
                      <Link href="/jobs">Browse jobs</Link>
                    </li>
                    <li>
                      <Link href="/register">Create profile</Link>
                    </li>
                    <li>
                      <Link href="/login">Sign in</Link>
                    </li>
                    <li>
                      <Link href="/profile">My profile</Link>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="col-lg-3 col-md-4 col-sm-12 footer-column">
              <div className="footer-widget links-widget">
                <div className="widget-title">
                  <h4>Company</h4>
                </div>
                <div className="widget-content">
                  <ul className="links-list clearfix po-footer-section-links">
                    {NAV_SECTIONS.map((item) => (
                      <li key={item.id}>
                        <SiteNavLink href={item.href} label={item.label} className="po-footer-link" />
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
            <div className="col-lg-3 col-md-4 col-sm-12 footer-column">
              <div className="footer-widget links-widget">
                <div className="widget-title">
                  <h4>Support</h4>
                </div>
                <div className="widget-content">
                  <ul className="links-list clearfix">
                    <li>
                      <a href={`mailto:${CONTACT_SECTION.email}`}>Email us</a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <div className="auto-container">
          <div className="bottom-inner">
            <div className="copyright">
              <p>
                Copyright &copy; {new Date().getFullYear()}{" "}
                <Link href="/">PharmaOpenings</Link>. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
