"use client";

import { useAppStore } from "@/store/useAppStore";
import { cn } from "@/lib/utils";
import { 
  Plus, 
  MessageSquare, 
  Trash2, 
  Settings, 
  Search,
  ExternalLink,
  History
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { v4 as uuidv4 } from 'uuid';

export default function Sidebar() {
  const { isSidebarOpen, chats, currentChatId, setCurrentChat, addChat, removeChat } = useAppStore();

  const createNewChat = () => {
    const newChat = {
      id: Math.random().toString(36).substring(7),
      title: "New Project Chat",
      messages: [],
      model: "anthropic/claude-3.5-sonnet",
      createdAt: Date.now(),
    };
    addChat(newChat);
  };

  return (
    <motion.aside
      initial={false}
      animate={{ 
        width: isSidebarOpen ? 280 : 0,
        opacity: isSidebarOpen ? 1 : 0
      }}
      className={cn(
        "bg-sidebar border-r border-border h-full flex flex-col overflow-hidden relative z-30"
      )}
    >
      {/* Sidebar Header */}
      <div className="p-4 flex flex-col gap-4">
        <button
          onClick={createNewChat}
          className="flex items-center gap-2 w-full px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all group"
        >
          <div className="p-1 rounded-md bg-blue-500/10 text-blue-400 group-hover:scale-110 transition-transform">
            <Plus className="w-4 h-4" />
          </div>
          <span className="text-sm font-medium text-zinc-300">New Project</span>
        </button>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search projects..."
            className="w-full bg-white/5 border border-white/5 rounded-lg py-2 pl-10 pr-4 text-xs focus:border-blue-500/50 outline-none transition-all text-zinc-300"
          />
        </div>
      </div>

      {/* Chat History */}
      <div className="flex-1 overflow-y-auto px-2 space-y-1 custom-scrollbar">
        <div className="px-3 py-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
          <History className="w-3 h-3" />
          Recent Projects
        </div>
        
        <AnimatePresence initial={false}>
          {chats.map((chat) => (
            <motion.div
              key={chat.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={cn(
                "group relative flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all",
                currentChatId === chat.id 
                  ? "bg-blue-500/10 text-blue-400" 
                  : "text-zinc-400 hover:bg-white/5"
              )}
              onClick={() => setCurrentChat(chat.id)}
            >
              <MessageSquare className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm truncate pr-6">{chat.title}</span>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeChat(chat.id);
                }}
                className="absolute right-2 opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>

        {chats.length === 0 && (
          <div className="px-3 py-8 text-center text-xs text-zinc-600">
            No projects yet
          </div>
        )}
      </div>

      {/* Sidebar Footer */}
      <div className="p-4 border-t border-border space-y-2">
        <button className="flex items-center justify-between w-full p-2 text-zinc-400 hover:text-white transition-colors text-xs">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </div>
        </button>
        <button className="flex items-center justify-between w-full p-2 text-zinc-400 hover:text-white transition-colors text-xs">
          <div className="flex items-center gap-2">
            <ExternalLink className="w-4 h-4" />
            <span>Client Portal</span>
          </div>
        </button>
      </div>
    </motion.aside>
  );
}
