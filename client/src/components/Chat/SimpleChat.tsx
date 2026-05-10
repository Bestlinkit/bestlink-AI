"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Paperclip, Globe, Loader2, Image as ImageIcon, X, User, Sparkles, ArrowRight, ChevronDown, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ChatMarkdown } from "./ChatMarkdown";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";

const MODELS = [
  { id: 'gemini', name: 'Gemini 2.0 (Multimodal)', color: 'blue' },
  { id: 'deepseek', name: 'DeepSeek (Architecture)', color: 'purple' },
  { id: 'qwen', name: 'Qwen 2.5 (Frontend/UI)', color: 'green' },
  { id: 'claude', name: 'Claude Haiku (UX Logic)', color: 'orange' },
];

export default function SimpleChat() {
  const { 
    workspaces, 
    activeWorkspaceId, 
    addMessage, 
    updateLastMessage,
    model: selectedModel,
    setModel
  } = useAppStore();

  const activeWorkspace = workspaces.find(w => w.id === activeWorkspaceId);
  const messages = activeWorkspace?.chats[0]?.messages || [];

  const [text, setText] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, isLoading]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image too large (max 5MB)");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!text.trim() && !image && !isLoading) return;
    if (!activeWorkspaceId) {
      toast.error("Please select or create a project first");
      return;
    }

    const chatId = activeWorkspace?.chats[0]?.id || 'default';
    if (!activeWorkspace?.chats[0]) {
      // Initialize first chat if missing
      const newChatId = Math.random().toString(36).substring(7);
      useAppStore.getState().addChat({
        id: newChatId,
        title: text.slice(0, 30) || "New Discussion",
        messages: [],
        model: selectedModel,
        createdAt: Date.now()
      });
    }

    const userMsg = { 
      id: Math.random().toString(36).substring(7),
      role: 'user' as const, 
      content: text, 
      attachments: image ? [{ type: 'image', url: image }] : [],
      timestamp: Date.now()
    };

    addMessage(activeWorkspace?.chats[0]?.id || chatId, userMsg);
    
    const history = messages.map(m => ({
      role: m.role,
      content: m.content
    }));

    setText("");
    setImage(null);
    setUrl("");
    setIsLoading(true);

    try {
      const res = await fetch('https://bestlink-ai.onrender.com/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: userMsg.content, 
          image, 
          url: url || undefined,
          history,
          model: selectedModel
        }),
      });

      if (!res.ok) throw new Error("Failed to connect to engine");

      // Initialize assistant message
      const assistantMsgId = Math.random().toString(36).substring(7);
      addMessage(activeWorkspace?.chats[0]?.id || chatId, {
        id: assistantMsgId,
        role: 'assistant',
        content: "",
        timestamp: Date.now()
      });

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";

      if (!reader) throw new Error("Stream reader not available");

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6);
            if (dataStr === '[DONE]') continue;
            try {
              const data = JSON.parse(dataStr);
              if (data.reply) {
                fullContent += data.reply;
                updateLastMessage(activeWorkspace?.chats[0]?.id || chatId, fullContent);
              } else if (data.error) {
                throw new Error(data.error);
              }
            } catch (e) {
              // Ignore partial JSON
            }
          }
        }
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Generation failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#0f0f0f] text-[#ececec] relative">
      {/* 🏛️ ELITE HEADER */}
      <header className="h-14 border-b border-white/5 flex items-center justify-between px-6 shrink-0 bg-[#0f0f0f]/80 backdrop-blur-md z-30 sticky top-0">
        <div className="flex items-center gap-3">
          <div className="relative group">
            <button 
              onClick={() => setIsModelMenuOpen(!isModelMenuOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all"
            >
              <Sparkles className={cn("w-3.5 h-3.5", `text-${MODELS.find(m => m.id === selectedModel)?.color}-400`)} />
              <span className="text-xs font-bold">{MODELS.find(m => m.id === selectedModel)?.name}</span>
              <ChevronDown className={cn("w-3 h-3 transition-transform", isModelMenuOpen && "rotate-180")} />
            </button>

            <AnimatePresence>
              {isModelMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute top-full left-0 mt-2 w-64 bg-[#171717] border border-white/10 rounded-2xl shadow-2xl overflow-hidden p-1 z-50"
                >
                  {MODELS.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => {
                        setModel(m.id);
                        setIsModelMenuOpen(false);
                      }}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all",
                        selectedModel === m.id ? "bg-white/10 text-white" : "text-white/40 hover:bg-white/5 hover:text-white"
                      )}
                    >
                      <Sparkles className={cn("w-3.5 h-3.5", selectedModel === m.id ? `text-${m.color}-400` : "text-white/20")} />
                      <span className="text-xs font-bold">{m.name}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          <div className="h-4 w-px bg-white/5 mx-1" />
          <span className="text-[10px] font-black uppercase tracking-widest text-white/20">Elite Prompt Engine</span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            <span className="text-[9px] font-black text-blue-400 uppercase tracking-tighter">System Ready</span>
          </div>
        </div>
      </header>

      {/* 💬 CHAT AREA */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto custom-scrollbar pt-8 pb-40"
      >
        <div className="max-w-[800px] mx-auto w-full px-4 space-y-12">
          
          {!activeWorkspaceId ? (
            <div className="h-[60vh] flex flex-col items-center justify-center text-center space-y-6">
              <div className="w-20 h-20 rounded-[2.5rem] bg-white/5 flex items-center justify-center border border-white/5 animate-float">
                <Plus className="w-8 h-8 text-white/20" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-black tracking-tight text-white">Select a Project</h2>
                <p className="text-sm font-medium text-white/30 max-w-xs mx-auto">Create or select a workspace in the sidebar to begin building your vision.</p>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="h-[60vh] flex flex-col items-center justify-center text-center space-y-8">
              <div className="w-20 h-20 rounded-[2.5rem] bg-white/5 flex items-center justify-center border border-white/5 animate-float">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
              <div className="space-y-3">
                <h2 className="text-3xl font-black tracking-tighter text-white">What vision shall we build?</h2>
                <p className="text-sm font-medium text-white/40 max-w-sm mx-auto leading-relaxed">
                  Plan architecture, generate UI prompts, or analyze inspiration. I am your creative technical lead.
                </p>
              </div>
            </div>
          ) : (
            messages.map((msg, i) => (
              <motion.div
                key={msg.id || i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "flex gap-6 w-full",
                  msg.role === 'user' ? "flex-row-reverse" : "flex-row"
                )}
              >
                {/* Avatar */}
                <div className={cn(
                  "w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border transition-all shadow-lg",
                  msg.role === 'user' 
                    ? "bg-white border-white rotate-3" 
                    : "bg-[#171717] border-white/5 -rotate-3"
                )}>
                  {msg.role === 'user' ? <User className="w-5 h-5 text-black" /> : <Sparkles className="w-5 h-5 text-white" />}
                </div>

                {/* Bubble Content */}
                <div className={cn(
                  "flex-1 space-y-4 min-w-0",
                  msg.role === 'user' ? "text-right" : "text-left"
                )}>
                  {msg.attachments?.map((att, idx) => (
                    <div key={idx} className={cn("flex", msg.role === 'user' ? "justify-end" : "justify-start")}>
                      <img src={att.url} alt="Attached" className="max-w-[400px] rounded-3xl border border-white/10 shadow-2xl" />
                    </div>
                  ))}
                  
                  <div className={cn(
                    "inline-block max-w-full text-sm font-medium leading-relaxed",
                    msg.role === 'user' 
                      ? "px-6 py-4 rounded-[2rem] bg-[#2f2f2f] text-white shadow-xl" 
                      : "prose prose-invert max-w-none prose-pre:bg-[#171717] prose-pre:border prose-pre:border-white/5 prose-code:text-blue-400"
                  )}>
                    <ChatMarkdown content={msg.content} />
                  </div>
                </div>
              </motion.div>
            ))
          )}

          {isLoading && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-6 w-full"
            >
              <div className="w-10 h-10 rounded-2xl bg-[#171717] border border-white/5 flex items-center justify-center shrink-0 animate-pulse">
                <Loader2 className="w-5 h-5 text-white/20 animate-spin" />
              </div>
              <div className="flex flex-col gap-2 pt-2">
                <div className="h-3 w-48 bg-white/5 rounded-full animate-pulse" />
                <div className="h-3 w-32 bg-white/5 rounded-full animate-pulse delay-75" />
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* ⌨️ INPUT AREA */}
      <div className={cn(
        "fixed bottom-0 right-0 p-4 md:p-8 bg-gradient-to-t from-[#0f0f0f] via-[#0f0f0f] to-transparent z-40 transition-all duration-300",
        useAppStore.getState().isSidebarOpen ? "left-[260px]" : "left-0"
      )}>
        <div className="max-w-[800px] mx-auto w-full relative">
          <form 
            onSubmit={handleSubmit}
            className="bg-[#171717] border border-white/10 rounded-[2.5rem] p-4 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.8)] focus-within:border-white/20 transition-all"
          >
            {/* Context bar */}
            {(image || url) && (
              <div className="flex items-center gap-3 px-4 py-2 border-b border-white/5 mb-3">
                {image && (
                  <div className="relative group">
                    <img src={image} className="w-12 h-12 rounded-xl object-cover border border-white/10" />
                    <button onClick={() => setImage(null)} className="absolute -top-1.5 -right-1.5 bg-red-500 rounded-full p-1 text-white shadow-xl hover:scale-110 transition-transform"><X className="w-3 h-3"/></button>
                  </div>
                )}
                {url && (
                  <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-2xl text-[10px] text-white/50 border border-white/5">
                    <Globe className="w-3.5 h-3.5" />
                    <span className="truncate max-w-[200px] font-bold">{url}</span>
                    <button onClick={() => setUrl("")} className="hover:text-white transition-colors"><X className="w-3.5 h-3.5"/></button>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-end gap-3 px-2">
              <input type="file" accept="image/*" hidden ref={fileInputRef} onChange={handleImageUpload} />
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-3 rounded-2xl hover:bg-white/5 text-white/20 hover:text-white transition-all active:scale-90"
                title="Attach Inspiration"
              >
                <Paperclip className="w-5 h-5" />
              </button>
              
              <div className="flex-1 flex flex-col gap-2">
                <textarea
                  placeholder="Describe your vision or upload a screenshot..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit();
                    }
                  }}
                  className="w-full bg-transparent border-none outline-none resize-none py-3 px-2 text-sm text-white placeholder:text-white/20 max-h-[300px] font-medium leading-relaxed"
                  rows={1}
                />
                {!url && (text.length > 20 || image) && (
                  <button 
                    type="button"
                    onClick={() => {
                      const link = prompt("Enter inspiration URL:");
                      if (link) setUrl(link);
                    }}
                    className="flex items-center gap-2 px-3 py-1.5 w-fit rounded-xl bg-white/5 text-[10px] font-black text-white/20 hover:text-white/60 hover:bg-white/10 transition-all mb-1 uppercase tracking-widest"
                  >
                    <Globe className="w-3.5 h-3.5" /> Add URL Context
                  </button>
                )}
              </div>

              <button 
                type="submit"
                disabled={isLoading || (!text.trim() && !image) || !activeWorkspaceId}
                className={cn(
                  "p-3 rounded-2xl transition-all active:scale-90 disabled:opacity-20 shadow-lg",
                  (text.trim() || image) && activeWorkspaceId ? "bg-white text-black" : "bg-white/10 text-white/10"
                )}
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
              </button>
            </div>
          </form>
          
          <div className="text-center py-4">
            <p className="text-[9px] text-white/5 font-black uppercase tracking-[0.4em]">
              Bestlink Elite Prompt Engine • v2.1 • Powered by Gemini & DeepSeek
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
