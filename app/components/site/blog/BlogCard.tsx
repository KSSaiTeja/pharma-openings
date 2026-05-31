import Link from "next/link";

import { resolveBlogImageUrl } from "@/app/components/site/blog/blogImage";
import { formatBlogDate, type BlogPost } from "@/app/content/blog";

export function BlogCard({ post }: { post: BlogPost }) {
  return (
    <div className="col-lg-6 col-md-6 col-sm-12 news-block">
      <article className="news-block-two">
        <div className="inner-box">
          <div className="image-box">
            <figure className="image">
              <Link href={`/blog/${post.slug}`}>
                <img src={resolveBlogImageUrl(post.image)} alt="" loading="lazy" decoding="async" />
              </Link>
            </figure>
            <figure className="overlay-image">
              <Link href={`/blog/${post.slug}`}>
                <img src={resolveBlogImageUrl(post.image)} alt="" loading="lazy" decoding="async" />
              </Link>
            </figure>
          </div>
          <div className="lower-content">
            <span className="category">{post.category}</span>
            <h3>
              <Link href={`/blog/${post.slug}`}>{post.title}</Link>
            </h3>
            <ul className="post-info">
              <li>
                By <Link href={`/blog/${post.slug}`}>{post.author}</Link>
              </li>
              <li>
                <span>{formatBlogDate(post.publishedAt)}</span>
              </li>
            </ul>
          </div>
        </div>
      </article>
    </div>
  );
}
