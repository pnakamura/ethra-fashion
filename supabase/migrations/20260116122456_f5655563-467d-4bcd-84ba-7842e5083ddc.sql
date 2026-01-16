-- Allow users to delete their own notifications
CREATE POLICY "Users can delete their own notifications"
ON public.notifications FOR DELETE
USING (auth.uid() = user_id);

-- Allow users to update their own recommended looks
CREATE POLICY "Users can update their own recommended looks"
ON public.recommended_looks FOR UPDATE
USING (auth.uid() = user_id);