-- 010: candidate department taxonomy fields for register/profile flows
-- Adds canonical + custom fields so "Other" selections are preserved explicitly.

ALTER TABLE public.candidates
  ADD COLUMN IF NOT EXISTS current_sub_department text,
  ADD COLUMN IF NOT EXISTS department_custom text,
  ADD COLUMN IF NOT EXISTS sub_department_custom text,
  ADD COLUMN IF NOT EXISTS designation_custom text;

COMMENT ON COLUMN public.candidates.current_department IS
  'Selected department option from curated taxonomy, or literal ''Other'' when custom value is used.';
COMMENT ON COLUMN public.candidates.current_sub_department IS
  'Selected sub-department option from curated taxonomy, or literal ''Other'' when custom value is used.';
COMMENT ON COLUMN public.candidates.current_designation IS
  'Selected designation option from curated taxonomy, or literal ''Other'' when custom value is used.';
COMMENT ON COLUMN public.candidates.department_custom IS
  'Free-text department value provided when current_department = ''Other''.';
COMMENT ON COLUMN public.candidates.sub_department_custom IS
  'Free-text sub-department value provided when current_sub_department = ''Other''.';
COMMENT ON COLUMN public.candidates.designation_custom IS
  'Free-text designation value provided when current_designation = ''Other''.';
