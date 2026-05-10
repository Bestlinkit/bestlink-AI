"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Sidebar from "@/components/Sidebar/Sidebar";
import ChatInterface from "@/components/Chat/ChatInterface";
import SandboxContainer from "@/components/Sandbox/SandboxContainer";
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
  ShieldAlert,
  Box,
  Cpu
} from "lucide-react";

export default function Home() {
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
    setSandboxOpen,
    backendStatus,
    firebaseStatus,
    engineStatus,
    setBackendStatus
  } = useAppStore();

  // Polling for Backend Status
  useEffect(() => {
    const checkBackend = async () => {
      try {
        const start = Date.now();
        const res = await fetch('https://bestlink-digital-ai-backend.onrender.com/api/health');
        if (res.ok) {
          const latency = Date.now() - start;
          if (latency > 2000) setBackendStatus('SLEEPING');
          else setBackendStatus('ONLINE');
        } else {
          setBackendStatus('OFFLINE');
        }
      } catch (e) {
        setBackendStatus('OFFLINE');
      }
    };

    checkBackend();
    const interval = setInterval(checkBackend, 30000);
    return () => clearInterval(interval);
  }, [setBackendStatus]);

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

  return (
    <div className="h-screen w-full flex bg-[#050505] text-zinc-400 font-sans selection:bg-blue-500/30 overflow-hidden">
      {/* PANEL 1: SIDEBAR (HISTORY & FILES) */}
      <Sidebar />

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex min-w-0 h-full relative">
        
        {/* PANEL 2: AI CREATION HUB (CENTER) */}
        <div 
          className="flex flex-col min-w-0 h-full border-r border-white/5 bg-[#050505]"
          style={{ flex: isSandboxOpen ? `1 1 ${100 - previewWidth}%` : "1 1 100%" }}
        >
          <ChatInterface />
        </div>

        {/* PANEL 3: LIVE PREVIEW (RIGHT) */}
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
                "flex flex-col bg-[#050505] overflow-hidden relative h-full shadow-2xl",
                isResizing && "pointer-events-none"
              )}
              style={{ flex: `0 0 ${previewWidth}%` }}
            >
              <SandboxContainer />
            </div>
          </>
        )}
      </main>

      {/* OVERLAY FOR RESIZING PROTECTION */}
      {isResizing && <div className="fixed inset-0 z-[100] cursor-col-resize" />}
    </div>
  );
}
