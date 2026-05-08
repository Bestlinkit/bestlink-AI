"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar/Sidebar";
import ChatInterface from "@/components/Chat/ChatInterface";
import SandboxContainer from "@/components/Sandbox/SandboxContainer";
import AgentSelector from "@/components/Agents/AgentSelector";
import { useAppStore } from "@/store/useAppStore";
import { AnimatePresence, motion } from "framer-motion";
import { PanelLeftClose, PanelLeftOpen, Terminal } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Home() {
  const { isSidebarOpen, toggleSidebar, currentChatId, activeAgentId, setAgent } = useAppStore();
  const [showSandbox, setShowSandbox] = useState(false);

  return (
    <main className="flex w-full h-screen overflow-hidden">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 relative min-w-0">
        {/* Header/Controls */}
        <header className="h-14 border-b border-border flex items-center justify-between px-4 glass-dark z-20">
          <div className="flex items-center gap-4">
            <button
              onClick={toggleSidebar}
              className="p-2 hover:bg-white/5 rounded-md transition-colors"
            >
              {isSidebarOpen ? (
                <PanelLeftClose className="w-5 h-5 text-zinc-400" />
              ) : (
                <PanelLeftOpen className="w-5 h-5 text-zinc-400" />
              )}
            </button>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-zinc-300 font-outfit uppercase tracking-wider">
                Bestlink Digital AI
              </span>
              <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-1.5 py-0.5 rounded-full uppercase font-bold">
                PRO
              </span>
            </div>
            
            <div className="h-6 w-[1px] bg-white/10 mx-2" />
            
            <AgentSelector 
              activeAgentId={activeAgentId} 
              onSelect={setAgent} 
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSandbox(!showSandbox)}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                showSandbox 
                  ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" 
                  : "hover:bg-white/5 text-zinc-400"
              )}
            >
              <Terminal className="w-4 h-4" />
              {showSandbox ? "Hide Sandbox" : "Show Sandbox"}
            </button>
          </div>
        </header>

        {/* Content Split */}
        <div className="flex-1 flex overflow-hidden">
          <div className={cn(
            "flex-1 flex flex-col transition-all duration-300",
            showSandbox ? "w-1/2" : "w-full"
          )}>
            <ChatInterface />
          </div>

          <AnimatePresence>
            {showSandbox && (
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="w-1/2 border-l border-border bg-black relative"
              >
                <SandboxContainer />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </main>
  );
}
