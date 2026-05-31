"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import {
  AdminActions,
  AdminActionsGroup,
  AdminAlert,
  AdminHeader,
  AdminLoading,
  AdminSection,
  AdminTableWrap,
} from "@/app/admin/components/AdminUi";
import { useAdminSupabase } from "@/app/admin/components/AdminAuthGate";
import { revalidateBlogCache } from "@/app/admin/lib/revalidateBlog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatBlogDate } from "@/src/lib/blog";
import type { Tables } from "@/types/database.types";

type BlogPostRow = Tables<"blog_posts">;

export default function AdminBlogPage() {
  const supabase = useAdminSupabase();
  const router = useRouter();
  const [posts, setPosts] = useState<BlogPostRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  const loadPosts = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("blog_posts")
      .select("*")
      .order("updated_at", { ascending: false });
    if (error) {
      setMessage({ tone: "error", text: error.message });
      setPosts([]);
    } else {
      setPosts(data ?? []);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    void loadPosts();
  }, [loadPosts]);

  const removePost = async (post: BlogPostRow) => {
    if (!supabase) return;
    if (!window.confirm(`Delete “${post.title}”? This cannot be undone.`)) return;

    const { error } = await supabase.from("blog_posts").delete().eq("id", post.id);
    if (error) {
      setMessage({ tone: "error", text: error.message });
      return;
    }
    await revalidateBlogCache(post.slug);
    setMessage({ tone: "success", text: "Article deleted." });
    void loadPosts();
    router.refresh();
  };

  if (!supabase) {
    return <AdminAlert variant="error">Supabase is not configured.</AdminAlert>;
  }

  return (
    <>
      <AdminHeader
        title="Blog"
        subtitle="Create and publish pharma career articles"
        showLogo={false}
        actions={
          <Button type="button" className="po-admin-btn-primary" asChild>
            <Link href="/admin/blog/new">
              <Plus className="h-4 w-4" aria-hidden />
              New article
            </Link>
          </Button>
        }
      />

      {message ? <AdminAlert variant={message.tone}>{message.text}</AdminAlert> : null}

      <AdminSection>
        {loading ? (
          <AdminLoading message="Loading articles…" />
        ) : posts.length === 0 ? (
          <AdminAlert variant="info">No articles yet. Create your first post.</AdminAlert>
        ) : (
          <AdminTableWrap>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Published</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {posts.map((post) => (
                  <TableRow key={post.id}>
                    <TableCell>
                      <div className="po-admin-blog-list__title">{post.title}</div>
                      <div className="po-admin-blog-list__slug">/blog/{post.slug}</div>
                    </TableCell>
                    <TableCell>
                      <span className={`po-admin-badge po-admin-badge--${post.status}`}>{post.status}</span>
                    </TableCell>
                    <TableCell>{post.category}</TableCell>
                    <TableCell>{post.published_at ? formatBlogDate(post.published_at) : "—"}</TableCell>
                    <TableCell className="text-right">
                      <AdminActions className="po-admin-table-actions">
                        <AdminActionsGroup>
                          {post.status === "published" ? (
                            <Button type="button" variant="outline" size="sm" className="po-admin-btn-outline" asChild>
                              <Link href={`/blog/${post.slug}`} target="_blank" rel="noopener noreferrer">
                                View
                              </Link>
                            </Button>
                          ) : null}
                          <Button type="button" variant="outline" size="sm" className="po-admin-btn-outline" asChild>
                            <Link href={`/admin/blog/${post.id}/edit`}>
                              <Pencil className="h-4 w-4" aria-hidden />
                              Edit
                            </Link>
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="po-admin-btn-outline po-admin-btn-danger"
                            onClick={() => void removePost(post)}
                          >
                            <Trash2 className="h-4 w-4" aria-hidden />
                            Delete
                          </Button>
                        </AdminActionsGroup>
                      </AdminActions>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </AdminTableWrap>
        )}
      </AdminSection>
    </>
  );
}
