"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ChevronRight, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HeroProps {
  title: string;
  subtitle: string;
  ctaText: string;
  secondaryCta?: string;
  className?: string;
}

export const Hero = ({ title, subtitle, ctaText, secondaryCta, className }: HeroProps) => {
  return (
    <section className={cn("relative py-24 px-6 overflow-hidden", className)}>
      {/* Background Accents */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none -z-10">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-600/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-600/10 blur-[120px] rounded-full animate-pulse delay-700" />
      </div>

      <div className="max-w-7xl mx-auto text-center space-y-8 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-blue-400 text-[10px] font-bold uppercase tracking-widest"
        >
          <Zap className="w-3 h-3 fill-current" />
          <span>Next-Gen Production Engine</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-5xl md:text-7xl font-bold font-outfit tracking-tight text-white leading-tight"
        >
          {title.split(' ').map((word, i) => (
            <span key={i} className={cn(i === title.split(' ').length - 1 && "gradient-text")}>
              {word}{' '}
            </span>
          ))}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-lg md:text-xl text-zinc-500 max-w-2xl mx-auto font-medium"
        >
          {subtitle}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
        >
          <button className="px-8 py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all shadow-[0_0_30px_rgba(37,99,235,0.4)] flex items-center gap-2 group">
            {ctaText}
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
          
          {secondaryCta && (
            <button className="px-8 py-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold transition-all flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-400" />
              {secondaryCta}
            </button>
          )}
        </motion.div>
      </div>
    </section>
  );
};
