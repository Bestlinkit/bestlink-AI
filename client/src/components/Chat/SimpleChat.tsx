"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Paperclip, Globe, Loader2, Image as ImageIcon, X, User, Sparkles, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Message {
  role: 'user' | 'assistant';
  content: string;
  image?: string | null;
  url?: string;
}

export default function SimpleChat() {
  const [text, setText] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  
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

    const userMessage: Message = { 
      role: 'user', 
      content: text, 
      image, 
      url: url || undefined 
    };

    setMessages(prev => [...prev, userMessage]);
    setText("");
    setImage(null);
    setUrl("");
    setIsLoading(true);

    try {
      const res = await fetch('https://bestlink-ai.onrender.com/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: userMessage.content, 
          image: userMessage.image, 
          url: userMessage.url 
        }),
      });

      const data = await res.json();
      if (data.reply) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
      } else {
        throw new Error(data.error || "Failed to get response");
      }
    } catch (err: any) {
      console.error(err);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "AI temporarily unavailable. Please try again." 
      }]);
      toast.error("Connection failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#0f0f0f] text-[#ececec]">
      {/* 🏛️ HEADER */}
      <header className="h-14 border-b border-white/5 flex items-center justify-between px-6 shrink-0 bg-[#0f0f0f]/80 backdrop-blur-md z-10 sticky top-0">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-white flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-black" />
          </div>
          <span className="text-sm font-bold tracking-tight">Bestlink Assistant</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">v2.0 Stable</span>
        </div>
      </header>

      {/* 💬 CHAT AREA */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto custom-scrollbar pt-8 pb-32"
      >
        <div className="max-w-[800px] mx-auto w-full px-4 space-y-8">
          
          {messages.length === 0 && (
            <div className="h-[60vh] flex flex-col items-center justify-center text-center space-y-6 opacity-40">
              <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-black tracking-tight">How can I help you today?</h2>
                <p className="text-sm font-medium">Text, Image, or URL context — I am ready.</p>
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "flex gap-4 w-full",
                msg.role === 'user' ? "flex-row-reverse" : "flex-row"
              )}
            >
              {/* Avatar */}
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center shrink-0 border",
                msg.role === 'user' ? "bg-white border-white" : "bg-[#1f1f1f] border-white/10"
              )}>
                {msg.role === 'user' ? <User className="w-4 h-4 text-black" /> : <Sparkles className="w-4 h-4 text-white" />}
              </div>

              {/* Bubble */}
              <div className={cn(
                "max-w-[85%] space-y-4",
                msg.role === 'user' ? "items-end" : "items-start"
              )}>
                {msg.image && (
                  <img src={msg.image} alt="User upload" className="max-w-[300px] rounded-2xl border border-white/10 mb-2 shadow-xl" />
                )}
                {msg.url && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] text-white/40 mb-2">
                    <Globe className="w-3 h-3" />
                    {msg.url}
                  </div>
                )}
                <div className={cn(
                  "px-5 py-3 rounded-[1.5rem] text-sm font-medium shadow-sm",
                  msg.role === 'user' ? "bg-[#2f2f2f] text-white" : "bg-transparent text-[#ececec] prose prose-invert prose-p:leading-relaxed max-w-none"
                )}>
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              </div>
            </motion.div>
          ))}

          {isLoading && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-4 w-full"
            >
              <div className="w-8 h-8 rounded-full bg-[#1f1f1f] border border-white/10 flex items-center justify-center shrink-0">
                <Loader2 className="w-4 h-4 text-white/40 animate-spin" />
              </div>
              <div className="flex items-center gap-2 text-white/40 italic text-xs animate-pulse">
                Assistant is thinking...
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* ⌨️ INPUT AREA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 md:p-6 bg-gradient-to-t from-[#0f0f0f] via-[#0f0f0f] to-transparent">
        <div className="max-w-[800px] mx-auto w-full relative">
          
          <form 
            onSubmit={handleSubmit}
            className="bg-[#171717] border border-white/10 rounded-[2rem] p-3 shadow-2xl focus-within:border-white/20 transition-all"
          >
            {/* Context bar */}
            {(image || url) && (
              <div className="flex items-center gap-3 px-4 py-2 border-b border-white/5 mb-2">
                {image && (
                  <div className="relative group">
                    <img src={image} className="w-10 h-10 rounded-lg object-cover" />
                    <button onClick={() => setImage(null)} className="absolute -top-1 -right-1 bg-red-500 rounded-full p-0.5 text-white shadow-lg"><X className="w-2.5 h-2.5"/></button>
                  </div>
                )}
                {url && (
                  <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-xl text-[10px] text-white/50 border border-white/5">
                    <Globe className="w-3 h-3" />
                    <span className="truncate max-w-[150px]">{url}</span>
                    <button onClick={() => setUrl("")}><X className="w-3 h-3"/></button>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-end gap-2 px-2">
              <input 
                type="file" 
                accept="image/*" 
                hidden 
                ref={fileInputRef} 
                onChange={handleImageUpload} 
              />
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2.5 rounded-full hover:bg-white/5 text-white/30 hover:text-white transition-all active:scale-90"
              >
                <Paperclip className="w-5 h-5" />
              </button>
              
              <div className="flex-1 flex flex-col gap-1">
                <textarea
                  placeholder="Message..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit();
                    }
                  }}
                  className="w-full bg-transparent border-none outline-none resize-none py-2.5 px-2 text-sm text-white placeholder:text-white/30 max-h-[200px] font-medium"
                  rows={1}
                />
                {!url && text.length > 10 && !text.startsWith('http') && (
                  <button 
                    type="button"
                    onClick={() => {
                      const link = prompt("Enter URL context:");
                      if (link) setUrl(link);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1 w-fit rounded-full bg-white/5 text-[9px] font-bold text-white/30 hover:text-white/60 transition-all mb-1"
                  >
                    <Globe className="w-3 h-3" /> ADD URL CONTEXT
                  </button>
                )}
              </div>

              <button 
                type="submit"
                disabled={isLoading || (!text.trim() && !image)}
                className={cn(
                  "p-2 rounded-xl transition-all active:scale-90 disabled:opacity-30",
                  text.trim() || image ? "bg-white text-black" : "bg-white/10 text-white/10"
                )}
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
              </button>
            </div>
          </form>
          
          <div className="text-center py-3">
            <p className="text-[10px] text-white/10 font-bold uppercase tracking-widest">
              Bestlink OS • Stable Multimodal Intelligence
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
