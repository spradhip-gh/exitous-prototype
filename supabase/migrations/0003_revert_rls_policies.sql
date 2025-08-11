-- Revert all RLS policies to allow public access for the prototype

-- master_tasks
DROP POLICY IF EXISTS "Allow admin full access on master_tasks" ON public.master_tasks;
DROP POLICY IF EXISTS "Allow authenticated users read access on master_tasks" ON public.master_tasks;
ALTER TABLE public.master_tasks DISABLE ROW LEVEL SECURITY;

-- master_tips
DROP POLICY IF EXISTS "Allow admin full access on master_tips" ON public.master_tips;
DROP POLICY IF EXISTS "Allow authenticated users read access on master_tips" ON public.master_tips;
ALTER TABLE public.master_tips DISABLE ROW LEVEL SECURITY;

-- external_resources
DROP POLICY IF EXISTS "Allow admin full access on external_resources" ON public.external_resources;
DROP POLICY IF EXISTS "Allow authenticated users read access on external_resources" ON public.external_resources;
ALTER TABLE public.external_resources DISABLE ROW LEVEL SECURITY;

-- company_resources
DROP POLICY IF EXISTS "Allow HR write access to their own company resources" ON public.company_resources;
DROP POLICY IF EXISTS "Allow users to read resources for their own company" ON public.company_resources;
ALTER TABLE public.company_resources DISABLE ROW LEVEL SECURITY;

-- review_queue
DROP POLICY IF EXISTS "Allow admin full access on review_queue" ON public.review_queue;
DROP POLICY IF EXISTS "Allow HR to read their own company's review items" ON public.review_queue;
ALTER TABLE public.review_queue DISABLE ROW LEVEL SECURITY;

-- guidance_rules
DROP POLICY IF EXISTS "Allow admin full access on guidance_rules" ON public.guidance_rules;
DROP POLICY IF EXISTS "Allow authenticated users read access on guidance_rules" ON public.guidance_rules;
ALTER TABLE public.guidance_rules DISABLE ROW LEVEL SECURITY;

-- master_question_configs
DROP POLICY IF EXISTS "Allow admin full access on master_question_configs" ON public.master_question_configs;
DROP POLICY IF EXISTS "Allow authenticated read access on master_question_configs" ON public.master_question_configs;
ALTER TABLE public.master_question_configs DISABLE ROW LEVEL SECURITY;

-- company_question_configs
DROP POLICY IF EXISTS "Allow HR write access to their own company config" ON public.company_question_configs;
DROP POLICY IF EXISTS "Allow HR to read their own company config" ON public.company_question_configs;
ALTER TABLE public.company_question_configs DISABLE ROW LEVEL SECURITY;
