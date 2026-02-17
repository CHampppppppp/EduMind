// Module 1: Knowledge Base (RAG)
export interface KnowledgeItem {
  id: string;
  title: string;
  type: 'pdf' | 'video' | 'image' | 'audio' | 'document' | string;
  url: string;
  uploadDate: string;
  status: 'processing' | 'ready' | 'error';
  summary?: string;
}

// Module 2: Interface (Chat)
export type AIModel = 'kimi-k2.5' | 'deepseek-v4' | 'deepseek-v3-reasoner';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  type: 'text' | 'audio';
  timestamp: string;
  attachments?: string[]; // IDs of KnowledgeItems
  model?: AIModel; // The model used to generate this response
  thinking?: string; // Chain of thought for reasoning models
  thinkingCollapsed?: boolean; // Whether thinking is collapsed
}

export interface ChatSession {
  id: string;
  title: string;
  created_at: string;
}

// Module 3: Brain (Intent & Analysis)
export interface TeachingIntent {
  topic: string;
  audience: string;
  duration: number; // minutes
  keyPoints: string[];
  style: string;
}

export interface AnalysisResult {
  intent: TeachingIntent;
  materialsUsed: string[]; // IDs of KnowledgeItems
  structure: {
    section: string;
    points: string[];
  }[];
  modelUsed: AIModel;
}

// Module 4: Factory (Generation)
export interface Slide {
  id: string;
  title: string;
  content: string; // Markdown or HTML
  notes: string; // For the lesson plan
  layout: 'title' | 'content' | 'split' | 'image' | 'summary';
  image?: string;
}

export interface InteractiveGame {
  id: string;
  type: 'sorting' | 'quiz' | 'matching';
  config: any; // Game specific config
  previewUrl: string;
}

export interface GeneratedContent {
  id: string;
  slides: Slide[];
  lessonPlan: string; // Full text
  games: InteractiveGame[];
}

// Module 5: Loop (Feedback)
export interface Feedback {
  slideId?: string;
  instruction: string; // "Make this simpler"
  status: 'pending' | 'applied';
}
