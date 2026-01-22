from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import List
from src.features.analysis.service import AnalysisService
from src.features.analysis.schemas import EmailInput
from src.features.logger.service import LogService
import pandas as pd
import io

router = APIRouter(prefix="/analysis", tags=["Analysis"])
service = AnalysisService()

@router.post("/process")
async def process_single(
    subject: str = Form(""), 
    text: str = Form(None), 
    file: UploadFile = File(None)
):
    """
    Processa um único email. Aceita texto direto ou upload de arquivo .txt/.pdf
    """
    content = ""
    
    # 1. Extração do conteúdo
    if text:
        content = text
    elif file:
        try:
            file_content = await file.read()
            content = file_content.decode("utf-8")
        except Exception:
            raise HTTPException(status_code=400, detail="Arquivo inválido. Envie um arquivo de texto UTF-8.")
    
    if not content:
        raise HTTPException(status_code=400, detail="Envie texto ou arquivo para análise.")

    result = await service.analyze_email(body=content, subject=subject)
    
    return {
        "success": True, 
        "data": result
    }


@router.post("/batch-json")
async def process_batch_json(emails: List[EmailInput]):
    """
    Recebe uma lista estruturada de emails (id, subject, body).
    Ideal para integrações via API REST.
    """
    LogService.info(f"Iniciando lote JSON com {len(emails)} itens.")

    if len(emails) > 50:
        raise HTTPException(status_code=400, detail="Limite de 50 emails por requisição excedido.")

    results = await service.analyze_batch_json(emails)
    
    final_response = []
    for input_email, result in zip(emails, results):
        final_response.append({
            "id": input_email.id,
            "original_subject": input_email.subject,
            "category": result.get("category"),
            "suggested_response": result.get("suggested_response") 
        })

    return {
        "total": len(emails),
        "results": final_response
    }


@router.post("/bulk")
async def process_bulk_csv(file: UploadFile = File(...)):
    """
    Lê um arquivo CSV, identifica colunas de texto e processa em massa.
    """
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Apenas arquivos .csv são suportados.")

    LogService.info(f"Recebido arquivo CSV: {file.filename}")
    content = await file.read()

    try:
        df = pd.read_csv(io.BytesIO(content))
        
        cols_lower = [c.lower() for c in df.columns]
        
        possible_body = ['corpo', 'mensagem', 'body', 'text', 'conteudo', 'email']
        col_body = next((df.columns[i] for i, c in enumerate(cols_lower) if c in possible_body), None)
        
        possible_subj = ['assunto', 'subject', 'titulo', 'tema']
        col_subj = next((df.columns[i] for i, c in enumerate(cols_lower) if c in possible_subj), None)

        if not col_body:
            col_body = df.columns[0]
        
        inputs = []
        for idx, row in df.iterrows():
            if idx >= 20: break 
            
            body_text = str(row[col_body])
            subj_text = str(row[col_subj]) if col_subj else "Sem Assunto"
            
            inputs.append(EmailInput(
                id=str(idx + 1),
                subject=subj_text,
                body=body_text
            ))

        results = await service.analyze_batch_json(inputs)

        final_response = []
        for inp, res in zip(inputs, results):
            final_response.append({
                "id": inp.id,
                "original_subject": inp.subject,
                "original_preview": inp.body[:60] + "...",
                "category": res.get("category"),
                "suggested_response": res.get("suggested_response") 
            })

        return {
            "total_processed": len(inputs),
            "results": final_response
        }

    except Exception as e:
        LogService.error(f"Erro no processamento CSV: {e}")
        raise HTTPException(status_code=500, detail="Erro interno ao processar o arquivo CSV.")