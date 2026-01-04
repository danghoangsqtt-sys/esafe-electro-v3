

export enum QuestionType {
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  ESSAY = 'ESSAY',
}

export interface QuestionFolder {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
}

export interface Question {
  id: string;
  folderId: string;
  category: string;
  type: QuestionType;
  content: string;
  options?: string[]; 
  correctAnswer: string;
  explanation: string;
  createdAt: number;
  bloomLevel?: string;
}

export interface PdfMetadata {
  title?: string;
  author?: string;
  creationDate?: string;
  producer?: string;
}

export interface DocumentFile {
  id: string;
  name: string;
  url: string; 
  type: string;
  uploadDate: string;
  isProcessed?: boolean; 
  metadata?: PdfMetadata;
}

export interface VectorChunk {
  id: string;
  docId: string;
  text: string;
  embedding: number[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  sources?: { uri: string; title: string }[]; 
  isRAG?: boolean; 
}

export interface AppSettings {
  modelName: string;
  manualApiKey?: string;
  aiVoice: string;
  temperature: number;
  maxOutputTokens: number;
  autoSave: boolean;
  ragTopK: number;
  thinkingBudget: number; 
  systemExpertise: 'ACADEMIC' | 'FIELD_EXPERT' | 'STUDENT_ASSISTANT';
  debugMode?: boolean;
}

export interface AppVersionInfo {
  currentVersion: string;
  latestVersion: string;
  releaseDate: string;
  changelog: string;
  updateUrl: string;
  isUpdateAvailable: boolean;
}

export interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  date: string;
  source: string;
}
