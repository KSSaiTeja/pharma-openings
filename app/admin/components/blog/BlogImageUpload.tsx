"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import { ImageIcon, Loader2, Trash2, Upload } from "lucide-react";
import { useCallback, useId, useRef, useState } from "react";

import { AdminHint } from "@/app/admin/components/AdminUi";
import { Button } from "@/components/ui/button";
import { resolveBlogImageUrl } from "@/app/components/site/blog/blogImage";
import {
  BLOG_IMAGE_ACCEPT_ATTR,
  BLOG_IMAGE_BUCKET,
  blogImageValidationMessage,
  buildBlogImageStoragePath,
  inferBlogImageContentType,
} from "@/src/lib/blogImageUpload";
import type { Database } from "@/types/database.types";

type BlogImageUploadProps = {
  supabase: SupabaseClient<Database>;
  value: string;
  onChange: (url: string) => void;
  slug?: string;
};

export function BlogImageUpload({ supabase, value, onChange, slug }: BlogImageUploadProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadFile = useCallback(
    async (file: File) => {
      const validationError = blogImageValidationMessage(file);
      if (validationError) {
        setError(validationError);
        return;
      }

      setUploading(true);
      setError(null);

      const path = buildBlogImageStoragePath(slug ?? "drafts", file);
      const { error: uploadError } = await supabase.storage.from(BLOG_IMAGE_BUCKET).upload(path, file, {
        cacheControl: "31536000",
        upsert: false,
        contentType: inferBlogImageContentType(file),
      });

      if (uploadError) {
        setError(uploadError.message);
        setUploading(false);
        return;
      }

      const { data } = supabase.storage.from(BLOG_IMAGE_BUCKET).getPublicUrl(path);
      onChange(data.publicUrl);
      setUploading(false);
    },
    [onChange, slug, supabase],
  );

  const onFiles = (files: FileList | null) => {
    const file = files?.[0];
    if (file) void uploadFile(file);
  };

  const onDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    onFiles(event.dataTransfer.files);
  };

  const previewUrl = value.trim() ? resolveBlogImageUrl(value) : null;

  return (
    <div className="po-admin-image-upload">
      {previewUrl ? (
        <div className="po-admin-image-upload__preview">
          <img src={previewUrl} alt="Blog hero preview" />
          <div className="po-admin-image-upload__preview-actions">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="po-admin-btn-outline"
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
            >
              <Upload className="h-4 w-4" aria-hidden />
              Replace
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={uploading}
              onClick={() => onChange("")}
            >
              <Trash2 className="h-4 w-4" aria-hidden />
              Remove
            </Button>
          </div>
        </div>
      ) : null}

      <div
        className={`po-admin-image-upload__dropzone${dragging ? " is-dragging" : ""}${uploading ? " is-uploading" : ""}`}
        onDragEnter={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          if (event.currentTarget.contains(event.relatedTarget as Node)) return;
          setDragging(false);
        }}
        onDrop={onDrop}
        onClick={() => {
          if (!uploading) inputRef.current?.click();
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            if (!uploading) inputRef.current?.click();
          }
        }}
        role="button"
        tabIndex={0}
        aria-labelledby={inputId}
      >
        {uploading ? (
          <>
            <Loader2 className="po-admin-image-upload__icon is-spinning" aria-hidden />
            <p>Uploading image…</p>
          </>
        ) : (
          <>
            <ImageIcon className="po-admin-image-upload__icon" aria-hidden />
            <p id={inputId}>
              <strong>Drag and drop</strong> a hero image here, or click to browse
            </p>
            <span>JPG, PNG, WebP, or GIF · max 5MB</span>
          </>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={BLOG_IMAGE_ACCEPT_ATTR}
        className="po-admin-image-upload__input"
        onChange={(event) => {
          onFiles(event.target.files);
          event.target.value = "";
        }}
      />

      {error ? <p className="po-admin-image-upload__error">{error}</p> : null}
      <AdminHint>Uploaded images are stored in Supabase and shown on the blog listing and article page.</AdminHint>
    </div>
  );
}
