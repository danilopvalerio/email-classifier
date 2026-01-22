import { Loader2, Wifi, WifiOff } from "lucide-react";

interface StatusBarProps {
  status: "checking" | "ready" | "error";
}

export function StatusBar({ status }: StatusBarProps) {
  return (
    <div className="fixed top-15 right-4 z-50 pointer-events-none">
      {status === "checking" && (
        <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-md animate-pulse">
          <Loader2 className="w-3 h-3 animate-spin" />
          Conectando...
        </div>
      )}
      {status === "ready" && (
        <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-md animate-in fade-in slide-in-from-top-2">
          <Wifi className="w-3 h-3" />
        </div>
      )}
      {status === "error" && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-md">
          <WifiOff className="w-3 h-3" />
          Offline
        </div>
      )}
    </div>
  );
}
