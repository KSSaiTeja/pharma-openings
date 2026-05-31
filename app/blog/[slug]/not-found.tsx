import Link from "next/link";

import { PageTitleBanner } from "@/app/components/site/PageTitleBanner";

export default function BlogPostNotFound() {
  return (
    <>
      <PageTitleBanner
        title="Article not found"
        crumbs={[
          { label: "Home", href: "/" },
          { label: "Blog", href: "/blog" },
          { label: "Not found" },
        ]}
      />
      <section className="sidebar-page-container p_relative pt_110 pb_120">
        <div className="auto-container centred">
          <p>This article is not available on Pharma Openings.</p>
          <Link href="/blog" className="theme-btn btn-one mt_20">
            Back to blog
          </Link>
        </div>
      </section>
    </>
  );
}
