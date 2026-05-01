-- P-24 RLS used metadata->>'size' / metadata->>'mimetype' on INSERT; the Storage API
-- does not reliably populate storage.objects.metadata for those keys on SDK uploads,
-- so anon uploads were rejected. Bucket-level file_size_limit + allowed_mime_types
-- still enforce size and MIME at the API.

DROP POLICY IF EXISTS "resumes_objects_insert" ON storage.objects;
CREATE POLICY "resumes_objects_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'resumes'
    AND lower(storage.extension(name)) = ANY (ARRAY['pdf', 'doc', 'docx']::text[])
  );

DROP POLICY IF EXISTS "resumes_objects_update" ON storage.objects;
CREATE POLICY "resumes_objects_update"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'resumes')
  WITH CHECK (
    bucket_id = 'resumes'
    AND lower(storage.extension(name)) = ANY (ARRAY['pdf', 'doc', 'docx']::text[])
  );
