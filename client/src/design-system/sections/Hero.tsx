"use client";

import { motion } from "framer-motion";
import { Button } from "../components/Button";
import { cn } from "@/lib/utils";

interface HeroProps {
  title: string;
  subtitle: string;
  ctaText?: string;
  variant?: 'minimal' | 'gradient' | 'glass' | '3d';
}

export const Hero = ({ title, subtitle, ctaText = "Get Started", variant = 'minimal' }: HeroProps) => {
  return (
    <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden py-20 px-6">
      {/* Background Effects */}
      {variant === 'gradient' && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/20 blur-[150px] rounded-full" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/20 blur-[150px] rounded-full" />
        </div>
      )}

      {variant === 'glass' && (
        <div className="absolute inset-0 pointer-events-none bg-[url('/grid.svg')] bg-center opacity-20" />
      )}

      <div className="container relative z-10 mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-4xl mx-auto"
        >
          <motion.h1 
            className={cn(
              "text-5xl md:text-8xl font-bold tracking-tight mb-8",
              variant === 'gradient' ? "bg-clip-text text-transparent bg-gradient-to-b from-white to-white/40" : "text-white"
            )}
          >
            {title}
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="text-lg md:text-xl text-zinc-400 mb-12 leading-relaxed"
          >
            {subtitle}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Button variant={variant === 'gradient' ? 'gradient' : 'primary'} size="lg">
              {ctaText}
            </Button>
            <Button variant="secondary" size="lg">
              Learn More
            </Button>
          </motion.div>
        </motion.div>
      </div>

      {/* Decorative Elements for 3D/Glass */}
      {variant === 'glass' && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-5xl h-[500px] bg-white/[0.02] border border-white/5 rounded-[40px] -z-10 backdrop-blur-3xl rotate-3" />
      )}
    </section>
  );
};
