import {
  Bot,
  Mail,
  Plus,
  FileText,
  Briefcase,
  ExternalLink,
} from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { AppMode } from "../types";

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

interface HeaderProps {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  resetResults: () => void;
}

export function Header({ mode, setMode, resetResults }: HeaderProps) {
  return (
    <header className="border-b border-slate-800 bg-slate-900/70 backdrop-blur-md sticky top-0 z-20">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 flex flex-col gap-3">
        {/* LOGO */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-tr from-blue-600 to-cyan-500 p-2 rounded-xl shadow-lg shadow-blue-500/20">
              <Bot className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>

            <div>
              <h1 className="text-base sm:text-xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                Email AI Classifier
              </h1>
              <p className="text-[10px] sm:text-xs text-slate-400 font-medium">
                Sistema Inteligente de Triagem
              </p>
            </div>
          </div>

          {/* PORTFÓLIO */}
          <a
            href="https://dvalerio-portfolio.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-gradient-to-r from-emerald-500/10 to-emerald-500/20 hover:from-emerald-500/20 hover:to-emerald-500/30 border border-emerald-500/20 text-emerald-400 px-3 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all hover:scale-105 shadow-lg shadow-emerald-500/10"
          >
            <Briefcase className="w-4 h-4" />
            <span className="hidden sm:inline">Ver Portfólio</span>
            <ExternalLink className="w-3 h-3 opacity-50 hidden sm:inline" />
          </a>
        </div>

        {/* TABS */}
        <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 shadow-inner overflow-x-auto scrollbar-hide">
          {[
            { id: "single", label: "Individual", icon: Mail },
            { id: "batch", label: "Lote", icon: Plus },
            { id: "files", label: "Arquivos", icon: FileText },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setMode(tab.id as AppMode);
                resetResults();
              }}
              className={cn(
                "flex items-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all duration-200 whitespace-nowrap",
                mode === tab.id
                  ? "bg-slate-800 text-white shadow-sm ring-1 ring-white/10"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/50",
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
