import Link from "next/link";

import {
  formatBlogDate,
  getAllBlogTagsFromPosts,
  getBlogCategoriesFromPosts,
} from "@/src/lib/blog";
import type { BlogPost } from "@/src/lib/blogTypes";
import { resolveBlogImageUrl } from "@/app/components/site/blog/blogImage";
import { siteAsset } from "../paths";

type BlogSidebarProps = {
  posts: BlogPost[];
  activeCategory?: string;
  activeTag?: string;
};

export function BlogSidebar({ posts, activeCategory, activeTag }: BlogSidebarProps) {
  const categories = getBlogCategoriesFromPosts(posts);
  const tags = getAllBlogTagsFromPosts(posts);
  const latestPosts = posts.slice(0, 3);

  return (
    <aside className="blog-sidebar mr_40 mb_30">
      <div className="search-widget mb_60">
        <div className="search-form">
          <form method="get" action="/blog">
            <div className="form-group">
              <input type="search" name="q" placeholder="Search articles" aria-label="Search articles" />
              <button type="submit" aria-label="Search">
                <i className="icon-1" aria-hidden />
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="sidebar-widget category-widget mb_50">
        <div className="widget-title mb_11">
          <h3>Categories</h3>
        </div>
        <div className="widget-content">
          <ul className="category-list clearfix">
            <li>
              <Link href="/blog" className={!activeCategory ? "current" : undefined}>
                All articles<span>({posts.length})</span>
              </Link>
            </li>
            {categories.map((category) => (
              <li key={category.name}>
                <Link
                  href={`/blog?category=${encodeURIComponent(category.name)}`}
                  className={activeCategory === category.name ? "current" : undefined}
                >
                  {category.name}
                  <span>({category.count})</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="sidebar-widget post-widget mb_60">
        <div className="widget-title mb_20">
          <h3>Latest posts</h3>
        </div>
        <div className="post-inner">
          {latestPosts.map((post) => (
            <div key={post.slug} className="post">
              <figure className="post-thumb">
                <Link href={`/blog/${post.slug}`}>
                  <img src={resolveBlogImageUrl(post.image)} alt="" loading="lazy" decoding="async" />
                </Link>
              </figure>
              <h6>
                <Link href={`/blog/${post.slug}`}>{post.title}</Link>
              </h6>
              <span className="post-date">{formatBlogDate(post.publishedAt)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="sidebar-widget tags-widget mb_45">
        <div className="widget-title mb_20">
          <h3>Topics</h3>
        </div>
        <div className="widget-content">
          <ul className="tags-list clearfix">
            {tags.map((tag) => (
              <li key={tag}>
                <Link
                  href={`/blog?tag=${encodeURIComponent(tag)}`}
                  className={activeTag === tag ? "current" : undefined}
                >
                  {tag}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="download-widget mr_40 po-blog-sidebar-cta">
        <div className="shape" style={{ backgroundImage: `url(${siteAsset("images/shape/shape-24.png")})` }} />
        <div className="inner-box">
          <figure className="image-box">
            <img src={siteAsset("images/logo.png")} alt="Pharma Openings" />
          </figure>
          <h4>
            India&apos;s dedicated <span>pharmaceutical job board</span>
          </h4>
          <Link href="/jobs" className="theme-btn btn-one">
            Browse openings
          </Link>
        </div>
      </div>
    </aside>
  );
}
