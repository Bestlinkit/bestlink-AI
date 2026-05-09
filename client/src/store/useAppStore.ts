import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  attachments?: any[];
  timestamp: number;
}

export interface Chat {
  id: string;
  title: string;
  messages: Message[];
  model: string;
  createdAt: number;
}

export interface SandboxFile {
  id: string;
  name: string;
  language: string;
  content: string;
}

export interface Workspace {
  id: string;
  name: string;
  chats: Chat[];
  sandboxFiles: SandboxFile[];
  activeFileId: string | null;
  currentChatId: string | null;
  lastActive: number;
}

interface AppState {
  // UI State
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  activeAgentId: string;
  setActiveAgent: (agentId: string) => void;
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
  isSandboxOpen: boolean;
  setSandboxOpen: (open: boolean) => void;
  model: string;
  setModel: (model: string) => void;
  
  // Workspace State
  workspaces: Workspace[];
  activeWorkspaceId: string | null;
  
  // Actions
  createWorkspace: (name: string) => string;
  setActiveWorkspace: (id: string) => void;
  deleteWorkspace: (id: string) => void;
  updateWorkspace: (id: string, updates: Partial<Workspace>) => void;
  
  // Compatibility/Helper Actions (Proxy to active workspace)
  addMessage: (chatId: string, message: Message) => void;
  updateLastMessage: (chatId: string, content: string | ((prev: string) => string)) => void;
  addChat: (chat: Chat) => void;
  setSandboxFiles: (files: SandboxFile[]) => void;
  updateFileContent: (id: string, content: string) => void;
  setActiveFile: (id: string) => void;
}

const DEFAULT_FILES: SandboxFile[] = [
  { 
    id: '1', 
    name: 'index.html', 
    language: 'html', 
    content: '<!DOCTYPE html>\n<html>\n<head>\n  <script src="https://cdn.tailwindcss.com"></script>\n</head>\n<body class="bg-black text-white flex items-center justify-center h-screen font-sans">\n  <div class="text-center">\n    <h1 class="text-4xl font-bold mb-4">Bestlink IDE</h1>\n    <p class="text-zinc-500">Professional Software Production Suite</p>\n  </div>\n</body>\n</html>' 
  }
];

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // UI Initial State
      isSidebarOpen: true,
      toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
      activeAgentId: "designer",
      setActiveAgent: (agentId) => set({ activeAgentId: agentId }),
      theme: 'dark',
      setTheme: (theme) => set({ theme }),
      isSandboxOpen: false,
      setSandboxOpen: (open) => set({ isSandboxOpen: open }),
      model: "openrouter/free",
      setModel: (model) => set({ model }),

      // Workspace Initial State
      workspaces: [],
      activeWorkspaceId: null,

      // Workspace Actions
      createWorkspace: (name) => {
        const id = Math.random().toString(36).substring(7);
        const newWorkspace: Workspace = {
          id,
          name,
          chats: [],
          sandboxFiles: [...DEFAULT_FILES],
          activeFileId: '1',
          currentChatId: null,
          lastActive: Date.now()
        };
        set((state) => ({
          workspaces: [newWorkspace, ...state.workspaces],
          activeWorkspaceId: id
        }));
        return id;
      },

      setActiveWorkspace: (id) => set({ activeWorkspaceId: id }),

      deleteWorkspace: (id) => set((state) => ({
        workspaces: state.workspaces.filter(w => w.id !== id),
        activeWorkspaceId: state.activeWorkspaceId === id ? null : state.activeWorkspaceId
      })),

      updateWorkspace: (id, updates) => set((state) => ({
        workspaces: state.workspaces.map(w => 
          w.id === id ? { ...w, ...updates, lastActive: Date.now() } : w
        )
      })),

      // Helper Proxy Actions
      addChat: (chat) => {
        const activeId = get().activeWorkspaceId;
        if (!activeId) return;
        set((state) => ({
          workspaces: state.workspaces.map(w => 
            w.id === activeId 
              ? { ...w, chats: [chat, ...w.chats], currentChatId: chat.id, lastActive: Date.now() }
              : w
          )
        }));
      },

      addMessage: (chatId, message) => {
        const activeId = get().activeWorkspaceId;
        if (!activeId) return;
        set((state) => ({
          workspaces: state.workspaces.map(w => 
            w.id === activeId 
              ? { 
                  ...w, 
                  chats: w.chats.map(c => c.id === chatId ? { ...c, messages: [...c.messages, message] } : c),
                  lastActive: Date.now()
                }
              : w
          )
        }));
      },

      updateLastMessage: (chatId, content) => {
        const activeId = get().activeWorkspaceId;
        if (!activeId) return;
        set((state) => ({
          workspaces: state.workspaces.map(w => {
            if (w.id !== activeId) return w;
            return {
              ...w,
              lastActive: Date.now(),
              chats: w.chats.map(chat => {
                if (chat.id !== chatId) return chat;
                const messages = [...chat.messages];
                if (messages.length === 0) return chat;
                const lastMessage = { ...messages[messages.length - 1] };
                
                if (typeof content === 'function') {
                  lastMessage.content = content(lastMessage.content);
                } else {
                  lastMessage.content = content;
                }
                
                messages[messages.length - 1] = lastMessage;
                return { ...chat, messages };
              })
            };
          })
        }));
      },

      setSandboxFiles: (files) => {
        const activeId = get().activeWorkspaceId;
        if (!activeId) return;
        set((state) => ({
          workspaces: state.workspaces.map(w => 
            w.id === activeId ? { ...w, sandboxFiles: files, lastActive: Date.now() } : w
          )
        }));
      },

      updateFileContent: (id, content) => {
        const activeId = get().activeWorkspaceId;
        if (!activeId) return;
        set((state) => ({
          workspaces: state.workspaces.map(w => 
            w.id === activeId 
              ? { 
                  ...w, 
                  sandboxFiles: w.sandboxFiles.map(f => f.id === id ? { ...f, content } : f),
                  lastActive: Date.now()
                }
              : w
          )
        }));
      },

      setActiveFile: (id) => {
        const activeId = get().activeWorkspaceId;
        if (!activeId) return;
        set((state) => ({
          workspaces: state.workspaces.map(w => 
            w.id === activeId ? { ...w, activeFileId: id, lastActive: Date.now() } : w
          )
        }));
      }
    }),
    {
      name: 'bestlink-storage',
      partialize: (state) => ({
        workspaces: state.workspaces,
        activeWorkspaceId: state.activeWorkspaceId,
        theme: state.theme,
        activeAgentId: state.activeAgentId
      })
    }
  )
);


