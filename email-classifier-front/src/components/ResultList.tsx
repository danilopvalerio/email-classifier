import { Bot, CheckCircle2, XCircle } from "lucide-react";
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
          <div className="flex items-start justify-between mb-3 pb-3 border-b border-slate-800/50">
            <div>
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
                  {result.category}
                </span>
              </div>
            </div>
            {result.id && (
              <span className="text-[10px] font-mono bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700">
                #{result.id}
              </span>
            )}
          </div>

          {(result.original_preview || result.original_subject) && (
            <div className="mb-3 text-xs text-slate-500 italic border-l-2 border-slate-700 pl-2">
              {result.original_subject && (
                <span className="block font-bold not-italic text-slate-400">
                  {result.original_subject}
                </span>
              )}
              {result.original_preview}
            </div>
          )}

          <div className="bg-slate-950 rounded-lg p-3 border border-slate-800/50">
            <p className="text-xs text-slate-500 uppercase font-bold mb-1.5">
              Sugestão de Resposta
            </p>
            <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
              {result.suggested_response}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
