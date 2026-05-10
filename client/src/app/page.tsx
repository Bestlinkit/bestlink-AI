"use client";

import SimpleChat from "@/components/Chat/SimpleChat";
import { Sidebar } from "@/components/Sidebar/Sidebar";
import { useAppStore } from "@/store/useAppStore";
import { cn } from "@/lib/utils";

export default function Home() {
  const { isSidebarOpen } = useAppStore();

  return (
    <main className="min-h-screen w-full bg-[#0f0f0f] flex overflow-hidden">
      <Sidebar />
      <div className={cn(
        "flex-1 flex flex-col transition-all duration-300 ease-in-out",
        isSidebarOpen ? "pl-[260px]" : "pl-0"
      )}>
        <SimpleChat />
      </div>
    </main>
  );
}
