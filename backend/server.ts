import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';

const app = express();
const server = createServer(app);

// CORS middleware for Express
app.use(cors({
  origin: "http://localhost:3000",
  methods: ["GET", "POST"],
  credentials: true
}));

// Socket.IO server with CORS and TypeScript interfaces
interface ServerToClientEvents {
  'initial-messages': (messages: Message[]) => void;
  'new-message': (message: Message) => void;
  'conversation-state': (state: ConversationState) => void;
  'typing-status': (status: TypingStatus) => void;
  'error': (error: { message: string }) => void;
}

interface ClientToServerEvents {
  'join-conversation': (conversationId: string) => void;
  'send-message': (data: MessageData) => void;
  'leave-conversation': (conversationId: string) => void;
  'typing-start': (data: { conversationId: string; userId: string }) => void;
  'typing-stop': (data: { conversationId: string; userId: string }) => void;
}

interface InterServerEvents {}

interface SocketData {
  userId?: string;
  conversationId?: string;
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
  createdAt: string;
  status: string;
}

interface TypingStatus {
  conversationId: string;
  userId: string;
  isTyping: boolean;
}

const io = new SocketIOServer<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// In-memory storage (use database in production)
const conversations = new Map<string, ConversationState>();
const messages = new Map<string, Message[]>();
const typingUsers = new Map<string, Set<string>>();

// Helper functions
const generateMessageId = (): string => Math.random().toString(36).substr(2, 9);

const getConversationMessages = (conversationId: string): Message[] => {
  if (!messages.has(conversationId)) {
    messages.set(conversationId, []);
  }
  return messages.get(conversationId)!;
};

const addMessageToConversation = (conversationId: string, message: Message): void => {
  const conversationMessages = getConversationMessages(conversationId);
  conversationMessages.push(message);
  messages.set(conversationId, conversationMessages);
};

const getOrCreateConversation = (conversationId: string): ConversationState => {
  if (!conversations.has(conversationId)) {
    conversations.set(conversationId, {
      conversationId,
      participants: [],
      createdAt: new Date().toISOString(),
      status: 'active'
    });
  }
  return conversations.get(conversationId)!;
};

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`✅ User connected: ${socket.id}`);
  
  // Join conversation
  socket.on('join-conversation', (conversationId: string) => {
    try {
      console.log(`👋 User ${socket.id} joining conversation: ${conversationId}`);
      
      // Join the socket room
      socket.join(conversationId);
      
      // Get or create conversation
      const conversation = getOrCreateConversation(conversationId);
      
      // Add user to participants if not already there
      if (!conversation.participants.includes(socket.id)) {
        conversation.participants.push(socket.id);
      }
      
      // Send initial messages to the user
      const conversationMessages = getConversationMessages(conversationId);
      socket.emit('initial-messages', conversationMessages);
      
      // Send conversation state
      socket.emit('conversation-state', conversation);
      
      // Notify others in the room
      socket.to(conversationId).emit('conversation-state', conversation);
      
      // Send welcome message (optional)
      const welcomeMessage: Message = {
        id: generateMessageId(),
        text: `Welcome to conversation ${conversationId}!`,
        user: 'System',
        timestamp: new Date().toISOString(),
        conversationId: conversationId
      };
      
      socket.emit('new-message', welcomeMessage);
      
      console.log(`✅ User ${socket.id} successfully joined ${conversationId}`);
      
    } catch (error) {
      console.error('Error joining conversation:', error);
      socket.emit('error', { message: 'Failed to join conversation' });
    }
  });

  // Handle new messages
  socket.on('send-message', (data: MessageData) => {
    try {
      console.log('📨 Received message:', data);
      
      const { conversationId, message, user, timestamp } = data;
      
      if (!conversationId || !message) {
        socket.emit('error', { message: 'Invalid message data' });
        return;
      }
      
      // Create message object
      const newMessage: Message = {
        id: generateMessageId(),
        text: message,
        user: user || socket.id,
        timestamp: timestamp || new Date().toISOString(),
        conversationId: conversationId
      };
      
      // Store message
      addMessageToConversation(conversationId, newMessage);
      
      // Broadcast message to all users in the conversation (including sender)
      io.to(conversationId).emit('new-message', newMessage);
      
      console.log(`📤 Message broadcasted to conversation ${conversationId}`);
      
    } catch (error) {
      console.error('Error handling message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Handle typing indicators
  socket.on('typing-start', (data: { conversationId: string; userId: string }) => {
    const { conversationId, userId } = data;
    
    // Store typing status
    if (!typingUsers.has(conversationId)) {
      typingUsers.set(conversationId, new Set());
    }
    typingUsers.get(conversationId)!.add(userId);
    
    // Broadcast to others in the room
    socket.to(conversationId).emit('typing-status', {
      conversationId,
      userId,
      isTyping: true
    });
  });

  socket.on('typing-stop', (data: { conversationId: string; userId: string }) => {
    const { conversationId, userId } = data;
    
    // Remove typing status
    if (typingUsers.has(conversationId)) {
      typingUsers.get(conversationId)!.delete(userId);
    }
    
    // Broadcast to others in the room
    socket.to(conversationId).emit('typing-status', {
      conversationId,
      userId,
      isTyping: false
    });
  });

  // Handle leaving conversation
  socket.on('leave-conversation', (conversationId: string) => {
    try {
      console.log(`👋 User ${socket.id} leaving conversation: ${conversationId}`);
      
      socket.leave(conversationId);
      
      // Remove from participants
      if (conversations.has(conversationId)) {
        const conversation = conversations.get(conversationId)!;
        conversation.participants = conversation.participants.filter(id => id !== socket.id);
        
        // Notify others
        socket.to(conversationId).emit('conversation-state', conversation);
      }
      
      // Remove from typing users
      if (typingUsers.has(conversationId)) {
        typingUsers.get(conversationId)!.delete(socket.id);
      }
      
    } catch (error) {
      console.error('Error leaving conversation:', error);
    }
  });

  // Handle disconnection
  socket.on('disconnect', (reason: string) => {
    console.log(`❌ User disconnected: ${socket.id}. Reason: ${reason}`);
    
    // Clean up user from all conversations
    conversations.forEach((conversation, conversationId) => {
      if (conversation.participants.includes(socket.id)) {
        conversation.participants = conversation.participants.filter(id => id !== socket.id);
        
        // Notify others in the conversation
        socket.to(conversationId).emit('conversation-state', conversation);
      }
    });
    
    // Clean up typing status
    typingUsers.forEach((users, conversationId) => {
      if (users.has(socket.id)) {
        users.delete(socket.id);
        socket.to(conversationId).emit('typing-status', {
          conversationId,
          userId: socket.id,
          isTyping: false
        });
      }
    });
  });
});

// Basic health check endpoint
app.get('/health', (req: express.Request, res: express.Response) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    connections: io.engine.clientsCount 
  });
});

// Start server
const PORT: number = parseInt(process.env.PORT || '3001', 10);
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check available at http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
