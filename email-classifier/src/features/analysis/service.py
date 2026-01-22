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
        stop_words = set(stopwords.words('portuguese'))
        words = text.lower().split()
        cleaned_words = [w for w in words if w not in stop_words]
        return " ".join(cleaned_words)

    async def analyze_email(self, body: str, subject: str = "") -> dict:
        """Analisa um único email combinando Assunto + Corpo."""
        
        full_content = f"Assunto: {subject}\nMensagem: {body}"
        
        LogService.info(f"Processando email. Tamanho total: {len(full_content)}")
        
        clean_text = self._preprocess_text(full_content)
        
        prompt = """
        Você é um assistente responsável por classificar emails corporativos, deve responder como "Danilo Valério". 
        Analise o email (Assunto e Corpo) fornecido e classifique-o exclusivamente como "Produtivo" 
        ou "Improdutivo". Considere como Produtivo qualquer email que exija ação, 
        tomada de decisão, resolução de problema, fornecimento de informação 
        relevante ou continuidade de um processo. Considere como Improdutivo emails 
        que não exigem ação, como agradecimentos, cumprimentos, avisos gerais ou comunicações sem impacto operacional. Se o email for classificado como Produtivo, gere uma resposta formal, clara e objetiva, adequada ao ambiente corporativo. Se for classificado como Improdutivo, gere uma resposta educada, breve e de encerramento, sem solicitar novas ações.
        Responda estritamente em JSON: {"category": "...", "response": "..."}
        """
        try:
            response = await self.client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                response_format={"type": "json_object"},
                messages=[
                    {"role": "system", "content": prompt},
                    {"role": "user", "content": clean_text}
                ]
            )
            raw_content = json.loads(response.choices[0].message.content)
            return {
                "category": raw_content.get("category"),
                "suggested_response": raw_content.get("response"), 
                "confidence": 1.0 
            }

        except Exception as e:
            LogService.error(f"Erro na IA: {str(e)}")
            return {
                "category": "Erro", 
                "suggested_response": "Falha na análise." 
            }

    async def analyze_batch_json(self, emails: list[EmailInput]):
        """
        Recebe uma lista de objetos EmailInput (id, subject, body).
        Processa todos em paralelo.
        """
        tasks = [self.analyze_email(email.body, email.subject) for email in emails]
        
        results = await asyncio.gather(*tasks)
        return results