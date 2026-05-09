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

import { 
  Panel, 
  PanelGroup, 
  PanelResizeHandle 
} from "react-resizable-panels";

export default function Home() {
  const { 
    isSidebarOpen, 
    toggleSidebar, 
    activeAgentId, 
    setActiveAgent,
    workspaces,
    activeWorkspaceId,
    createWorkspace,
    setActiveWorkspace,
    isSandboxOpen,
    setSandboxOpen
  } = useAppStore();

  // Initialize workspace if none exists
  useEffect(() => {
    if (workspaces.length === 0) {
      const id = createWorkspace("Default Project");
      setActiveWorkspace(id);
    } else if (!activeWorkspaceId) {
      setActiveWorkspace(workspaces[0].id);
    }
  }, [workspaces, activeWorkspaceId, createWorkspace, setActiveWorkspace]);

  return (
    <main className="flex w-full h-screen overflow-hidden bg-[#050505] text-zinc-200">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 relative min-w-0">
        {/* Header/Controls */}
        <header className="h-14 border-b border-white/5 flex items-center justify-between px-4 bg-[#09090b]/80 backdrop-blur-xl z-30">
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
              <span className="text-sm font-bold text-white font-outfit uppercase tracking-wider">
                Bestlink
              </span>
              <div className="h-4 w-[1px] bg-white/10" />
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                Production Studio
              </span>
            </div>
            
            <div className="h-6 w-[1px] bg-white/10 mx-2 hidden md:block" />
            
            <div className="hidden lg:block">
              <AgentSelector 
                activeAgentId={activeAgentId} 
                onSelect={setActiveAgent} 
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSandboxOpen(!isSandboxOpen)}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border",
                isSandboxOpen 
                  ? "bg-blue-600/10 text-blue-400 border-blue-500/30 shadow-[0_0_15px_rgba(37,99,235,0.1)]" 
                  : "hover:bg-white/5 text-zinc-500 border-transparent"
              )}
            >
              <Terminal className="w-3.5 h-3.5" />
              {isSandboxOpen ? "Hide Sandbox" : "Show Sandbox"}
            </button>
          </div>
        </header>

        {/* Content Split using Resizable Panels */}
        <div className="flex-1 flex overflow-hidden relative">
          <PanelGroup direction="horizontal">
            <Panel defaultSize={50} minSize={30}>
              <div className="h-full">
                <ChatInterface />
              </div>
            </Panel>
            
            {isSandboxOpen && (
              <>
                <PanelResizeHandle className="w-1.5 bg-transparent hover:bg-blue-600/20 transition-colors relative">
                  <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[1px] bg-white/5" />
                </PanelResizeHandle>
                <Panel defaultSize={50} minSize={30}>
                  <div className="h-full border-l border-white/5">
                    <SandboxContainer />
                  </div>
                </Panel>
              </>
            )}
          </PanelGroup>
        </div>
      </div>
    </main>
  );
}
