"use client";

import { useState } from "react";
import Editor from "@monaco-editor/react";
import { 
  Play, 
  RotateCcw, 
  Download, 
  Maximize2,
  FileCode,
  Layout,
  Layers,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import FileTree from "@/components/Workspace/FileTree";

export default function SandboxContainer() {
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
  const [code, setCode] = useState(`<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { background: #050505; color: white; display: flex; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif; }
    .card { background: #0f0f0f; border: 1px solid #1f1f1f; padding: 2rem; border-radius: 1rem; text-align: center; }
  </style>
</head>
<body>
  <div class="card">
    <h1 class="text-3xl font-bold text-blue-500 mb-4">Bestlink Digital AI</h1>
    <p class="text-zinc-400">Welcome to your elite coding sandbox.</p>
    <button class="mt-6 px-6 py-2 bg-blue-600 rounded-lg font-bold hover:bg-blue-500 transition-colors">
      Get Started
    </button>
  </div>
</body>
</html>`);

  return (
    <div className="flex flex-col h-full bg-[#050505]">
      {/* Sandbox Header */}
      <div className="h-12 border-b border-white/5 flex items-center justify-between px-4 bg-sidebar">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('editor')}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
              activeTab === 'editor' ? "bg-white/5 text-white" : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            <FileCode className="w-3.5 h-3.5" />
            index.html
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
              activeTab === 'preview' ? "bg-blue-500/10 text-blue-400" : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            <Layout className="w-3.5 h-3.5" />
            Live Preview
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button className="p-1.5 hover:bg-white/5 rounded-md text-zinc-500 hover:text-zinc-300 transition-colors">
            <RotateCcw className="w-4 h-4" />
          </button>
          <button className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold rounded-md transition-all">
            <Download className="w-3.5 h-3.5" />
            EXPORT
          </button>
        </div>
      </div>

      {/* Sandbox Content */}
      <div className="flex-1 flex overflow-hidden">
        <FileTree />
        
        <div className="flex-1 relative">
          <div className={cn(
            "absolute inset-0 transition-opacity duration-300",
            activeTab === 'editor' ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
          )}>
            <Editor
              height="100%"
              defaultLanguage="html"
              theme="vs-dark"
              value={code}
              onChange={(val) => setCode(val || "")}
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                fontFamily: 'JetBrains Mono, monospace',
                backgroundColor: '#050505',
                lineNumbers: 'on',
                roundedSelection: false,
                scrollBeyondLastLine: false,
                readOnly: false,
                automaticLayout: true,
                padding: { top: 20 }
              }}
            />
          </div>

          <div className={cn(
            "absolute inset-0 transition-opacity duration-300 bg-white",
            activeTab === 'preview' ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
          )}>
            <iframe
              srcDoc={code}
              title="Preview"
              className="w-full h-full border-none"
              sandbox="allow-scripts"
            />
          </div>
        </div>
      </div>

      {/* Console/Status Bar */}
      <div className="h-8 border-t border-white/5 bg-sidebar flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-[10px] text-zinc-500">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            Ready
          </div>
          <div className="text-[10px] text-zinc-600">
            UTF-8
          </div>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-zinc-500">
          Line 1, Column 1
        </div>
      </div>
    </div>
  );
}
