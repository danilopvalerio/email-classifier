import os
import json
import asyncio
import re
import nltk
from nltk.corpus import stopwords
from nltk.stem import RSLPStemmer
from openai import AsyncOpenAI
from dotenv import load_dotenv
from src.features.logger.service import LogService
from src.features.analysis.schemas import EmailInput

load_dotenv()

try:
    nltk.data.find('corpora/stopwords')
    nltk.data.find('stemmers/rslp')
except LookupError:
    nltk.download('stopwords')
    nltk.download('rslp')

class AnalysisService:
    def __init__(self):
        self.client = AsyncOpenAI(
            base_url="https://api.groq.com/openai/v1",
            api_key=os.getenv("GROQ_API_KEY")
        )
        self.stop_words = set(stopwords.words('portuguese'))
        self.stemmer = RSLPStemmer()

    def _extract_protected_entities(self, text: str) -> dict:
        """Extrai entidades que NÃO devem sofrer stemming"""
        entities = {
            'emails': [],
            'phones': [],
            'numbers': [],
            'names': [],
            'urls': []
        }
        
        # Emails
        entities['emails'] = re.findall(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', text)
        
        # Telefones
        entities['phones'] = re.findall(r'\(?\d{2,3}\)?[\s-]?\d{4,5}[\s-]?\d{4}', text)
        
        # Números (valores, IDs, protocolos, porcentagens)
        entities['numbers'] = re.findall(r'\b\d+(?:[.,]\d+)*%?\b', text)
        
        # URLs
        entities['urls'] = re.findall(r'https?://[^\s]+', text)
        
        # Nomes próprios (palavras capitalizadas)
        name_pattern = r'\b[A-Z][a-z]+(?:\s+(?:da|de|do|dos|das)\s+)?(?:[A-Z][a-z]+\s*){0,3}\b'
        potential_names = re.findall(name_pattern, text)
        
        # Filtra palavras comuns de saudação
        common_words = {'Olá', 'Prezado', 'Prezada', 'Caro', 'Cara', 'Atenção', 'Bom', 'Boa'}
        entities['names'] = [name.strip() for name in potential_names 
                            if name.strip() not in common_words and len(name.strip()) > 2]
        
        return entities

    def _protect_entities(self, text: str, entities: dict) -> tuple[str, dict]:
        """Substitui entidades por placeholders"""
        placeholders = {}
        counter = 0
        
        for entity_type, items in entities.items():
            for item in set(items):  # Remove duplicatas
                if item and item in text:
                    placeholder = f"__ENTITY_{counter}__"
                    placeholders[placeholder] = item
                    text = text.replace(item, placeholder)
                    counter += 1
        
        return text, placeholders

    def _restore_entities(self, text: str, placeholders: dict) -> str:
        """Restaura entidades protegidas"""
        for placeholder, original in placeholders.items():
            text = text.replace(placeholder, original)
        return text

    def _smart_preprocess(self, text: str) -> tuple[str, str]:
        """
        Pré-processamento inteligente que preserva contexto
        Retorna: (texto_processado, texto_original_limpo)
        """
        if not text:
            return "", ""
        
        # 1. Limpa texto preservando estrutura
        original_clean = re.sub(r'\s+', ' ', text).strip()
        
        # 2. Extrai e protege entidades
        entities = self._extract_protected_entities(original_clean)
        protected_text, placeholders = self._protect_entities(original_clean.lower(), entities)
        
        # 3. Remove pontuação (mantém underscores)
        protected_text = re.sub(r'[^\w\s_]', '', protected_text)
        
        # 4. Tokeniza
        words = protected_text.split()
        
        # 5. Stemming seletivo
        processed_words = []
        for word in words:
            if word.startswith('__ENTITY_'):
                processed_words.append(word)
            elif word not in self.stop_words:
                processed_words.append(self.stemmer.stem(word))
        
        processed_text = " ".join(processed_words)
        
        # 6. Restaura entidades
        processed_text = self._restore_entities(processed_text, placeholders)
        
        return processed_text, original_clean

    async def analyze_email(self, body: str, subject: str = "") -> dict:
        """Análise de email individual"""
        processed_body, clean_body = self._smart_preprocess(body)
        processed_subject, clean_subject = self._smart_preprocess(subject)
        
        full_content_original = f"Assunto: {clean_subject}\n\n{clean_body}"
        full_content_processed = f"Assunto processado: {processed_subject}\n\nCorpo processado: {processed_body}"
        
        prompt = f"""Você é um assistente que classifica emails corporativos recebidos e sugere respostas.

IMPORTANTE: Você está recebendo um EMAIL que CHEGOU para análise. A pessoa que ENVIOU este email é o REMETENTE, e você deve responder PARA ELE.

**EMAIL ORIGINAL RECEBIDO:**
{full_content_original}

**VERSÃO PRÉ-PROCESSADA (para análise NLP):**
{full_content_processed}

**INSTRUÇÕES:**

1. **CLASSIFICAÇÃO:**
   - "Improdutivo": Spam, marketing, felicitações genéricas, newsletters, pesquisas
   - "Produtivo": Dúvidas, problemas técnicos, solicitações financeiras, RH, suporte

2. **GERAR RESPOSTA:**
   - Use o email ORIGINAL para extrair nomes, valores e contexto exatos
   - A resposta é PARA QUEM ENVIOU o email (o remetente)
   - Se houver assinatura no final, responda para aquela pessoa
   - Use tom profissional e objetivo
   - Seja direto: confirme recebimento e próximos passos
   - NÃO invente informações que não estão no email
   - NÃO repita todo o conteúdo do email na resposta

3. **ESTRUTURA DA RESPOSTA:**
   - Cumprimento ao remetente
   - Confirmação do recebimento
   - Ação que será tomada (se Produtivo)
   - Fechamento breve

**EXEMPLOS:**

Email recebido: "Olá, sou João. Preciso de suporte com erro 404."
Resposta correta: "Prezado João, recebemos sua solicitação sobre o erro 404. Nossa equipe técnica irá analisar e retornaremos em breve com uma solução. Atenciosamente."

Email recebido: "Feliz Natal! - Maria"  
Resposta correta: "Prezada Maria, agradecemos a mensagem. Feliz Natal para você também!"

**RETORNE APENAS JSON:**
{{"category": "Produtivo ou Improdutivo", "response": "Sua resposta aqui"}}
"""

        try:
            response = await self.client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                response_format={"type": "json_object"},
                messages=[
                    {"role": "system", "content": prompt}
                ],
                temperature=0.2,  # Mais determinístico
                max_tokens=500
            )
            
            content = json.loads(response.choices[0].message.content)
            
            return {
                "category": content.get("category", "Erro"),
                "suggested_response": content.get("response", "Não foi possível gerar resposta"),
                "original_body": body,
                "confidence": 1.0
            }

        except Exception as e:
            LogService.error(f"Erro na análise: {str(e)}")
            return {
                "category": "Erro", 
                "suggested_response": "Falha na análise. Tente novamente.",
                "original_body": body,
                "error": str(e)
            }

    async def analyze_batch_json(self, emails: list[EmailInput]):
        """Análise em lote de emails estruturados"""
        tasks = [self.analyze_email(email.body, email.subject) for email in emails]
        results = await asyncio.gather(*tasks)
        return results

    async def analyze_unstructured_text(self, text: str) -> list:
        """Análise de texto não estruturado"""
        
        prompt = f"""Você analisa emails extraídos de arquivos (PDF/TXT) que podem conter formatação ruim.

**TEXTO EXTRAÍDO:**
{text[:15000]}

**SUA TAREFA:**
1. Identificar emails/mensagens reais (ignore headers, footers, metadados de sistema)
2. Para cada email encontrado:
   - Extrair assunto (se houver)
   - Extrair corpo limpo da mensagem
   - Identificar quem ENVIOU (olhe pela assinatura no final)
   - Classificar como Produtivo ou Improdutivo
   - Sugerir resposta PARA QUEM ENVIOU

**REGRAS:**
- Preserve nomes exatos
- Não invente informações
- Resposta deve ser para o remetente identificado
- Ignore "Enviado de iPhone", datas, disclaimers automáticos

**RETORNE JSON:**
{{
  "emails": [
    {{
      "subject": "Assunto ou 'Sem assunto'",
      "original_preview": "Corpo limpo (max 300 chars)",
      "sender": "Nome do remetente identificado ou 'Não identificado'",
      "category": "Produtivo ou Improdutivo",
      "response": "Resposta para o remetente"
    }}
  ]
}}
"""

        try:
            response = await self.client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                response_format={"type": "json_object"},
                messages=[
                    {"role": "system", "content": prompt}
                ],
                temperature=0.2,
                max_tokens=2000
            )
            
            data = json.loads(response.choices[0].message.content)
            emails = data.get("emails", [])
            
            for email in emails:
                email.setdefault("confidence", 0.95)
                email.setdefault("category", "Erro")
                email.setdefault("response", "Não foi possível gerar resposta")
                email.setdefault("sender", "Não identificado")
            
            return emails

        except Exception as e:
            LogService.error(f"Erro AI Unstructured: {str(e)}")
            return [{
                "subject": "Erro",
                "original_preview": text[:200],
                "category": "Erro",
                "response": f"Falha na análise: {str(e)}",
                "confidence": 0.0
            }]