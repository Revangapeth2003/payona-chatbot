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
      step: conversationState?.currentPersonData?.conversationFlow?.step || 0
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

  const isInputDisabled = () => {
    return !isConnected || processingStatus.isProcessing || showOptions.length > 0;
  };

  const getPlaceholderText = () => {
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
        <div className="header-subtitle">
          Study Abroad | Work in Germany | Immigration Services
        </div>
      </div>

      {/* Messages Container */}
      <div className="chat-messages">
        {messages.map((message, index) => (
          <div 
            key={`${message.id}-${index}`}
            className={`message ${message.sender === 'user' ? 'user-message' : 'bot-message'}`}
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

      {/* Debug Info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="debug-info">
          <strong>🔧 PayOna ChatBot Debug:</strong><br/>
          <strong>Database:</strong> payona_chatbot<br/>
          <strong>Collections:</strong> chat_messages, payona_conversations<br/>
          <strong>Data Structure:</strong> Array of person objects<br/>
          <strong>Connection ID:</strong> {socket?.id || 'Not connected'}<br/>
          <strong>Current Step:</strong> {conversationState?.currentPersonData?.conversationFlow?.step || 0}
        </div>
      )}
    </div>
  );
};

export default ChatBot;
