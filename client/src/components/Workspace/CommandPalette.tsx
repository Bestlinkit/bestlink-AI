"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  Terminal, 
  Settings, 
  Palette, 
  Code, 
  Zap, 
  Command,
  FilePlus,
  Layout,
  Cpu
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const ACTIONS = [
    { icon: FilePlus, name: "New Project", shortcut: "N", category: "Project" },
    { icon: Palette, name: "Change Theme", shortcut: "T", category: "App" },
    { icon: Terminal, name: "Open Terminal", shortcut: "`", category: "View" },
    { icon: Cpu, name: "Switch Agent", shortcut: "A", category: "AI" },
    { icon: Zap, name: "Quick Export", shortcut: "E", category: "Project" },
    { icon: Settings, name: "Settings", shortcut: ",", category: "App" },
  ];

  const filtered = ACTIONS.filter(a => 
    a.name.toLowerCase().includes(search.toLowerCase()) || 
    a.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="fixed left-1/2 top-[20%] -translate-x-1/2 w-full max-w-xl z-[101] p-2"
          >
            <div className="bg-[#0f0f0f] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-4 border-b border-white/5">
                <Search className="w-5 h-5 text-zinc-500" />
                <input
                  autoFocus
                  placeholder="Type a command or search..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-transparent border-none outline-none text-zinc-200 text-sm flex-1"
                />
                <div className="flex items-center gap-1.5 px-2 py-1 bg-white/5 border border-white/5 rounded text-[10px] text-zinc-500 font-bold">
                  ESC
                </div>
              </div>

              <div className="p-2 max-h-[400px] overflow-y-auto custom-scrollbar">
                {filtered.map((action, i) => (
                  <button
                    key={i}
                    className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-lg bg-white/5 border border-white/5 text-zinc-400 group-hover:text-blue-400 transition-colors">
                        <action.icon className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col items-start">
                        <span className="text-sm font-medium text-zinc-300">{action.name}</span>
                        <span className="text-[10px] text-zinc-500 uppercase tracking-widest">{action.category}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="px-1.5 py-0.5 bg-white/5 border border-white/5 rounded text-[10px] text-zinc-600 font-bold group-hover:text-zinc-400">
                        CMD
                      </div>
                      <div className="px-1.5 py-0.5 bg-white/5 border border-white/5 rounded text-[10px] text-zinc-600 font-bold group-hover:text-zinc-400">
                        {action.shortcut}
                      </div>
                    </div>
                  </button>
                ))}
                
                {filtered.length === 0 && (
                  <div className="p-8 text-center text-zinc-500 text-sm">
                    No commands found for "{search}"
                  </div>
                )}
              </div>

              <div className="px-4 py-2 bg-white/[0.02] border-t border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-4 text-[10px] text-zinc-600 font-medium">
                  <div className="flex items-center gap-1">
                    <span className="px-1 py-0.5 bg-white/5 rounded">↑↓</span>
                    <span>to navigate</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="px-1 py-0.5 bg-white/5 rounded">ENTER</span>
                    <span>to select</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-zinc-600 font-bold uppercase tracking-widest">
                  <Command className="w-3 h-3" />
                  Bestlink Digital
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
