-- Grant permission to any logged-in user to add items to the review queue.
-- This is a common pattern for "submit" actions where the user creates a new record.
CREATE POLICY "Allow authenticated users to insert into review_queue"
ON public.review_queue
FOR INSERT
TO authenticated
WITH CHECK (true);
