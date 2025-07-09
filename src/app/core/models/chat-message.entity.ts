export interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  isTyping?: boolean;
}

export interface ChatbotIntent {
  intent: string;
  confidence: number;
  entities?: any[];
  action?: string;
  endpoint?: string;
  params?: any;
}
