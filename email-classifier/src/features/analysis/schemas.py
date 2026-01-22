from pydantic import BaseModel, Field

class EmailInput(BaseModel):
    id: str | int = Field(..., description="ID único do email ou do banco de dados")
    subject: str = Field(..., description="Assunto do email")
    body: str = Field(..., description="Conteúdo/Texto do email")

class AnalysisResult(BaseModel):
    category: str
    suggested_response: str
    confidence: float | None = None