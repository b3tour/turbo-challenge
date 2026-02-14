-- Add 'survey' mission type
ALTER TABLE public.missions DROP CONSTRAINT IF EXISTS missions_type_check;
ALTER TABLE public.missions ADD CONSTRAINT missions_type_check
  CHECK (type IN ('qr_code', 'photo', 'quiz', 'gps', 'manual', 'survey'));

-- Add survey_data column to missions (stores SurveyData JSON)
ALTER TABLE public.missions ADD COLUMN IF NOT EXISTS survey_data JSONB;

-- Add survey_answers column to submissions
-- Stores: option ID (e.g. "opt_1") or "other:user typed text"
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS survey_answers TEXT;
