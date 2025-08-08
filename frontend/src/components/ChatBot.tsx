import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Message, ConversationState, EmailData, MeetingData } from '../types';
import { postMessage, saveUser, sendUGProgramEmail, sendGermanProgramEmail, sendConfirmationEmail, scheduleMeeting } from '../services/api';
import '../styles/Chatbot.css';

// Define proper types for window extensions
declare global {
  interface Window {
    handleOptionClick?: (option: string) => void;
    triggerFileInput?: () => void;
    handleFileUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    navigateToPayanaOverseas?: () => void;
    navigateToSettlo?: () => void;
  }
}

const ChatBot: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState<string>('');
  const [conversationState, setConversationState] = useState<ConversationState>({
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
    isProcessingUGEmail: false,
    preferredCountry: '',
    pgField: '',
    scholarshipInterest: '',
  });
  
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [sessionId] = useState<string>(() => {
    const existing = sessionStorage.getItem('chatSessionId');
    if (existing) return existing;
    const newId = new Date().getTime().toString();
    sessionStorage.setItem('chatSessionId', newId);
    return newId;
  });

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = (): void => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Fixed initialization - always start fresh with welcome message
  useEffect(() => {
    // Clear any existing messages and start fresh
    setMessages([]);
    setConversationState({
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
      isProcessingUGEmail: false,
      preferredCountry: '',
      pgField: '',
      scholarshipInterest: '',
    });

    // Always show welcome message on initialization/refresh
    setTimeout(() => {
      postMessage({ 
        text: "Hi welcome to Payana Overseas! How can I assist you today?", 
        sender: 'bot',
        sessionId
      }).then((msg) => {
        if (msg) {
          console.log('Welcome message saved:', msg);
          setMessages([msg]);
        } else {
          // Fixed: Use string timestamp instead of Date object
          const fallbackMsg: Message = {
            _id: Date.now().toString(),
            text: "Hi welcome to Payana Overseas! How can I assist you today?",
            sender: 'bot',
            sessionId,
            timestamp: new Date().toISOString() // Fixed: Convert Date to ISO string
          };
          setMessages([fallbackMsg]);
        }
      }).catch((error) => {
        console.error('Error posting welcome message:', error);
        // Fixed: Use string timestamp instead of Date object
        const fallbackMsg: Message = {
          _id: Date.now().toString(),
          text: "Hi welcome to Payana Overseas! How can I assist you today?",
          sender: 'bot',
          sessionId,
          timestamp: new Date().toISOString() // Fixed: Convert Date to ISO string
        };
        setMessages([fallbackMsg]);
      });
    }, 100);
  }, [sessionId]);

  // Fixed addMessage function with proper timestamp handling
  const addMessage = useCallback(async (text: string, sender: 'bot' | 'user'): Promise<Message | undefined> => {
    try {
      console.log(`Adding ${sender} message:`, text);
      
      const saved = await postMessage({ text, sender, sessionId });
      if (saved) {
        console.log('Message saved successfully:', saved);
        setMessages(prev => [...prev, saved]);
        return saved;
      } else {
        throw new Error('No response from server');
      }
    } catch (err) {
      console.error('Error saving message: ', err);
      // Fixed: Use string timestamp instead of Date object
      const localMessage: Message = { 
        _id: Date.now().toString(),
        text, 
        sender, 
        sessionId,
        timestamp: new Date().toISOString() // Fixed: Convert Date to ISO string
      };
      setMessages(prev => [...prev, localMessage]);
      return localMessage;
    }
  }, [sessionId]);

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

  const handleUserInput = (): void => {
    if (!userInput.trim()) return;
    
    addMessage(userInput, 'user');
    processUserResponse(userInput.trim());
    setUserInput('');
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      handleUserInput();
    }
  };

  // WRAPPED IN useCallback TO FIX ESLINT WARNINGS
  const handleOptionClick = useCallback((option: string): void => {
    addMessage(option, 'user');
    processUserResponse(option);
  }, [addMessage]);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (file) {
      const fileName = file.name;
      
      setConversationState((prev: ConversationState) => ({
        ...prev,
        resume: fileName,
        step: 7
      }));
      
      addMessage(`Resume uploaded: ${fileName}`, 'user');
      setTimeout(() => addMessage("What is your highest qualification?", 'bot'), 500);
    }
    if (e.target) e.target.value = '';
  }, [addMessage]);

  const triggerFileInput = useCallback((): void => {
    fileInputRef.current?.click();
  }, []);

  const navigateToPayanaOverseas = useCallback((): void => {
    window.open('https://payanaoverseas.com', '_blank');
  }, []);

  const navigateToSettlo = useCallback((): void => {
    window.open('https://settlo.com', '_blank');
  }, []);

  // Save user data to database - FIXED TYPE COMPATIBILITY
  const saveUserData = useCallback(async (): Promise<void> => {
    try {
      console.log('Saving user data with sessionId:', sessionId);
      
      const userData = {
        name: conversationState.name,
        age: parseInt(conversationState.age),
        email: conversationState.email,
        purpose: conversationState.purpose as 'Study abroad' | 'Work abroad',
        qualification: conversationState.qualification,
        preferredCountry: conversationState.preferredCountry,
        pgField: conversationState.pgField,
        scholarshipInterest: conversationState.scholarshipInterest,
        passport: conversationState.passport as 'Yes' | 'No',
        resume: conversationState.resume || undefined,
        experienceYears: conversationState.experienceYears,
        interestedInCategories: conversationState.interestedInCategories,
        germanLanguage: conversationState.germanLanguage,
        ugMajor: conversationState.ugMajor,
        workExperience: conversationState.workExperience,
        germanLanguageUG: conversationState.germanLanguageUG,
        continueProgram: conversationState.continueProgram,
        programStartTime: conversationState.programStartTime,
        currentFlow: conversationState.currentFlow,
        conversationStep: conversationState.step,
        sessionId: sessionId
      };

      console.log('Prepared user data:', userData);
      const result = await saveUser(userData);
      console.log('User saved successfully:', result);
    } catch (error) {
      console.error('Error saving user data:', error);
      // Continue with the flow even if saving fails
    }
  }, [conversationState, sessionId]);

  // Fixed UG Program Email function with better error handling
  const sendUGProgramEmailHandler = useCallback(async (emailData: EmailData): Promise<boolean> => {
    try {
      await addMessage("📧 Sending your program details to our team...", 'bot');
      
      console.log('Sending UG program email with data:', emailData);
      const result = await sendUGProgramEmail(emailData);
      console.log('UG program email result:', result);
      
      if (result.success) {
        await addMessage("✅ Great! Your details have been sent to our team. You'll receive a confirmation email shortly!", 'bot');
        
        // Send confirmation email to user
        try {
          await sendConfirmationEmail({
            ...emailData,
            userEmail: emailData.email,
            programType: emailData.programType || 'Study Program'
          });
          console.log('Confirmation email sent successfully');
        } catch (confirmError) {
          console.error('Error sending confirmation email:', confirmError);
        }
        
        setTimeout(() => {
          if (result.data?.timestamp) {
            const timestamp = new Date(result.data.timestamp).toLocaleTimeString();
            addMessage(`📧 Email sent at: ${timestamp}`, 'bot');
          }
        }, 1000);
        
        return true;
      } else {
        throw new Error(result.message || "Failed to send email");
      }
      
    } catch (error) {
      console.error('❌ Error sending program email:', error);
      await addMessage("❌ There was an issue sending the email, but our team will contact you soon to discuss your program details.", 'bot');
      return false;
    }
  }, [addMessage]);

  // Fixed German Program Email function
  const sendGermanProgramEmailHandler = useCallback(async (emailData: EmailData): Promise<boolean> => {
    try {
      await addMessage("📧 Sending your German Program details to our team...", 'bot');
      
      console.log('Sending German program email with data:', emailData);
      const result = await sendGermanProgramEmail(emailData);
      console.log('German program email result:', result);
      
      if (result.success) {
        await addMessage("✅ Great! Your details have been sent to our team. You'll receive a confirmation email shortly!", 'bot');
        
        // Send confirmation email to user
        try {
          await sendConfirmationEmail({
            ...emailData,
            userEmail: emailData.email,
            programType: emailData.programType || 'German Program'
          });
          console.log('Confirmation email sent successfully');
        } catch (confirmError) {
          console.error('Error sending confirmation email:', confirmError);
        }
        
        setTimeout(() => {
          if (result.data?.timestamp) {
            const timestamp = new Date(result.data.timestamp).toLocaleTimeString();
            addMessage(`📧 Email sent at: ${timestamp}`, 'bot');
          }
        }, 1000);
        
        return true;
      } else {
        throw new Error(result.message || "Failed to send email");
      }
      
    } catch (error) {
      console.error('❌ Error sending German Program email:', error);
      await addMessage("❌ There was an issue sending the email, but our team will contact you soon to discuss your German program details.", 'bot');
      return false;
    }
  }, [addMessage]);

  // Fixed Google Meeting function
  const scheduleGoogleMeeting = useCallback(async (meetingData: MeetingData) => {
    try {
      await addMessage("📅 Scheduling your Google Meet appointment...", 'bot');
      
      console.log('Scheduling meeting with data:', meetingData);
      const result = await scheduleMeeting(meetingData);
      console.log('Meeting scheduling result:', result);
      
      if (result.success) {
        await addMessage(`✅ Meeting scheduled successfully!`, 'bot');
        
        setTimeout(() => {
          if (result.data) {
            const meetingInfo = `
              <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 10px 0;">
                <h4 style="color: #1976d2; margin: 0 0 10px 0;">📅 Meeting Details</h4>
                <p style="margin: 5px 0;"><strong>📧 Google Meet link sent to:</strong> ${result.data.email}</p>
                <p style="margin: 5px 0;"><strong>📅 Date:</strong> ${result.data.date}</p>
                <p style="margin: 5px 0;"><strong>⏰ Time:</strong> ${result.data.timeSlot}</p>
                <p style="margin: 5px 0;"><strong>🔗 Meeting Link:</strong> <a href="${result.data.meetLink}" target="_blank">${result.data.meetLink}</a></p>
                <p style="margin: 10px 0 0 0; color: #666;">Please check your email for the meeting link!</p>
              </div>
            `;
            addMessage(meetingInfo, 'bot');
          }
        }, 1000);
        
        return result;
      } else {
        throw new Error(result.message || "Failed to schedule meeting");
      }
      
    } catch (error) {
      console.error('❌ Error scheduling meeting:', error);
      await addMessage("❌ There was an issue scheduling the meeting, but our team will contact you to arrange the meeting.", 'bot');
      return null;
    }
  }, [addMessage]);

  const processUserResponse = useCallback(async (response: string): Promise<void> => {
    const { step } = conversationState;
    
    switch(step) {
      case 0: {
        await addMessage("Great! Let's get started. Please enter your full name:", 'bot');
        setConversationState((prev: ConversationState) => ({ ...prev, step: 1 }));
        break;
      }

      case 1: {
        if (validateName(response)) {
          setConversationState((prev: ConversationState) => ({ ...prev, name: response, step: 2 }));
          setTimeout(() => addMessage("Please enter your age:", 'bot'), 500);
        } else {
          await addMessage("Please enter a valid name (only letters and spaces, minimum 2 characters):", 'bot');
        }
        break;
      }

      case 2: {
        if (validateAge(response)) {
          setConversationState((prev: ConversationState) => ({ ...prev, age: response, step: 3 }));
          setTimeout(() => addMessage("Please enter your email address:", 'bot'), 500);
        } else {
          await addMessage("Please enter a valid age (16-65 years):", 'bot');
        }
        break;
      }

      case 3: {
        if (validateEmail(response)) {
          setConversationState((prev: ConversationState) => ({ ...prev, email: response, step: 4 }));
          // Save user data after collecting email
          setTimeout(() => saveUserData(), 100);
          setTimeout(() => addMessage("What brings you here today? Please choose:", 'bot'), 500);
          setTimeout(() => {
            addMessage(`
              <div class="options-container">
                <button class="option-btn" onclick="window.handleOptionClick?.('Study abroad')">📚 Study abroad</button>
                <button class="option-btn" onclick="window.handleOptionClick?.('Work abroad')">💼 Work abroad</button>
              </div>
            `, 'bot');
          }, 1000);
        } else {
          await addMessage("Please enter a valid email address:", 'bot');
        }
        break;
      }

      case 4: {
        if (response === 'Study abroad') {
          setConversationState((prev: ConversationState) => ({ 
            ...prev, 
            purpose: response, 
            step: 25,
            currentFlow: 'study'
          }));
          
          setTimeout(() => {
            addMessage("Great! Which country are you interested in studying?", 'bot');
            setTimeout(() => {
              addMessage(`
                <div class="options-container">
                  <button class="option-btn" onclick="window.handleOptionClick?.('Germany')">🇩🇪 Germany</button>
                  <button class="option-btn" onclick="window.handleOptionClick?.('Canada')">🇨🇦 Canada</button>
                  <button class="option-btn" onclick="window.handleOptionClick?.('USA')">🇺🇸 USA</button>
                  <button class="option-btn" onclick="window.handleOptionClick?.('UK')">🇬🇧 UK</button>
                  <button class="option-btn" onclick="window.handleOptionClick?.('Australia')">🇦🇺 Australia</button>
                  <button class="option-btn" onclick="window.handleOptionClick?.('Other')">🌍 Other</button>
                </div>
              `, 'bot');
            }, 1000);
          }, 300);
        } else if (response === 'Work abroad') {
          setConversationState((prev: ConversationState) => ({ ...prev, purpose: response, step: 5 }));
          setTimeout(() => addMessage("Do you have a passport?", 'bot'), 300);
          setTimeout(() => {
            addMessage(`
              <div class="options-container">
                <button class="option-btn" onclick="window.handleOptionClick?.('Yes')">✅ Yes</button>
                <button class="option-btn" onclick="window.handleOptionClick?.('No')">❌ No</button>
              </div>
            `, 'bot');
          }, 800);
        } else {
          await addMessage("Please select either 'Study abroad' or 'Work abroad'", 'bot');
        }
        break;
      }

      case 5: {
        setConversationState((prev: ConversationState) => ({ ...prev, passport: response, step: 6 }));
        setTimeout(() => addMessage("Please upload your resume/CV:", 'bot'), 500);
        setTimeout(() => {
          addMessage(`
            <div class="file-upload-container">
              <button class="upload-btn" onclick="window.triggerFileInput?.()">📄 Upload Resume</button>
            </div>
          `, 'bot');
        }, 1000);
        break;
      }

      case 7: {
        if (response.toLowerCase().includes('high school') || response.toLowerCase().includes('12th') || response.toLowerCase().includes('+2')) {
          setConversationState((prev: ConversationState) => ({ 
            ...prev, 
            qualification: response, 
            step: 8,
            currentFlow: 'ug_program'
          }));
          setTimeout(() => addMessage("Which field are you interested in for your undergraduate program?", 'bot'), 500);
          setTimeout(() => {
            addMessage(`
              <div class="options-container">
                <button class="option-btn" onclick="window.handleOptionClick?.('Engineering')">⚙️ Engineering</button>
                <button class="option-btn" onclick="window.handleOptionClick?.('Medicine')">🏥 Medicine</button>
                <button class="option-btn" onclick="window.handleOptionClick?.('Business')">💼 Business</button>
                <button class="option-btn" onclick="window.handleOptionClick?.('Computer Science')">💻 Computer Science</button>
                <button class="option-btn" onclick="window.handleOptionClick?.('Other')">📚 Other</button>
              </div>
            `, 'bot');
          }, 1000);
        } else {
          setConversationState((prev: ConversationState) => ({ ...prev, qualification: response, step: 9 }));
          setTimeout(() => addMessage("How many years of work experience do you have?", 'bot'), 500);
        }
        break;
      }

      case 25: {
        setConversationState((prev: ConversationState) => ({ ...prev, preferredCountry: response, step: 26 }));
        setTimeout(() => addMessage("What field of study are you interested in?", 'bot'), 500);
        setTimeout(() => {
          addMessage(`
            <div class="options-container">
              <button class="option-btn" onclick="window.handleOptionClick?.('Engineering')">⚙️ Engineering</button>
              <button class="option-btn" onclick="window.handleOptionClick?.('Computer Science')">💻 Computer Science</button>
              <button class="option-btn" onclick="window.handleOptionClick?.('Business/MBA')">💼 Business/MBA</button>
              <button class="option-btn" onclick="window.handleOptionClick?.('Medicine')">🏥 Medicine</button>
              <button class="option-btn" onclick="window.handleOptionClick?.('Arts & Humanities')">🎨 Arts & Humanities</button>
              <button class="option-btn" onclick="window.handleOptionClick?.('Other')">📚 Other</button>
            </div>
          `, 'bot');
        }, 1000);
        break;
      }

      case 26: {
        setConversationState((prev: ConversationState) => ({ ...prev, pgField: response, step: 27 }));
        setTimeout(() => addMessage("Are you interested in scholarships?", 'bot'), 500);
        setTimeout(() => {
          addMessage(`
            <div class="options-container">
              <button class="option-btn" onclick="window.handleOptionClick?.('Yes, very interested')">✅ Yes, very interested</button>
              <button class="option-btn" onclick="window.handleOptionClick?.('Maybe, need more info')">🤔 Maybe, need more info</button>
              <button class="option-btn" onclick="window.handleOptionClick?.('No, self-funded')">💰 No, self-funded</button>
            </div>
          `, 'bot');
        }, 1000);
        break;
      }

      case 27: {
        setConversationState((prev: ConversationState) => ({ ...prev, scholarshipInterest: response, step: 28 }));
        
        // Save user data before sending email
        setTimeout(() => saveUserData(), 100);
        
        // Send study abroad email
        const studyEmailData: EmailData = {
          name: conversationState.name,
          age: conversationState.age,
          email: conversationState.email,
          purpose: conversationState.purpose,
          qualification: conversationState.qualification,
          programType: `Study Abroad - ${conversationState.preferredCountry} - ${conversationState.pgField}`
        };

        setConversationState((prev: ConversationState) => ({ ...prev, isProcessingEmail: true }));
        
        const emailSent = await sendUGProgramEmailHandler(studyEmailData);
        
        setConversationState((prev: ConversationState) => ({ 
          ...prev, 
          emailSent,
          isProcessingEmail: false,
          ugEmailSent: emailSent
        }));

        if (emailSent) {
          setTimeout(() => showSummary(), 2000);
        }
        break;
      }

      default:
        await addMessage("I didn't understand that. Could you please try again?", 'bot');
    }
  }, [conversationState, addMessage, saveUserData, sendUGProgramEmailHandler, sendGermanProgramEmailHandler, scheduleGoogleMeeting]);

  // Updated showSummary function
  const showSummary = useCallback(() => {
    const { 
      name, age, purpose, email, qualification, ugMajor,
      workExperience, experienceYears, germanLanguageUG,
      ugProgramContinue, ugProgramStartTime, interestedInCategories, 
      germanLanguage, continueProgram, programStartTime, appointmentType, 
      appointmentTime, appointmentDate, currentFlow,
      preferredCountry, pgField, scholarshipInterest
    } = conversationState;
    
    const summary = `
      <div style="background: linear-gradient(135deg, #f8f9fa, #e9ecef); padding: 20px; border-radius: 12px; margin: 10px 0;">
        <h3 style="color: #e60023; margin-bottom: 15px; font-size: 1.1rem;">📋 Summary of Your Information</h3>
        <div style="line-height: 1.6;">
          <strong>👤 Name:</strong> ${name}<br>
          <strong>🎂 Age:</strong> ${age}<br>
          <strong>📧 Email:</strong> ${email}<br>
          <strong>🎯 Purpose:</strong> ${purpose}<br>
          <strong>🎓 Qualification:</strong> ${qualification}<br>
          ${ugMajor ? `<strong>📚 Field:</strong> ${ugMajor}<br>` : ''}
          ${workExperience ? `<strong>💼 Work Experience:</strong> ${workExperience}<br>` : ''}
          ${experienceYears ? `<strong>📅 Years of Experience:</strong> ${experienceYears}<br>` : ''}
          ${germanLanguageUG ? `<strong>🇩🇪 German Language:</strong> ${germanLanguageUG}<br>` : ''}
          ${germanLanguage ? `<strong>🇩🇪 German Language:</strong> ${germanLanguage}<br>` : ''}
          ${interestedInCategories ? `<strong>🎯 Interested Categories:</strong> ${interestedInCategories}<br>` : ''}
          ${preferredCountry ? `<strong>🌍 Preferred Country:</strong> ${preferredCountry}<br>` : ''}
          ${pgField ? `<strong>📖 Study Field:</strong> ${pgField}<br>` : ''}
          ${scholarshipInterest ? `<strong>🎓 Scholarship Interest:</strong> ${scholarshipInterest}<br>` : ''}
          ${continueProgram ? `<strong>📋 Program Decision:</strong> ${continueProgram}<br>` : ''}
          ${ugProgramContinue ? `<strong>📋 UG Program Decision:</strong> ${ugProgramContinue}<br>` : ''}
          ${programStartTime ? `<strong>⏰ Program Start Time:</strong> ${programStartTime}<br>` : ''}
          ${ugProgramStartTime ? `<strong>⏰ UG Program Start Time:</strong> ${ugProgramStartTime}<br>` : ''}
          ${appointmentType ? `<strong>📅 Appointment Type:</strong> ${appointmentType}<br>` : ''}
          ${appointmentTime ? `<strong>🕐 Appointment Time:</strong> ${appointmentTime}<br>` : ''}
          ${appointmentDate ? `<strong>📆 Appointment Date:</strong> ${appointmentDate}<br>` : ''}
        </div>
      </div>
    `;
    
    addMessage(summary, 'bot');
    
    if (currentFlow === 'study' && conversationState.emailSent) {
      addMessage(`🎉 Thank you ${name}! Your study abroad information has been sent to our specialized team.<br><br>📞 For immediate assistance: <strong>+91 9003619777</strong><br>📍 Visit us at: <strong>Payana Overseas Solutions, Erode, Tamilnadu-638004</strong><br><br>🌟 We're excited to help you achieve your dreams of studying abroad!`, 'bot');
    } else if (currentFlow && currentFlow.startsWith('ug_') && conversationState.ugEmailSent) {
      addMessage(`🎉 Thank you ${name}! Your ${ugMajor} program details have been sent to our specialized team.<br><br>📞 For immediate assistance: <strong>+91 9003619777</strong><br>📍 Visit us at: <strong>Payana Overseas Solutions, Erode, Tamilnadu-638004</strong><br><br>🌟 We're excited to help you achieve your dreams of working in Germany with your ${ugMajor} background!`, 'bot');
    } else if (conversationState.emailSent) {
      addMessage(`🎉 Thank you ${name}! Your details have been sent to our German Program team.<br><br>📞 For immediate assistance: <strong>+91 9003619777</strong><br>📍 Visit us at: <strong>Payana Overseas Solutions, Erode, Tamilnadu-638004</strong><br><br>🌟 We're excited to help you achieve your dreams of working in Germany!`, 'bot');
    } else {
      addMessage(`🙏 Thank you ${name}! Our team will contact you shortly at ${email}.<br><br>📞 For immediate assistance: <strong>+91 9003619777</strong><br>📍 Visit us at: <strong>Payana Overseas Solutions, Erode, Tamilnadu-638004</strong><br><br>🌟 We're excited to help you achieve your dreams of working abroad!`, 'bot');
    }
  }, [conversationState, addMessage]);

  // Make functions available globally for button clicks with proper TypeScript typing
  useEffect(() => {
    // Assign functions to window with proper typing
    window.handleOptionClick = handleOptionClick;
    window.triggerFileInput = triggerFileInput;
    window.handleFileUpload = handleFileUpload;
    window.navigateToPayanaOverseas = navigateToPayanaOverseas;
    window.navigateToSettlo = navigateToSettlo;

    return () => {
      // Cleanup - remove from window object (now safe since they're optional)
      if (window.handleOptionClick) delete window.handleOptionClick;
      if (window.triggerFileInput) delete window.triggerFileInput;
      if (window.handleFileUpload) delete window.handleFileUpload;
      if (window.navigateToPayanaOverseas) delete window.navigateToPayanaOverseas;
      if (window.navigateToSettlo) delete window.navigateToSettlo;
    };
  }, [handleOptionClick, triggerFileInput, handleFileUpload, navigateToPayanaOverseas, navigateToSettlo]);

  return (
    <div className="chat-container">
      <div className="chat-header">
        <div className="header-content">
          <div className="company-logo">
            <span className="logo-icon">🌍</span>
            Payana Overseas
          </div>
          <div className="header-subtitle">
            Your Gateway to Global Opportunities
          </div>
        </div>
      </div>
      
      <div className="chat-messages">
        {messages.map((message, index) => (
          <div key={message._id || index} className={`message ${message.sender}`}>
            <div className="message-content">
              <div dangerouslySetInnerHTML={{ __html: message.text }} />
            </div>
            <div className="message-time">
              {/* Fixed: Handle both string and undefined timestamps */}
              {message.timestamp 
                ? new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              }
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input">
        <div className="input-container">
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            disabled={conversationState.isProcessingEmail || conversationState.isProcessingUGEmail}
          />
          <button 
            onClick={handleUserInput}
            disabled={!userInput.trim() || conversationState.isProcessingEmail || conversationState.isProcessingUGEmail}
            className="send-button"
          >
            <span className="send-icon">➤</span>
          </button>
        </div>
        
        {/* Hidden file input for resume upload */}
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          accept=".pdf,.doc,.docx"
          onChange={handleFileUpload}
        />
        
        {(conversationState.isProcessingEmail || conversationState.isProcessingUGEmail) && (
          <div className="processing-indicator">
            <span className="loading-spinner">⏳</span>
            Processing your request...
          </div>
        )}
      </div>

      <div className="chat-footer">
        <div className="footer-content">
          <span className="footer-text">Powered by Payana Overseas Solutions</span>
          <div className="footer-links">
            <button 
              onClick={navigateToPayanaOverseas}
              className="footer-link-btn"
            >
              🌐 Visit Website
            </button>
            <button 
              onClick={navigateToSettlo}
              className="footer-link-btn"
            >
              🏢 Settlo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatBot;
