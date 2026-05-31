-- Editable blog posts for Pharma Openings (public read: published only; admin: authenticated CRUD).

CREATE TABLE IF NOT EXISTS public.blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL,
  title text NOT NULL,
  excerpt text NOT NULL,
  category text NOT NULL,
  author text NOT NULL DEFAULT 'Pharma Openings Team',
  published_at date,
  status text NOT NULL DEFAULT 'draft',
  image text NOT NULL DEFAULT 'images/resource/industries-1.jpg',
  tags text[] NOT NULL DEFAULT '{}'::text[],
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT blog_posts_slug_unique UNIQUE (slug),
  CONSTRAINT blog_posts_status_check CHECK (status IN ('draft', 'published')),
  CONSTRAINT blog_posts_slug_format CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  CONSTRAINT blog_posts_title_not_blank CHECK (char_length(btrim(title)) > 0),
  CONSTRAINT blog_posts_excerpt_not_blank CHECK (char_length(btrim(excerpt)) > 0),
  CONSTRAINT blog_posts_category_not_blank CHECK (char_length(btrim(category)) > 0)
);

COMMENT ON TABLE public.blog_posts IS
  'Marketing blog articles. Public site reads published rows only; admin manages via authenticated JWT.';

COMMENT ON COLUMN public.blog_posts.content IS
  'Structured body: { intro: string[], quote?: { text, author }, sections: { heading, paragraphs, list? }[] }';

CREATE INDEX IF NOT EXISTS idx_blog_posts_published_list
  ON public.blog_posts (published_at DESC NULLS LAST)
  WHERE status = 'published';

CREATE INDEX IF NOT EXISTS idx_blog_posts_status_updated
  ON public.blog_posts (status, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_blog_posts_category_published
  ON public.blog_posts (category)
  WHERE status = 'published';

CREATE OR REPLACE FUNCTION public.blog_posts_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS blog_posts_set_updated_at ON public.blog_posts;
CREATE TRIGGER blog_posts_set_updated_at
  BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.blog_posts_set_updated_at();

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'blog_posts'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.blog_posts', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY blog_posts_anon_select_published
  ON public.blog_posts
  FOR SELECT
  TO anon
  USING (status = 'published');

CREATE POLICY blog_posts_authenticated_select
  ON public.blog_posts
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY blog_posts_authenticated_insert
  ON public.blog_posts
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY blog_posts_authenticated_update
  ON public.blog_posts
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY blog_posts_authenticated_delete
  ON public.blog_posts
  FOR DELETE
  TO authenticated
  USING (true);

-- Seed starter articles (idempotent on slug).
INSERT INTO public.blog_posts (slug, title, excerpt, category, author, published_at, status, image, tags, content)
VALUES
  (
    'compliance-ready-pharma-profile',
    'How to build a compliance-ready profile for pharmaceutical hiring',
    'Regulated employers expect structured education, experience, and documentation. Here is how candidates can present a dossier that QA and HR teams trust.',
    'Career advice',
    'Pharma Openings Team',
    '2026-05-12',
    'published',
    'images/resource/industries-1.jpg',
    ARRAY['Profile', 'GMP', 'Candidates'],
    '{"intro":["Pharma Openings is built for regulated hiring. Employers reviewing applications look for clarity on qualifications, department experience, and role readiness—not generic résumé summaries.","A compliance-ready profile helps you stand out when hiring teams scan applications across Production, Quality, Regulatory Affairs, and Clinical functions."],"quote":{"text":"In pharmaceutical hiring, clarity beats volume. A focused profile that mirrors how QA and HR review dossiers saves time for everyone.","author":"Pharma Openings Team"},"sections":[{"heading":"What employers look for first","paragraphs":["Start with accurate qualification and department alignment. If you are targeting QA, QC, or Production, make your recent experience visible and easy to scan."],"list":["Highest qualification and relevant certifications","Current or most recent department and designation","Location preference and notice period where applicable","A current résumé uploaded in a standard format"]},{"heading":"Apply with intention","paragraphs":["Browse openings on Pharma Openings by department, location, and module. Apply to roles that match your background so recruiters can move faster on shortlisting."]}]}'::jsonb
  ),
  (
    'qa-qc-roles-explained',
    'QA vs QC in pharma: roles, skills, and career paths',
    'Quality Assurance and Quality Control are both GMP-critical, but they serve different purposes in manufacturing and release decisions.',
    'Quality',
    'Pharma Openings Team',
    '2026-05-08',
    'published',
    'images/resource/industries-2.jpg',
    ARRAY['QA', 'QC', 'GMP'],
    '{"intro":["Quality functions are among the most active hiring areas on Pharma Openings. Understanding the difference between QA and QC helps candidates target the right openings."],"sections":[{"heading":"Quality Assurance (QA)","paragraphs":["QA focuses on systems—batch records, deviations, CAPA, audits, and ensuring processes remain in a state of control. QA roles often sit closer to documentation, investigations, and compliance."]},{"heading":"Quality Control (QC)","paragraphs":["QC focuses on testing and release support—sampling, analytical methods, stability, and laboratory operations tied to product quality attributes."]}]}'::jsonb
  ),
  (
    'regulatory-affairs-careers',
    'Regulatory Affairs careers in pharmaceuticals: a practical overview',
    'From submissions support to labeling and compliance, Regulatory Affairs connects science with market access across India and global markets.',
    'Regulatory',
    'Pharma Openings Team',
    '2026-05-01',
    'published',
    'images/resource/industries-3.jpg',
    ARRAY['Regulatory', 'Submissions'],
    '{"intro":["Regulatory Affairs professionals bridge R&D, manufacturing, and health authorities. Pharma Openings lists roles across submissions, compliance, and pharmacovigilance interfaces."],"sections":[{"heading":"Common entry paths","paragraphs":["Many professionals enter Regulatory Affairs from pharmacy, life sciences, or quality backgrounds. Strong attention to detail and document control skills are essential."]}]}'::jsonb
  ),
  (
    'production-manufacturing-opportunities',
    'Production and manufacturing opportunities in the pharmaceutical sector',
    'API, injectables, OSD, and packaging units across India continue to hire for shop-floor and leadership production roles.',
    'Manufacturing',
    'Pharma Openings Team',
    '2026-04-22',
    'published',
    'images/resource/industries-4.jpg',
    ARRAY['Production', 'Manufacturing'],
    '{"intro":["Production remains a core hiring lane on Pharma Openings—from officers and executives to supervisors across regulated manufacturing sites."],"sections":[{"heading":"Modules in demand","paragraphs":["Candidates often filter by module—API, Injectables, OSD, and others—to find sites aligned with their shop-floor experience."]}]}'::jsonb
  ),
  (
    'clinical-research-hiring',
    'Clinical research hiring: roles that connect science to trials',
    'Clinical operations, data, and site-facing roles remain essential as sponsors and CROs expand trial activity.',
    'Clinical',
    'Pharma Openings Team',
    '2026-04-15',
    'published',
    'images/resource/industries-5.jpg',
    ARRAY['Clinical', 'Trials'],
    '{"intro":["Clinical Research is a dedicated coverage area on Pharma Openings, connecting professionals with trial operations and data roles."],"sections":[{"heading":"Building relevance","paragraphs":["Highlight protocol exposure, therapeutic areas, and GCP familiarity where applicable. Employers value candidates who understand documentation discipline in clinical settings."]}]}'::jsonb
  ),
  (
    'fresher-guide-pharma-careers',
    'A fresher''s guide to starting a pharmaceutical career in India',
    'Entry-level pathways across Production, Packing, QA, QC, and corporate functions—and how to use Pharma Openings to get started.',
    'Career advice',
    'Pharma Openings Team',
    '2026-04-02',
    'published',
    'images/resource/industries-6.jpg',
    ARRAY['Freshers', 'Careers'],
    '{"intro":["Pharma Openings supports candidates at every stage—from fresh graduates entering regulated industries to experienced professionals seeking leadership roles."],"sections":[{"heading":"Start with the basics","paragraphs":["Register with your mobile number, complete your profile, and explore openings filtered by department and location. Save roles that match your qualification and apply when ready."],"list":["Create your candidate profile on Pharma Openings","Browse jobs by department, location, and module","Apply with OTP sign-in when you are ready to submit"]}]}'::jsonb
  )
ON CONFLICT (slug) DO NOTHING;
