export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export interface Story {
  content: string;
  lastModified: Date;
}

export interface DrawingData {
  canvasData: string; // Base64 encoded canvas data
  timestamp: Date;
}

