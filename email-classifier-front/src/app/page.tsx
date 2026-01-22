"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Send,
  Bot,
  Mail,
  Loader2,
  FileText,
  UploadCloud,
} from "lucide-react";
import {
  AppMode,
  EmailForm,
  AnalysisResult,
  SingleApiResponse,
  BatchApiResponse,
} from "./../types";
import { Header } from "./../components/Header";
import { EmailCard } from "./../components/EmailCard";
import { ResultList } from "./../components/ResultList";
import { StatusBar } from "./../components/StatusBar";
import { Footer } from "./../components/Footer";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:8000";

export default function Home() {
  const [mode, setMode] = useState<AppMode>("single");
  const [loading, setLoading] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
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

  useEffect(() => {
    const wakeUpServer = async () => {
      try {
        const res = await fetch(`${API_BASE}/`);
        if (res.ok) {
          setServerStatus("ready");
          setTimeout(() => setServerStatus("checking"), 500000);
        } else {
          setServerStatus("error");
        }
      } catch (error) {
        setServerStatus("error");
      }
    };
    wakeUpServer();
  }, []);

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
    if (e.target.files && e.target.files[0]) setUploadFile(e.target.files[0]);
  };

  const isFormValid = () => {
    if (mode === "single")
      return singleForm.subject.trim() !== "" && singleForm.body.trim() !== "";
    if (mode === "batch")
      return cards.every(
        (c) => c.subject.trim() !== "" && c.body.trim() !== "",
      );
    if (mode === "files") return uploadFile !== null;
    return false;
  };

  const handleSubmit = async () => {
    if (!isFormValid()) return;
    setLoading(true);
    setResults([]);

    try {
      let url = "";
      let body: FormData | string;
      const headers: HeadersInit = {};

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
        headers["Content-Type"] = "application/json";
        body = JSON.stringify(
          cards.map((c, i) => ({
            id: i + 1,
            subject: c.subject,
            body: c.senderName
              ? `${c.body}\n\nRemetente: ${c.senderName}`
              : c.body,
          })),
        );
      } else if (mode === "files" && uploadFile) {
        url = `${API_BASE}/analysis/file-upload`;
        const formData = new FormData();
        formData.append("file", uploadFile);
        body = formData;
      }

      const res = await fetch(url, { method: "POST", headers, body: body! });
      if (!res.ok) throw new Error("Erro na requisição");

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
      setServerStatus("ready");
    } catch (error) {
      alert("Erro ao processar: " + error);
      setServerStatus("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-200 font-sans pb-24 relative overflow-x-hidden">
      <StatusBar status={serverStatus} />

      <Header
        mode={mode}
        setMode={setMode}
        resetResults={() => setResults([])}
      />

      <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Esquerda: Inputs */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2 text-white">
              {mode === "files" ? (
                <FileText className="w-5 h-5 text-purple-400" />
              ) : (
                <Mail className="w-5 h-5 text-blue-400" />
              )}
              {mode === "files" ? "Upload de Arquivo" : "Entrada de Dados"}
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
                onChange={updateSingle}
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

            {mode === "files" && (
              <div className="bg-slate-900/50 border-2 border-dashed border-slate-700 rounded-xl p-10 flex flex-col items-center justify-center text-center hover:border-purple-500/50 hover:bg-slate-900 transition-all group">
                <div className="bg-slate-800 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform duration-300">
                  <UploadCloud className="w-8 h-8 text-purple-400" />
                </div>
                <h3 className="text-lg font-medium text-white mb-2">
                  Envie seu arquivo
                </h3>
                <p className="text-sm text-slate-400 mb-6 max-w-xs leading-relaxed">
                  Suporta <strong>.PDF, .TXT e .CSV</strong>.
                </p>
                <input
                  type="file"
                  accept=".csv,.txt,.pdf"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer bg-purple-600 hover:bg-purple-500 text-white px-6 py-2 rounded-lg font-medium transition-colors shadow-lg shadow-purple-500/20"
                >
                  {uploadFile ? uploadFile.name : "Selecionar Arquivo"}
                </label>
              </div>
            )}
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading || serverStatus === "checking" || !isFormValid()}
            className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold py-4 rounded-xl shadow-lg shadow-blue-500/20 flex items-center justify-center gap-3 transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:grayscale"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" /> Processando...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />{" "}
                {mode === "files" ? "Analisar Arquivo" : "Classificar Emails"}
              </>
            )}
          </button>
        </div>

        {/* Direita: Resultados */}
        <div className="lg:col-span-5 space-y-6">
          <h2 className="text-lg font-semibold flex items-center gap-2 text-white">
            <Bot className="w-5 h-5 text-emerald-400" /> Resultados da IA
          </h2>
          <ResultList results={results} loading={loading} />
        </div>
      </div>
      <Footer />
    </main>
  );
}
