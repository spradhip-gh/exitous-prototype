
-- Grant read access to platform_users for authenticated users
ALTER TABLE public.platform_users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated users to read platform_users" ON public.platform_users;
CREATE POLICY "Allow authenticated users to read platform_users"
    ON public.platform_users
    FOR SELECT
    TO authenticated
    USING (true);

-- Grant read access to company_hr_assignments for authenticated users
ALTER TABLE public.company_hr_assignments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated users to read company_hr_assignments" ON public.company_hr_assignments;
CREATE POLICY "Allow authenticated users to read company_hr_assignments"
    ON public.company_hr_assignments
    FOR SELECT
    TO authenticated
    USING (true);

-- Grant read access to company_users for authenticated users
ALTER TABLE public.company_users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated users to read company_users" ON public.company_users;
CREATE POLICY "Allow authenticated users to read company_users"
    ON public.company_users
    FOR SELECT
    TO authenticated
    USING (true);

-- Grant read access to master_questions for authenticated users
ALTER TABLE public.master_questions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated users to read master_questions" ON public.master_questions;
CREATE POLICY "Allow authenticated users to read master_questions"
    ON public.master_questions
    FOR SELECT
    TO authenticated
    USING (true);

-- Grant read access to master_question_configs for authenticated users
ALTER TABLE public.master_question_configs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated users to read master_question_configs" ON public.master_question_configs;
CREATE POLICY "Allow authenticated users to read master_question_configs"
    ON public.master_question_configs
    FOR SELECT
    TO authenticated
    USING (true);

-- Grant read access to company_question_configs for authenticated users
ALTER TABLE public.company_question_configs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated users to read company_question_configs" ON public.company_question_configs;
CREATE POLICY "Allow authenticated users to read company_question_configs"
    ON public.company_question_configs
    FOR SELECT
    TO authenticated
    USING (true);

-- Ensure other tables are also readable
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated users to read companies" ON public.companies;
CREATE POLICY "Allow authenticated users to read companies"
    ON public.companies
    FOR SELECT
    TO authenticated
    USING (true);

ALTER TABLE public.master_tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated users to read master_tasks" ON public.master_tasks;
CREATE POLICY "Allow authenticated users to read master_tasks"
    ON public.master_tasks
    FOR SELECT
    TO authenticated
    USING (true);

ALTER TABLE public.master_tips ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated users to read master_tips" ON public.master_tips;
CREATE POLICY "Allow authenticated users to read master_tips"
    ON public.master_tips
    FOR SELECT
    TO authenticated
    USING (true);

ALTER TABLE public.guidance_rules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated users to read guidance_rules" ON public.guidance_rules;
CREATE POLICY "Allow authenticated users to read guidance_rules"
    ON public.guidance_rules
    FOR SELECT
    TO authenticated
    USING (true);

ALTER TABLE public.review_queue ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated users to read review_queue" ON public.review_queue;
CREATE POLICY "Allow authenticated users to read review_queue"
    ON public.review_queue
    FOR SELECT
    TO authenticated
    USING (true);

ALTER TABLE public.external_resources ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated users to read external_resources" ON public.external_resources;
CREATE POLICY "Allow authenticated users to read external_resources"
    ON public.external_resources
    FOR SELECT
    TO authenticated
    USING (true);

-- Grant read access to user_profiles and user_assessments for their owners
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow individual user to read their own profile" ON public.user_profiles;
CREATE POLICY "Allow individual user to read their own profile"
    ON public.user_profiles
    FOR SELECT
    USING (auth.uid() = user_id);

ALTER TABLE public.user_assessments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow individual user to read their own assessment" ON public.user_assessments;
CREATE POLICY "Allow individual user to read their own assessment"
    ON public.user_assessments
    FOR SELECT
    USING (auth.uid() = user_id);

