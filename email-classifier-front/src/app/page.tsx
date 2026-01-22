"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  Send,
  Bot,
  Mail,
  Loader2,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
  UploadCloud,
  Github,
  Linkedin,
  Briefcase,
  ExternalLink,
  Wifi,
  WifiOff,
} from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// --- Tipos ---
type AppMode = "single" | "batch" | "csv";

type EmailForm = {
  id: string;
  subject: string;
  body: string;
  senderName: string;
};

type AnalysisResult = {
  id?: string | number;
  category: string;
  suggested_response: string;
  original_preview?: string;
  original_subject?: string;
};

type SingleApiResponse = {
  success: boolean;
  data: {
    category: string;
    suggested_response: string;
    confidence?: number;
  };
};

type BatchApiResponse = {
  total: number;
  results: AnalysisResult[];
};

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

// IMPORTANTE: Em produção, mude isso para a URL do seu Render
// Ex: const API_BASE = "https://seu-app.onrender.com";
const API_BASE = "http://127.0.0.1:8000";

export default function Home() {
  const [mode, setMode] = useState<AppMode>("single");
  const [loading, setLoading] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);

  // Estados de "Warm-up" do Servidor
  const [serverStatus, setServerStatus] = useState<
    "checking" | "ready" | "error"
  >("checking");

  const [cards, setCards] = useState<EmailForm[]>([
    { id: "1", subject: "", body: "", senderName: "" },
  ]);
  const [singleForm, setSingleForm] = useState<EmailForm>({
    id: "single",
    subject: "",
    body: "",
    senderName: "",
  });

  const [results, setResults] = useState<AnalysisResult[]>([]);

  // --- Efeito de Aquecimento (Warm-up) ---
  useEffect(() => {
    const wakeUpServer = async () => {
      try {
        // Faz uma requisição leve para a rota raiz apenas para acordar o Render
        const res = await fetch(`${API_BASE}/`);
        if (res.ok) {
          setServerStatus("ready");
          // Esconde o status de "Online" após 3 segundos para limpar a tela
          setTimeout(() => setServerStatus("checking"), 500000); // Hack visual: deixa sumir só se mudar estado
        } else {
          setServerStatus("error");
        }
      } catch (error) {
        console.error("Servidor dormindo ou erro de conexão:", error);
        setServerStatus("error");
      }
    };

    wakeUpServer();
  }, []);

  // --- Helpers ---
  const addCard = () =>
    setCards([
      ...cards,
      { id: crypto.randomUUID(), subject: "", body: "", senderName: "" },
    ]);
  const removeCard = (id: string) =>
    cards.length > 1 && setCards(cards.filter((c) => c.id !== id));

  const updateCard = (id: string, field: keyof EmailForm, value: string) => {
    setCards(cards.map((c) => (c.id === id ? { ...c, [field]: value } : c)));
  };

  const updateSingle = (field: keyof EmailForm, value: string) => {
    setSingleForm({ ...singleForm, [field]: value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCsvFile(e.target.files[0]);
    }
  };

  // --- Envio ---
  const handleSubmit = async () => {
    setLoading(true);
    setResults([]);

    try {
      let url = "";
      let body: FormData | string;
      let headers: HeadersInit = {};

      if (mode === "single") {
        url = `${API_BASE}/analysis/process`;
        const formData = new FormData();
        formData.append("subject", singleForm.subject);
        let finalBody = singleForm.body;
        if (singleForm.senderName.trim())
          finalBody += `\n\nRemetente: ${singleForm.senderName}`;
        formData.append("text", finalBody);
        body = formData;
      } else if (mode === "batch") {
        url = `${API_BASE}/analysis/batch-json`;
        headers = { "Content-Type": "application/json" };
        body = JSON.stringify(
          cards.map((c, i) => ({
            id: i + 1,
            subject: c.subject,
            body: c.senderName
              ? `${c.body}\n\nRemetente: ${c.senderName}`
              : c.body,
          })),
        );
      } else if (mode === "csv") {
        if (!csvFile) {
          alert("Selecione um arquivo CSV primeiro.");
          setLoading(false);
          return;
        }
        url = `${API_BASE}/analysis/bulk`;
        const formData = new FormData();
        formData.append("file", csvFile);
        body = formData;
      }

      const res = await fetch(url, { method: "POST", headers, body: body! });

      if (!res.ok) throw new Error("Falha na requisição");

      if (mode === "single") {
        const data = (await res.json()) as SingleApiResponse;
        if (data.success) {
          setResults([
            {
              id: "single",
              category: data.data.category,
              suggested_response: data.data.suggested_response,
              original_subject: singleForm.subject,
            },
          ]);
        }
      } else {
        const data = (await res.json()) as BatchApiResponse;
        setResults(data.results || []);
      }

      // Se a requisição funcionou, o servidor com certeza está online
      setServerStatus("ready");
    } catch (error) {
      console.error(error);
      alert(
        "Erro ao conectar com API. O servidor pode estar acordando, tente novamente em 30 segundos.",
      );
      setServerStatus("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-200 selection:bg-blue-500/30 font-sans pb-24 relative overflow-x-hidden">
      {/* --- STATUS BAR FLUTUANTE (WARM UP) --- */}
      <div className="fixed top-24 right-4 z-50 pointer-events-none">
        {serverStatus === "checking" && (
          <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-md animate-pulse shadow-[0_0_15px_rgba(245,158,11,0.2)]">
            <Loader2 className="w-3 h-3 animate-spin" />
            Iniciando Servidor...
          </div>
        )}
        {serverStatus === "ready" && (
          <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-md shadow-[0_0_15px_rgba(16,185,129,0.2)] animate-in fade-in slide-in-from-top-2 duration-500">
            <Wifi className="w-3 h-3" />
            Sistema Online
          </div>
        )}
        {serverStatus === "error" && (
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-md">
            <WifiOff className="w-3 h-3" />
            Servidor Offline
          </div>
        )}
      </div>

      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-tr from-blue-600 to-cyan-500 p-2.5 rounded-xl shadow-lg shadow-blue-500/20">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                Email AI Classifier
              </h1>
              <p className="text-xs text-slate-400 font-medium">
                Sistema Inteligente de Triagem
              </p>
            </div>
          </div>

          <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 shadow-inner">
            {[
              { id: "single", label: "Individual", icon: Mail },
              { id: "batch", label: "Manual (Lote)", icon: Plus },
              { id: "csv", label: "Upload CSV", icon: FileSpreadsheet },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setMode(tab.id as AppMode);
                  setResults([]);
                }}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200",
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

          <a
            href="https://dvalerio-portfolio.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:flex items-center gap-2 bg-gradient-to-r from-emerald-500/10 to-emerald-500/20 hover:from-emerald-500/20 hover:to-emerald-500/30 border border-emerald-500/20 text-emerald-400 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all hover:scale-105 shadow-lg shadow-emerald-500/10"
          >
            <Briefcase className="w-4 h-4" />
            Ver Portfólio
            <ExternalLink className="w-3 h-3 ml-1 opacity-50" />
          </a>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2 text-white">
              {mode === "csv" ? (
                <FileSpreadsheet className="w-5 h-5 text-green-400" />
              ) : (
                <Mail className="w-5 h-5 text-blue-400" />
              )}
              {mode === "csv" ? "Importar Planilha" : "Entrada de Dados"}
            </h2>
            {mode === "batch" && (
              <button
                onClick={addCard}
                className="flex items-center gap-2 text-xs bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-600/20 px-3 py-1.5 rounded-full transition-colors font-medium"
              >
                <Plus className="w-3 h-3" /> Adicionar Email
              </button>
            )}
          </div>

          <div className="space-y-4">
            {mode === "single" && (
              <EmailCard
                data={singleForm}
                onChange={(f, v) => updateSingle(f, v)}
                isSingle={true}
              />
            )}

            {mode === "batch" &&
              cards.map((card, index) => (
                <div
                  key={card.id}
                  className="relative group animate-in fade-in slide-in-from-left-4 duration-300"
                >
                  <div className="absolute -left-3 top-4 bottom-4 w-1 bg-slate-800 group-hover:bg-blue-500/50 rounded-full transition-colors" />
                  <EmailCard
                    data={card}
                    index={index + 1}
                    onChange={(f, v) => updateCard(card.id, f, v)}
                    onDelete={() => removeCard(card.id)}
                    canDelete={cards.length > 1}
                  />
                </div>
              ))}

            {mode === "csv" && (
              <div className="bg-slate-900/50 border-2 border-dashed border-slate-700 rounded-xl p-10 flex flex-col items-center justify-center text-center hover:border-blue-500/50 hover:bg-slate-900 transition-all group">
                <div className="bg-slate-800 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform duration-300">
                  <UploadCloud className="w-8 h-8 text-blue-400" />
                </div>
                <h3 className="text-lg font-medium text-white mb-2">
                  Arraste seu CSV aqui
                </h3>
                <p className="text-sm text-slate-400 mb-6 max-w-xs">
                  Certifique-se que o arquivo tenha colunas como
                  &quot;assunto&quot; e &quot;corpo&quot;.
                </p>

                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="hidden"
                  id="csv-upload"
                />
                <label
                  htmlFor="csv-upload"
                  className="cursor-pointer bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-medium transition-colors shadow-lg shadow-blue-500/20"
                >
                  {csvFile ? csvFile.name : "Selecionar Arquivo"}
                </label>
              </div>
            )}
          </div>

          <button
            onClick={handleSubmit}
            disabled={
              loading ||
              (mode === "csv" && !csvFile) ||
              serverStatus === "checking"
            }
            className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold py-4 rounded-xl shadow-lg shadow-blue-500/20 flex items-center justify-center gap-3 transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:grayscale"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processando Inteligência Artificial...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                {mode === "csv" ? "Processar Arquivo" : "Classificar Emails"}
              </>
            )}
          </button>
        </div>

        <div className="lg:col-span-5 space-y-6">
          <h2 className="text-lg font-semibold flex items-center gap-2 text-white">
            <Bot className="w-5 h-5 text-emerald-400" />
            Resultados da IA
          </h2>

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
        </div>
      </div>

      <footer className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-fit px-4">
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-full py-2 px-6 shadow-2xl flex flex-col md:flex-row items-center gap-3 md:gap-6">
          <span className="text-sm text-slate-300 font-medium whitespace-nowrap">
            Danilo Pedro da Silva Valério
          </span>

          <div className="hidden md:block w-px h-4 bg-slate-700" />

          <div className="flex items-center gap-4">
            <a
              href="https://www.linkedin.com/in/danilo-valério"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-[#0A66C2] transition-colors"
              title="LinkedIn"
            >
              <Linkedin className="w-5 h-5" />
            </a>

            <a
              href="https://github.com/danilopvalerio/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-white transition-colors"
              title="GitHub"
            >
              <Github className="w-5 h-5" />
            </a>

            <div className="w-px h-4 bg-slate-700 md:hidden" />

            <a
              href="https://dvalerio-portfolio.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex md:hidden items-center gap-2 text-emerald-400 text-xs font-bold uppercase"
            >
              Portfolio
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}

function EmailCard({
  data,
  index,
  onChange,
  onDelete,
  canDelete,
  isSingle,
}: {
  data: EmailForm;
  index?: number;
  onChange: (field: keyof EmailForm, value: string) => void;
  onDelete?: () => void;
  canDelete?: boolean;
  isSingle?: boolean;
}) {
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
