'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CollectibleCard } from '@/types';
import { RARITY_CONFIG } from '@/hooks/useCards';
import { Sparkles, Crown, X, Flame, Zap } from 'lucide-react';

interface PackOpeningRevealProps {
  isOpen: boolean;
  onClose: () => void;
  cards: CollectibleCard[];
  packName: string;
  loading?: boolean;
}

const RARITY_BORDER: Record<string, string> = {
  legendary: 'border-yellow-500 shadow-yellow-500/50 shadow-xl',
  epic: 'border-purple-500 shadow-purple-500/40 shadow-lg',
  rare: 'border-blue-500 shadow-blue-500/30 shadow-md',
  common: 'border-dark-500',
};

const RARITY_LABEL: Record<string, { text: string; color: string }> = {
  legendary: { text: 'LEGENDARY', color: 'text-yellow-400' },
  epic: { text: 'EPIC', color: 'text-purple-400' },
  rare: { text: 'RARE', color: 'text-blue-400' },
  common: { text: 'COMMON', color: 'text-dark-400' },
};

const RARITY_COLOR: Record<string, string> = {
  legendary: '#facc15',
  epic: '#a855f7',
  rare: '#3b82f6',
  common: '#6b7280',
};

const RARITY_BG: Record<string, string> = {
  legendary: 'from-yellow-500/30 via-amber-500/10 to-transparent',
  epic: 'from-purple-500/25 via-violet-500/10 to-transparent',
  rare: 'from-blue-500/20 via-cyan-500/5 to-transparent',
  common: 'from-gray-500/10 to-transparent',
};

type Phase = 'idle' | 'loading' | 'pack' | 'burst' | 'cards';

export function PackOpeningReveal({ isOpen, onClose, cards, packName, loading }: PackOpeningRevealProps) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [revealedCount, setRevealedCount] = useState(0);
  const [allRevealed, setAllRevealed] = useState(false);
  const [screenFlash, setScreenFlash] = useState<string | null>(null);
  const prevOpenRef = useRef(false);

  // Stable particle positions (no random in render)
  const burstParticles = useMemo(() =>
    Array.from({ length: 24 }, (_, i) => ({
      angle: (i / 24) * Math.PI * 2,
      distance: 100 + (i % 5) * 30,
      size: 2 + (i % 3),
      delay: i * 0.015,
    })), []);

  const sparklePositions = useMemo(() =>
    Array.from({ length: 30 }, (_, i) => ({
      left: (i * 37 + 13) % 100,
      delay: (i * 0.15) % 3,
      duration: 2 + (i % 3),
      size: 1 + (i % 3),
    })), []);

  // Haptic feedback
  const vibrate = useCallback((pattern: number | number[]) => {
    try { navigator?.vibrate?.(pattern); } catch {}
  }, []);

  // Detect open → start flow
  useEffect(() => {
    if (isOpen && !prevOpenRef.current) {
      setRevealedCount(0);
      setAllRevealed(false);
      setScreenFlash(null);
      if (loading || cards.length === 0) {
        setPhase('loading');
      } else {
        setPhase('pack');
      }
    }
    if (!isOpen && prevOpenRef.current) {
      setPhase('idle');
      setRevealedCount(0);
      setAllRevealed(false);
      setScreenFlash(null);
    }
    prevOpenRef.current = isOpen;
  }, [isOpen, loading, cards.length]);

  // Loading → pack
  useEffect(() => {
    if (phase === 'loading' && !loading && cards.length > 0) {
      setPhase('pack');
    }
  }, [phase, loading, cards.length]);

  // Pack → burst
  useEffect(() => {
    if (phase === 'pack') {
      vibrate([50, 50, 50, 50, 100, 50, 100, 50, 200]);
      const timer = setTimeout(() => {
        setPhase('burst');
        vibrate(200);
      }, 2200);
      return () => clearTimeout(timer);
    }
  }, [phase, vibrate]);

  // Burst → cards
  useEffect(() => {
    if (phase === 'burst') {
      const timer = setTimeout(() => setPhase('cards'), 1000);
      return () => clearTimeout(timer);
    }
  }, [phase]);

  // Sequential card reveal with screen flash for special cards
  useEffect(() => {
    if (phase === 'cards' && revealedCount < cards.length) {
      const card = cards[revealedCount];
      const isSpecial = card?.rarity === 'legendary' || card?.rarity === 'epic';
      const delay = card?.rarity === 'legendary' ? 900
        : card?.rarity === 'epic' ? 700
        : card?.rarity === 'rare' ? 500
        : 400;

      const timer = setTimeout(() => {
        if (isSpecial) {
          setScreenFlash(RARITY_COLOR[card.rarity]);
          vibrate(card.rarity === 'legendary' ? [100, 50, 200] : [100, 50, 100]);
          setTimeout(() => setScreenFlash(null), 400);
        }
        setRevealedCount(prev => prev + 1);
      }, delay);
      return () => clearTimeout(timer);
    }
    if (phase === 'cards' && revealedCount >= cards.length && cards.length > 0 && !allRevealed) {
      const timer = setTimeout(() => setAllRevealed(true), 600);
      return () => clearTimeout(timer);
    }
  }, [phase, revealedCount, cards, allRevealed, vibrate]);

  const handleSkipToSummary = useCallback(() => {
    if (phase !== 'cards') setPhase('cards');
    setRevealedCount(cards.length);
    setAllRevealed(true);
  }, [cards.length, phase]);

  const handleClose = useCallback(() => {
    setPhase('idle');
    setRevealedCount(0);
    setAllRevealed(false);
    setScreenFlash(null);
    onClose();
  }, [onClose]);

  if (!isOpen) return null;

  const bestRarity = cards.length > 0 ? cards[0].rarity : 'common';
  const hasLegendary = cards.some(c => c.rarity === 'legendary');
  const hasEpic = cards.some(c => c.rarity === 'epic');

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop with animated gradient */}
          <motion.div
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="absolute inset-0 bg-black/95" />
            {/* Ambient glow based on best rarity */}
            {phase !== 'idle' && phase !== 'loading' && (
              <motion.div
                className="absolute inset-0"
                style={{
                  background: `radial-gradient(ellipse at center, ${RARITY_COLOR[bestRarity]}15, transparent 70%)`,
                }}
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 3, repeat: Infinity }}
              />
            )}
          </motion.div>

          {/* Screen flash on special card reveal */}
          <AnimatePresence>
            {screenFlash && (
              <motion.div
                className="absolute inset-0 z-[68] pointer-events-none"
                style={{ backgroundColor: screenFlash }}
                initial={{ opacity: 0.6 }}
                animate={{ opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
              />
            )}
          </AnimatePresence>

          {/* Sparkle rain for legendary/epic reveals */}
          {phase === 'cards' && (hasLegendary || hasEpic) && (
            <div className="absolute inset-0 z-[66] pointer-events-none overflow-hidden">
              {sparklePositions.map((spark, i) => (
                <motion.div
                  key={i}
                  className="absolute rounded-full"
                  style={{
                    left: `${spark.left}%`,
                    top: -10,
                    width: spark.size,
                    height: spark.size,
                    backgroundColor: hasLegendary ? '#facc15' : '#a855f7',
                  }}
                  animate={{
                    y: [0, typeof window !== 'undefined' ? window.innerHeight + 20 : 900],
                    opacity: [0, 0.8, 0.8, 0],
                    rotate: [0, 360],
                  }}
                  transition={{
                    duration: spark.duration,
                    delay: spark.delay,
                    repeat: Infinity,
                    ease: 'linear',
                  }}
                />
              ))}
            </div>
          )}

          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 z-[70] p-2 text-dark-400 hover:text-white transition-colors rounded-lg hover:bg-white/10"
          >
            <X size={24} />
          </button>

          {/* Tap to skip hint */}
          {phase === 'pack' && (
            <motion.p
              className="absolute bottom-8 z-[66] text-dark-600 text-xs"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5 }}
              onClick={handleSkipToSummary}
            >
              Dotknij aby pominąć
            </motion.p>
          )}

          {/* Content */}
          <div
            className="relative z-[67] w-full max-w-md mx-4 max-h-[90vh] flex flex-col items-center"
            onClick={phase === 'pack' || phase === 'burst' ? handleSkipToSummary : undefined}
          >

            {/* LOADING */}
            {phase === 'loading' && (
              <motion.div
                className="flex flex-col items-center py-16"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <motion.div
                  className="w-14 h-14 border-[3px] border-turbo-500/30 border-t-turbo-500 rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                />
                <p className="text-dark-400 text-sm mt-4">Ładowanie kart...</p>
              </motion.div>
            )}

            {/* PHASE 1: Pack shaking — bigger, more dramatic */}
            {phase === 'pack' && (
              <motion.div className="flex flex-col items-center">
                {/* Pack title with glow */}
                <motion.h2
                  className="text-white text-lg font-bold mb-8 tracking-widest uppercase"
                  initial={{ opacity: 0, y: -20, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  {packName}
                </motion.h2>

                {/* Pack box — much larger */}
                <motion.div
                  className="relative w-56 h-72 rounded-2xl border-2 border-turbo-500/70 flex items-center justify-center overflow-hidden"
                  style={{
                    background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(34,211,238,0.1), rgba(139,92,246,0.15))',
                  }}
                  initial={{ scale: 0, opacity: 0, rotateZ: -5 }}
                  animate={{
                    scale: [0, 1.15, 1, 1, 1, 1, 1, 1.03, 0.97, 1.04, 0.96, 1.06, 0.94, 1.08, 0.92, 1.12, 0.88, 1.15],
                    opacity: 1,
                    rotateZ: [
                      -5, 0, 0, 0, 0, 0,
                      -1, 1, -2, 2, -3, 3, -5, 5, -7, 7, -4, 0
                    ],
                  }}
                  transition={{
                    duration: 2.2,
                    times: [0, 0.1, 0.15, 0.25, 0.3, 0.35, 0.4, 0.45, 0.5, 0.55, 0.6, 0.65, 0.7, 0.75, 0.8, 0.85, 0.9, 1],
                    ease: 'easeInOut',
                  }}
                >
                  {/* Animated gradient sweep */}
                  <motion.div
                    className="absolute inset-0"
                    style={{
                      background: 'linear-gradient(45deg, transparent 30%, rgba(139,92,246,0.3) 50%, transparent 70%)',
                    }}
                    animate={{ x: ['-100%', '200%'] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                  />

                  {/* Inner pulsing glow */}
                  <motion.div
                    className="absolute inset-0"
                    style={{
                      background: 'radial-gradient(circle at center, rgba(139,92,246,0.4), transparent 70%)',
                    }}
                    animate={{ opacity: [0.2, 0.8, 0.2], scale: [0.8, 1.1, 0.8] }}
                    transition={{ duration: 0.6, repeat: Infinity }}
                  />

                  {/* Gift icon */}
                  <motion.div
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.5, 1, 0.5],
                      rotateY: [0, 180, 360],
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Sparkles className="w-16 h-16 text-turbo-400" />
                  </motion.div>

                  {/* Orbiting particles */}
                  {[0, 1, 2, 3, 4, 5, 6, 7].map(i => (
                    <motion.div
                      key={i}
                      className="absolute w-2 h-2 rounded-full bg-turbo-400"
                      initial={{ opacity: 0 }}
                      animate={{
                        opacity: [0, 1, 0.6, 1, 0],
                        x: [0, Math.cos(i * 0.785) * 100],
                        y: [0, Math.sin(i * 0.785) * 120],
                        scale: [0.5, 1.5, 0.5],
                      }}
                      transition={{
                        duration: 1.2,
                        delay: 1 + i * 0.08,
                        repeat: Infinity,
                        repeatDelay: 0.2,
                      }}
                    />
                  ))}

                  {/* Edge glow intensifying */}
                  <motion.div
                    className="absolute inset-0 rounded-2xl"
                    style={{
                      boxShadow: '0 0 30px rgba(139,92,246,0.3), inset 0 0 30px rgba(139,92,246,0.1)',
                    }}
                    animate={{
                      boxShadow: [
                        '0 0 20px rgba(139,92,246,0.2), inset 0 0 20px rgba(139,92,246,0.05)',
                        '0 0 60px rgba(139,92,246,0.6), inset 0 0 40px rgba(139,92,246,0.2)',
                        '0 0 80px rgba(139,92,246,0.8), inset 0 0 60px rgba(139,92,246,0.3)',
                      ],
                    }}
                    transition={{ duration: 2.2, times: [0, 0.5, 1] }}
                  />
                </motion.div>

                <motion.p
                  className="text-turbo-400 text-sm mt-6 font-medium"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 1, 0.5, 1] }}
                  transition={{ delay: 0.3, duration: 1 }}
                >
                  Otwieranie pakietu...
                </motion.p>
              </motion.div>
            )}

            {/* PHASE 2: Burst explosion — massive */}
            {phase === 'burst' && (
              <motion.div className="flex items-center justify-center w-full h-80 relative">
                {/* White screen flash */}
                <motion.div
                  className="fixed inset-0 bg-white z-[69] pointer-events-none"
                  initial={{ opacity: 0.8 }}
                  animate={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                />

                {/* Central colored flash */}
                <motion.div
                  className="absolute w-40 h-40 rounded-full"
                  style={{
                    background: `radial-gradient(circle, ${RARITY_COLOR[bestRarity]}, transparent)`,
                  }}
                  initial={{ scale: 0, opacity: 1 }}
                  animate={{ scale: [0, 8], opacity: [1, 0] }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                />

                {/* Second wave */}
                <motion.div
                  className="absolute w-32 h-32 rounded-full"
                  style={{
                    background: `radial-gradient(circle, ${RARITY_COLOR[bestRarity]}90, transparent)`,
                  }}
                  initial={{ scale: 0, opacity: 0.8 }}
                  animate={{ scale: [0, 6], opacity: [0.8, 0] }}
                  transition={{ duration: 0.8, ease: 'easeOut', delay: 0.15 }}
                />

                {/* Exploding particles — more, varied sizes */}
                {burstParticles.map((p, i) => (
                  <motion.div
                    key={i}
                    className="absolute rounded-full"
                    style={{
                      backgroundColor: RARITY_COLOR[bestRarity],
                      width: p.size,
                      height: p.size,
                    }}
                    initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
                    animate={{
                      x: Math.cos(p.angle) * p.distance,
                      y: Math.sin(p.angle) * p.distance,
                      scale: 0,
                      opacity: 0,
                    }}
                    transition={{ duration: 0.8, ease: 'easeOut', delay: p.delay }}
                  />
                ))}

                {/* Multiple ring bursts */}
                {[0, 0.1, 0.2].map((delay, i) => (
                  <motion.div
                    key={i}
                    className="absolute rounded-full border-2"
                    style={{
                      borderColor: RARITY_COLOR[bestRarity],
                      width: 32 - i * 8,
                      height: 32 - i * 8,
                    }}
                    initial={{ scale: 0, opacity: 1 }}
                    animate={{ scale: [0, 10 - i * 2], opacity: [1, 0] }}
                    transition={{ duration: 0.7, ease: 'easeOut', delay }}
                  />
                ))}

                {/* Rarity announcement text */}
                <motion.div
                  className="absolute flex flex-col items-center"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: [0, 1.3, 1], opacity: [0, 1, 1] }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                >
                  <Zap className="w-8 h-8 text-white mb-2" />
                  <span className="text-white text-lg font-bold tracking-wider">
                    {cards.length} KART
                  </span>
                </motion.div>
              </motion.div>
            )}

            {/* PHASE 3: Card-by-card reveal */}
            {phase === 'cards' && (
              <div className="w-full flex flex-col items-center">
                {/* Pack name */}
                <motion.h2
                  className="text-white text-base font-bold mb-2 tracking-widest uppercase"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {packName}
                </motion.h2>

                {/* Counter */}
                <motion.p
                  className="text-dark-400 text-xs mb-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {Math.min(revealedCount, cards.length)} / {cards.length}
                </motion.p>

                {/* Cards grid */}
                <div className="grid grid-cols-2 gap-3 w-full max-h-[60vh] overflow-y-auto px-1 pb-4">
                  {cards.map((card, index) => {
                    const isRevealed = index < revealedCount;
                    const isLatest = index === revealedCount - 1;
                    const isSpecial = card.rarity === 'legendary' || card.rarity === 'epic';

                    return (
                      <div key={`${card.id}-${index}`} className="relative">
                        <AnimatePresence mode="wait">
                          {!isRevealed ? (
                            <motion.div
                              key="back"
                              className="aspect-[3/4] rounded-xl border-2 border-dark-600/50 bg-gradient-to-b from-dark-700/80 to-dark-800/80 flex items-center justify-center backdrop-blur-sm"
                              animate={{ opacity: [0.2, 0.35, 0.2] }}
                              transition={{ duration: 2, repeat: Infinity }}
                            >
                              <span className="text-3xl text-dark-600/50 font-bold">?</span>
                            </motion.div>
                          ) : (
                            <motion.div
                              key="front"
                              className={`relative aspect-[3/4] rounded-xl border-2 overflow-hidden bg-surface-2 ${RARITY_BORDER[card.rarity] || 'border-dark-600'}`}
                              initial={{ rotateY: 180, scale: 0.3, opacity: 0 }}
                              animate={{
                                rotateY: 0,
                                scale: isLatest ? [0.3, 1.12, 0.95, 1] : 1,
                                opacity: 1,
                              }}
                              transition={{
                                duration: 0.6,
                                ease: [0.34, 1.56, 0.64, 1],
                                scale: { duration: 0.5, times: [0, 0.5, 0.75, 1] },
                              }}
                              style={{ transformStyle: 'preserve-3d' }}
                            >
                              {/* Rarity gradient background */}
                              <div className={`absolute inset-0 bg-gradient-to-t ${RARITY_BG[card.rarity]} pointer-events-none z-10 rounded-xl`} />

                              {card.image_url ? (
                                <div className="aspect-[3/2] bg-dark-700">
                                  <img src={card.image_url} alt={card.name} className="w-full h-full object-cover" />
                                </div>
                              ) : (
                                <div className="aspect-[3/2] bg-dark-700 flex items-center justify-center">
                                  <Sparkles className={`w-8 h-8 ${RARITY_LABEL[card.rarity]?.color || 'text-dark-400'}`} />
                                </div>
                              )}

                              <div className="p-2 relative z-20">
                                <p className="text-xs font-semibold text-white truncate">{card.name}</p>
                                <p className={`text-[10px] font-black tracking-wider ${RARITY_LABEL[card.rarity]?.color || 'text-dark-400'}`}>
                                  {RARITY_LABEL[card.rarity]?.text || card.rarity}
                                </p>
                              </div>

                              {/* Animated shine sweep on reveal */}
                              {isLatest && (
                                <motion.div
                                  className="absolute inset-0 z-20 pointer-events-none"
                                  style={{
                                    background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.15) 50%, transparent 60%)',
                                  }}
                                  initial={{ x: '-100%' }}
                                  animate={{ x: '200%' }}
                                  transition={{ duration: 0.8, delay: 0.2 }}
                                />
                              )}

                              {/* Legendary crown */}
                              {card.rarity === 'legendary' && (
                                <motion.div
                                  className="absolute top-1 right-1 z-20"
                                  initial={{ scale: 0, rotate: -90 }}
                                  animate={{ scale: [0, 1.4, 1], rotate: 0 }}
                                  transition={{ delay: 0.3, duration: 0.4, type: 'spring', stiffness: 400 }}
                                >
                                  <Crown className="w-6 h-6 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]" />
                                </motion.div>
                              )}

                              {/* Epic flame */}
                              {card.rarity === 'epic' && (
                                <motion.div
                                  className="absolute top-1 right-1 z-20"
                                  initial={{ scale: 0 }}
                                  animate={{ scale: [0, 1.3, 1] }}
                                  transition={{ delay: 0.3, duration: 0.3 }}
                                >
                                  <Flame className="w-5 h-5 text-purple-400 drop-shadow-[0_0_6px_rgba(168,85,247,0.8)]" />
                                </motion.div>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* BIG flash effect on reveal for special cards */}
                        {isLatest && isSpecial && (
                          <>
                            <motion.div
                              className="absolute -inset-4 rounded-2xl pointer-events-none"
                              style={{
                                background: `radial-gradient(circle, ${RARITY_COLOR[card.rarity]}50, transparent)`,
                              }}
                              initial={{ opacity: 1, scale: 0.5 }}
                              animate={{ opacity: 0, scale: 2 }}
                              transition={{ duration: 0.8 }}
                            />
                            {/* Glow ring */}
                            <motion.div
                              className="absolute -inset-1 rounded-xl pointer-events-none border"
                              style={{ borderColor: RARITY_COLOR[card.rarity] }}
                              initial={{ opacity: 1, scale: 1 }}
                              animate={{ opacity: 0, scale: 1.3 }}
                              transition={{ duration: 0.6 }}
                            />
                          </>
                        )}

                        {/* Persistent floating particles for legendary */}
                        {isRevealed && card.rarity === 'legendary' && (
                          <>
                            {[0, 1, 2, 3, 4, 5].map((pi) => (
                              <motion.div
                                key={pi}
                                className="absolute w-1 h-1 rounded-full bg-yellow-400"
                                style={{
                                  left: `${10 + pi * 15}%`,
                                  bottom: '10%',
                                }}
                                animate={{
                                  y: [0, -40 - pi * 5, 0],
                                  x: [0, (pi % 2 === 0 ? 5 : -5), 0],
                                  opacity: [0, 1, 0],
                                  scale: [0.5, 1.5, 0.5],
                                }}
                                transition={{
                                  duration: 2,
                                  repeat: Infinity,
                                  delay: pi * 0.3,
                                }}
                              />
                            ))}
                          </>
                        )}

                        {/* Subtle particles for epic */}
                        {isRevealed && card.rarity === 'epic' && (
                          <>
                            {[0, 1, 2, 3].map((pi) => (
                              <motion.div
                                key={pi}
                                className="absolute w-1 h-1 rounded-full bg-purple-400"
                                style={{
                                  left: `${15 + pi * 20}%`,
                                  bottom: '15%',
                                }}
                                animate={{
                                  y: [0, -25, 0],
                                  opacity: [0, 0.8, 0],
                                }}
                                transition={{
                                  duration: 1.8,
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

                {/* Skip / Close */}
                <div className="mt-4 flex gap-3">
                  {!allRevealed ? (
                    <motion.button
                      className="px-6 py-2.5 bg-white/10 text-white/70 rounded-xl hover:bg-white/20 transition-colors text-sm backdrop-blur-sm"
                      onClick={handleSkipToSummary}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                    >
                      Pokaż wszystkie
                    </motion.button>
                  ) : (
                    <motion.button
                      className="px-8 py-3 bg-turbo-500 text-white rounded-xl hover:bg-turbo-600 transition-colors text-sm font-bold shadow-lg shadow-turbo-500/30"
                      onClick={handleClose}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      Zamknij
                    </motion.button>
                  )}
                </div>

                {/* Summary stats */}
                {allRevealed && (
                  <motion.div
                    className="flex items-center justify-center gap-5 mt-4 py-3 px-6 bg-white/5 rounded-xl backdrop-blur-sm"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    {(['legendary', 'epic', 'rare', 'common'] as const).map(rarity => {
                      const count = cards.filter(c => c.rarity === rarity).length;
                      if (count === 0) return null;
                      const config = RARITY_CONFIG[rarity];
                      return (
                        <div key={rarity} className="flex items-center gap-1.5">
                          <config.icon className={`w-4 h-4 ${config.color}`} />
                          <span className={`text-sm font-bold ${config.color}`}>{count}x</span>
                        </div>
                      );
                    })}
                  </motion.div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
