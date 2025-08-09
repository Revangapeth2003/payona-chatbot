export interface Message {
  _id: string;
  conversationId: string;
  sender: 'user' | 'bot';
  text: string;
  metadata?: {
    type?: string;
    data?: any;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface ConversationState {
  step?: string;
  name?: string;
  age?: number;
  email?: string;
  phone?: string;
  program?: string;
  message?: string;
  currentQuestion?: string;
  answers?: Record<string, any>;
  isComplete?: boolean;
  [key: string]: any; // Allow additional properties
}

export interface User {
  _id: string;
  name?: string;
  email?: string;
  phone?: string;
  sessionIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Conversation {
  _id: string;
  userId?: string;
  sessionId: string;
  state: ConversationState;
  isTyping: boolean;
  createdAt: Date;
  updatedAt: Date;
}
