"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useAppStore } from "@/store/useAppStore";
import { 
  Send, 
  Paperclip, 
  Zap, 
  Loader2, 
  Terminal, 
  X, 
  Activity, 
  Box, 
  Layout,
  ArrowRight,
  Shield,
  Cpu,
  RefreshCcw,
  StopCircle,
  AlertTriangle
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
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  
  const { 
    workspaces, 
    activeWorkspaceId, 
    addChat, 
    addMessage, 
    setSandboxFiles
  } = useAppStore();

  const activeWorkspace = workspaces.find(w => w.id === activeWorkspaceId);
  const chats = activeWorkspace?.chats || [];
  const currentChatId = activeWorkspace?.currentChatId || null;
  const currentChat = chats.find(c => c.id === currentChatId);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Use environment variable, or auto-detect localhost vs production
  const API_ENDPOINT = process.env.NEXT_PUBLIC_API_URL 
    ? `${process.env.NEXT_PUBLIC_API_URL}/api/pipeline` 
    : (typeof window !== 'undefined' && window.location.hostname === 'localhost' 
        ? 'http://localhost:5000/api/pipeline' 
        : '/api/pipeline');

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleStop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsLoading(false);
      setPipelineStage(null);
      setErrorDetails(null);
      toast.info("Generation halted by user.");
    }
  }, []);

  const handlePipeline = async (prompt: string, chatId: string) => {
    handleStop();
    abortControllerRef.current = new AbortController();
    setErrorDetails(null);

    setIsLoading(true);
    setPipelineStage('BUILD_START');
    setPipelineMessage("Initializing production matrix...");
    
    console.log(`[Pipeline] Starting production for: "${prompt}"`);

    const watchdog = setTimeout(() => {
      if (isLoading) {
        handleStop();
        setErrorDetails("The generation engine timed out (180s). This usually happens when the AI is processing a massive project. Please try again with a more specific prompt.");
        toast.error("Pipeline timeout.");
      }
    }, 180000);

    try {
      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Engine Error (${response.status}): ${errorText.slice(0, 100)}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('Failed to open stream reader');

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          console.log("[Pipeline] Stream closed normally.");
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.trim() || !line.startsWith('data: ')) continue;
          
          try {
            const rawData = line.slice(6);
            if (rawData === '[DONE]') break;
            
            const { stage, data } = JSON.parse(rawData);
            console.log(`[Pipeline] Stage: ${stage}`, data?.message || "");

            if (stage === 'EXECUTION_ERROR') {
              setErrorDetails(data.message);
              throw new Error(data.message);
            }

            setPipelineStage(stage as PipelineStage);
            if (data?.message) setPipelineMessage(data.message);
            
            if (stage === 'SELECTING_TEMPLATE' && data.plan) {
              setProjectPlan(data.plan);
            }

            if (stage === 'COMPLETED_PROJECT' && data.payload?.files) {
              const newFiles = data.payload.files.map((file: any) => ({
                id: Math.random().toString(36).substring(7),
                name: file.path,
                language: file.path.split('.').pop() || 'typescript',
                content: file.content
              }));
              
              setSandboxFiles(newFiles);
              toast.success("Production codebase synchronized.");
            }

            if (stage === 'COMPLETED') {
              setIsLoading(false);
              setPipelineStage(null);
            }
          } catch (e) {
            // Ignore partial JSON chunks
          }
        }
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('[Pipeline] Critical Error:', error);
        setErrorDetails(error.message || "An unexpected engine failure occurred. Please check your network connection.");
        toast.error("Engine failure.");
        setPipelineStage('EXECUTION_ERROR');
      }
    } finally {
      clearTimeout(watchdog);
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
        model: "bestlink-os-v2",
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
    
    // Trigger pipeline for generation keywords
    const isGeneration = /build|create|generate|make|startup|landing|page|app|website|design/i.test(userMessage.content);
    
    if (isGeneration) {
      addMessage(chatId, {
        id: Math.random().toString(36).substring(7),
        role: 'assistant' as const,
        content: `Acknowledged. Initializing strategic production for: "${userMessage.content}"`,
        timestamp: Date.now()
      });
      await handlePipeline(userMessage.content, chatId);
    } else {
      // Basic fallback response for simple chat
      const botMessage = {
        id: Math.random().toString(36).substring(7),
        role: 'assistant' as const,
        content: "I'm currently optimized for website and web app production. To start a project, try saying something like 'Build a luxury real estate landing page'.",
        timestamp: Date.now()
      };
      addMessage(chatId, botMessage);
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#050505] relative overflow-hidden">
      {/* GLASS TOPBAR */}
      <header className="h-14 border-b border-white/5 flex items-center justify-between px-6 bg-[#09090b]/50 shrink-0">
        <div className="flex items-center gap-4">
          <ModelSelector />
          <div className="h-4 w-[1px] bg-white/10" />
          <div className="flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-blue-500" />
            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Production Studio</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
           {isLoading && (
             <button onClick={handleStop} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-[9px] font-bold text-red-500 hover:bg-red-500/20 transition-all uppercase tracking-widest">
                <StopCircle className="w-3 h-3" /> Halt
             </button>
           )}
        </div>
      </header>

      {/* INDEPENDENT SCROLL AREA */}
      <div className="flex-1 overflow-y-auto px-6 py-8 custom-scrollbar relative">
        <div className="max-w-3xl mx-auto space-y-10 pb-32">
          
          <AnimatePresence>
            {(isLoading || pipelineStage === 'EXECUTION_ERROR') && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <ExecutionProgress currentStage={pipelineStage} statusMessage={pipelineMessage} />
                
                {errorDetails && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-6 rounded-[1.5rem] bg-red-500/5 border border-red-500/20 flex items-start gap-4"
                  >
                    <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
                      <AlertTriangle className="w-5 h-5 text-red-500" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-red-500 uppercase tracking-widest">System Incident</h4>
                      <p className="text-[11px] text-zinc-400 font-medium leading-relaxed">{errorDetails}</p>
                      <button 
                        onClick={() => handlePipeline(currentChat?.messages[currentChat.messages.length - 2]?.content || "", currentChatId!)}
                        className="mt-3 flex items-center gap-2 text-[10px] font-bold text-white bg-red-500/20 px-3 py-1.5 rounded-lg hover:bg-red-500/30 transition-all uppercase tracking-widest"
                      >
                        <RefreshCcw className="w-3 h-3" /> Retry Generation
                      </button>
                    </div>
                  </motion.div>
                )}

                {projectPlan && isInsightsOpen && !errorDetails && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-8 rounded-[2.5rem] bg-white/[0.02] border border-white/5 shadow-2xl relative overflow-hidden group"
                  >
                    <div className="absolute inset-0 bg-blue-500/5 blur-[80px] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    <div className="relative flex items-center justify-between border-b border-white/5 pb-6 mb-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-blue-600/10 flex items-center justify-center border border-blue-500/20 shadow-xl">
                          <Cpu className="w-6 h-6 text-blue-400" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white uppercase tracking-widest font-outfit">{projectPlan.title}</h4>
                          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-tighter mt-1">{projectPlan.type} Strategy</p>
                        </div>
                      </div>
                      <button onClick={() => setIsInsightsOpen(false)} className="p-2 hover:bg-white/10 rounded-xl transition-all">
                        <X className="w-4 h-4 text-zinc-600 hover:text-white" />
                      </button>
                    </div>
                    
                    <div className="relative grid grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Architecture Modules</span>
                        <div className="flex flex-wrap gap-2">
                          {projectPlan.architecture?.sections?.map((s: string) => (
                            <span key={s} className="px-3 py-1 rounded-full bg-white/5 border border-white/5 text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">{s}</span>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-4">
                        <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Technical Stack</span>
                        <div className="text-[11px] text-zinc-400 leading-relaxed font-medium">
                          {projectPlan.design?.aesthetic} design system utilizing {projectPlan.design?.colorSystem} colors and {projectPlan.design?.typography} typography.
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {currentChat && currentChat.messages.length > 0 ? (
            <MessageList messages={currentChat.messages} isLoading={isLoading} />
          ) : (
            <div className="py-20 flex flex-col items-center justify-center text-center space-y-12">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-24 h-24 rounded-[2.5rem] bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center shadow-2xl shadow-blue-500/30 relative group"
              >
                <div className="absolute inset-0 bg-blue-400 blur-2xl opacity-20 group-hover:opacity-40 transition-opacity" />
                <Zap className="w-12 h-12 text-white fill-current relative z-10" />
              </motion.div>
              
              <div className="space-y-4 max-w-lg mx-auto">
                <h1 className="text-5xl font-bold text-white font-outfit tracking-tighter leading-none text-balance">
                  Elite AI Production <span className="text-blue-500">v2.0</span>
                </h1>
                <p className="text-zinc-500 text-lg font-medium leading-relaxed">
                  Generate award-winning websites and web apps with a single production prompt.
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 w-full">
                {[
                  { q: "Luxury real estate landing page", icon: Box },
                  { q: "AI agency website with glassmorphism", icon: Layout },
                  { q: "Modern SaaS dashboard", icon: Cpu },
                  { q: "Creative portfolio for designer", icon: Activity }
                ].map((item) => (
                  <button
                    key={item.q}
                    onClick={() => setInput(item.q)}
                    className="p-5 text-left rounded-[1.5rem] bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] hover:border-white/10 transition-all group flex items-start gap-4"
                  >
                    <item.icon className="w-5 h-5 text-zinc-600 group-hover:text-blue-400 transition-colors mt-0.5" />
                    <p className="text-xs font-bold text-zinc-400 group-hover:text-white transition-colors">{item.q}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* STICKY INPUT BAR */}
      <div className="p-6 bg-gradient-to-t from-[#050505] via-[#050505] to-transparent shrink-0">
        <div className="max-w-3xl mx-auto relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-[2.5rem] blur opacity-0 group-focus-within:opacity-100 transition-opacity" />
          <div className="relative bg-[#09090b] border border-white/10 rounded-[2.5rem] overflow-hidden focus-within:border-white/20 transition-all shadow-2xl">
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
              placeholder="Describe your production request... (e.g., 'Modern SaaS landing page')"
              className="w-full bg-transparent border-none outline-none py-6 px-10 text-sm text-zinc-200 placeholder:text-zinc-600 resize-none max-h-[200px] custom-scrollbar"
            />
            
            <div className="flex items-center justify-between px-8 pb-5">
              <div className="flex items-center gap-4">
                <button className="p-2.5 hover:bg-white/5 rounded-2xl text-zinc-600 hover:text-zinc-400 transition-all border border-transparent hover:border-white/5">
                  <Paperclip className="w-5 h-5" />
                </button>
                <div className="h-4 w-[1px] bg-white/5" />
                <span className="text-[10px] font-bold text-zinc-700 uppercase tracking-widest">Production Studio v2.0 Stable</span>
              </div>
              
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-xl active:scale-95",
                  !input.trim() || isLoading 
                    ? "bg-zinc-900 text-zinc-700" 
                    : "bg-white text-black hover:scale-105"
                )}
              >
                {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
