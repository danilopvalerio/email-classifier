from pydantic import BaseModel, Field
from typing import Optional

class EmailInput(BaseModel):
    id: str | int = Field(...)
    subject: str = Field(...)
    body: str = Field(...)

class AnalysisResult(BaseModel):
    category: str
    suggested_response: str
    original_body: Optional[str] = None
    confidence: float | None = None