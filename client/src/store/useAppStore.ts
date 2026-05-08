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

export interface SandboxFile {
  id: string;
  name: string;
  language: string;
  content: string;
}

interface AppState {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  chats: Chat[];
  currentChatId: string | null;
  addChat: (chat: Chat) => void;
  setCurrentChat: (chatId: string) => void;
  removeChat: (chatId: string) => void;
  addMessage: (chatId: string, message: Message) => void;
  updateLastMessage: (chatId: string, content: string | ((prev: string) => string)) => void;
  model: string;
  setModel: (model: string) => void;
  activeAgentId: string;
  setActiveAgent: (agentId: string) => void;
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
  sandboxFiles: SandboxFile[];
  activeFileId: string | null;
  setSandboxFiles: (files: SandboxFile[]) => void;
  updateFileContent: (id: string, content: string) => void;
  setActiveFile: (id: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  isSidebarOpen: true,
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  chats: [],
  currentChatId: null,
  model: "anthropic/claude-3.5-sonnet",
  activeAgentId: "designer",
  theme: 'dark',
  sandboxFiles: [
    { id: '1', name: 'index.html', language: 'html', content: '<!DOCTYPE html>\n<html>\n<head>\n  <script src="https://cdn.tailwindcss.com"></script>\n</head>\n<body class="bg-black text-white flex items-center justify-center h-screen font-sans">\n  <div class="text-center">\n    <h1 class="text-4xl font-bold mb-4">Bestlink IDE</h1>\n    <p class="text-zinc-500">Professional Software Production Suite</p>\n  </div>\n</body>\n</html>' }
  ],
  activeFileId: '1',
  addChat: (chat) => set((state) => ({ 
    chats: [chat, ...state.chats],
    currentChatId: chat.id 
  })),
  setCurrentChat: (chatId) => set({ currentChatId: chatId }),
  removeChat: (chatId) => set((state) => ({ 
    chats: state.chats.filter(c => c.id !== chatId),
    currentChatId: state.currentChatId === chatId ? null : state.currentChatId
  })),
  addMessage: (chatId, message) => set((state) => ({
    chats: state.chats.map(chat => 
      chat.id === chatId 
        ? { ...chat, messages: [...chat.messages, message] }
        : chat
    )
  })),
  updateLastMessage: (chatId, content) => set((state) => ({
    chats: state.chats.map(chat => {
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
  })),
  setModel: (model) => set({ model }),
  setActiveAgent: (agentId) => set({ activeAgentId: agentId }),
  setTheme: (theme) => set({ theme }),
  setSandboxFiles: (files) => set({ sandboxFiles: files }),
  updateFileContent: (id, content) => set((state) => ({
    sandboxFiles: state.sandboxFiles.map(f => f.id === id ? { ...f, content } : f)
  })),
  setActiveFile: (id) => set({ activeFileId: id })
}));
