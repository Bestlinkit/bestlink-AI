import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import CommandPalette from "@/components/Workspace/CommandPalette";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export const metadata: Metadata = {
  title: "Bestlink Digital AI | Advanced Coding Assistant",
  description: "Elite AI development studio for premium web and software projects.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={cn(
          inter.variable,
          outfit.variable,
          "antialiased min-h-screen bg-background text-foreground"
        )}
      >
        <div className="relative flex min-h-screen overflow-hidden">
          {/* Animated Background Mesh */}
          <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
            <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-blue-500/10 blur-[120px] animate-pulse" />
            <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] rounded-full bg-purple-500/10 blur-[120px] animate-pulse" />
          </div>
          
          <CommandPalette />
          {children}
        </div>
      </body>
    </html>
  );
}
