'use client';

import { Modal } from './Modal';
import {
  Target,
  Trophy,
  Layers,
  Swords,
  Gift,
  Star,
  Zap,
  HelpCircle,
  ChevronRight,
} from 'lucide-react';

interface AppInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AppInfoModal({ isOpen, onClose }: AppInfoModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Turbo Challenge"
      size="lg"
    >
      <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
        {/* Intro */}
        <div className="text-center pb-4 border-b border-dark-700">
          <p className="text-dark-300">
            Gra kolekcjonerska stworzona przez Fundację Turbo Pomoc.
            Zbieraj karty legendarnych samochodów, wykonuj misje i rywalizuj z innymi!
          </p>
        </div>

        {/* Jak zdobywać XP */}
        <Section
          icon={<Zap className="w-5 h-5 text-yellow-400" />}
          title="Jak zdobywać punkty XP?"
        >
          <p className="text-dark-400 text-sm mb-3">
            Punkty XP to Twoja waluta doświadczenia. Im więcej masz XP, tym wyżej jesteś w rankingu.
          </p>
          <ul className="space-y-2 text-sm text-dark-300">
            <li className="flex items-center gap-2">
              <ChevronRight className="w-4 h-4 text-turbo-500" />
              <span><strong>Wykonuj misje</strong> - skanuj QR, rób zdjęcia, rozwiązuj quizy</span>
            </li>
            <li className="flex items-center gap-2">
              <ChevronRight className="w-4 h-4 text-turbo-500" />
              <span><strong>Kupuj karty</strong> - każda karta daje bonus XP</span>
            </li>
            <li className="flex items-center gap-2">
              <ChevronRight className="w-4 h-4 text-turbo-500" />
              <span><strong>Mystery Garage</strong> - losowe karty = losowe XP</span>
            </li>
            <li className="flex items-center gap-2">
              <ChevronRight className="w-4 h-4 text-turbo-500" />
              <span><strong>Turbo Bitwy</strong> - pokonuj innych graczy</span>
            </li>
          </ul>
        </Section>

        {/* Karty */}
        <Section
          icon={<Layers className="w-5 h-5 text-purple-400" />}
          title="Karty kolekcjonerskie"
        >
          <p className="text-dark-400 text-sm mb-3">
            Każda karta to unikalny samochód z prawdziwymi statystykami: moc, moment obrotowy, prędkość.
          </p>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <RarityBadge color="bg-gray-500" label="Common" desc="łatwe do zdobycia" />
            <RarityBadge color="bg-blue-500" label="Rare" desc="trudniejsze" />
            <RarityBadge color="bg-purple-500" label="Epic" desc="rzadkie i mocne" />
            <RarityBadge color="bg-yellow-500" label="Legendary" desc="najlepsze" />
          </div>
          <p className="text-dark-400 text-sm">
            <strong className="text-white">Jak zdobyć:</strong> Kup pojedynczą kartę, otwórz pakiet Mystery Garage lub wygraj bitwę.
          </p>
        </Section>

        {/* Misje */}
        <Section
          icon={<Target className="w-5 h-5 text-green-400" />}
          title="Misje"
        >
          <p className="text-dark-400 text-sm mb-2">
            Misje to zadania, za które dostajesz XP:
          </p>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="px-2 py-1 bg-dark-700 rounded-lg text-dark-300">QR Code</span>
            <span className="px-2 py-1 bg-dark-700 rounded-lg text-dark-300">Zdjęcie</span>
            <span className="px-2 py-1 bg-dark-700 rounded-lg text-dark-300">Quiz</span>
            <span className="px-2 py-1 bg-dark-700 rounded-lg text-dark-300">GPS</span>
            <span className="px-2 py-1 bg-dark-700 rounded-lg text-dark-300">Zadanie</span>
          </div>
          <p className="text-dark-500 text-xs mt-2">
            Po wykonaniu misji zgłoszenie trafia do weryfikacji.
          </p>
        </Section>

        {/* Mystery Garage */}
        <Section
          icon={<Gift className="w-5 h-5 text-turbo-400" />}
          title="Mystery Garage"
        >
          <p className="text-dark-400 text-sm">
            Kup pakiet (3, 5 lub 10 kart) i dostań losowe samochody.
            Im droższy pakiet, tym większa szansa na rzadkie karty.
            To jak otwieranie paczek z naklejkami!
          </p>
        </Section>

        {/* Turbo Bitwy */}
        <Section
          icon={<Swords className="w-5 h-5 text-red-400" />}
          title="Turbo Bitwy"
        >
          <p className="text-dark-400 text-sm mb-2">
            Pojedynki 1 na 1 z innymi graczami:
          </p>
          <ol className="text-sm text-dark-300 space-y-1 list-decimal list-inside">
            <li>Wybierasz jedną ze swoich kart</li>
            <li>System losuje kategorię (moc, moment, prędkość)</li>
            <li>Karta z lepszym wynikiem wygrywa</li>
            <li>Zwycięzca dostaje XP lub kartę przeciwnika</li>
          </ol>
        </Section>

        {/* Rankingi */}
        <Section
          icon={<Trophy className="w-5 h-5 text-yellow-400" />}
          title="Rankingi"
        >
          <p className="text-dark-400 text-sm">
            Sprawdź jak wypadasz na tle innych graczy w <strong className="text-white">Rankingu XP</strong> i <strong className="text-white">Rankingu Wsparcia</strong>.
            Najlepsi gracze mogą liczyć na specjalne nagrody!
          </p>
        </Section>

        {/* Footer */}
        <div className="text-center pt-4 border-t border-dark-700">
          <p className="text-dark-400 text-sm">
            Każdy zakup karty wspiera działalność
          </p>
          <p className="text-turbo-400 font-semibold">Fundacji Turbo Pomoc</p>
        </div>
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

function RarityBadge({
  color,
  label,
  desc,
}: {
  color: string;
  label: string;
  desc: string;
}) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <div className={`w-3 h-3 rounded ${color}`} />
      <span className="text-white">{label}</span>
      <span className="text-dark-500">- {desc}</span>
    </div>
  );
}
