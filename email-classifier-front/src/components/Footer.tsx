import { Github, Linkedin } from "lucide-react";

export function Footer() {
  return (
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
        </div>
      </div>
    </footer>
  );
}
