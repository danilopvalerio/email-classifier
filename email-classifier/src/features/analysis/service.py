import os
import json
import asyncio
import nltk
from nltk.corpus import stopwords
from openai import AsyncOpenAI
from dotenv import load_dotenv
from src.features.logger.service import LogService
from src.features.analysis.schemas import EmailInput

load_dotenv()

try:
    nltk.data.find('corpora/stopwords')
except LookupError:
    nltk.download('stopwords')

class AnalysisService:
    def __init__(self):
        self.client = AsyncOpenAI(
            base_url="https://api.groq.com/openai/v1",
            api_key=os.getenv("GROQ_API_KEY")
        )

    def _preprocess_text(self, text: str) -> str:
        return text

    async def analyze_email(self, body: str, subject: str = "") -> dict:
        full_content = f"Assunto: {subject}\nMensagem: {body}"
        
        prompt = """
        Você é um assistente responsável por classificar emails corporativos.  Atue como Danilo Valério.
        Analise o email fornecido e classifique-o exclusivamente como "Produtivo" 
        ou "Improdutivo". 

        Classifique o email como:
        
        Improdutivo - Prioridade para esta categoria.
        Classifique como Improdutivo se o email for:
        - PESQUISAS: NPS, Satisfação, Feedback de banco/loja, "Quero te ouvir", "Sua opinião importa".
        - MARKETING: Ofertas, Newsletters, Promoções, Convites para eventos/webinars.
        - SOCIAL/RH: Aniversários, Avisos gerais (ex: "Bolo na copa"), Agradecimentos simples.
        - NOTIFICAÇÕES: Avisos automáticos de sistema sem erro crítico.
        - Qualquer tipo de pesquisa de banco(bank) ou de alguma empresa.
        *** IMPORTANTE: Mesmo que o email peça uma resposta ou diga "é urgente", se for uma Pesquisa ou Marketing, é Improdutivo. ***

        Produtivo
        Apenas se NÃO for Improdutivo e exigir trabalho real:
        - Solicitações de tarefas de trabalho, dúvidas de projetos, orçamentos.
        - Problemas financeiros reais (Notas Fiscais, Pagamentos atrasados).
        - Erros técnicos críticos reportados por clientes ou monitoramento.
        - Contato direto de ser humano sobre projeto em andamento.

        EXEMPLOS DE APRENDIZADO (Use como base):
        
        Exemplo 1 (Pesquisa/Marketing) -> [IMPRODUTIVO]:
        "Assunto: Queremos te ouvir! / Corpo: Olá, responda nossa pesquisa de satisfação, é muito importante para melhorarmos."
        -> Motivo: É pesquisa, não exige trabalho real.
        
        Exemplo 2 (Cobrança) -> [PRODUTIVO]:
        "Assunto: NF 332 pendente / Corpo: Olá, não identificamos o pagamento da nota fiscal de competência 01/2026."
        -> Motivo: Problema financeiro real.

        Exemplo 3 (Will Bank/Bancos) -> [IMPRODUTIVO]:
        "Assunto: Danilo, quero te ouvir / Corpo: Estou enviando de novo porque é importante te ouvir. Responda nossa pesquisa."
        -> Motivo: Engenharia social de marketing. Não é urgente de verdade. NEGUE pesquisas de qualquer tipo, mesmo que tenham palavras de urgência.

        Se o email for classificado como Produtivo, 
        gere uma resposta formal, clara e objetiva, adequada ao ambiente corporativo. 
        Se for classificado como Improdutivo, gere uma resposta educada, breve e de 
        encerramento, sem solicitar novas ações e se for mensagem automática de alguma empresa 
        é improdutivo, não precisa citar o nome da empresa de volta.
        Responda estritamente em JSON: {"category": "...", "response": "..."}
        """

        try:
            response = await self.client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                response_format={"type": "json_object"},
                messages=[
                    {"role": "system", "content": prompt},
                    {"role": "user", "content": full_content}
                ]
            )
            content = json.loads(response.choices[0].message.content)
            return {
                "category": content.get("category"),
                "suggested_response": content.get("response"),
                "confidence": 1.0
            }

        except Exception:
            return {
                "category": "Erro", 
                "suggested_response": "Falha na análise."
            }

    async def analyze_batch_json(self, emails: list[EmailInput]):
        tasks = [self.analyze_email(email.body, email.subject) for email in emails]
        results = await asyncio.gather(*tasks)
        return results

    async def analyze_unstructured_text(self, text: str) -> list:
        prompt = """
        Você é um sistema inteligente de triagem de emails.
        O texto fornecido pelo usuário contém UM ou VÁRIOS emails misturados (copiados de um PDF ou TXT).
        
        Sua missão:
        1. Identificar e separar cada email individualmente pelo contexto.
        2. Se houver apenas um email, analise-o. Se houver vários, analise todos.
        3. Para CADA email encontrado, extraia (ou infira) o Assunto e classifique como "Produtivo" ou "Improdutivo".
        4. Considere como Produtivo qualquer email que exija ação, 
        tomada de decisão, resolução de problema, fornecimento de informação 
        relevante ou continuidade de um processo. Considere como Improdutivo emails 
        que não exigem ação, como agradecimentos, cumprimentos, avisos gerais ou 
        comunicações sem impacto operacional. Se o email for classificado como 
        Produtivo, gere uma resposta formal, clara e objetiva, adequada ao ambiente 
        corporativo. Se for classificado como Improdutivo, gere uma resposta educada, 
        breve e de encerramento, sem solicitar novas ações.
        5. Gere uma sugestão de resposta (assinada por Danilo Valério).

        IMPORTANTE:
        Retorne estritamente um JSON com uma chave "emails" contendo uma lista:
        {
            "emails": [
                {
                    "subject": "Assunto identificado ou 'Sem Assunto'",
                    "original_preview": "Trecho inicial do email...",
                    "category": "Produtivo" ou "Improdutivo",
                    "response": "Texto da sugestão de resposta..."
                }
            ]
        }
        """


        try:
            response = await self.client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                response_format={"type": "json_object"},
                messages=[
                    {"role": "system", "content": prompt},
                    {"role": "user", "content": text[:15000]}
                ]
            )
            
            data = json.loads(response.choices[0].message.content)
            return data.get("emails", [])

        except Exception as e:
            LogService.error(f"Erro AI Unstructured: {str(e)}")
            return []