from fastapi import APIRouter

router = APIRouter(prefix="/logs", tags=["Observability"])

@router.get("/")
def get_recent_logs():
    """Retorna as últimas 50 linhas de log para auditoria rápida."""
    try:
        with open("app.log", "r") as f:
            lines = f.readlines()
        return {"logs": lines[-50:]}
    except FileNotFoundError:
        return {"logs": ["Arquivo de log ainda não criado."]}