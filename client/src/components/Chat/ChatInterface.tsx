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
import ExecutionProgress, { PipelineStage } from "./ExecutionProgress";
import { ChevronDown, ChevronUp, Activity, Box, Database } from "lucide-react";

export default function ChatInterface() {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [pipelineStage, setPipelineStage] = useState<PipelineStage | null>(null);
  const [pipelineData, setPipelineData] = useState<any>(null);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isInsightsOpen, setIsInsightsOpen] = useState(true);
  
  const { 
    workspaces, 
    activeWorkspaceId, 
    addChat, 
    addMessage, 
    updateLastMessage, 
    activeAgentId,
    updateWorkspace
  } = useAppStore();

  const activeWorkspace = workspaces.find(w => w.id === activeWorkspaceId);
  const chats = activeWorkspace?.chats || [];
  const currentChatId = activeWorkspace?.currentChatId || null;

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || '';


  const currentChat = chats.find(c => c.id === currentChatId);
  const activeAgent = AGENTS.find(a => a.id === activeAgentId) || AGENTS[1];

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "inherit";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  const [pipelineMessage, setPipelineMessage] = useState<string>("");
  const [projectPlan, setProjectPlan] = useState<any>(null);

  const handlePipeline = async (prompt: string, chatId: string) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort(); // Cancel any existing pipeline
    }
    abortControllerRef.current = new AbortController();

    setIsLoading(true);
    setPipelineStage('BUILD_START');
    
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
      let accumulatedCode = "";
      let buffer = "";
      
      const resetWatchdog = () => {
        if (watchdog) clearTimeout(watchdog);
        watchdog = setTimeout(() => {
          abortControllerRef.current?.abort();
          setPipelineStage('EXECUTION_ERROR');
          setPipelineMessage('Pipeline connection lost. Recovering AI engine...');
          toast.error("AI Pipeline timed out. Your state has been preserved.");
        }, 30000);
      };
      
      resetWatchdog();

      while (true) {
        const { done, value } = await reader.read();
        resetWatchdog();
        
        if (done) {
          clearTimeout(watchdog);
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\\n');
        
        // Keep the last (potentially incomplete) line in the buffer
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const rawData = line.slice(6);
            if (rawData === '[DONE]') {
              clearTimeout(watchdog);
              continue;
            }

            try {
              const { stage, data } = JSON.parse(rawData);
              
              if (stage === 'EXECUTION_ERROR') {
                throw new Error(data.message || 'AI Engine Failure');
              }

              setPipelineStage(stage as PipelineStage);
              if (data?.message) setPipelineMessage(data.message);
              
              if (stage === 'SELECTING_TEMPLATE' && data.plan) {
                setProjectPlan(data.plan);
              }

              if (stage === 'BUILD_PROGRESS') {
                if (data?.message) {
                  updateLastMessage(chatId, (prev) => prev + " " + data.message);
                }
              }

              if (stage === 'COMPLETED_PROJECT' && data.payload?.files) {
                const newFiles = data.payload.files.map((file: any) => ({
                  id: Math.random().toString(36).substring(7),
                  name: file.path.replace('src/', ''),
                  language: file.path.endsWith('.css') ? 'css' : 
                            file.path.endsWith('.html') ? 'html' : 'typescript',
                  content: file.content
                }));
                
                if (activeWorkspaceId) {
                  useAppStore.getState().setSandboxFiles(newFiles);
                  toast.success("Virtual File System committed successfully.");
                }
              }

              if (stage === 'COMPLETED') {
                toast.success("Project generation complete!");
                setPipelineStage(null);
              }
            } catch (e) {
              // Ignore incomplete chunk parse errors
            }
          }
        }
      }
    } catch (error: any) {
      if (typeof watchdog !== 'undefined') clearTimeout(watchdog);
      console.error('Pipeline Error:', error);
      toast.error(error.message || "Pipeline execution failed");
      setPipelineStage('EXECUTION_ERROR');
    } finally {
      if (typeof watchdog !== 'undefined') clearTimeout(watchdog);
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
        model: "best-available",
        createdAt: Date.now()
      });
    }

    const userMessage = {
      id: Math.random().toString(36).substring(7),
      role: 'user' as const,
      content: input,
      attachments,
      timestamp: Date.now()
    };

    addMessage(chatId, userMessage);
    setInput("");
    setAttachments([]);
    
    // Strict Project Mode Enforcement
    const projectKeywords = [
      /build\\s+(a\\s+|an\\s+)?(app|website|dashboard|platform|page|ui|site|landing)/i,
      /create\\s+(a\\s+|an\\s+)?(app|website|dashboard|platform|page|ui|site|landing)/i,
      /generate\\s+(a\\s+|an\\s+)?(app|website|dashboard|platform|page|ui|site|landing)/i,
      /make\\s+(a\\s+|an\\s+)?(app|website|dashboard|platform|page|ui|site|landing)/i,
      /^build /i,
      /^create /i
    ];
    const isGeneration = projectKeywords.some(regex => regex.test(userMessage.content));
    
    if (isGeneration) {
      // Add empty assistant message for pipeline feedback
      const assistantMessageId = Math.random().toString(36).substring(7);
      addMessage(chatId, {
        id: assistantMessageId,
        role: 'assistant' as const,
        content: "",
        timestamp: Date.now()
      });
      await handlePipeline(userMessage.content, chatId);
      return;
    }

    const assistantMessageId = Math.random().toString(36).substring(7);
    addMessage(chatId, {
      id: assistantMessageId,
      role: 'assistant' as const,
      content: "",
      timestamp: Date.now()
    });

    const fetchWithRetry = async (url: string, options: any, retries = 2) => {
      try {
        const res = await fetch(url, options);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res;
      } catch (err) {
        if (retries > 0) {
          await new Promise(r => setTimeout(r, 1000));
          return fetchWithRetry(url, options, retries - 1);
        }
        throw err;
      }
    };

    try {
      abortControllerRef.current = new AbortController();
      
      const systemMessage = {
        role: 'system',
        content: activeAgent.systemPrompt
      };

      const chatHistory = currentChat?.messages || [];
      const limitedHistory = chatHistory.slice(-20);

      const response = await fetchWithRetry(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [systemMessage, ...limitedHistory, userMessage],
          model: "openrouter/free", // Or derive from currentChat
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
              updateLastMessage(chatId, accumulatedContent);
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
        toast.error(error.message || "Connection lost. Ensure the backend is running.");
        updateLastMessage(chatId, "Error: Unable to connect to the Bestlink AI engine. Please verify the backend is active at " + API_URL);
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
      <header className="premium-header flex items-center justify-between px-6">
        <div className="flex items-center gap-6">
          <ModelSelector />
          <div className="h-4 w-[1px] bg-white/10 hidden md:block" />
          <div className="hidden md:flex items-center gap-4">
            <div className="flex flex-col">
              <h2 className="text-[10px] font-bold text-white uppercase tracking-widest font-outfit">Bestlink Studio</h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className="w-1 h-3 bg-green-500/40 rounded-full" />
                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">
                  Mode: <span className="text-zinc-200">Prod</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => toast.success("Deployment pipeline initialized...")}
            className="btn-primary flex items-center gap-2"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">DEPLOY</span>
          </button>
        </div>
      </header>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 custom-scrollbar">
        {/* Real-time Progress & Insights */}
        <AnimatePresence>
          {isLoading && (
            <div className="max-w-4xl mx-auto pt-6 space-y-4">
              <ExecutionProgress currentStage={pipelineStage} statusMessage={pipelineMessage} />
              
              {projectPlan && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="glass-panel rounded-2xl overflow-hidden border border-white/5"
                >
                  <button 
                    onClick={() => setIsInsightsOpen(!isInsightsOpen)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Activity className="w-3.5 h-3.5 text-blue-400" />
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">AI Strategic Plan</span>
                    </div>
                    {isInsightsOpen ? <ChevronUp className="w-3.5 h-3.5 text-zinc-600" /> : <ChevronDown className="w-3.5 h-3.5 text-zinc-600" />}
                  </button>
                  
                  {isInsightsOpen && (
                    <div className="px-4 pb-4 grid grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Box className="w-3 h-3 text-zinc-500" />
                          <span className="text-[10px] font-bold text-zinc-200 uppercase tracking-wider">{projectPlan.template} Template</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {projectPlan.architecture.sections.map((s: string) => (
                            <span key={s} className="px-2 py-0.5 bg-white/5 rounded-full text-[9px] text-zinc-500 border border-white/5 uppercase tracking-tighter">{s}</span>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Database className="w-3 h-3 text-zinc-500" />
                          <span className="text-[10px] font-bold text-zinc-200 uppercase tracking-wider">Tech Strategy</span>
                        </div>
                        <div className="text-[10px] text-zinc-500 leading-tight">
                          {projectPlan.design.aesthetic} • {projectPlan.design.typography}
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          )}
        </AnimatePresence>

        {currentChatId ? (
          <MessageList messages={chats.find(c => c.id === currentChatId)?.messages || []} isLoading={isLoading} status={pipelineStage} />
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
                className="text-6xl font-bold font-outfit tracking-tighter text-white leading-tight"
              >
                What shall we build <br />
                <span className="gradient-text drop-shadow-[0_0_30px_rgba(59,130,246,0.3)]">today?</span>
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-zinc-400 text-lg max-w-xl mx-auto font-medium leading-relaxed"
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
                { icon: Box, title: "SaaS Platform", desc: "Build a premium SaaS landing page", color: "text-blue-400", query: "Create a SaaS landing page for a new AI product" },
                { icon: Sparkles, title: "Real Estate Studio", desc: "Luxury property showcase system", color: "text-purple-400", query: "Build a luxury real estate landing page" },
                { icon: LayoutGrid, title: "Creative Portfolio", desc: "Minimalist brand showcase", color: "text-green-400", query: "Make a creative portfolio for a senior designer" },
                { icon: Activity, title: "Enterprise Dashboard", desc: "Complex data-heavy interface", color: "text-yellow-400", query: "Build an enterprise dashboard for analytics" }
              ].map((item, i) => (
                <button
                  key={i}
                  onClick={() => setInput(item.query)}
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
