"use client";

import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogTrigger
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useAppStore } from '@/store/useAppStore';
import { Settings, Shield, Cpu, Palette, Globe, Zap, X, Brain } from 'lucide-react';
import { cn } from '@/lib/utils';
import ModelSelector from './ModelSelector';

export default function SettingsModal({ children }: { children: React.ReactElement }) {
  const { theme, setTheme, model, setModel } = useAppStore();

  return (
    <Dialog>
      <DialogTrigger render={children} />
      <DialogContent className="max-w-2xl bg-[#050505] border-white/5 text-zinc-200 shadow-[0_0_80px_rgba(0,0,0,0.8)] p-0 overflow-hidden rounded-[2.5rem] border backdrop-blur-3xl">
        <div className="absolute inset-0 bg-blue-500/5 blur-[100px] pointer-events-none" />
        
        <div className="relative p-10 pb-6">
          <DialogHeader>
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 shadow-2xl">
                <Settings className="w-7 h-7 text-white" />
              </div>
              <div>
                <DialogTitle className="text-3xl font-bold font-outfit tracking-tighter text-white">
                  System Settings
                </DialogTitle>
                <DialogDescription className="text-zinc-500 text-[11px] font-bold uppercase tracking-widest mt-1">
                  Orchestration & Infrastructure Control
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        <Tabs defaultValue="intelligence" className="relative px-10 pb-10">
          <TabsList className="bg-white/5 border border-white/5 w-full justify-start p-1.5 h-auto gap-1.5 rounded-2xl mb-8">
            {[
              { id: 'intelligence', icon: Cpu, label: 'Intelligence' },
              { id: 'general', icon: Globe, label: 'Workspace' },
              { id: 'appearance', icon: Palette, label: 'Aesthetics' },
              { id: 'security', icon: Shield, label: 'Security' }
            ].map((tab) => (
              <TabsTrigger 
                key={tab.id}
                value={tab.id} 
                className="flex-1 text-[10px] font-bold uppercase tracking-widest py-3 gap-2 rounded-xl data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-2xl transition-all"
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="intelligence" className="mt-0 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/5 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-white">Active Intelligence Matrix</p>
                  <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-widest mt-1">Primary Generation Engine</p>
                </div>
                <ModelSelector />
              </div>
              <div className="h-[1px] bg-white/5" />
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-3 h-3 text-blue-400" />
                    <span className="text-[9px] font-bold text-blue-400 uppercase tracking-widest">Auto-Routing</span>
                  </div>
                  <p className="text-[10px] text-zinc-400 leading-relaxed">
                    Planner uses DeepSeek Chat for strategy, while Builder utilizes Qwen/Gemini for UI.
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-purple-500/5 border border-purple-500/10">
                  <div className="flex items-center gap-2 mb-2">
                    <Brain className="w-3 h-3 text-purple-400" />
                    <span className="text-[9px] font-bold text-purple-400 uppercase tracking-widest">Reasoning Mode</span>
                  </div>
                  <p className="text-[10px] text-zinc-400 leading-relaxed">
                    Advanced logic enabled for complex architecture planning.
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="general" className="mt-0 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="grid gap-6 p-6 rounded-3xl bg-white/[0.03] border border-white/5">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Workspace ID</Label>
                <Input defaultValue="BESTLINK_STUDIO_PROD" className="bg-black/40 border-white/5 h-12 rounded-2xl px-5 text-sm font-medium focus:border-white/20 transition-all" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Production Endpoint</Label>
                <Input defaultValue={process.env.NEXT_PUBLIC_API_URL || "https://api.bestlink.ai"} className="bg-black/40 border-white/5 h-12 rounded-2xl px-5 text-sm font-mono text-blue-400 focus:border-white/20 transition-all" />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="appearance" className="mt-0 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="grid grid-cols-2 gap-6">
              {[
                { id: 'dark', title: 'Deep Dark', desc: 'Cinematic production', color: 'bg-zinc-950' },
                { id: 'light', title: 'Minimal', desc: 'Clean engineering', color: 'bg-zinc-100' }
              ].map((t) => (
                <button 
                  key={t.id}
                  onClick={() => setTheme(t.id as any)}
                  className={cn(
                    "p-6 rounded-[2rem] border transition-all text-left relative overflow-hidden group",
                    theme === t.id ? "bg-white/10 border-white/20" : "bg-white/[0.02] border-white/5 hover:border-white/10"
                  )}
                >
                  <div className={cn("w-12 h-12 rounded-full border border-white/10 mb-6 transition-transform group-hover:scale-110", t.color)} />
                  <p className="font-bold text-sm text-white mb-1">{t.title}</p>
                  <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-tighter">{t.desc}</p>
                  {theme === t.id && (
                    <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                  )}
                </button>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
