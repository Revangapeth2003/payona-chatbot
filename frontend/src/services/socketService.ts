import { io, Socket } from 'socket.io-client';

interface ServerToClientEvents {
  'initial-messages': (messages: Message[]) => void;
  'new-message': (message: Message) => void;
  'conversation-state': (state: ConversationState) => void;
  'typing-status': (status: TypingStatus) => void;
  'show-options': (options: ChatOption[]) => void;  // ← ADDED
  'processing-status': (status: ProcessingStatus) => void;  // ← ADDED
  'trigger-file-upload': () => void;  // ← ADDED
  'error': (error: { message: string }) => void;
  connect: () => void;
  disconnect: (reason: string) => void;
  connect_error: (error: Error) => void;
  reconnect: (attemptNumber: number) => void;
  reconnect_attempt: (attemptNumber: number) => void;
  reconnect_failed: () => void;
}

interface ClientToServerEvents {
  'join-conversation': (conversationId: string) => void;
  'send-message': (data: MessageData) => void;
  'select-option': (data: { option: string; step: number }) => void;  // ← ADDED
  'upload-file': (data: { fileName: string; fileData: string }) => void;  // ← ADDED
  'leave-conversation': (conversationId: string) => void;
  'typing-start': (data: { conversationId: string; userId: string }) => void;
  'typing-stop': (data: { conversationId: string; userId: string }) => void;
}

interface Message {
  _id?: string;
  id: string;
  text: string;
  sender: 'user' | 'bot';  // ← ADDED sender field
  timestamp: string;
  conversationId: string;
  messageType?: 'text' | 'options' | 'summary';
}

interface MessageData {
  conversationId: string;
  message: string;
  sender: 'user' | 'bot';  // ← ADDED sender field
  timestamp?: string;
}

interface ConversationState {
  _id?: string;
  conversationId: string;
  participants: string[];
  status: string;
  createdAt?: string;
  conversationFlow?: {  // ← ADDED conversationFlow
    step: number;
    name: string;
    age: string;
    email: string;
    purpose: string;
    passport: string;
    resume: string | null;
    qualification: string;
    ugMajor: string;
    workExperience: string;
    experienceYears: string;
    germanLanguageUG: string;
    examReadiness: string;
    ugEmailSent: boolean;
    ugProgramContinue: string;
    ugProgramStartTime: string;
    experience: string;
    interestedInCategories: string;
    germanLanguage: string;
    continueProgram: string;
    programStartTime: string;
    entryYear: string;
    appointmentType: string;
    appointmentTime: string;
    appointmentDate: string;
    appointmentConfirmed: boolean;
    emailSent: boolean;
    isProcessingEmail: boolean;
    needsFinancialSetup: boolean;
    financialJobSupport: string;
    currentFlow: string;
    isProcessingUGEmail: boolean;
  };
}

interface TypingStatus {
  conversationId: string;
  userId: string;
  isTyping: boolean;
}

interface ChatOption {
  text: string;
  value: string;
  icon?: string;
  className?: string;
}

interface ProcessingStatus {
  isProcessing: boolean;
  message: string;
}

class SocketService {
  public socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;  // ← MADE PUBLIC
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;

  constructor() {
    this.socket = null;
    this.isConnected = false;
  }

  connect(serverUrl: string = 'http://localhost:8000'): Socket<ServerToClientEvents, ClientToServerEvents> {
    if (this.socket?.connected) {
      console.log('Socket already connected');
      return this.socket;
    }

    console.log(`🔄 PayOna ChatBot connecting to ${serverUrl}...`);

    this.socket = io(serverUrl, {
      autoConnect: true,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
      timeout: 20000,
      forceNew: true
    });

    this.setupEventListeners();
    return this.socket;
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('✅ PayOna ChatBot connected with ID:', this.socket?.id);
      this.isConnected = true;
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason: string) => {
      console.log('❌ PayOna ChatBot disconnected. Reason:', reason);
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error: Error) => {
      console.error('❌ PayOna ChatBot connection error:', error.message);
      this.isConnected = false;
      this.reconnectAttempts++;

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('❌ Max reconnection attempts reached');
      }
    });

    this.socket.on('error', (error: { message: string }) => {
      console.error('❌ PayOna ChatBot socket error:', error);
    });

    this.socket.on('reconnect', (attemptNumber: number) => {
      console.log(`🔄 PayOna ChatBot reconnected after ${attemptNumber} attempts`);
      this.isConnected = true;
      this.reconnectAttempts = 0;
    });

    this.socket.on('reconnect_attempt', (attemptNumber: number) => {
      console.log(`🔄 PayOna ChatBot reconnection attempt ${attemptNumber}`);
    });

    this.socket.on('reconnect_failed', () => {
      console.error('❌ PayOna ChatBot reconnection failed');
      this.isConnected = false;
    });
  }

  joinConversation(conversationId: string): void {
    if (!this.socket || !this.isConnected) {
      console.error('PayOna ChatBot not connected. Cannot join conversation.');
      return;
    }
    
    console.log(`🚀 Joining PayOna conversation: ${conversationId}`);
    this.socket.emit('join-conversation', conversationId);
  }

  leaveConversation(conversationId: string): void {
    if (!this.socket || !this.isConnected) {
      console.error('PayOna ChatBot not connected. Cannot leave conversation.');
      return;
    }
    
    console.log(`🚪 Leaving PayOna conversation: ${conversationId}`);
    this.socket.emit('leave-conversation', conversationId);
  }

  onInitialMessages(callback: (messages: Message[]) => void): void {
    if (!this.socket) {
      console.error('PayOna ChatBot socket not initialized');
      return;
    }
    
    this.socket.on('initial-messages', callback);
  }

  onNewMessage(callback: (message: Message) => void): void {
    if (!this.socket) {
      console.error('PayOna ChatBot socket not initialized');
      return;
    }
    
    this.socket.on('new-message', callback);
  }

  onConversationState(callback: (state: ConversationState) => void): void {
    if (!this.socket) {
      console.error('PayOna ChatBot socket not initialized');
      return;
    }
    
    this.socket.on('conversation-state', callback);
  }

  onTypingStatus(callback: (status: TypingStatus) => void): void {
    if (!this.socket) {
      console.error('PayOna ChatBot socket not initialized');
      return;
    }
    
    this.socket.on('typing-status', callback);
  }

  sendMessage(data: MessageData): void {
    if (!this.socket || !this.isConnected) {
      console.error('PayOna ChatBot not connected. Cannot send message.');
      return;
    }
    
    const messageData: MessageData = {
      ...data,
      timestamp: data.timestamp || new Date().toISOString()
    };
    
    console.log('📤 Sending PayOna message:', messageData);
    this.socket.emit('send-message', messageData);
  }

  startTyping(conversationId: string, userId: string): void {
    if (!this.socket || !this.isConnected) return;
    this.socket.emit('typing-start', { conversationId, userId });
  }

  stopTyping(conversationId: string, userId: string): void {
    if (!this.socket || !this.isConnected) return;
    this.socket.emit('typing-stop', { conversationId, userId });
  }

  removeListeners(): void {
    if (!this.socket) {
      console.error('PayOna ChatBot socket not initialized');
      return;
    }

    this.socket.off('initial-messages');
    this.socket.off('new-message');
    this.socket.off('conversation-state');
    this.socket.off('typing-status');
    this.socket.off('show-options');  // ← ADDED
    this.socket.off('processing-status');  // ← ADDED
    this.socket.off('trigger-file-upload');  // ← ADDED
    this.socket.off('error');
    
    console.log('🧹 PayOna ChatBot listeners removed');
  }

  disconnect(): void {
    if (this.socket) {
      console.log('🔌 Disconnecting PayOna ChatBot...');
      this.removeListeners();
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.reconnectAttempts = 0;
      console.log('✅ PayOna ChatBot disconnected and cleaned up');
    }
  }

  get connected(): boolean {
    return this.isConnected && this.socket?.connected === true;
  }

  get socketId(): string | undefined {
    return this.socket?.id;
  }

  isSocketReady(): boolean {
    return this.socket !== null && this.isConnected;
  }

  getConnectionStatus(): {
    hasSocket: boolean;
    isConnected: boolean;
    socketId?: string;
    reconnectAttempts: number;
  } {
    return {
      hasSocket: this.socket !== null,
      isConnected: this.isConnected,
      socketId: this.socket?.id,
      reconnectAttempts: this.reconnectAttempts
    };
  }
}

export default new SocketService();
export type { Message, MessageData, ConversationState, TypingStatus, ChatOption, ProcessingStatus };
