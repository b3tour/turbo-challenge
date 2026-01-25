'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface AppContentSection {
  id: string;
  section_key: string;
  title: string;
  content: string;
  icon?: string;
  display_order: number;
  is_active: boolean;
  updated_at: string;
}

// Domyślna treść (używana gdy baza jest pusta)
export const DEFAULT_APP_CONTENT: Omit<AppContentSection, 'id' | 'updated_at'>[] = [
  {
    section_key: 'intro',
    title: 'Czym jest Turbo Challenge?',
    content: 'Gra kolekcjonerska stworzona przez Fundację Turbo Pomoc. Zbieraj karty legendarnych samochodów, wykonuj misje i rywalizuj z innymi!',
    icon: 'info',
    display_order: 0,
    is_active: true,
  },
  {
    section_key: 'xp',
    title: 'Jak zdobywać punkty XP?',
    content: 'Punkty XP to Twoja waluta doświadczenia. Im więcej masz XP, tym wyżej jesteś w rankingu.\n\n• Wykonuj misje - skanuj QR, rób zdjęcia, rozwiązuj quizy\n• Kupuj karty - każda karta daje bonus XP\n• Mystery Garage - losowe karty = losowe XP\n• Turbo Bitwy - pokonuj innych graczy',
    icon: 'zap',
    display_order: 1,
    is_active: true,
  },
  {
    section_key: 'cards',
    title: 'Karty kolekcjonerskie',
    content: 'Każda karta to unikalny samochód z prawdziwymi statystykami: moc, moment obrotowy, prędkość.\n\nRzadkości: Common (szara), Rare (niebieska), Epic (fioletowa), Legendary (złota).\n\nJak zdobyć: Kup pojedynczą kartę, otwórz pakiet Mystery Garage lub wygraj bitwę.',
    icon: 'layers',
    display_order: 2,
    is_active: true,
  },
  {
    section_key: 'missions',
    title: 'Misje',
    content: 'Misje to zadania, za które dostajesz XP:\n\n• QR Code - znajdź i zeskanuj kod QR\n• Zdjęcie - zrób zdjęcie według instrukcji\n• Quiz - odpowiedz poprawnie na pytania\n• GPS - odwiedź wskazaną lokalizację\n• Zadanie - wykonaj i poczekaj na weryfikację',
    icon: 'target',
    display_order: 3,
    is_active: true,
  },
  {
    section_key: 'mystery',
    title: 'Mystery Garage',
    content: 'Kup pakiet (3, 5 lub 10 kart) i dostań losowe samochody. Im droższy pakiet, tym większa szansa na rzadkie karty. To jak otwieranie paczek z naklejkami!',
    icon: 'gift',
    display_order: 4,
    is_active: true,
  },
  {
    section_key: 'battles',
    title: 'Turbo Bitwy',
    content: 'Pojedynki 1 na 1 z innymi graczami:\n\n1. Wybierasz jedną ze swoich kart\n2. System losuje kategorię (moc, moment, prędkość)\n3. Karta z lepszym wynikiem wygrywa\n4. Zwycięzca dostaje XP lub kartę przeciwnika',
    icon: 'swords',
    display_order: 5,
    is_active: true,
  },
  {
    section_key: 'rankings',
    title: 'Rankingi',
    content: 'Sprawdź jak wypadasz na tle innych graczy w Rankingu XP i Rankingu Wsparcia. Najlepsi gracze mogą liczyć na specjalne nagrody!',
    icon: 'trophy',
    display_order: 6,
    is_active: true,
  },
];

export function useAppContent() {
  const [sections, setSections] = useState<AppContentSection[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchContent = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('app_content')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;

      // Jeśli baza jest pusta, użyj domyślnej treści
      if (!data || data.length === 0) {
        setSections(DEFAULT_APP_CONTENT.map((s, i) => ({
          ...s,
          id: `default-${i}`,
          updated_at: new Date().toISOString(),
        })));
      } else {
        setSections(data);
      }
    } catch (e) {
      console.error('Error fetching app content:', e);
      // W razie błędu użyj domyślnej treści
      setSections(DEFAULT_APP_CONTENT.map((s, i) => ({
        ...s,
        id: `default-${i}`,
        updated_at: new Date().toISOString(),
      })));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  return { sections, loading, refresh: fetchContent };
}

// Hook dla admina
export function useAppContentAdmin() {
  const [sections, setSections] = useState<AppContentSection[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('app_content')
      .select('*')
      .order('display_order', { ascending: true });

    if (!error && data) {
      setSections(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const updateSection = async (id: string, updates: Partial<AppContentSection>) => {
    const { error } = await supabase
      .from('app_content')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    fetchAll();
    return { success: true, error: null };
  };

  const createSection = async (section: Omit<AppContentSection, 'id' | 'updated_at'>) => {
    const { error } = await supabase
      .from('app_content')
      .insert(section);

    if (error) {
      return { success: false, error: error.message };
    }

    fetchAll();
    return { success: true, error: null };
  };

  const deleteSection = async (id: string) => {
    const { error } = await supabase
      .from('app_content')
      .delete()
      .eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    fetchAll();
    return { success: true, error: null };
  };

  const initializeDefaults = async () => {
    // Sprawdź czy tabela jest pusta
    const { count } = await supabase
      .from('app_content')
      .select('*', { count: 'exact', head: true });

    if (count === 0) {
      const { error } = await supabase
        .from('app_content')
        .insert(DEFAULT_APP_CONTENT);

      if (error) {
        return { success: false, error: error.message };
      }

      fetchAll();
      return { success: true, error: null };
    }

    return { success: true, error: 'Treść już istnieje' };
  };

  return {
    sections,
    loading,
    updateSection,
    createSection,
    deleteSection,
    initializeDefaults,
    refresh: fetchAll
  };
}
