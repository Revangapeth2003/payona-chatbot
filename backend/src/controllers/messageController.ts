import { Request, Response } from 'express';
import Message from '../../models/Message';
import User from '../../models/User';
import { ApiResponse } from '../../types';

// Progressive conversation flow
const getConversationFlow = (step: number, userData?: any): string[] => {
  switch(step) {
    case 0:
      return [
        "Hi welcome to Payana Overseas! 🌍",
        "Your Gateway to Global Opportunities ✈️",
        "I'm here to help you with your study abroad or work abroad dreams!"
      ];
    
    case 1:
      return [
        "Great! Let's get started. Please enter your full name:"
      ];
    
    case 2:
      return [
        `Nice to meet you, ${userData?.name}! 👋`,
        "Please tell me your age:"
      ];
    
    case 3:
      return [
        "Thank you! Please enter your email address:"
      ];
    
    case 4:
      return [
        "Perfect! What brings you here today?",
        `<div class="options-container">
           <button class="option-btn" onclick="window.handleOptionClick?.('Study abroad')">📚 Study abroad</button>
           <button class="option-btn" onclick="window.handleOptionClick?.('Work abroad')">💼 Work abroad</button>
         </div>`
      ];
    
    default:
      return [
        "Thank you for providing all the information!",
        "Our team will contact you shortly at your provided email address.",
        "📞 For immediate assistance: +91 9003619777"
      ];
  }
};

export const processConversation = async (req: Request, res: Response): Promise<void> => {
  try {
    const { text, sender, sessionId } = req.body;
    
    console.log('📥 Processing conversation:', { text, sender, sessionId });
    
    if (!text || !sender || !sessionId) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: text, sender, sessionId'
      });
      return;
    }

    // STEP 1: Save user message to database
    console.log('💾 Saving user message to database...');
    const userMessage = new Message({
      text: text.trim(),
      sender,
      sessionId,
      timestamp: new Date()
    });
    
    const savedUserMessage = await userMessage.save();
    console.log('✅ User message saved with ID:', savedUserMessage._id);

    if (sender === 'user') {
      // STEP 2: Get conversation context from database
      console.log('📊 Getting conversation context from database...');
      const allMessages = await Message.find({ sessionId }).sort({ timestamp: 1 });
      const userMessages = allMessages.filter(m => m.sender === 'user');
      
      console.log(`📈 Total messages in DB: ${allMessages.length}, User messages: ${userMessages.length}`);
      
      // STEP 3: Determine conversation step and user data
      let currentStep = userMessages.length;
      let userData: any = {};
      
      // Extract user data from previous messages
      if (userMessages.length >= 1) userData.name = userMessages[0].text;
      if (userMessages.length >= 2) userData.age = userMessages[1].text;
      if (userMessages.length >= 3) userData.email = userMessages[2].text;
      
      console.log('👤 Current user data:', userData);
      
      // STEP 4: Validate input and determine next step
      let nextStep = currentStep;
      let validationError = '';
      
      switch(currentStep) {
        case 1:
          if (!/^[a-zA-Z\s]{2,50}$/.test(text.trim())) {
            validationError = 'Please enter a valid name (only letters and spaces, 2-50 characters):';
            nextStep = currentStep - 1;
          }
          break;
        case 2:
          const age = parseInt(text);
          if (isNaN(age) || age < 16 || age > 65) {
            validationError = 'Please enter a valid age (16-65 years):';
            nextStep = currentStep - 1;
          }
          break;
        case 3:
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) {
            validationError = 'Please enter a valid email address:';
            nextStep = currentStep - 1;
          }
          break;
      }
      
      // STEP 5: Get bot responses
      let botMessages: string[];
      if (validationError) {
        botMessages = [validationError];
      } else {
        botMessages = getConversationFlow(nextStep, userData);
      }
      
      // STEP 6: Save ALL bot messages to database with detailed logging
      console.log(`💾 Saving ${botMessages.length} bot messages to database...`);
      const savedBotMessages = [];
      
      for (let i = 0; i < botMessages.length; i++) {
        const botMessage = new Message({
          text: botMessages[i],
          sender: 'bot',
          sessionId,
          step: nextStep,
          messageIndex: i,
          timestamp: new Date(Date.now() + i * 100) // Slight delay for ordering
        });
        
        try {
          const saved = await botMessage.save();
          savedBotMessages.push(saved);
          console.log(`✅ Bot message ${i + 1}/${botMessages.length} saved with ID:`, saved._id);
        } catch (saveError) {
          console.error(`❌ Error saving bot message ${i + 1}:`, saveError);
          throw saveError;
        }
      }
      
      // STEP 7: Save user data to User collection (separate from messages)
      if (nextStep >= 3 && !validationError) {
        console.log('👤 Saving user data to User collection...');
        await saveUserData(userData, sessionId);
      }
      
      // STEP 8: Verify messages were actually saved
      const verifyMessages = await Message.find({ sessionId }).sort({ timestamp: 1 });
      console.log(`✅ Database verification: ${verifyMessages.length} total messages stored for session ${sessionId}`);
      
      // STEP 9: Return response
      res.json({
        success: true,
        data: {
          messages: savedBotMessages,
          step: nextStep,
          userData: userData,
          totalMessagesInDB: verifyMessages.length
        }
      });
      
      console.log(`✅ Conversation processed successfully. Session ${sessionId} now has ${verifyMessages.length} messages in database.`);
    } else {
      // For non-user messages, just return the saved message
      res.json({
        success: true,
        data: savedUserMessage
      });
    }
    
  } catch (error) {
    console.error('💥 Error processing conversation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process conversation',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Enhanced user data saving
const saveUserData = async (userData: any, sessionId: string): Promise<void> => {
  try {
    console.log('💾 Saving user data to User collection...', userData);
    
    const existingUser = await User.findOne({ 'conversations.sessionId': sessionId });
    
    if (existingUser) {
      // Update existing user
      console.log('📝 Updating existing user in database');
      const conversation = existingUser.conversations.find((c: any) => c.sessionId === sessionId);
      if (conversation) {
        conversation.userInfo = { ...conversation.userInfo, ...userData };
        conversation.lastUpdated = new Date();
        await existingUser.save();
        console.log('✅ User data updated in database');
      }
    } else {
      // Create new user
      console.log('👤 Creating new user in database');
      const newUser = new User({
        sessionEmail: userData.email || `temp_${sessionId}@temp.com`,
        name: userData.name,
        age: parseInt(userData.age) || 0,
        email: userData.email,
        conversations: [{
          sessionId,
          messages: [],
          userInfo: userData,
          isCompleted: false,
          emailSent: false,
          createdAt: new Date(),
          lastUpdated: new Date()
        }]
      });
      
      const savedUser = await newUser.save();
      console.log('✅ New user created in database with ID:', savedUser._id);
    }
  } catch (error) {
    console.error('❌ Error saving user data:', error);
    throw error;
  }
};

// Enhanced initialization with database verification
export const initializeChat = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.body;
    console.log('🎬 Initializing chat for session:', sessionId);
    
    if (!sessionId) {
      res.status(400).json({
        success: false,
        error: 'SessionId is required'
      });
      return;
    }
    
    // Check if conversation already exists in database
    const existingMessages = await Message.find({ sessionId });
    console.log(`📊 Found ${existingMessages.length} existing messages in database for session ${sessionId}`);
    
    if (existingMessages.length === 0) {
      console.log('💬 Creating new welcome messages...');
      
      // Create welcome messages
      const welcomeTexts = getConversationFlow(0);
      const savedMessages = [];
      
      for (let i = 0; i < welcomeTexts.length; i++) {
        const welcomeMessage = new Message({
          text: welcomeTexts[i],
          sender: 'bot',
          sessionId,
          step: 0,
          messageIndex: i,
          timestamp: new Date(Date.now() + i * 100)
        });
        
        const saved = await welcomeMessage.save();
        savedMessages.push(saved);
        console.log(`✅ Welcome message ${i + 1}/${welcomeTexts.length} saved with ID:`, saved._id);
      }
      
      // Verify messages were saved
      const verifyMessages = await Message.find({ sessionId });
      console.log(`✅ Database verification: ${verifyMessages.length} welcome messages stored`);
      
      res.json({
        success: true,
        data: {
          messages: savedMessages,
          isNew: true,
          totalMessagesInDB: verifyMessages.length
        }
      });
    } else {
      console.log('📋 Returning existing messages from database');
      res.json({
        success: true,
        data: {
          messages: existingMessages,
          isNew: false,
          totalMessagesInDB: existingMessages.length
        }
      });
    }
  } catch (error) {
    console.error('💥 Error initializing chat:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to initialize chat'
    });
  }
};

// Get all messages with database verification
export const getAllMessages = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.params;
    
    let messages;
    if (sessionId) {
      console.log(`📊 Getting all messages for session: ${sessionId}`);
      messages = await Message.find({ sessionId }).sort({ timestamp: 1 });
    } else {
      console.log('📊 Getting all messages from database');
      messages = await Message.find().sort({ timestamp: 1 });
    }
    
    console.log(`✅ Retrieved ${messages.length} messages from database`);
    
    res.json({
      success: true,
      count: messages.length,
      data: messages,
      sessionId: sessionId || 'all'
    });
  } catch (error) {
    console.error('❌ Error fetching messages:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch messages'
    });
  }
};

// New endpoint to verify database storage
export const getSessionStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.params;
    
    // Get all messages for this session
    const messages = await Message.find({ sessionId }).sort({ timestamp: 1 });
    const userMessages = messages.filter(m => m.sender === 'user');
    const botMessages = messages.filter(m => m.sender === 'bot');
    
    // Get user data
    const userData = await User.findOne({ 'conversations.sessionId': sessionId });
    
    const stats = {
      sessionId,
      totalMessages: messages.length,
      userMessages: userMessages.length,
      botMessages: botMessages.length,
      hasUserData: !!userData,
      lastMessage: messages.length > 0 ? messages[messages.length - 1] : null,
      conversationStarted: messages.length > 0 ? messages[0].timestamp : null
    };
    
    console.log('📊 Session stats:', stats);
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('❌ Error getting session stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get session stats'
    });
  }
};
