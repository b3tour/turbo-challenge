-- =====================================================
-- TURBO CHALLENGE - System powiadomień i treść aplikacji
-- =====================================================
-- Uruchom w Supabase SQL Editor

-- =====================================================
-- TABELA: announcements (powiadomienia od admina)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(20) DEFAULT 'info' CHECK (type IN ('info', 'warning', 'success', 'urgent')),
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE
);

-- =====================================================
-- TABELA: announcement_reads (przeczytane przez użytkowników)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.announcement_reads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    announcement_id UUID REFERENCES public.announcements(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    read_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(announcement_id, user_id)
);

-- =====================================================
-- TABELA: app_content (edytowalna treść aplikacji)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.app_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section_key VARCHAR(50) NOT NULL UNIQUE,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    icon VARCHAR(50) DEFAULT 'info',
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEKSY
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_announcements_active ON public.announcements(is_active, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_announcement_reads_user ON public.announcement_reads(user_id);
CREATE INDEX IF NOT EXISTS idx_app_content_order ON public.app_content(display_order);

-- =====================================================
-- RLS dla announcements
-- =====================================================
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- Wszyscy mogą czytać aktywne ogłoszenia
DROP POLICY IF EXISTS "Anyone can read active announcements" ON public.announcements;
CREATE POLICY "Anyone can read active announcements" ON public.announcements
    FOR SELECT USING (is_active = true);

-- Tylko admini mogą tworzyć/edytować/usuwać ogłoszenia
DROP POLICY IF EXISTS "Admins can manage announcements" ON public.announcements;
CREATE POLICY "Admins can manage announcements" ON public.announcements
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true)
    );

-- =====================================================
-- RLS dla announcement_reads
-- =====================================================
ALTER TABLE public.announcement_reads ENABLE ROW LEVEL SECURITY;

-- Użytkownicy mogą zarządzać swoimi odczytami
DROP POLICY IF EXISTS "Users can manage their reads" ON public.announcement_reads;
CREATE POLICY "Users can manage their reads" ON public.announcement_reads
    FOR ALL USING (user_id = auth.uid());

-- =====================================================
-- RLS dla app_content
-- =====================================================
ALTER TABLE public.app_content ENABLE ROW LEVEL SECURITY;

-- Wszyscy mogą czytać aktywną treść
DROP POLICY IF EXISTS "Anyone can read active content" ON public.app_content;
CREATE POLICY "Anyone can read active content" ON public.app_content
    FOR SELECT USING (is_active = true);

-- Admini mogą wszystko
DROP POLICY IF EXISTS "Admins can read all content" ON public.app_content;
CREATE POLICY "Admins can read all content" ON public.app_content
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true)
    );

DROP POLICY IF EXISTS "Admins can manage content" ON public.app_content;
CREATE POLICY "Admins can manage content" ON public.app_content
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true)
    );

-- =====================================================
-- UPRAWNIENIA
-- =====================================================
GRANT SELECT ON public.announcements TO authenticated;
GRANT ALL ON public.announcement_reads TO authenticated;
GRANT SELECT ON public.app_content TO authenticated;

-- =====================================================
-- WŁĄCZ REALTIME dla announcements
-- =====================================================
-- W Supabase Dashboard > Database > Replication
-- Włącz "announcements" w tabeli replication

-- =====================================================
-- GOTOWE!
-- =====================================================
