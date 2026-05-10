"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { 
  Maximize2,
  Globe,
  Download,
  Monitor,
  Tablet,
  Smartphone,
  RefreshCcw,
  Terminal,
  Activity,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";
import { toast } from "sonner";
import { exportProjectAsZip } from "@/lib/export";
import {
  SandpackProvider,
  SandpackLayout,
  SandpackCodeEditor,
  SandpackPreview,
  SandpackFileExplorer
} from "@codesandbox/sandpack-react";

type DeviceMode = 'mobile' | 'tablet' | 'desktop';

export default function SandboxContainer() {
  const { workspaces, activeWorkspaceId } = useAppStore();
  const activeWorkspace = workspaces.find(w => w.id === activeWorkspaceId);
  const sandboxFiles = activeWorkspace?.sandboxFiles || [];

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [deviceMode, setDeviceMode] = useState<DeviceMode>('desktop');
  const [key, setKey] = useState(0); // For atomic reloads
  const [isCompiling, setIsCompiling] = useState(false);
  const lastFilesHash = useRef<string>("");

  // Convert Zustand files to Sandpack format with hashing to prevent unnecessary reloads
  const sandpackFiles = useMemo(() => {
    return sandboxFiles.reduce((acc, file) => {
      const path = file.name.startsWith('/') ? file.name : `/${file.name}`;
      acc[path] = file.content;
      return acc;
    }, {} as Record<string, string>);
  }, [sandboxFiles]);

  // Handle compilation state and hash tracking separately
  useEffect(() => {
    const currentHash = JSON.stringify(sandpackFiles);
    if (currentHash !== lastFilesHash.current) {
      lastFilesHash.current = currentHash;
      setIsCompiling(true);
      const timer = setTimeout(() => setIsCompiling(false), 1200);
      return () => clearTimeout(timer);
    }
  }, [sandpackFiles]);

  const template = useMemo(() => {
    const fileNames = sandboxFiles.map(f => f.name.toLowerCase());
    const hasNextConfig = fileNames.some(n => n.includes('next.config'));
    if (hasNextConfig) return 'nextjs';
    
    const hasJsx = fileNames.some(n => n.endsWith('.tsx') || n.endsWith('.jsx'));
    const hasAppJs = fileNames.some(n => n.includes('app.js') || n.includes('app.tsx'));
    
    if (hasJsx || hasAppJs) return 'react';
    
    return 'static';
  }, [sandboxFiles]);

  const getViewportWidth = () => {
    switch(deviceMode) {
      case 'mobile': return '375px';
      case 'tablet': return '768px';
      default: return '100%';
    }
  };

  const handleRefresh = () => {
    setKey(prev => prev + 1);
    toast.success("Sandbox runtime reset.");
  };

  return (
    <div className={cn(
      "ide-panel h-full flex flex-col overflow-hidden transition-all duration-500",
      isFullscreen ? "fixed inset-0 z-[100] p-8 bg-black/95 backdrop-blur-3xl" : "relative"
    )}>
      {/* 👁️ MINIMAL PREVIEW HEADER */}
      <div className="h-14 border-b border-white/5 flex items-center justify-between px-8 bg-[#050505]/80 backdrop-blur-xl shrink-0">
        <div className="flex items-center gap-6">
          <div className="flex bg-white/5 p-1 rounded-xl border border-white/5 shadow-inner">
            {[
              { id: 'mobile', icon: Smartphone },
              { id: 'tablet', icon: Tablet },
              { id: 'desktop', icon: Monitor }
            ].map((mode) => (
              <button
                key={mode.id}
                onClick={() => setDeviceMode(mode.id as DeviceMode)}
                className={cn(
                  "p-2 rounded-lg transition-all",
                  deviceMode === mode.id ? "bg-white/10 text-white shadow-xl" : "text-zinc-700 hover:text-zinc-400"
                )}
              >
                <mode.icon className="w-3.5 h-3.5" />
              </button>
            ))}
          </div>
          
          <div className="h-4 w-[1px] bg-white/5" />
          
          <div className="flex items-center gap-3 px-3 py-1 rounded-full bg-blue-500/5 border border-blue-500/10">
            <div className={cn("w-1.5 h-1.5 rounded-full shadow-[0_0_8px_rgba(37,99,235,0.4)]", isCompiling ? "bg-blue-500 animate-pulse" : "bg-blue-500")} />
            <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest">
              {isCompiling ? "Syncing..." : "Live Runtime"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={handleRefresh}
            className="p-2 hover:bg-white/5 rounded-xl text-zinc-700 hover:text-white transition-all"
            title="Refresh Runtime"
          >
            <RefreshCcw size={14} className={cn(isCompiling && "animate-spin")} />
          </button>
          
          <button 
            onClick={() => activeWorkspace && exportProjectAsZip(activeWorkspace.name, sandboxFiles)}
            className="p-2 hover:bg-white/5 rounded-xl text-zinc-700 hover:text-white transition-all"
          >
            <Download size={14} />
          </button>
          
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className={cn(
              "p-2 rounded-xl transition-all",
              isFullscreen ? "bg-white text-black shadow-lg" : "hover:bg-white/5 text-zinc-700 hover:text-white"
            )}
          >
            <Maximize2 size={14} />
          </button>
        </div>
      </div>

      {/* PREVIEW VIEWPORT */}
      <div className="flex-1 overflow-hidden relative bg-[#0a0a0a] flex items-center justify-center p-6 lg:p-12">
        {sandboxFiles.length > 0 ? (
          <SandpackProvider 
            key={key}
            template={template as any} 
            theme="dark" 
            files={sandpackFiles}
          >
            <SandpackLayout style={{ height: '100%', background: 'transparent', border: 'none', width: '100%', display: 'flex', justifyContent: 'center' }}>
              <div 
                className={cn(
                  "bg-white shadow-[0_40px_100px_rgba(0,0,0,0.8)] transition-all duration-700 ease-in-out rounded-3xl overflow-hidden border border-white/10 relative",
                  isCompiling && "opacity-40 grayscale scale-[0.98]"
                )}
                style={{ 
                  width: getViewportWidth(),
                  height: '100%',
                  maxWidth: '100%'
                }}
              >
                <SandpackPreview 
                  showOpenInCodeSandbox={false}
                  showRefreshButton={false}
                  style={{ height: '100%', border: 'none' }}
                />

                <AnimatePresence>
                  {isCompiling && (
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex flex-col items-center justify-center z-50">
                      <div className="w-12 h-12 rounded-2xl bg-black/80 flex items-center justify-center shadow-2xl border border-white/5">
                        <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                      </div>
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </SandpackLayout>
          </SandpackProvider>
        ) : (
          <div className="flex flex-col items-center justify-center text-center space-y-6">
            <div className="w-20 h-20 rounded-[3rem] bg-white/[0.02] border border-white/5 flex items-center justify-center animate-pulse">
              <Globe className="w-10 h-10 text-zinc-800" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white uppercase tracking-widest">Awaiting Production</h3>
              <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest">Initialize prompt to start preview.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
}
