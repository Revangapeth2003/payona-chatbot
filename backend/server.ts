import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import helmet from 'helmet';
import morgan from 'morgan';
import nodemailer from 'nodemailer';
import { google } from 'googleapis';

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
  'initial-messages': (messages: IChatMessage[]) => void;
  'new-message': (message: IChatMessage) => void;
  'conversation-state': (state: IConversation) => void;
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

interface IChatMessage {
  _id?: string;
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: string;
  conversationId: string;
  messageType?: 'text' | 'options' | 'summary';
}

interface ChatOption {
  text: string;
  value: string;
  icon?: string;
  className?: string;
}

interface ConversationFlow {
  step: number;
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
}

interface MessageData {
  conversationId: string;
  message: string;
  sender: 'user' | 'bot';
  timestamp?: string;
}

interface IConversation {
  _id?: string;
  conversationId: string;
  participants: string[];
  createdAt: string;
  status: string;
  conversationFlow: ConversationFlow;
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

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB: payona_chatbot');
  })
  .catch((error) => {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  });

// Enhanced MongoDB Schemas
const chatMessageSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  text: { type: String, required: true },
  sender: { type: String, enum: ['user', 'bot'], required: true },
  timestamp: { type: String, required: true },
  conversationId: { type: String, required: true, index: true },
  messageType: { type: String, enum: ['text', 'options', 'summary'], default: 'text' }
}, { 
  collection: 'chat_messages',
  timestamps: true 
});

const conversationSchema = new mongoose.Schema({
  conversationId: { type: String, required: true, unique: true },
  participants: [{ type: String, required: true }],
  createdAt: { type: String, required: true },
  status: { type: String, required: true, default: 'active' },
  conversationFlow: {
    step: { type: Number, default: 0 },
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
    isProcessingUGEmail: { type: Boolean, default: false }
  }
}, { 
  collection: 'payona_conversations',
  timestamps: true 
});

// MongoDB Models
const ChatMessage = mongoose.model<IChatMessage>('ChatMessage', chatMessageSchema);
const Conversation = mongoose.model<IConversation>('Conversation', conversationSchema);

// Email Configuration
const createEmailTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
};

// Helper functions
const generateMessageId = (): string => Math.random().toString(36).substr(2, 9);

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

const getConversationMessages = async (conversationId: string): Promise<IChatMessage[]> => {
  try {
    return await ChatMessage.find({ conversationId })
      .sort({ timestamp: 1 })
      .limit(100)
      .lean();
  } catch (error) {
    console.error('Error fetching messages:', error);
    return [];
  }
};

const addMessageToConversation = async (messageData: IChatMessage): Promise<IChatMessage | null> => {
  try {
    const message = new ChatMessage(messageData);
    return (await message.save()).toObject();
  } catch (error) {
    console.error('Error saving message:', error);
    return null;
  }
};

const getOrCreateConversation = async (conversationId: string, participants: string[] = []): Promise<IConversation | null> => {
  try {
    let conversation = await Conversation.findOne({ conversationId }).lean();
    
    if (!conversation) {
      const newConversation = new Conversation({
        conversationId,
        participants,
        createdAt: new Date().toISOString(),
        status: 'active',
        conversationFlow: {
          step: 0,
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
          isProcessingUGEmail: false
        }
      });
      conversation = (await newConversation.save()).toObject();
    }
    
    return conversation;
  } catch (error) {
    console.error('Error creating/fetching conversation:', error);
    return null;
  }
};

// Email sending functions
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
    return true;
  } catch (error) {
    console.error('Error sending UG program email:', error);
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
    return true;
  } catch (error) {
    console.error('Error sending German program email:', error);
    return false;
  }
};

// Summary function
const showConversationSummary = async (socket: any, conversationId: string, flow: ConversationFlow) => {
  const { 
    name, age, purpose, passport, email, resume, qualification, ugMajor,
    workExperience, experienceYears, germanLanguageUG, ugProgramContinue, 
    ugProgramStartTime, experience, interestedInCategories, germanLanguage, 
    continueProgram, programStartTime, currentFlow
  } = flow;
  
  let summary = `
    <div style="background: linear-gradient(135deg, #f8f9fa, #e9ecef); padding: 20px; border-radius: 12px; margin: 10px 0;">
      <h3 style="color: #e60023; margin-bottom: 15px; font-size: 1.1rem;">📋 Summary of Your Information</h3>
      <div style="line-height: 1.6;">
        <strong>👤 Name:</strong> ${name}<br>
        <strong>🎂 Age:</strong> ${age}<br>
        <strong>📧 Email:</strong> ${email}<br>
        <strong>🎯 Purpose:</strong> ${purpose}<br>
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
  
  summary += `
      </div>
    </div>
  `;
  
  const summaryMessage: IChatMessage = {
    id: generateMessageId(),
    text: summary,
    sender: 'bot',
    timestamp: new Date().toISOString(),
    conversationId,
    messageType: 'summary'
  };
  
  await addMessageToConversation(summaryMessage);
  socket.emit('new-message', summaryMessage);
  
  const closingText = currentFlow && currentFlow.startsWith('ug_') && flow.ugEmailSent
    ? `🎉 Thank you ${name}! Your ${ugMajor} program details have been sent to our specialized team.<br><br>📞 For immediate assistance: <strong>+91 9003619777</strong><br><br>🌟 We're excited to help you achieve your dreams of working in Germany with your ${ugMajor} background!`
    : `🎉 Thank you ${name}! Your details have been sent to our team.<br><br>📞 For immediate assistance: <strong>+91 9003619777</strong><br><br>🌟 We're excited to help you achieve your dreams of working abroad!`;
  
  const closingMessage: IChatMessage = {
    id: generateMessageId(),
    text: closingText,
    sender: 'bot',
    timestamp: new Date().toISOString(),
    conversationId
  };
  
  setTimeout(async () => {
    await addMessageToConversation(closingMessage);
    socket.emit('new-message', closingMessage);
  }, 1000);
};

// COMPLETE Conversation flow processing with ALL cases
const processConversationStep = async (
  socket: any, 
  conversationId: string, 
  response: string, 
  conversation: IConversation
) => {
  const flow = conversation.conversationFlow;
  const step = flow.step;

  const sendBotMessage = async (text: string, delay: number = 300) => {
    setTimeout(async () => {
      const botMessage: IChatMessage = {
        id: generateMessageId(),
        text,
        sender: 'bot',
        timestamp: new Date().toISOString(),
        conversationId
      };
      
      await addMessageToConversation(botMessage);
      socket.emit('new-message', botMessage);
    }, delay);
  };

  const showOptions = (options: ChatOption[], delay: number = 500) => {
    setTimeout(() => {
      socket.emit('show-options', options);
    }, delay);
  };

  const updateFlow = async (updates: Partial<ConversationFlow>) => {
    await Conversation.findOneAndUpdate(
      { conversationId },
      { $set: { 'conversationFlow': { ...flow, ...updates } } }
    );
  };

  switch(step) {
    case 0: // Initial greeting
      await sendBotMessage("Great! Let's get started. Please enter your full name:");
      await updateFlow({ step: 1 });
      break;
      
    case 1: // Name input
      if (validateName(response)) {
        await updateFlow({ step: 2, name: response.trim() });
        await sendBotMessage(`Thanks ${response.trim()}! What's your age?`);
      } else {
        await sendBotMessage("Please enter a valid name (at least 2 letters, letters and spaces only)");
      }
      break;
      
    case 2: // Age input
      if (validateAge(response)) {
        await updateFlow({ step: 3, age: response });
        await sendBotMessage("Please share your email address:");
      } else {
        await sendBotMessage("Please enter a valid age (between 16-65 years)");
      }
      break;
      
    case 3: // Email input
      if (validateEmail(response)) {
        await updateFlow({ step: 4, email: response.toLowerCase() });
        await sendBotMessage("Are you looking to Study or Work abroad?");
        showOptions([
          { text: "💼 Work", value: "Work", className: "work-btn" },
          { text: "📚 Study (Coming Soon)", value: "Study", className: "study-btn disabled" }
        ]);
      } else {
        await sendBotMessage("Please enter a valid email address (e.g., example@gmail.com)");
      }
      break;
      
    case 4: // Purpose selection
      if (response === 'Work') {
        await updateFlow({ step: 5, purpose: response });
        await sendBotMessage("Do you have a valid passport?");
        showOptions([
          { text: "✅ Yes", value: "Yes", className: "yes-btn" },
          { text: "❌ No", value: "No", className: "no-btn" }
        ]);
      } else if (response === 'Study') {
        await sendBotMessage("Study option is currently not available. Please select Work to continue.");
      } else {
        await sendBotMessage("Please select either Study or Work");
      }
      break;
      
    case 5: // Passport question
      if (response === 'Yes' || response === 'No') {
        const nextStep = response === 'No' ? 19 : 6;
        await updateFlow({ 
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
      
    case 6: // Resume handling
      if (response === 'Upload Resume') {
        socket.emit('trigger-file-upload');
      } else if (response === 'No Resume') {
        await updateFlow({ resume: 'No resume', step: 7 });
        await sendBotMessage("What is your highest qualification?");
        showOptions([
          { text: "🎓 12th Completed", value: "12th Completed" },
          { text: "🎓 UG Completed", value: "UG Completed" },
          { text: "🎓 PG Completed", value: "PG Completed" }
        ]);
      }
      break;
      
    case 7: // Qualification
      const qualifications = ["12th Completed", "UG Completed", "PG Completed"];
      if (qualifications.includes(response)) {
        const nextStep = response === "UG Completed" ? 22 : 8;
        const currentFlow = response === "UG Completed" ? 'ug_selection' : 'standard';
        
        await updateFlow({ qualification: response, step: nextStep, currentFlow });
        
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

    case 8: // Work experience (standard flow)
      const experiences = ["No experience", "1-2yr", "2-3yr", "3-5yr", "5+yr"];
      if (experiences.includes(response)) {
        await updateFlow({ step: 9, experience: response });
        await sendBotMessage("Are you interested in any of these categories?");
        showOptions([
          { text: "✅ Yes", value: "Yes", className: "yes-btn" },
          { text: "❌ No", value: "No", className: "no-btn" }
        ]);
      } else {
        await sendBotMessage("Please select an experience level");
      }
      break;

    case 9: // Interested in categories
      if (response === 'Yes' || response === 'No') {
        await updateFlow({ step: 10, interestedInCategories: response });
        await sendBotMessage("Are you ready to learn the German language?");
        showOptions([
          { text: "✅ Yes", value: "Yes", className: "yes-btn" },
          { text: "❌ No", value: "No", className: "no-btn" }
        ]);
      } else {
        await sendBotMessage("Please select either Yes or No");
      }
      break;

    case 10: // German language - Send email here
      if (response === 'Yes' || response === 'No') {
        await updateFlow({ germanLanguage: response, isProcessingEmail: true });
        
        socket.emit('processing-status', { 
          isProcessing: true, 
          message: "📧 Sending your German Program details to our team..." 
        });
        
        setTimeout(async () => {
          const emailData = {
            name: flow.name,
            age: flow.age,
            email: flow.email,
            purpose: flow.purpose,
            passport: flow.passport,
            resume: flow.resume,
            qualification: flow.qualification,
            experience: flow.experience,
            interestedInCategories: flow.interestedInCategories,
            germanLanguage: response
          };
          
          const emailSent = await sendGermanProgramEmail(emailData);
          
          await updateFlow({ 
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

    case 11: // Continue program
      if (response === 'Yes' || response === 'No') {
        await updateFlow({ continueProgram: response, step: response === 'Yes' ? 12 : 21 });
        
        if (response === 'Yes') {
          await sendBotMessage("When can you kick start your program?");
          showOptions([
            { text: "⚡ Immediately", value: "Immediately", className: "immediate-btn" },
            { text: "⏳ Need Time", value: "Need some time", className: "time-btn" },
            { text: "❓ Need Clarification", value: "Need more clarification", className: "clarify-btn" }
          ]);
        } else {
          await sendBotMessage("No problem! Our team will still contact you to discuss other opportunities that might interest you.");
          setTimeout(() => showConversationSummary(socket, conversationId, flow), 1000);
        }
      } else {
        await sendBotMessage("Please select either Yes or No");
      }
      break;

    case 12: // Program start timing
      const startTimes = ["Immediately", "Need some time", "Need more clarification"];
      if (startTimes.includes(response)) {
        let nextStep = 21;
        if (response === "Need more clarification") nextStep = 13;
        else if (response === "Need some time") nextStep = 18;
        
        await updateFlow({ programStartTime: response, step: nextStep });
        
        if (response === "Need more clarification") {
          await sendBotMessage("Would you like to schedule a consultation call with our expert?");
          showOptions([
            { text: "✅ Yes", value: "Yes", className: "yes-btn" },
            { text: "❌ No", value: "No", className: "no-btn" }
          ]);
        } else if (response === "Need some time") {
          await sendBotMessage("When do you want to enter into Germany?");
          showOptions([
            { text: "📅 2025", value: "2025", className: "year-btn" },
            { text: "📅 2026", value: "2026", className: "year-btn" },
            { text: "📅 2027", value: "2027", className: "year-btn" }
          ]);
        } else {
          await sendBotMessage("Perfect! Our team will contact you soon to begin the process.");
          setTimeout(() => showConversationSummary(socket, conversationId, flow), 1000);
        }
      } else {
        await sendBotMessage("Please select an option");
      }
      break;

    case 13: // Schedule consultation
      if (response === 'Yes') {
        await updateFlow({ step: 14 });
        await sendBotMessage("How would you prefer to have your consultation?");
        showOptions([
          { text: "🏢 In-person", value: "In-person appointment", className: "inperson-btn" },
          { text: "💻 Google Meet", value: "Google Meet appointment", className: "online-btn" }
        ]);
      } else {
        await sendBotMessage("No problem! Our team will contact you via email and phone.");
        setTimeout(() => showConversationSummary(socket, conversationId, flow), 1000);
      }
      break;

    case 14: // Appointment type
      const appointmentTypes = ["In-person appointment", "Google Meet appointment"];
      if (appointmentTypes.includes(response)) {
        await updateFlow({ appointmentType: response, step: 15 });
        await sendBotMessage("What time would be convenient for you?");
        showOptions([
          { text: "🌅 Morning", value: "Morning", className: "time-btn" },
          { text: "🌞 Afternoon", value: "Afternoon", className: "time-btn" },
          { text: "🌆 Evening", value: "Evening", className: "time-btn" }
        ]);
      } else {
        await sendBotMessage("Please select an appointment type");
      }
      break;

    case 15: // Appointment time
      const times = ["Morning", "Afternoon", "Evening"];
      if (times.includes(response)) {
        await updateFlow({ appointmentTime: response, step: 16 });
        await sendBotMessage("Which day would work best for you?");
        showOptions([
          { text: "📅 Tomorrow", value: "Tomorrow", className: "date-btn" },
          { text: "📅 This Weekend", value: "This Weekend", className: "date-btn" },
          { text: "📅 Next Week", value: "Next Week", className: "date-btn" }
        ]);
      } else {
        await sendBotMessage("Please select a time preference");
      }
      break;

    case 16: // Appointment date
      const dates = ["Tomorrow", "This Weekend", "Next Week"];
      if (dates.includes(response)) {
        await updateFlow({ appointmentDate: response, step: 17, appointmentConfirmed: true });
        await sendBotMessage(`Perfect! We've scheduled your ${flow.appointmentType} for ${response} ${flow.appointmentTime}. Our team will contact you with the exact details.`);
        setTimeout(() => showConversationSummary(socket, conversationId, flow), 1500);
      } else {
        await sendBotMessage("Please select a date preference");
      }
      break;

    case 18: // Entry year
      const years = ["2025", "2026", "2027"];
      if (years.includes(response)) {
        await updateFlow({ entryYear: response, step: 21 });
        await sendBotMessage(`Great! We've noted that you want to enter Germany in ${response}. Our team will create a timeline for you and contact you accordingly.`);
        setTimeout(() => showConversationSummary(socket, conversationId, flow), 1000);
      } else {
        await sendBotMessage("Please select a year");
      }
      break;

    case 19: // Financial setup path
      const financialResponses = ["Yes", "Claim Free Passport", "Register Now"];
      if (financialResponses.includes(response)) {
        await updateFlow({ financialJobSupport: response, step: 20 });
        
        if (response === "Claim Free Passport") {
          await sendBotMessage("Great! We'll help you with the passport process. Our team will guide you through the documentation and application process.");
        } else if (response === "Register Now") {
          await sendBotMessage("Excellent! Let's get you registered for our program. Our team will contact you with the registration details.");
        } else {
          await sendBotMessage("Perfect! You're ready to begin your journey to Germany. Our team will contact you with the next steps.");
        }
        
        setTimeout(() => showConversationSummary(socket, conversationId, flow), 1500);
      } else {
        await sendBotMessage("Please select an option");
      }
      break;

    // UG Major flow cases (22-30)
    case 22: // UG Major selection
      const ugMajors = ["Nurses", "Dentist", "Engineering", "Arts Background", "MBBS"];
      if (ugMajors.includes(response)) {
        await updateFlow({ 
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
        await updateFlow({ workExperience: response, step: nextStep });
        
        if (response === 'Yes') {
          await sendBotMessage("How many years of experience?");
          showOptions([
            { text: "📈 1-2 Years", value: "1-2yr" },
            { text: "📊 2-3 Years", value: "2-3yr" },
            { text: "📈 3-5 Years", value: "3-5yr" },
            { text: "🏆 5+ Years", value: "5+yr" }
          ]);
        } else {
          const germanQuestion = flow.ugMajor === 'Dentist' 
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
        await updateFlow({ experienceYears: response, step: 25 });
        const germanQuestion = flow.ugMajor === 'Dentist' 
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
        await updateFlow({ 
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
              name: flow.name,
              age: flow.age,
              email: flow.email,
              qualification: flow.qualification,
              ugMajor: flow.ugMajor,
              workExperience: flow.workExperience,
              experienceYears: flow.experienceYears,
              germanLanguageUG: response,
              examReadiness: response
            };
            
            const emailSent = await sendUGProgramEmail(ugEmailData);
            
            await updateFlow({ 
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
          setTimeout(() => showConversationSummary(socket, conversationId, flow), 1000);
        }
      } else {
        await sendBotMessage("Please select either Yes or No");
      }
      break;

    case 27: // Continue with UG program
      if (response === 'Yes' || response === 'No') {
        await updateFlow({ ugProgramContinue: response, step: response === 'Yes' ? 28 : 29 });
        
        if (response === 'Yes') {
          await sendBotMessage("When can you kick start your program?");
          showOptions([
            { text: "⚡ Immediately", value: "Immediately", className: "immediate-btn" },
            { text: "⏳ Need Time", value: "Need some time", className: "time-btn" },
            { text: "❓ Need Clarification", value: "Need more clarification", className: "clarify-btn" }
          ]);
        } else {
          await sendBotMessage("No problem! Our team will still contact you to discuss other opportunities that might interest you.");
          setTimeout(() => showConversationSummary(socket, conversationId, flow), 1000);
        }
      } else {
        await sendBotMessage("Please select either Yes or No");
      }
      break;

    case 28: // UG Program start timing
      const ugStartTimes = ["Immediately", "Need some time", "Need more clarification"];
      if (ugStartTimes.includes(response)) {
        let nextStep = 21;
        if (response === "Need more clarification") nextStep = 13;
        else if (response === "Need some time") nextStep = 18;
        
        await updateFlow({ ugProgramStartTime: response, step: nextStep });
        
        if (response === "Need more clarification") {
          await sendBotMessage("Would you like to schedule a consultation call with our expert?");
          showOptions([
            { text: "✅ Yes", value: "Yes", className: "yes-btn" },
            { text: "❌ No", value: "No", className: "no-btn" }
          ]);
        } else if (response === "Need some time") {
          await sendBotMessage("When do you want to enter into Germany?");
          showOptions([
            { text: "📅 2025", value: "2025", className: "year-btn" },
            { text: "📅 2026", value: "2026", className: "year-btn" },
            { text: "📅 2027", value: "2027", className: "year-btn" }
          ]);
        } else {
          await sendBotMessage("Perfect! Our team will contact you soon to begin the process.");
          setTimeout(() => showConversationSummary(socket, conversationId, flow), 1000);
        }
      } else {
        await sendBotMessage("Please select an option");
      }
      break;

    case 29: // Alternative path end
      await sendBotMessage("Thank you for your interest! Our team will review your profile and contact you with suitable opportunities.");
      setTimeout(() => showConversationSummary(socket, conversationId, flow), 1000);
      break;

    default:
      await sendBotMessage("Thank you for your interest in PayanaOverseas! Our team will contact you soon.");
      setTimeout(() => showConversationSummary(socket, conversationId, flow), 1000);
  }
};

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`✅ PayanaOverseas User connected: ${socket.id}`);
  
  socket.on('join-conversation', async (conversationId: string) => {
    try {
      console.log(`👋 User ${socket.id} joining PayanaOverseas conversation: ${conversationId}`);
      
      socket.join(conversationId);
      
      const conversation = await getOrCreateConversation(conversationId, [socket.id]);
      
      if (conversation) {
        if (!conversation.participants.includes(socket.id)) {
          await Conversation.findOneAndUpdate(
            { conversationId },
            { $addToSet: { participants: socket.id } }
          );
          conversation.participants.push(socket.id);
        }
        
        const conversationMessages = await getConversationMessages(conversationId);
        socket.emit('initial-messages', conversationMessages);
        
        socket.emit('conversation-state', conversation);
        socket.to(conversationId).emit('conversation-state', conversation);
        
        if (conversationMessages.length === 0) {
          const welcomeMessage: IChatMessage = {
            id: generateMessageId(),
            text: "Hi welcome to PayanaOverseas! How can I assist you today?",
            sender: 'bot',
            timestamp: new Date().toISOString(),
            conversationId: conversationId
          };
          
          await addMessageToConversation(welcomeMessage);
          socket.emit('new-message', welcomeMessage);
          
          setTimeout(() => {
            socket.emit('show-options', [
              { text: "🚀 Get Started", value: "Get Started", className: "get-started-btn" }
            ]);
          }, 1000);
        }
        
        console.log(`✅ User ${socket.id} successfully joined PayanaOverseas conversation`);
      }
      
    } catch (error) {
      console.error('Error joining conversation:', error);
      socket.emit('error', { message: 'Failed to join conversation' });
    }
  });

  socket.on('send-message', async (data: MessageData) => {
    try {
      console.log('📨 Received PayanaOverseas message:', data);
      
      const userMessage: IChatMessage = {
        id: generateMessageId(),
        text: data.message,
        sender: 'user',
        timestamp: new Date().toISOString(),
        conversationId: data.conversationId
      };
      
      await addMessageToConversation(userMessage);
      io.to(data.conversationId).emit('new-message', userMessage);
      
      const conversation = await Conversation.findOne({ conversationId: data.conversationId }).lean();
      if (conversation) {
        await processConversationStep(socket, data.conversationId, data.message, conversation);
      }
      
    } catch (error) {
      console.error('Error handling message:', error);
      socket.emit('error', { message: 'Failed to process message' });
    }
  });

  socket.on('select-option', async (data: { option: string; step: number }) => {
    try {
      console.log('📨 Option selected:', data);
      
      const conversationId = Array.from(socket.rooms)[1] || 'default';
      const userMessage: IChatMessage = {
        id: generateMessageId(),
        text: data.option,
        sender: 'user',
        timestamp: new Date().toISOString(),
        conversationId
      };
      
      await addMessageToConversation(userMessage);
      io.to(conversationId).emit('new-message', userMessage);
      
      const conversation = await Conversation.findOne({ conversationId }).lean();
      if (conversation) {
        await processConversationStep(socket, conversationId, data.option, conversation);
      }
      
    } catch (error) {
      console.error('Error handling option selection:', error);
      socket.emit('error', { message: 'Failed to process option' });
    }
  });

  socket.on('upload-file', async (data: { fileName: string; fileData: string }) => {
    try {
      console.log('📁 File uploaded:', data.fileName);
      
      const conversationId = Array.from(socket.rooms)[1] || 'default';
      
      await Conversation.findOneAndUpdate(
        { conversationId },
        { 
          $set: { 
            'conversationFlow.resume': data.fileName,
            'conversationFlow.step': 7
          }
        }
      );
      
      const uploadMessage: IChatMessage = {
        id: generateMessageId(),
        text: `Resume uploaded: ${data.fileName}`,
        sender: 'user',
        timestamp: new Date().toISOString(),
        conversationId
      };
      
      await addMessageToConversation(uploadMessage);
      socket.emit('new-message', uploadMessage);
      
      setTimeout(async () => {
        const qualificationMessage: IChatMessage = {
          id: generateMessageId(),
          text: "What is your highest qualification?",
          sender: 'bot',
          timestamp: new Date().toISOString(),
          conversationId
        };
        
        await addMessageToConversation(qualificationMessage);
        socket.emit('new-message', qualificationMessage);
        
        setTimeout(() => {
          socket.emit('show-options', [
            { text: "🎓 12th Completed", value: "12th Completed" },
            { text: "🎓 UG Completed", value: "UG Completed" },
            { text: "🎓 PG Completed", value: "PG Completed" }
          ]);
        }, 500);
      }, 500);
      
    } catch (error) {
      console.error('Error handling file upload:', error);
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
      await Conversation.updateMany(
        { participants: socket.id },
        { $pull: { participants: socket.id } }
      );
    } catch (error) {
      console.error('Error cleaning up user data:', error);
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
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get('/api/conversations', async (req: express.Request, res: express.Response) => {
  try {
    const conversations = await Conversation.find()
      .sort({ updatedAt: -1 })
      .limit(20)
      .lean();
    res.json(conversations);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

app.get('/api/messages/:conversationId', async (req: express.Request, res: express.Response) => {
  try {
    const { conversationId } = req.params;
    const messages = await getConversationMessages(conversationId);
    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Start server on port 8000
const PORT: number = parseInt(process.env.PORT || '8000', 10);
server.listen(PORT, () => {
  console.log(`🚀 PayanaOverseas ChatBot Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check available at http://localhost:${PORT}/health`);
  console.log(`💾 Database: payona_chatbot`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// FIXED: Graceful shutdown with Promise-based mongoose.connection.close()
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
