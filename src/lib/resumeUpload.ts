/** Shared resume validation + content-type inference for Storage uploads (bucket MIME checks). */

export const RESUME_MAX_BYTES = 5 * 1024 * 1024;

export const RESUME_ACCEPT_ATTR =
  ".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

const ALLOWED_RESUME_MIME = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

export function resumeValidationMessage(file: File): string | null {
  if (file.size > RESUME_MAX_BYTES) {
    return "That file is larger than 5MB. Choose a smaller file or a shorter PDF.";
  }
  const lower = file.name.toLowerCase();
  const extOk = lower.endsWith(".pdf") || lower.endsWith(".doc") || lower.endsWith(".docx");
  const mime = (file.type || "").trim();
  const mimeOk = mime ? ALLOWED_RESUME_MIME.has(mime) : extOk;
  if (!extOk && !mimeOk) {
    return "Please choose a PDF or Word file (.pdf, .doc, .docx).";
  }
  return null;
}

/** Browsers often leave `file.type` empty; Storage bucket `allowed_mime_types` needs a concrete type. */
export function inferResumeContentType(file: File): string | undefined {
  const mime = file.type?.trim();
  if (mime && ALLOWED_RESUME_MIME.has(mime)) return mime;
  const n = file.name.toLowerCase();
  if (n.endsWith(".pdf")) return "application/pdf";
  if (n.endsWith(".docx")) {
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  }
  if (n.endsWith(".doc")) return "application/msword";
  return undefined;
}
