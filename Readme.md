# 📧 Email AI Classifier API - Desafio AutoU

> **Backend** desenvolvido como parte do desafio técnico para o processo seletivo da **AutoU**.

Uma API RESTful robusta e assíncrona construída para triagem automática de emails corporativos utilizando Inteligência Artificial Generativa (Llama 3 via Groq). O sistema classifica mensagens em "Produtivo" ou "Improdutivo" e sugere respostas adequadas ao contexto.

## 🛠️ Tech Stack

- **Linguagem:** Python 3.13+
- **Framework Web:** FastAPI
- **Gerenciador de Dependências:** Poetry
- **IA / LLM:** OpenAI Client (conectado à Groq Cloud / Llama-3.3-70b)
- **Processamento de Dados:** Pandas (para manipulação de CSV em massa)
- **NLP:** NLTK (para pré-processamento de texto)
- **Arquitetura:** Feature-Based / Clean Architecture

## ✨ Funcionalidades

- **Classificação Inteligente:** Distingue emails que exigem ação (Financeiro, Suporte, Projetos) de emails sociais/spam.
- **Sugestão de Resposta:** Gera drafts de resposta formal ou informal dependendo da categoria.
- **Processamento Assíncrono:** Utiliza `asyncio` para alta performance.
- **Modo em Lote (Batch):** Processamento paralelo de múltiplos emails via JSON.
- **Suporte a Arquivos:** Upload e processamento de planilhas `.csv` via Pandas.
- **Logs & Observabilidade:** Sistema de logs centralizado.

## 🚀 Como Rodar

### Pré-requisitos

- Python 3.13 ou superior
- Poetry instalado (`pip install poetry`)

### Passo a Passo

1.  **Instale as dependências:**

    ```bash
    poetry install
    ```

2.  **Configure as Variáveis de Ambiente:**
    Crie um arquivo `.env` na raiz do projeto e adicione sua chave da Groq:

    ```env
    GROQ_API_KEY=sua_chave_gsk_aqui
    ```

3.  **Execute o Servidor:**
    ```bash
    poetry run task dev
    ```

O servidor iniciará em `http://127.0.0.1:8000`.

## 📚 Documentação da API

Acesse o **Swagger UI** para testar as rotas interativamente:
👉 **[http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)**

### Principais Endpoints

| Método | Rota                   | Descrição                                  |
| :----- | :--------------------- | :----------------------------------------- |
| `POST` | `/analysis/process`    | Analisa um único email (Texto ou Arquivo). |
| `POST` | `/analysis/batch-json` | Analisa uma lista de emails via JSON.      |
| `POST` | `/analysis/bulk`       | Upload de CSV para análise em massa.       |

## 📂 Estrutura do Projeto

```text
src/
├── features/
│   ├── analysis/       # Lógica principal (Service, Router, Schemas)
│   └── logger/         # Serviço de Logs
└── main.py             # Entrypoint da aplicação
```

### 2. Front-end (`email-classifier-front/README.md`)

Este README foca na experiência do usuário, nas funcionalidades visuais e em como rodar o projeto Next.js.

# 🖥️ Email AI Classifier Web - Desafio AutoU

> **Front-end** desenvolvido como parte do desafio técnico para o processo seletivo da **AutoU**.

Uma interface moderna, responsiva e intuitiva para interação com a API de Classificação de Emails. Desenvolvida com foco em UX, permitindo desde a análise rápida de um único email até o processamento massivo de arquivos CSV.

## 🎨 Interface & UX

- **Design Moderno:** Estilo "Dark Corporate" utilizando Tailwind CSS.
- **Glassmorphism:** Elementos translúcidos e blur para um visual sofisticado.
- **Responsividade:** Funciona perfeitamente em Desktop e Mobile.
- **Feedback em Tempo Real:** Indicadores de carregamento e status de processamento da IA.

## 🛠️ Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Linguagem:** TypeScript
- **Estilização:** Tailwind CSS + clsx
- **Ícones:** Lucide React
- **Conexão:** Fetch API

## ✨ Funcionalidades

1.  **Modo Individual:** Formulário para análise rápida de texto.
2.  **Modo Manual (Lote):** Interface de "Cards" dinâmicos para adicionar múltiplos emails manualmente.
3.  **Upload CSV:** Área de Drag & Drop para envio de planilhas para processamento em massa.
4.  **Visualização de Resultados:** Exibição clara da Categoria (Produtivo/Improdutivo) e da Sugestão de Resposta gerada pela IA.

## 🚀 Como Rodar - Front-end

### Pré-requisitos

- Node.js 18+
- Backend (`email-classifier`) rodando na porta 8000.

### Passo a Passo

1.  **Instale as dependências:**

    ```bash
    npm install
    ```

2.  **Execute o projeto:**

    ```bash
    npm run dev
    ```

3.  **Acesse no navegador:**
    Abra `http://localhost:3000`.

## 🧪 Como Testar (Exemplo de CSV)

Para testar a funcionalidade de upload, crie um arquivo `.csv` com a seguinte estrutura (o sistema detecta colunas como `assunto`, `corpo`, `mensagem`, etc):

```csv
assunto,corpo
"Erro no Sistema","Não consigo acessar o login desde as 14h."
"Feliz Aniversário","Parabéns João! Muitas felicidades."
"NF Pendente","Segue em anexo a nota fiscal do serviço de jardinagem."
```

🔗 Links Úteis

- Portfólio do Autor: https://dvalerio-portfolio.vercel.app/

* LinkedIn: https://www.linkedin.com/in/danilo-valério
