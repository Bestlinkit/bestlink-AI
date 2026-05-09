"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Check, Circle, Loader2, Sparkles, Terminal } from "lucide-react";
import { cn } from "@/lib/utils";

export type PipelineStage = 
  | 'BUILD_START'
  | 'PLANNING_PROJECT'
  | 'SELECTING_TEMPLATE'
  | 'GENERATING_FILES'
  | 'FINALIZING_PROJECT'
  | 'COMPLETED_PROJECT'
  | 'COMPLETED'
  | 'EXECUTION_ERROR'
  | '[KEEP-ALIVE]';

interface StageConfig {
  label: string;
  description: string;
}

const STAGES: Record<string, StageConfig> = {
  BUILD_START: { label: 'Initialize', description: 'Waking up the production engine...' },
  PLANNING_PROJECT: { label: 'Planning', description: 'Strategizing architecture and design...' },
  GENERATING_FILES: { label: 'Building', description: 'Generating premium codebases...' },
  FINALIZING_PROJECT: { label: 'Assembly', description: 'Constructing virtual file system...' },
  COMPLETED_PROJECT: { label: 'Success', description: 'Production ready.' }
};

const STAGE_ORDER = [
  'BUILD_START',
  'PLANNING_PROJECT',
  'GENERATING_FILES',
  'FINALIZING_PROJECT',
  'COMPLETED_PROJECT'
];

export default function ExecutionProgress({ 
  currentStage, 
  statusMessage 
}: { 
  currentStage: PipelineStage | null, 
  statusMessage?: string 
}) {
  if (!currentStage || currentStage === 'COMPLETED') return null;

  const currentIndex = STAGE_ORDER.indexOf(currentStage);
  const progress = Math.max(10, ((currentIndex + 1) / STAGE_ORDER.length) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="w-full p-8 rounded-[2.5rem] bg-white/[0.02] border border-white/5 shadow-2xl relative overflow-hidden"
    >
      {/* Background Pulse */}
      <div className="absolute inset-0 bg-blue-500/5 blur-[80px] rounded-full animate-pulse pointer-events-none" />

      <div className="relative flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-blue-400 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-widest font-outfit">Production Pipeline</h3>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5">{statusMessage || 'Processing...'}</p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-2xl font-bold text-blue-400 font-mono tracking-tighter">{Math.round(progress)}%</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative h-1.5 w-full bg-white/5 rounded-full overflow-hidden mb-10">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-600 via-blue-400 to-cyan-400 shadow-[0_0_20px_rgba(37,99,235,0.4)]"
        />
      </div>

      {/* Steps */}
      <div className="grid grid-cols-5 gap-4">
        {STAGE_ORDER.map((stage, idx) => {
          const isCompleted = idx < currentIndex || currentStage === 'COMPLETED_PROJECT';
          const isActive = idx === currentIndex;
          const config = STAGES[stage];

          return (
            <div key={stage} className="flex flex-col items-center gap-3">
              <div className={cn(
                "w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-700",
                isCompleted ? "bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.3)]" :
                isActive ? "bg-white/10 text-blue-400 border border-blue-500/30 scale-110" :
                "bg-white/5 text-zinc-700 border border-transparent"
              )}>
                {isCompleted ? <Check className="w-5 h-5" /> :
                 isActive ? <Loader2 className="w-5 h-5 animate-spin" /> :
                 <Circle className="w-4 h-4" />}
              </div>
              <span className={cn(
                "text-[9px] font-bold uppercase tracking-widest text-center",
                isActive ? "text-blue-400" : isCompleted ? "text-zinc-400" : "text-zinc-800"
              )}>
                {config.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Cinematic Logs */}
      <div className="mt-10 p-5 rounded-2xl bg-black/40 border border-white/5 font-mono">
        <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-2">
          <div className="flex items-center gap-2">
            <Terminal className="w-3.5 h-3.5 text-zinc-600" />
            <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Execution Logs</span>
          </div>
          <span className="text-[9px] text-zinc-800 uppercase tracking-widest">Node: Bestlink-AI-V2</span>
        </div>
        <div className="space-y-1.5 h-16 overflow-hidden">
          <div className="text-[10px] text-zinc-500 flex gap-3">
            <span className="text-blue-500/50">[SYSTEM]</span>
            <span className="opacity-80">Orchestrating multi-model inference...</span>
          </div>
          <AnimatePresence mode="popLayout">
            <motion.div 
              key={currentStage + statusMessage}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-[10px] text-zinc-200 flex gap-3"
            >
              <span className="text-green-500/50">[ACTIVE]</span>
              <span className="font-medium">{statusMessage}</span>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
