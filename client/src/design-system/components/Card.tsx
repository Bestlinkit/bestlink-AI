"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'glass' | 'hover-animated';
}

export const Card = ({ children, className, variant = 'default' }: CardProps) => {
  const variants = {
    default: "bg-[#0f0f0f] border border-white/5",
    glass: "glass-dark border border-white/10 backdrop-blur-xl",
    "hover-animated": "bg-[#0f0f0f] border border-white/5 hover:border-blue-500/50 hover:shadow-[0_0_30px_rgba(37,99,235,0.1)]"
  };

  return (
    <motion.div
      whileHover={variant === 'hover-animated' ? { y: -5 } : {}}
      className={cn(
        "rounded-2xl overflow-hidden transition-all duration-300",
        variants[variant],
        className
      )}
    >
      {children}
    </motion.div>
  );
};

export const CardHeader = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <div className={cn("p-6 border-b border-white/5", className)}>{children}</div>
);

export const CardContent = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <div className={cn("p-6", className)}>{children}</div>
);

export const CardFooter = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <div className={cn("p-6 border-t border-white/5 bg-white/[0.02]", className)}>{children}</div>
);
