from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import List
from src.features.analysis.service import AnalysisService
from src.features.analysis.schemas import EmailInput
from src.features.logger.service import LogService
import pandas as pd
import io
import pdfplumber  # <--- TROCAMOS AQUI

router = APIRouter(prefix="/analysis", tags=["Analysis"])
service = AnalysisService()

@router.post("/process")
async def process_single(
    subject: str = Form(""), 
    text: str = Form(None), 
    file: UploadFile = File(None)
):
    content = ""
    if text:
        content = text
    elif file:
        try:
            file_content = await file.read()
            content = file_content.decode("utf-8")
        except Exception:
            raise HTTPException(status_code=400, detail="Arquivo inválido.")
    
    if not content:
        raise HTTPException(status_code=400, detail="Sem conteúdo.")

    result = await service.analyze_email(body=content, subject=subject)
    
    return {
        "success": True, 
        "data": result
    }

@router.post("/batch-json")
async def process_batch_json(emails: List[EmailInput]):
    if len(emails) > 50:
        raise HTTPException(status_code=400, detail="Limite excedido.")

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

@router.post("/file-upload")
async def process_file_upload(file: UploadFile = File(...)):
    filename = file.filename.lower()
    content_bytes = await file.read()
    
    final_response = []

    try:
        # --- PROCESSAMENTO CSV ---
        if filename.endswith('.csv'):
            try:
                df = pd.read_csv(io.BytesIO(content_bytes))
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
                    inputs.append(EmailInput(id=str(idx + 1), subject=subj_text, body=body_text))

                results = await service.analyze_batch_json(inputs)

                for inp, res in zip(inputs, results):
                    final_response.append({
                        "id": inp.id,
                        "original_subject": inp.subject,
                        "original_preview": inp.body[:60] + "...",
                        "category": res.get("category"),
                        "suggested_response": res.get("suggested_response")
                    })
            except Exception as e:
                raise HTTPException(400, f"Erro ao ler CSV: {str(e)}")

        # --- PROCESSAMENTO PDF (AGORA COM PDFPLUMBER) ---
        elif filename.endswith('.pdf'):
            try:
                full_text = ""
                # O pdfplumber abre o arquivo direto do bytes
                with pdfplumber.open(io.BytesIO(content_bytes)) as pdf:
                    for i, page in enumerate(pdf.pages):
                        try:
                            # extract_text do plumber é muito mais seguro
                            extracted = page.extract_text()
                            if extracted:
                                full_text += extracted + "\n\n"
                        except Exception as e:
                            LogService.warning(f"Erro ao ler página {i+1} do PDF: {e}")
                            continue
                
                if not full_text.strip():
                    raise HTTPException(400, "O PDF parece vazio ou é uma imagem escaneada (sem texto selecionável).")

                ia_results = await service.analyze_unstructured_text(full_text)
                
                for i, res in enumerate(ia_results):
                    final_response.append({
                        "id": f"pdf-{i+1}",
                        "original_subject": res.get("subject"),
                        "original_preview": res.get("original_preview"),
                        "category": res.get("category"),
                        "suggested_response": res.get("response")
                    })

            except HTTPException as he:
                raise he
            except Exception as e:
                raise HTTPException(400, f"Erro crítico ao ler PDF: {str(e)}")

        # --- PROCESSAMENTO TXT ---
        elif filename.endswith('.txt'):
            try:
                full_text = content_bytes.decode("utf-8")
                ia_results = await service.analyze_unstructured_text(full_text)
                
                for i, res in enumerate(ia_results):
                    final_response.append({
                        "id": f"txt-{i+1}",
                        "original_subject": res.get("subject"),
                        "original_preview": res.get("original_preview"),
                        "category": res.get("category"),
                        "suggested_response": res.get("response")
                    })
            except Exception as e:
                raise HTTPException(400, f"Erro ao ler TXT: {str(e)}")

        else:
            raise HTTPException(400, "Formato não suportado. Use .csv, .pdf ou .txt")
        
        return {
            "total_processed": len(final_response),
            "results": final_response
        }

    except HTTPException as he:
        raise he
    except Exception as e:
        LogService.error(f"Erro upload genérico: {e}")
        raise HTTPException(500, f"Erro interno no servidor: {str(e)}")