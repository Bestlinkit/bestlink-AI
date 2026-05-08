"use client";

import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check, Terminal } from 'lucide-react';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  attachments?: any[];
  timestamp: number;
}

export default function MessageList({ messages }: { messages: Message[] }) {
  return (
    <div className="flex flex-col gap-8 py-10">
      {messages.map((message, i) => (
        <motion.div
          key={message.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "flex gap-4 max-w-4xl mx-auto w-full group",
            message.role === 'user' ? "justify-end" : "justify-start"
          )}
        >
          {message.role === 'assistant' && (
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
              <Terminal className="w-4 h-4 text-blue-400" />
            </div>
          )}

          <div className={cn(
            "flex flex-col gap-2 min-w-0 flex-1",
            message.role === 'user' ? "items-end" : "items-start"
          )}>
            <div className={cn(
              "relative px-4 py-3 rounded-2xl text-sm leading-relaxed",
              message.role === 'user' 
                ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20 max-w-[80%]" 
                : "bg-white/5 border border-white/5 text-zinc-300 w-full"
            )}>
              <ReactMarkdown
                components={{
                  code({ node, inline, className, children, ...props }: any) {
                    const match = /language-(\w+)/.exec(className || '');
                    return !inline && match ? (
                      <div className="relative mt-4 mb-4 rounded-xl overflow-hidden border border-white/10 group/code">
                        <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/10">
                          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                            {match[1]}
                          </span>
                          <CopyButton content={String(children).replace(/\n$/, '')} />
                        </div>
                        <SyntaxHighlighter
                          {...props}
                          style={atomDark}
                          language={match[1]}
                          PreTag="div"
                          className="!bg-[#050505] !m-0 !p-4"
                        >
                          {String(children).replace(/\n$/, '')}
                        </SyntaxHighlighter>
                      </div>
                    ) : (
                      <code className={cn("bg-white/10 px-1.5 py-0.5 rounded text-blue-400", className)} {...props}>
                        {children}
                      </code>
                    );
                  }
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          </div>

          {message.role === 'user' && (
            <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center flex-shrink-0 text-[10px] font-bold">
              U
            </div>
          )}
        </motion.div>
      ))}
    </div>
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
