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
  StopCircle,
  Terminal
} from "lucide-react";
import MessageList from "./MessageList";
import ModelSelector from "./ModelSelector";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function ChatInterface() {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [pipelineStage, setPipelineStage] = useState<string | null>(null);
  const [pipelineData, setPipelineData] = useState<any>(null);
  const [attachments, setAttachments] = useState<any[]>([]);
  const { chats, currentChatId, addMessage, updateLastMessage, model, activeAgentId } = useAppStore();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

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
      const response = await fetch('http://localhost:5000/api/pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader');

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
                // Logic to update the last message with code stream
                // This would be more complex in a real app to handle multi-file
                updateLastMessage(chatId, (prev) => prev + content);
              }
            } catch (e) {}
          }
        }
      }
    } catch (error) {
      console.error('Pipeline Error:', error);
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
      attachments: attachments,
      timestamp: Date.now()
    };

    const prompt = input;
    addMessage(currentChatId, userMessage);
    setInput("");
    setAttachments([]);

    const isPipelineRequest = prompt.toLowerCase().includes('build') || prompt.toLowerCase().includes('generate');
    if (isPipelineRequest) {
      handlePipelineRequest(prompt, currentChatId);
      return;
    }

    setIsLoading(true);

    // Add empty assistant message for streaming
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

      const response = await fetch('http://localhost:5000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [systemMessage, ...(currentChat?.messages || []), userMessage],
          model: model,
          options: { temperature: 0.7 }
        }),
        signal: abortControllerRef.current.signal
      });

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader');

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
              console.error('Error parsing chunk', e);
            }
          }
        }
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Stream aborted');
      } else {
        console.error('Chat error:', error);
        updateLastMessage(currentChatId, "Sorry, there was an error processing your request.");
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

  return (
    <div className="flex flex-col h-full bg-background relative">
      {/* Chat Header (Agent + Model Selector) */}
      <div className="flex items-center justify-between px-8 py-3 border-b border-white/5 bg-sidebar/50 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <ModelSelector />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-zinc-500 font-medium bg-white/5 px-2 py-1 rounded-md border border-white/5 uppercase">
            Bestlink v2.0
          </span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 custom-scrollbar">
        {currentChatId ? (
          <MessageList messages={currentChat?.messages || []} />
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-6 max-w-2xl mx-auto px-4">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-20 h-20 rounded-3xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20"
            >
              <Sparkles className="w-10 h-10 text-blue-400" />
            </motion.div>
            <div className="space-y-2">
              <h1 className="text-3xl font-bold font-outfit gradient-text">
                How can Bestlink Digital AI help you today?
              </h1>
              <p className="text-zinc-500 text-sm">
                Create premium websites, SaaS platforms, or debug your code with our elite AI engine.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
              {[
                { icon: Code, title: "Build a React App", desc: "Create a modern dashboard with Tailwind" },
                { icon: Sparkles, title: "Design a Landing Page", desc: "Minimalist SaaS aesthetic with animations" },
                { icon: Terminal, title: "Debug Python API", desc: "Fix errors and optimize performance" },
                { icon: ImageIcon, title: "UI from Screenshot", desc: "Convert images to production-ready code" }
              ].map((item, i) => (
                <button
                  key={i}
                  className="p-4 rounded-xl border border-border bg-white/5 hover:bg-white/10 transition-all text-left group"
                >
                  <item.icon className="w-5 h-5 text-zinc-400 group-hover:text-blue-400 mb-2 transition-colors" />
                  <div className="text-sm font-medium text-zinc-300">{item.title}</div>
                  <div className="text-xs text-zinc-500">{item.desc}</div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 md:p-8 pt-0">
        <div className={cn(
          "max-w-4xl mx-auto relative glass border rounded-2xl transition-all duration-300",
          isLoading ? "ring-1 ring-blue-500/50" : "focus-within:ring-1 focus-within:ring-white/20"
        )}>
          {attachments.length > 0 && (
            <div className="flex gap-2 p-3 border-b border-white/5 overflow-x-auto">
              {attachments.map((file, i) => (
                <div key={i} className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-zinc-400 flex items-center gap-2">
                  <Paperclip className="w-3 h-3" />
                  {file.name}
                </div>
              ))}
            </div>
          )}
          
          <div className="flex items-end p-2 gap-2">
            <button className="p-2.5 hover:bg-white/5 rounded-xl transition-colors text-zinc-500 hover:text-zinc-300">
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
              <button
                onClick={handleSend}
                disabled={!input.trim() && attachments.length === 0}
                className="p-2.5 bg-white text-black rounded-xl transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 disabled:hover:scale-100"
              >
                <Send className="w-5 h-5" />
              </button>
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
