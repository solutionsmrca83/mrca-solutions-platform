'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Cpu, Lock } from 'lucide-react';

interface VideoSplashPreloaderProps {
  onComplete: () => void;
  forceShow?: boolean;
}

export const VideoSplashPreloader: React.FC<VideoSplashPreloaderProps> = ({
  onComplete,
  forceShow = false,
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const TOTAL_DURATION = 3.8; // 3.8 seconds duration
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    // High-resolution clock for the smooth 3.8s cinematic boot sequence
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      setCurrentTime(Math.min(elapsed, TOTAL_DURATION));

      if (elapsed >= TOTAL_DURATION) {
        clearInterval(interval);
        setIsVisible(false);
        setTimeout(() => {
          onComplete();
        }, 500);
      }
    }, 50);

    return () => {
      clearInterval(interval);
    };
  }, [onComplete]);

  const progressPercent = Math.min(100, Math.round((currentTime / TOTAL_DURATION) * 100));

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="static-splash-screen"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
          className="fixed inset-0 z-[9999] bg-[#0A1128] text-[#dce1ff] flex flex-col items-center justify-between p-6 overflow-hidden select-none"
        >
          {/* Cyber Subtle Grid & Radial Glow Accents */}
          <div
            className="absolute inset-0 pointer-events-none opacity-20"
            style={{
              backgroundImage:
                'linear-gradient(to right, #181e36 1px, transparent 1px), linear-gradient(to bottom, #181e36 1px, transparent 1px)',
              backgroundSize: '48px 48px',
            }}
          />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[340px] bg-[#00E5FF]/10 blur-[140px] rounded-full pointer-events-none" />

          {/* Top Brand & Security Telemetry Header */}
          <header className="w-full max-w-7xl mx-auto flex items-center justify-between relative z-10 pt-2 sm:pt-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#141a32]/80 border border-[#00e5ff]/40 backdrop-blur-md flex items-center justify-center shadow-[0_0_15px_rgba(0,229,255,0.3)]">
                <Shield className="w-5 h-5 text-[#00E5FF]" />
              </div>
              <div className="flex flex-col">
                <span className="font-['Space_Grotesk'] text-[17px] font-bold text-[#dce1ff] tracking-tight leading-none">
                  MRCA SOLUTIONS
                </span>
                <span className="font-['JetBrains_Mono'] text-[9px] text-[#00fe66] uppercase tracking-widest mt-1">
                  INGENIERÍA &amp; CIBERSEGURIDAD B2B // KERNEL BOOT
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#141a32]/80 border border-[#00fe66]/30 backdrop-blur-md font-['JetBrains_Mono'] text-[11px] text-[#00fe66]">
              <span className="w-2 h-2 rounded-full bg-[#00fe66] animate-pulse shadow-[0_0_8px_#00fe66]" />
              <span>SISTEMA ZERO-TRUST: CARGANDO</span>
            </div>
          </header>

          {/* Center Stage: Perfectly Centered Cinematic Animated Logo */}
          <main className="relative z-10 flex flex-col items-center justify-center my-auto w-full max-w-3xl px-4 text-center">
            {/* Top Badge */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.2 }}
              className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#00e5ff]/10 border border-[#00e5ff]/30 backdrop-blur-md mb-6"
            >
              <Cpu className="w-3.5 h-3.5 text-[#00e5ff]" />
              <span className="font-['JetBrains_Mono'] text-[11px] text-[#00e5ff] tracking-widest uppercase font-semibold">
                PLATAFORMA MRCA SOLUTIONS // CORE KERNEL v4.12
              </span>
            </motion.div>

            {/* Cinematic Entrance Logo: opacity 0 -> 1, scale 0.95 -> 1 over 2.8s */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                duration: 2.8,
                ease: [0.16, 1, 0.3, 1], // Smooth cinematic easing
              }}
              className="relative flex items-center justify-center w-full max-w-[580px] sm:max-w-[640px] px-2 py-4"
            >
              <img
                src="/MRCA.SVG"
                alt="MRCA Solutions - Technology Solutions"
                className="w-full h-auto max-h-[260px] sm:max-h-[300px] object-contain drop-shadow-[0_0_40px_rgba(0,229,255,0.35)] filter hover:brightness-105 transition-all select-none"
              />
            </motion.div>

            {/* Sub-Brand Monospace Tag */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.5, delay: 1 }}
              className="mt-4 font-['JetBrains_Mono'] text-[12px] sm:text-[13px] text-[#bac9cc] tracking-wide"
            >
              INFRAESTRUCTURA RESILIENTE DE INGENIERÍA &amp; GOBERNANZA ZERO-TRUST
            </motion.p>
          </main>

          {/* Bottom Progress Bar & Telemetry Footer */}
          <footer className="w-full max-w-xl mx-auto flex flex-col gap-2.5 relative z-10 pb-4 sm:pb-8">
            <div className="flex items-center justify-between font-['JetBrains_Mono'] text-[11px] text-[#bac9cc]">
              <div className="flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-[#00fe66]" />
                <span className="text-[#dce1ff] font-semibold">
                  ESTABLECIENDO ENLACE CIFRADO ECDSA
                </span>
              </div>
              <span className="text-[#00e5ff] font-bold">
                {currentTime.toFixed(1)}s / {TOTAL_DURATION.toFixed(1)}s ({progressPercent}%)
              </span>
            </div>

            {/* Glowing High-Tech Progress Bar */}
            <div className="w-full h-2 rounded-full bg-[#181e36] overflow-hidden border border-[#00e5ff]/30 p-0.5 shadow-[0_0_15px_rgba(0,229,255,0.25)]">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-[#00E5FF] via-[#00DAF3] to-[#00FF66] shadow-[0_0_12px_#00fe66]"
                style={{ width: `${progressPercent}%` }}
                transition={{ ease: 'linear' }}
              />
            </div>

            <div className="flex items-center justify-between font-['JetBrains_Mono'] text-[10px] text-[#849396] mt-0.5">
              <span>HSM YUBI-V4: SECURE HANDSHAKE</span>
              <span className="text-[#00fe66] tracking-wider uppercase font-semibold">
                BOOT SECRETS VERIFIED
              </span>
            </div>
          </footer>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export const SplashPreloader = VideoSplashPreloader;
export default VideoSplashPreloader;
