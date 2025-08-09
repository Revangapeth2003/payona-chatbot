import { io, Socket } from 'socket.io-client';

interface ServerToClientEvents {
  'initial-messages': (messages: Message[]) => void;
  'new-message': (message: Message) => void;
  'conversation-state': (state: ConversationState) => void;
  'typing-status': (status: TypingStatus) => void;
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
  'leave-conversation': (conversationId: string) => void;
  'typing-start': (data: { conversationId: string; userId: string }) => void;
  'typing-stop': (data: { conversationId: string; userId: string }) => void;
}

interface Message {
  id: string;
  text: string;
  user: string;
  timestamp: string;
  conversationId: string;
}

interface MessageData {
  conversationId: string;
  message: string;
  user?: string;
  timestamp?: string;
}

interface ConversationState {
  conversationId: string;
  participants: string[];
  status: string;
}

interface TypingStatus {
  conversationId: string;
  userId: string;
  isTyping: boolean;
}

class SocketService {
  private socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;

  constructor() {
    this.socket = null;
    this.isConnected = false;
  }

  // Initialize connection
  connect(serverUrl: string = 'http://localhost:3001'): Socket<ServerToClientEvents, ClientToServerEvents> {
    if (this.socket?.connected) {
      console.log('Socket already connected');
      return this.socket;
    }

    console.log(`🔄 Attempting to connect to ${serverUrl}...`);

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
      console.log('✅ Socket connected with ID:', this.socket?.id);
      this.isConnected = true;
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason: string) => {
      console.log('❌ Socket disconnected. Reason:', reason);
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error: Error) => {
      console.error('❌ Connection Error:', error.message);
      console.error('Error Details:', error);
      this.isConnected = false;
      this.reconnectAttempts++;

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('❌ Max reconnection attempts reached. Giving up.');
      }
    });

    // Note: 'error' event is handled differently in Socket.IO v4+
    // It's automatically included in ServerToClientEvents interface
    this.socket.on('error', (error: { message: string }) => {
      console.error('❌ Socket Error:', error);
    });

    this.socket.on('reconnect', (attemptNumber: number) => {
      console.log(`🔄 Reconnected after ${attemptNumber} attempts`);
      this.isConnected = true;
      this.reconnectAttempts = 0;
    });

    this.socket.on('reconnect_attempt', (attemptNumber: number) => {
      console.log(`🔄 Reconnection attempt ${attemptNumber}`);
    });

    this.socket.on('reconnect_failed', () => {
      console.error('❌ Reconnection failed after maximum attempts');
      this.isConnected = false;
    });
  }

  // Join conversation method
  joinConversation(conversationId: string): void {
    if (!this.socket || !this.isConnected) {
      console.error('Socket not connected. Cannot join conversation.');
      return;
    }
    
    console.log(`🚀 Joining conversation: ${conversationId}`);
    this.socket.emit('join-conversation', conversationId);
  }

  // Leave conversation method
  leaveConversation(conversationId: string): void {
    if (!this.socket || !this.isConnected) {
      console.error('Socket not connected. Cannot leave conversation.');
      return;
    }
    
    console.log(`🚪 Leaving conversation: ${conversationId}`);
    this.socket.emit('leave-conversation', conversationId);
  }

  // Event listener methods
  onInitialMessages(callback: (messages: Message[]) => void): void {
    if (!this.socket) {
      console.error('Socket not initialized');
      return;
    }
    
    this.socket.on('initial-messages', callback);
  }

  onNewMessage(callback: (message: Message) => void): void {
    if (!this.socket) {
      console.error('Socket not initialized');
      return;
    }
    
    this.socket.on('new-message', callback);
  }

  onConversationState(callback: (state: ConversationState) => void): void {
    if (!this.socket) {
      console.error('Socket not initialized');
      return;
    }
    
    this.socket.on('conversation-state', callback);
  }

  onTypingStatus(callback: (status: TypingStatus) => void): void {
    if (!this.socket) {
      console.error('Socket not initialized');
      return;
    }
    
    this.socket.on('typing-status', callback);
  }

  // Send message method
  sendMessage(data: MessageData): void {
    if (!this.socket || !this.isConnected) {
      console.error('Socket not connected. Cannot send message.');
      return;
    }
    
    const messageData: MessageData = {
      ...data,
      timestamp: data.timestamp || new Date().toISOString()
    };
    
    console.log('📤 Sending message:', messageData);
    this.socket.emit('send-message', messageData);
  }

  // Typing indicators
  startTyping(conversationId: string, userId: string): void {
    if (!this.socket || !this.isConnected) return;
    
    this.socket.emit('typing-start', { conversationId, userId });
  }

  stopTyping(conversationId: string, userId: string): void {
    if (!this.socket || !this.isConnected) return;
    
    this.socket.emit('typing-stop', { conversationId, userId });
  }

  // Remove listeners method
  removeListeners(): void {
    if (!this.socket) {
      console.error('Socket not initialized');
      return;
    }

    // Remove all custom event listeners
    this.socket.off('initial-messages');
    this.socket.off('new-message');
    this.socket.off('conversation-state');
    this.socket.off('typing-status');
    this.socket.off('error');
    
    console.log('🧹 All listeners removed');
  }

  // Disconnect and cleanup
  disconnect(): void {
    if (this.socket) {
      console.log('🔌 Disconnecting socket...');
      this.removeListeners();
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.reconnectAttempts = 0;
      console.log('✅ Socket disconnected and cleaned up');
    }
  }

  // Getter methods
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

// Export a singleton instance
export default new SocketService();

// Export types for use in other components
export type { Message, MessageData, ConversationState, TypingStatus };
