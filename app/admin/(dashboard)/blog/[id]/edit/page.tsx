"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { AdminAlert, AdminHeader, AdminLoading } from "@/app/admin/components/AdminUi";
import { useAdminSupabase } from "@/app/admin/components/AdminAuthGate";
import { BlogPostForm } from "@/app/admin/components/blog/BlogPostForm";
import type { Tables } from "@/types/database.types";

export default function AdminBlogEditPage() {
  const supabase = useAdminSupabase();
  const params = useParams<{ id: string }>();
  const [post, setPost] = useState<Tables<"blog_posts"> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase || !params.id) return;
    let cancelled = false;
    void (async () => {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("id", params.id)
        .maybeSingle();
      if (cancelled) return;
      if (fetchError || !data) {
        setError(fetchError?.message ?? "Article not found.");
        setPost(null);
      } else {
        setPost(data);
        setError(null);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [params.id, supabase]);

  if (!supabase) return null;
  if (loading) return <AdminLoading message="Loading article…" />;
  if (error || !post) return <AdminAlert variant="error">{error ?? "Article not found."}</AdminAlert>;

  return (
    <>
      <AdminHeader title="Edit article" subtitle={post.title} showLogo={false} />
      <BlogPostForm supabase={supabase} initial={post} />
    </>
  );
}
