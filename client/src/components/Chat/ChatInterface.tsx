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
    setSandboxOpen,
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

  const handlePipeline = async (prompt: string, chatId: string, attachments: any[] = []) => {
    setIsLoading(true);
    setPipelineStage('BUILD_START');
    setPipelineMessage("Initializing production engine...");
    setErrorDetails(null);
    useAppStore.getState().setEngineStatus('WAITING');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout

    try {
      setPipelineMessage("Synthesizing design DNA...");
      
      const response = await fetch('https://bestlink-digital-ai-backend.onrender.com/api/pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, attachments, stream: false }), // Request full JSON
        signal: controller.signal
      });

      if (!response.ok) throw new Error(`Engine responded with ${response.status}`);

      // Handle both streaming and direct JSON for robustness
      const contentType = response.headers.get('content-type');
      let data;

      if (contentType?.includes('text/event-stream')) {
        // Simple stream reader that just looks for COMPLETED_PROJECT
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader!.read();
          if (done) break;
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const json = JSON.parse(line.substring(6));
                if (json.stage === 'COMPLETED_PROJECT') data = json.data;
                if (json.stage === 'EXECUTION_ERROR') throw new Error(json.data?.message || "Build failed.");
                if (json.data?.message) setPipelineMessage(json.data.message);
              } catch (e) {}
            }
          }
        }
      } else {
        data = await response.json();
      }

      if (data?.payload?.files) {
        const newFiles = data.payload.files.map((file: any) => ({
          id: Math.random().toString(36).substring(7),
          name: file.path,
          language: file.path.split('.').pop() || 'html',
          content: file.content
        }));
        
        setSandboxFiles(newFiles);
        setSandboxOpen(true);
        
        addMessage(chatId, {
          id: Math.random().toString(36).substring(7),
          role: 'assistant',
          content: `### 🚀 Production Successful\n\nGenerated **${newFiles.length} files** for your project. The live preview has been synchronized.`,
          timestamp: Date.now()
        });
        
        toast.success("Production ready.");
      } else {
        throw new Error("No files were generated.");
      }

    } catch (error: any) {
      console.error('[Pipeline] Error:', error);
      const message = error.name === 'AbortError' ? "Request timed out." : (error.message || "Engine failure.");
      setErrorDetails(message);
      toast.error(message);
      useAppStore.getState().setEngineStatus('FAILED');
    } finally {
      clearTimeout(timeoutId);
      setIsLoading(false);
      setPipelineStage(null);
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
            <div className="py-24 flex flex-col items-center justify-center text-center space-y-20 max-w-4xl mx-auto">
              {/* ⚡ CENTER LOGO ENGINE */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                className="relative group"
              >
                <div className="absolute inset-0 bg-blue-500/20 blur-[100px] rounded-full group-hover:bg-blue-500/30 transition-all duration-700" />
                <div className="w-32 h-32 rounded-[2.5rem] bg-gradient-to-br from-white to-white/60 flex items-center justify-center shadow-[0_0_50px_rgba(255,255,255,0.1)] relative z-10 animate-float">
                  <Zap className="w-14 h-14 text-black fill-current" />
                </div>
              </motion.div>
              
              <div className="space-y-6">
                <h1 className="text-8xl font-black tracking-tighter leading-none italic uppercase gradient-text glow-text">
                  Bestlink.OS
                </h1>
                <div className="flex items-center justify-center gap-4">
                  <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-white/20" />
                  <p className="text-white/40 text-[11px] font-black uppercase tracking-[0.6em]">
                    Elite Production Engine v2.4
                  </p>
                  <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-white/20" />
                </div>
              </div>
              
              <div className="bento-grid w-full">
                {[
                  { q: "LUXURY REAL ESTATE PORTFOLIO", icon: Box, desc: "Architectural property showcases." },
                  { q: "FINTECH DASHBOARD SYSTEM", icon: Cpu, desc: "High-velocity financial data viz." },
                  { q: "MODERN AI SAAS INTERFACE", icon: Layout, desc: "Next-gen software experiences." },
                  { q: "MINIMALIST AGENCY LANDING", icon: Activity, desc: "Premium conversion-led design." }
                ].map((item) => (
                  <button
                    key={item.q}
                    onClick={() => setInput(item.q)}
                    className="glass-card p-8 text-left rounded-[2rem] group flex flex-col gap-4 active:scale-[0.98]"
                  >
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                      <item.icon className="w-5 h-5 text-white/20 group-hover:text-white transition-colors" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-white group-hover:text-white transition-colors uppercase tracking-[0.2em]">{item.q}</p>
                      <p className="text-[10px] text-white/20 font-bold uppercase tracking-widest">{item.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 🛠️ FLOATING COMMAND CENTER */}
      <div className="absolute bottom-12 inset-x-0 px-6 z-50">
        <div className="max-w-3xl mx-auto">
          <div className="relative group">
            {/* GLOW EFFECT */}
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-[3rem] blur-2xl opacity-0 group-focus-within:opacity-100 transition-all duration-700" />
            
            <div className="relative bg-[#09090b]/80 backdrop-blur-3xl border border-white/10 rounded-[3rem] overflow-hidden focus-within:border-white/20 transition-all shadow-[0_30px_100px_rgba(0,0,0,0.8)]">
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
                placeholder="Describe your vision..."
                className="w-full bg-transparent border-none outline-none py-10 px-12 text-lg text-white placeholder:text-white/10 resize-none max-h-[200px] custom-scrollbar font-medium tracking-tight"
              />
              
              <div className="flex items-center justify-between px-10 pb-8">
                <div className="flex items-center gap-6">
                  <button 
                    onClick={() => setIsUploadOpen(!isUploadOpen)}
                    className={cn(
                      "p-3 rounded-2xl transition-all border",
                      isUploadOpen ? "bg-white text-black border-white" : "hover:bg-white/5 text-white/20 hover:text-white border-transparent hover:border-white/10"
                    )}
                  >
                    <Paperclip className="w-6 h-6" />
                  </button>
                  <div className="h-6 w-[1px] bg-white/5" />
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-2 h-2 rounded-full transition-all duration-500",
                      isLoading ? "bg-blue-500 animate-pulse" : "bg-white/10"
                    )} />
                    <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">system online</span>
                  </div>
                </div>
                
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className={cn(
                    "w-16 h-16 rounded-[2rem] flex items-center justify-center transition-all shadow-2xl active:scale-95",
                    !input.trim() || isLoading 
                      ? "bg-white/5 text-white/10" 
                      : "bg-white text-black hover:scale-105 hover:shadow-[0_0_30px_rgba(255,255,255,0.2)]"
                  )}
                >
                  {isLoading ? <Loader2 className="w-8 h-8 animate-spin" /> : <Send className="w-8 h-8" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
