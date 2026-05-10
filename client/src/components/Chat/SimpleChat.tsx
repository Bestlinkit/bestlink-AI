"use client";

import { useState, useRef } from "react";
import { Send, Paperclip, Globe, Loader2, Image as ImageIcon, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

export default function SimpleChat() {
  const [text, setText] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text && !image && !isLoading) return;

    setIsLoading(true);
    setResponse(null);

    try {
      const res = await fetch('https://bestlink-digital-ai-backend.onrender.com/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, image, url }),
      });

      const data = await res.json();
      if (data.reply) {
        setResponse(data.reply);
        toast.success("AI Response Received");
      } else {
        throw new Error(data.error || "Failed to get response");
      }
    } catch (err: any) {
      console.error(err);
      setResponse("AI temporarily unavailable. Please try again.");
      toast.error("Generation failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto w-full px-6 py-12 space-y-12 min-h-screen flex flex-col">
      {/* 🚀 HEADER */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/5 border border-white/10">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/50">Bestlink Minimal Assistant</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-white">
          Direct <span className="gradient-text">Multimodal</span> Intelligence
        </h1>
      </div>

      {/* 🤖 RESPONSE BOX */}
      <div className="flex-1 min-h-[300px]">
        <AnimatePresence mode="wait">
          {response ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-8 rounded-[2.5rem] prose prose-invert max-w-none shadow-2xl"
            >
              <ReactMarkdown>{response}</ReactMarkdown>
            </motion.div>
          ) : (
            <div className="h-full flex items-center justify-center border-2 border-dashed border-white/5 rounded-[3rem]">
              <p className="text-white/10 font-black uppercase tracking-[0.4em] text-sm italic">System Idle : Awaiting Command</p>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* ⌨️ INPUT CONSOLE */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="glass-card rounded-[3rem] p-4 flex flex-col gap-4 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)]">
          
          {/* IMAGE PREVIEW & URL INPUT */}
          <div className="flex flex-wrap items-center gap-4 px-4">
            {image && (
              <div className="relative group">
                <img src={image} alt="Upload" className="w-16 h-16 rounded-2xl object-cover border border-white/10" />
                <button 
                  type="button"
                  onClick={() => setImage(null)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
            
            <div className="flex-1 flex items-center gap-3 bg-white/[0.03] rounded-2xl px-4 py-2 border border-white/5 focus-within:border-white/20 transition-all">
              <Globe className="w-4 h-4 text-white/20" />
              <input 
                type="url" 
                placeholder="Optional URL Context..." 
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="bg-transparent border-none outline-none text-xs text-white placeholder:text-white/10 w-full font-medium"
              />
            </div>
          </div>

          <div className="flex items-end gap-4">
            <textarea
              placeholder="What vision shall we build today?"
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none resize-none px-6 py-2 text-sm text-white placeholder:text-white/20 min-h-[60px] font-medium"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
            
            <div className="flex items-center gap-2 pb-2 pr-2">
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
                className="p-4 rounded-full bg-white/5 text-white/30 hover:text-white hover:bg-white/10 transition-all active:scale-90"
              >
                <Paperclip className="w-5 h-5" />
              </button>
              
              <button 
                type="submit"
                disabled={isLoading || (!text && !image)}
                className="p-4 rounded-full bg-white text-black hover:bg-zinc-200 transition-all active:scale-90 disabled:opacity-50 disabled:grayscale"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
        
        <p className="text-center text-[10px] text-white/10 font-bold uppercase tracking-[0.3em]">
          Powered by OpenRouter Engine v2.0 • Multimodal Capable
        </p>
      </form>
    </div>
  );
}
