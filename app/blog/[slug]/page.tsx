import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BlogPostBody } from "@/app/components/site/blog/BlogPostBody";
import { BlogSidebar } from "@/app/components/site/blog/BlogSidebar";
import { PageTitleBanner } from "@/app/components/site/PageTitleBanner";
import {
  fetchBlogPostBySlug,
  fetchPublishedBlogPosts,
  fetchPublishedBlogSlugs,
} from "@/src/lib/blog";
import { absoluteBlogImageUrl } from "@/app/components/site/blog/blogImage";
import { absoluteUrl } from "@/src/lib/siteUrl";
import { buildPageMetadata, pageTitle } from "@/src/lib/seo";

export const revalidate = 3600;
export const dynamic = "force-dynamic";
export const dynamicParams = true;

type BlogDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const slugs = await fetchPublishedBlogSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: BlogDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await fetchBlogPostBySlug(slug);
  if (!post) {
    return buildPageMetadata({
      title: pageTitle("Article not found"),
      description: "This Pharma Openings article could not be found.",
      path: `/blog/${slug}`,
      noIndex: true,
    });
  }

  return buildPageMetadata({
    title: pageTitle(post.title),
    description: post.excerpt,
    path: `/blog/${post.slug}`,
    ogType: "article",
    keywords: ["pharma careers", post.category, ...post.tags],
  });
}

export default async function BlogDetailPage({ params }: BlogDetailPageProps) {
  const { slug } = await params;
  const [post, allPosts] = await Promise.all([fetchBlogPostBySlug(slug), fetchPublishedBlogPosts()]);
  if (!post) notFound();

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.publishedAt,
    author: {
      "@type": "Organization",
      name: post.author,
    },
    publisher: {
      "@type": "Organization",
      name: "Pharma Openings",
      url: absoluteUrl("/"),
    },
    mainEntityOfPage: absoluteUrl(`/blog/${post.slug}`),
    image: absoluteBlogImageUrl(post.image, absoluteUrl),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <PageTitleBanner
        title="Blog"
        crumbs={[
          { label: "Home", href: "/" },
          { label: "Blog", href: "/blog" },
          { label: post.title },
        ]}
      />

      <section className="sidebar-page-container p_relative pt_110 pb_120">
        <div className="auto-container">
          <div className="row clearfix">
            <div className="col-lg-4 col-md-12 col-sm-12 sidebar-side">
              <BlogSidebar posts={allPosts} />
            </div>
            <div className="col-lg-8 col-md-12 col-sm-12 content-side">
              <BlogPostBody post={post} />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
