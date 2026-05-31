"use server";

import { revalidatePath } from "next/cache";

export async function revalidateBlogCache(slug?: string) {
  revalidatePath("/blog");
  if (slug) revalidatePath(`/blog/${slug}`);
  revalidatePath("/sitemap.xml");
}
