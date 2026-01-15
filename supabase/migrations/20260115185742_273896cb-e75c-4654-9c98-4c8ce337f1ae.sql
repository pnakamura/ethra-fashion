-- Add packing_list column to trips table for structured packing lists
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS packing_list JSONB;

-- Add comment to describe the structure
COMMENT ON COLUMN public.trips.packing_list IS 'Structured packing list with categories: roupas, calcados, acessorios, chapeus. Each item has: name, category, quantity, colors, styles, fabrics, in_wardrobe, image_url, reason';