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
import { Settings, Shield, Cpu, Palette, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import ModelSelector from './ModelSelector';

export default function SettingsModal({ children }: { children: React.ReactElement }) {
  const { theme, setTheme, model, setModel } = useAppStore();

  return (
    <Dialog>
      <DialogTrigger render={children} />
      <DialogContent className="max-w-2xl bg-[#09090b] border-white/5 text-zinc-200">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold font-outfit flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-500" />
            System Configuration
          </DialogTitle>
          <DialogDescription className="text-zinc-500 text-xs">
            Manage your AI intelligence, workspace preferences, and production settings.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="general" className="mt-4">
          <TabsList className="bg-white/5 border border-white/5 w-full justify-start p-1 h-auto gap-1">
            <TabsTrigger value="general" className="text-xs py-2 gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <Globe className="w-3.5 h-3.5" />
              General
            </TabsTrigger>
            <TabsTrigger value="intelligence" className="text-xs py-2 gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <Cpu className="w-3.5 h-3.5" />
              Intelligence
            </TabsTrigger>
            <TabsTrigger value="appearance" className="text-xs py-2 gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <Palette className="w-3.5 h-3.5" />
              Appearance
            </TabsTrigger>
            <TabsTrigger value="security" className="text-xs py-2 gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <Shield className="w-3.5 h-3.5" />
              Security
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="mt-6 space-y-6">
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="workspace" className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Workspace Name</Label>
                <Input id="workspace" defaultValue="Bestlink Production" className="bg-white/5 border-white/10" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="base-url" className="text-xs text-zinc-500 font-bold uppercase tracking-widest">API Endpoint</Label>
                <Input id="base-url" defaultValue="http://localhost:5000" className="bg-white/5 border-white/10 font-mono text-[10px]" />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="intelligence" className="mt-6 space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
                <div>
                  <p className="text-sm font-bold">Model Engine</p>
                  <p className="text-[10px] text-zinc-500">Select the primary LLM for project generation.</p>
                </div>
                <ModelSelector />
              </div>
              <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10">
                <p className="text-[10px] font-bold text-blue-400 uppercase mb-2">Smart Routing</p>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  The system automatically routes complex reasoning tasks to DeepSeek R1 and UI tasks to Qwen 72B for optimal results.
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="appearance" className="mt-6 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => setTheme('dark')}
                className={cn(
                  "p-6 rounded-2xl border transition-all text-left",
                  theme === 'dark' ? "bg-blue-600/10 border-blue-600" : "bg-white/5 border-white/5 hover:bg-white/10"
                )}
              >
                <div className="w-10 h-10 rounded-full bg-zinc-900 border border-white/10 mb-4" />
                <p className="font-bold text-sm">Deep Dark</p>
                <p className="text-[10px] text-zinc-500">Cinematic production theme.</p>
              </button>
              <button 
                onClick={() => setTheme('light')}
                className={cn(
                  "p-6 rounded-2xl border transition-all text-left",
                  theme === 'light' ? "bg-blue-600/10 border-blue-600" : "bg-white/5 border-white/5 hover:bg-white/10"
                )}
              >
                <div className="w-10 h-10 rounded-full bg-zinc-100 border border-black/10 mb-4" />
                <p className="font-bold text-sm">Minimal Light</p>
                <p className="text-[10px] text-zinc-500">Clean engineering theme.</p>
              </button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
