import { Server, Socket } from 'socket.io';

export class SocketService {
  private io: Server;

  constructor(io: Server) {
    this.io = io;
    this.initializeSocketEvents();
  }

  private initializeSocketEvents(): void {
    this.io.on('connection', (socket: Socket) => {
      console.log('New client connected:', socket.id);

      socket.on('joinConversation', async (sessionId: string) => {
        try {
          socket.join(sessionId);
          console.log(`Client ${socket.id} joined conversation ${sessionId}`);
          
          // Send initial empty data
          socket.emit('initialMessages', []);
          socket.emit('conversationState', {});
          socket.emit('typingStatus', false);
        } catch (error) {
          console.error('Error joining conversation:', error);
          socket.emit('error', { message: 'Failed to join conversation' });
        }
      });

      socket.on('userMessage', async (data: { sessionId: string; text: string }) => {
        try {
          const { sessionId, text } = data;
          
          if (!sessionId || !text?.trim()) {
            socket.emit('error', { message: 'Invalid message data' });
            return;
          }
          
          // Echo the message back for testing
          const userMessage = {
            _id: `msg_${Date.now()}`,
            conversationId: sessionId,
            sender: 'user',
            text,
            createdAt: new Date(),
            updatedAt: new Date()
          };

          this.io.to(sessionId).emit('newMessage', userMessage);

          // Send a bot response after 1 second
          setTimeout(() => {
            const botMessage = {
              _id: `msg_${Date.now()}_bot`,
              conversationId: sessionId,
              sender: 'bot',
              text: `You said: "${text}"`,
              createdAt: new Date(),
              updatedAt: new Date()
            };
            this.io.to(sessionId).emit('newMessage', botMessage);
          }, 1000);

        } catch (error) {
          console.error('Error handling user message:', error);
          socket.emit('error', { message: 'Failed to process message' });
        }
      });

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });
    });
  }
}
