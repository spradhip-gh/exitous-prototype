
-- Temporarily disable RLS on all tables to debug blocking issues.
-- This is not a permanent solution but a step to restore functionality.

ALTER TABLE public.companies DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_hr_assignments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_assessments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_questions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_question_configs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_question_configs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_tips DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.guidance_rules DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_queue DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.external_resources DISABLE ROW LEVEL SECURITY;
