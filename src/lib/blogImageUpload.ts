/** Validation + helpers for blog hero image uploads to Supabase Storage. */

export const BLOG_IMAGE_BUCKET = "blog-images";

export const BLOG_IMAGE_MAX_BYTES = 5 * 1024 * 1024;

export const BLOG_IMAGE_ACCEPT_ATTR =
  "image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif";

const ALLOWED_IMAGE_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

const ALLOWED_IMAGE_EXT = [".jpg", ".jpeg", ".png", ".webp", ".gif"];

export function blogImageValidationMessage(file: File): string | null {
  if (file.size > BLOG_IMAGE_MAX_BYTES) {
    return "That image is larger than 5MB. Choose a smaller file.";
  }

  const lower = file.name.toLowerCase();
  const extOk = ALLOWED_IMAGE_EXT.some((ext) => lower.endsWith(ext));
  const mime = (file.type || "").trim();
  const mimeOk = mime ? ALLOWED_IMAGE_MIME.has(mime) : extOk;

  if (!extOk && !mimeOk) {
    return "Please choose a JPG, PNG, WebP, or GIF image.";
  }

  return null;
}

export function inferBlogImageContentType(file: File): string | undefined {
  const mime = file.type?.trim();
  if (mime && ALLOWED_IMAGE_MIME.has(mime)) return mime;

  const lower = file.name.toLowerCase();
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".gif")) return "image/gif";
  return undefined;
}

function fileExtension(file: File): string {
  const lower = file.name.toLowerCase();
  for (const ext of ALLOWED_IMAGE_EXT) {
    if (lower.endsWith(ext)) return ext;
  }
  const mime = inferBlogImageContentType(file);
  if (mime === "image/jpeg") return ".jpg";
  if (mime === "image/png") return ".png";
  if (mime === "image/webp") return ".webp";
  if (mime === "image/gif") return ".gif";
  return ".jpg";
}

export function buildBlogImageStoragePath(slug: string, file: File): string {
  const folder = slug.trim() || "drafts";
  const safeFolder = folder.replace(/[^a-z0-9-]/gi, "-").replace(/-+/g, "-").replace(/^-|-$/g, "") || "drafts";
  return `${safeFolder}/${Date.now()}${fileExtension(file)}`;
}
