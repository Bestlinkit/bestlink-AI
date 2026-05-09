"use client";

import { useState } from "react";
import { 
  Maximize2,
  LayoutGrid,
  Layers,
  Globe,
  Download
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

type DeviceMode = 'mobile' | 'tablet' | 'desktop' | 'full';

export default function SandboxContainer() {
  const { workspaces, activeWorkspaceId } = useAppStore();
  const activeWorkspace = workspaces.find(w => w.id === activeWorkspaceId);
  const sandboxFiles = activeWorkspace?.sandboxFiles || [];

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [deviceMode, setDeviceMode] = useState<DeviceMode>('full');

  // Convert Zustand files to Sandpack format
  const sandpackFiles = sandboxFiles.reduce((acc, file) => {
    // Ensure files have leading slash
    const path = file.name.startsWith('/') ? file.name : `/${file.name}`;
    acc[path] = file.content;
    return acc;
  }, {} as Record<string, string>);

  // Determine template based on files
  const hasPackageJson = sandboxFiles.some(f => f.name === 'package.json');
  const template = hasPackageJson ? 'react' : 'vanilla';

  const getViewportWidth = () => {
    switch(deviceMode) {
      case 'mobile': return '375px';
      case 'tablet': return '768px';
      case 'desktop': return '1280px';
      default: return '100%';
    }
  };

  return (
    <div className={cn(
      "flex flex-col h-full bg-[#050505] overflow-hidden transition-all duration-300",
      isFullscreen ? "fixed inset-0 z-[100]" : "relative"
    )}>
      {/* Sandbox Header */}
      <div className="h-12 border-b border-white/5 flex items-center justify-between px-4 bg-[#09090b]">
        <div className="flex items-center gap-4 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
              Production Studio
            </span>
          </div>

          <div className="h-4 w-[1px] bg-white/10 mx-2" />

          {/* Device Controls */}
          <div className="flex bg-white/5 p-1 rounded-lg">
            {[
              { id: 'mobile', icon: LayoutGrid, label: 'Mobile' },
              { id: 'tablet', icon: Layers, label: 'Tablet' },
              { id: 'desktop', icon: Maximize2, label: 'Desktop' },
              { id: 'full', icon: Globe, label: 'Full' }
            ].map((mode) => (
              <button
                key={mode.id}
                onClick={() => setDeviceMode(mode.id as DeviceMode)}
                className={cn(
                  "p-1.5 rounded-md transition-all",
                  deviceMode === mode.id ? "bg-white/10 text-blue-400 shadow-sm" : "text-zinc-600 hover:text-zinc-400"
                )}
                title={mode.label}
              >
                <mode.icon className="w-3.5 h-3.5" />
              </button>
            ))}
          </div>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className={cn(
              "p-1.5 rounded-md transition-colors",
              isFullscreen ? "bg-blue-600 text-white" : "hover:bg-white/5 text-zinc-500"
            )}
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => {
              if (activeWorkspace) {
                exportProjectAsZip(activeWorkspace.name, sandboxFiles);
                toast.success("Project exported as ZIP");
              }
            }}
            className="p-1.5 hover:bg-white/5 rounded-md text-zinc-400 transition-colors"
            title="Export as ZIP"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Sandpack Integration */}
      <div className="flex-1 overflow-hidden">
        <SandpackProvider 
          template={template} 
          theme="dark" 
          files={sandpackFiles}
          options={{
            classes: {
              "sp-layout": "h-full rounded-none border-none",
              "sp-wrapper": "h-full",
            }
          }}
        >
          <SandpackLayout style={{ height: '100%', background: '#050505', border: 'none' }}>
            <SandpackFileExplorer />
            <SandpackCodeEditor 
              showLineNumbers
              showTabs
              closableTabs
              style={{ height: '100%' }}
            />
            <div className="flex-1 h-full bg-white relative flex items-center justify-center p-4">
              <div 
                className="bg-white shadow-2xl transition-all duration-500 ease-in-out border border-zinc-200 overflow-hidden"
                style={{ 
                  width: getViewportWidth(),
                  height: deviceMode === 'full' ? '100%' : '80%',
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
      </div>

      {/* Status Bar */}
      <footer className="h-8 border-t border-white/5 bg-[#09090b] flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-[9px] font-bold text-zinc-600 uppercase tracking-widest">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
            Sandpack Live Sync
          </div>
        </div>
        <div className="flex items-center gap-3 text-[9px] font-bold text-zinc-600 uppercase tracking-widest">
          <span className="text-blue-500/80">{deviceMode} viewport</span>
          <Layers className="w-3 h-3" />
        </div>
      </footer>
    </div>
  );
}
