-- P-24 server-side upload validation (PRD §9).
-- README: Client checks in form flows give fast UX feedback; this migration is the
-- backend enforcement layer for resume uploads (size + MIME + extension).

-- Prefer bucket-level limits so all upload paths (SDK/API) get enforced.
UPDATE storage.buckets
SET
  file_size_limit = 5 * 1024 * 1024,
  allowed_mime_types = ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]::text[]
WHERE id = 'resumes';

-- Keep bucket-scoped read policy as-is and tighten write checks.
DROP POLICY IF EXISTS "resumes_objects_insert" ON storage.objects;
CREATE POLICY "resumes_objects_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'resumes'
    AND lower(storage.extension(name)) = ANY (ARRAY['pdf', 'doc', 'docx']::text[])
    AND COALESCE((metadata->>'size')::bigint, 0) > 0
    AND COALESCE((metadata->>'size')::bigint, 0) <= 5 * 1024 * 1024
    AND lower(COALESCE(metadata->>'mimetype', '')) = ANY (
      ARRAY[
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ]::text[]
    )
  );

DROP POLICY IF EXISTS "resumes_objects_update" ON storage.objects;
CREATE POLICY "resumes_objects_update"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'resumes')
  WITH CHECK (
    bucket_id = 'resumes'
    AND lower(storage.extension(name)) = ANY (ARRAY['pdf', 'doc', 'docx']::text[])
    AND COALESCE((metadata->>'size')::bigint, 0) > 0
    AND COALESCE((metadata->>'size')::bigint, 0) <= 5 * 1024 * 1024
    AND lower(COALESCE(metadata->>'mimetype', '')) = ANY (
      ARRAY[
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ]::text[]
    )
  );
