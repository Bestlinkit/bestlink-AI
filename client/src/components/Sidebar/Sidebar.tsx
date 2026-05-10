"use client";

import { Plus, MessageSquare, Trash2, Edit3, Search, Settings, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useState } from "react";

export function Sidebar() {
  const { 
    workspaces, 
    activeWorkspaceId, 
    setActiveWorkspace, 
    createWorkspace, 
    deleteWorkspace, 
    updateWorkspace,
    isSidebarOpen,
    toggleSidebar
  } = useAppStore();

  const [searchTerm, setSearchTerm] = useState("");

  const filteredWorkspaces = workspaces.filter(w => 
    w.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <button 
        onClick={toggleSidebar}
        className={cn(
          "fixed top-4 left-4 z-[60] p-2 rounded-xl bg-white/5 border border-white/10 text-white/50 hover:text-white transition-all",
          isSidebarOpen && "left-[270px]"
        )}
      >
        {isSidebarOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeftOpen className="w-5 h-5" />}
      </button>

      <AnimatePresence mode="wait">
        {isSidebarOpen && (
          <motion.div
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            className="fixed top-0 left-0 bottom-0 w-[260px] bg-[#171717] border-r border-white/5 z-50 flex flex-col"
          >
            {/* New Project Button */}
            <div className="p-4 pt-16">
              <button 
                onClick={() => createWorkspace("New Project")}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white text-black font-bold text-sm hover:bg-zinc-200 transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" />
                New Project
              </button>
            </div>

            {/* Search */}
            <div className="px-4 pb-4">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-white/50 transition-colors" />
                <input 
                  type="text" 
                  placeholder="Search projects..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white/5 border border-white/5 rounded-xl py-2 pl-10 pr-4 text-xs text-white placeholder:text-white/20 outline-none focus:border-white/10 transition-all"
                />
              </div>
            </div>

            {/* Project List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-2 space-y-1">
              {filteredWorkspaces.map((w) => (
                <div 
                  key={w.id}
                  className={cn(
                    "group relative flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer transition-all",
                    activeWorkspaceId === w.id ? "bg-white/10 text-white" : "text-white/40 hover:bg-white/5 hover:text-white/80"
                  )}
                  onClick={() => setActiveWorkspace(w.id)}
                >
                  <MessageSquare className="w-4 h-4 shrink-0" />
                  <span className="text-xs font-bold truncate flex-1">{w.name}</span>
                  
                  {activeWorkspaceId === w.id && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          const newName = prompt("Rename project:", w.name);
                          if (newName) updateWorkspace(w.id, { name: newName });
                        }}
                        className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm("Delete this project?")) deleteWorkspace(w.id);
                        }}
                        className="p-1.5 rounded-lg hover:bg-red-500/10 text-white/40 hover:text-red-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Footer / Settings */}
            <div className="p-4 border-t border-white/5">
              <button className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-white/40 hover:bg-white/5 hover:text-white transition-all">
                <Settings className="w-4 h-4" />
                <span className="text-xs font-bold">Settings</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
