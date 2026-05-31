"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import { Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  AdminActions,
  AdminActionsGroup,
  AdminAlert,
  AdminFormField,
  AdminHint,
  AdminPanel,
  AdminSection,
} from "@/app/admin/components/AdminUi";
import { revalidateBlogCache } from "@/app/admin/lib/revalidateBlog";
import { BlogImageUpload } from "@/app/admin/components/blog/BlogImageUpload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { BLOG_AUTHOR } from "@/src/lib/blogTypes";
import { blogContentToJson, slugifyBlogTitle } from "@/src/lib/blog";
import type { BlogPostContent, BlogPostSection } from "@/src/lib/blogTypes";
import type { Database, Tables } from "@/types/database.types";

type BlogPostRow = Tables<"blog_posts">;

type BlogPostFormProps = {
  supabase: SupabaseClient<Database>;
  initial?: BlogPostRow;
};

type FormState = {
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  author: string;
  publishedAt: string;
  status: "draft" | "published";
  image: string;
  tags: string;
  intro: string;
  quoteText: string;
  quoteAuthor: string;
  sections: BlogPostSection[];
};

function rowToForm(row?: BlogPostRow): FormState {
  if (!row) {
    return {
      title: "",
      slug: "",
      excerpt: "",
      category: "Career advice",
      author: BLOG_AUTHOR,
      publishedAt: new Date().toISOString().slice(0, 10),
      status: "draft",
      image: "",
      tags: "",
      intro: "",
      quoteText: "",
      quoteAuthor: BLOG_AUTHOR,
      sections: [{ heading: "", paragraphs: [""], list: [] }],
    };
  }

  const content = (row.content ?? {}) as BlogPostContent;
  return {
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt,
    category: row.category,
    author: row.author,
    publishedAt: row.published_at ?? new Date().toISOString().slice(0, 10),
    status: row.status === "published" ? "published" : "draft",
    image: row.image,
    tags: (row.tags ?? []).join(", "),
    intro: (content.intro ?? []).join("\n"),
    quoteText: content.quote?.text ?? "",
    quoteAuthor: content.quote?.author ?? BLOG_AUTHOR,
    sections:
      content.sections?.length > 0
        ? content.sections.map((section) => ({
            heading: section.heading,
            paragraphs: section.paragraphs.length ? section.paragraphs : [""],
            list: section.list ?? [],
          }))
        : [{ heading: "", paragraphs: [""], list: [] }],
  };
}

function buildContent(form: FormState): BlogPostContent {
  const intro = form.intro
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const sections = form.sections
    .map((section) => ({
      heading: section.heading.trim(),
      paragraphs: section.paragraphs.map((p) => p.trim()).filter(Boolean),
      list: section.list?.map((item) => item.trim()).filter(Boolean),
    }))
    .filter((section) => section.heading || section.paragraphs.length > 0);

  const content: BlogPostContent = { intro, sections };
  if (form.quoteText.trim()) {
    content.quote = {
      text: form.quoteText.trim(),
      author: form.quoteAuthor.trim() || BLOG_AUTHOR,
    };
  }
  return content;
}

export function BlogPostForm({ supabase, initial }: BlogPostFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(() => rowToForm(initial));
  const [slugEditing, setSlugEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  const updateSection = (index: number, patch: Partial<BlogPostSection>) => {
    setForm((prev) => ({
      ...prev,
      sections: prev.sections.map((section, i) => (i === index ? { ...section, ...patch } : section)),
    }));
  };

  const effectiveSlug = form.slug.trim() || slugifyBlogTitle(form.title);

  const updateTitle = (title: string) => {
    setForm((prev) => ({
      ...prev,
      title,
      slug: slugEditing ? prev.slug : slugifyBlogTitle(title),
    }));
  };

  const resetSlugFromTitle = () => {
    setSlugEditing(false);
    setForm((prev) => ({ ...prev, slug: slugifyBlogTitle(prev.title) }));
  };

  const save = async () => {
    setSaving(true);
    setMessage(null);

    const slug = effectiveSlug;
    const tags = form.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    const payload = {
      slug,
      title: form.title.trim(),
      excerpt: form.excerpt.trim(),
      category: form.category.trim(),
      author: form.author.trim() || BLOG_AUTHOR,
      published_at: form.publishedAt || null,
      status: form.status,
      image: form.image.trim(),
      tags,
      content: blogContentToJson(buildContent(form)),
    };

    if (!payload.title || !payload.excerpt || !payload.category) {
      setMessage({ tone: "error", text: "Title, excerpt, and category are required." });
      setSaving(false);
      return;
    }

    if (!form.image.trim()) {
      setMessage({ tone: "error", text: "Please upload a hero image." });
      setSaving(false);
      return;
    }

    const query = initial
      ? supabase.from("blog_posts").update(payload).eq("id", initial.id)
      : supabase.from("blog_posts").insert(payload);

    const { error } = await query;
    if (error) {
      setMessage({ tone: "error", text: error.message });
      setSaving(false);
      return;
    }

    await revalidateBlogCache(slug);
    setMessage({ tone: "success", text: initial ? "Article updated." : "Article created." });
    setSaving(false);
    router.push("/admin/blog");
    router.refresh();
  };

  return (
    <AdminSection>
      {message ? <AdminAlert variant={message.tone}>{message.text}</AdminAlert> : null}

      <AdminPanel>
        <div className="po-admin-form po-admin-blog-form">
          <AdminFormField label="Title" htmlFor="blog-title">
            <Input
              id="blog-title"
              value={form.title}
              onChange={(e) => updateTitle(e.target.value)}
            />
          </AdminFormField>

          <AdminFormField label="URL" htmlFor="blog-slug">
            {slugEditing ? (
              <>
                <Input
                  id="blog-slug"
                  value={form.slug}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, slug: slugifyBlogTitle(e.target.value) }))
                  }
                  placeholder="custom-url-slug"
                />
                <AdminHint>
                  Used in /blog/your-slug. Lowercase letters, numbers, and hyphens only.
                </AdminHint>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="po-admin-btn-ghost mt_10"
                  onClick={resetSlugFromTitle}
                >
                  Use auto-generated slug
                </Button>
              </>
            ) : (
              <>
                <p className="po-admin-slug-preview" id="blog-slug">
                  /blog/{effectiveSlug || "your-slug"}
                </p>
                <AdminHint>Auto-generated from the title as you type.</AdminHint>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="po-admin-btn-ghost mt_10"
                  onClick={() => setSlugEditing(true)}
                >
                  Customize slug
                </Button>
              </>
            )}
          </AdminFormField>

          <AdminFormField label="Excerpt" htmlFor="blog-excerpt">
            <Textarea id="blog-excerpt" value={form.excerpt} onChange={(e) => setForm((p) => ({ ...p, excerpt: e.target.value }))} rows={3} />
          </AdminFormField>

          <div className="po-admin-form__row">
            <AdminFormField label="Category" htmlFor="blog-category">
              <Input id="blog-category" value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} />
            </AdminFormField>
            <AdminFormField label="Author" htmlFor="blog-author">
              <Input id="blog-author" value={form.author} onChange={(e) => setForm((p) => ({ ...p, author: e.target.value }))} />
            </AdminFormField>
          </div>

          <div className="po-admin-form__row">
            <AdminFormField label="Published date" htmlFor="blog-date">
              <Input
                id="blog-date"
                type="date"
                value={form.publishedAt}
                onChange={(e) => setForm((p) => ({ ...p, publishedAt: e.target.value }))}
              />
            </AdminFormField>
            <AdminFormField label="Status" htmlFor="blog-status">
              <Select value={form.status} onValueChange={(value: "draft" | "published") => setForm((p) => ({ ...p, status: value }))}>
                <SelectTrigger id="blog-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                </SelectContent>
              </Select>
            </AdminFormField>
          </div>

          <AdminFormField label="Hero image" htmlFor="blog-image">
            <BlogImageUpload
              supabase={supabase}
              value={form.image}
              onChange={(url) => setForm((p) => ({ ...p, image: url }))}
              slug={effectiveSlug}
            />
          </AdminFormField>

          <AdminFormField label="Tags" htmlFor="blog-tags">
            <Input id="blog-tags" value={form.tags} onChange={(e) => setForm((p) => ({ ...p, tags: e.target.value }))} placeholder="GMP, QA, Careers" />
          </AdminFormField>

          <AdminFormField label="Intro paragraphs" htmlFor="blog-intro">
            <Textarea
              id="blog-intro"
              value={form.intro}
              onChange={(e) => setForm((p) => ({ ...p, intro: e.target.value }))}
              rows={4}
              placeholder="One paragraph per line"
            />
          </AdminFormField>

          <div className="po-admin-form__row">
            <AdminFormField label="Quote (optional)" htmlFor="blog-quote">
              <Textarea id="blog-quote" value={form.quoteText} onChange={(e) => setForm((p) => ({ ...p, quoteText: e.target.value }))} rows={3} />
            </AdminFormField>
            <AdminFormField label="Quote author" htmlFor="blog-quote-author">
              <Input id="blog-quote-author" value={form.quoteAuthor} onChange={(e) => setForm((p) => ({ ...p, quoteAuthor: e.target.value }))} />
            </AdminFormField>
          </div>

          <div className="po-admin-blog-sections">
            <div className="po-admin-blog-sections__head">
              <h3>Sections</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="po-admin-btn-outline"
                onClick={() =>
                  setForm((prev) => ({
                    ...prev,
                    sections: [...prev.sections, { heading: "", paragraphs: [""], list: [] }],
                  }))
                }
              >
                <Plus className="h-4 w-4" aria-hidden />
                Add section
              </Button>
            </div>

            {form.sections.map((section, index) => (
              <div key={index} className="po-admin-blog-section">
                <div className="po-admin-blog-section__head">
                  <strong>Section {index + 1}</strong>
                  {form.sections.length > 1 ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          sections: prev.sections.filter((_, i) => i !== index),
                        }))
                      }
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                      Remove
                    </Button>
                  ) : null}
                </div>
                <AdminFormField label="Heading" htmlFor={`section-heading-${index}`}>
                  <Input
                    id={`section-heading-${index}`}
                    value={section.heading}
                    onChange={(e) => updateSection(index, { heading: e.target.value })}
                  />
                </AdminFormField>
                <AdminFormField label="Paragraphs" htmlFor={`section-paragraphs-${index}`}>
                  <Textarea
                    id={`section-paragraphs-${index}`}
                    value={section.paragraphs.join("\n")}
                    onChange={(e) =>
                      updateSection(index, {
                        paragraphs: e.target.value.split("\n"),
                      })
                    }
                    rows={4}
                    placeholder="One paragraph per line"
                  />
                </AdminFormField>
                <AdminFormField label="Bullet list (optional)" htmlFor={`section-list-${index}`}>
                  <Textarea
                    id={`section-list-${index}`}
                    value={(section.list ?? []).join("\n")}
                    onChange={(e) =>
                      updateSection(index, {
                        list: e.target.value.split("\n"),
                      })
                    }
                    rows={3}
                    placeholder="One item per line"
                  />
                </AdminFormField>
              </div>
            ))}
          </div>
        </div>
      </AdminPanel>

      <AdminActions>
        <AdminActionsGroup>
          <Button type="button" className="po-admin-btn-primary" disabled={saving} onClick={() => void save()}>
            {saving ? "Saving…" : initial ? "Update article" : "Create article"}
          </Button>
          <Button type="button" variant="outline" className="po-admin-btn-outline" asChild>
            <Link href="/admin/blog">Cancel</Link>
          </Button>
        </AdminActionsGroup>
      </AdminActions>
    </AdminSection>
  );
}
