"use client";

import { MODELS, ModelConfig } from "@shared/models";
import { cn } from "@/lib/utils";
import { 
  ChevronDown, 
  Sparkles, 
  Code, 
  Brain, 
  Zap,
  Info,
  Shield,
  Cpu
} from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "@/store/useAppStore";

export default function ModelSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const { model, setModel } = useAppStore();
  
  const currentModel = MODELS.find(m => m.id === model) || MODELS[0];

  const groupedModels = MODELS.reduce((acc: any, model) => {
    if (!acc[model.provider]) acc[model.provider] = [];
    acc[model.provider].push(model);
    return acc;
  }, {});

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-4 py-2 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.08] hover:border-white/10 transition-all group active:scale-95 shadow-xl"
      >
        <div className="w-8 h-8 rounded-lg bg-blue-600/10 flex items-center justify-center border border-blue-500/20 group-hover:scale-110 transition-transform">
          <Cpu className="w-4 h-4 text-blue-400" />
        </div>
        <div className="flex flex-col items-start">
          <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest leading-none mb-1">
            Engine
          </span>
          <span className="text-xs font-bold text-zinc-200">
            {currentModel.name}
          </span>
        </div>
        <ChevronDown className={cn("w-3.5 h-3.5 text-zinc-600 transition-transform duration-500", isOpen && "rotate-180")} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute top-full left-0 mt-3 w-80 p-3 rounded-3xl bg-[#09090b] border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] z-50 overflow-hidden"
            >
              <div className="absolute inset-0 bg-blue-500/5 blur-3xl pointer-events-none" />
              
              <div className="relative px-3 py-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest border-b border-white/5 mb-3 flex items-center justify-between">
                Intelligence Matrix
                <Shield className="w-3 h-3 text-zinc-700" />
              </div>
              
              <div className="relative max-h-[420px] overflow-y-auto custom-scrollbar space-y-5 p-1">
                {Object.entries(groupedModels).map(([provider, providerModels]: [string, any]) => (
                  <div key={provider} className="space-y-2">
                    <div className="px-3 text-[9px] font-bold text-zinc-600 uppercase tracking-tighter">
                      {provider} Infrastructure
                    </div>
                    {providerModels.map((m: ModelConfig) => (
                      <button
                        key={m.id}
                        onClick={() => {
                          setModel(m.id);
                          setIsOpen(false);
                        }}
                        className={cn(
                          "w-full flex flex-col gap-1.5 p-3 rounded-2xl transition-all group border",
                          model === m.id 
                            ? "bg-blue-600/10 border-blue-500/30" 
                            : "bg-white/[0.02] border-transparent hover:bg-white/5 hover:border-white/10"
                        )}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className={cn("text-sm font-bold transition-colors", model === m.id ? "text-blue-400" : "text-zinc-300 group-hover:text-white")}>{m.name}</span>
                          {m.free && (
                            <span className="text-[8px] bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-widest">
                              Open
                            </span>
                          )}
                        </div>
                        
                        <div className="flex flex-wrap gap-1.5">
                          {m.recommended && (
                            <div className="flex items-center gap-1 text-[8px] text-yellow-500 font-bold uppercase tracking-tighter">
                              <Sparkles className="w-2.5 h-2.5" />
                              Strategic
                            </div>
                          )}
                          {m.coding && (
                            <div className="flex items-center gap-1 text-[8px] text-blue-500 font-bold uppercase tracking-tighter">
                              <Code className="w-2.5 h-2.5" />
                              Production
                            </div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
