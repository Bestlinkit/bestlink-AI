import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { atomDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Check, Copy, ChevronDown, ChevronRight, Zap, Palette, Layout, Code, Play, Smartphone, Boxes, Info, Target, Sparkles } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface ChatMarkdownProps {
  content: string;
}

const SECTION_ICONS: Record<string, any> = {
  "PROJECT UNDERSTANDING": Info,
  "CREATIVE DIRECTION": Palette,
  "TECH STACK": Boxes,
  "UI ARCHITECTURE": Layout,
  "DESIGN SYSTEM": Sparkles,
  "ANIMATION SYSTEM": Play,
  "COMPONENT TREE": Target,
  "ANTIGRAVITY EXECUTION PROMPT": Zap,
  "PRODUCTION-GRADE CODE": Code,
  "ITERATION OPTIONS": Sparkles,
  "DNA DETECTED": Palette,
};

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
                <div className="group relative my-8 rounded-2xl bg-[#09090b] border border-white/5 overflow-hidden shadow-2xl">
                  <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/5">
                    <div className="flex items-center gap-2">
                      <Code className="w-3 h-3 text-blue-400" />
                      <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">{match[1]} Source</span>
                    </div>
                    <button 
                      onClick={handleCopy}
                      className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-all text-[10px] font-bold"
                    >
                      {isCopied ? <><Check className="w-3 h-3 text-green-400" /> Copied</> : <><Copy className="w-3 h-3" /> Copy Code</>}
                    </button>
                  </div>
                  <div className="p-6 overflow-x-auto custom-scrollbar">
                    <SyntaxHighlighter
                      style={atomDark}
                      language={match[1]}
                      PreTag="div"
                      customStyle={{
                        background: "transparent",
                        padding: 0,
                        margin: 0,
                        fontSize: "13px",
                        lineHeight: "1.6"
                      }}
                      {...props}
                    >
                      {String(children).replace(/\n$/, "")}
                    </SyntaxHighlighter>
                  </div>
                </div>
              );
            }
            return <code className={cn("bg-white/5 px-1.5 py-0.5 rounded-md text-blue-400 font-mono text-[13px]", className)} {...props}>{children}</code>;
          },
          blockquote({ children }: any) {
            return (
              <div className="my-10 p-8 rounded-3xl bg-blue-500/5 border border-blue-500/20 relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.5)]" />
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-blue-500 text-white shadow-[0_0_20px_rgba(59,130,246,0.5)]">
                      <Zap className="w-5 h-5 fill-current" />
                    </div>
                    <div>
                      <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] block mb-0.5">Prompt Engine</span>
                      <span className="text-sm font-bold text-white tracking-tight">Antigravity Execution Prompt</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => navigator.clipboard.writeText(String(children[0]?.props?.children || ""))}
                    className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-white transition-all active:scale-95"
                  >
                    <Copy className="w-5 h-5" />
                  </button>
                </div>
                <div className="text-base font-medium text-white/90 italic leading-relaxed pl-2 selection:bg-blue-500/30">
                  {children}
                </div>
              </div>
            );
          },
          h1: ({ children }) => {
            const text = String(children).toUpperCase();
            const Icon = SECTION_ICONS[text] || Sparkles;
            return (
              <h1 className="group flex items-center gap-4 text-2xl font-black tracking-tighter mt-16 mb-8 text-white border-b border-white/10 pb-6">
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-blue-400 group-hover:bg-blue-500/10 transition-colors">
                  <Icon className="w-6 h-6" />
                </div>
                <span className="bg-gradient-to-r from-white to-white/40 bg-clip-text text-transparent">{children}</span>
              </h1>
            );
          },
          h2: ({ children }) => (
            <h2 className="flex items-center gap-3 text-lg font-black tracking-tight mt-12 mb-6 text-white/90">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              {children}
            </h2>
          ),
          h3: ({ children }) => <h3 className="text-[11px] font-black uppercase tracking-[0.3em] mt-10 mb-3 text-white/30 border-l-2 border-white/10 pl-4">{children}</h3>,
          p: ({ children }) => <p className="text-[15px] leading-loose text-white/60 mb-6 font-medium">{children}</p>,
          li: ({ children }) => (
            <li className="flex items-start gap-3 text-[14px] text-white/60 mb-3 group">
              <span className="mt-2 w-1.5 h-1.5 rounded-full bg-white/10 group-hover:bg-blue-500/40 transition-colors" />
              <span className="flex-1">{children}</span>
            </li>
          ),
          ul: ({ children }) => <ul className="list-none p-0 mb-8">{children}</ul>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
