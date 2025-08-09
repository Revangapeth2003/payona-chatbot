import React, { useEffect, useState, useCallback, useRef } from 'react';
import socketService, { Message, MessageData, ConversationState, TypingStatus } from '../services/socketService';

interface ChatBotProps {
  userId?: string;
  conversationId?: string;
  serverUrl?: string;
}

const ChatBot: React.FC<ChatBotProps> = ({ 
  userId = 'anonymous',
  conversationId = 'default-conversation',
  serverUrl = 'http://localhost:3001'
}) => {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [connectionError, setConnectionError] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [conversationState, setConversationState] = useState<ConversationState | null>(null);
  
  // Fix: Provide initial value for useRef
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Initialize socket connection
  useEffect(() => {
    console.log('🔄 Initializing ChatBot component...');
    
    const socket = socketService.connect(serverUrl);

    // Connection status handlers with proper typing
    socket.on('connect', () => {
      console.log('✅ ChatBot connected successfully');
      setIsConnected(true);
      setConnectionError('');
      
      setTimeout(() => {
        socketService.joinConversation(conversationId);
      }, 100);
    });

    // Fix: Properly type the reason parameter
    socket.on('disconnect', (reason: string) => {
      console.log('❌ ChatBot disconnected:', reason);
      setIsConnected(false);
      setConnectionError(`Disconnected: ${reason}`);
    });

    // Fix: Properly type the error parameter
    socket.on('connect_error', (error: Error) => {
      console.error('❌ ChatBot connection failed:', error);
      setIsConnected(false);
      setConnectionError(`Connection failed: ${error.message}`);
    });

    // Set up message event listeners
    socketService.onInitialMessages((initialMessages: Message[]) => {
      console.log('📥 Received initial messages:', initialMessages);
      setMessages(initialMessages);
    });

    socketService.onNewMessage((newMessage: Message) => {
      console.log('📥 Received new message:', newMessage);
      setMessages(prevMessages => [...prevMessages, newMessage]);
    });

    socketService.onConversationState((state: ConversationState) => {
      console.log('📊 Conversation state updated:', state);
      setConversationState(state);
    });

    socketService.onTypingStatus((status: TypingStatus) => {
      console.log('⌨️ Typing status:', status);
      
      if (status.userId !== userId) {
        if (status.isTyping) {
          setTypingUsers(prev => [...prev.filter(u => u !== status.userId), status.userId]);
        } else {
          setTypingUsers(prev => prev.filter(u => u !== status.userId));
        }
      }
    });

    // Cleanup function
    return () => {
      console.log('🧹 Cleaning up ChatBot...');
      socketService.removeListeners();
      socketService.disconnect();
      setIsConnected(false);
      setMessages([]);
      setTypingUsers([]);
    };
  }, [conversationId, serverUrl, userId]);

  // Handle message sending
  const handleSendMessage = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputMessage.trim()) return;
    
    if (!socketService.connected) {
      setConnectionError('Cannot send message: Not connected to server');
      return;
    }

    const messageData: MessageData = {
      conversationId,
      message: inputMessage.trim(),
      user: userId,
      timestamp: new Date().toISOString()
    };

    socketService.sendMessage(messageData);
    setInputMessage('');
    
    // Stop typing indicator
    if (isTyping) {
      socketService.stopTyping(conversationId, userId);
      setIsTyping(false);
    }
    
    // Clear typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  }, [inputMessage, conversationId, userId, isTyping]);

  // Handle typing indicators
  const handleTypingStart = useCallback(() => {
    if (!isTyping && socketService.connected) {
      socketService.startTyping(conversationId, userId);
      setIsTyping(true);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      if (socketService.connected) {
        socketService.stopTyping(conversationId, userId);
        setIsTyping(false);
      }
    }, 3000);
  }, [conversationId, userId, isTyping]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInputMessage(e.target.value);
    handleTypingStart();
  }, [handleTypingStart]);

  // Format timestamp
  const formatTimestamp = (timestamp: string): string => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      {/* Header */}
      <div style={{ 
        background: '#f5f5f5', 
        padding: '15px', 
        borderRadius: '8px 8px 0 0',
        borderBottom: '1px solid #ddd'
      }}>
        <h2 style={{ margin: '0 0 10px 0' }}>PayOna ChatBot</h2>
        <div style={{ fontSize: '14px' }}>
          <span style={{ 
            color: isConnected ? '#4CAF50' : '#f44336',
            fontWeight: 'bold'
          }}>
            {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
          </span>
          {socketService.socketId && (
            <span style={{ marginLeft: '10px', color: '#666' }}>
              ID: {socketService.socketId}
            </span>
          )}
        </div>
        {connectionError && (
          <div style={{ 
            color: '#f44336', 
            fontSize: '12px',
            marginTop: '5px',
            padding: '5px',
            background: '#ffebee',
            borderRadius: '4px'
          }}>
            ⚠️ {connectionError}
          </div>
        )}
        {conversationState && (
          <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
            Room: {conversationState.conversationId} | 
            Participants: {conversationState.participants.length}
          </div>
        )}
      </div>

      {/* Messages Container */}
      <div style={{ 
        height: '400px',
        overflowY: 'auto',
        border: '1px solid #ddd',
        borderTop: 'none',
        padding: '15px',
        background: '#fff'
      }}>
        {messages.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            color: '#666',
            fontStyle: 'italic',
            marginTop: '50px'
          }}>
            {isConnected ? 'No messages yet. Start the conversation!' : 'Connecting...'}
          </div>
        ) : (
          messages.map((message, index) => (
            <div 
              key={`${message.id}-${index}`}
              style={{ 
                marginBottom: '15px',
                padding: '10px',
                borderRadius: '8px',
                background: message.user === userId ? '#e3f2fd' : '#f5f5f5',
                marginLeft: message.user === userId ? '20%' : '0',
                marginRight: message.user === userId ? '0' : '20%'
              }}
            >
              <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '5px' }}>
                {message.user === userId ? 'You' : message.user}
                <span style={{ 
                  fontSize: '12px', 
                  fontWeight: 'normal',
                  color: '#666',
                  marginLeft: '8px'
                }}>
                  {formatTimestamp(message.timestamp)}
                </span>
              </div>
              <div style={{ fontSize: '16px' }}>
                {message.text}
              </div>
            </div>
          ))
        )}
        
        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <div style={{ 
            fontSize: '14px', 
            color: '#666',
            fontStyle: 'italic',
            padding: '10px'
          }}>
            {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form onSubmit={handleSendMessage} style={{ display: 'flex' }}>
        <input
          ref={inputRef}
          type="text"
          value={inputMessage}
          onChange={handleInputChange}
          placeholder={isConnected ? "Type your message..." : "Connecting..."}
          disabled={!isConnected}
          style={{
            flex: 1,
            padding: '15px',
            border: '1px solid #ddd',
            borderTop: 'none',
            borderRadius: '0 0 0 8px',
            fontSize: '16px',
            outline: 'none'
          }}
        />
        <button
          type="submit"
          disabled={!isConnected || !inputMessage.trim()}
          style={{
            padding: '15px 20px',
            border: '1px solid #ddd',
            borderLeft: 'none',
            borderTop: 'none',
            borderRadius: '0 0 8px 0',
            background: isConnected ? '#2196F3' : '#ccc',
            color: 'white',
            cursor: isConnected ? 'pointer' : 'not-allowed',
            fontSize: '16px'
          }}
        >
          Send
        </button>
      </form>

      {/* Debug Info (remove in production) */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{ 
          marginTop: '20px', 
          padding: '10px', 
          background: '#f0f0f0', 
          borderRadius: '4px',
          fontSize: '12px',
          fontFamily: 'monospace'
        }}>
          <strong>Debug Info:</strong><br/>
          Connection Status: {JSON.stringify(socketService.getConnectionStatus(), null, 2)}
        </div>
      )}
    </div>
  );
};

export default ChatBot;
