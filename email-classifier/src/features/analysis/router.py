from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import List
from src.features.analysis.service import AnalysisService
from src.features.analysis.controller import AnalysisController 
from src.features.analysis.schemas import EmailInput

router = APIRouter(prefix="/analysis", tags=["Analysis"])
service = AnalysisService()
controller = AnalysisController() 

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
    return await controller.parse_and_process_file(file)

@router.get("/health")
async def health_check():
    """Rota leve para verificar se a API está online."""
    return {"status": "ok", "message": "Service is ready"}