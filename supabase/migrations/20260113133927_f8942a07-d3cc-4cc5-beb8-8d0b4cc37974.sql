-- Add new columns to profiles for settings
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS theme_preference text DEFAULT 'system',
ADD COLUMN IF NOT EXISTS font_size text DEFAULT 'normal';

-- Add new columns to user_events for special events
ALTER TABLE user_events 
ADD COLUMN IF NOT EXISTS dress_code text,
ADD COLUMN IF NOT EXISTS expected_attendees text,
ADD COLUMN IF NOT EXISTS is_special_event boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS outfit_id uuid REFERENCES outfits(id),
ADD COLUMN IF NOT EXISTS weather_info jsonb,
ADD COLUMN IF NOT EXISTS ai_suggestions jsonb,
ADD COLUMN IF NOT EXISTS reminder_sent_at timestamp with time zone;