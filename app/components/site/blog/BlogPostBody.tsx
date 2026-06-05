import Link from "next/link";

import { formatBlogDate, type BlogPost } from "@/app/content/blog";
import { SOCIAL_LINKS } from "@/app/content/site";
import { resolveBlogImageUrl } from "@/app/components/site/blog/blogImage";

export function BlogPostBody({ post }: { post: BlogPost }) {
  return (
    <article className="blog-details-content">
      <div className="news-block-two">
        <div className="inner-box">
          <div className="image-box">
            <figure className="image">
              <img src={resolveBlogImageUrl(post.image)} alt="" loading="eager" decoding="async" />
            </figure>
          </div>
          <div className="lower-content">
            <span className="category">{post.category}</span>
            <h1>{post.title}</h1>
            <ul className="post-info">
              <li>
                By <span>{post.author}</span>
              </li>
              <li>
                <span>{formatBlogDate(post.publishedAt)}</span>
              </li>
            </ul>
          </div>
          <div className="text-box pt_25 mb_50">
            {post.intro.map((paragraph) => (
              <p key={paragraph.slice(0, 40)} className="mb_30">
                {paragraph}
              </p>
            ))}
            {post.quote ? (
              <blockquote>
                <div className="icon-box">
                  <i className="icon-36" aria-hidden />
                </div>
                <h4>{post.quote.text}</h4>
                <h3>{post.quote.author}</h3>
              </blockquote>
            ) : null}
          </div>
        </div>
      </div>

      {post.sections.map((section) => (
        <div key={section.heading} className="content-one mb_40">
          <h3>{section.heading}</h3>
          {section.paragraphs.map((paragraph) => (
            <p key={paragraph.slice(0, 40)}>{paragraph}</p>
          ))}
          {section.list ? (
            <ul className="list-item clearfix">
              {section.list.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ))}

      <div className="post-share-option mb_20">
        <ul className="tags-list">
          <li>
            <h6>Tags:</h6>
          </li>
          {post.tags.map((tag) => (
            <li key={tag}>
              <Link href={`/blog?tag=${encodeURIComponent(tag)}`}>{tag}</Link>
            </li>
          ))}
        </ul>
        <ul className="social-links">
          <li>
            <h6>Share:</h6>
          </li>
          {SOCIAL_LINKS.map((item) => (
            <li key={item.label}>
              <a href={item.href} target="_blank" rel="noopener noreferrer" aria-label={item.label}>
                <i className={item.icon} aria-hidden />
              </a>
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}
