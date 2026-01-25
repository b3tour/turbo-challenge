'use client';

import { Modal } from './Modal';
import { useAppContent } from '@/hooks/useAppContent';
import {
  Target,
  Trophy,
  Layers,
  Swords,
  Gift,
  Zap,
  Info,
  Loader2,
} from 'lucide-react';

interface AppInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const iconMap: Record<string, React.ElementType> = {
  info: Info,
  zap: Zap,
  layers: Layers,
  target: Target,
  gift: Gift,
  swords: Swords,
  trophy: Trophy,
};

const iconColors: Record<string, string> = {
  info: 'text-blue-400',
  zap: 'text-yellow-400',
  layers: 'text-purple-400',
  target: 'text-green-400',
  gift: 'text-turbo-400',
  swords: 'text-red-400',
  trophy: 'text-yellow-400',
};

export function AppInfoModal({ isOpen, onClose }: AppInfoModalProps) {
  const { sections, loading } = useAppContent();

  // Znajdź intro sekcję
  const introSection = sections.find(s => s.section_key === 'intro');
  const otherSections = sections.filter(s => s.section_key !== 'intro');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Turbo Challenge"
      size="lg"
    >
      <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-turbo-500 animate-spin" />
          </div>
        ) : (
          <>
            {/* Intro */}
            {introSection && (
              <div className="text-center pb-4 border-b border-dark-700">
                <p className="text-dark-300">{introSection.content}</p>
              </div>
            )}

            {/* Other sections */}
            {otherSections.map((section) => {
              const Icon = iconMap[section.icon || 'info'] || Info;
              const colorClass = iconColors[section.icon || 'info'] || 'text-blue-400';

              return (
                <Section
                  key={section.id}
                  icon={<Icon className={`w-5 h-5 ${colorClass}`} />}
                  title={section.title}
                >
                  <div className="text-dark-400 text-sm whitespace-pre-line">
                    {section.content}
                  </div>
                </Section>
              );
            })}

            {/* Footer */}
            <div className="text-center pt-4 border-t border-dark-700">
              <p className="text-dark-400 text-sm">
                Każdy zakup karty wspiera działalność
              </p>
              <p className="text-turbo-400 font-semibold">Fundacji Turbo Pomoc</p>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-dark-800/50 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <h3 className="font-semibold text-white">{title}</h3>
      </div>
      {children}
    </div>
  );
}
