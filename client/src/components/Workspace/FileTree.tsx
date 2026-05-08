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

interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  children?: FileNode[];
  language?: string;
}

export default function FileTree() {
  const [files, setFiles] = useState<FileNode[]>([
    {
      id: '1',
      name: 'src',
      type: 'folder',
      children: [
        { id: '2', name: 'app', type: 'folder', children: [
          { id: '3', name: 'page.tsx', type: 'file', language: 'typescript' },
          { id: '4', name: 'layout.tsx', type: 'file', language: 'typescript' },
        ]},
        { id: '5', name: 'components', type: 'folder', children: [] },
      ]
    },
    { id: '6', name: 'package.json', type: 'file', language: 'json' },
    { id: '7', name: 'tailwind.config.ts', type: 'file', language: 'typescript' },
  ]);

  return (
    <div className="flex flex-col h-full bg-[#050505] border-r border-white/5 w-64 flex-shrink-0">
      <div className="p-4 border-b border-white/5 flex items-center justify-between">
        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
          Explorer
        </span>
        <button className="p-1 hover:bg-white/5 rounded transition-colors">
          <Plus className="w-3.5 h-3.5 text-zinc-400" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
        {files.map((node) => (
          <FileNode key={node.id} node={node} level={0} />
        ))}
      </div>
    </div>
  );
}

function FileNode({ node, level }: { node: FileNode, level: number }) {
  const [isOpen, setIsOpen] = useState(true);
  const Icon = node.type === 'folder' 
    ? (isOpen ? ChevronDown : ChevronRight) 
    : getFileIcon(node.name);

  return (
    <div className="flex flex-col">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-white/5 transition-all group text-left",
          level > 0 && "ml-2"
        )}
      >
        <span className="text-zinc-600 group-hover:text-zinc-400">
          {node.type === 'folder' ? (isOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />) : null}
        </span>
        {node.type === 'folder' ? <Folder className="w-4 h-4 text-blue-400/70" /> : <Icon className="w-4 h-4 text-zinc-400" />}
        <span className="text-xs text-zinc-300 truncate">{node.name}</span>
      </button>

      {node.type === 'folder' && isOpen && node.children && (
        <div className="border-l border-white/5 ml-3">
          {node.children.map((child) => (
            <FileNode key={child.id} node={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

function getFileIcon(filename: string) {
  if (filename.endsWith('.json')) return FileJson;
  if (filename.endsWith('.md')) return FileText;
  if (filename.endsWith('.tsx') || filename.endsWith('.ts')) return FileCode;
  return File;
}
