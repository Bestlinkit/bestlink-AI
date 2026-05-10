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
    setSandboxFiles,
    isHydrated 
  } = useAppStore();

  const activeWorkspace = workspaces.find(w => w.id === activeWorkspaceId);
  const chats = activeWorkspace?.chats || [];
  const currentChatId = activeWorkspace?.currentChatId || null;
  const currentChat = chats.find(c => c.id === currentChatId);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Use environment variable, or default to the production Render backend
  const API_ENDPOINT = process.env.NEXT_PUBLIC_API_URL 
    ? `${process.env.NEXT_PUBLIC_API_URL}/api/pipeline` 
    : 'https://bestlink-digital-ai-backend.onrender.com/api/pipeline';

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

  const [attachments, setAttachments] = useState<any[]>([]);

  const handlePipeline = async (prompt: string, chatId: string, currentAttachments: any[] = []) => {
    handleStop();
    abortControllerRef.current = new AbortController();
    setErrorDetails(null);

    setIsLoading(true);
    useAppStore.getState().setEngineStatus('WAITING');
    setPipelineStage('BUILD_START');
    setPipelineMessage("Initializing production matrix...");
    
    console.log(`[Pipeline] Starting production for: "${prompt}"`);

    const watchdog = setTimeout(() => {
      if (isLoading) {
        handleStop();
        setErrorDetails("Backend connection lost. The production engine timed out (30s). This ensures UI responsiveness during network instability.");
        useAppStore.getState().setEngineStatus('FAILED');
        toast.error("Pipeline connectivity lost.");
      }
    }, 30000);

    try {
      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt,
          attachments: currentAttachments
        }),
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
            
            if (stage === 'COMPLETED_PROJECT' && data.payload?.files) {
              const newFiles = data.payload.files.map((file: any) => ({
                id: Math.random().toString(36).substring(7),
                name: file.path,
                language: file.path.split('.').pop() || 'typescript',
                content: file.content
              }));
              
              setSandboxFiles(newFiles);
              
              // PERSISTENT HISTORY: Add assistant summary
              addMessage(chatId, {
                id: Math.random().toString(36).substring(7),
                role: 'assistant',
                content: `### 🚀 Production Successful\n\nGenerated **${newFiles.length} files** for your project. The live preview has been synchronized with the latest codebase.\n\n**Framework:** ${data.payload.framework || 'React'}\n**Type:** ${data.payload.projectType || 'Web App'}`,
                timestamp: Date.now()
              });
              
              toast.success("Production codebase synchronized.");
            }

            if (stage === 'COMPLETED') {
              setIsLoading(false);
              setPipelineStage(null);
              useAppStore.getState().setEngineStatus('READY');
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
        useAppStore.getState().setEngineStatus('FAILED');
      }
    } finally {
      clearTimeout(watchdog);
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading || !isHydrated) return;

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
    const currentAttachments = [...attachments];
    setAttachments([]);
    
    // Trigger pipeline for ALL messages - AI FREEDOM
    await handlePipeline(userMessage.content, chatId, currentAttachments);
  };

  const [isUploadOpen, setIsUploadOpen] = useState(false);

  return (
    <div className="flex-1 flex flex-col bg-[#050505] relative overflow-hidden selection:bg-blue-500/30">
      {/* 🏁 MINIMAL STATUS BAR */}
      <div className="h-14 flex items-center justify-between px-8 border-b border-white/5 bg-[#050505]/80 backdrop-blur-md shrink-0 z-40">
        <div className="flex items-center gap-6">
          <ModelSelector />
          <div className="h-4 w-[1px] bg-white/5" />
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-2 h-2 rounded-full shadow-[0_0_8px_rgba(37,99,235,0.4)] transition-all duration-500",
              isLoading ? "bg-blue-500 animate-pulse" : (attachments.length > 0 ? "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]" : "bg-emerald-500")
            )} />
            <span className={cn(
                "text-[9px] font-black uppercase tracking-[0.3em] transition-colors",
                attachments.length > 0 ? "text-amber-500" : "text-white/30"
            )}>
              {isLoading ? "Production Engine: Active" : (attachments.length > 0 ? "Visual Synthesis Engine: Primed" : "Creation Engine: Ready")}
            </span>
          </div>
        </div>
        
        {isLoading && (
          <button 
            onClick={handleStop}
            className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-red-500/10 border border-red-500/20 text-[9px] font-black text-red-500 hover:bg-red-500/20 transition-all uppercase tracking-[0.2em]"
          >
            <StopCircle className="w-3.5 h-3.5" /> Stop Build
          </button>
        )}
      </div>

      {/* CHAT CONTENT */}
      <div className="flex-1 overflow-y-auto px-6 py-4 custom-scrollbar relative">
        <div className="max-w-3xl mx-auto space-y-12 pb-32">
          
          <AnimatePresence>
            {isUploadOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="mb-8"
              >
                <ImageUpload 
                  attachments={attachments}
                  onUpload={(files) => setAttachments([...attachments, ...files])}
                  onRemove={(index) => setAttachments(attachments.filter((_, i) => i !== index))}
                />
              </motion.div>
            )}

            {isLoading && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-4 p-6 rounded-[2rem] bg-white/[0.02] border border-white/5"
              >
                <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center shrink-0">
                  <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">Processing Production Prompt</p>
                  <p className="text-[11px] text-zinc-500 font-medium italic">{pipelineMessage || "Building your vision..."}</p>
                </div>
              </motion.div>
            )}

            {errorDetails && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-6 rounded-[2rem] bg-red-500/5 border border-red-500/20 flex items-start gap-4"
              >
                <div className="w-10 h-10 rounded-2xl bg-red-500/10 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-[10px] font-bold text-red-500 uppercase tracking-widest">Production Error</h4>
                  <p className="text-[11px] text-zinc-400 font-medium leading-relaxed">{errorDetails}</p>
                  <button 
                    onClick={() => handlePipeline(currentChat?.messages[currentChat.messages.length - 2]?.content || "", currentChatId!, [])}
                    className="mt-3 text-[10px] font-bold text-white bg-red-500/20 px-4 py-2 rounded-xl hover:bg-red-500/30 transition-all uppercase tracking-widest"
                  >
                    Retry Generation
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {currentChat && currentChat.messages.length > 0 ? (
            <MessageList messages={currentChat.messages} isLoading={isLoading} />
          ) : (
            <div className="py-24 flex flex-col items-center justify-center text-center space-y-16 animate-panel">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                className="w-24 h-24 rounded-[2.5rem] bg-white flex items-center justify-center shadow-[0_0_100px_rgba(255,255,255,0.1)] relative group"
              >
                <Zap className="w-10 h-10 text-black fill-current relative z-10" />
                <div className="absolute inset-0 bg-white blur-3xl opacity-10 group-hover:opacity-20 transition-opacity" />
              </motion.div>
              
              <div className="space-y-4 max-w-lg mx-auto">
                <h1 className="text-6xl font-black text-white tracking-tighter leading-none italic uppercase">
                  Bestlink.OS
                </h1>
                <p className="text-white/20 text-[10px] font-black uppercase tracking-[0.5em] ml-2">
                  Elite Production Engine v2.4
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 w-full max-w-2xl">
                {[
                  { q: "LUXURY REAL ESTATE PORTFOLIO", icon: Box },
                  { q: "FINTECH DASHBOARD ARCHITECTURE", icon: Cpu },
                  { q: "MODERN AI SAAS INTERFACE", icon: Layout },
                  { q: "MINIMALIST AGENCY LANDING", icon: Activity }
                ].map((item) => (
                  <button
                    key={item.q}
                    onClick={() => setInput(item.q)}
                    className="p-6 text-left rounded-3xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-white/10 transition-all group flex items-start gap-4 active:scale-[0.98]"
                  >
                    <item.icon className="w-4 h-4 text-white/10 group-hover:text-white transition-colors mt-0.5" />
                    <p className="text-[9px] font-black text-white/30 group-hover:text-white transition-colors uppercase tracking-[0.2em] leading-relaxed">{item.q}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* FLOATING COMMAND BAR (RAYCAST INSPIRED) */}
      <div className="absolute bottom-10 inset-x-0 px-6 z-50">
        <div className="max-w-3xl mx-auto">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/10 to-purple-600/10 rounded-[2.5rem] blur opacity-0 group-focus-within:opacity-100 transition-opacity" />
            <div className="relative bg-[#09090b]/80 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] overflow-hidden focus-within:border-white/20 transition-all shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
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
                placeholder="describe your vision..."
                className="w-full bg-transparent border-none outline-none py-7 px-10 text-sm text-zinc-100 placeholder:text-zinc-700 resize-none max-h-[200px] custom-scrollbar"
              />
              
              <div className="flex items-center justify-between px-8 pb-6">
                <div className="flex items-center gap-5">
                  <button 
                    onClick={() => setIsUploadOpen(!isUploadOpen)}
                    className={cn(
                      "p-2.5 rounded-2xl transition-all border",
                      isUploadOpen ? "bg-blue-500/20 border-blue-500/30 text-blue-400" : "hover:bg-white/5 text-zinc-600 hover:text-zinc-400 border-transparent hover:border-white/5"
                    )}
                  >
                    <Paperclip className="w-5 h-5" />
                  </button>
                  <div className="h-4 w-[1px] bg-white/5" />
                  <div className="flex items-center gap-2">
                    <div className={cn("w-1.5 h-1.5 rounded-full", isLoading ? "bg-blue-500 animate-pulse" : "bg-zinc-800")} />
                    <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-[0.2em]">production engine ready</span>
                  </div>
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
    </div>
  );
}
