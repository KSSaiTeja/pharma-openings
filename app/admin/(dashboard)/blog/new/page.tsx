"use client";

import { AdminHeader } from "@/app/admin/components/AdminUi";
import { useAdminSupabase } from "@/app/admin/components/AdminAuthGate";
import { BlogPostForm } from "@/app/admin/components/blog/BlogPostForm";

export default function AdminBlogNewPage() {
  const supabase = useAdminSupabase();
  if (!supabase) return null;

  return (
    <>
      <AdminHeader title="New article" subtitle="Draft or publish a blog post" showLogo={false} />
      <BlogPostForm supabase={supabase} />
    </>
  );
}
