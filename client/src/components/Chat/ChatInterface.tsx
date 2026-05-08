"use client";

import { useState, useRef, useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import { AGENTS } from "@/config/agents";
import { 
  Send, 
  Paperclip, 
  Command, 
  Sparkles, 
  Code, 
  Image as ImageIcon,
  Loader2,
  RotateCcw,
  StopCircle,
  Terminal,
  X,
  LayoutGrid
} from "lucide-react";
import MessageList from "./MessageList";
import ModelSelector from "./ModelSelector";
import ImageUpload from "./ImageUpload";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function ChatInterface() {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [pipelineStage, setPipelineStage] = useState<string | null>(null);
  const [pipelineData, setPipelineData] = useState<any>(null);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  
  const { chats, currentChatId, addMessage, updateLastMessage, model, activeAgentId } = useAppStore();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  const currentChat = chats.find(c => c.id === currentChatId);
  const activeAgent = AGENTS.find(a => a.id === activeAgentId) || AGENTS[1];

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "inherit";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  const handlePipelineRequest = async (prompt: string, chatId: string) => {
    setIsLoading(true);
    setPipelineStage('ANALYZING');
    
    try {
      const response = await fetch(`${API_URL}/api/pipeline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });

      if (!response.ok) throw new Error('Pipeline failed to initialize');

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader available');

      const decoder = new TextDecoder();
      let assistantMessageId = Math.random().toString(36).substring(7);
      
      addMessage(chatId, {
        id: assistantMessageId,
        role: 'assistant' as const,
        content: "Initializing Bestlink AI Production Pipeline...",
        timestamp: Date.now()
      });

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;
            try {
              const parsed = JSON.parse(data);
              const { stage, data: stageData } = parsed;
              
              setPipelineStage(stage);
              setPipelineData(stageData);

              if (stage === 'ANALYZED') {
                updateLastMessage(chatId, `Project Manifest Created: ${stageData.type} with ${stageData.pages.length} pages.`);
              } else if (stage === 'STREAMING_CODE') {
                const content = stageData.choices?.[0]?.delta?.content || "";
                updateLastMessage(chatId, (prev) => prev + content);
              }
            } catch (e) {}
          }
        }
      }
    } catch (error: any) {
      console.error('Pipeline Error:', error);
      toast.error(error.message || "Failed to generate project");
    } finally {
      setIsLoading(false);
      setPipelineStage(null);
    }
  };

  const handleSend = async () => {
    if ((!input.trim() && attachments.length === 0) || isLoading || !currentChatId) return;

    const userMessage = {
      id: Math.random().toString(36).substring(7),
      role: 'user' as const,
      content: input,
      attachments: [...attachments],
      timestamp: Date.now()
    };

    const prompt = input;
    addMessage(currentChatId, userMessage);
    setInput("");
    setAttachments([]);
    setIsUploadOpen(false);

    const isPipelineRequest = prompt.toLowerCase().includes('build') || prompt.toLowerCase().includes('generate');
    if (isPipelineRequest) {
      handlePipelineRequest(prompt, currentChatId);
      return;
    }

    setIsLoading(true);

    const assistantMessageId = Math.random().toString(36).substring(7);
    addMessage(currentChatId, {
      id: assistantMessageId,
      role: 'assistant' as const,
      content: "",
      timestamp: Date.now()
    });

    try {
      abortControllerRef.current = new AbortController();
      
      const systemMessage = {
        role: 'system',
        content: activeAgent.systemPrompt
      };

      const response = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [systemMessage, ...(currentChat?.messages || []), userMessage],
          model: model,
          options: { temperature: 0.7 }
        }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('Stream reader not available');

      let accumulatedContent = "";
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content || "";
              accumulatedContent += content;
              updateLastMessage(currentChatId, accumulatedContent);
            } catch (e) {
              console.error('Chunk parse error', e);
            }
          }
        }
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Stream aborted');
      } else {
        console.error('Chat error:', error);
        toast.error(error.message || "Something went wrong. Please try again.");
        updateLastMessage(currentChatId, "Sorry, I encountered an error while processing your request.");
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const handleRegenerate = async () => {
    if (isLoading || !currentChatId || !currentChat || currentChat.messages.length === 0) return;
    
    // Find the last user message
    const lastUserMessage = [...currentChat.messages].reverse().find(m => m.role === 'user');
    if (!lastUserMessage) return;

    setInput(lastUserMessage.content);
    // We'll just call handleSend with the previous input
    // To make it feel like regenerate, we could remove the last assistant message
    // but for now, we'll just send again.
    setTimeout(() => handleSend(), 100);
  };

  return (
    <div className="flex flex-col h-full bg-[#050505] relative">
      {/* Premium Chat Header */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-white/5 bg-[#09090b]/80 backdrop-blur-xl sticky top-0 z-20">
        <div className="flex items-center gap-6">
          <ModelSelector />
          <div className="h-4 w-[1px] bg-white/10 hidden md:block" />
          <div className="hidden md:flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                Agent: <span className="text-zinc-200">{activeAgent.name}</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                Mode: <span className="text-zinc-200">Production</span>
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end mr-4 hidden sm:flex">
            <span className="text-[9px] font-bold text-zinc-600 uppercase leading-none mb-1">
              Project Status
            </span>
            <span className="text-[10px] font-medium text-blue-400 leading-none">
              Development Active
            </span>
          </div>
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold transition-all shadow-[0_0_15px_rgba(37,99,235,0.3)]">
            <LayoutGrid className="w-3.5 h-3.5" />
            DEPLOY
          </button>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 custom-scrollbar">
        {currentChatId ? (
          <MessageList messages={currentChat?.messages || []} isLoading={isLoading} />
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-10 max-w-4xl mx-auto px-4 pb-20">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="relative"
            >
              <div className="absolute inset-0 bg-blue-500/20 blur-[60px] rounded-full animate-pulse" />
              <div className="relative w-24 h-24 rounded-[2rem] bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center border border-white/20 shadow-2xl">
                <Sparkles className="w-12 h-12 text-white" />
              </div>
            </motion.div>

            <div className="space-y-4">
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-5xl font-bold font-outfit tracking-tight text-white leading-tight"
              >
                What shall we build <span className="gradient-text">today?</span>
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-zinc-500 text-lg max-w-xl mx-auto font-medium"
              >
                Orchestrate elite software production with the Bestlink multi-agent engine. 
                From SaaS platforms to complex digital architectures.
              </motion.p>
            </div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full"
            >
              {[
                { icon: Code, title: "Next.js Dashboard", desc: "Build a premium SaaS admin system", color: "text-blue-400" },
                { icon: Sparkles, title: "Studio Landing Page", desc: "Cinematic design with GSAP animations", color: "text-purple-400" },
                { icon: Terminal, title: "API Architecture", desc: "Robust backend logic with SQLite/Postgres", color: "text-green-400" },
                { icon: ImageIcon, title: "UI Reconstruction", desc: "Convert screenshots to production code", color: "text-yellow-400" }
              ].map((item, i) => (
                <button
                  key={i}
                  className="p-5 rounded-2xl border border-white/5 bg-[#09090b]/50 hover:bg-white/5 hover:border-white/10 transition-all text-left group relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  <item.icon className={cn("w-6 h-6 mb-3 transition-transform group-hover:scale-110", item.color)} />
                  <div className="text-sm font-bold text-zinc-200 mb-1">{item.title}</div>
                  <div className="text-xs text-zinc-500 font-medium leading-relaxed">{item.desc}</div>
                </button>
              ))}
            </motion.div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 md:p-8 pt-0">
        <div className={cn(
          "max-w-4xl mx-auto relative glass border rounded-2xl transition-all duration-300",
          isLoading ? "ring-1 ring-blue-500/50" : "focus-within:ring-1 focus-within:ring-white/20"
        )}>
          <AnimatePresence>
            {isUploadOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="p-4 border-b border-white/5 bg-white/5">
                  <ImageUpload 
                    attachments={attachments}
                    onUpload={(files) => setAttachments(prev => [...prev, ...files])}
                    onRemove={(index) => setAttachments(prev => prev.filter((_, i) => i !== index))}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {attachments.length > 0 && !isUploadOpen && (
            <div className="flex gap-2 p-3 border-b border-white/5 overflow-x-auto no-scrollbar">
              {attachments.map((file, i) => (
                <div key={i} className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[10px] text-zinc-400 flex items-center gap-2 whitespace-nowrap">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500/50" />
                  {file.originalName}
                  <button onClick={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))}>
                    <X className="w-3 h-3 hover:text-white transition-colors" />
                  </button>
                </div>
              ))}
            </div>
          )}
          
          <div className="flex items-end p-2 gap-2">
            <button 
              onClick={() => setIsUploadOpen(!isUploadOpen)}
              className={cn(
                "p-2.5 rounded-xl transition-all duration-200",
                isUploadOpen ? "bg-blue-500/10 text-blue-400" : "hover:bg-white/5 text-zinc-500 hover:text-zinc-300"
              )}
            >
              <Paperclip className="w-5 h-5" />
            </button>
            
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Ask Bestlink Digital AI to build something..."
              className="flex-1 bg-transparent border-none outline-none py-3 px-2 text-sm text-zinc-200 placeholder:text-zinc-600 resize-none max-h-60"
            />

            {isLoading ? (
              <button
                onClick={handleStop}
                className="p-2.5 bg-zinc-800 text-white rounded-xl transition-all hover:bg-zinc-700"
              >
                <StopCircle className="w-5 h-5" />
              </button>
            ) : (
              <div className="flex items-center gap-2">
                {currentChat && currentChat.messages.length > 0 && (
                  <button
                    onClick={handleRegenerate}
                    className="p-2.5 hover:bg-white/5 text-zinc-500 rounded-xl transition-all"
                    title="Regenerate response"
                  >
                    <RotateCcw className="w-5 h-5" />
                  </button>
                )}
                <button
                  onClick={handleSend}
                  disabled={!input.trim() && attachments.length === 0}
                  className="p-2.5 bg-white text-black rounded-xl transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 disabled:hover:scale-100"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
          
          <div className="flex items-center justify-between px-4 py-2 border-t border-white/5">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-medium">
                <Command className="w-3 h-3" />
                <span>+ ENTER to send</span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                <span>OpenRouter Engine</span>
              </div>
            </div>
            <div className="text-[10px] text-zinc-600">
              Bestlink Digital v1.0.0
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
