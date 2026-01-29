-- Fix: tuned_car_id FK blocks deletion of tuned cars used in completed challenges
-- Problem: "update or delete on table tuned_cars violates foreign key constraint
--           tuning_challenges_tuned_car_id_fkey on table tuning_challenges"
-- Solution: Make tuned_car_id nullable and add ON DELETE SET NULL

-- Step 1: Drop NOT NULL constraint on tuned_car_id
ALTER TABLE public.tuning_challenges ALTER COLUMN tuned_car_id DROP NOT NULL;

-- Step 2: Drop old FK constraints and recreate with ON DELETE SET NULL
ALTER TABLE public.tuning_challenges
  DROP CONSTRAINT IF EXISTS tuning_challenges_tuned_car_id_fkey;

ALTER TABLE public.tuning_challenges
  ADD CONSTRAINT tuning_challenges_tuned_car_id_fkey
  FOREIGN KEY (tuned_car_id) REFERENCES public.tuned_cars(id) ON DELETE SET NULL;

ALTER TABLE public.tuning_challenges
  DROP CONSTRAINT IF EXISTS tuning_challenges_opponent_tuned_car_id_fkey;

ALTER TABLE public.tuning_challenges
  ADD CONSTRAINT tuning_challenges_opponent_tuned_car_id_fkey
  FOREIGN KEY (opponent_tuned_car_id) REFERENCES public.tuned_cars(id) ON DELETE SET NULL;
