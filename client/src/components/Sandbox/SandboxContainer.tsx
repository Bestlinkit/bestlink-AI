"use client";

import { useState, useEffect } from "react";
import Editor from "@monaco-editor/react";
import { 
  Play, 
  RotateCcw, 
  Download, 
  Maximize2,
  FileCode,
  Layout,
  Layers,
  ChevronRight,
  Save,
  Globe,
  Terminal
} from "lucide-react";
import { cn } from "@/lib/utils";
import FileTree from "@/components/Workspace/FileTree";
import { useAppStore } from "@/store/useAppStore";
import { motion, AnimatePresence } from "framer-motion";

export default function SandboxContainer() {
  const [activeView, setActiveView] = useState<'editor' | 'preview'>('editor');
  const { sandboxFiles, activeFileId, updateFileContent, setActiveFile } = useAppStore();
  
  const activeFile = sandboxFiles.find(f => f.id === activeFileId) || sandboxFiles[0];

  const [previewDoc, setPreviewDoc] = useState("");

  useEffect(() => {
    // Basic logic to combine files for preview
    // In a real app, this would be more complex (handling imports etc)
    const indexHtml = sandboxFiles.find(f => f.name === 'index.html')?.content || "";
    const styles = sandboxFiles.filter(f => f.name.endsWith('.css')).map(f => f.content).join('\n');
    
    let combined = indexHtml;
    if (styles) {
      combined = combined.replace('</head>', `<style>${styles}</style></head>`);
    }
    
    setPreviewDoc(combined);
  }, [sandboxFiles]);

  return (
    <div className="flex flex-col h-full bg-[#050505] overflow-hidden">
      {/* Sandbox Header */}
      <div className="h-12 border-b border-white/5 flex items-center justify-between px-4 bg-[#09090b]">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          <div className="flex bg-white/5 p-1 rounded-lg mr-4">
            <button
              onClick={() => setActiveView('editor')}
              className={cn(
                "flex items-center gap-2 px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all",
                activeView === 'editor' ? "bg-white/10 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              <Terminal className="w-3.5 h-3.5" />
              Editor
            </button>
            <button
              onClick={() => setActiveView('preview')}
              className={cn(
                "flex items-center gap-2 px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all",
                activeView === 'preview' ? "bg-blue-600 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              <Globe className="w-3.5 h-3.5" />
              Preview
            </button>
          </div>

          <div className="h-4 w-[1px] bg-white/10 mx-2" />

          {activeView === 'editor' && (
            <div className="flex items-center gap-1">
              {sandboxFiles.slice(0, 5).map(file => (
                <button
                  key={file.id}
                  onClick={() => setActiveFile(file.id)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-md text-[10px] font-medium transition-all border",
                    activeFileId === file.id 
                      ? "bg-white/5 border-white/10 text-zinc-200" 
                      : "border-transparent text-zinc-600 hover:text-zinc-400"
                  )}
                >
                  <FileCode className={cn("w-3 h-3", activeFileId === file.id ? "text-blue-400" : "text-zinc-600")} />
                  {file.name}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold rounded-lg transition-all shadow-[0_0_15px_rgba(37,99,235,0.3)]">
            <Download className="w-3.5 h-3.5" />
            SHIP IT
          </button>
        </div>
      </div>

      {/* Sandbox Content */}
      <div className="flex-1 flex overflow-hidden">
        <FileTree />
        
        <div className="flex-1 relative bg-[#050505]">
          <AnimatePresence mode="wait">
            {activeView === 'editor' ? (
              <motion.div
                key="editor"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="absolute inset-0"
              >
                <Editor
                  height="100%"
                  language={activeFile?.language || 'javascript'}
                  theme="vs-dark"
                  value={activeFile?.content || ""}
                  onChange={(val) => updateFileContent(activeFile.id, val || "")}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 13,
                    fontFamily: 'JetBrains Mono, monospace',
                    lineNumbers: 'on',
                    roundedSelection: false,
                    scrollBeyondLastLine: false,
                    readOnly: false,
                    automaticLayout: true,
                    padding: { top: 20 }
                  }}
                />
              </motion.div>
            ) : (
              <motion.div
                key="preview"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
                className="absolute inset-0 bg-white"
              >
                <iframe
                  srcDoc={previewDoc}
                  title="Preview"
                  className="w-full h-full border-none"
                  sandbox="allow-scripts allow-modals allow-forms"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Status Bar */}
      <footer className="h-8 border-t border-white/5 bg-[#09090b] flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-[9px] font-bold text-zinc-600 uppercase tracking-widest">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
            Engine Online
          </div>
          <div className="h-3 w-[1px] bg-white/10" />
          <div className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">
            {activeFile?.language || 'plaintext'}
          </div>
        </div>
        <div className="flex items-center gap-3 text-[9px] font-bold text-zinc-600 uppercase tracking-widest">
          <span>Bestlink Studio v2.0</span>
          <Layers className="w-3 h-3" />
        </div>
      </footer>
    </div>
  );
}
