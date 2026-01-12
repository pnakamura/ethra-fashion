-- Add color_analysis column for storing AI analysis results
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS color_analysis JSONB;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.color_analysis IS 'Stores AI color analysis results: season, confidence, explanation, recommended_colors, avoid_colors, analyzed_at';