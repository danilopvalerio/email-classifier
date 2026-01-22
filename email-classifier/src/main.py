from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.features.analysis.router import router as analysis_router
from src.features.logger.router import router as logger_router

# Metadados da API (aparecem no Swagger)
app = FastAPI(
    title="Email AI Classifier",
    description="API para triagem automática de emails corporativos utilizando LLMs.",
    version="1.0.0"
)

# Configuração de CORS
# Permite que seu frontend (Next.js) acesse o backend sem bloqueios
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Em produção, substitua pela URL do Vercel
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registro de Rotas (Modularização)
app.include_router(analysis_router)
app.include_router(logger_router)

@app.get("/", tags=["Health"])
def health_check():
    """Rota de verificação de status (Health Check)."""
    return {
        "status": "online",
        "service": "Email AI Classifier",
        "mode": "Production-Ready"
    }