-- Drop the previous, incorrect policy if it exists
DROP POLICY IF EXISTS "Allow users to update their own review items" ON public.review_queue;

-- Create a new, correct policy that allows Admins and Consultants to update any review item.
CREATE POLICY "Allow admin and consultant to update review items"
ON public.review_queue
FOR UPDATE
TO authenticated
USING (
  (SELECT role FROM public.platform_users WHERE email = auth.email()) IN ('admin', 'consultant')
)
WITH CHECK (
  (SELECT role FROM public.platform_users WHERE email = auth.email()) IN ('admin', 'consultant')
);
