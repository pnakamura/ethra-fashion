-- Create storage bucket for custom backgrounds
INSERT INTO storage.buckets (id, name, public)
VALUES ('custom-backgrounds', 'custom-backgrounds', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: Users can view all backgrounds (public bucket)
CREATE POLICY "Public can view custom backgrounds"
ON storage.objects FOR SELECT
USING (bucket_id = 'custom-backgrounds');

-- Policy: Users can upload their own backgrounds
CREATE POLICY "Users can upload custom backgrounds"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'custom-backgrounds' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Policy: Users can update their own backgrounds
CREATE POLICY "Users can update custom backgrounds"
ON storage.objects FOR UPDATE
USING (bucket_id = 'custom-backgrounds' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Policy: Users can delete their own backgrounds
CREATE POLICY "Users can delete custom backgrounds"
ON storage.objects FOR DELETE
USING (bucket_id = 'custom-backgrounds' AND auth.uid()::text = (storage.foldername(name))[1]);