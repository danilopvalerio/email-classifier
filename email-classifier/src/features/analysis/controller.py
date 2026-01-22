import pandas as pd
import io
import pdfplumber
from fastapi import HTTPException, UploadFile
from src.features.analysis.schemas import EmailInput
from src.features.logger.service import LogService
from src.features.analysis.service import AnalysisService

class AnalysisController:
    def __init__(self):
        self.service = AnalysisService()

    async def parse_and_process_file(self, file: UploadFile):
        filename = file.filename.lower()
        content_bytes = await file.read()
        final_response = []

        try:
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

                    results = await self.service.analyze_batch_json(inputs)

                    for inp, res in zip(inputs, results):
                        final_response.append({
                            "id": inp.id,
                            "original_subject": inp.subject,
                            "original_preview": res.get("original_body") or inp.body, 
                            "category": res.get("category"),
                            "suggested_response": res.get("suggested_response")
                        })
                except Exception as e:
                    raise HTTPException(400, f"Erro ao ler CSV: {str(e)}")

            elif filename.endswith('.pdf'):
                try:
                    full_text = ""
                    with pdfplumber.open(io.BytesIO(content_bytes)) as pdf:
                        for i, page in enumerate(pdf.pages):
                            try:
                                extracted = page.extract_text()
                                if extracted:
                                    full_text += extracted + "\n\n"
                            except Exception as e:
                                LogService.warning(f"Erro página {i+1} PDF: {e}")
                                continue
                    
                    if not full_text.strip():
                        raise HTTPException(400, "PDF vazio ou imagem escaneada.")

                    ia_results = await self.service.analyze_unstructured_text(full_text)
                    
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
                    raise HTTPException(400, f"Erro ao processar PDF: {str(e)}")

            elif filename.endswith('.txt'):
                try:
                    full_text = content_bytes.decode("utf-8")
                    ia_results = await self.service.analyze_unstructured_text(full_text)
                    
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
            LogService.error(f"Erro genérico no controller: {e}")
            raise HTTPException(500, f"Erro interno: {str(e)}")