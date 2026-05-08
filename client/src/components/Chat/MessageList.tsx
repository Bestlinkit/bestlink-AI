"use client";

import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check, Terminal, Sparkles, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  attachments?: any[];
  timestamp: number;
}

export default function MessageList({ messages, isLoading }: { messages: Message[], isLoading?: boolean }) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="flex flex-col gap-8 py-10 pb-20">
      {messages.map((message, i) => (
        <MessageItem key={message.id} message={message} isLast={i === messages.length - 1} />
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
}

function MessageItem({ message, isLast }: { message: Message, isLast: boolean }) {
  const isAssistant = message.role === 'assistant';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex gap-4 max-w-4xl mx-auto w-full group px-4",
        isAssistant ? "justify-start" : "justify-end"
      )}
    >
      {isAssistant && (
        <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0 mt-1">
          <Sparkles className="w-4 h-4 text-blue-400" />
        </div>
      )}

      <div className={cn(
        "flex flex-col gap-2 min-w-0 flex-1",
        isAssistant ? "items-start" : "items-end"
      )}>
        <div className={cn(
          "relative px-5 py-3.5 rounded-2xl text-[14px] leading-relaxed",
          !isAssistant 
            ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20 max-w-[85%]" 
            : "bg-white/5 border border-white/5 text-zinc-200 w-full glass"
        )}>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code({ node, inline, className, children, ...props }: any) {
                const match = /language-(\w+)/.exec(className || '');
                return !inline && match ? (
                  <div className="relative mt-4 mb-4 rounded-xl overflow-hidden border border-white/10 group/code bg-[#0d0d0d]">
                    <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/10">
                      <div className="flex items-center gap-2">
                        <Terminal className="w-3 h-3 text-zinc-500" />
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                          {match[1]}
                        </span>
                      </div>
                      <CopyButton content={String(children).replace(/\n$/, '')} />
                    </div>
                    <SyntaxHighlighter
                      {...props}
                      style={vscDarkPlus}
                      language={match[1]}
                      PreTag="div"
                      className="!bg-transparent !m-0 !p-6 !text-[13px] custom-scrollbar"
                    >
                      {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                  </div>
                ) : (
                  <code className={cn("bg-white/10 px-1.5 py-0.5 rounded text-blue-400 font-mono text-[13px]", className)} {...props}>
                    {children}
                  </code>
                );
              },
              p({ children }) {
                return <p className="mb-4 last:mb-0">{children}</p>;
              },
              ul({ children }) {
                return <ul className="list-disc ml-4 mb-4 space-y-1">{children}</ul>;
              },
              ol({ children }) {
                return <ol className="list-decimal ml-4 mb-4 space-y-1">{children}</ol>;
              },
              li({ children }) {
                return <li>{children}</li>;
              },
              h1({ children }) { return <h1 className="text-2xl font-bold mb-4 mt-6 first:mt-0">{children}</h1> },
              h2({ children }) { return <h2 className="text-xl font-bold mb-3 mt-5 first:mt-0">{children}</h2> },
              h3({ children }) { return <h3 className="text-lg font-bold mb-2 mt-4 first:mt-0">{children}</h3> },
              blockquote({ children }) {
                return <blockquote className="border-l-2 border-blue-500/50 pl-4 italic text-zinc-400 my-4">{children}</blockquote>
              },
              table({ children }) {
                return (
                  <div className="overflow-x-auto my-4 rounded-xl border border-white/10">
                    <table className="w-full text-left border-collapse">{children}</table>
                  </div>
                )
              },
              th({ children }) {
                return <th className="px-4 py-2 bg-white/5 border-b border-white/10 font-bold text-xs uppercase tracking-wider text-zinc-500">{children}</th>
              },
              td({ children }) {
                return <td className="px-4 py-2 border-b border-white/5 text-sm">{children}</td>
              }
            }}
          >
            {message.content}
          </ReactMarkdown>
          
          {isAssistant && message.content === "" && (
            <div className="flex gap-1 items-center py-2">
              <motion.div
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="w-1.5 h-1.5 rounded-full bg-blue-500"
              />
              <motion.div
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
                className="w-1.5 h-1.5 rounded-full bg-blue-500"
              />
              <motion.div
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
                className="w-1.5 h-1.5 rounded-full bg-blue-500"
              />
            </div>
          )}
        </div>
        
        {message.attachments && message.attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {message.attachments.map((file, idx) => (
              <div key={idx} className="px-2 py-1 bg-white/5 border border-white/10 rounded-md text-[10px] text-zinc-500 flex items-center gap-2">
                <div className="w-1 h-1 rounded-full bg-blue-500" />
                {file.originalName}
              </div>
            ))}
          </div>
        )}
      </div>

      {!isAssistant && (
        <div className="w-8 h-8 rounded-xl bg-zinc-800 flex items-center justify-center flex-shrink-0 text-[10px] font-bold mt-1 text-zinc-400 border border-white/5">
          <User className="w-4 h-4" />
        </div>
      )}
    </motion.div>
  );
}

function CopyButton({ content }: { content: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="p-1.5 hover:bg-white/10 rounded-md transition-colors text-zinc-500 hover:text-zinc-300"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}
