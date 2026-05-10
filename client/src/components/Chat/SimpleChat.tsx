"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Paperclip, Globe, Loader2, Image as ImageIcon, X, User, Sparkles, ArrowRight, ChevronDown, Plus, Palette, Layout, Code, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ChatMarkdown } from "./ChatMarkdown";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAppStore, Message } from "@/store/useAppStore";

const MODELS = [
  { id: 'gemini', name: 'Gemini 2.0 Flash', color: 'blue', description: 'Fast, multimodal analysis' },
  { id: 'deepseek', name: 'DeepSeek Chat', color: 'purple', description: 'Advanced architecture & logic' },
  { id: 'qwen', name: 'Qwen 2.5', color: 'green', description: 'Frontend & UI specialist' },
  { id: 'claude', name: 'Claude Haiku', color: 'orange', description: 'UX reasoning & flow' },
];

const MODES = [
  { id: 'creative', label: 'Creative Director', icon: Palette, color: 'purple' },
  { id: 'architect', label: 'UI Architect', icon: Layout, color: 'blue' },
  { id: 'engineer', label: 'Frontend Engineer', icon: Code, color: 'green' },
  { id: 'dna', label: 'Design DNA', icon: Zap, color: 'yellow' },
  { id: 'prompt', label: 'IDE Prompt', icon: Sparkles, color: 'white' }
];

export default function SimpleChat() {
  const { 
    workspaces, 
    activeWorkspaceId, 
    addMessage, 
    updateLastMessage,
    model,
    setModel,
    responseMode,
    setResponseMode,
    updateWorkspace,
    isSidebarOpen
  } = useAppStore();
  
  const [text, setText] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeWorkspace = workspaces.find(w => w.id === activeWorkspaceId);
  const activeChat = activeWorkspace?.chats[0];
  const messages = activeChat?.messages || [];
  const chatId = activeChat?.id || "";

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      const isAtBottom = scrollHeight - scrollTop <= clientHeight + 150;
      if (isAtBottom || isLoading) {
        scrollRef.current.scrollTo({ top: scrollHeight, behavior: 'smooth' });
      }
    }
  }, [messages, isLoading]);

  const generateTitle = async (prompt: string) => {
    try {
      const res = await fetch('https://bestlink-ai.onrender.com/api/generate-title', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      if (data.title && activeWorkspaceId && activeWorkspace) {
        updateWorkspace(activeWorkspaceId, { 
          chats: activeWorkspace.chats.map(c => c.id === chatId ? { ...c, title: data.title } : c)
        });
      }
    } catch (e) {
      console.error("Title generation failed", e);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!text.trim() && !image) || isLoading || !activeWorkspaceId) return;

    const currentText = text;
    const currentImage = image;
    const currentUrl = url;

    const userMsg: Message = {
      id: Math.random().toString(36).substring(7),
      role: 'user',
      content: currentText,
      attachments: currentImage ? [{ type: 'image', url: currentImage }] : [],
      timestamp: Date.now()
    };

    addMessage(chatId, userMsg);
    setIsLoading(true);

    // Auto-generate title on first message
    if (messages.length === 0) {
      generateTitle(currentText);
    }

    try {
      const modeInstructions: Record<string, string> = {
        creative: "MODE: Creative Director. Focus on visual storytelling, luxury aesthetic DNA, and UX strategy.",
        architect: "MODE: UI Architect. Focus on component hierarchy, layout strategy, and technical architecture.",
        engineer: "MODE: Frontend Engineer. Focus on production-grade React (TSX), Tailwind v4, and accessibility.",
        prompt: "MODE: Antigravity Prompt Specialist. Output ONLY high-fidelity prompts for the IDE build.",
        dna: "MODE: Design DNA Analyzer. Extract spacing, typography, and color systems from the visual reference."
      };

      const res = await fetch('https://bestlink-ai.onrender.com/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: `[${modeInstructions[responseMode]}]\n\n${currentText}`, 
          image: currentImage, 
          url: currentUrl || undefined,
          history: messages.map(m => ({ role: m.role, content: m.content })),
          model: model,
          projectMemory: activeChat?.projectMemory
        }),
      });

      if (!res.ok) throw new Error("Connection failed");

      // SUCCESS: Clear inputs
      setText("");
      setImage(null);
      setUrl("");

      const assistantMsgId = Math.random().toString(36).substring(7);
      addMessage(chatId, {
        id: assistantMsgId,
        role: 'assistant',
        content: "",
        timestamp: Date.now()
      });

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";

      if (!reader) throw new Error("Stream unavailable");

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
                updateLastMessage(chatId, fullContent);
              } else if (data.error) {
                throw new Error(data.error);
              }
            } catch (e) {}
          }
        }
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Generation failed. Your input has been preserved.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  if (!activeWorkspaceId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 animate-panel">
        <Sparkles className="w-12 h-12 mb-4 opacity-20" />
        <h2 className="text-xl font-bold text-white mb-2">Initialize Creative Workspace</h2>
        <p className="text-sm">Select a project from the sidebar to begin production.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0f0f0f] relative overflow-hidden">
      {/* 🚀 ELITE TOPBAR */}
      <header className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-[#0f0f0f]/80 backdrop-blur-xl z-30">
        <div className="flex items-center gap-4">
          <div className="relative">
            <button 
              onClick={() => setIsModelMenuOpen(!isModelMenuOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all"
            >
              <div className={cn("w-2 h-2 rounded-full", `bg-${MODELS.find(m => m.id === model)?.color}-400`)} />
              <span className="text-xs font-bold text-white/80">{MODELS.find(m => m.id === model)?.name}</span>
              <ChevronDown className="w-3 h-3 opacity-30" />
            </button>
            
            <AnimatePresence>
              {isModelMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-full left-0 mt-2 w-64 bg-[#171717] border border-white/10 rounded-2xl shadow-2xl p-1 z-50"
                >
                  {MODELS.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => { setModel(m.id); setIsModelMenuOpen(false); }}
                      className={cn(
                        "w-full flex flex-col px-3 py-2.5 rounded-xl text-left transition-all",
                        model === m.id ? "bg-white/10 text-white" : "text-white/40 hover:bg-white/5 hover:text-white"
                      )}
                    >
                      <span className="text-xs font-bold">{m.name}</span>
                      <span className="text-[10px] opacity-40">{m.description}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className="h-4 w-px bg-white/5 mx-1" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">Production Suite</span>
        </div>

        <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
          {MODES.map((m) => (
            <button
              key={m.id}
              onClick={() => setResponseMode(m.id as any)}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                responseMode === m.id ? "bg-white/10 text-white shadow-lg" : "text-white/30 hover:text-white/60"
              )}
            >
              <m.icon className="w-3 h-3" />
              <span className="hidden md:inline">{m.label.split(' ')[0]}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center gap-2">
            <div className="w-1 h-1 rounded-full bg-blue-400 animate-pulse" />
            <span className="text-[9px] font-black text-blue-400 uppercase">Engine Ready</span>
          </div>
        </div>
      </header>

      {/* 💬 CHAT FEED */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto custom-scrollbar pt-8 pb-40">
        <div className="max-w-[800px] mx-auto w-full px-6 space-y-12">
          {messages.length === 0 && (
            <div className="h-[50vh] flex flex-col items-center justify-center text-center space-y-8 animate-panel">
              <div className="w-20 h-20 rounded-[2.5rem] bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-2xl">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
              <div className="space-y-3">
                <h2 className="text-3xl font-black tracking-tighter text-white uppercase">Architecting Vision</h2>
                <p className="text-sm font-medium text-white/30 max-w-sm mx-auto leading-relaxed">
                  Elite Creative Production OS for high-fidelity UI systems and Antigravity IDE implementation.
                </p>
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <motion.div 
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "flex gap-6 w-full group",
                msg.role === 'user' ? "flex-row-reverse" : "flex-row"
              )}
            >
              <div className={cn(
                "w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border shadow-2xl transition-all",
                msg.role === 'user' ? "bg-white border-white rotate-3" : "bg-[#171717] border-white/5 -rotate-3"
              )}>
                {msg.role === 'user' ? <User className="w-5 h-5 text-black" /> : <Sparkles className="w-5 h-5 text-white" />}
              </div>
              
              <div className={cn(
                "flex flex-col gap-4 chat-response min-w-0",
                msg.role === 'user' ? "items-end" : "items-start flex-1"
              )}>
                {msg.attachments?.map((att, i) => (
                  <img key={i} src={att.url} alt="inspiration" className="max-w-md rounded-3xl border border-white/5 shadow-2xl" />
                ))}
                <div className={cn(
                  "relative max-w-full",
                  msg.role === 'user' 
                    ? "px-6 py-4 rounded-[2rem] bg-[#2f2f2f] text-white shadow-xl font-medium text-sm leading-relaxed" 
                    : "w-full"
                )}>
                  <ChatMarkdown content={msg.content} />
                </div>
              </div>
            </motion.div>
          ))}
          {isLoading && (
            <div className="flex gap-6 w-full animate-pulse">
              <div className="w-10 h-10 rounded-2xl bg-[#171717] border border-white/5 flex items-center justify-center shrink-0">
                <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
              </div>
              <div className="flex flex-col gap-2 pt-2">
                <div className="h-2 w-48 bg-white/5 rounded-full" />
                <div className="h-2 w-32 bg-white/5 rounded-full" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ⌨️ INPUT BAR (STICKY BOTTOM) */}
      <div className={cn(
        "absolute bottom-0 right-0 p-8 bg-gradient-to-t from-[#0f0f0f] via-[#0f0f0f] to-transparent z-40 transition-all duration-500",
        isSidebarOpen ? "left-[260px]" : "left-0"
      )}>
        <div className="max-w-[800px] mx-auto w-full relative">
          <form 
            onSubmit={handleSubmit} 
            className="bg-[#171717] border border-white/10 rounded-[2.5rem] p-4 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.8)] focus-within:border-white/20 transition-all"
          >
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
              <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
              <button 
                type="button" 
                onClick={() => fileInputRef.current?.click()} 
                className="p-3 rounded-2xl hover:bg-white/5 text-white/20 hover:text-white transition-all active:scale-90"
              >
                <Paperclip className="w-5 h-5" />
              </button>
              
              <div className="flex-1 flex flex-col gap-2">
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit();
                    }
                  }}
                  placeholder={`Consult with the ${MODES.find(m => m.id === responseMode)?.label}...`}
                  className="w-full bg-transparent border-none outline-none text-sm text-white placeholder:text-white/20 resize-none py-3 px-2 max-h-48 custom-scrollbar font-medium leading-relaxed"
                  rows={1}
                />
                {!url && (text.length > 20 || image) && (
                  <button 
                    type="button" 
                    onClick={() => { const l = prompt("Inspiration URL:"); if(l) setUrl(l); }} 
                    className="flex items-center gap-2 px-3 py-1.5 w-fit rounded-xl bg-white/5 text-[10px] font-black text-white/20 hover:text-white/60 hover:bg-white/10 transition-all mb-1 uppercase tracking-widest"
                  >
                    <Globe className="w-3.5 h-3.5" /> Contextual URL
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading || (!text.trim() && !image) || !activeWorkspaceId}
                className={cn(
                  "p-3 rounded-2xl transition-all active:scale-90 disabled:opacity-20 shadow-xl",
                  (text.trim() || image) ? "bg-white text-black" : "bg-white/10 text-white/10"
                )}
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
              </button>
            </div>
          </form>
          
          <div className="text-center py-4">
            <p className="text-[9px] text-white/5 font-black uppercase tracking-[0.4em]">
              Creative Production OS • {MODELS.find(m => m.id === model)?.name} • {responseMode.toUpperCase()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
