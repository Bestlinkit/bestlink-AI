"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar/Sidebar";
import ChatInterface from "@/components/Chat/ChatInterface";
import SandboxContainer from "@/components/Sandbox/SandboxContainer";
import AgentSelector from "@/components/Agents/AgentSelector";
import LandingPage from "@/components/Landing/LandingPage";
import { useAppStore } from "@/store/useAppStore";
import { AnimatePresence, motion } from "framer-motion";
import { PanelLeftClose, PanelLeftOpen, Terminal, Sparkles, Zap, Globe } from "lucide-react";
import { cn } from "@/lib/utils";

import { 
  Panel, 
  Group as PanelGroup, 
  Separator as PanelResizeHandle 
} from "react-resizable-panels";

export default function Home() {
  const [isStarted, setIsStarted] = useState(false);
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
      const id = createWorkspace("Agency Website");
      setActiveWorkspace(id);
    } else if (!activeWorkspaceId) {
      setActiveWorkspace(workspaces[0].id);
    }
  }, [workspaces, activeWorkspaceId, createWorkspace, setActiveWorkspace]);

  if (!isStarted) {
    return <LandingPage onStart={() => setIsStarted(true)} />;
  }

  return (
    <main className="flex w-full h-screen overflow-hidden bg-[#050505] text-zinc-200 font-inter">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 relative min-w-0">
        {/* Premium Header */}
        <header className="h-14 border-b border-white/5 flex items-center justify-between px-6 bg-[#09090b]/80 backdrop-blur-xl z-30">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4">
              <button
                onClick={toggleSidebar}
                className="p-1.5 hover:bg-white/5 rounded-lg transition-all active:scale-95"
              >
                {isSidebarOpen ? (
                  <PanelLeftClose className="w-4 h-4 text-zinc-500" />
                ) : (
                  <PanelLeftOpen className="w-4 h-4 text-zinc-500" />
                )}
              </button>
              
              <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setIsStarted(false)}>
                <div className="w-6 h-6 rounded bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <Zap className="w-3.5 h-3.5 text-white fill-current" />
                </div>
                <span className="text-sm font-bold text-white font-outfit uppercase tracking-tighter">
                  Bestlink
                </span>
              </div>
            </div>

            <div className="h-4 w-[1px] bg-white/10" />

            <div className="hidden lg:block">
              <AgentSelector 
                activeAgentId={activeAgentId} 
                onSelect={setActiveAgent} 
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[9px] font-bold text-green-500 uppercase tracking-widest">System Live</span>
            </div>

            <button
              onClick={() => setSandboxOpen(!isSandboxOpen)}
              className={cn(
                "flex items-center gap-2 px-4 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border",
                isSandboxOpen 
                  ? "bg-blue-600 text-white border-blue-500 shadow-[0_0_20px_rgba(37,99,235,0.3)]" 
                  : "bg-white/5 text-zinc-400 border-white/5 hover:bg-white/10"
              )}
            >
              <Terminal className="w-3.5 h-3.5" />
              {isSandboxOpen ? "Close Preview" : "Open Preview"}
            </button>

            <button className="p-1.5 hover:bg-white/5 rounded-lg text-zinc-500 hover:text-white transition-all">
              <Globe className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Content Split using Resizable Panels */}
        <div className="flex-1 flex overflow-hidden relative">
          <PanelGroup orientation="horizontal">
            <Panel defaultSize={45} minSize={30}>
              <div className="h-full relative">
                <ChatInterface />
              </div>
            </Panel>
            
            {isSandboxOpen && (
              <>
                <PanelResizeHandle className="w-1.5 bg-transparent hover:bg-blue-600/10 transition-all relative group">
                  <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[1px] bg-white/5 group-hover:bg-blue-500/50" />
                </PanelResizeHandle>
                <Panel defaultSize={55} minSize={30}>
                  <div className="h-full border-l border-white/5 bg-[#050505]">
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
