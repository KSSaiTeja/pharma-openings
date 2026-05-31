-- Public blog hero images (admin upload via authenticated JWT; public read for site).

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'blog-images',
  'blog-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "blog_images_objects_select" ON storage.objects;
CREATE POLICY "blog_images_objects_select"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'blog-images');

DROP POLICY IF EXISTS "blog_images_objects_insert" ON storage.objects;
CREATE POLICY "blog_images_objects_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'blog-images'
    AND auth.role() = 'authenticated'
    AND lower(storage.extension(name)) = ANY (ARRAY['jpg', 'jpeg', 'png', 'webp', 'gif']::text[])
  );

DROP POLICY IF EXISTS "blog_images_objects_update" ON storage.objects;
CREATE POLICY "blog_images_objects_update"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'blog-images' AND auth.role() = 'authenticated')
  WITH CHECK (
    bucket_id = 'blog-images'
    AND auth.role() = 'authenticated'
    AND lower(storage.extension(name)) = ANY (ARRAY['jpg', 'jpeg', 'png', 'webp', 'gif']::text[])
  );

DROP POLICY IF EXISTS "blog_images_objects_delete" ON storage.objects;
CREATE POLICY "blog_images_objects_delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'blog-images' AND auth.role() = 'authenticated');
