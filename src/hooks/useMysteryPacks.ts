'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { MysteryPackType, MysteryPackPurchase, CollectibleCard, CardRarity } from '@/types';

interface UseMysteryPacksOptions {
  userId?: string;
}

// Domyślne pakiety (używane gdy brak w bazie)
const DEFAULT_PACK_TYPES: MysteryPackType[] = [
  {
    id: 'starter',
    name: 'Starter Pack',
    description: '3 losowe karty - idealne na początek!',
    size: 'small',
    card_count: 3,
    price: 15,
    common_chance: 70,
    rare_chance: 20,
    epic_chance: 8,
    legendary_chance: 2,
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'turbo',
    name: 'Turbo Pack',
    description: '5 kart z większą szansą na rzadkie!',
    size: 'medium',
    card_count: 5,
    price: 25,
    common_chance: 55,
    rare_chance: 28,
    epic_chance: 13,
    legendary_chance: 4,
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'mega',
    name: 'Mega Garage',
    description: '10 kart + gwarantowana Epic lub lepsza!',
    size: 'large',
    card_count: 10,
    price: 45,
    common_chance: 45,
    rare_chance: 30,
    epic_chance: 18,
    legendary_chance: 7,
    is_active: true,
    created_at: new Date().toISOString(),
  },
];

// Generuj unikalny kod zamówienia
function generateOrderCode(): string {
  const prefix = 'MG';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

export function useMysteryPacks(options: UseMysteryPacksOptions = {}) {
  const { userId } = options;

  const [packTypes, setPackTypes] = useState<MysteryPackType[]>(DEFAULT_PACK_TYPES);
  const [myPurchases, setMyPurchases] = useState<MysteryPackPurchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pobierz typy pakietów
  const fetchPackTypes = useCallback(async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('mystery_pack_types')
        .select('*')
        .eq('is_active', true)
        .order('price', { ascending: true });

      if (!fetchError && data && data.length > 0) {
        setPackTypes(data);
      }
    } catch (e) {
      console.log('Using default pack types');
    }
  }, []);

  // Pobierz moje zakupy
  const fetchMyPurchases = useCallback(async () => {
    if (!userId) return;

    try {
      const { data, error: fetchError } = await supabase
        .from('mystery_pack_purchases')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (!fetchError && data) {
        setMyPurchases(data);
      }
    } catch (e) {
      console.error('Error fetching purchases:', e);
    }
  }, [userId]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchPackTypes();
      await fetchMyPurchases();
      setLoading(false);
    };
    init();
  }, [fetchPackTypes, fetchMyPurchases]);

  // Kup pakiet (utwórz zamówienie)
  const purchasePack = useCallback(async (
    packTypeId: string
  ): Promise<{ success: boolean; error?: string; purchase?: MysteryPackPurchase }> => {
    if (!userId) return { success: false, error: 'Nie jesteś zalogowany' };

    const packType = packTypes.find(p => p.id === packTypeId);
    if (!packType) return { success: false, error: 'Nieznany typ pakietu' };

    const orderCode = generateOrderCode();

    const { data, error: insertError } = await supabase
      .from('mystery_pack_purchases')
      .insert({
        user_id: userId,
        pack_type_id: packTypeId,
        order_code: orderCode,
        amount: packType.price,
        status: 'pending',
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error purchasing pack:', insertError);
      return { success: false, error: insertError.message };
    }

    await fetchMyPurchases();
    return { success: true, purchase: data };
  }, [userId, packTypes, fetchMyPurchases]);

  // Losuj rzadkość na podstawie szans pakietu
  const rollRarity = (packType: MysteryPackType): CardRarity => {
    const roll = Math.random() * 100;

    if (roll < packType.legendary_chance) {
      return 'legendary';
    } else if (roll < packType.legendary_chance + packType.epic_chance) {
      return 'epic';
    } else if (roll < packType.legendary_chance + packType.epic_chance + packType.rare_chance) {
      return 'rare';
    } else {
      return 'common';
    }
  };

  // Otwórz pakiet (losuj karty) - wywoływane przez admina po zaksięgowaniu płatności
  const openPack = useCallback(async (
    purchaseId: string
  ): Promise<{ success: boolean; error?: string; cards?: CollectibleCard[] }> => {
    // Pobierz zakup
    const { data: purchase, error: purchaseError } = await supabase
      .from('mystery_pack_purchases')
      .select('*, pack_type:mystery_pack_types(*)')
      .eq('id', purchaseId)
      .single();

    if (purchaseError || !purchase) {
      return { success: false, error: 'Nie znaleziono zakupu' };
    }

    if (purchase.status === 'opened') {
      return { success: false, error: 'Pakiet już został otwarty' };
    }

    if (purchase.status !== 'paid') {
      return { success: false, error: 'Pakiet nie został jeszcze opłacony' };
    }

    const packType = purchase.pack_type as MysteryPackType;
    if (!packType) {
      return { success: false, error: 'Nieznany typ pakietu' };
    }

    // Pobierz dostępne karty samochodów
    const { data: allCards, error: cardsError } = await supabase
      .from('collectible_cards')
      .select('*')
      .eq('card_type', 'car')
      .eq('is_active', true);

    if (cardsError || !allCards || allCards.length === 0) {
      return { success: false, error: 'Brak dostępnych kart w systemie' };
    }

    // Filtruj karty które mają jeszcze dostępne sztuki
    const availableCards = allCards.filter(card => {
      if (!card.total_supply) return true; // Nieograniczona ilość
      return (card.sold_count || 0) < card.total_supply;
    });

    if (availableCards.length === 0) {
      return { success: false, error: 'Wszystkie karty zostały rozdane' };
    }

    // Grupuj karty po rzadkości
    const cardsByRarity: Record<CardRarity, CollectibleCard[]> = {
      common: availableCards.filter(c => c.rarity === 'common'),
      rare: availableCards.filter(c => c.rarity === 'rare'),
      epic: availableCards.filter(c => c.rarity === 'epic'),
      legendary: availableCards.filter(c => c.rarity === 'legendary'),
    };

    // Losuj karty
    const selectedCards: CollectibleCard[] = [];
    const cardCount = packType.card_count;

    // Dla dużego pakietu - gwarantowana Epic+
    let guaranteedEpicPlus = packType.size === 'large';

    for (let i = 0; i < cardCount; i++) {
      let targetRarity = rollRarity(packType);

      // Ostatnia karta w dużym pakiecie - gwarantuj Epic+
      if (guaranteedEpicPlus && i === cardCount - 1 &&
          !selectedCards.some(c => c.rarity === 'epic' || c.rarity === 'legendary')) {
        targetRarity = Math.random() < 0.3 ? 'legendary' : 'epic';
      }

      // Znajdź dostępną kartę o danej rzadkości
      let pool = cardsByRarity[targetRarity];

      // Jeśli brak kart o danej rzadkości, szukaj niższej
      if (pool.length === 0) {
        const fallbackOrder: CardRarity[] = ['epic', 'rare', 'common'];
        for (const fallback of fallbackOrder) {
          if (cardsByRarity[fallback].length > 0) {
            pool = cardsByRarity[fallback];
            break;
          }
        }
      }

      if (pool.length === 0) continue;

      // Losuj kartę z puli
      const randomIndex = Math.floor(Math.random() * pool.length);
      const selectedCard = pool[randomIndex];
      selectedCards.push(selectedCard);

      // Aktualizuj sold_count jeśli jest limit
      if (selectedCard.total_supply) {
        const newSoldCount = (selectedCard.sold_count || 0) + 1;

        // Aktualizuj w bazie
        await supabase
          .from('collectible_cards')
          .update({ sold_count: newSoldCount })
          .eq('id', selectedCard.id);

        // Usuń z puli jeśli osiągnięto limit
        if (newSoldCount >= selectedCard.total_supply) {
          const index = cardsByRarity[selectedCard.rarity].findIndex(c => c.id === selectedCard.id);
          if (index > -1) {
            cardsByRarity[selectedCard.rarity].splice(index, 1);
          }
        }
      }
    }

    // Dodaj karty do kolekcji użytkownika
    const userCards = selectedCards.map(card => ({
      user_id: purchase.user_id,
      card_id: card.id,
      obtained_from: 'purchase' as const,
    }));

    const { error: insertError } = await supabase
      .from('user_cards')
      .insert(userCards);

    if (insertError) {
      console.error('Error adding cards to user:', insertError);
      return { success: false, error: 'Błąd dodawania kart do kolekcji' };
    }

    // Zaktualizuj status zakupu
    await supabase
      .from('mystery_pack_purchases')
      .update({
        status: 'opened',
        cards_received: selectedCards.map(c => c.id),
        opened_at: new Date().toISOString(),
      })
      .eq('id', purchaseId);

    // Dodaj XP za zakup (1 XP za kartę)
    await supabase.rpc('add_xp', {
      user_id: purchase.user_id,
      xp_amount: selectedCards.length,
    });

    // Zaktualizuj donation_total użytkownika
    await supabase.rpc('add_donation', {
      user_id: purchase.user_id,
      amount: purchase.amount,
    });

    await fetchMyPurchases();
    return { success: true, cards: selectedCards };
  }, [fetchMyPurchases]);

  // Zatwierdź płatność (dla admina)
  const confirmPayment = useCallback(async (
    purchaseId: string
  ): Promise<{ success: boolean; error?: string }> => {
    const { error: updateError } = await supabase
      .from('mystery_pack_purchases')
      .update({
        status: 'paid',
        paid_at: new Date().toISOString(),
      })
      .eq('id', purchaseId);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    // Automatycznie otwórz pakiet po potwierdzeniu płatności
    const result = await openPack(purchaseId);
    return result;
  }, [openPack]);

  // Recykling karty za XP
  const recycleCard = useCallback(async (
    userCardId: string
  ): Promise<{ success: boolean; error?: string; xpGained?: number }> => {
    if (!userId) return { success: false, error: 'Nie jesteś zalogowany' };

    // Pobierz kartę użytkownika
    const { data: userCard, error: fetchError } = await supabase
      .from('user_cards')
      .select('*, card:collectible_cards(*)')
      .eq('id', userCardId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !userCard) {
      return { success: false, error: 'Nie znaleziono karty' };
    }

    // Sprawdź czy użytkownik ma więcej niż 1 sztukę tej karty
    const { count } = await supabase
      .from('user_cards')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('card_id', userCard.card_id);

    if (!count || count < 2) {
      return { success: false, error: 'Nie możesz oddać ostatniej karty tego typu' };
    }

    // Określ XP za recykling według rzadkości
    const card = userCard.card as CollectibleCard;
    let xpGained = 1; // domyślnie 1 XP
    switch (card.rarity) {
      case 'rare': xpGained = 2; break;
      case 'epic': xpGained = 5; break;
      case 'legendary': xpGained = 10; break;
    }

    // Usuń kartę z kolekcji
    const { error: deleteError } = await supabase
      .from('user_cards')
      .delete()
      .eq('id', userCardId);

    if (deleteError) {
      return { success: false, error: deleteError.message };
    }

    // Zwróć kartę do puli (zmniejsz sold_count)
    if (card.total_supply) {
      const newSoldCount = Math.max(0, (card.sold_count || 1) - 1);
      await supabase
        .from('collectible_cards')
        .update({ sold_count: newSoldCount })
        .eq('id', card.id);
    }

    // Dodaj XP
    await supabase.rpc('add_xp', {
      user_id: userId,
      xp_amount: xpGained,
    });

    return { success: true, xpGained };
  }, [userId]);

  // Pobierz duplikaty użytkownika
  const getDuplicates = useCallback(async (): Promise<{
    cardId: string;
    card: CollectibleCard;
    count: number;
    userCardIds: string[];
  }[]> => {
    if (!userId) return [];

    const { data: userCards, error } = await supabase
      .from('user_cards')
      .select('id, card_id, card:collectible_cards(*)')
      .eq('user_id', userId);

    if (error || !userCards) return [];

    // Grupuj po card_id i znajdź te z count > 1
    const cardCounts = new Map<string, {
      card: CollectibleCard;
      count: number;
      userCardIds: string[];
    }>();

    userCards.forEach(uc => {
      const existing = cardCounts.get(uc.card_id);
      if (existing) {
        existing.count++;
        existing.userCardIds.push(uc.id);
      } else {
        cardCounts.set(uc.card_id, {
          card: uc.card as unknown as CollectibleCard,
          count: 1,
          userCardIds: [uc.id],
        });
      }
    });

    // Filtruj tylko duplikaty
    return Array.from(cardCounts.entries())
      .filter(([_, data]) => data.count > 1)
      .map(([cardId, data]) => ({
        cardId,
        ...data,
      }));
  }, [userId]);

  // Pobierz oczekujące zakupy (dla admina)
  const getPendingPurchases = useCallback(async (): Promise<MysteryPackPurchase[]> => {
    const { data, error } = await supabase
      .from('mystery_pack_purchases')
      .select('*, user:users(nick, email), pack_type:mystery_pack_types(*)')
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (error || !data) return [];
    return data;
  }, []);

  return {
    packTypes,
    myPurchases,
    loading,
    error,
    purchasePack,
    openPack,
    confirmPayment,
    recycleCard,
    getDuplicates,
    getPendingPurchases,
    refetch: fetchMyPurchases,
  };
}
