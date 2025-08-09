import React, { useEffect, useState, useCallback, useRef } from 'react';
import io from 'socket.io-client';
import './ChatBot.css';

const ChatBot = ({ 
  userId = 'student_001',
  conversationId = 'payona_overseas_chat',
  serverUrl = 'http://localhost:8000'
}) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState('');
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [conversationState, setConversationState] = useState(null);
  const [showOptions, setShowOptions] = useState([]);
  const [processingStatus, setProcessingStatus] = useState({ isProcessing: false, message: '' });
  const [isMinimized, setIsMinimized] = useState(false);
  
  const inputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

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

    newSocket.on('disconnect', (reason) => {
      console.log('❌ PayanaOverseas ChatBot disconnected:', reason);
      setIsConnected(false);
      setConnectionError(`Disconnected: ${reason}`);
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ PayanaOverseas ChatBot connection failed:', error);
      setIsConnected(false);
      setConnectionError(`Connection failed: ${error.message}`);
    });

    newSocket.on('initial-messages', (initialMessages) => {
      console.log('📥 PayanaOverseas: Received initial messages:', initialMessages);
      setMessages(initialMessages);
    });

    newSocket.on('new-message', (newMessage) => {
      console.log('📥 PayanaOverseas: Received new message:', newMessage);
      setMessages(prevMessages => [...prevMessages, newMessage]);
    });

    newSocket.on('conversation-state', (state) => {
      console.log('📊 PayanaOverseas: Conversation state updated:', state);
      setConversationState(state);
    });

    newSocket.on('typing-status', (status) => {
      console.log('⌨️ PayanaOverseas: Typing status:', status);
      
      if (status.userId !== userId) {
        if (status.isTyping) {
          setTypingUsers(prev => [...prev.filter(u => u !== status.userId), status.userId]);
        } else {
          setTypingUsers(prev => prev.filter(u => u !== status.userId));
        }
      }
    });

    newSocket.on('show-options', (options) => {
      console.log('📋 PayanaOverseas: Show options:', options);
      setShowOptions(options);
    });

    newSocket.on('processing-status', (status) => {
      console.log('⚙️ PayanaOverseas: Processing status:', status);
      setProcessingStatus(status);
    });

    newSocket.on('trigger-file-upload', () => {
      console.log('📁 PayanaOverseas: Trigger file upload');
      triggerFileInput();
    });

    newSocket.on('error', (error) => {
      console.error('❌ PayanaOverseas socket error:', error);
      setConnectionError(error.message);
    });

    setSocket(newSocket);

    return () => {
      console.log('🧹 Cleaning up PayanaOverseas ChatBot...');
      newSocket.disconnect();
      setIsConnected(false);
      setMessages([]);
      setTypingUsers([]);
      setShowOptions([]);
    };
  }, [conversationId, serverUrl, userId]);

  const handleSendMessage = useCallback((e) => {
    e.preventDefault();
    
    if (!inputMessage.trim()) return;
    
    if (!isConnected) {
      setConnectionError('Cannot send message: Not connected to PayanaOverseas server');
      return;
    }

    const messageData = {
      conversationId,
      message: inputMessage.trim(),
      sender: 'user',
      timestamp: new Date().toISOString()
    };

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
  }, [inputMessage, conversationId, userId, isTyping, isConnected, socket]);

  const handleOptionClick = useCallback((option) => {
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

  const handleFileUpload = useCallback((e) => {
    const file = e.target.files?.[0];
    if (file && isConnected && socket) {
      const fileName = file.name;
      
      const reader = new FileReader();
      reader.onload = () => {
        socket.emit('upload-file', {
          fileName: fileName,
          fileData: reader.result
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

  const handleInputChange = useCallback((e) => {
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
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(e)}
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
