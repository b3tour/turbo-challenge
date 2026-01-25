'use client';

import { useState } from 'react';
import { Card, Button, Badge, Input, Modal } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';
import { useAppContentAdmin, AppContentSection, DEFAULT_APP_CONTENT } from '@/hooks/useAppContent';
import {
  FileText,
  Plus,
  Edit2,
  Trash2,
  Save,
  ToggleLeft,
  ToggleRight,
  RefreshCw,
  Loader2,
  ChevronUp,
  ChevronDown,
  Info,
  Zap,
  Layers,
  Target,
  Gift,
  Swords,
  Trophy,
} from 'lucide-react';

const iconOptions = [
  { value: 'info', label: 'Info', icon: Info },
  { value: 'zap', label: 'Zap', icon: Zap },
  { value: 'layers', label: 'Layers', icon: Layers },
  { value: 'target', label: 'Target', icon: Target },
  { value: 'gift', label: 'Gift', icon: Gift },
  { value: 'swords', label: 'Swords', icon: Swords },
  { value: 'trophy', label: 'Trophy', icon: Trophy },
];

export default function AppContentAdmin() {
  const { success, error: showError } = useToast();
  const { sections, loading, updateSection, createSection, deleteSection, initializeDefaults, refresh } = useAppContentAdmin();

  const [showModal, setShowModal] = useState(false);
  const [editingSection, setEditingSection] = useState<AppContentSection | null>(null);
  const [form, setForm] = useState({
    section_key: '',
    title: '',
    content: '',
    icon: 'info',
    display_order: 0,
    is_active: true,
  });
  const [saving, setSaving] = useState(false);
  const [initializing, setInitializing] = useState(false);

  const handleEdit = (section: AppContentSection) => {
    setEditingSection(section);
    setForm({
      section_key: section.section_key,
      title: section.title,
      content: section.content,
      icon: section.icon || 'info',
      display_order: section.display_order,
      is_active: section.is_active,
    });
    setShowModal(true);
  };

  const handleCreate = () => {
    setEditingSection(null);
    setForm({
      section_key: '',
      title: '',
      content: '',
      icon: 'info',
      display_order: sections.length,
      is_active: true,
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      showError('Błąd', 'Wypełnij tytuł i treść');
      return;
    }

    if (!form.section_key.trim()) {
      showError('Błąd', 'Podaj klucz sekcji (np. "intro", "missions")');
      return;
    }

    setSaving(true);

    let result;
    if (editingSection) {
      result = await updateSection(editingSection.id, form);
    } else {
      result = await createSection(form);
    }

    setSaving(false);

    if (result.success) {
      success(editingSection ? 'Zapisano!' : 'Utworzono!', 'Sekcja została zapisana');
      setShowModal(false);
    } else {
      showError('Błąd', result.error || 'Nie udało się zapisać');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Czy na pewno chcesz usunąć tę sekcję?')) return;

    const result = await deleteSection(id);
    if (result.success) {
      success('Usunięto', 'Sekcja została usunięta');
    } else {
      showError('Błąd', result.error || 'Nie udało się usunąć');
    }
  };

  const handleToggle = async (section: AppContentSection) => {
    const result = await updateSection(section.id, { is_active: !section.is_active });
    if (result.success) {
      success(section.is_active ? 'Wyłączono' : 'Włączono', 'Status sekcji został zmieniony');
    } else {
      showError('Błąd', result.error || 'Nie udało się zmienić statusu');
    }
  };

  const handleMoveUp = async (section: AppContentSection, index: number) => {
    if (index === 0) return;
    const prevSection = sections[index - 1];

    await updateSection(section.id, { display_order: prevSection.display_order });
    await updateSection(prevSection.id, { display_order: section.display_order });
    refresh();
  };

  const handleMoveDown = async (section: AppContentSection, index: number) => {
    if (index === sections.length - 1) return;
    const nextSection = sections[index + 1];

    await updateSection(section.id, { display_order: nextSection.display_order });
    await updateSection(nextSection.id, { display_order: section.display_order });
    refresh();
  };

  const handleInitializeDefaults = async () => {
    if (!confirm('Czy na pewno chcesz załadować domyślną treść? Obecne dane nie zostaną nadpisane.')) return;

    setInitializing(true);
    const result = await initializeDefaults();
    setInitializing(false);

    if (result.success && !result.error) {
      success('Załadowano!', 'Domyślna treść została dodana');
    } else if (result.error === 'Treść już istnieje') {
      showError('Info', 'Treść już istnieje w bazie danych');
    } else {
      showError('Błąd', result.error || 'Nie udało się załadować domyślnej treści');
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
            <FileText className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h2 className="font-bold text-white">Treść aplikacji</h2>
            <p className="text-sm text-dark-400">Edytuj informacje o aplikacji</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={handleInitializeDefaults} disabled={initializing}>
            {initializing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
          </Button>
          <Button onClick={handleCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Nowa sekcja
          </Button>
        </div>
      </div>

      {/* Sections list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <Card key={i} className="h-24 animate-pulse bg-dark-700" />
          ))}
        </div>
      ) : sections.length === 0 ? (
        <Card className="text-center py-12">
          <FileText className="w-16 h-16 text-dark-600 mx-auto mb-4" />
          <p className="text-dark-400">Brak treści</p>
          <p className="text-sm text-dark-500 mb-4">Kliknij przycisk poniżej aby załadować domyślną treść</p>
          <Button onClick={handleInitializeDefaults} disabled={initializing}>
            {initializing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Ładowanie...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Załaduj domyślną treść
              </>
            )}
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {sections.map((section, index) => {
            const IconComponent = iconOptions.find(i => i.value === section.icon)?.icon || Info;

            return (
              <Card
                key={section.id}
                className={`p-4 ${!section.is_active ? 'opacity-50' : ''}`}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/20">
                    <IconComponent className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-white">{section.title}</h3>
                      <Badge variant="default" size="sm">{section.section_key}</Badge>
                      {!section.is_active && (
                        <Badge variant="default" size="sm">Ukryte</Badge>
                      )}
                    </div>
                    <p className="text-sm text-dark-400 line-clamp-2">{section.content}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleMoveUp(section, index)}
                      disabled={index === 0}
                    >
                      <ChevronUp className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleMoveDown(section, index)}
                      disabled={index === sections.length - 1}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleToggle(section)}
                    >
                      {section.is_active ? (
                        <ToggleRight className="w-4 h-4" />
                      ) : (
                        <ToggleLeft className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleEdit(section)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleDelete(section.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Edit/Create Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingSection ? 'Edytuj sekcję' : 'Nowa sekcja'}
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Klucz sekcji"
              value={form.section_key}
              onChange={e => setForm(prev => ({ ...prev, section_key: e.target.value }))}
              placeholder="np. intro, missions"
              disabled={!!editingSection}
            />
            <div>
              <label className="block text-sm font-medium text-dark-200 mb-1.5">Ikona</label>
              <select
                value={form.icon}
                onChange={e => setForm(prev => ({ ...prev, icon: e.target.value }))}
                className="w-full bg-dark-800 border border-dark-600 rounded-xl px-4 py-2.5 text-white"
              >
                {iconOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          <Input
            label="Tytuł"
            value={form.title}
            onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
            placeholder="np. Jak zdobywać punkty XP?"
          />

          <div>
            <label className="block text-sm font-medium text-dark-200 mb-1.5">Treść</label>
            <textarea
              value={form.content}
              onChange={e => setForm(prev => ({ ...prev, content: e.target.value }))}
              placeholder="Treść sekcji... Możesz używać nowych linii."
              className="w-full bg-dark-800 border border-dark-600 rounded-xl px-4 py-2.5 text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-turbo-500 min-h-[150px] resize-none"
            />
            <p className="text-xs text-dark-500 mt-1">
              Użyj nowej linii (Enter) aby tworzyć akapity. Punkty możesz zaczynać od "• "
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => setShowModal(false)}
              className="flex-1"
            >
              Anuluj
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={saving}
              className="flex-1"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Zapisywanie...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Zapisz
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
