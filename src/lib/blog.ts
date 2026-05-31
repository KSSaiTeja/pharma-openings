import type { Json } from "@/types/database.types";

import { createSupabaseClient } from "./supabase";
import {
  BLOG_AUTHOR,
  EMPTY_BLOG_CONTENT,
  type BlogPost,
  type BlogPostContent,
  type BlogPostQuote,
  type BlogPostSection,
} from "./blogTypes";

/** Public blog pages — cache for 1 hour; tiny table, indexed published queries. */
export const BLOG_REVALIDATE_SECONDS = 3600;

type BlogPostRow = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  author: string;
  published_at: string | null;
  status: string;
  image: string;
  tags: string[];
  content: Json;
};

function parseBlogContent(raw: Json): BlogPostContent {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { ...EMPTY_BLOG_CONTENT };
  }
  const record = raw as Record<string, unknown>;
  const intro = Array.isArray(record.intro)
    ? record.intro.filter((line): line is string => typeof line === "string")
    : [];
  const sections = Array.isArray(record.sections)
    ? record.sections
        .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
        .map((item): BlogPostSection => ({
          heading: typeof item.heading === "string" ? item.heading : "",
          paragraphs: Array.isArray(item.paragraphs)
            ? item.paragraphs.filter((p): p is string => typeof p === "string")
            : [],
          list: Array.isArray(item.list)
            ? item.list.filter((p): p is string => typeof p === "string")
            : undefined,
        }))
        .filter((section) => section.heading.trim() || section.paragraphs.length > 0)
    : [];

  let quote: BlogPostQuote | undefined;
  if (record.quote && typeof record.quote === "object" && !Array.isArray(record.quote)) {
    const q = record.quote as Record<string, unknown>;
    if (typeof q.text === "string" && q.text.trim()) {
      quote = {
        text: q.text,
        author: typeof q.author === "string" && q.author.trim() ? q.author : BLOG_AUTHOR,
      };
    }
  }

  return { intro, quote, sections };
}

export function blogContentToJson(content: BlogPostContent): Json {
  return {
    intro: content.intro,
    ...(content.quote ? { quote: content.quote } : {}),
    sections: content.sections,
  };
}

export function mapBlogPostRow(row: BlogPostRow): BlogPost {
  const content = parseBlogContent(row.content);
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    category: row.category,
    author: row.author,
    publishedAt: row.published_at ?? row.slug,
    status: row.status === "published" ? "published" : "draft",
    image: row.image,
    tags: row.tags ?? [],
    intro: content.intro,
    quote: content.quote,
    sections: content.sections,
  };
}

export function slugifyBlogTitle(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function fetchPublishedBlogPosts(): Promise<BlogPost[]> {
  const supabase = createSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("blog_posts")
    .select("id, slug, title, excerpt, category, author, published_at, status, image, tags, content")
    .eq("status", "published")
    .order("published_at", { ascending: false, nullsFirst: false });

  if (error || !data) return [];
  return (data as BlogPostRow[]).map(mapBlogPostRow);
}

export async function fetchBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  const supabase = createSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("blog_posts")
    .select("id, slug, title, excerpt, category, author, published_at, status, image, tags, content")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error || !data) return null;
  return mapBlogPostRow(data as BlogPostRow);
}

export async function fetchPublishedBlogSlugs(): Promise<string[]> {
  const supabase = createSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("blog_posts")
    .select("slug")
    .eq("status", "published");

  if (error || !data) return [];
  return data.map((row) => row.slug);
}

export function getBlogCategoriesFromPosts(posts: BlogPost[]): { name: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const post of posts) {
    counts.set(post.category, (counts.get(post.category) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function getAllBlogTagsFromPosts(posts: BlogPost[]): string[] {
  const tags = new Set<string>();
  for (const post of posts) {
    for (const tag of post.tags) tags.add(tag);
  }
  return [...tags].sort((a, b) => a.localeCompare(b));
}

export function filterBlogPostsFromList(
  posts: BlogPost[],
  options: { query?: string; category?: string; tag?: string },
): BlogPost[] {
  const q = options.query?.trim().toLowerCase();
  const category = options.category?.trim();
  const tag = options.tag?.trim();

  return posts.filter((post) => {
    if (category && post.category !== category) return false;
    if (tag && !post.tags.includes(tag)) return false;
    if (!q) return true;
    const haystack = [post.title, post.excerpt, post.category, ...post.tags].join(" ").toLowerCase();
    return haystack.includes(q);
  });
}

export function formatBlogDate(isoDate: string): string {
  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(isoDate) ? `${isoDate}T12:00:00` : isoDate;
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(new Date(normalized));
}
