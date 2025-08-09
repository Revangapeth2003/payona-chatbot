import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import helmet from 'helmet';
import morgan from 'morgan';
import nodemailer from 'nodemailer';

dotenv.config();

const app = express();
const server = createServer(app);

app.use(helmet());
app.use(morgan('combined'));
app.use(cors({
  origin: "http://localhost:5173",
  methods: ["GET", "POST"],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Enhanced interfaces for PayanaOverseas conversation flow
interface ServerToClientEvents {
  'initial-messages': (messages: IUserMessage[]) => void;
  'new-message': (message: IUserMessage) => void;
  'conversation-state': (state: any) => void;
  'typing-status': (status: TypingStatus) => void;
  'show-options': (options: ChatOption[]) => void;
  'processing-status': (status: { isProcessing: boolean; message: string }) => void;
  'trigger-file-upload': () => void;
  'error': (error: { message: string }) => void;
}

interface ClientToServerEvents {
  'join-conversation': (conversationId: string) => void;
  'send-message': (data: MessageData) => void;
  'select-option': (data: { option: string; step: number }) => void;
  'upload-file': (data: { fileName: string; fileData: string }) => void;
  'leave-conversation': (conversationId: string) => void;
  'typing-start': (data: { conversationId: string; userId: string }) => void;
  'typing-stop': (data: { conversationId: string; userId: string }) => void;
}

interface InterServerEvents {}
interface SocketData {
  userId?: string;
  conversationId?: string;
}

// Message within user document
interface IUserMessage {
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

// Single User Document containing ALL user data
interface IUser {
  _id?: string;
  socketId: string;
  conversationId: string;
  
  // Personal Information
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
  step: number;
  
  // NEW: Study-specific fields
  studyCountry: string;
  studyLevel: string;
  studyField: string;
  studyBudget: string;
  studyStartTime: string;
  studyDuration: string;
  studyEmailSent: boolean;
  studyProgramContinue: string;
  
  // Messages Array (all messages in one document)
  messages: IUserMessage[];
  
  // Metadata
  joinedAt: string;
  lastActivity: string;
  status: string;
}

interface MessageData {
  conversationId: string;
  message: string;
  sender: 'user' | 'bot';
  timestamp?: string;
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
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/payona_chatbot';

mongoose.connection.on('connected', () => {
  console.log('✅ Mongoose connected to MongoDB:', MONGODB_URI);
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️ Mongoose disconnected from MongoDB');
});

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB: payona_chatbot');
    console.log('📁 Collection: users (single collection for all user data)');
  })
  .catch((error) => {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  });

// Updated User Schema with Study fields
const userSchema = new mongoose.Schema({
  socketId: { type: String, required: true, unique: true },
  conversationId: { type: String, required: true, index: true },
  
  // Personal Information
  name: { type: String, default: '' },
  age: { type: String, default: '' },
  email: { type: String, default: '' },
  purpose: { type: String, default: '' },
  passport: { type: String, default: '' },
  resume: { type: String, default: null },
  qualification: { type: String, default: '' },
  ugMajor: { type: String, default: '' },
  workExperience: { type: String, default: '' },
  experienceYears: { type: String, default: '' },
  germanLanguageUG: { type: String, default: '' },
  examReadiness: { type: String, default: '' },
  ugEmailSent: { type: Boolean, default: false },
  ugProgramContinue: { type: String, default: '' },
  ugProgramStartTime: { type: String, default: '' },
  experience: { type: String, default: '' },
  interestedInCategories: { type: String, default: '' },
  germanLanguage: { type: String, default: '' },
  continueProgram: { type: String, default: '' },
  programStartTime: { type: String, default: '' },
  entryYear: { type: String, default: '' },
  appointmentType: { type: String, default: '' },
  appointmentTime: { type: String, default: '' },
  appointmentDate: { type: String, default: '' },
  appointmentConfirmed: { type: Boolean, default: false },
  emailSent: { type: Boolean, default: false },
  isProcessingEmail: { type: Boolean, default: false },
  needsFinancialSetup: { type: Boolean, default: false },
  financialJobSupport: { type: String, default: '' },
  currentFlow: { type: String, default: '' },
  isProcessingUGEmail: { type: Boolean, default: false },
  step: { type: Number, default: 0 },
  
  // NEW: Study-specific fields
  studyCountry: { type: String, default: '' },
  studyLevel: { type: String, default: '' },
  studyField: { type: String, default: '' },
  studyBudget: { type: String, default: '' },
  studyStartTime: { type: String, default: '' },
  studyDuration: { type: String, default: '' },
  studyEmailSent: { type: Boolean, default: false },
  studyProgramContinue: { type: String, default: '' },
  
  // Messages Array - All messages stored in single document
  messages: [{
    id: { type: String, required: true },
    text: { type: String, required: true },
    sender: { type: String, enum: ['user', 'bot'], required: true },
    timestamp: { type: String, required: true },
    messageType: { type: String, enum: ['text', 'options', 'summary'], default: 'text' }
  }],
  
  // Metadata
  joinedAt: { type: String, default: () => new Date().toISOString() },
  lastActivity: { type: String, default: () => new Date().toISOString() },
  status: { type: String, default: 'active' }
}, { 
  collection: 'users',
  timestamps: true
});

// MongoDB Model
const User = mongoose.model<IUser>('User', userSchema);

// Email Configuration
const createEmailTransporter = () => {
  return nodemailer.createTransporter({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
};

// Helper Functions
const generateMessageId = (): string => {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

const validateEmail = (email: string): boolean => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

const validateName = (name: string): boolean => {
  return /^[a-zA-Z\s]+$/.test(name.trim()) && name.trim().length >= 2;
};

const validateAge = (age: string): boolean => {
  const numAge = parseInt(age);
  return !isNaN(numAge) && numAge >= 16 && numAge <= 65;
};

// User Management Functions
const getOrCreateUser = async (
  conversationId: string, 
  socketId: string
): Promise<IUser | null> => {
  try {
    console.log(`🔍 Getting/Creating user for conversation: ${conversationId}, socket: ${socketId}`);
    
    let user = await User.findOne({ socketId, conversationId });
    
    if (!user) {
      console.log('📝 Creating new user with single ObjectId');
      const newUser = new User({
        socketId: socketId,
        conversationId: conversationId,
        name: '',
        age: '',
        email: '',
        purpose: '',
        passport: '',
        resume: null,
        qualification: '',
        ugMajor: '',
        workExperience: '',
        experienceYears: '',
        germanLanguageUG: '',
        examReadiness: '',
        ugEmailSent: false,
        ugProgramContinue: '',
        ugProgramStartTime: '',
        experience: '',
        interestedInCategories: '',
        germanLanguage: '',
        continueProgram: '',
        programStartTime: '',
        entryYear: '',
        appointmentType: '',
        appointmentTime: '',
        appointmentDate: '',
        appointmentConfirmed: false,
        emailSent: false,
        isProcessingEmail: false,
        needsFinancialSetup: false,
        financialJobSupport: '',
        currentFlow: '',
        isProcessingUGEmail: false,
        step: 0,
        // Study fields
        studyCountry: '',
        studyLevel: '',
        studyField: '',
        studyBudget: '',
        studyStartTime: '',
        studyDuration: '',
        studyEmailSent: false,
        studyProgramContinue: '',
        messages: [],
        joinedAt: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
        status: 'active'
      });
      
      user = await newUser.save();
      console.log('✅ New user created with single ObjectId:', user._id);
    } else {
      console.log(`👤 Existing user found with ObjectId: ${user._id}, name: ${user.name || 'Unnamed'}`);
      user.lastActivity = new Date().toISOString();
      await user.save();
    }
    
    return user.toObject();
    
  } catch (error) {
    console.error('❌ Error creating/fetching user:', error);
    return null;
  }
};

const addMessageToUser = async (
  socketId: string,
  conversationId: string,
  messageData: IUserMessage
): Promise<boolean> => {
  try {
    console.log('💾 Adding message to user document:', messageData);
    
    const result = await User.findOneAndUpdate(
      { socketId, conversationId },
      { 
        $push: { messages: messageData },
        $set: { lastActivity: new Date().toISOString() }
      },
      { new: true }
    );
    
    if (result) {
      console.log('✅ Message added to user document successfully');
      return true;
    } else {
      console.log('❌ User not found for message addition');
      return false;
    }
  } catch (error) {
    console.error('❌ Error adding message to user:', error);
    return false;
  }
};

const updateUser = async (
  socketId: string, 
  conversationId: string,
  updates: Partial<IUser>
): Promise<boolean> => {
  try {
    console.log(`🔄 Updating user for socket: ${socketId}`, updates);
    
    const updatedUser = await User.findOneAndUpdate(
      { socketId, conversationId },
      { 
        ...updates,
        lastActivity: new Date().toISOString()
      },
      { new: true }
    );
    
    if (updatedUser) {
      console.log('✅ User updated successfully, ObjectId:', updatedUser._id);
      return true;
    } else {
      console.log('❌ User not found for update');
      return false;
    }
  } catch (error) {
    console.error('❌ Error updating user:', error);
    return false;
  }
};

const getUserMessages = async (socketId: string, conversationId: string): Promise<IUserMessage[]> => {
  try {
    const user = await User.findOne({ socketId, conversationId }).select('messages');
    if (user && user.messages) {
      console.log(`📨 Found ${user.messages.length} messages for user`);
      return user.messages;
    }
    return [];
  } catch (error) {
    console.error('❌ Error fetching user messages:', error);
    return [];
  }
};

// NEW: Study Program Email Function
const sendStudyProgramEmail = async (emailData: any): Promise<boolean> => {
  try {
    const transporter = createEmailTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.ADMIN_EMAIL || 'admin@payanaoverseas.com',
      cc: emailData.email,
      subject: `New Study Program Inquiry - ${emailData.studyLevel} in ${emailData.studyCountry} - ${emailData.name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #e60023;">📚 New Study Program Application</h2>
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
            <h3>Student Details:</h3>
            <p><strong>Name:</strong> ${emailData.name}</p>
            <p><strong>Age:</strong> ${emailData.age}</p>
            <p><strong>Email:</strong> ${emailData.email}</p>
            <p><strong>Purpose:</strong> ${emailData.purpose}</p>
            <p><strong>Qualification:</strong> ${emailData.qualification}</p>
            <p><strong>Study Country:</strong> ${emailData.studyCountry}</p>
            <p><strong>Study Level:</strong> ${emailData.studyLevel}</p>
            <p><strong>Field of Study:</strong> ${emailData.studyField}</p>
            <p><strong>Budget:</strong> ${emailData.studyBudget}</p>
            <p><strong>Preferred Start Time:</strong> ${emailData.studyStartTime}</p>
            <p><strong>Program Duration:</strong> ${emailData.studyDuration}</p>
            <p><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
          </div>
          <p style="margin-top: 20px;">Please contact the student for further processing.</p>
        </div>
      `
    };
    
    await transporter.sendMail(mailOptions);
    console.log('✅ Study Program email sent successfully');
    return true;
  } catch (error) {
    console.error('❌ Error sending Study program email:', error);
    return false;
  }
};

// Keep existing email functions
const sendUGProgramEmail = async (emailData: any): Promise<boolean> => {
  try {
    const transporter = createEmailTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.ADMIN_EMAIL || 'admin@payanaoverseas.com',
      cc: emailData.email,
      subject: `New UG Program Inquiry - ${emailData.ugMajor} - ${emailData.name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #e60023;">🎓 New UG Program Application</h2>
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
            <h3>Student Details:</h3>
            <p><strong>Name:</strong> ${emailData.name}</p>
            <p><strong>Age:</strong> ${emailData.age}</p>
            <p><strong>Email:</strong> ${emailData.email}</p>
            <p><strong>UG Major:</strong> ${emailData.ugMajor}</p>
            <p><strong>Work Experience:</strong> ${emailData.workExperience}</p>
            ${emailData.experienceYears ? `<p><strong>Experience Years:</strong> ${emailData.experienceYears}</p>` : ''}
            <p><strong>German Language & Exam Readiness:</strong> ${emailData.germanLanguageUG}</p>
            <p><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
          </div>
          <p style="margin-top: 20px;">Please contact the student for further processing.</p>
        </div>
      `
    };
    
    await transporter.sendMail(mailOptions);
    console.log('✅ UG Program email sent successfully');
    return true;
  } catch (error) {
    console.error('❌ Error sending UG program email:', error);
    return false;
  }
};

const sendGermanProgramEmail = async (emailData: any): Promise<boolean> => {
  try {
    const transporter = createEmailTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.ADMIN_EMAIL || 'admin@payanaoverseas.com',
      cc: emailData.email,
      subject: `New German Program Inquiry - ${emailData.name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #e60023;">🇩🇪 New German Program Application</h2>
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
            <h3>Student Details:</h3>
            <p><strong>Name:</strong> ${emailData.name}</p>
            <p><strong>Age:</strong> ${emailData.age}</p>
            <p><strong>Email:</strong> ${emailData.email}</p>
            <p><strong>Purpose:</strong> ${emailData.purpose}</p>
            <p><strong>Passport:</strong> ${emailData.passport}</p>
            <p><strong>Resume:</strong> ${emailData.resume}</p>
            <p><strong>Qualification:</strong> ${emailData.qualification}</p>
            <p><strong>Experience:</strong> ${emailData.experience}</p>
            <p><strong>Interested in Categories:</strong> ${emailData.interestedInCategories}</p>
            <p><strong>German Language:</strong> ${emailData.germanLanguage}</p>
            <p><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
          </div>
          <p style="margin-top: 20px;">Please contact the student for further processing.</p>
        </div>
      `
    };
    
    await transporter.sendMail(mailOptions);
    console.log('✅ German Program email sent successfully');
    return true;
  } catch (error) {
    console.error('❌ Error sending German program email:', error);
    return false;
  }
};

// Summary function
const showConversationSummary = async (socket: any, conversationId: string, user: IUser) => {
  const { 
    name, age, purpose, passport, email, resume, qualification, ugMajor,
    workExperience, experienceYears, germanLanguageUG, ugProgramContinue, 
    ugProgramStartTime, experience, interestedInCategories, germanLanguage, 
    continueProgram, programStartTime, currentFlow, studyCountry, studyLevel,
    studyField, studyBudget, studyStartTime, studyDuration
  } = user;
  
  let summary = `
    <div style="background: linear-gradient(135deg, #f8f9fa, #e9ecef); padding: 20px; border-radius: 12px; margin: 10px 0;">
      <h3 style="color: #e60023; margin-bottom: 15px; font-size: 1.1rem;">📋 Summary of Your Information</h3>
      <div style="line-height: 1.6;">
        <strong>👤 Name:</strong> ${name}<br>
        <strong>🎂 Age:</strong> ${age}<br>
        <strong>📧 Email:</strong> ${email}<br>
        <strong>🎯 Purpose:</strong> ${purpose}<br>
  `;

  if (purpose === 'Study') {
    summary += `
        <strong>🎓 Qualification:</strong> ${qualification}<br>
        <strong>🌍 Study Country:</strong> ${studyCountry}<br>
        <strong>🎒 Study Level:</strong> ${studyLevel}<br>
        <strong>📚 Field of Study:</strong> ${studyField}<br>
        <strong>💰 Budget:</strong> ${studyBudget}<br>
        <strong>📅 Preferred Start:</strong> ${studyStartTime}<br>
        <strong>⏰ Program Duration:</strong> ${studyDuration}<br>
    `;
  } else {
    // Work flow summary (existing logic)
    summary += `
        <strong>📘 Passport:</strong> ${passport}<br>
        <strong>📄 Resume:</strong> ${resume || 'Not provided'}<br>
        <strong>🎓 Qualification:</strong> ${qualification}<br>
    `;
    
    if (currentFlow && currentFlow.startsWith('ug_')) {
      summary += `
          <strong>🎯 UG Major:</strong> ${ugMajor}<br>
          <strong>💼 Work Experience:</strong> ${workExperience}<br>
      `;
      if (experienceYears) {
        summary += `<strong>📅 Experience Years:</strong> ${experienceYears}<br>`;
      }
      summary += `
          <strong>🇩🇪 German Language & Exam Readiness:</strong> ${germanLanguageUG}<br>
          <strong>📋 Continue UG Program:</strong> ${ugProgramContinue}<br>
      `;
      if (ugProgramStartTime) {
        summary += `<strong>⏰ UG Program Start:</strong> ${ugProgramStartTime}<br>`;
      }
    } else {
      summary += `
          <strong>💼 Experience:</strong> ${experience}<br>
          <strong>📈 Interested in categories:</strong> ${interestedInCategories}<br>
          <strong>🇩🇪 German language:</strong> ${germanLanguage}<br>
          <strong>📋 Continue program:</strong> ${continueProgram}<br>
      `;
      if (programStartTime) {
        summary += `<strong>⏰ Program Start:</strong> ${programStartTime}<br>`;
      }
    }
  }
  
  summary += `
      </div>
    </div>
  `;
  
  const summaryMessage: IUserMessage = {
    id: generateMessageId(),
    text: summary,
    sender: 'bot',
    timestamp: new Date().toISOString(),
    messageType: 'summary'
  };
  
  await addMessageToUser(user.socketId, conversationId, summaryMessage);
  socket.emit('new-message', summaryMessage);
  
  const contactMessage = purpose === 'Study' ? 
    'studying abroad' : 'working abroad';
    
  const closingText = `🎉 Thank you ${name}! Your details have been sent to our team.<br><br>📞 For immediate assistance: <strong>+91 9003619777</strong><br><br>🌟 We're excited to help you achieve your dreams of ${contactMessage}!`;
  
  const closingMessage: IUserMessage = {
    id: generateMessageId(),
    text: closingText,
    sender: 'bot',
    timestamp: new Date().toISOString()
  };
  
  setTimeout(async () => {
    await addMessageToUser(user.socketId, conversationId, closingMessage);
    socket.emit('new-message', closingMessage);
  }, 1000);
};

// **UPDATED CONVERSATION FLOW with Study Flow Enabled**
const processConversationStep = async (
  socket: any, 
  conversationId: string, 
  response: string, 
  socketId: string
) => {
  const user = await User.findOne({ socketId, conversationId });
  if (!user) {
    console.error('❌ User not found');
    return;
  }
  
  const step = user.step;
  
  console.log(`🔄 Processing step ${step} for user ObjectId: ${user._id}, socket: ${socketId}: "${response}"`);

  const sendBotMessage = async (text: string, delay: number = 300) => {
    setTimeout(async () => {
      const botMessage: IUserMessage = {
        id: generateMessageId(),
        text,
        sender: 'bot',
        timestamp: new Date().toISOString()
      };
      
      await addMessageToUser(socketId, conversationId, botMessage);
      socket.emit('new-message', botMessage);
    }, delay);
  };

  const showOptions = (options: ChatOption[], delay: number = 500) => {
    setTimeout(() => {
      socket.emit('show-options', options);
    }, delay);
  };

  switch(step) {
    case 0: // Initial greeting
      await sendBotMessage("Great! Let's get started. Please enter your full name:");
      await updateUser(socketId, conversationId, { step: 1 });
      break;
      
    case 1: // Name input
      if (validateName(response)) {
        await updateUser(socketId, conversationId, { step: 2, name: response.trim() });
        await sendBotMessage(`Thanks ${response.trim()}! What's your age?`);
      } else {
        await sendBotMessage("Please enter a valid name (at least 2 letters, letters and spaces only)");
      }
      break;
      
    case 2: // Age input
      if (validateAge(response)) {
        await updateUser(socketId, conversationId, { step: 3, age: response });
        await sendBotMessage("Please share your email address:");
      } else {
        await sendBotMessage("Please enter a valid age (between 16-65 years)");
      }
      break;
      
    case 3: // Email input
      if (validateEmail(response)) {
        await updateUser(socketId, conversationId, { step: 4, email: response.toLowerCase() });
        await sendBotMessage("Are you looking to Study or Work abroad?");
        showOptions([
          { text: "📚 Study", value: "Study", className: "study-btn" },
          { text: "💼 Work", value: "Work", className: "work-btn" }
        ]);
      } else {
        await sendBotMessage("Please enter a valid email address (e.g., example@gmail.com)");
      }
      break;
      
    // **UPDATED: Purpose selection with Study Flow enabled**
    case 4: 
      if (response === 'Study') {
        await updateUser(socketId, conversationId, { step: 50, purpose: response, currentFlow: 'study' });
        await sendBotMessage("Excellent choice! What is your highest qualification?");
        showOptions([
          { text: "🎓 12th Completed", value: "12th Completed", className: "qualification-btn" },
          { text: "🎓 UG Completed", value: "UG Completed", className: "qualification-btn" },
          { text: "🎓 PG Completed", value: "PG Completed", className: "qualification-btn" }
        ]);
      } else if (response === 'Work') {
        await updateUser(socketId, conversationId, { step: 5, purpose: response, currentFlow: 'work' });
        await sendBotMessage("Do you have a valid passport?");
        showOptions([
          { text: "✅ Yes", value: "Yes", className: "yes-btn" },
          { text: "❌ No", value: "No", className: "no-btn" }
        ]);
      } else {
        await sendBotMessage("Please select either Study or Work");
      }
      break;

    // **EXISTING WORK FLOW (Steps 5-49)**
    case 5: // Passport question (Work flow)
      if (response === 'Yes' || response === 'No') {
        const nextStep = response === 'No' ? 19 : 6;
        await updateUser(socketId, conversationId, { 
          passport: response, 
          step: nextStep,
          needsFinancialSetup: response === 'No'
        });
        
        if (response === 'No') {
          await sendBotMessage("You have some time to make financial setups. Now you have to start learning German language now.");
          setTimeout(async () => {
            await sendBotMessage("Ready to start your journey?");
            showOptions([
              { text: "✅ Yes", value: "Yes", className: "yes-btn" },
              { text: "📘 Claim Free Passport", value: "Claim Free Passport", className: "passport-btn" },
              { text: "📝 Register Now", value: "Register Now", className: "register-btn" }
            ], 1000);
          }, 1000);
        } else {
          await sendBotMessage("Do you have a resume to upload?");
          showOptions([
            { text: "📄 Upload Resume", value: "Upload Resume", className: "upload-btn" },
            { text: "🚫 No Resume", value: "No Resume", className: "no-resume-btn" }
          ]);
        }
      } else {
        await sendBotMessage("Please select either Yes or No");
      }
      break;
      
    case 6: // Resume handling (Work flow)
      if (response === 'Upload Resume') {
        socket.emit('trigger-file-upload');
      } else if (response === 'No Resume') {
        await updateUser(socketId, conversationId, { resume: 'No resume', step: 7 });
        await sendBotMessage("What is your highest qualification?");
        showOptions([
          { text: "🎓 12th Completed", value: "12th Completed" },
          { text: "🎓 UG Completed", value: "UG Completed" },
          { text: "🎓 PG Completed", value: "PG Completed" }
        ]);
      }
      break;
      
    case 7: // Qualification (Work flow)
      const qualifications = ["12th Completed", "UG Completed", "PG Completed"];
      if (qualifications.includes(response)) {
        const nextStep = response === "UG Completed" ? 22 : 8;
        const currentFlow = response === "UG Completed" ? 'ug_selection' : 'standard';
        
        await updateUser(socketId, conversationId, { qualification: response, step: nextStep, currentFlow });
        
        if (response === "UG Completed") {
          await sendBotMessage("What is your UG major?");
          showOptions([
            { text: "👩‍⚕️ Nurses", value: "Nurses" },
            { text: "🦷 Dentist", value: "Dentist" },
            { text: "⚙️ Engineering", value: "Engineering" },
            { text: "🎨 Arts Background", value: "Arts Background" },
            { text: "🩺 MBBS", value: "MBBS" }
          ]);
        } else {
          await sendBotMessage("How many years of work experience do you have?");
          showOptions([
            { text: "🆕 No Experience", value: "No experience" },
            { text: "📈 1-2 Years", value: "1-2yr" },
            { text: "📊 2-3 Years", value: "2-3yr" },
            { text: "📈 3-5 Years", value: "3-5yr" },
            { text: "🏆 5+ Years", value: "5+yr" }
          ]);
        }
      } else {
        await sendBotMessage("Please select a qualification from the options");
      }
      break;

    case 8: // Work experience (standard work flow)
      const experiences = ["No experience", "1-2yr", "2-3yr", "3-5yr", "5+yr"];
      if (experiences.includes(response)) {
        await updateUser(socketId, conversationId, { step: 9, experience: response });
        await sendBotMessage("Are you interested in any of these categories?");
        showOptions([
          { text: "✅ Yes", value: "Yes", className: "yes-btn" },
          { text: "❌ No", value: "No", className: "no-btn" }
        ]);
      } else {
        await sendBotMessage("Please select an experience level");
      }
      break;

    case 9: // Interested in categories (work flow)
      if (response === 'Yes' || response === 'No') {
        await updateUser(socketId, conversationId, { step: 10, interestedInCategories: response });
        await sendBotMessage("Are you ready to learn the German language?");
        showOptions([
          { text: "✅ Yes", value: "Yes", className: "yes-btn" },
          { text: "❌ No", value: "No", className: "no-btn" }
        ]);
      } else {
        await sendBotMessage("Please select either Yes or No");
      }
      break;

    case 10: // German language - Send email here (work flow)
      if (response === 'Yes' || response === 'No') {
        await updateUser(socketId, conversationId, { germanLanguage: response, isProcessingEmail: true });
        
        socket.emit('processing-status', { 
          isProcessing: true, 
          message: "📧 Sending your German Program details to our team..." 
        });
        
        setTimeout(async () => {
          const emailData = {
            name: user.name,
            age: user.age,
            email: user.email,
            purpose: user.purpose,
            passport: user.passport,
            resume: user.resume,
            qualification: user.qualification,
            experience: user.experience,
            interestedInCategories: user.interestedInCategories,
            germanLanguage: response
          };
          
          const emailSent = await sendGermanProgramEmail(emailData);
          
          await updateUser(socketId, conversationId, { 
            step: 11, 
            emailSent: emailSent, 
            isProcessingEmail: false 
          });
          
          socket.emit('processing-status', { isProcessing: false, message: "" });
          
          if (emailSent) {
            await sendBotMessage("✅ Great! Your details have been sent to our team. You'll receive a confirmation email shortly!");
          } else {
            await sendBotMessage("⚠️ There was an issue sending your details, but don't worry - our team has your information and will contact you soon!");
          }
          
          setTimeout(async () => {
            await sendBotMessage("Can you continue with this program?");
            showOptions([
              { text: "✅ Yes", value: "Yes", className: "yes-btn" },
              { text: "❌ No", value: "No", className: "no-btn" }
            ], 1500);
          }, 1000);
        }, 500);
        
      } else {
        await sendBotMessage("Please select either Yes or No");
      }
      break;

    case 11: // Continue program (work flow)
      if (response === 'Yes' || response === 'No') {
        await updateUser(socketId, conversationId, { continueProgram: response, step: response === 'Yes' ? 12 : 21 });
        
        if (response === 'Yes') {
          await sendBotMessage("When can you kick start your program?");
          showOptions([
            { text: "⚡ Immediately", value: "Immediately", className: "immediate-btn" },
            { text: "⏳ Need Time", value: "Need some time", className: "time-btn" },
            { text: "❓ Need Clarification", value: "Need more clarification", className: "clarify-btn" }
          ]);
        } else {
          await sendBotMessage("No problem! Our team will still contact you to discuss other opportunities that might interest you.");
          setTimeout(() => showConversationSummary(socket, conversationId, user), 1000);
        }
      } else {
        await sendBotMessage("Please select either Yes or No");
      }
      break;

    // UG Major flow cases (22-27) - Keep existing UG work flow
    case 22: // UG Major selection
      const ugMajors = ["Nurses", "Dentist", "Engineering", "Arts Background", "MBBS"];
      if (ugMajors.includes(response)) {
        await updateUser(socketId, conversationId, { 
          ugMajor: response, 
          step: 23, 
          currentFlow: `ug_${response.toLowerCase().replace(' ', '_')}` 
        });
        await sendBotMessage("Do you have any work experience?");
        showOptions([
          { text: "✅ Yes", value: "Yes", className: "yes-btn" },
          { text: "❌ No", value: "No", className: "no-btn" }
        ]);
      } else {
        await sendBotMessage("Please select a UG major from the options");
      }
      break;

    case 23: // Work experience for UG majors
      if (response === 'Yes' || response === 'No') {
        const nextStep = response === 'Yes' ? 24 : 25;
        await updateUser(socketId, conversationId, { workExperience: response, step: nextStep });
        
        if (response === 'Yes') {
          await sendBotMessage("How many years of experience?");
          showOptions([
            { text: "📈 1-2 Years", value: "1-2yr" },
            { text: "📊 2-3 Years", value: "2-3yr" },
            { text: "📈 3-5 Years", value: "3-5yr" },
            { text: "🏆 5+ Years", value: "5+yr" }
          ]);
        } else {
          const germanQuestion = user.ugMajor === 'Dentist' 
            ? "Are you willing to learn German language and ready to clear FSP and KP exams?"
            : "Are you willing to learn German language?";
          await sendBotMessage(germanQuestion);
          showOptions([
            { text: "✅ Yes", value: "Yes", className: "yes-btn" },
            { text: "❌ No", value: "No", className: "no-btn" }
          ]);
        }
      } else {
        await sendBotMessage("Please select either Yes or No");
      }
      break;

    case 24: // Experience years for UG majors
      const experienceYears = ["1-2yr", "2-3yr", "3-5yr", "5+yr"];
      if (experienceYears.includes(response)) {
        await updateUser(socketId, conversationId, { experienceYears: response, step: 25 });
        const germanQuestion = user.ugMajor === 'Dentist' 
          ? "Are you willing to learn German language and ready to clear FSP and KP exams?"
          : "Are you willing to learn German language?";
        await sendBotMessage(germanQuestion);
        showOptions([
          { text: "✅ Yes", value: "Yes", className: "yes-btn" },
          { text: "❌ No", value: "No", className: "no-btn" }
        ]);
      } else {
        await sendBotMessage("Please select an experience level");
      }
      break;

    case 25: // German language and exam readiness (UG flows)
      if (response === 'Yes' || response === 'No') {
        await updateUser(socketId, conversationId, { 
          germanLanguageUG: response, 
          examReadiness: response, 
          step: response === 'Yes' ? 26 : 29,
          isProcessingUGEmail: response === 'Yes'
        });
        
        if (response === 'Yes') {
          socket.emit('processing-status', { 
            isProcessing: true, 
            message: "📧 Sending your UG Program details to our team..." 
          });
          
          setTimeout(async () => {
            const ugEmailData = {
              name: user.name,
              age: user.age,
              email: user.email,
              qualification: user.qualification,
              ugMajor: user.ugMajor,
              workExperience: user.workExperience,
              experienceYears: user.experienceYears,
              germanLanguageUG: response,
              examReadiness: response
            };
            
            const emailSent = await sendUGProgramEmail(ugEmailData);
            
            await updateUser(socketId, conversationId, { 
              step: 27, 
              ugEmailSent: emailSent, 
              isProcessingUGEmail: false 
            });
            
            socket.emit('processing-status', { isProcessing: false, message: "" });
            
            if (emailSent) {
              await sendBotMessage("✅ Great! Your details have been sent to our team. You'll receive a confirmation email shortly!");
            } else {
              await sendBotMessage("⚠️ There was an issue sending your details, but don't worry - our team has your information and will contact you soon!");
            }
            
            setTimeout(async () => {
              await sendBotMessage("Please kindly check your mail. Can you continue with this program?");
              showOptions([
                { text: "✅ Yes", value: "Yes", className: "yes-btn" },
                { text: "❌ No", value: "No", className: "no-btn" }
              ], 1500);
            }, 1000);
          }, 500);
        } else {
          await sendBotMessage("No problem! Please enter your email correctly and we'll send you alternative opportunities.");
          setTimeout(() => showConversationSummary(socket, conversationId, user), 1000);
        }
      } else {
        await sendBotMessage("Please select either Yes or No");
      }
      break;

    case 27: // Continue with UG program
      if (response === 'Yes' || response === 'No') {
        await updateUser(socketId, conversationId, { ugProgramContinue: response, step: response === 'Yes' ? 28 : 29 });
        
        if (response === 'Yes') {
          await sendBotMessage("When can you kick start your program?");
          showOptions([
            { text: "⚡ Immediately", value: "Immediately", className: "immediate-btn" },
            { text: "⏳ Need Time", value: "Need some time", className: "time-btn" },
            { text: "❓ Need Clarification", value: "Need more clarification", className: "clarify-btn" }
          ]);
        } else {
          await sendBotMessage("No problem! Our team will still contact you to discuss other opportunities that might interest you.");
          setTimeout(() => showConversationSummary(socket, conversationId, user), 1000);
        }
      } else {
        await sendBotMessage("Please select either Yes or No");
      }
      break;

    // **NEW: STUDY FLOW (Steps 50+)**
    case 50: // Study qualification selection
      const studyQualifications = ["12th Completed", "UG Completed", "PG Completed"];
      if (studyQualifications.includes(response)) {
        await updateUser(socketId, conversationId, { qualification: response, step: 51 });
        await sendBotMessage("Perfect! Which country would you like to study in?");
        showOptions([
          { text: "🇺🇸 USA", value: "USA", className: "country-btn" },
          { text: "🇬🇧 UK", value: "UK", className: "country-btn" },
          { text: "🇨🇦 Canada", value: "Canada", className: "country-btn" },
          { text: "🇦🇺 Australia", value: "Australia", className: "country-btn" },
          { text: "🇩🇪 Germany", value: "Germany", className: "country-btn" },
          { text: "🌍 Other", value: "Other", className: "country-btn" }
        ]);
      } else {
        await sendBotMessage("Please select a qualification from the options");
      }
      break;

    case 51: // Study country selection
      const studyCountries = ["USA", "UK", "Canada", "Australia", "Germany", "Other"];
      if (studyCountries.includes(response)) {
        await updateUser(socketId, conversationId, { studyCountry: response, step: 52 });
        await sendBotMessage("Great choice! What level of study are you interested in?");
        showOptions([
          { text: "🎓 Bachelor's Degree", value: "Bachelor's", className: "level-btn" },
          { text: "🎓 Master's Degree", value: "Master's", className: "level-btn" },
          { text: "🎓 PhD", value: "PhD", className: "level-btn" },
          { text: "📜 Diploma/Certificate", value: "Diploma", className: "level-btn" },
          { text: "🌐 Language Course", value: "Language", className: "level-btn" }
        ]);
      } else {
        await sendBotMessage("Please select a country from the options");
      }
      break;

    case 52: // Study level selection
      const studyLevels = ["Bachelor's", "Master's", "PhD", "Diploma", "Language"];
      if (studyLevels.includes(response)) {
        await updateUser(socketId, conversationId, { studyLevel: response, step: 53 });
        await sendBotMessage("Excellent! What field would you like to study?");
        showOptions([
          { text: "💻 Engineering & Technology", value: "Engineering", className: "field-btn" },
          { text: "💼 Business & Management", value: "Business", className: "field-btn" },
          { text: "⚕️ Medicine & Health", value: "Medicine", className: "field-btn" },
          { text: "🎨 Arts & Design", value: "Arts", className: "field-btn" },
          { text: "🔬 Science & Research", value: "Science", className: "field-btn" },
          { text: "📚 Other", value: "Other", className: "field-btn" }
        ]);
      } else {
        await sendBotMessage("Please select a study level from the options");
      }
      break;

    case 53: // Study field selection
      const studyFields = ["Engineering", "Business", "Medicine", "Arts", "Science", "Other"];
      if (studyFields.includes(response)) {
        await updateUser(socketId, conversationId, { studyField: response, step: 54 });
        await sendBotMessage("What's your budget range for studying abroad?");
        showOptions([
          { text: "💰 Under $20,000", value: "Under $20k", className: "budget-btn" },
          { text: "💰 $20,000 - $50,000", value: "$20k-$50k", className: "budget-btn" },
          { text: "💰 $50,000 - $100,000", value: "$50k-$100k", className: "budget-btn" },
          { text: "💰 Above $100,000", value: "Above $100k", className: "budget-btn" },
          { text: "❓ Not Sure", value: "Not Sure", className: "budget-btn" }
        ]);
      } else {
        await sendBotMessage("Please select a field of study from the options");
      }
      break;

    case 54: // Study budget selection
      const studyBudgets = ["Under $20k", "$20k-$50k", "$50k-$100k", "Above $100k", "Not Sure"];
      if (studyBudgets.includes(response)) {
        await updateUser(socketId, conversationId, { studyBudget: response, step: 55 });
        await sendBotMessage("When would you like to start your studies?");
        showOptions([
          { text: "🚀 Next Semester", value: "Next Semester", className: "time-btn" },
          { text: "📅 Next Academic Year", value: "Next Year", className: "time-btn" },
          { text: "⏳ In 2 Years", value: "In 2 Years", className: "time-btn" },
          { text: "🤔 Still Deciding", value: "Still Deciding", className: "time-btn" }
        ]);
      } else {
        await sendBotMessage("Please select a budget range from the options");
      }
      break;

    case 55: // Study start time selection
      const studyStartTimes = ["Next Semester", "Next Year", "In 2 Years", "Still Deciding"];
      if (studyStartTimes.includes(response)) {
        await updateUser(socketId, conversationId, { studyStartTime: response, step: 56 });
        await sendBotMessage("How long do you want to study?");
        showOptions([
          { text: "📅 6 months - 1 year", value: "6m-1y", className: "duration-btn" },
          { text: "📅 1-2 years", value: "1-2y", className: "duration-btn" },
          { text: "📅 2-4 years", value: "2-4y", className: "duration-btn" },
          { text: "📅 4+ years", value: "4+y", className: "duration-btn" }
        ]);
      } else {
        await sendBotMessage("Please select a start time from the options");
      }
      break;

    case 56: // Study duration selection
      const studyDurations = ["6m-1y", "1-2y", "2-4y", "4+y"];
      if (studyDurations.includes(response)) {
        await updateUser(socketId, conversationId, { studyDuration: response, step: 57 });
        
        // Send study program email
        socket.emit('processing-status', { 
          isProcessing: true, 
          message: "📧 Sending your Study Program details to our team..." 
        });
        
        setTimeout(async () => {
          const studyEmailData = {
            name: user.name,
            age: user.age,
            email: user.email,
            purpose: user.purpose,
            qualification: user.qualification,
            studyCountry: user.studyCountry,
            studyLevel: user.studyLevel,
            studyField: user.studyField,
            studyBudget: user.studyBudget,
            studyStartTime: user.studyStartTime,
            studyDuration: response
          };
          
          const emailSent = await sendStudyProgramEmail(studyEmailData);
          
          await updateUser(socketId, conversationId, { 
            step: 58, 
            studyEmailSent: emailSent
          });
          
          socket.emit('processing-status', { isProcessing: false, message: "" });
          
          if (emailSent) {
            await sendBotMessage("✅ Perfect! Your study abroad details have been sent to our team. You'll receive a confirmation email shortly!");
          } else {
            await sendBotMessage("⚠️ There was an issue sending your details, but don't worry - our team has your information and will contact you soon!");
          }
          
          setTimeout(async () => {
            await sendBotMessage("Would you like to proceed with our study abroad program?");
            showOptions([
              { text: "✅ Yes, I'm Interested", value: "Yes", className: "yes-btn" },
              { text: "❌ Need More Information", value: "No", className: "no-btn" }
            ], 1500);
          }, 1000);
        }, 500);
        
      } else {
        await sendBotMessage("Please select a duration from the options");
      }
      break;

    case 58: // Study program continuation
      if (response === 'Yes' || response === 'No') {
        await updateUser(socketId, conversationId, { studyProgramContinue: response, step: 59 });
        
        if (response === 'Yes') {
          await sendBotMessage("Fantastic! Our study abroad counselors will contact you within 24 hours to discuss your options and next steps.");
          setTimeout(() => showConversationSummary(socket, conversationId, user), 1500);
        } else {
          await sendBotMessage("No problem! Our team will send you detailed information about our study programs. Feel free to contact us when you're ready.");
          setTimeout(() => showConversationSummary(socket, conversationId, user), 1500);
        }
      } else {
        await sendBotMessage("Please select either Yes or No");
      }
      break;

    default:
      await sendBotMessage("Thank you for your interest in PayanaOverseas! Our team will contact you soon.");
      setTimeout(() => showConversationSummary(socket, conversationId, user), 1000);
  }
};

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`✅ PayanaOverseas User connected: ${socket.id}`);
  
  socket.on('join-conversation', async (conversationId: string) => {
    try {
      console.log(`👋 User ${socket.id} joining PayanaOverseas conversation: ${conversationId}`);
      
      socket.join(conversationId);
      
      const user = await getOrCreateUser(conversationId, socket.id);
      
      if (user) {
        const userMessages = await getUserMessages(socket.id, conversationId);
        socket.emit('initial-messages', userMessages);
        
        socket.emit('conversation-state', {
          currentUser: user
        });
        
        if (userMessages.length === 0 || user.step === 0) {
          const welcomeMessage: IUserMessage = {
            id: generateMessageId(),
            text: "Hi welcome to PayanaOverseas! How can I assist you today?",
            sender: 'bot',
            timestamp: new Date().toISOString()
          };
          
          const saved = await addMessageToUser(socket.id, conversationId, welcomeMessage);
          if (saved) {
            socket.emit('new-message', welcomeMessage);
            
            setTimeout(() => {
              socket.emit('show-options', [
                { text: "🚀 Get Started", value: "Get Started", className: "get-started-btn" }
              ]);
            }, 1000);
          }
        }
        
        console.log(`✅ User ${socket.id} successfully joined PayanaOverseas conversation`);
        console.log(`👤 User ObjectId: ${user._id}, Name: ${user.name || 'Unnamed'}, Current step: ${user.step}`);
      }
      
    } catch (error) {
      console.error('❌ Error joining conversation:', error);
      socket.emit('error', { message: 'Failed to join conversation' });
    }
  });

  socket.on('send-message', async (data: MessageData) => {
    try {
      console.log('📨 Received PayanaOverseas message:', data);
      
      const userMessage: IUserMessage = {
        id: generateMessageId(),
        text: data.message,
        sender: 'user',
        timestamp: new Date().toISOString()
      };
      
      const saved = await addMessageToUser(socket.id, data.conversationId, userMessage);
      if (saved) {
        io.to(data.conversationId).emit('new-message', userMessage);
        await processConversationStep(socket, data.conversationId, data.message, socket.id);
      }
      
    } catch (error) {
      console.error('❌ Error handling message:', error);
      socket.emit('error', { message: 'Failed to process message' });
    }
  });

  socket.on('select-option', async (data: { option: string; step: number }) => {
    try {
      console.log('📨 Option selected:', data);
      
      const conversationId = Array.from(socket.rooms)[1] || 'default';
      const userMessage: IUserMessage = {
        id: generateMessageId(),
        text: data.option,
        sender: 'user',
        timestamp: new Date().toISOString()
      };
      
      const saved = await addMessageToUser(socket.id, conversationId, userMessage);
      if (saved) {
        io.to(conversationId).emit('new-message', userMessage);
        await processConversationStep(socket, conversationId, data.option, socket.id);
      }
      
    } catch (error) {
      console.error('❌ Error handling option selection:', error);
      socket.emit('error', { message: 'Failed to process option' });
    }
  });

  socket.on('upload-file', async (data: { fileName: string; fileData: string }) => {
    try {
      console.log('📁 File uploaded:', data.fileName);
      
      const conversationId = Array.from(socket.rooms)[1] || 'default';
      
      const updated = await updateUser(socket.id, conversationId, { 
        resume: data.fileName,
        step: 7
      });
      
      if (updated) {
        const uploadMessage: IUserMessage = {
          id: generateMessageId(),
          text: `Resume uploaded: ${data.fileName}`,
          sender: 'user',
          timestamp: new Date().toISOString()
        };
        
        const saved = await addMessageToUser(socket.id, conversationId, uploadMessage);
        if (saved) {
          socket.emit('new-message', uploadMessage);
          
          setTimeout(async () => {
            const qualificationMessage: IUserMessage = {
              id: generateMessageId(),
              text: "What is your highest qualification?",
              sender: 'bot',
              timestamp: new Date().toISOString()
            };
            
            await addMessageToUser(socket.id, conversationId, qualificationMessage);
            socket.emit('new-message', qualificationMessage);
            
            setTimeout(() => {
              socket.emit('show-options', [
                { text: "🎓 12th Completed", value: "12th Completed" },
                { text: "🎓 UG Completed", value: "UG Completed" },
                { text: "🎓 PG Completed", value: "PG Completed" }
              ]);
            }, 500);
          }, 500);
        }
      }
      
    } catch (error) {
      console.error('❌ Error handling file upload:', error);
      socket.emit('error', { message: 'Failed to process file upload' });
    }
  });

  socket.on('typing-start', (data: { conversationId: string; userId: string }) => {
    const { conversationId, userId } = data;
    socket.to(conversationId).emit('typing-status', {
      conversationId,
      userId,
      isTyping: true
    });
  });

  socket.on('typing-stop', (data: { conversationId: string; userId: string }) => {
    const { conversationId, userId } = data;
    socket.to(conversationId).emit('typing-status', {
      conversationId,
      userId,
      isTyping: false
    });
  });

  socket.on('disconnect', async (reason: string) => {
    console.log(`❌ PayanaOverseas User disconnected: ${socket.id}. Reason: ${reason}`);
    
    try {
      await User.updateMany(
        { socketId: socket.id },
        { lastActivity: new Date().toISOString() }
      );
    } catch (error) {
      console.error('❌ Error cleaning up user data:', error);
    }
  });
});

// REST API Routes
app.get('/health', (req: express.Request, res: express.Response) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    connections: io.engine.clientsCount,
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    collections: ['users'],
    flows: ['work', 'study', 'ug_selection']
  });
});

app.get('/api/users', async (req: express.Request, res: express.Response) => {
  try {
    const users = await User.find()
      .select('_id name age email purpose qualification ugMajor workExperience germanLanguage studyCountry studyLevel studyField step status joinedAt messages')
      .sort({ joinedAt: -1 })
      .lean();
    
    const formattedUsers = users.map(user => ({
      _id: user._id,
      name: user.name,
      age: user.age,
      email: user.email,
      purpose: user.purpose,
      qualification: user.qualification,
      ugMajor: user.ugMajor,
      workExperience: user.workExperience,
      germanLanguage: user.germanLanguage,
      studyCountry: user.studyCountry,
      studyLevel: user.studyLevel,
      studyField: user.studyField,
      step: user.step,
      status: user.status,
      joinedAt: user.joinedAt,
      totalMessages: user.messages ? user.messages.length : 0
    }));
    
    res.json(formattedUsers);
  } catch (error) {
    console.error('❌ Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

app.get('/api/users/:id', async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).lean();
    
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    console.error('❌ Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

app.get('/api/debug', async (req: express.Request, res: express.Response) => {
  try {
    const userCount = await User.countDocuments();
    const recentUsers = await User.find().limit(5).sort({ joinedAt: -1 });
    
    res.json({
      status: 'PayanaOverseas Debug Info - Study & Work Flows Enabled',
      database: 'payona_chatbot',
      collections: {
        users: {
          count: userCount,
          recent: recentUsers.map(user => ({
            _id: user._id,
            name: user.name,
            age: user.age,
            email: user.email,
            purpose: user.purpose,
            step: user.step,
            status: user.status,
            totalMessages: user.messages ? user.messages.length : 0
          }))
        }
      },
      flows: {
        work: 'Steps 5-49 (Standard work flow, UG major flow)',
        study: 'Steps 50-59 (Complete study abroad flow)',
        features: ['Country selection', 'Study level', 'Field selection', 'Budget planning', 'Timeline planning']
      },
      connection: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      activeConnections: io.engine.clientsCount
    });
  } catch (error) {
    console.error('❌ Error in debug endpoint:', error);
    res.status(500).json({ error: error.message });
  }
});

// Start server
const PORT: number = parseInt(process.env.PORT || '8000', 10);
server.listen(PORT, () => {
  console.log(`🚀 PayanaOverseas ChatBot Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check available at http://localhost:${PORT}/health`);
  console.log(`🔧 Debug endpoint available at http://localhost:${PORT}/api/debug`);
  console.log(`👥 Users data available at http://localhost:${PORT}/api/users`);
  console.log(`💾 Database: payona_chatbot`);
  console.log(`🏠 Collection: users (single collection)`);
  console.log(`📋 Flows Available: Study (Steps 50-59) & Work (Steps 5-49)`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('📴 Graceful shutdown initiated...');
  server.close(() => {
    console.log('✅ HTTP server closed');
    mongoose.connection.close()
      .then(() => {
        console.log('✅ MongoDB connection closed');
        process.exit(0);
      })
      .catch((error) => {
        console.error('❌ Error closing MongoDB connection:', error);
        process.exit(1);
      });
  });
});

process.on('SIGINT', () => {
  console.log('📴 Graceful shutdown initiated...');
  server.close(() => {
    console.log('✅ HTTP server closed');
    mongoose.connection.close()
      .then(() => {
        console.log('✅ MongoDB connection closed');
        process.exit(0);
      })
      .catch((error) => {
        console.error('❌ Error closing MongoDB connection:', error);
        process.exit(1);
      });
  });
});
