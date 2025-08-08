// Frontend types that match the backend structure
export interface Message {
  _id: string;
  text: string;
  sender: 'user' | 'bot';
  sessionId?: string;
  timestamp?: string; // Fixed: Changed from Date to string to match backend
  step?: number;
}

export interface User {
  _id?: string;
  sessionEmail?: string;
  name: string;
  age: number;
  email: string;
  purpose: 'Study abroad' | 'Work abroad';
  qualification: string;
  preferredCountry?: string;
  pgField?: string;
  scholarshipInterest?: string;
  passport?: 'Yes' | 'No';
  resume?: string;
  experienceYears?: string;
  interestedInCategories?: string;
  germanLanguage?: string;
  ugMajor?: string;
  workExperience?: string;
  germanLanguageUG?: string;
  continueProgram?: string;
  programStartTime?: string;
  currentFlow?: string;
  conversationStep?: number;
  sessionId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface EmailData {
  name: string;
  age: string;
  email: string;
  purpose?: string;
  qualification?: string;
  ugMajor?: string;
  workExperience?: string;
  experienceYears?: string;
  germanLanguageUG?: string;
  passport?: string;
  resume?: string;
  experience?: string;
  interestedInCategories?: string;
  germanLanguage?: string;
  programType?: string;
  userEmail?: string;
  preferredCountry?: string;
}

export interface MeetingData {
  name: string;
  email: string;
  date: string;
  time: string;
  timeSlot: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  count?: number;
}

export interface ConversationState {
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
  preferredCountry: string;
  pgField: string;
  scholarshipInterest: string;
}
