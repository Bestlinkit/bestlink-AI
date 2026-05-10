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
        "ide-panel h-full flex flex-col overflow-hidden relative z-40 transition-all duration-300 ease-in-out shadow-2xl selection:bg-blue-500/30"
      )}
    >
      {/* Sidebar Header */}
      <div className="p-6 flex flex-col gap-8">
        <div className={cn("flex items-center", isSidebarOpen ? "justify-between" : "justify-center")}>
          {isSidebarOpen && (
            <div className="flex items-center gap-3 px-1 group cursor-pointer">
              <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
                <Zap className="w-4 h-4 text-black fill-current" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-black tracking-[0.2em] text-white uppercase italic leading-none">Bestlink.OS</span>
                <span className="text-[8px] font-black text-white/20 uppercase tracking-[0.3em] mt-1">Core Engine</span>
              </div>
            </div>
          )}
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-xl hover:bg-white/5 text-zinc-600 hover:text-white transition-all active:scale-90"
          >
            {isSidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>

        <button
          onClick={handleCreateProject}
          className={cn(
            "flex items-center gap-3 w-full rounded-2xl bg-white text-black hover:bg-zinc-200 transition-all group overflow-hidden shadow-xl active:scale-95",
            isSidebarOpen ? "px-6 py-4" : "p-4 justify-center"
          )}
        >
          <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-500" />
          {isSidebarOpen && <span className="text-[10px] font-black uppercase tracking-[0.3em]">New Production</span>}
        </button>

        {isSidebarOpen && (
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-700 group-focus-within:text-white transition-colors" />
            <input
              type="text"
              placeholder="QUICK SEARCH..."
              className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-3.5 pl-12 pr-4 text-[9px] font-black uppercase tracking-widest focus:bg-white/[0.05] focus:border-white/20 outline-none transition-all text-white placeholder:text-zinc-800"
            />
          </div>
        )}
      </div>

          {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-3 space-y-8 custom-scrollbar pt-4">
        
        {/* Workspace/Project Selector */}
        <div>
          {isSidebarOpen && (
            <div className="px-4 py-2 text-[10px] font-bold text-zinc-600 uppercase tracking-widest flex items-center gap-2 mb-2">
              <Box className="w-3 h-3" />
              Workspace
            </div>
          )}
          <div className="space-y-1">
            {workspaces.map((ws) => (
              <div
                key={ws.id}
                className={cn(
                  "group relative flex items-center gap-3 rounded-2xl cursor-pointer transition-all duration-300",
                  isSidebarOpen ? "px-4 py-3" : "p-3.5 justify-center mx-1",
                  activeWorkspaceId === ws.id 
                    ? "bg-white/5 text-white border border-white/5 shadow-xl" 
                    : "text-zinc-500 hover:bg-white/[0.02] hover:text-zinc-300 border border-transparent"
                )}
                onClick={() => setActiveWorkspace(ws.id)}
              >
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  activeWorkspaceId === ws.id ? "bg-blue-500 shadow-[0_0_10px_rgba(37,99,235,0.5)]" : "bg-zinc-800"
                )} />
                {isSidebarOpen && <span className="text-[11px] font-bold truncate pr-6 uppercase tracking-widest">{ws.name}</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Files Section (CREATION HUB) */}
        {activeWorkspace && activeWorkspace.sandboxFiles.length > 0 && (
          <div>
            {isSidebarOpen && (
              <div className="px-4 py-2 text-[10px] font-bold text-zinc-600 uppercase tracking-widest flex items-center gap-2 mb-2">
                <FolderOpen className="w-3 h-3" />
                Files
              </div>
            )}
            <div className="space-y-0.5">
              {activeWorkspace.sandboxFiles.map((file) => (
                <div
                  key={file.id}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-xl cursor-pointer transition-all",
                    isSidebarOpen ? "px-4 py-2" : "p-3 justify-center mx-1",
                    "text-zinc-500 hover:bg-white/[0.03] hover:text-zinc-300"
                  )}
                >
                  <div className="w-4 h-4 flex items-center justify-center shrink-0">
                    <span className="text-[8px] font-black opacity-40 group-hover:opacity-100 transition-opacity uppercase">
                      {file.name.split('.').pop()?.slice(0, 2)}
                    </span>
                  </div>
                  {isSidebarOpen && <span className="text-[11px] font-medium truncate leading-none">{file.name}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Chats History Section */}
        {activeWorkspace && chats.length > 0 && (
          <div>
            {isSidebarOpen && (
              <div className="px-4 py-2 text-[10px] font-bold text-zinc-600 uppercase tracking-widest flex items-center gap-2 mb-2">
                <History className="w-3 h-3" />
                History
              </div>
            )}
            <div className="space-y-1">
              {chats.map((chat) => (
                <div
                  key={chat.id}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-2xl cursor-pointer transition-all duration-300",
                    isSidebarOpen ? "px-4 py-3" : "p-3.5 justify-center mx-1",
                    currentChatId === chat.id 
                      ? "bg-blue-500/10 text-blue-400 border border-blue-500/10" 
                      : "text-zinc-500 hover:bg-white/[0.02] hover:text-zinc-300 border border-transparent"
                  )}
                  onClick={() => handleSwitchChat(chat.id)}
                >
                  <MessageSquare className={cn("flex-shrink-0", isSidebarOpen ? "w-3.5 h-3.5" : "w-5 h-5")} />
                  {isSidebarOpen && <span className="text-[11px] font-medium truncate pr-6 leading-tight">{chat.title}</span>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-white/5 space-y-1 bg-[#050505]/50">
        <SettingsModal>
          <button className={cn(
            "flex items-center gap-3 w-full rounded-2xl transition-all duration-300 group",
            isSidebarOpen ? "px-4 py-3" : "p-3.5 justify-center mx-1",
            "text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.03]"
          )}>
            <Settings className={cn("flex-shrink-0 group-hover:rotate-45 transition-transform", isSidebarOpen ? "w-4 h-4" : "w-5 h-5")} />
            {isSidebarOpen && <span className="text-xs font-bold uppercase tracking-widest">Settings</span>}
          </button>
        </SettingsModal>
        
        <NavItem icon={Globe} label="Portal" isOpen={isSidebarOpen} />
        
        {isSidebarOpen && (
          <div className="mt-4 p-4 rounded-2xl bg-gradient-to-br from-blue-600/10 to-transparent border border-blue-500/10">
            <p className="text-[9px] font-bold text-blue-500 uppercase tracking-widest mb-1">Elite Production</p>
            <p className="text-[9px] text-zinc-600 font-medium leading-tight">Version 2.0.0 Stable Agency Build</p>
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
