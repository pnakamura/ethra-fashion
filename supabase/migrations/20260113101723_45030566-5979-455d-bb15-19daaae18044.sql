-- Add is_favorite and shared_at columns to outfits table
ALTER TABLE public.outfits ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT false;
ALTER TABLE public.outfits ADD COLUMN IF NOT EXISTS shared_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.outfits ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;