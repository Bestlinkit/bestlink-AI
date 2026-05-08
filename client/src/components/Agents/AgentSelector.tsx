"use client";

import { AGENTS } from "@/config/agents";
import { cn } from "@/lib/utils";
import { 
  Palette, 
  Layout, 
  Server, 
  Cloud,
  ChevronDown
} from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const ICON_MAP: any = {
  Palette,
  Layout,
  Server,
  Cloud
};

export default function AgentSelector({ activeAgentId, onSelect }: { activeAgentId: string, onSelect: (id: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const activeAgent = AGENTS.find(a => a.id === activeAgentId) || AGENTS[1];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
      >
        <div 
          className="w-2 h-2 rounded-full animate-pulse" 
          style={{ backgroundColor: activeAgent.color }}
        />
        <div className="flex flex-col items-start">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest leading-none mb-1">
            Active Specialist
          </span>
          <span className="text-sm font-medium text-zinc-200">
            {activeAgent.name}
          </span>
        </div>
        <ChevronDown className={cn("w-4 h-4 text-zinc-500 transition-transform", isOpen && "rotate-180")} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute top-full left-0 mt-2 w-72 p-2 rounded-2xl glass-dark z-50 border border-white/10 shadow-2xl"
            >
              <div className="px-3 py-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest border-b border-white/5 mb-2">
                Switch Specialist Agent
              </div>
              <div className="space-y-1">
                {AGENTS.map((agent) => {
                  const Icon = ICON_MAP[agent.icon];
                  return (
                    <button
                      key={agent.id}
                      onClick={() => {
                        onSelect(agent.id);
                        setIsOpen(false);
                      }}
                      className={cn(
                        "w-full flex items-start gap-3 p-3 rounded-xl transition-all group",
                        activeAgentId === agent.id 
                          ? "bg-white/10" 
                          : "hover:bg-white/5"
                      )}
                    >
                      <div 
                        className="p-2 rounded-lg bg-white/5 border border-white/10 group-hover:scale-110 transition-transform"
                        style={{ color: agent.color }}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col items-start text-left">
                        <span className="text-sm font-semibold text-zinc-200">{agent.name}</span>
                        <span className="text-[10px] text-zinc-500 leading-tight mt-1">{agent.description}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
