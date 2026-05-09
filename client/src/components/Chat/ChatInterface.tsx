"use client";

import { useState, useRef, useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import { 
  Send, 
  Paperclip, 
  Command, 
  Sparkles, 
  Loader2, 
  RotateCcw, 
  StopCircle, 
  Terminal, 
  X, 
  Activity, 
  Box, 
  Database,
  ChevronDown,
  ChevronUp,
  Zap,
  Layout
} from "lucide-react";
import MessageList from "./MessageList";
import ModelSelector from "./ModelSelector";
import ImageUpload from "./ImageUpload";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import ExecutionProgress, { PipelineStage } from "./ExecutionProgress";

export default function ChatInterface() {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [pipelineStage, setPipelineStage] = useState<PipelineStage | null>(null);
  const [pipelineMessage, setPipelineMessage] = useState<string>("");
  const [projectPlan, setProjectPlan] = useState<any>(null);
  const [isInsightsOpen, setIsInsightsOpen] = useState(true);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  
  const { 
    workspaces, 
    activeWorkspaceId, 
    addChat, 
    addMessage, 
    updateLastMessage,
    setSandboxFiles
  } = useAppStore();

  const activeWorkspace = workspaces.find(w => w.id === activeWorkspaceId);
  const chats = activeWorkspace?.chats || [];
  const currentChatId = activeWorkspace?.currentChatId || null;
  const currentChat = chats.find(c => c.id === currentChatId);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "inherit";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  const handlePipeline = async (prompt: string, chatId: string) => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();

    setIsLoading(true);
    setPipelineStage('BUILD_START');
    setPipelineMessage("Initializing Bestlink AI Engine...");
    
    let watchdog: NodeJS.Timeout | undefined = undefined;
    
    try {
      const response = await fetch(`${API_URL}/api/pipeline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
        signal: abortControllerRef.current.signal
      });

      const reader = response.body?.getReader();
      if (!reader) throw new Error('Failed to initialize pipeline stream');

      const decoder = new TextDecoder();
      let buffer = "";
      
      const resetWatchdog = () => {
        if (watchdog) clearTimeout(watchdog);
        watchdog = setTimeout(() => {
          abortControllerRef.current?.abort();
          toast.error("Pipeline timed out. Check your connection.");
        }, 120000);
      };
      
      resetWatchdog();

      while (true) {
        const { done, value } = await reader.read();
        resetWatchdog();
        
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const rawData = line.slice(6);
            if (rawData === '[DONE]') continue;

            try {
              const { stage, data } = JSON.parse(rawData);
              
              if (stage === 'EXECUTION_ERROR') throw new Error(data.message);

              setPipelineStage(stage as PipelineStage);
              if (data?.message) setPipelineMessage(data.message);
              
              if (stage === 'SELECTING_TEMPLATE' && data.plan) {
                setProjectPlan(data.plan);
              }

              if (stage === 'COMPLETED_PROJECT' && data.payload?.files) {
                const newFiles = data.payload.files.map((file: any) => ({
                  id: Math.random().toString(36).substring(7),
                  name: file.path,
                  language: file.path.endsWith('.css') ? 'css' : 
                            file.path.endsWith('.html') ? 'html' : 'typescript',
                  content: file.content
                }));
                
                setSandboxFiles(newFiles);
                toast.success("Production files synchronized.");
              }

              if (stage === 'COMPLETED') {
                setIsLoading(false);
                setPipelineStage(null);
                toast.success("Generation complete!");
              }
            } catch (e) { /* partial chunk */ }
          }
        }
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Pipeline Error:', error);
        toast.error(error.message || "Execution failed");
      }
    } finally {
      if (watchdog) clearTimeout(watchdog);
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    let chatId = currentChatId;
    if (!chatId) {
      chatId = Math.random().toString(36).substring(7);
      addChat({
        id: chatId,
        title: input.slice(0, 30),
        messages: [],
        model: "bestlink-pro",
        createdAt: Date.now()
      });
    }

    const userMessage = {
      id: Math.random().toString(36).substring(7),
      role: 'user' as const,
      content: input,
      timestamp: Date.now()
    };

    addMessage(chatId, userMessage);
    setInput("");
    
    // Auto-detect project generation
    const isGeneration = /build|create|generate|make/i.test(userMessage.content);
    
    if (isGeneration) {
      addMessage(chatId, {
        id: Math.random().toString(36).substring(7),
        role: 'assistant' as const,
        content: `Initializing cinematic production for: "${userMessage.content}"`,
        timestamp: Date.now()
      });
      await handlePipeline(userMessage.content, chatId);
    } else {
      // Standard chat fallback...
      toast.info("Standard chat mode activated.");
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#050505] relative font-inter">
      {/* Header Controls */}
      <header className="h-14 border-b border-white/5 flex items-center justify-between px-6 bg-[#09090b]/50">
        <div className="flex items-center gap-4">
          <ModelSelector />
          <div className="h-4 w-[1px] bg-white/10" />
          <div className="flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-blue-500 fill-current" />
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Advanced Engine</span>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-8 custom-scrollbar">
        {isLoading && (
          <div className="max-w-3xl mx-auto mb-10 space-y-6">
            <ExecutionProgress currentStage={pipelineStage} statusMessage={pipelineMessage} />
            
            <AnimatePresence>
              {projectPlan && isInsightsOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-6 rounded-[2rem] bg-white/[0.02] border border-white/5 shadow-2xl space-y-4"
                >
                  <div className="flex items-center justify-between border-b border-white/5 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center">
                        <Layout className="w-4 h-4 text-blue-400" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white uppercase tracking-widest">{projectPlan.title}</h4>
                        <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-tighter">{projectPlan.type}</p>
                      </div>
                    </div>
                    <button onClick={() => setIsInsightsOpen(false)} className="text-zinc-600 hover:text-white transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">Core Architecture</span>
                      <div className="flex flex-wrap gap-2">
                        {projectPlan.architecture?.sections?.map((s: string) => (
                          <span key={s} className="px-2.5 py-1 rounded-full bg-white/5 border border-white/5 text-[9px] font-medium text-zinc-400">{s}</span>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-3">
                      <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">Design Strategy</span>
                      <div className="text-[10px] text-zinc-400 leading-relaxed font-medium">
                        {projectPlan.design?.aesthetic} style with {projectPlan.design?.colorSystem} palette.
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {currentChat ? (
          <div className="max-w-3xl mx-auto">
            <MessageList messages={currentChat.messages} isLoading={isLoading} />
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-8 max-w-2xl mx-auto pb-20">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-20 h-20 rounded-[2rem] bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center shadow-2xl shadow-blue-500/20"
            >
              <Zap className="w-10 h-10 text-white fill-current" />
            </motion.div>
            <div className="space-y-4">
              <h1 className="text-5xl font-bold text-white font-outfit tracking-tighter leading-none">
                Build something <br />
                <span className="text-blue-500">incredible.</span>
              </h1>
              <p className="text-zinc-500 text-lg font-medium max-w-sm mx-auto">
                Generate high-end SaaS platforms, agency websites, and portfolios in seconds.
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 w-full pt-4">
              {[
                "Luxury real estate landing page",
                "AI agency website with glassmorphism",
                "Modern SaaS dashboard with dark mode",
                "Portfolio for a creative director"
              ].map((q) => (
                <button
                  key={q}
                  onClick={() => setInput(q)}
                  className="p-4 text-left rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] hover:border-white/10 transition-all group"
                >
                  <p className="text-xs font-bold text-zinc-300 group-hover:text-white transition-colors">{q}</p>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-6">
        <div className="max-w-3xl mx-auto relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-[2rem] blur opacity-0 group-focus-within:opacity-100 transition-opacity" />
          <div className="relative bg-[#09090b] border border-white/10 rounded-[2rem] overflow-hidden focus-within:border-white/20 transition-all shadow-2xl">
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
              placeholder="Describe your project... (e.g., 'Build a luxury SaaS landing page')"
              className="w-full bg-transparent border-none outline-none py-5 px-8 text-sm text-zinc-200 placeholder:text-zinc-600 resize-none max-h-60"
            />
            <div className="flex items-center justify-between px-6 pb-4 pt-2">
              <div className="flex items-center gap-3">
                <button className="p-2 hover:bg-white/5 rounded-xl text-zinc-600 hover:text-zinc-400 transition-all">
                  <Paperclip className="w-4 h-4" />
                </button>
                <div className="h-4 w-[1px] bg-white/5" />
                <span className="text-[10px] font-bold text-zinc-700 uppercase tracking-widest">Cmd + Enter to Send</span>
              </div>
              
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="w-10 h-10 rounded-xl bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all shadow-lg"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
