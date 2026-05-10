"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { atomDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Check, Copy, ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface ChatMarkdownProps {
  content: string;
}

export function ChatMarkdown({ content }: ChatMarkdownProps) {
  return (
    <div className="prose prose-invert max-w-none prose-pre:bg-transparent prose-pre:p-0 prose-pre:m-0">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ node, inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || "");
            const [isCopied, setIsCopied] = useState(false);

            const handleCopy = () => {
              navigator.clipboard.writeText(String(children).replace(/\n$/, ""));
              setIsCopied(true);
              setTimeout(() => setIsCopied(false), 2000);
            };

            if (!inline && match) {
              return (
                <div className="group relative my-6 rounded-2xl bg-[#09090b] border border-white/5 overflow-hidden shadow-2xl">
                  <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/5">
                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{match[1]}</span>
                    <button 
                      onClick={handleCopy}
                      className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-all"
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <div className="p-4 overflow-x-auto custom-scrollbar">
                    <SyntaxHighlighter
                      style={atomDark}
                      language={match[1]}
                      PreTag="div"
                      customStyle={{
                        background: "transparent",
                        padding: 0,
                        margin: 0,
                        fontSize: "13px",
                      }}
                      {...props}
                    >
                      {String(children).replace(/\n$/, "")}
                    </SyntaxHighlighter>
                  </div>
                </div>
              );
            }
            return <code className={cn("bg-white/5 px-1.5 py-0.5 rounded-md text-blue-400", className)} {...props}>{children}</code>;
          },
          // Support for prompt blocks (custom markdown pattern)
          blockquote({ children }: any) {
            return (
              <div className="my-8 p-6 rounded-3xl bg-blue-500/5 border border-blue-500/20 relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-xl bg-blue-500 text-white shadow-[0_0_20px_rgba(59,130,246,0.5)]">
                    <Copy className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Antigravity Master Prompt</span>
                </div>
                <div className="text-sm font-medium text-white/80 italic leading-relaxed">
                  {children}
                </div>
                <button 
                  onClick={() => navigator.clipboard.writeText(String(children[0]?.props?.children || ""))}
                  className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            );
          },
          h1: ({ children }) => <h1 className="text-3xl font-black tracking-tighter mt-12 mb-6 text-white border-b border-white/5 pb-4">{children}</h1>,
          h2: ({ children }) => <h2 className="text-xl font-black tracking-tight mt-10 mb-4 text-white/90 flex items-center gap-2">{children}</h2>,
          h3: ({ children }) => <h3 className="text-sm font-black uppercase tracking-widest mt-8 mb-2 text-white/40">{children}</h3>,
          p: ({ children }) => <p className="text-sm leading-relaxed text-white/70 mb-4">{children}</p>,
          li: ({ children }) => <li className="text-sm text-white/70 mb-2">{children}</li>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
