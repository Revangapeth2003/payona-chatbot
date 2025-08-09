import React, { useEffect, useState, useCallback, useRef } from 'react';
import socketService, { Message, MessageData, ConversationState, TypingStatus, ChatOption, ProcessingStatus } from '../services/socketService';
import './ChatBot.css';

interface ChatBotProps {
  userId?: string;
  conversationId?: string;
  serverUrl?: string;
}

const ChatBot: React.FC<ChatBotProps> = ({ 
  userId = 'student_001',
  conversationId = 'payona_overseas_chat',
  serverUrl = 'http://localhost:8000'
}) => {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [connectionError, setConnectionError] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [conversationState, setConversationState] = useState<ConversationState | null>(null);
  const [showOptions, setShowOptions] = useState<ChatOption[]>([]);
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus>({ isProcessing: false, message: '' });
  
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    console.log('🔄 Initializing PayanaOverseas ChatBot...');
    
    const socket = socketService.connect(serverUrl);

    socket.on('connect', () => {
      console.log('✅ PayanaOverseas ChatBot connected successfully');
      setIsConnected(true);
      setConnectionError('');
      
      setTimeout(() => {
        socketService.joinConversation(conversationId);
      }, 100);
    });

    socket.on('disconnect', (reason: string) => {
      console.log('❌ PayanaOverseas ChatBot disconnected:', reason);
      setIsConnected(false);
      setConnectionError(`Disconnected: ${reason}`);
    });

    socket.on('connect_error', (error: Error) => {
      console.error('❌ PayanaOverseas ChatBot connection failed:', error);
      setIsConnected(false);
      setConnectionError(`Connection failed: ${error.message}`);
    });

    socketService.onInitialMessages((initialMessages: Message[]) => {
      console.log('📥 PayanaOverseas: Received initial messages:', initialMessages);
      setMessages(initialMessages);
    });

    socketService.onNewMessage((newMessage: Message) => {
      console.log('📥 PayanaOverseas: Received new message:', newMessage);
      setMessages(prevMessages => [...prevMessages, newMessage]);
    });

    socketService.onConversationState((state: ConversationState) => {
      console.log('📊 PayanaOverseas: Conversation state updated:', state);
      setConversationState(state);
    });

    socketService.onTypingStatus((status: TypingStatus) => {
      console.log('⌨️ PayanaOverseas: Typing status:', status);
      
      if (status.userId !== userId) {
        if (status.isTyping) {
          setTypingUsers(prev => [...prev.filter(u => u !== status.userId), status.userId]);
        } else {
          setTypingUsers(prev => prev.filter(u => u !== status.userId));
        }
      }
    });

    // FIXED: Access to socket.on for custom events
    if (socketService.socket) {
      socketService.socket.on('show-options', (options: ChatOption[]) => {
        console.log('📋 PayanaOverseas: Show options:', options);
        setShowOptions(options);
      });

      socketService.socket.on('processing-status', (status: ProcessingStatus) => {
        console.log('⚙️ PayanaOverseas: Processing status:', status);
        setProcessingStatus(status);
      });

      socketService.socket.on('trigger-file-upload', () => {
        console.log('📁 PayanaOverseas: Trigger file upload');
        triggerFileInput();
      });
    }

    return () => {
      console.log('🧹 Cleaning up PayanaOverseas ChatBot...');
      socketService.removeListeners();
      socketService.disconnect();
      setIsConnected(false);
      setMessages([]);
      setTypingUsers([]);
      setShowOptions([]);
    };
  }, [conversationId, serverUrl, userId]);

  const handleSendMessage = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputMessage.trim()) return;
    
    if (!socketService.connected) {
      setConnectionError('Cannot send message: Not connected to PayanaOverseas server');
      return;
    }

    const messageData: MessageData = {
      conversationId,
      message: inputMessage.trim(),
      sender: 'user',  // ← FIXED: Added sender field
      timestamp: new Date().toISOString()
    };

    socketService.sendMessage(messageData);
    setInputMessage('');
    setShowOptions([]);
    
    if (isTyping) {
      socketService.stopTyping(conversationId, userId);
      setIsTyping(false);
    }
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  }, [inputMessage, conversationId, userId, isTyping]);

  const handleOptionClick = useCallback((option: ChatOption) => {
    if (!socketService.connected) return;

    // FIXED: Access to socket.emit for custom events
    if (socketService.socket) {
      socketService.socket.emit('select-option', { 
        option: option.value, 
        step: conversationState?.conversationFlow?.step || 0  // ← FIXED: Added conversationFlow
      });
    }

    setShowOptions([]);
  }, [conversationState]);

  const triggerFileInput = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && socketService.connected) {
      const fileName = file.name;
      
      const reader = new FileReader();
      reader.onload = () => {
        // FIXED: Access to socket.emit for custom events
        if (socketService.socket) {
          socketService.socket.emit('upload-file', {
            fileName: fileName,
            fileData: reader.result as string
          });
        }
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  }, []);

  const handleTypingStart = useCallback(() => {
    if (!isTyping && socketService.connected) {
      socketService.startTyping(conversationId, userId);
      setIsTyping(true);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

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

  const isInputDisabled = (): boolean => {
    return !isConnected || processingStatus.isProcessing || showOptions.length > 0;
  };

  const getPlaceholderText = (): string => {
    if (processingStatus.isProcessing) return processingStatus.message;
    if (showOptions.length > 0) return "Please select an option above...";
    if (!isConnected) return "Connecting to PayanaOverseas...";
    return "Type your message...";
  };

  return (
    <div className="chat-container">
      {/* Header */}
      <div className="chat-header">
        <div className="header-content">
          <div className="company-logo">
            <span className="logo-icon">🌍</span>
            PayanaOverseas
          </div>
          <div className="connection-status">
            <span className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
              {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
            </span>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="chat-messages">
        {messages.map((message, index) => (
          <div 
            key={`${message.id}-${index}`}
            className={`message ${message.sender === 'user' ? 'user-message' : 'bot-message'}`}  // ← FIXED: Use sender field
            dangerouslySetInnerHTML={{ __html: message.text }}
          />
        ))}

        {/* Processing Status */}
        {processingStatus.isProcessing && (
          <div className="processing-status">
            <div className="processing-animation">
              <div className="dot"></div>
              <div className="dot"></div>
              <div className="dot"></div>
            </div>
            <span>{processingStatus.message}</span>
          </div>
        )}

        {/* Options */}
        {showOptions.length > 0 && !processingStatus.isProcessing && (
          <div className="options-container">
            {showOptions.map((option, index) => (
              <button
                key={index}
                className={`option-btn ${option.className || ''}`}
                onClick={() => handleOptionClick(option)}
                disabled={!isConnected}
              >
                {option.icon && <span className="option-icon">{option.icon}</span>}
                {option.text}
              </button>
            ))}
          </div>
        )}
        
        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <div className="typing-indicator">
            <div className="typing-dots">
              <div className="dot"></div>
              <div className="dot"></div>
              <div className="dot"></div>
            </div>
            <span>
              {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
            </span>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input */}
      <div className="chat-input">
        <input 
          ref={inputRef}
          type="text" 
          value={inputMessage}
          onChange={handleInputChange}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(e)}
          placeholder={getPlaceholderText()}
          disabled={isInputDisabled()}
        />
        <button 
          onClick={handleSendMessage} 
          disabled={isInputDisabled() || !inputMessage.trim()}
          className="send-button"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
          </svg>
        </button>
      </div>
      
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".pdf,.doc,.docx"
        style={{ display: 'none' }}
      />

      {/* Connection Error */}
      {connectionError && (
        <div className="connection-error">
          ⚠️ {connectionError}
        </div>
      )}
    </div>
  );
};

export default ChatBot;
