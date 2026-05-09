"use client";

import { useState, useMemo } from "react";
import { 
  Maximize2,
  LayoutGrid,
  Layers,
  Globe,
  Download,
  RotateCcw,
  Monitor,
  Tablet,
  Smartphone
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

  // Convert Zustand files to Sandpack format with caching
  const sandpackFiles = useMemo(() => {
    return sandboxFiles.reduce((acc, file) => {
      // Ensure files have leading slash
      const path = file.name.startsWith('/') ? file.name : `/${file.name}`;
      acc[path] = file.content;
      return acc;
    }, {} as Record<string, string>);
  }, [sandboxFiles]);

  // Determine template based on files
  const template = useMemo(() => {
    const hasNextConfig = sandboxFiles.some(f => f.name.includes('next.config'));
    const hasPackageJson = sandboxFiles.some(f => f.name === 'package.json');
    if (hasNextConfig) return 'nextjs';
    if (hasPackageJson) return 'react';
    return 'vanilla';
  }, [sandboxFiles]);

  const getViewportWidth = () => {
    switch(deviceMode) {
      case 'mobile': return '375px';
      case 'tablet': return '768px';
      default: return '100%';
    }
  };

  return (
    <div className={cn(
      "flex flex-col h-full bg-[#050505] overflow-hidden transition-all duration-500 ease-in-out selection:bg-blue-500/30",
      isFullscreen ? "fixed inset-0 z-[100] p-6 bg-black/90 backdrop-blur-3xl" : "relative"
    )}>
      {/* Sandbox Header */}
      <div className={cn(
        "h-14 border-b border-white/5 flex items-center justify-between px-6 bg-[#09090b]/50 backdrop-blur-xl",
        isFullscreen && "rounded-t-3xl border-x border-t"
      )}>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
              Live Preview
            </span>
          </div>

          <div className="h-4 w-[1px] bg-white/10" />

          {/* Device Controls */}
          <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
            {[
              { id: 'mobile', icon: Smartphone, label: 'Mobile' },
              { id: 'tablet', icon: Tablet, label: 'Tablet' },
              { id: 'desktop', icon: Monitor, label: 'Desktop' }
            ].map((mode) => (
              <button
                key={mode.id}
                onClick={() => setDeviceMode(mode.id as DeviceMode)}
                className={cn(
                  "p-2 rounded-lg transition-all",
                  deviceMode === mode.id 
                    ? "bg-white/10 text-blue-400 shadow-xl" 
                    : "text-zinc-600 hover:text-zinc-400"
                )}
                title={mode.label}
              >
                <mode.icon className="w-4 h-4" />
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => {
              if (activeWorkspace) {
                exportProjectAsZip(activeWorkspace.name, sandboxFiles);
                toast.success("Project exported as ZIP");
              }
            }}
            className="p-2 hover:bg-white/5 rounded-xl text-zinc-500 hover:text-zinc-200 transition-all"
            title="Export Production Bundle"
          >
            <Download className="w-4 h-4" />
          </button>
          
          <div className="h-4 w-[1px] bg-white/10" />
          
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className={cn(
              "p-2 rounded-xl transition-all",
              isFullscreen ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" : "hover:bg-white/5 text-zinc-500"
            )}
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Sandpack Integration */}
      <div className={cn(
        "flex-1 overflow-hidden relative",
        isFullscreen && "bg-[#09090b] rounded-b-3xl border-x border-b border-white/5"
      )}>
        {sandboxFiles.length > 0 ? (
          <SandpackProvider 
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
            <SandpackLayout style={{ height: '100%', background: 'transparent', border: 'none', minHeight: 0 }}>
              <SandpackFileExplorer />
              <SandpackCodeEditor 
                showLineNumbers
                showTabs
                closableTabs
                style={{ height: '100%' }}
              />
              <div className="flex-1 h-full bg-[#050505] relative flex items-center justify-center p-4 md:p-8 overflow-hidden min-w-0">
                <div 
                  className="bg-white shadow-[0_0_100px_rgba(0,0,0,0.5)] transition-all duration-700 ease-in-out rounded-2xl overflow-hidden border border-white/5 relative"
                  style={{ 
                    width: getViewportWidth(),
                    height: '100%',
                    maxWidth: '100%',
                    maxHeight: '100%'
                  }}
                >
                  <SandpackPreview 
                    showOpenInCodeSandbox={false}
                    showRefreshButton={true}
                    style={{ height: '100%', border: 'none' }}
                  />
                </div>
              </div>
            </SandpackLayout>
          </SandpackProvider>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
            <div className="w-20 h-20 rounded-[2rem] bg-white/5 flex items-center justify-center border border-white/5">
              <Globe className="w-10 h-10 text-zinc-700" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white font-outfit">Waiting for Deployment</h3>
              <p className="text-zinc-600 text-sm font-medium">Describe your project to generate the initial codebase.</p>
            </div>
          </div>
        )}
      </div>

      {/* Status Bar */}
      <footer className="h-10 border-t border-white/5 bg-[#09090b]/50 backdrop-blur-xl flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-[9px] font-bold text-zinc-500 uppercase tracking-widest">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(37,99,235,0.5)]" />
            Virtual Runtime: {template}
          </div>
          <div className="h-3 w-[1px] bg-white/10" />
          <div className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">
            {sandboxFiles.length} Modules Loaded
          </div>
        </div>
        <div className="flex items-center gap-4 text-[9px] font-bold text-zinc-600 uppercase tracking-widest">
          <span className="text-blue-500/80 hover:text-blue-400 cursor-pointer transition-colors">Hot Module Reloading Enabled</span>
          <Layers className="w-3.5 h-3.5" />
        </div>
      </footer>
    </div>
  );
}
