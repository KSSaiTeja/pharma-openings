export type BlogPostSection = {
  heading: string;
  paragraphs: string[];
  list?: string[];
};

export type BlogPostQuote = {
  text: string;
  author: string;
};

export type BlogPostContent = {
  intro: string[];
  quote?: BlogPostQuote;
  sections: BlogPostSection[];
};

export type BlogPost = {
  id?: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  author: string;
  publishedAt: string;
  status?: "draft" | "published";
  image: string;
  tags: string[];
  intro: string[];
  quote?: BlogPostQuote;
  sections: BlogPostSection[];
};

export const BLOG_AUTHOR = "Pharma Openings Team";

export const EMPTY_BLOG_CONTENT: BlogPostContent = {
  intro: [],
  sections: [],
};
