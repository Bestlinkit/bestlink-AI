"use client";

import { useState } from "react";
import { 
  Folder, 
  File, 
  ChevronRight, 
  ChevronDown, 
  Plus, 
  MoreVertical,
  FileCode,
  FileJson,
  FileText
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";

export default function FileTree() {
  const { workspaces, activeWorkspaceId, setActiveFile } = useAppStore();
  const activeWorkspace = workspaces.find(w => w.id === activeWorkspaceId);
  const sandboxFiles = activeWorkspace?.sandboxFiles || [];
  const activeFileId = activeWorkspace?.activeFileId || null;

  return (
    <div className="flex flex-col h-full bg-[#09090b] border-r border-white/5 w-64 flex-shrink-0">
      <div className="p-4 border-b border-white/5 flex items-center justify-between">
        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
          Explorer
        </span>
        <button className="p-1 hover:bg-white/5 rounded transition-colors">
          <Plus className="w-3.5 h-3.5 text-zinc-400" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 custom-scrollbar space-y-1">
        <div className="flex items-center gap-2 px-2 py-1.5 text-xs text-zinc-400 font-semibold mb-1">
          <Folder className="w-4 h-4 text-blue-500/50" />
          Project Root
        </div>
        
        {sandboxFiles.map((file) => (
          <button
            key={file.id}
            onClick={() => setActiveFile(file.id)}
            className={cn(
              "flex items-center gap-2 w-full px-4 py-1.5 rounded-lg transition-all group text-left",
              activeFileId === file.id 
                ? "bg-blue-600/10 text-blue-400" 
                : "text-zinc-500 hover:bg-white/5 hover:text-zinc-300"
            )}
          >
            {getFileIcon(file.name, activeFileId === file.id)}
            <span className="text-xs truncate">{file.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function getFileIcon(filename: string, isActive: boolean) {
  const className = cn("w-4 h-4", isActive ? "text-blue-400" : "text-zinc-500 group-hover:text-zinc-400");
  if (filename.endsWith('.json')) return <FileJson className={className} />;
  if (filename.endsWith('.md')) return <FileText className={className} />;
  if (filename.endsWith('.tsx') || filename.endsWith('.ts') || filename.endsWith('.js')) return <FileCode className={className} />;
  return <File className={className} />;
}
