import os
import json
import asyncio
import re
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
        self.stop_words = set(stopwords.words('portuguese'))

    def _preprocess_text(self, text: str) -> str:
        if not text:
            return ""

        text = re.sub(r'\s+', ' ', text).strip()
        text = text.lower()
        text = re.sub(r'[^\w\s]', '', text)

        words = text.split()
        filtered_words = [word for word in words if word not in self.stop_words]

        return " ".join(filtered_words)

    async def analyze_email(self, body: str, subject: str = "") -> dict:
        cleaned_body = self._preprocess_text(body)
        cleaned_subject = self._preprocess_text(subject)
        
        full_content = f"Assunto: {cleaned_subject}\nMensagem: {cleaned_body}"
        
        prompt = """
        Você é um assistente responsável por classificar emails corporativos. 
        O texto abaixo passou por pré-processamento (remoção de stopwords e pontuação).
        Coloque Atenciosamente, [Seu nome] no final das respostas.
        Analise o email e classifique-o exclusivamente como "Produtivo" ou "Improdutivo". 

        Classifique como:
        
        Improdutivo
        - PESQUISAS: NPS, Satisfação, Feedback, "Quero te ouvir".
        - MARKETING: Ofertas, Newsletters, Promoções, Convites.
        - SOCIAL: Aniversários, Avisos gerais, Agradecimentos simples.
        - NOTIFICAÇÕES: Avisos de sistema sem erro crítico.
        - Qualquer pesquisa de empresa.

        Produtivo
        - Solicitações de tarefas, dúvidas, orçamentos.
        - Problemas financeiros (Notas Fiscais, Pagamentos).
        - Erros técnicos críticos.
        - Contato humano sobre projeto.
        - RH: Férias, Ponto, Benefícios.
        - Projetos: Prazos, Aprovações.

        Gere uma resposta formal para Produtivo e uma resposta breve e de encerramento para Improdutivo.
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
        cleaned_text = self._preprocess_text(text)

        prompt = """
        Você é um sistema inteligente de triagem de emails.
        O texto fornecido foi pré-processado e contém UM ou VÁRIOS emails misturados.
        
        1. Separe cada email individualmente pelo contexto.
        2. Infira o Assunto e classifique como "Produtivo" ou "Improdutivo".
        3. Considere Produtivo o que exige ação/decisão e Improdutivo o que não exige (marketing, social, avisos).
        4. Gere sugestão de resposta (assinada por [Nome]).

        Retorne estritamente JSON:
        {
            "emails": [
                {
                    "subject": "...",
                    "original_preview": "...",
                    "category": "...",
                    "response": "..."
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
                    {"role": "user", "content": cleaned_text[:15000]}
                ]
            )
            
            data = json.loads(response.choices[0].message.content)
            return data.get("emails", [])

        except Exception as e:
            LogService.error(f"Erro AI Unstructured: {str(e)}")
            return []