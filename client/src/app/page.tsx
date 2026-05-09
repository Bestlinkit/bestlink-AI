"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Sidebar from "@/components/Sidebar/Sidebar";
import ChatInterface from "@/components/Chat/ChatInterface";
import SandboxContainer from "@/components/Sandbox/SandboxContainer";
import LandingPage from "@/components/Landing/LandingPage";
import { useAppStore } from "@/store/useAppStore";
import { useFirestoreSync } from "@/store/useFirestoreSync";
import { cn } from "@/lib/utils";
import { 
  Zap, 
  Terminal, 
  Globe, 
  PanelLeftClose, 
  PanelLeftOpen, 
  Database,
  Wifi,
  WifiOff,
  CloudLightning,
  AlertCircle,
  ShieldAlert
} from "lucide-react";

export default function Home() {
  const [isStarted, setIsStarted] = useState(false);
  const [previewWidth, setPreviewWidth] = useState(55); // percentage
  const [isResizing, setIsResizing] = useState(false);
  const resizerRef = useRef<HTMLDivElement>(null);

  const { status: syncStatus } = useFirestoreSync();

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

  const startResizing = useCallback(() => setIsResizing(true), []);
  const stopResizing = useCallback(() => setIsResizing(false), []);
  
  const resize = useCallback((e: MouseEvent) => {
    if (isResizing) {
      const newWidth = ((window.innerWidth - e.clientX) / window.innerWidth) * 100;
      if (newWidth > 25 && newWidth < 85) {
        setPreviewWidth(newWidth);
      }
    }
  }, [isResizing]);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener("mousemove", resize);
      window.addEventListener("mouseup", stopResizing);
    }
    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [isResizing, resize, stopResizing]);

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
                <div className="w-6 h-6 rounded bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
                  <Zap className="w-3.5 h-3.5 text-white fill-current" />
                </div>
                <span className="text-sm font-bold text-white font-outfit uppercase tracking-tighter">
                  Bestlink
                </span>
              </div>
            </div>
            
            <div className="h-4 w-[1px] bg-white/10" />
            
            {/* FIRESTORE CONNECTION GUARD BADGE */}
            <div className={cn(
              "flex items-center gap-2 px-3 py-1 rounded-full border transition-all duration-500",
              syncStatus === 'ONLINE' ? "bg-green-500/5 border-green-500/20 text-green-500" :
              syncStatus === 'RECOVERING' ? "bg-blue-500/5 border-blue-500/20 text-blue-500 animate-pulse" :
              syncStatus === 'OFFLINE' ? "bg-yellow-500/5 border-yellow-500/20 text-yellow-500" :
              syncStatus === 'PERMISSION_DENIED' ? "bg-red-500/10 border-red-500/30 text-red-500 shadow-[0_0_10px_rgba(239,68,68,0.2)]" :
              "bg-red-500/5 border-red-500/20 text-red-500"
            )}>
              {syncStatus === 'ONLINE' ? <Wifi className="w-3 h-3" /> :
               syncStatus === 'RECOVERING' ? <CloudLightning className="w-3 h-3" /> :
               syncStatus === 'OFFLINE' ? <WifiOff className="w-3 h-3" /> :
               syncStatus === 'PERMISSION_DENIED' ? <ShieldAlert className="w-3 h-3" /> :
               <AlertCircle className="w-3 h-3" />}
              <span className="text-[9px] font-bold uppercase tracking-widest">
                {syncStatus?.replace('_', ' ')}
              </span>
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
              {isSandboxOpen ? "Close Preview" : "Live Preview"}
            </button>

            <div className="h-6 w-[1px] bg-white/10 mx-1" />
            
            <button className="p-1.5 hover:bg-white/5 rounded-lg text-zinc-500 hover:text-white transition-all">
              <Globe className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* BULLETPROOF WORKSPACE LAYOUT */}
        <div className="flex-1 min-h-0 flex relative">
          <div 
            className="flex flex-col min-w-0 h-full overflow-hidden"
            style={{ flex: isSandboxOpen ? `1 1 ${100 - previewWidth}%` : "1 1 100%" }}
          >
            <ChatInterface />
          </div>

          {isSandboxOpen && (
            <>
              {/* DRAGGABLE RESIZER */}
              <div 
                onMouseDown={startResizing}
                className={cn(
                  "w-[2px] bg-white/5 hover:bg-blue-500/50 transition-all cursor-col-resize relative z-40 group",
                  isResizing && "bg-blue-500"
                )}
              >
                <div className="absolute inset-y-0 -left-2 -right-2" />
              </div>

              <div 
                className={cn(
                  "flex flex-col bg-[#050505] overflow-hidden relative h-full",
                  isResizing && "pointer-events-none"
                )}
                style={{ flex: `0 0 ${previewWidth}%` }}
              >
                <SandboxContainer />
              </div>
            </>
          )}
        </div>
      </main>

      {/* OVERLAY FOR RESIZING PROTECTION */}
      {isResizing && <div className="fixed inset-0 z-[100] cursor-col-resize" />}
    </div>
  );
}
