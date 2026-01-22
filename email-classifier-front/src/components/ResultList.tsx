import { Bot, CheckCircle2, XCircle, Mail, Copy } from "lucide-react";
import { AnalysisResult } from "../types";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

interface ResultListProps {
  results: AnalysisResult[];
  loading: boolean;
}

export function ResultList({ results, loading }: ResultListProps) {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto pr-2 custom-scrollbar pb-20">
      {results.length === 0 && !loading && (
        <div className="h-64 border border-dashed border-slate-800 rounded-xl flex flex-col items-center justify-center text-slate-500 p-6 bg-slate-900/20">
          <Bot className="w-12 h-12 mb-3 opacity-20" />
          <p className="text-sm">Os resultados aparecerão aqui.</p>
        </div>
      )}

      {results.map((result, idx) => (
        <div
          key={idx}
          className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg hover:border-slate-700 transition-colors animate-in fade-in slide-in-from-bottom-3"
        >
          <div className="flex items-start justify-between mb-4 pb-3 border-b border-slate-800/50">
            <div className="flex items-center gap-2">
              {result.category?.toLowerCase() === "produtivo" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              ) : (
                <XCircle className="w-4 h-4 text-amber-500" />
              )}
              <span
                className={cn(
                  "text-base font-bold tracking-tight",
                  result.category?.toLowerCase() === "produtivo"
                    ? "text-emerald-400"
                    : "text-amber-400",
                )}
              >
                {result.category || "Sem Categoria"}
              </span>
            </div>
            {result.id && (
              <span className="text-[10px] font-mono bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700">
                #{result.id}
              </span>
            )}
          </div>

          <div className="mb-4">
            <div className="flex items-center gap-1.5 mb-2 text-slate-500">
              <Mail className="w-3.5 h-3.5" />
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">
                Conteúdo do E-mail
              </span>
            </div>
            <div className="bg-slate-950/40 rounded-lg p-3 border border-slate-800/50 max-h-[160px] overflow-y-auto custom-scrollbar group/body relative">
              {result.original_subject && (
                <div className="text-xs font-bold text-slate-300 mb-2 border-b border-slate-800 pb-1">
                  <span className="text-slate-500 font-normal">Assunto:</span>{" "}
                  {result.original_subject}
                </div>
              )}
              <p className="text-xs text-slate-400 leading-relaxed whitespace-pre-wrap">
                {result.original_preview || "Sem conteúdo disponível."}
              </p>
            </div>
          </div>

          <div className="bg-slate-950 rounded-lg p-4 border border-slate-800/50 border-l-emerald-500/50 border-l-2 relative group/res">
            <div className="flex justify-between items-center mb-2">
              <p className="text-[10px] text-emerald-400 uppercase font-black tracking-widest flex items-center gap-1.5">
                <Bot className="w-3.5 h-3.5" />
                Sugestão de Resposta
              </p>
              <button
                onClick={() => copyToClipboard(result.suggested_response)}
                className="opacity-0 group-hover/res:opacity-100 transition-opacity p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-emerald-400"
                title="Copiar resposta"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
              {result.suggested_response}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
