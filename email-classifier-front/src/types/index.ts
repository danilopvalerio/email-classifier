export type AppMode = "single" | "batch" | "files";

export type EmailForm = {
  id: string;
  subject: string;
  body: string;
  senderName: string;
};

export type AnalysisResult = {
  id?: string | number;
  category: string;
  suggested_response: string;
  original_preview?: string;
  original_subject?: string;
};

export type SingleApiResponse = {
  success: boolean;
  data: {
    category: string;
    suggested_response: string;
    confidence?: number;
  };
};

export type BatchApiResponse = {
  total?: number;
  total_processed?: number;
  results: AnalysisResult[];
};
