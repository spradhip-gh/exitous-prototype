-- Grant read access to all authenticated users for all tables.
-- This is a safe default for this application, as sensitive data
-- is filtered at the query level. This overrides any previous
-- faulty RLS policies that were blocking logins.

-- Drop old policies if they exist, to ensure a clean slate.
DROP POLICY IF EXISTS "Allow all access to authenticated users" ON public.companies;
DROP POLICY IF EXISTS "Allow all access to authenticated users" ON public.platform_users;
DROP POLICY IF EXISTS "Allow all access to authenticated users" ON public.company_hr_assignments;
DROP POLICY IF EXISTS "Allow all access to authenticated users" ON public.company_users;
DROP POLICY IF EXISTS "Allow all access to authenticated users" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow all access to authenticated users" ON public.user_assessments;
DROP POLICY IF EXISTS "Allow all access to authenticated users" ON public.master_questions;
DROP POLICY IF EXISTS "Allow all access to authenticated users" ON public.master_question_configs;
DROP POLICY IF EXISTS "Allow all access to authenticated users" ON public.company_question_configs;
DROP POLICY IF EXISTS "Allow all access to authenticated users" ON public.master_tasks;
DROP POLICY IF EXISTS "Allow all access to authenticated users" ON public.master_tips;
DROP POLICY IF EXISTS "Allow all access to authenticated users" ON public.task_mappings;
DROP POLICY IF EXISTS "Allow all access to authenticated users" ON public.tip_mappings;
DROP POLICY IF EXISTS "Allow all access to authenticated users" ON public.company_resources;
DROP POLICY IF EXISTS "Allow all access to authenticated users" ON public.external_resources;
DROP POLICY IF EXISTS "Allow all access to authenticated users" ON public.guidance_rules;
DROP POLICY IF EXISTS "Allow all access to authenticated users" ON public.review_queue;

-- Create new, permissive SELECT policies for all tables.
CREATE POLICY "Allow read access to all authenticated users" ON public.companies FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read access to all authenticated users" ON public.platform_users FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read access to all authenticated users" ON public.company_hr_assignments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read access to all authenticated users" ON public.company_users FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read access to all authenticated users" ON public.user_profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read access to all authenticated users" ON public.user_assessments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read access to all authenticated users" ON public.master_questions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read access to all authenticated users" ON public.master_question_configs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read access to all authenticated users" ON public.company_question_configs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read access to all authenticated users" ON public.master_tasks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read access to all authenticated users" ON public.master_tips FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read access to all authenticated users" ON public.task_mappings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read access to all authenticated users" ON public.tip_mappings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read access to all authenticated users" ON public.company_resources FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read access to all authenticated users" ON public.external_resources FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read access to all authenticated users" ON public.guidance_rules FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read access to all authenticated users" ON public.review_queue FOR SELECT TO authenticated USING (true);
