import { create } from 'zustand';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  attachments?: any[];
  timestamp: number;
}

interface Chat {
  id: string;
  title: string;
  messages: Message[];
  model: string;
  createdAt: number;
}

interface AppState {
  chats: Chat[];
  currentChatId: string | null;
  isSidebarOpen: boolean;
  theme: 'dark' | 'light';
  model: string;
  activeAgentId: string;
  
  // Actions
  addChat: (chat: Chat) => void;
  removeChat: (id: string) => void;
  setCurrentChat: (id: string) => void;
  addMessage: (chatId: string, message: Message) => void;
  updateLastMessage: (chatId: string, contentOrUpdater: string | ((prev: string) => string)) => void;
  toggleSidebar: () => void;
  setTheme: (theme: 'dark' | 'light') => void;
  setModel: (model: string) => void;
  setAgent: (agentId: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  chats: [],
  currentChatId: null,
  isSidebarOpen: true,
  theme: 'dark',
  model: 'anthropic/claude-3.5-sonnet',
  activeAgentId: 'frontend',

  addChat: (chat) => set((state) => ({ chats: [chat, ...state.chats], currentChatId: chat.id })),
  removeChat: (id) => set((state) => ({ 
    chats: state.chats.filter((c) => c.id !== id),
    currentChatId: state.currentChatId === id ? null : state.currentChatId 
  })),
  setCurrentChat: (id) => set({ currentChatId: id }),
  addMessage: (chatId, message) => set((state) => ({
    chats: state.chats.map((c) => 
      c.id === chatId ? { ...c, messages: [...c.messages, message] } : c
    )
  })),
  updateLastMessage: (chatId, contentOrUpdater) => set((state) => ({
    chats: state.chats.map((c) => {
      if (c.id === chatId) {
        const messages = [...c.messages];
        if (messages.length > 0) {
          const lastMessage = messages[messages.length - 1];
          const newContent = typeof contentOrUpdater === 'function' 
            ? (contentOrUpdater as (prev: string) => string)(lastMessage.content)
            : contentOrUpdater;
          messages[messages.length - 1] = { ...lastMessage, content: newContent };
        }
        return { ...c, messages };
      }
      return c;
    })
  })),
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setTheme: (theme) => set({ theme }),
  setModel: (model) => set({ model }),
  setAgent: (agentId) => set({ activeAgentId: agentId }),
}));
