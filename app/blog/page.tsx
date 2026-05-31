import type { Metadata } from "next";
import Link from "next/link";

import { BlogCard } from "@/app/components/site/blog/BlogCard";
import { BlogSidebar } from "@/app/components/site/blog/BlogSidebar";
import { PageTitleBanner } from "@/app/components/site/PageTitleBanner";
import {
  fetchPublishedBlogPosts,
  filterBlogPostsFromList,
} from "@/src/lib/blog";
import { buildPageMetadata, pageTitle } from "@/src/lib/seo";

export const revalidate = 3600;
export const dynamic = "force-dynamic";

export const metadata: Metadata = buildPageMetadata({
  title: pageTitle("Pharma Careers Blog"),
  description:
    "Insights on pharmaceutical careers, GMP hiring, QA, QC, regulatory affairs, clinical research, and job search advice from Pharma Openings.",
  path: "/blog",
  keywords: [
    "pharma careers blog",
    "pharmaceutical job advice",
    "GMP hiring tips",
    "pharma QA careers",
    "life sciences careers India",
  ],
});

type BlogPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function readParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const params = searchParams ? await searchParams : {};
  const query = readParam(params.q);
  const category = readParam(params.category);
  const tag = readParam(params.tag);
  const allPosts = await fetchPublishedBlogPosts();
  const posts = filterBlogPostsFromList(allPosts, { query, category, tag });

  return (
    <>
      <PageTitleBanner
        title="Blog"
        crumbs={[
          { label: "Home", href: "/" },
          { label: "Blog" },
        ]}
      />

      <section className="sidebar-page-container p_relative pt_110 pb_120">
        <div className="auto-container">
          <div className="row clearfix">
            <div className="col-lg-4 col-md-12 col-sm-12 sidebar-side">
              <BlogSidebar posts={allPosts} activeCategory={category} activeTag={tag} />
            </div>
            <div className="col-lg-8 col-md-12 col-sm-12 content-side">
              <div className="blog-grid-content">
                {query || category || tag ? (
                  <p className="po-blog-filter-summary mb_30">
                    Showing {posts.length} article{posts.length === 1 ? "" : "s"}
                    {category ? ` in ${category}` : ""}
                    {tag ? ` tagged ${tag}` : ""}
                    {query ? ` matching “${query}”` : ""}.{" "}
                    <Link href="/blog">View all</Link>
                  </p>
                ) : null}

                {posts.length === 0 ? (
                  <div className="po-blog-empty centred pb_30">
                    <p>No articles match your filters yet.</p>
                    <Link href="/blog" className="theme-btn btn-one mt_20">
                      View all articles
                    </Link>
                  </div>
                ) : (
                  <div className="row clearfix">
                    {posts.map((post) => (
                      <BlogCard key={post.slug} post={post} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
