-- Grant full write access to admins for critical tables
CREATE POLICY "Allow admin full access on review_queue" ON public.review_queue FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow admin full access on company_question_configs" ON public.company_question_configs FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow admin full access on company_users" ON public.company_users FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow admin full access on user_profiles" ON public.user_profiles FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow admin full access on user_assessments" ON public.user_assessments FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow admin full access on master_questions" ON public.master_questions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow admin full access on master_tasks" ON public.master_tasks FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow admin full access on master_tips" ON public.master_tips FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow admin full access on guidance_rules" ON public.guidance_rules FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow admin full access on external_resources" ON public.external_resources FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow admin full access on platform_users" ON public.platform_users FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow admin full access on companies" ON public.companies FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow admin full access on company_hr_assignments" ON public.company_hr_assignments FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow admin full access on master_question_configs" ON public.master_question_configs FOR ALL TO authenticated USING (true) WITH CHECK (true);
