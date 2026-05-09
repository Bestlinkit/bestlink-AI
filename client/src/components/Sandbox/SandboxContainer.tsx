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
    const files = sandboxFiles.reduce((acc, file) => {
      const path = file.name.startsWith('/') ? file.name : `/${file.name}`;
      acc[path] = file.content;
      return acc;
    }, {} as Record<string, string>);

    const currentHash = JSON.stringify(files);
    if (currentHash !== lastFilesHash.current) {
      lastFilesHash.current = currentHash;
      // Trigger a brief compilation state for UX
      setIsCompiling(true);
      setTimeout(() => setIsCompiling(false), 800);
    }
    return files;
  }, [sandboxFiles]);

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
      "flex flex-col h-full bg-[#050505] overflow-hidden transition-all duration-500",
      isFullscreen ? "fixed inset-0 z-[100] p-6 bg-black/90 backdrop-blur-3xl" : "relative"
    )}>
      {/* Sandbox Header */}
      <div className="h-14 border-b border-white/5 flex items-center justify-between px-6 bg-[#09090b]/80 backdrop-blur-xl shrink-0">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-2 h-2 rounded-full transition-all duration-500",
              isCompiling ? "bg-blue-500 animate-ping" : "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]"
            )} />
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest font-outfit">
              {isCompiling ? "Compiling VFS..." : "Runtime Online"}
            </span>
          </div>

          <div className="h-4 w-[1px] bg-white/10" />

          {/* Device Controls */}
          <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
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
                  deviceMode === mode.id ? "bg-white/10 text-blue-400 shadow-xl" : "text-zinc-600 hover:text-zinc-400"
                )}
              >
                <mode.icon className="w-4 h-4" />
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={handleRefresh}
            className="p-2 hover:bg-white/5 rounded-xl text-zinc-500 hover:text-blue-400 transition-all"
            title="Hard Refresh Runtime"
          >
            <RefreshCcw className={cn("w-4 h-4", isCompiling && "animate-spin")} />
          </button>
          
          <button 
            onClick={() => activeWorkspace && exportProjectAsZip(activeWorkspace.name, sandboxFiles)}
            className="p-2 hover:bg-white/5 rounded-xl text-zinc-500 hover:text-zinc-200 transition-all"
          >
            <Download className="w-4 h-4" />
          </button>
          
          <div className="h-4 w-[1px] bg-white/10" />
          
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className={cn(
              "p-2 rounded-xl transition-all",
              isFullscreen ? "bg-blue-600 text-white shadow-lg" : "hover:bg-white/5 text-zinc-500"
            )}
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Sandbox Area */}
      <div className="flex-1 overflow-hidden relative">
        {sandboxFiles.length > 0 ? (
          <SandpackProvider 
            key={key}
            template={template as any} 
            theme="dark" 
            files={sandpackFiles}
            options={{
              classes: {
                "sp-layout": "h-full rounded-none border-none bg-transparent",
                "sp-wrapper": "h-full",
              }
            }}
          >
            <SandpackLayout style={{ height: '100%', background: 'transparent', border: 'none' }}>
              <div className="flex h-full w-full relative">
                <div className="hidden lg:block w-48 border-r border-white/5">
                  <SandpackFileExplorer />
                </div>
                
                <div className="flex-1 h-full bg-[#050505] relative flex items-center justify-center p-4 md:p-8 overflow-hidden">
                  <div 
                    className={cn(
                      "bg-white shadow-[0_0_100px_rgba(0,0,0,0.8)] transition-all duration-700 ease-in-out rounded-2xl overflow-hidden border border-white/5 relative",
                      isCompiling && "opacity-50 grayscale scale-[0.98]"
                    )}
                    style={{ 
                      width: getViewportWidth(),
                      height: '100%',
                      maxWidth: '100%'
                    }}
                  >
                    <SandpackPreview 
                      showOpenInCodeSandbox={false}
                      showRefreshButton={true}
                      style={{ height: '100%', border: 'none' }}
                    />

                    <AnimatePresence>
                      {isCompiling && (
                        <div className="absolute inset-0 bg-[#050505]/60 backdrop-blur-sm flex flex-col items-center justify-center z-50">
                          <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-4" />
                          <span className="text-[10px] font-bold text-white uppercase tracking-widest animate-pulse">
                            Injecting Atomic Codebase...
                          </span>
                        </div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </SandpackLayout>
          </SandpackProvider>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
            <div className="w-20 h-20 rounded-[2.5rem] bg-white/[0.02] border border-white/5 flex items-center justify-center animate-pulse">
              <Terminal className="w-10 h-10 text-zinc-800" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white font-outfit uppercase tracking-tighter">Workspace Static</h3>
              <p className="text-zinc-600 text-sm font-medium">Initialize production engine to start preview.</p>
            </div>
          </div>
        )}
      </div>

      {/* Infrastructure Status Footer */}
      <footer className="h-10 border-t border-white/5 bg-[#09090b]/80 backdrop-blur-xl flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-[9px] font-bold text-zinc-500 uppercase tracking-widest">
            <Activity className={cn("w-3 h-3 text-blue-500", isCompiling && "animate-pulse")} />
            VFS Sync: {sandboxFiles.length} files
          </div>
          <div className="h-3 w-[1px] bg-white/10" />
          <div className="text-[9px] font-bold text-green-500 uppercase tracking-widest">
            HMR Active
          </div>
        </div>
        <div className="flex items-center gap-2 text-[9px] font-bold text-zinc-600 uppercase tracking-widest">
          Node: bestlink-runtime-v2
        </div>
      </footer>
    </div>
  );
}
