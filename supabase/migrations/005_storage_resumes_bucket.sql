-- Public "resumes" bucket + storage.objects RLS (register + apply resume uploads).
-- Fixes: "Bucket not found" when `resumes` is missing from `storage.buckets`.

INSERT INTO storage.buckets (id, name, public)
VALUES ('resumes', 'resumes', true)
ON CONFLICT (id) DO NOTHING;

-- Public bucket reads are open; uploads/updates still require policies below.
DROP POLICY IF EXISTS "resumes_objects_select" ON storage.objects;
CREATE POLICY "resumes_objects_select"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'resumes');

DROP POLICY IF EXISTS "resumes_objects_insert" ON storage.objects;
CREATE POLICY "resumes_objects_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'resumes');

DROP POLICY IF EXISTS "resumes_objects_update" ON storage.objects;
CREATE POLICY "resumes_objects_update"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'resumes')
  WITH CHECK (bucket_id = 'resumes');
