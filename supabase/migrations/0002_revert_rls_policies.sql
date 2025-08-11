-- Revert RLS policies for master_tasks
DROP POLICY "Allow admin full access on master_tasks" ON public.master_tasks;
DROP POLICY "Allow authenticated user read access on master_tasks" ON public.master_tasks;
ALTER TABLE public.master_tasks DISABLE ROW LEVEL SECURITY;

-- Revert RLS policies for master_tips
DROP POLICY "Allow admin full access on master_tips" ON public.master_tips;
DROP POLICY "Allow authenticated user read access on master_tips" ON public.master_tips;
ALTER TABLE public.master_tips DISABLE ROW LEVEL SECURITY;

-- Revert RLS policies for external_resources
DROP POLICY "Allow admin full access on external_resources" ON public.external_resources;
DROP POLICY "Allow authenticated user read access on external_resources" ON public.external_resources;
ALTER TABLE public.external_resources DISABLE ROW LEVEL SECURITY;

-- Revert RLS policies for review_queue
DROP POLICY "Allow admin full access on review_queue" ON public.review_queue;
DROP POLICY "Allow HR to read their own company's queue" ON public.review_queue;
ALTER TABLE public.review_queue DISABLE ROW LEVEL SECURITY;

-- Revert RLS policies for company_question_configs
DROP POLICY "Allow admin full access on company_question_configs" ON public.company_question_configs;
DROP POLICY "Allow HR to read their own company's config" ON public.company_question_configs;
ALTER TABLE public.company_question_configs DISABLE ROW LEVEL SECURITY;

-- Revert RLS policies for master_questions
DROP POLICY "Allow admin full access on master_questions" ON public.master_questions;
DROP POLICY "Allow authenticated read access for all" ON public.master_questions;
ALTER TABLE public.master_questions DISABLE ROW LEVEL SECURITY;
