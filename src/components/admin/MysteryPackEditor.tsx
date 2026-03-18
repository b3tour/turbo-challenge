'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { MysteryPackType } from '@/types';
import { Card, Button, Badge, Modal } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';
import { Package, Gift, Trophy, Plus, Pencil, ToggleLeft, ToggleRight } from 'lucide-react';

const SIZE_LABELS: Record<string, { label: string; icon: React.ElementType }> = {
  small: { label: 'Mały', icon: Package },
  medium: { label: 'Średni', icon: Gift },
  large: { label: 'Duży', icon: Trophy },
};

interface PackFormData {
  name: string;
  description: string;
  size: 'small' | 'medium' | 'large';
  card_count: number;
  price: number;
  common_chance: number;
  rare_chance: number;
  epic_chance: number;
  legendary_chance: number;
  is_active: boolean;
}

const EMPTY_FORM: PackFormData = {
  name: '',
  description: '',
  size: 'small',
  card_count: 3,
  price: 15,
  common_chance: 70,
  rare_chance: 20,
  epic_chance: 8,
  legendary_chance: 2,
  is_active: true,
};

export function MysteryPackEditor() {
  const [packs, setPacks] = useState<MysteryPackType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPack, setEditingPack] = useState<MysteryPackType | null>(null);
  const [form, setForm] = useState<PackFormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const { success, error: showError } = useToast();

  const fetchPacks = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('mystery_pack_types')
      .select('*')
      .order('price', { ascending: true });

    if (!error && data) {
      setPacks(data as MysteryPackType[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchPacks(); }, [fetchPacks]);

  const openCreate = () => {
    setEditingPack(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (pack: MysteryPackType) => {
    setEditingPack(pack);
    setForm({
      name: pack.name,
      description: pack.description,
      size: pack.size as 'small' | 'medium' | 'large',
      card_count: pack.card_count,
      price: pack.price,
      common_chance: pack.common_chance,
      rare_chance: pack.rare_chance,
      epic_chance: pack.epic_chance,
      legendary_chance: pack.legendary_chance,
      is_active: pack.is_active,
    });
    setShowModal(true);
  };

  const chanceTotal = form.common_chance + form.rare_chance + form.epic_chance + form.legendary_chance;

  const handleSave = async () => {
    if (!form.name.trim()) { showError('Błąd', 'Nazwa jest wymagana'); return; }
    if (chanceTotal !== 100) { showError('Błąd', `Szanse muszą sumować się do 100% (teraz: ${chanceTotal}%)`); return; }

    setSaving(true);

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      size: form.size,
      card_count: form.card_count,
      price: form.price,
      common_chance: form.common_chance,
      rare_chance: form.rare_chance,
      epic_chance: form.epic_chance,
      legendary_chance: form.legendary_chance,
      is_active: form.is_active,
    };

    if (editingPack) {
      const { error } = await supabase
        .from('mystery_pack_types')
        .update(payload)
        .eq('id', editingPack.id);

      if (error) {
        showError('Błąd', error.message);
      } else {
        success('Zapisano!', `Pakiet "${form.name}" zaktualizowany`);
        setShowModal(false);
        fetchPacks();
      }
    } else {
      const { error } = await supabase
        .from('mystery_pack_types')
        .insert(payload);

      if (error) {
        showError('Błąd', error.message);
      } else {
        success('Dodano!', `Pakiet "${form.name}" utworzony`);
        setShowModal(false);
        fetchPacks();
      }
    }

    setSaving(false);
  };

  const toggleActive = async (pack: MysteryPackType) => {
    const { error } = await supabase
      .from('mystery_pack_types')
      .update({ is_active: !pack.is_active })
      .eq('id', pack.id);

    if (!error) {
      success(pack.is_active ? 'Wyłączono' : 'Włączono', `Pakiet "${pack.name}" ${pack.is_active ? 'ukryty' : 'aktywny'}`);
      fetchPacks();
    }
  };

  if (loading) {
    return <div className="text-center py-4 text-dark-400">Ładowanie pakietów...</div>;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-white">Typy pakietów</h4>
        <Button variant="secondary" size="sm" onClick={openCreate}>
          <Plus className="w-3 h-3 mr-1" />
          Dodaj
        </Button>
      </div>

      {packs.length === 0 ? (
        <p className="text-sm text-dark-500">Brak pakietów. Dodaj pierwszy!</p>
      ) : (
        <div className="grid gap-2">
          {packs.map(pack => {
            const SizeIcon = SIZE_LABELS[pack.size]?.icon || Package;
            return (
              <Card key={pack.id} className={`p-3 ${!pack.is_active ? 'opacity-50' : ''}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    pack.size === 'large' ? 'bg-yellow-500/20' :
                    pack.size === 'medium' ? 'bg-purple-500/20' : 'bg-slate-500/20'
                  }`}>
                    <SizeIcon className={`w-5 h-5 ${
                      pack.size === 'large' ? 'text-yellow-400' :
                      pack.size === 'medium' ? 'text-purple-400' : 'text-slate-400'
                    }`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white text-sm">{pack.name}</span>
                      {!pack.is_active && <Badge variant="default" size="sm">Ukryty</Badge>}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-dark-400 mt-0.5">
                      <span className="font-bold text-white">{pack.price} zł</span>
                      <span>{pack.card_count} kart</span>
                      <span className="text-slate-400">{pack.common_chance}%</span>
                      <span className="text-blue-400">{pack.rare_chance}%</span>
                      <span className="text-purple-400">{pack.epic_chance}%</span>
                      <span className="text-yellow-400">{pack.legendary_chance}%</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => toggleActive(pack)}
                      className="p-1.5 rounded-lg hover:bg-dark-700 transition-colors"
                      title={pack.is_active ? 'Wyłącz' : 'Włącz'}
                    >
                      {pack.is_active
                        ? <ToggleRight className="w-5 h-5 text-green-400" />
                        : <ToggleLeft className="w-5 h-5 text-dark-500" />
                      }
                    </button>
                    <button
                      onClick={() => openEdit(pack)}
                      className="p-1.5 rounded-lg hover:bg-dark-700 transition-colors"
                    >
                      <Pencil className="w-4 h-4 text-dark-400" />
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal edycji/tworzenia */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingPack ? `Edytuj: ${editingPack.name}` : 'Nowy pakiet Mystery'}
      >
        <div className="space-y-4">
          {/* Nazwa */}
          <div>
            <label className="block text-xs text-dark-400 mb-1">Nazwa pakietu</label>
            <input
              className="w-full px-3 py-2 bg-surface-2 border border-dark-600 rounded-lg text-white text-sm focus:border-turbo-500 focus:outline-none"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="np. Turbo Pack"
            />
          </div>

          {/* Opis */}
          <div>
            <label className="block text-xs text-dark-400 mb-1">Opis</label>
            <input
              className="w-full px-3 py-2 bg-surface-2 border border-dark-600 rounded-lg text-white text-sm focus:border-turbo-500 focus:outline-none"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="np. 5 kart z większą szansą na rzadkie!"
            />
          </div>

          {/* Rozmiar + cena + ilość kart */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-dark-400 mb-1">Rozmiar</label>
              <select
                className="w-full px-3 py-2 bg-surface-2 border border-dark-600 rounded-lg text-white text-sm focus:border-turbo-500 focus:outline-none"
                value={form.size}
                onChange={e => setForm(f => ({ ...f, size: e.target.value as PackFormData['size'] }))}
              >
                <option value="small">Mały</option>
                <option value="medium">Średni</option>
                <option value="large">Duży</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-dark-400 mb-1">Cena (zł)</label>
              <input
                type="number"
                className="w-full px-3 py-2 bg-surface-2 border border-dark-600 rounded-lg text-white text-sm focus:border-turbo-500 focus:outline-none"
                value={form.price}
                onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))}
                min={1}
              />
            </div>
            <div>
              <label className="block text-xs text-dark-400 mb-1">Ile kart</label>
              <input
                type="number"
                className="w-full px-3 py-2 bg-surface-2 border border-dark-600 rounded-lg text-white text-sm focus:border-turbo-500 focus:outline-none"
                value={form.card_count}
                onChange={e => setForm(f => ({ ...f, card_count: Number(e.target.value) }))}
                min={1}
                max={20}
              />
            </div>
          </div>

          {/* Szanse na rzadkość */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-dark-400">Szanse na rzadkość (%)</label>
              <span className={`text-xs font-bold ${chanceTotal === 100 ? 'text-green-400' : 'text-red-400'}`}>
                Suma: {chanceTotal}%
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              <div>
                <label className="block text-[10px] text-slate-400 mb-0.5">Common</label>
                <input
                  type="number"
                  className="w-full px-2 py-1.5 bg-surface-2 border border-dark-600 rounded-lg text-slate-300 text-sm text-center focus:border-turbo-500 focus:outline-none"
                  value={form.common_chance}
                  onChange={e => setForm(f => ({ ...f, common_chance: Number(e.target.value) }))}
                  min={0}
                  max={100}
                />
              </div>
              <div>
                <label className="block text-[10px] text-blue-400 mb-0.5">Rare</label>
                <input
                  type="number"
                  className="w-full px-2 py-1.5 bg-surface-2 border border-dark-600 rounded-lg text-blue-300 text-sm text-center focus:border-turbo-500 focus:outline-none"
                  value={form.rare_chance}
                  onChange={e => setForm(f => ({ ...f, rare_chance: Number(e.target.value) }))}
                  min={0}
                  max={100}
                />
              </div>
              <div>
                <label className="block text-[10px] text-purple-400 mb-0.5">Epic</label>
                <input
                  type="number"
                  className="w-full px-2 py-1.5 bg-surface-2 border border-dark-600 rounded-lg text-purple-300 text-sm text-center focus:border-turbo-500 focus:outline-none"
                  value={form.epic_chance}
                  onChange={e => setForm(f => ({ ...f, epic_chance: Number(e.target.value) }))}
                  min={0}
                  max={100}
                />
              </div>
              <div>
                <label className="block text-[10px] text-yellow-400 mb-0.5">Legendary</label>
                <input
                  type="number"
                  className="w-full px-2 py-1.5 bg-surface-2 border border-dark-600 rounded-lg text-yellow-300 text-sm text-center focus:border-turbo-500 focus:outline-none"
                  value={form.legendary_chance}
                  onChange={e => setForm(f => ({ ...f, legendary_chance: Number(e.target.value) }))}
                  min={0}
                  max={100}
                />
              </div>
            </div>
          </div>

          {/* Aktywny */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
              className="w-4 h-4 rounded border-dark-600 bg-surface-2 text-turbo-500 focus:ring-turbo-500"
            />
            <span className="text-sm text-white">Aktywny (widoczny dla graczy)</span>
          </label>

          {/* Zapisz */}
          <Button onClick={handleSave} loading={saving} fullWidth>
            {editingPack ? 'Zapisz zmiany' : 'Utwórz pakiet'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
