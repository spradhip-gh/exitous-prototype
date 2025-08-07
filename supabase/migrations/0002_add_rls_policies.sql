-- Enable Row-Level Security for all tables
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_hr_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_question_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_question_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_tips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tip_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.external_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guidance_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_queue ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to prevent conflicts
DROP POLICY IF EXISTS "Allow all access to admin users" ON public.review_queue;
DROP POLICY IF EXISTS "Allow read access to all authenticated users" ON public.review_queue;

-- Platform Users Policies
DROP POLICY IF EXISTS "Allow admin to manage platform users" ON public.platform_users;
CREATE POLICY "Allow admin to manage platform users" ON public.platform_users
FOR ALL
USING (auth.jwt() ->> 'email' IN (SELECT email FROM platform_users WHERE role = 'admin'))
WITH CHECK (auth.jwt() ->> 'email' IN (SELECT email FROM platform_users WHERE role = 'admin'));

-- Master Content Policies (Questions, Tasks, Tips, etc.)
DROP POLICY IF EXISTS "Allow read access to all authenticated users" ON public.master_questions;
CREATE POLICY "Allow read access to all authenticated users" ON public.master_questions
FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow admin to manage master questions" ON public.master_questions;
CREATE POLICY "Allow admin to manage master questions" ON public.master_questions
FOR ALL
USING (auth.jwt() ->> 'email' IN (SELECT email FROM platform_users WHERE role = 'admin'))
WITH CHECK (auth.jwt() ->> 'email' IN (SELECT email FROM platform_users WHERE role = 'admin'));

DROP POLICY IF EXISTS "Allow read access to all authenticated users" ON public.master_tasks;
CREATE POLICY "Allow read access to all authenticated users" ON public.master_tasks
FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow admin to manage master tasks" ON public.master_tasks;
CREATE POLICY "Allow admin to manage master tasks" ON public.master_tasks
FOR ALL
USING (auth.jwt() ->> 'email' IN (SELECT email FROM platform_users WHERE role = 'admin'))
WITH CHECK (auth.jwt() ->> 'email' IN (SELECT email FROM platform_users WHERE role = 'admin'));

DROP POLICY IF EXISTS "Allow read access to all authenticated users" ON public.master_tips;
CREATE POLICY "Allow read access to all authenticated users" ON public.master_tips
FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow admin to manage master tips" ON public.master_tips;
CREATE POLICY "Allow admin to manage master tips" ON public.master_tips
FOR ALL
USING (auth.jwt() ->> 'email' IN (SELECT email FROM platform_users WHERE role = 'admin'))
WITH CHECK (auth.jwt() ->> 'email' IN (SELECT email FROM platform_users WHERE role = 'admin'));

-- Review Queue Policies
CREATE POLICY "Allow all access to admin users" ON public.review_queue
FOR ALL
USING (auth.jwt() ->> 'email' IN (SELECT email FROM platform_users WHERE role = 'admin'))
WITH CHECK (auth.jwt() ->> 'email' IN (SELECT email FROM platform_users WHERE role = 'admin'));

CREATE POLICY "Allow read access to all authenticated users" ON public.review_queue
FOR SELECT USING (auth.role() = 'authenticated');

-- Company Config Policies
DROP POLICY IF EXISTS "Allow HR to manage their own company config" ON public.company_question_configs;
CREATE POLICY "Allow HR to manage their own company config" ON public.company_question_configs
FOR ALL
USING (
  (auth.jwt() ->> 'email' IN (SELECT email FROM platform_users WHERE role = 'admin'))
  OR
  (company_id IN (
    SELECT company_id FROM company_hr_assignments WHERE hr_email = auth.jwt() ->> 'email'
  ))
);

-- Company User Policies
DROP POLICY IF EXISTS "Allow HR and Admins to manage company users" ON public.company_users;
CREATE POLICY "Allow HR and Admins to manage company users" ON public.company_users
FOR ALL
USING (
  (auth.jwt() ->> 'email' IN (SELECT email FROM platform_users WHERE role = 'admin'))
  OR
  (company_id IN (
    SELECT company_id FROM company_hr_assignments WHERE hr_email = auth.jwt() ->> 'email'
  ))
);

DROP POLICY IF EXISTS "Allow user to see their own data" ON public.company_users;
CREATE POLICY "Allow user to see their own data" ON public.company_users
FOR SELECT
USING (email = auth.jwt() ->> 'email');


-- User Profile/Assessment Policies
DROP POLICY IF EXISTS "Allow user to manage their own profile and assessment" ON public.user_profiles;
CREATE POLICY "Allow user to manage their own profile and assessment" ON public.user_profiles
FOR ALL
USING (user_id IN (SELECT id FROM company_users WHERE email = auth.jwt() ->> 'email'));

DROP POLICY IF EXISTS "Allow user to manage their own profile and assessment" ON public.user_assessments;
CREATE POLICY "Allow user to manage their own profile and assessment" ON public.user_assessments
FOR ALL
USING (user_id IN (SELECT id FROM company_users WHERE email = auth.jwt() ->> 'email'));


-- Allow read-only access for most other tables to any authenticated user for simplicity in the prototype
CREATE POLICY "Allow read for authenticated" ON public.companies FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow read for authenticated" ON public.company_hr_assignments FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow read for authenticated" ON public.external_resources FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow read for authenticated" ON public.guidance_rules FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow read for authenticated" ON public.master_question_configs FOR SELECT USING (auth.role() = 'authenticated');
