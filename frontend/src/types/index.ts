export interface Message {
  _id?: string;
  text: string;
  sender: 'bot' | 'user';
  timestamp?: string;
  sessionId?: string;
  userId?: string;
}

export interface User {
  _id?: string;
  name: string;
  age: number;
  email: string;
  purpose: 'Study abroad' | 'Work abroad';
  qualification: string;
  preferredCountry?: string;
  pgField?: string;
  scholarshipInterest?: string;
  passport?: 'Yes' | 'No';
  resume?: string; // Fixed: changed from string | null to string | undefined
  experienceYears?: string;
  interestedInCategories?: string;
  germanLanguage?: string;
  ugMajor?: string;
  workExperience?: string;
  germanLanguageUG?: string;
  examReadiness?: string;
  ugProgramContinue?: string;
  ugProgramStartTime?: string;
  continueProgram?: string;
  programStartTime?: string;
  currentFlow?: string;
  programType?: string;
  appointmentType?: string;
  appointmentTime?: string;
  appointmentDate?: string;
  appointmentConfirmed?: boolean;
  needsFinancialSetup?: boolean;
  financialJobSupport?: string;
  emailSent?: boolean;
  ugEmailSent?: boolean;
  sessionId?: string;
  conversationStep?: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ConversationState {
  step: number;
  name: string;
  age: string;
  email: string;
  purpose: string;
  passport: string;
  resume: string | null; // Keep as null in state but convert when saving
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

export interface EmailData {
  name: string;
  age: string;
  email: string;
  purpose?: string;
  qualification: string;
  programType?: string;
  userEmail?: string;
  [key: string]: any;
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
