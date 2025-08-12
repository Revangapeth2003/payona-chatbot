import React, { useEffect, useState, useCallback, useRef } from 'react';
import io, { Socket } from 'socket.io-client';
import './ChatBot.css';

// ✅ FIXED: Added proper TypeScript interfaces
interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: string;
  messageType?: 'text' | 'options' | 'summary';
}

interface ChatOption {
  text: string;
  value: string;
  icon?: string;
  className?: string;
}

interface ConversationState {
  currentUser: {
    step: number;
    [key: string]: any;
  };
  [key: string]: any;
}

interface ProcessingStatus {
  isProcessing: boolean;
  message: string;
}

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
  // ✅ FIXED: Proper state typing
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [connectionError, setConnectionError] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [conversationState, setConversationState] = useState<ConversationState | null>(null);
  const [showOptions, setShowOptions] = useState<ChatOption[]>([]);
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus>({ isProcessing: false, message: '' });
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  
  // ✅ FIXED: Proper ref typing
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
    
    const newSocket = io(serverUrl, {
      autoConnect: true,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000,
      forceNew: true
    });

    newSocket.on('connect', () => {
      console.log('✅ PayanaOverseas ChatBot connected successfully');
      setIsConnected(true);
      setConnectionError('');
      
      setTimeout(() => {
        newSocket.emit('join-conversation', conversationId);
      }, 100);
    });

    newSocket.on('disconnect', (reason: string) => {
      console.log('❌ PayanaOverseas ChatBot disconnected:', reason);
      setIsConnected(false);
      setConnectionError(`Disconnected: ${reason}`);
    });

    // ✅ FIXED: Proper error typing
    newSocket.on('connect_error', (error: Error) => {
      console.error('❌ PayanaOverseas ChatBot connection failed:', error);
      setIsConnected(false);
      setConnectionError(`Connection failed: ${error.message}`);
    });

    newSocket.on('initial-messages', (initialMessages: Message[]) => {
      console.log('📥 PayanaOverseas: Received initial messages:', initialMessages);
      setMessages(initialMessages);
    });

    newSocket.on('new-message', (newMessage: Message) => {
      console.log('📥 PayanaOverseas: Received new message:', newMessage);
      setMessages(prevMessages => [...prevMessages, newMessage]);
    });

    newSocket.on('conversation-state', (state: ConversationState) => {
      console.log('📊 PayanaOverseas: Conversation state updated:', state);
      setConversationState(state);
    });

    newSocket.on('typing-status', (status: { userId: string; isTyping: boolean }) => {
      console.log('⌨️ PayanaOverseas: Typing status:', status);
      
      if (status.userId !== userId) {
        if (status.isTyping) {
          setTypingUsers(prev => [...prev.filter(u => u !== status.userId), status.userId]);
        } else {
          setTypingUsers(prev => prev.filter(u => u !== status.userId));
        }
      }
    });

    newSocket.on('show-options', (options: ChatOption[]) => {
      console.log('📋 PayanaOverseas: Show options:', options);
      setShowOptions(options);
    });

    newSocket.on('processing-status', (status: ProcessingStatus) => {
      console.log('⚙️ PayanaOverseas: Processing status:', status);
      setProcessingStatus(status);
    });

    newSocket.on('trigger-file-upload', () => {
      console.log('📁 PayanaOverseas: Trigger file upload');
      triggerFileInput();
    });

    // ✅ CORRECTED: Improved fetch-message event handler
    newSocket.on('fetch-message', async (data: { path: string; replacements?: any }) => {
      console.log('📨 FRONTEND: Received fetch-message event:', data);
      
      try {
        const { path, replacements } = data;
        
        // ✅ FIX 1: Correct API URL construction
        let apiUrl = `${serverUrl}/api/messages/${path}`;
        
        // ✅ FIX 2: Improved query parameter handling with validation
        if (replacements && typeof replacements === 'object' && Object.keys(replacements).length > 0) {
          const queryParam = encodeURIComponent(JSON.stringify(replacements));
          apiUrl += `?replacements=${queryParam}`;
        }
        
        console.log('🔗 FRONTEND: Making API call to:', apiUrl);
        
        // ✅ FIX 3: Enhanced fetch with proper error handling
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          // ✅ FIX 4: Add timeout to prevent hanging requests
          signal: AbortSignal.timeout(10000) // 10 second timeout
        });
        
        console.log('📡 FRONTEND: API Response status:', response.status);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const messageData = await response.json();
        console.log('📦 FRONTEND: API Response data:', messageData);
        
        // ✅ FIX 5: Enhanced message validation
        if (messageData && messageData.message && typeof messageData.message === 'string' && messageData.message.trim()) {
          // ✅ FIX 6: Create bot message with proper structure
          const botMessage: Message = {
            id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            text: messageData.message,
            sender: 'bot',
            timestamp: new Date().toISOString(),
            messageType: 'text'
          };
          
          console.log('✅ FRONTEND: Adding bot message to UI:', botMessage.text);
          
          // ✅ FIX 7: Prevent duplicate messages
          setMessages(prevMessages => {
            // Check if message already exists to prevent duplicates
            const isDuplicate = prevMessages.some(msg => 
              msg.text === botMessage.text && 
              msg.sender === 'bot' && 
              Math.abs(new Date(msg.timestamp).getTime() - new Date(botMessage.timestamp).getTime()) < 1000
            );
            
            if (isDuplicate) {
              console.log('⚠️ FRONTEND: Duplicate message detected, skipping');
              return prevMessages;
            }
            
            const newMessages = [...prevMessages, botMessage];
            console.log('📝 FRONTEND: Updated messages array length:', newMessages.length);
            return newMessages;
          });
          
        } else {
          console.error('❌ FRONTEND: Invalid message data received:', messageData);
          throw new Error(`No valid message content received from API. Response: ${JSON.stringify(messageData)}`);
        }
        
      } catch (error) {
        console.error('❌ FRONTEND: Error in fetch-message handler:', error);
        
        // ✅ FIX 8: Better error handling with specific error types
        let errorText = '';
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorName = error instanceof Error ? error.name : 'Error';
        
        if (errorName === 'AbortError') {
          errorText = `⏱️ Request timeout: Could not fetch message for "${data.path}" (took too long)`;
        } else if (errorMessage.includes('HTTP 404')) {
          errorText = `❌ Message not found: "${data.path}" does not exist in message.json`;
        } else if (errorMessage.includes('HTTP 500')) {
          errorText = `🔧 Server error: Problem reading message.json file`;
        } else if (errorMessage.includes('Failed to fetch')) {
          errorText = `🌐 Network error: Cannot connect to server at ${serverUrl}`;
        } else {
          errorText = `🔧 Error: Could not fetch message for "${data.path}". ${errorMessage}`;
        }
        
        const errorMessageObj: Message = {
          id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          text: errorText,
          sender: 'bot',
          timestamp: new Date().toISOString(),
          messageType: 'text'
        };
        
        setMessages(prevMessages => [...prevMessages, errorMessageObj]);
      }
    });

    newSocket.on('error', (error: { message: string }) => {
      console.error('❌ PayanaOverseas socket error:', error);
      setConnectionError(error.message);
    });

    setSocket(newSocket);

    return () => {
      console.log('🧹 Cleaning up PayanaOverseas ChatBot...');
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      newSocket.disconnect();
      setIsConnected(false);
      setMessages([]);
      setTypingUsers([]);
      setShowOptions([]);
    };
  }, [conversationId, serverUrl, userId]);

  // ✅ FIXED: Proper event handler typing
  const handleSendMessage = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputMessage.trim()) return;
    
    if (!isConnected) {
      setConnectionError('Cannot send message: Not connected to PayanaOverseas server');
      return;
    }

    const messageData = {
      conversationId,
      message: inputMessage.trim(),
      sender: 'user' as const,
      timestamp: new Date().toISOString()
    };

    if (socket) {
      socket.emit('send-message', messageData);
      setInputMessage('');
      setShowOptions([]);
      
      if (isTyping) {
        socket.emit('typing-stop', { conversationId, userId });
        setIsTyping(false);
      }
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
    }
  }, [inputMessage, conversationId, userId, isTyping, isConnected, socket]);

  const handleOptionClick = useCallback((option: ChatOption) => {
    if (!isConnected || !socket) return;

    socket.emit('select-option', { 
      option: option.value, 
      step: conversationState?.currentUser?.step || 0
    });

    setShowOptions([]);
  }, [conversationState, isConnected, socket]);

  const triggerFileInput = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // ✅ FIXED: Proper event typing
  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && isConnected && socket) {
      const fileName = file.name;
      
      const reader = new FileReader();
      reader.onload = () => {
        socket.emit('upload-file', {
          fileName: fileName,
          fileData: reader.result as string
        });
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  }, [isConnected, socket]);

  const handleTypingStart = useCallback(() => {
    if (!isTyping && isConnected && socket) {
      socket.emit('typing-start', { conversationId, userId });
      setIsTyping(true);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      if (isConnected && socket) {
        socket.emit('typing-stop', { conversationId, userId });
        setIsTyping(false);
      }
    }, 3000);
  }, [conversationId, userId, isTyping, isConnected, socket]);

  // ✅ FIXED: Proper event typing
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInputMessage(e.target.value);
    handleTypingStart();
  }, [handleTypingStart]);

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  const isInputDisabled = () => {
    return !isConnected || processingStatus.isProcessing || showOptions.length > 0;
  };

  const getPlaceholderText = () => {
    if (processingStatus.isProcessing) return processingStatus.message;
    if (showOptions.length > 0) return "Please select an option above...";
    if (!isConnected) return "Connecting to PayanaOverseas...";
    return "Type your message here...";
  };

  if (isMinimized) {
    return (
      <div className="chat-widget-minimized" onClick={toggleMinimize}>
        <div className="minimized-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M8 12h8M8 8h8M8 16h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>
        <div className="minimized-content">
          <div className="minimized-title">PayanaOverseas</div>
          <div className="minimized-subtitle">Need help? Chat with us!</div>
        </div>
        <div className={`connection-indicator ${isConnected ? 'online' : 'offline'}`}></div>
      </div>
    );
  }

  return (
    <div className="chat-widget">
      <div className="chat-window">
        {/* Clean Header */}
        <div className="chat-header-clean">
          <div className="header-left">
            <div className="company-avatar-clean">
              <div className="avatar-letter">P</div>
            </div>
            <div className="company-info-clean">
              <h3 className="company-name-clean">PayanaOverseas</h3>
              <div className="status-line">
                <div className={`status-dot-clean ${isConnected ? 'online' : 'offline'}`}></div>
                <span className="status-text-clean">
                  {isConnected ? 'Online' : 'Connecting...'}
                </span>
              </div>
            </div>
          </div>
          <div className="header-actions">
            <button 
              className="minimize-btn"
              onClick={toggleMinimize}
              title="Minimize chat"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M6 12h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="chat-messages-clean">
          <div className="conversation-starter">
            <div className="starter-content">
              <div className="starter-icon">🎓</div>
              <div className="starter-text">
                <h4>Welcome to PayanaOverseas!</h4>
                <p>Your trusted partner for Study Abroad & Work Opportunities</p>
              </div>
            </div>
          </div>

          <div className="messages-stream">
            {messages.map((message, index) => (
              <div 
                key={`${message.id}-${index}`}
                className={`message-row ${message.sender}`}
              >
                <div className="message-container">
                  <div className="message-bubble-clean">
                    <div 
                      className="message-text"
                      dangerouslySetInnerHTML={{ __html: message.text }}
                    />
                    <div className="message-meta">
                      <span className="message-time-clean">
                        {new Date(message.timestamp).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                      {message.sender === 'user' && (
                        <div className="message-status">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                            <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Processing Status */}
            {processingStatus.isProcessing && (
              <div className="message-row bot">
                <div className="message-container">
                  <div className="processing-message">
                    <div className="processing-indicator">
                      <div className="pulse-dot"></div>
                      <div className="pulse-dot"></div>
                      <div className="pulse-dot"></div>
                    </div>
                    <span className="processing-label">{processingStatus.message}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Options */}
            {showOptions.length > 0 && !processingStatus.isProcessing && (
              <div className="message-row bot">
                <div className="message-container">
                  <div className="options-panel">
                    <div className="options-header">Please choose an option:</div>
                    <div className="options-list">
                      {showOptions.map((option, index) => (
                        <button
                          key={index}
                          className={`option-chip ${option.className || ''}`}
                          onClick={() => handleOptionClick(option)}
                          disabled={!isConnected}
                        >
                          {option.icon && <span className="chip-icon">{option.icon}</span>}
                          <span className="chip-text">{option.text}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Typing indicator */}
            {typingUsers.length > 0 && (
              <div className="message-row bot">
                <div className="message-container">
                  <div className="typing-indicator-clean">
                    <div className="typing-animation-clean">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                    <span className="typing-text">PayanaOverseas is typing...</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Clean Input Area */}
        <div className="chat-input-clean">
          <div className="input-field-wrapper">
            <input 
              ref={inputRef}
              type="text" 
              value={inputMessage}
              onChange={handleInputChange}
              onKeyPress={(e: React.KeyboardEvent) => e.key === 'Enter' && handleSendMessage(e)}
              placeholder={getPlaceholderText()}
              disabled={isInputDisabled()}
              className="message-input-clean"
            />
            <div className="input-actions">
              <button 
                className="attachment-btn"
                onClick={triggerFileInput}
                disabled={isInputDisabled()}
                title="Attach file"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66L9.64 16.2a2 2 0 01-2.83-2.83l8.49-8.49" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <button 
                onClick={handleSendMessage} 
                disabled={isInputDisabled() || !inputMessage.trim()}
                className="send-btn-clean"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
          <div className="input-footer">
            <span className="powered-by">Powered by PayanaOverseas AI</span>
          </div>
        </div>

        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept=".pdf,.doc,.docx"
          style={{ display: 'none' }}
        />

        {/* Error Toast */}
        {connectionError && (
          <div className="error-toast">
            <div className="toast-content">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" strokeWidth="2"/>
                <line x1="12" y1="16" x2="12.01" y2="16" stroke="currentColor" strokeWidth="2"/>
              </svg>
              <span>{connectionError}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatBot;
