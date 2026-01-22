from pydantic import BaseModel, Field

class EmailInput(BaseModel):
    id: str | int = Field(...)
    subject: str = Field(...)
    body: str = Field(...)

class AnalysisResult(BaseModel):
    category: str
    suggested_response: str
    confidence: float | None = None