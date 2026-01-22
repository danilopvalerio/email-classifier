import { Mail, Trash2 } from "lucide-react";
import { EmailForm } from "../types";

interface EmailCardProps {
  data: EmailForm;
  index?: number;
  onChange: (field: keyof EmailForm, value: string) => void;
  onDelete?: () => void;
  canDelete?: boolean;
  isSingle?: boolean;
}

export function EmailCard({
  data,
  index,
  onChange,
  onDelete,
  canDelete,
  isSingle,
}: EmailCardProps) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm transition-all hover:border-slate-700 hover:shadow-md">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
          {isSingle ? (
            <Mail className="w-3 h-3" />
          ) : (
            <span className="bg-slate-800 w-5 h-5 flex items-center justify-center rounded-full text-white">
              {index}
            </span>
          )}
          {isSingle ? "Novo Email" : `Email #${index}`}
        </h3>
        {!isSingle && canDelete && (
          <button
            onClick={onDelete}
            className="text-slate-600 hover:text-red-400 transition-colors p-1 hover:bg-red-400/10 rounded-lg"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="space-y-4">
        <div>
          <input
            type="text"
            placeholder="Assunto (Ex: Nota Fiscal pendente)"
            value={data.subject}
            onChange={(e) => onChange("subject", e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600/50 focus:border-blue-600/50 placeholder:text-slate-600 transition-all"
          />
        </div>

        <div>
          <input
            type="text"
            placeholder="Remetente (Opcional)"
            value={data.senderName}
            onChange={(e) => onChange("senderName", e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600/50 focus:border-blue-600/50 placeholder:text-slate-600 transition-all"
          />
        </div>

        <div>
          <textarea
            rows={4}
            placeholder="Cole o corpo do email aqui..."
            value={data.body}
            onChange={(e) => onChange("body", e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600/50 focus:border-blue-600/50 placeholder:text-slate-600 resize-none transition-all"
          />
        </div>
      </div>
    </div>
  );
}
