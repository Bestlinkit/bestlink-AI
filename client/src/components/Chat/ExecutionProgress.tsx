"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Check, Circle, Loader2, Sparkles, Terminal } from "lucide-react";
import { cn } from "@/lib/utils";

export type PipelineStage = 
  | 'BUILD_START'
  | 'PLANNING_PROJECT'
  | 'GENERATING_FILES'
  | 'VALIDATING_OUTPUT'
  | 'FINALIZING_PROJECT'
  | 'COMPLETED_PROJECT'
  | 'COMPLETE'
  | 'EXECUTION_ERROR'
  | '[KEEP-ALIVE]';

interface StageConfig {
  label: string;
  description: string;
}

const STAGES: Record<string, StageConfig> = {
  BUILD_START: { label: 'Init', description: 'Initializing pipeline...' },
  PLANNING_PROJECT: { label: 'Planning', description: 'Analyzing project scope and intent...' },
  GENERATING_FILES: { label: 'Build', description: 'Generating core components...' },
  VALIDATING_OUTPUT: { label: 'Validate', description: 'Verifying code integrity...' },
  FINALIZING_PROJECT: { label: 'Finalize', description: 'Constructing safe Virtual File System...' }
};

const STAGE_ORDER = [
  'BUILD_START',
  'PLANNING_PROJECT',
  'GENERATING_FILES',
  'VALIDATING_OUTPUT',
  'FINALIZING_PROJECT'
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
  const progress = ((currentIndex + 1) / STAGE_ORDER.length) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="w-full max-w-2xl mx-auto my-8 p-6 glass-panel rounded-3xl border border-blue-500/10 shadow-[0_0_50px_rgba(37,99,235,0.1)]"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-blue-400 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-widest font-outfit">AI Execution Engine</h3>
            <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">{statusMessage || 'Initializing...'}</p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-xl font-bold text-blue-400 font-mono">{Math.round(progress)}%</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative h-1.5 w-full bg-white/5 rounded-full overflow-hidden mb-8">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-600 via-blue-400 to-cyan-400 shadow-[0_0_15px_rgba(37,99,235,0.5)]"
        />
      </div>

      {/* Steps */}
      <div className="grid grid-cols-6 gap-2">
        {STAGE_ORDER.map((stage, idx) => {
          const isCompleted = idx < currentIndex;
          const isActive = idx === currentIndex;
          const config = STAGES[stage];

          return (
            <div key={stage} className="flex flex-col items-center gap-2">
              <div className={cn(
                "w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-500",
                isCompleted ? "bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.3)]" :
                isActive ? "bg-white/10 text-blue-400 border border-blue-500/30 scale-110" :
                "bg-white/5 text-zinc-700 border border-transparent"
              )}>
                {isCompleted ? <Check className="w-4 h-4" /> :
                 isActive ? <Loader2 className="w-4 h-4 animate-spin" /> :
                 <Circle className="w-3 h-3" />}
              </div>
              <span className={cn(
                "text-[8px] font-bold uppercase tracking-widest text-center",
                isActive ? "text-blue-400" : isCompleted ? "text-zinc-400" : "text-zinc-700"
              )}>
                {config.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Live Logs Simulation */}
      <div className="mt-8 p-4 rounded-2xl bg-black/40 border border-white/5 font-mono">
        <div className="flex items-center gap-2 mb-2">
          <Terminal className="w-3 h-3 text-zinc-600" />
          <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest text-zinc-400">Execution Logs</span>
        </div>
        <div className="space-y-1">
          <div className="text-[10px] text-zinc-500 flex gap-2">
            <span className="text-blue-500/50">[SYSTEM]</span>
            <span>Thread initialized on Bestlink Node-12</span>
          </div>
          <AnimatePresence mode="popLayout">
            <motion.div 
              key={currentStage}
              initial={{ opacity: 0, x: -5 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-[10px] text-zinc-300 flex gap-2"
            >
              <span className="text-green-500/50">[AGENT]</span>
              <span>{statusMessage}</span>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
