import { Loader2, Wifi, WifiOff } from "lucide-react";
import { useState, useEffect } from "react";

interface StatusBarProps {
  status: "checking" | "ready" | "error";
}

export function StatusBar({ status }: StatusBarProps) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (status === "checking") {
      // Inicia o contador
      interval = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    }

    // CLEANUP: Quando o status muda (para ready ou error) ou o componente desmonta,
    // paramos o timer e zeramos. Isso evita o erro de setState e prepara para a próxima.
    return () => {
      clearInterval(interval);
      setSeconds(0);
    };
  }, [status]);

  return (
    <div className="fixed top-15 right-4 z-50 pointer-events-none">
      {status === "checking" && (
        <div className="flex flex-col items-end gap-1 animate-pulse">
          <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-md">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>Conectando ao servidor ({seconds}s)...</span>
          </div>
          <div className="text-[10px] text-amber-400/80 bg-black/40 px-2 py-1 rounded">
            O primeiro acesso pode levar até 1 minuto.
          </div>
        </div>
      )}

      {status === "ready" && (
        <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-md animate-in fade-in slide-in-from-top-2">
          <Wifi className="w-3 h-3" />
          <span>Online</span>
        </div>
      )}

      {status === "error" && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-md">
          <WifiOff className="w-3 h-3" />
          <span>Servidor Offline</span>
        </div>
      )}
    </div>
  );
}
