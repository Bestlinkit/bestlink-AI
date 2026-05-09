"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Copy, Check, Terminal, Sparkles, User, Zap, Layout, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  attachments?: any[];
  timestamp: number;
}

export default function MessageList({ 
  messages, 
  isLoading 
}: { 
  messages: Message[], 
  isLoading?: boolean 
}) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="flex flex-col gap-10 py-10 pb-20">
      {messages.map((message, i) => (
        <MessageItem key={message.id} message={message} />
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
}

function MessageItem({ message }: { message: Message }) {
  const isAssistant = message.role === 'assistant';
  const isGeneration = /Initializing cinematic production|Project generation successful/i.test(message.content);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex gap-6 max-w-4xl mx-auto w-full group px-4",
        isAssistant ? "justify-start" : "justify-end"
      )}
    >
      {isAssistant && (
        <div className="w-10 h-10 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0 mt-1 shadow-lg shadow-blue-500/5">
          <Zap className="w-5 h-5 text-blue-400 fill-current" />
        </div>
      )}

      <div className={cn(
        "flex flex-col gap-3 min-w-0 flex-1",
        isAssistant ? "items-start" : "items-end"
      )}>
        {isGeneration ? (
          <div className="w-full p-6 rounded-[2rem] bg-white/[0.02] border border-white/5 shadow-2xl relative overflow-hidden group/card">
            <div className="absolute inset-0 bg-blue-500/5 blur-3xl opacity-0 group-hover/card:opacity-100 transition-opacity" />
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-600/20 flex items-center justify-center border border-blue-500/30">
                  <Layout className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white uppercase tracking-widest font-outfit">Production Sync</h4>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5">{message.content}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-blue-500">
                <span className="text-[9px] font-bold uppercase tracking-widest">Active</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </div>
        ) : (
          <div className={cn(
            "relative px-6 py-4 rounded-[1.5rem] text-[14px] font-medium leading-relaxed shadow-2xl transition-all",
            !isAssistant 
              ? "bg-white text-black max-w-[85%]" 
              : "bg-[#09090b] border border-white/5 text-zinc-300 w-full"
          )}>
            {message.content}
          </div>
        )}
      </div>

      {!isAssistant && (
        <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 mt-1 text-zinc-500">
          <User className="w-5 h-5" />
        </div>
      )}
    </motion.div>
  );
}
