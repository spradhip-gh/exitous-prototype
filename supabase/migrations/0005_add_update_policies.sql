-- Grant update access to review_queue for authenticated users
CREATE POLICY "Allow authenticated users to update review items"
ON public.review_queue
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Grant update access to company_question_configs for authenticated users
CREATE POLICY "Allow authenticated users to update company configs"
ON public.company_question_configs
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);
