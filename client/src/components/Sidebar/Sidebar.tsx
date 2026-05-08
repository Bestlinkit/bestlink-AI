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
  History,
  LayoutGrid,
  ChevronLeft,
  ChevronRight,
  FolderOpen,
  Star,
  Zap
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import SettingsModal from "../Chat/SettingsModal";

export default function Sidebar() {
  const { isSidebarOpen, toggleSidebar, chats, currentChatId, setCurrentChat, addChat, removeChat } = useAppStore();

  const createNewChat = () => {
    const newChat = {
      id: Math.random().toString(36).substring(7),
      title: "New Project Chat",
      messages: [],
      model: "anthropic/claude-3.5-sonnet",
      createdAt: Date.now(),
    };
    addChat(newChat);
    toast.success("New project workspace initialized");
  };

  return (
    <motion.aside
      initial={false}
      animate={{ 
        width: isSidebarOpen ? 280 : 80,
      }}
      className={cn(
        "bg-[#09090b] border-r border-white/5 h-full flex flex-col overflow-hidden relative z-30 transition-all duration-300 ease-in-out"
      )}
    >
      {/* Sidebar Header */}
      <div className="p-4 flex flex-col gap-4">
        <div className={cn("flex items-center", isSidebarOpen ? "justify-between" : "justify-center")}>
          {isSidebarOpen && (
            <div className="flex items-center gap-2 px-2">
              <div className="w-6 h-6 rounded bg-blue-600 flex items-center justify-center">
                <Zap className="w-4 h-4 text-white fill-current" />
              </div>
              <span className="text-sm font-bold tracking-tight text-white">BESTLINK</span>
            </div>
          )}
          <button
            onClick={toggleSidebar}
            className="p-1.5 rounded-lg hover:bg-white/5 text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            {isSidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>

        <button
          onClick={createNewChat}
          className={cn(
            "flex items-center gap-3 w-full rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all group overflow-hidden",
            isSidebarOpen ? "px-4 py-3" : "p-3 justify-center"
          )}
        >
          <Plus className="w-4 h-4 text-blue-400 group-hover:rotate-90 transition-transform duration-300" />
          {isSidebarOpen && <span className="text-sm font-semibold text-zinc-300">New Project</span>}
        </button>

        {isSidebarOpen && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
            <input
              type="text"
              placeholder="Search workspaces..."
              className="w-full bg-white/[0.02] border border-white/5 rounded-xl py-2 pl-10 pr-4 text-xs focus:bg-white/[0.05] focus:border-blue-500/30 outline-none transition-all text-zinc-400 placeholder:text-zinc-700"
            />
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-2 space-y-6 custom-scrollbar mt-4">
        <div>
          {isSidebarOpen && (
            <div className="px-4 py-2 text-[10px] font-bold text-zinc-600 uppercase tracking-widest flex items-center gap-2 mb-1">
              Main
            </div>
          )}
          <div className="space-y-1">
            <NavItem icon={LayoutGrid} label="Dashboard" isOpen={isSidebarOpen} active />
            <NavItem icon={FolderOpen} label="Workspaces" isOpen={isSidebarOpen} />
            <NavItem icon={Star} label="Favorites" isOpen={isSidebarOpen} />
          </div>
        </div>

        <div>
          {isSidebarOpen && (
            <div className="px-4 py-2 text-[10px] font-bold text-zinc-600 uppercase tracking-widest flex items-center gap-2 mb-1">
              History
            </div>
          )}
          
          <div className="space-y-1">
            <AnimatePresence initial={false}>
              {chats.map((chat) => (
                <motion.div
                  key={chat.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-xl cursor-pointer transition-all duration-200",
                    isSidebarOpen ? "px-4 py-2.5" : "p-3 justify-center mx-1",
                    currentChatId === chat.id 
                      ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" 
                      : "text-zinc-500 hover:bg-white/5 hover:text-zinc-300"
                  )}
                  onClick={() => setCurrentChat(chat.id)}
                >
                  <MessageSquare className={cn("flex-shrink-0 transition-transform group-hover:scale-110", isSidebarOpen ? "w-4 h-4" : "w-5 h-5")} />
                  {isSidebarOpen && <span className="text-xs font-medium truncate pr-6">{chat.title}</span>}
                  
                  {isSidebarOpen && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeChat(chat.id);
                      }}
                      className="absolute right-2 opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-white/5 space-y-1">
        <SettingsModal>
          <button className={cn(
            "flex items-center gap-3 w-full rounded-xl transition-all duration-200 group",
            isSidebarOpen ? "px-4 py-2.5" : "p-3 justify-center mx-1",
            "text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.02]"
          )}>
            <Settings className={cn("flex-shrink-0 group-hover:scale-110 transition-transform", isSidebarOpen ? "w-4 h-4" : "w-5 h-5")} />
            {isSidebarOpen && <span className="text-xs font-semibold">Settings</span>}
          </button>
        </SettingsModal>
        
        <NavItem icon={ExternalLink} label="Client Portal" isOpen={isSidebarOpen} />
        
        {isSidebarOpen && (
          <div className="mt-4 p-3 rounded-xl bg-gradient-to-br from-blue-600/10 to-purple-600/10 border border-blue-500/20">
            <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-1">Internal Build</p>
            <p className="text-[10px] text-zinc-500 leading-tight">Bestlink Production v2.0 Enterprise Mode</p>
          </div>
        )}
      </div>
    </motion.aside>
  );
}

function NavItem({ icon: Icon, label, isOpen, active }: { icon: any, label: string, isOpen: boolean, active?: boolean }) {
  return (
    <button className={cn(
      "flex items-center gap-3 w-full rounded-xl transition-all duration-200 group",
      isOpen ? "px-4 py-2.5" : "p-3 justify-center mx-1",
      active 
        ? "bg-white/5 text-white" 
        : "text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.02]"
    )}>
      <Icon className={cn("flex-shrink-0 group-hover:scale-110 transition-transform", isOpen ? "w-4 h-4" : "w-5 h-5")} />
      {isOpen && <span className="text-xs font-semibold">{label}</span>}
    </button>
  );
}
