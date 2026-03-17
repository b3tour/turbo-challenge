import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Service Role client — omija RLS (admin-only endpoint)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Supabase client z sesją użytkownika (do weryfikacji admina)
const supabaseAuth = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export async function POST(request: NextRequest) {
  try {
    const { purchaseId } = await request.json();

    if (!purchaseId) {
      return NextResponse.json({ error: 'Brak ID zakupu' }, { status: 400 });
    }

    // Weryfikuj admina po Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Brak autoryzacji' }, { status: 401 });
    }

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return NextResponse.json({ error: 'Nieprawidłowy token' }, { status: 401 });
    }

    // Sprawdź czy to admin
    const { data: profile } = await supabaseAdmin
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Brak uprawnień administratora' }, { status: 403 });
    }

    // Pobierz zakup
    const { data: purchase, error: purchaseError } = await supabaseAdmin
      .from('mystery_pack_purchases')
      .select('*')
      .eq('id', purchaseId)
      .single();

    if (purchaseError || !purchase) {
      return NextResponse.json({ error: 'Nie znaleziono zakupu' }, { status: 404 });
    }

    if (purchase.status !== 'paid') {
      return NextResponse.json({ error: `Pakiet ma status "${purchase.status}", a musi być "paid"` }, { status: 400 });
    }

    // Pobierz typ pakietu
    const { data: packType } = await supabaseAdmin
      .from('mystery_pack_types')
      .select('*')
      .eq('id', purchase.pack_type_id)
      .single();

    if (!packType) {
      return NextResponse.json({ error: 'Nieznany typ pakietu' }, { status: 400 });
    }

    // Pobierz dostępne karty samochodów
    const { data: availableCards } = await supabaseAdmin
      .from('cards')
      .select('*')
      .eq('card_type', 'car')
      .eq('is_active', true);

    if (!availableCards || availableCards.length === 0) {
      return NextResponse.json({ error: 'Brak dostępnych kart w systemie' }, { status: 400 });
    }

    // Grupuj karty po rzadkości
    const cardsByRarity: Record<string, typeof availableCards> = {
      common: availableCards.filter(c => c.rarity === 'common'),
      rare: availableCards.filter(c => c.rarity === 'rare'),
      epic: availableCards.filter(c => c.rarity === 'epic'),
      legendary: availableCards.filter(c => c.rarity === 'legendary'),
    };

    const rollRarity = (): string => {
      const roll = Math.random() * 100;
      if (roll < (packType.legendary_chance || 3)) return 'legendary';
      if (roll < (packType.legendary_chance || 3) + (packType.epic_chance || 12)) return 'epic';
      if (roll < (packType.legendary_chance || 3) + (packType.epic_chance || 12) + (packType.rare_chance || 25)) return 'rare';
      return 'common';
    };

    // Losuj karty
    const cardCount = packType.card_count || 3;
    const selectedCards: typeof availableCards = [];

    for (let i = 0; i < cardCount; i++) {
      let targetRarity = rollRarity();

      // Dla dużego pakietu — ostatnia karta gwarantowana Epic+
      if (packType.size === 'large' && i === cardCount - 1 &&
          !selectedCards.some(c => c.rarity === 'epic' || c.rarity === 'legendary')) {
        targetRarity = Math.random() < 0.3 ? 'legendary' : 'epic';
      }

      let pool = cardsByRarity[targetRarity];
      if (!pool || pool.length === 0) {
        for (const fallback of ['epic', 'rare', 'common']) {
          if (cardsByRarity[fallback] && cardsByRarity[fallback].length > 0) {
            pool = cardsByRarity[fallback];
            break;
          }
        }
      }

      if (pool && pool.length > 0) {
        const randomIndex = Math.floor(Math.random() * pool.length);
        selectedCards.push(pool[randomIndex]);
      }
    }

    // Dodaj karty do kolekcji (service_role omija RLS)
    const userCards = selectedCards.map(card => ({
      user_id: purchase.user_id,
      card_id: card.id,
      obtained_from: 'purchase',
    }));

    const { error: insertError } = await supabaseAdmin
      .from('user_cards')
      .insert(userCards);

    if (insertError) {
      console.error('Open pack: insert user_cards error:', insertError);
      return NextResponse.json({ error: `Błąd dodawania kart: ${insertError.message}` }, { status: 500 });
    }

    // Zaktualizuj status na 'opened'
    const { error: updateError } = await supabaseAdmin
      .from('mystery_pack_purchases')
      .update({
        status: 'opened',
        cards_received: selectedCards.map(c => c.id),
        opened_at: new Date().toISOString(),
      })
      .eq('id', purchase.id);

    if (updateError) {
      console.error('Open pack: update status error:', updateError);
    }

    // Dodaj do donation_total
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('donation_total, total_xp')
      .eq('id', purchase.user_id)
      .single();

    if (userData) {
      await supabaseAdmin
        .from('users')
        .update({
          donation_total: (userData.donation_total || 0) + purchase.amount,
          total_xp: (userData.total_xp || 0) + selectedCards.length,
        })
        .eq('id', purchase.user_id);
    }

    // Powiadomienie dla gracza
    await supabaseAdmin.from('notifications').insert({
      user_id: purchase.user_id,
      title: 'Pakiet otwarty!',
      message: `Twój pakiet ${packType.name} został otwarty! Sprawdź nowe karty w kolekcji.`,
      type: 'system',
      read: false,
    });

    // Podsumowanie wylosowanych kart
    const rarityNames: Record<string, string> = {
      common: 'zwykłych', rare: 'rzadkich', epic: 'epickich', legendary: 'legendarnych'
    };
    const summary = selectedCards.reduce((acc, c) => {
      acc[c.rarity] = (acc[c.rarity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const summaryText = Object.entries(summary)
      .map(([rarity, count]) => `${count} ${rarityNames[rarity] || rarity}`)
      .join(', ');

    return NextResponse.json({
      success: true,
      summary: summaryText,
      cards: selectedCards.map(c => ({ id: c.id, name: c.name, rarity: c.rarity })),
    });
  } catch (error) {
    console.error('Open pack error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Nieoczekiwany błąd serwera' },
      { status: 500 }
    );
  }
}
