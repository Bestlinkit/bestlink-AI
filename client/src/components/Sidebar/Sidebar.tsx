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
        "bg-[#09090b] border-r border-white/5 h-full flex flex-col overflow-hidden relative z-40 transition-all duration-300 ease-in-out shadow-2xl selection:bg-blue-500/30"
      )}
    >
      {/* Sidebar Header */}
      <div className="p-5 flex flex-col gap-6">
        <div className={cn("flex items-center", isSidebarOpen ? "justify-between" : "justify-center")}>
          {isSidebarOpen && (
            <div className="flex items-center gap-3 px-1 group cursor-pointer">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
                <Zap className="w-4 h-4 text-white fill-current" />
              </div>
              <span className="text-sm font-bold tracking-tight text-white uppercase tracking-widest font-outfit">Bestlink AI</span>
            </div>
          )}
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-xl hover:bg-white/5 text-zinc-500 hover:text-white transition-all active:scale-90"
          >
            {isSidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>

        <button
          onClick={handleCreateProject}
          className={cn(
            "flex items-center gap-3 w-full rounded-2xl bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/20 transition-all group overflow-hidden shadow-[0_0_15px_rgba(37,99,235,0.05)]",
            isSidebarOpen ? "px-4 py-3.5" : "p-3.5 justify-center"
          )}
        >
          <Plus className="w-4 h-4 text-blue-400 group-hover:rotate-90 transition-transform duration-500" />
          {isSidebarOpen && <span className="text-sm font-bold text-blue-100 uppercase tracking-widest">New Project</span>}
        </button>

        {isSidebarOpen && (
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-blue-500 transition-colors" />
            <input
              type="text"
              placeholder="Search..."
              className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-3 pl-12 pr-4 text-[11px] font-bold uppercase tracking-widest focus:bg-white/[0.05] focus:border-blue-500/30 outline-none transition-all text-zinc-400 placeholder:text-zinc-700"
            />
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-3 space-y-8 custom-scrollbar">
        {/* Projects Section */}
        <div>
          {isSidebarOpen && (
            <div className="px-4 py-2 text-[10px] font-bold text-zinc-600 uppercase tracking-widest flex items-center gap-2 mb-2">
              <Box className="w-3 h-3" />
              Active Projects
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
                    ? "bg-white/5 text-white border border-white/5" 
                    : "text-zinc-500 hover:bg-white/[0.02] hover:text-zinc-300 border border-transparent"
                )}
                onClick={() => setActiveWorkspace(ws.id)}
              >
                <LayoutGrid className={cn("flex-shrink-0 transition-transform group-hover:scale-110", isSidebarOpen ? "w-4 h-4" : "w-5 h-5", activeWorkspaceId === ws.id ? "text-blue-400" : "text-zinc-700")} />
                {isSidebarOpen && <span className="text-[11px] font-bold truncate pr-6 uppercase tracking-widest">{ws.name}</span>}
                
                {isSidebarOpen && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteWorkspace(ws.id);
                    }}
                    className="absolute right-3 opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Chats History Section */}
        {activeWorkspace && (
          <div>
            {isSidebarOpen && (
              <div className="px-4 py-2 text-[10px] font-bold text-zinc-600 uppercase tracking-widest flex items-center gap-2 mb-2">
                <History className="w-3 h-3" />
                History
              </div>
            )}
            
            <div className="space-y-1">
              <AnimatePresence initial={false}>
                {chats.map((chat) => (
                  <motion.div
                    key={chat.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className={cn(
                      "group relative flex items-center gap-3 rounded-2xl cursor-pointer transition-all duration-300",
                      isSidebarOpen ? "px-4 py-3" : "p-3.5 justify-center mx-1",
                      currentChatId === chat.id 
                        ? "bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-[0_0_15px_rgba(37,99,235,0.1)]" 
                        : "text-zinc-500 hover:bg-white/[0.02] hover:text-zinc-300 border border-transparent"
                    )}
                    onClick={() => handleSwitchChat(chat.id)}
                  >
                    <MessageSquare className={cn("flex-shrink-0 transition-transform group-hover:scale-110", isSidebarOpen ? "w-4 h-4" : "w-5 h-5")} />
                    {isSidebarOpen && <span className="text-[11px] font-medium truncate pr-6 leading-tight">{chat.title}</span>}
                    
                    {isSidebarOpen && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveChat(chat.id);
                        }}
                        className="absolute right-3 opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
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
