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
  Zap,
  Box,
  Layout,
  Globe
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import SettingsModal from "../Chat/SettingsModal";

export default function Sidebar() {
  const { 
    isSidebarOpen, 
    toggleSidebar, 
    workspaces, 
    activeWorkspaceId, 
    setActiveWorkspace, 
    createWorkspace, 
    deleteWorkspace,
    updateWorkspace
  } = useAppStore();

  const activeWorkspace = workspaces.find(w => w.id === activeWorkspaceId);
  const chats = activeWorkspace?.chats || [];
  const currentChatId = activeWorkspace?.currentChatId || null;

  const handleCreateProject = () => {
    const id = createWorkspace("New Production");
    toast.success("Workspace initialized.");
  };

  const handleSwitchChat = (chatId: string) => {
    if (!activeWorkspaceId) return;
    updateWorkspace(activeWorkspaceId, { currentChatId: chatId });
  };

  const handleRemoveChat = (chatId: string) => {
    if (!activeWorkspaceId || !activeWorkspace) return;
    updateWorkspace(activeWorkspaceId, {
      chats: activeWorkspace.chats.filter(c => c.id !== chatId),
      currentChatId: activeWorkspace.currentChatId === chatId ? null : activeWorkspace.currentChatId
    });
  };

  return (
    <motion.aside
      initial={false}
      animate={{ 
        width: isSidebarOpen ? 280 : 80,
      }}
      className={cn(
        "ide-panel h-full flex flex-col overflow-hidden relative z-40 transition-all duration-300 ease-in-out shadow-2xl selection:bg-white/10"
      )}
    >
      {/* 🚀 SIDEBAR HEADER */}
      <div className="p-8 flex flex-col gap-10">
        <div className={cn("flex items-center", isSidebarOpen ? "justify-between" : "justify-center")}>
          {isSidebarOpen && (
            <div className="flex items-center gap-4 px-1 group cursor-pointer">
              <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.1)] group-hover:scale-110 transition-transform duration-500">
                <Zap className="w-5 h-5 text-black fill-current" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-black tracking-[0.2em] text-white uppercase italic leading-none gradient-text">Bestlink.OS</span>
                <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.4em] mt-1.5">Core Engine</span>
              </div>
            </div>
          )}
          <button
            onClick={toggleSidebar}
            className="p-2.5 rounded-xl hover:bg-white/5 text-white/20 hover:text-white transition-all active:scale-90"
          >
            {isSidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>

        <button
          onClick={handleCreateProject}
          className={cn(
            "flex items-center gap-4 w-full rounded-3xl bg-white text-black hover:bg-zinc-200 transition-all group overflow-hidden shadow-2xl active:scale-95",
            isSidebarOpen ? "px-8 py-5" : "p-5 justify-center"
          )}
        >
          <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-700" />
          {isSidebarOpen && <span className="text-[11px] font-black uppercase tracking-[0.3em]">New Production</span>}
        </button>

        {isSidebarOpen && (
          <div className="relative group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/10 group-focus-within:text-white transition-colors" />
            <input
              type="text"
              placeholder="QUICK SEARCH..."
              className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-4 pl-14 pr-6 text-[10px] font-black uppercase tracking-widest focus:bg-white/[0.05] focus:border-white/20 outline-none transition-all text-white placeholder:text-white/10"
            />
          </div>
        )}
      </div>

      {/* 🧭 NAVIGATION */}
      <div className="flex-1 overflow-y-auto px-4 space-y-10 custom-scrollbar pt-4">
        
        {/* WORKSPACE SELECTOR */}
        <div>
          {isSidebarOpen && (
            <div className="px-5 py-2 text-[10px] font-black text-white/20 uppercase tracking-[0.4em] flex items-center gap-3 mb-4">
              <Box className="w-3.5 h-3.5" />
              Production Workspace
            </div>
          )}
          <div className="space-y-2">
            {workspaces.map((ws) => (
              <div
                key={ws.id}
                className={cn(
                  "group relative flex items-center gap-4 rounded-2xl cursor-pointer transition-all duration-500",
                  isSidebarOpen ? "px-5 py-4" : "p-4.5 justify-center mx-1.5",
                  activeWorkspaceId === ws.id 
                    ? "bg-white/5 text-white border border-white/5 shadow-2xl" 
                    : "text-white/20 hover:bg-white/[0.02] hover:text-white border border-transparent"
                )}
                onClick={() => setActiveWorkspace(ws.id)}
              >
                <div className={cn(
                  "w-2 h-2 rounded-full transition-all duration-500",
                  activeWorkspaceId === ws.id ? "bg-white shadow-[0_0_15px_rgba(255,255,255,0.4)]" : "bg-white/5"
                )} />
                {isSidebarOpen && <span className="text-[11px] font-black truncate pr-6 uppercase tracking-[0.2em]">{ws.name}</span>}
              </div>
            ))}
          </div>
        </div>

        {/* FILES HUB */}
        {activeWorkspace && activeWorkspace.sandboxFiles.length > 0 && (
          <div>
            {isSidebarOpen && (
              <div className="px-5 py-2 text-[10px] font-black text-white/20 uppercase tracking-[0.4em] flex items-center gap-3 mb-4">
                <FolderOpen className="w-3.5 h-3.5" />
                Active Source
              </div>
            )}
            <div className="space-y-1">
              {activeWorkspace.sandboxFiles.map((file) => (
                <div
                  key={file.id}
                  className={cn(
                    "group relative flex items-center gap-4 rounded-xl cursor-pointer transition-all",
                    isSidebarOpen ? "px-5 py-3" : "p-4 justify-center mx-1.5",
                    "text-white/20 hover:bg-white/[0.03] hover:text-white"
                  )}
                >
                  <div className="w-5 h-5 flex items-center justify-center shrink-0">
                    <span className="text-[9px] font-black opacity-40 group-hover:opacity-100 transition-opacity uppercase tracking-tighter">
                      {file.name.split('.').pop()?.slice(0, 2)}
                    </span>
                  </div>
                  {isSidebarOpen && <span className="text-[12px] font-medium truncate leading-none tracking-tight">{file.name}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* HISTORY TRACKER */}
        {activeWorkspace && chats.length > 0 && (
          <div>
            {isSidebarOpen && (
              <div className="px-5 py-2 text-[10px] font-black text-white/20 uppercase tracking-[0.4em] flex items-center gap-3 mb-4">
                <History className="w-3.5 h-3.5" />
                Production History
              </div>
            )}
            <div className="space-y-2">
              {chats.map((chat) => (
                <div
                  key={chat.id}
                  className={cn(
                    "group relative flex items-center gap-4 rounded-2xl cursor-pointer transition-all duration-500",
                    isSidebarOpen ? "px-5 py-4" : "p-4.5 justify-center mx-1.5",
                    currentChatId === chat.id 
                      ? "bg-white/5 text-white border border-white/5" 
                      : "text-white/20 hover:bg-white/[0.02] hover:text-white border border-transparent"
                  )}
                  onClick={() => handleSwitchChat(chat.id)}
                >
                  <MessageSquare className={cn("flex-shrink-0 transition-colors", isSidebarOpen ? "w-4 h-4" : "w-6 h-6", currentChatId === chat.id ? "text-white" : "text-white/10")} />
                  {isSidebarOpen && <span className="text-[12px] font-medium truncate pr-6 leading-tight tracking-tight">{chat.title}</span>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 🛠️ FOOTER TOOLS */}
      <div className="p-6 border-t border-white/5 space-y-2 bg-[#050505]/50 backdrop-blur-xl">
        <SettingsModal>
          <button className={cn(
            "flex items-center gap-4 w-full rounded-2xl transition-all duration-500 group",
            isSidebarOpen ? "px-5 py-4" : "p-4.5 justify-center mx-1.5",
            "text-white/20 hover:text-white hover:bg-white/[0.03]"
          )}>
            <Settings className={cn("flex-shrink-0 group-hover:rotate-90 transition-transform duration-700", isSidebarOpen ? "w-4 h-4" : "w-6 h-6")} />
            {isSidebarOpen && <span className="text-[11px] font-black uppercase tracking-[0.3em]">System Settings</span>}
          </button>
        </SettingsModal>
        
        <NavItem icon={Globe} label="Production Portal" isOpen={isSidebarOpen} />
        
        {isSidebarOpen && (
          <div className="mt-6 p-6 rounded-3xl bg-gradient-to-br from-white/5 to-transparent border border-white/5 relative overflow-hidden group">
            <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <p className="text-[10px] font-black text-white uppercase tracking-[0.4em] mb-2 relative z-10">Elite Production</p>
            <p className="text-[10px] text-white/20 font-bold uppercase tracking-[0.2em] relative z-10">v2.4.0 Agency Stable</p>
          </div>
        )}
      </div>
    </motion.aside>
  );
}

function NavItem({ icon: Icon, label, isOpen, active }: { icon: any, label: string, isOpen: boolean, active?: boolean }) {
  return (
    <button className={cn(
      "flex items-center gap-3 w-full rounded-2xl transition-all duration-300 group",
      isOpen ? "px-4 py-3" : "p-3.5 justify-center mx-1",
      active 
        ? "bg-white/5 text-white shadow-xl" 
        : "text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.03]"
    )}>
      <Icon className={cn("flex-shrink-0 group-hover:scale-110 transition-transform", isOpen ? "w-4 h-4" : "w-5 h-5")} />
      {isOpen && <span className="text-xs font-bold uppercase tracking-widest">{label}</span>}
    </button>
  );
}
