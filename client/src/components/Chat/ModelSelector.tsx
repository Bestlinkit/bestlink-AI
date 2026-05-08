"use client";

import { MODELS, ModelConfig } from "@shared/models";
import { cn } from "@/lib/utils";
import { 
  ChevronDown, 
  Sparkles, 
  Code, 
  Brain, 
  Zap,
  Info
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
        className="flex items-center gap-3 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
      >
        <Zap className="w-4 h-4 text-yellow-400" />
        <div className="flex flex-col items-start">
          <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-tighter leading-none mb-0.5">
            Active Intelligence
          </span>
          <span className="text-xs font-medium text-zinc-200">
            {currentModel.name}
          </span>
        </div>
        <ChevronDown className={cn("w-3.5 h-3.5 text-zinc-500 transition-transform", isOpen && "rotate-180")} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute top-full left-0 mt-2 w-80 p-2 rounded-2xl glass-dark z-50 border border-white/10 shadow-2xl overflow-hidden"
            >
              <div className="px-3 py-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest border-b border-white/5 mb-2 flex items-center justify-between">
                Select AI Intelligence
                <Info className="w-3 h-3 cursor-help text-zinc-600" />
              </div>
              
              <div className="max-h-[400px] overflow-y-auto custom-scrollbar space-y-4 p-1">
                {Object.entries(groupedModels).map(([provider, providerModels]: [string, any]) => (
                  <div key={provider} className="space-y-1">
                    <div className="px-3 text-[10px] font-bold text-zinc-600 uppercase tracking-tight">
                      {provider}
                    </div>
                    {providerModels.map((m: ModelConfig) => (
                      <button
                        key={m.id}
                        onClick={() => {
                          setModel(m.id);
                          setIsOpen(false);
                        }}
                        className={cn(
                          "w-full flex flex-col gap-1 p-2.5 rounded-xl transition-all group",
                          model === m.id 
                            ? "bg-blue-500/10 border border-blue-500/20" 
                            : "hover:bg-white/5 border border-transparent"
                        )}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="text-sm font-semibold text-zinc-200">{m.name}</span>
                          {m.free && (
                            <span className="text-[9px] bg-green-500/10 text-green-400 border border-green-500/20 px-1.5 py-0.5 rounded-full font-bold uppercase">
                              Free
                            </span>
                          )}
                        </div>
                        
                        <div className="flex flex-wrap gap-1 mt-1">
                          {m.recommended && (
                            <span className="flex items-center gap-1 text-[8px] text-yellow-400 bg-yellow-400/5 px-1.5 py-0.5 rounded-md border border-yellow-400/10 uppercase font-bold">
                              <Sparkles className="w-2 h-2" />
                              Recommended
                            </span>
                          )}
                          {m.coding && (
                            <span className="flex items-center gap-1 text-[8px] text-blue-400 bg-blue-400/5 px-1.5 py-0.5 rounded-md border border-blue-400/10 uppercase font-bold">
                              <Code className="w-2 h-2" />
                              Coding
                            </span>
                          )}
                          {m.reasoning && (
                            <span className="flex items-center gap-1 text-[8px] text-purple-400 bg-purple-400/5 px-1.5 py-0.5 rounded-md border border-purple-400/10 uppercase font-bold">
                              <Brain className="w-2 h-2" />
                              Reasoning
                            </span>
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
