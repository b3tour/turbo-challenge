-- =====================================================
-- ATOMIC RPC FUNCTIONS — Turbo Challenge
-- Wszystkie operacje multi-table w jednej transakcji
-- =====================================================

-- 1. COMPLETE CARD ORDER (webhook PayU → karta)
-- Atomowo: update order + insert user_card + update donation + add XP + update sold_count + notification
CREATE OR REPLACE FUNCTION complete_card_order(
  p_order_id UUID,
  p_payu_order_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order RECORD;
  v_card RECORD;
BEGIN
  -- Pobierz zamówienie (z lockiem)
  SELECT * INTO v_order
  FROM card_orders
  WHERE id = p_order_id AND status = 'pending'
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Order not found or not pending');
  END IF;

  -- 1. Zaktualizuj status zamówienia
  UPDATE card_orders
  SET status = 'paid',
      paid_at = NOW(),
      admin_notes = 'payu:' || p_payu_order_id
  WHERE id = p_order_id;

  -- 2. Dodaj kartę do kolekcji
  INSERT INTO user_cards (user_id, card_id, obtained_from)
  VALUES (v_order.user_id, v_order.card_id, 'purchase');

  -- 3. Zaktualizuj donation_total
  UPDATE users
  SET donation_total = COALESCE(donation_total, 0) + v_order.amount
  WHERE id = v_order.user_id;

  -- 4. Dodaj XP (jeśli > 0)
  IF COALESCE(v_order.xp_reward, 0) > 0 THEN
    UPDATE users
    SET total_xp = COALESCE(total_xp, 0) + v_order.xp_reward
    WHERE id = v_order.user_id;
  END IF;

  -- 5. Zaktualizuj sold_count karty
  UPDATE cards
  SET sold_count = COALESCE(sold_count, 0) + 1
  WHERE id = v_order.card_id;

  -- 6. Wyślij powiadomienie
  INSERT INTO notifications (user_id, title, message, type, read)
  VALUES (
    v_order.user_id,
    'Płatność potwierdzona!',
    'Twoja karta została dodana do kolekcji. Dziękujemy za wsparcie Turbo Pomoc!',
    'card_received',
    false
  );

  RETURN jsonb_build_object('success', true);
END;
$$;


-- 2. COMPLETE PACK ORDER (webhook PayU → mystery pack auto-open)
-- Atomowo: insert user_cards + update purchase + update donation/XP + notification
CREATE OR REPLACE FUNCTION complete_pack_order(
  p_purchase_id UUID,
  p_card_ids UUID[],
  p_amount NUMERIC,
  p_pack_name TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_purchase RECORD;
  v_card_id UUID;
  v_card_count INT;
  v_summary TEXT;
  v_rarity_counts JSONB;
BEGIN
  -- Pobierz zakup (z lockiem)
  SELECT * INTO v_purchase
  FROM mystery_pack_purchases
  WHERE id = p_purchase_id AND status = 'pending'
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Purchase not found or not pending');
  END IF;

  v_card_count := array_length(p_card_ids, 1);

  -- 1. Dodaj karty do kolekcji
  FOREACH v_card_id IN ARRAY p_card_ids LOOP
    INSERT INTO user_cards (user_id, card_id, obtained_from)
    VALUES (v_purchase.user_id, v_card_id, 'purchase');
  END LOOP;

  -- 2. Zaktualizuj status zakupu na 'opened'
  UPDATE mystery_pack_purchases
  SET status = 'opened',
      paid_at = NOW(),
      cards_received = p_card_ids,
      opened_at = NOW()
  WHERE id = p_purchase_id;

  -- 3. Zaktualizuj donation_total + XP (1 XP per karta)
  UPDATE users
  SET donation_total = COALESCE(donation_total, 0) + p_amount,
      total_xp = COALESCE(total_xp, 0) + v_card_count
  WHERE id = v_purchase.user_id;

  -- 4. Policz rzadkości dla powiadomienia
  SELECT jsonb_object_agg(rarity, cnt) INTO v_rarity_counts
  FROM (
    SELECT c.rarity, COUNT(*) as cnt
    FROM unnest(p_card_ids) AS cid
    JOIN cards c ON c.id = cid
    GROUP BY c.rarity
  ) sub;

  -- 5. Wyślij powiadomienie
  INSERT INTO notifications (user_id, title, message, type, read)
  VALUES (
    v_purchase.user_id,
    'Pakiet otwarty!',
    'Twój pakiet ' || p_pack_name || ' został otwarty! Otrzymałeś ' || v_card_count || ' kart. Sprawdź kolekcję!',
    'system',
    false
  );

  RETURN jsonb_build_object(
    'success', true,
    'card_count', v_card_count,
    'rarity_counts', v_rarity_counts
  );
END;
$$;


-- 3. COMPLETE MISSION WITH XP (auto-approved missions: QR, GPS, Quiz passed, Survey)
-- Atomowo: insert submission + add XP
CREATE OR REPLACE FUNCTION complete_mission_with_xp(
  p_user_id UUID,
  p_mission_id UUID,
  p_xp_reward INT,
  p_status TEXT DEFAULT 'approved',
  p_quiz_score NUMERIC DEFAULT NULL,
  p_quiz_time_ms INT DEFAULT NULL,
  p_gps_lat DOUBLE PRECISION DEFAULT NULL,
  p_gps_lng DOUBLE PRECISION DEFAULT NULL,
  p_survey_answers JSONB DEFAULT NULL,
  p_photo_url TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_submission_id UUID;
  v_xp_to_add INT;
BEGIN
  -- XP tylko dla approved
  v_xp_to_add := CASE WHEN p_status = 'approved' THEN p_xp_reward ELSE 0 END;

  -- 1. Wstaw submission
  INSERT INTO submissions (
    user_id, mission_id, status, xp_awarded,
    quiz_score, quiz_time_ms,
    gps_lat, gps_lng,
    survey_answers,
    photo_url
  )
  VALUES (
    p_user_id, p_mission_id, p_status, v_xp_to_add,
    p_quiz_score, p_quiz_time_ms,
    p_gps_lat, p_gps_lng,
    p_survey_answers,
    p_photo_url
  )
  RETURNING id INTO v_submission_id;

  -- 2. Dodaj XP (tylko jeśli approved i > 0)
  IF v_xp_to_add > 0 THEN
    UPDATE users
    SET total_xp = COALESCE(total_xp, 0) + v_xp_to_add
    WHERE id = p_user_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'submission_id', v_submission_id,
    'xp_awarded', v_xp_to_add
  );
END;
$$;


-- 4. RECYCLE CARD (oddaj duplikat za XP)
-- Atomowo: delete user_card + decrement sold_count + add XP
CREATE OR REPLACE FUNCTION recycle_card(
  p_user_id UUID,
  p_user_card_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_card RECORD;
  v_card RECORD;
  v_count INT;
  v_xp_gained INT;
BEGIN
  -- Pobierz kartę użytkownika
  SELECT uc.*, c.rarity, c.total_supply, c.sold_count, c.id as card_real_id
  INTO v_user_card
  FROM user_cards uc
  JOIN cards c ON c.id = uc.card_id
  WHERE uc.id = p_user_card_id AND uc.user_id = p_user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Nie znaleziono karty');
  END IF;

  -- Sprawdź czy ma więcej niż 1 sztukę
  SELECT COUNT(*) INTO v_count
  FROM user_cards
  WHERE user_id = p_user_id AND card_id = v_user_card.card_id;

  IF v_count < 2 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Nie możesz oddać ostatniej karty tego typu');
  END IF;

  -- XP za rzadkość
  v_xp_gained := CASE v_user_card.rarity
    WHEN 'legendary' THEN 10
    WHEN 'epic' THEN 5
    WHEN 'rare' THEN 2
    ELSE 1
  END;

  -- 1. Usuń kartę
  DELETE FROM user_cards WHERE id = p_user_card_id;

  -- 2. Zmniejsz sold_count (jeśli jest limit)
  IF v_user_card.total_supply IS NOT NULL THEN
    UPDATE cards
    SET sold_count = GREATEST(0, COALESCE(sold_count, 1) - 1)
    WHERE id = v_user_card.card_real_id;
  END IF;

  -- 3. Dodaj XP
  UPDATE users
  SET total_xp = COALESCE(total_xp, 0) + v_xp_gained
  WHERE id = p_user_id;

  RETURN jsonb_build_object('success', true, 'xp_gained', v_xp_gained);
END;
$$;
