'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CollectibleCard } from '@/types';
import { RARITY_CONFIG } from '@/hooks/useCards';
import { Sparkles, Crown, X } from 'lucide-react';

interface PackOpeningRevealProps {
  isOpen: boolean;
  onClose: () => void;
  cards: CollectibleCard[];
  packName: string;
  loading?: boolean;
}

const RARITY_BORDER: Record<string, string> = {
  legendary: 'border-yellow-500 shadow-yellow-500/40 shadow-xl',
  epic: 'border-purple-500 shadow-purple-500/30 shadow-lg',
  rare: 'border-blue-500 shadow-blue-500/20 shadow-md',
  common: 'border-dark-500',
};

const RARITY_LABEL: Record<string, { text: string; color: string }> = {
  legendary: { text: 'LEGENDARY', color: 'text-yellow-400' },
  epic: { text: 'EPIC', color: 'text-purple-400' },
  rare: { text: 'RARE', color: 'text-blue-400' },
  common: { text: 'COMMON', color: 'text-dark-400' },
};

const RARITY_PARTICLES: Record<string, string> = {
  legendary: '#facc15',
  epic: '#a855f7',
  rare: '#3b82f6',
  common: '#6b7280',
};

type Phase = 'pack' | 'burst' | 'cards' | 'summary';

export function PackOpeningReveal({ isOpen, onClose, cards, packName, loading }: PackOpeningRevealProps) {
  const [phase, setPhase] = useState<Phase>('pack');
  const [revealedCount, setRevealedCount] = useState(0);
  const [allRevealed, setAllRevealed] = useState(false);

  // Reset state when opening
  useEffect(() => {
    if (isOpen && cards.length > 0 && !loading) {
      setPhase('pack');
      setRevealedCount(0);
      setAllRevealed(false);
    }
  }, [isOpen, cards, loading]);

  // Auto-advance from pack → burst → cards
  useEffect(() => {
    if (phase === 'pack' && cards.length > 0 && !loading) {
      const timer = setTimeout(() => setPhase('burst'), 1800);
      return () => clearTimeout(timer);
    }
    if (phase === 'burst') {
      const timer = setTimeout(() => setPhase('cards'), 800);
      return () => clearTimeout(timer);
    }
  }, [phase, cards, loading]);

  // Sequential card reveal
  useEffect(() => {
    if (phase === 'cards' && revealedCount < cards.length) {
      const delay = cards[revealedCount]?.rarity === 'legendary' ? 700
        : cards[revealedCount]?.rarity === 'epic' ? 550
        : 400;
      const timer = setTimeout(() => setRevealedCount(prev => prev + 1), delay);
      return () => clearTimeout(timer);
    }
    if (phase === 'cards' && revealedCount >= cards.length && cards.length > 0) {
      const timer = setTimeout(() => setAllRevealed(true), 600);
      return () => clearTimeout(timer);
    }
  }, [phase, revealedCount, cards]);

  const handleSkipToSummary = useCallback(() => {
    setRevealedCount(cards.length);
    setAllRevealed(true);
  }, [cards.length]);

  const handleClose = useCallback(() => {
    setPhase('pack');
    setRevealedCount(0);
    setAllRevealed(false);
    onClose();
  }, [onClose]);

  if (!isOpen) return null;

  const bestRarity = cards.length > 0 ? cards[0].rarity : 'common';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/90 backdrop-blur-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={allRevealed ? handleClose : handleSkipToSummary}
          />

          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 z-[70] p-2 text-dark-400 hover:text-white transition-colors rounded-lg hover:bg-dark-700/50"
          >
            <X size={24} />
          </button>

          {/* Content */}
          <div className="relative z-[65] w-full max-w-md mx-4 max-h-[90vh] flex flex-col items-center">

            {/* PHASE 1: Pack shaking */}
            {phase === 'pack' && (
              <motion.div className="flex flex-col items-center">
                {/* Pack title */}
                <motion.p
                  className="text-dark-400 text-sm mb-6 tracking-widest uppercase"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {packName}
                </motion.p>

                {/* Pack box */}
                <motion.div
                  className="relative w-48 h-56 rounded-2xl border-2 border-turbo-500/60 bg-gradient-to-b from-turbo-500/20 to-purple-600/20 flex items-center justify-center overflow-hidden"
                  initial={{ scale: 0.5, opacity: 0, rotateY: -30 }}
                  animate={{
                    scale: [0.5, 1.1, 1, 1, 1, 1.02, 0.98, 1.02, 0.98, 1.05, 0.95, 1.08, 0.92, 1.1],
                    opacity: 1,
                    rotateY: 0,
                    rotate: [0, 0, 0, 0, -2, 2, -3, 3, -4, 4, -5, 5, -3, 0],
                  }}
                  transition={{
                    duration: 1.8,
                    times: [0, 0.15, 0.2, 0.4, 0.45, 0.5, 0.55, 0.6, 0.65, 0.7, 0.75, 0.8, 0.85, 1],
                    ease: 'easeInOut',
                  }}
                >
                  {/* Inner glow */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-t from-turbo-500/0 via-turbo-500/10 to-turbo-500/0"
                    animate={{
                      opacity: [0.3, 0.8, 0.3],
                    }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                  />

                  {/* Question marks */}
                  <motion.div
                    className="text-6xl font-black text-turbo-500/40"
                    animate={{ scale: [1, 1.1, 1], opacity: [0.4, 0.7, 0.4] }}
                    transition={{ duration: 0.6, repeat: Infinity }}
                  >
                    ?
                  </motion.div>

                  {/* Edge particles */}
                  {[...Array(6)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-1.5 h-1.5 rounded-full bg-turbo-400"
                      initial={{ opacity: 0 }}
                      animate={{
                        opacity: [0, 1, 0],
                        x: [0, (Math.random() - 0.5) * 80],
                        y: [0, (Math.random() - 0.5) * 80],
                      }}
                      transition={{
                        duration: 1,
                        delay: 0.8 + i * 0.1,
                        repeat: Infinity,
                        repeatDelay: 0.3,
                      }}
                    />
                  ))}
                </motion.div>

                <motion.p
                  className="text-dark-500 text-xs mt-6"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 1, 0.5, 1] }}
                  transition={{ delay: 0.5, duration: 1.5 }}
                >
                  Otwieranie...
                </motion.p>
              </motion.div>
            )}

            {/* PHASE 2: Burst explosion */}
            {phase === 'burst' && (
              <motion.div className="flex items-center justify-center w-full h-64 relative">
                {/* Central flash */}
                <motion.div
                  className="absolute w-32 h-32 rounded-full"
                  style={{
                    background: `radial-gradient(circle, ${
                      bestRarity === 'legendary' ? '#facc15' :
                      bestRarity === 'epic' ? '#a855f7' : '#8b5cf6'
                    }80, transparent)`,
                  }}
                  initial={{ scale: 0, opacity: 1 }}
                  animate={{ scale: [0, 6], opacity: [1, 0] }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />

                {/* Exploding particles */}
                {[...Array(16)].map((_, i) => {
                  const angle = (i / 16) * Math.PI * 2;
                  const distance = 120 + Math.random() * 80;
                  return (
                    <motion.div
                      key={i}
                      className="absolute w-2 h-2 rounded-full"
                      style={{ backgroundColor: RARITY_PARTICLES[bestRarity] || '#8b5cf6' }}
                      initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
                      animate={{
                        x: Math.cos(angle) * distance,
                        y: Math.sin(angle) * distance,
                        scale: 0,
                        opacity: 0,
                      }}
                      transition={{ duration: 0.7, ease: 'easeOut', delay: i * 0.02 }}
                    />
                  );
                })}

                {/* Ring burst */}
                <motion.div
                  className="absolute w-8 h-8 rounded-full border-2"
                  style={{ borderColor: RARITY_PARTICLES[bestRarity] || '#8b5cf6' }}
                  initial={{ scale: 0, opacity: 1 }}
                  animate={{ scale: [0, 8], opacity: [1, 0] }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                />
                <motion.div
                  className="absolute w-8 h-8 rounded-full border-2"
                  style={{ borderColor: RARITY_PARTICLES[bestRarity] || '#8b5cf6' }}
                  initial={{ scale: 0, opacity: 0.7 }}
                  animate={{ scale: [0, 6], opacity: [0.7, 0] }}
                  transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
                />
              </motion.div>
            )}

            {/* PHASE 3: Card-by-card reveal */}
            {phase === 'cards' && (
              <div className="w-full flex flex-col items-center">
                {/* Pack name */}
                <motion.p
                  className="text-dark-400 text-sm mb-4 tracking-widest uppercase"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {packName}
                </motion.p>

                {/* Counter */}
                <motion.p
                  className="text-dark-500 text-xs mb-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {Math.min(revealedCount, cards.length)} / {cards.length} kart
                </motion.p>

                {/* Cards grid */}
                <div className="grid grid-cols-2 gap-3 w-full max-h-[65vh] overflow-y-auto px-1 pb-4">
                  {cards.map((card, index) => {
                    const isRevealed = index < revealedCount;
                    const isLatest = index === revealedCount - 1;
                    const isSpecial = card.rarity === 'legendary' || card.rarity === 'epic';

                    return (
                      <div key={`${card.id}-${index}`} className="relative">
                        <AnimatePresence mode="wait">
                          {!isRevealed ? (
                            // Unrevealed card back
                            <motion.div
                              key="back"
                              className="aspect-[3/4] rounded-xl border-2 border-dark-600 bg-gradient-to-b from-dark-700 to-dark-800 flex items-center justify-center"
                              initial={{ opacity: 0.3 }}
                              animate={{ opacity: 0.3 }}
                            >
                              <span className="text-2xl text-dark-600 font-bold">?</span>
                            </motion.div>
                          ) : (
                            // Revealed card
                            <motion.div
                              key="front"
                              className={`relative aspect-[3/4] rounded-xl border-2 overflow-hidden bg-surface-2 ${RARITY_BORDER[card.rarity] || 'border-dark-600'}`}
                              initial={{
                                rotateY: 180,
                                scale: 0.6,
                                opacity: 0,
                              }}
                              animate={{
                                rotateY: 0,
                                scale: isLatest ? [0.6, 1.08, 1] : 1,
                                opacity: 1,
                              }}
                              transition={{
                                duration: 0.5,
                                ease: 'easeOut',
                                scale: { duration: 0.4, times: [0, 0.7, 1] },
                              }}
                              style={{ transformStyle: 'preserve-3d' }}
                            >
                              {/* Card image */}
                              {card.image_url ? (
                                <div className="aspect-[3/2] bg-dark-700">
                                  <img
                                    src={card.image_url}
                                    alt={card.name}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ) : (
                                <div className="aspect-[3/2] bg-dark-700 flex items-center justify-center">
                                  <Sparkles className={`w-8 h-8 ${RARITY_LABEL[card.rarity]?.color || 'text-dark-400'}`} />
                                </div>
                              )}

                              {/* Card info */}
                              <div className="p-2">
                                <p className="text-xs font-medium text-white truncate">{card.name}</p>
                                <p className={`text-[10px] font-bold ${RARITY_LABEL[card.rarity]?.color || 'text-dark-400'}`}>
                                  {RARITY_LABEL[card.rarity]?.text || card.rarity}
                                </p>
                              </div>

                              {/* Rarity glow overlay */}
                              {isSpecial && (
                                <div className={`absolute inset-0 pointer-events-none rounded-xl ${
                                  card.rarity === 'legendary'
                                    ? 'bg-gradient-to-t from-yellow-500/25 to-transparent'
                                    : 'bg-gradient-to-t from-purple-500/20 to-transparent'
                                }`} />
                              )}

                              {/* Legendary crown badge */}
                              {card.rarity === 'legendary' && (
                                <motion.div
                                  className="absolute top-1 right-1"
                                  initial={{ scale: 0, rotate: -45 }}
                                  animate={{ scale: 1, rotate: 0 }}
                                  transition={{ delay: 0.3, type: 'spring', stiffness: 500 }}
                                >
                                  <Crown className="w-5 h-5 text-yellow-400 drop-shadow-lg" />
                                </motion.div>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Flash effect on reveal for special cards */}
                        {isLatest && isSpecial && (
                          <motion.div
                            className="absolute inset-0 rounded-xl pointer-events-none"
                            style={{
                              background: `radial-gradient(circle, ${
                                card.rarity === 'legendary' ? '#facc1560' : '#a855f740'
                              }, transparent)`,
                            }}
                            initial={{ opacity: 1, scale: 0.8 }}
                            animate={{ opacity: 0, scale: 1.5 }}
                            transition={{ duration: 0.6 }}
                          />
                        )}

                        {/* Floating particles for legendary */}
                        {isRevealed && card.rarity === 'legendary' && (
                          <>
                            {[...Array(4)].map((_, pi) => (
                              <motion.div
                                key={pi}
                                className="absolute w-1 h-1 rounded-full bg-yellow-400"
                                style={{
                                  left: `${20 + Math.random() * 60}%`,
                                  top: `${20 + Math.random() * 60}%`,
                                }}
                                animate={{
                                  y: [0, -15, 0],
                                  opacity: [0, 1, 0],
                                }}
                                transition={{
                                  duration: 1.5,
                                  repeat: Infinity,
                                  delay: pi * 0.4,
                                }}
                              />
                            ))}
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Skip / Close buttons */}
                <div className="mt-4 flex gap-3">
                  {!allRevealed ? (
                    <motion.button
                      className="px-6 py-2.5 bg-dark-700 text-dark-300 rounded-xl hover:bg-dark-600 transition-colors text-sm"
                      onClick={handleSkipToSummary}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1 }}
                    >
                      Pokaż wszystkie
                    </motion.button>
                  ) : (
                    <motion.button
                      className="px-6 py-2.5 bg-turbo-500 text-white rounded-xl hover:bg-turbo-600 transition-colors text-sm font-medium"
                      onClick={handleClose}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      Zamknij
                    </motion.button>
                  )}
                </div>

                {/* Summary stats when all revealed */}
                {allRevealed && (
                  <motion.div
                    className="flex items-center justify-center gap-4 mt-4"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    {(['legendary', 'epic', 'rare', 'common'] as const).map(rarity => {
                      const count = cards.filter(c => c.rarity === rarity).length;
                      if (count === 0) return null;
                      const config = RARITY_CONFIG[rarity];
                      return (
                        <div key={rarity} className="flex items-center gap-1">
                          <config.icon className={`w-4 h-4 ${config.color}`} />
                          <span className={`text-sm font-bold ${config.color}`}>{count}</span>
                        </div>
                      );
                    })}
                  </motion.div>
                )}
              </div>
            )}

            {/* Loading state */}
            {loading && (
              <motion.div
                className="flex flex-col items-center py-16"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <motion.div
                  className="w-12 h-12 border-3 border-turbo-500/30 border-t-turbo-500 rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                />
                <p className="text-dark-400 text-sm mt-4">Ładowanie kart...</p>
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
