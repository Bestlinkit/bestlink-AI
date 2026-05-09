"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar/Sidebar";
import ChatInterface from "@/components/Chat/ChatInterface";
import SandboxContainer from "@/components/Sandbox/SandboxContainer";
import LandingPage from "@/components/Landing/LandingPage";
import { useAppStore } from "@/store/useAppStore";
import { cn } from "@/lib/utils";
import { Zap, Terminal, Globe, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import * as Resizable from "react-resizable-panels";

// Bypass type issues with unstable library versions
const PanelGroup = (Resizable as any).PanelGroup || (Resizable as any).Group;
const Panel = (Resizable as any).Panel;
const PanelResizeHandle = (Resizable as any).PanelResizeHandle || (Resizable as any).Separator;

export default function Home() {
  const [isStarted, setIsStarted] = useState(false);
  const { 
    isSidebarOpen, 
    toggleSidebar, 
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
      const id = createWorkspace("Production Studio");
      setActiveWorkspace(id);
    } else if (!activeWorkspaceId) {
      setActiveWorkspace(workspaces[0].id);
    }
  }, [workspaces, activeWorkspaceId, createWorkspace, setActiveWorkspace]);

  if (!isStarted) {
    return <LandingPage onStart={() => setIsStarted(true)} />;
  }

  return (
    <div className="h-screen w-full bg-[#050505] text-zinc-200 overflow-hidden flex font-inter selection:bg-blue-500/30">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0 relative h-full">
        {/* PREMIUM TOPBAR */}
        <header className="h-14 border-b border-white/5 flex items-center justify-between px-6 bg-[#09090b]/80 backdrop-blur-xl z-50 shrink-0">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4">
              <button
                onClick={toggleSidebar}
                className="p-1.5 hover:bg-white/5 rounded-lg transition-all active:scale-95 text-zinc-500"
              >
                {isSidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
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
            <div className="hidden md:flex items-center gap-2">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Studio</span>
              <div className="px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-[9px] font-bold text-blue-400 uppercase">Pro</div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setSandboxOpen(!isSandboxOpen)}
              className={cn(
                "flex items-center gap-2 px-4 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border",
                isSandboxOpen 
                  ? "bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.1)]" 
                  : "bg-white/5 text-zinc-400 border-white/5 hover:bg-white/10"
              )}
            >
              <Terminal className="w-3.5 h-3.5" />
              {isSandboxOpen ? "Close Preview" : "Open Preview"}
            </button>

            <div className="h-6 w-[1px] bg-white/10 mx-1" />
            
            <button className="p-1.5 hover:bg-white/5 rounded-lg text-zinc-500 hover:text-white transition-all">
              <Globe className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* 
          STABLE WORKSPACE 
          Using dynamic component detection to avoid library version conflicts
        */}
        <div className="flex-1 min-h-0 relative">
          {PanelGroup ? (
            <PanelGroup direction="horizontal">
              <Panel defaultSize={45} minSize={30} className="relative flex flex-col">
                <div className="flex-1 overflow-hidden">
                  <ChatInterface />
                </div>
              </Panel>
              
              {isSandboxOpen && (
                <>
                  <PanelResizeHandle className="w-[1px] bg-white/5 hover:bg-blue-500/50 transition-all cursor-col-resize relative group">
                    <div className="absolute inset-y-0 -left-1 -right-1 z-10" />
                  </PanelResizeHandle>
                  <Panel defaultSize={55} minSize={30} className="relative flex flex-col">
                    <div className="flex-1 bg-[#050505] overflow-hidden">
                      <SandboxContainer />
                    </div>
                  </Panel>
                </>
              )}
            </PanelGroup>
          ) : (
            <div className="flex h-full w-full overflow-hidden">
               <div className="flex-1 overflow-hidden">
                  <ChatInterface />
               </div>
               {isSandboxOpen && (
                 <div className="w-[55%] border-l border-white/5 overflow-hidden">
                   <SandboxContainer />
                 </div>
               )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
