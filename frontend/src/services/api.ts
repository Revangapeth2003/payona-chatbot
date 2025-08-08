import { Message, User, ApiResponse, EmailData, MeetingData } from '../types';

const API_BASE_URL = 'http://192.168.29.227:3000/api';

class ApiService {
  private static async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const error = await response.json().catch(() => ({
        error: `HTTP error! status: ${response.status}`
      }));
      throw new Error(error.error || `HTTP error! status: ${response.status}`);
    }
    return await response.json();
  }

  static async fetchMessages(sessionId?: string): Promise<Message[]> {
    try {
      const url = sessionId 
        ? `${API_BASE_URL}/messages/${sessionId}` 
        : `${API_BASE_URL}/messages`;
      
      const response = await fetch(url);
      const result: ApiResponse<Message[]> = await this.handleResponse(response);
      
      return result.data || [];
    } catch (error) {
      console.error('Error fetching messages:', error);
      return [];
    }
  }

  static async postMessage(message: Omit<Message, '_id' | 'timestamp'>): Promise<Message | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      const result: ApiResponse<Message> = await this.handleResponse(response);
      return result.data || null;
    } catch (error) {
      console.error('Error posting message:', error);
      return null;
    }
  }

  static async saveUser(userData: Partial<User>): Promise<ApiResponse<User>> {
    try {
      const response = await fetch(`${API_BASE_URL}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      return await this.handleResponse<ApiResponse<User>>(response);
    } catch (error) {
      console.error('Error saving user:', error);
      throw error;
    }
  }

  static async sendUGProgramEmail(emailData: EmailData): Promise<ApiResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/send-email/send-ug-program-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData),
      });

      return await this.handleResponse<ApiResponse>(response);
    } catch (error) {
      console.error('Error sending UG program email:', error);
      throw error;
    }
  }

  static async sendGermanProgramEmail(emailData: EmailData): Promise<ApiResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/send-email/send-german-program-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData),
      });

      return await this.handleResponse<ApiResponse>(response);
    } catch (error) {
      console.error('Error sending German program email:', error);
      throw error;
    }
  }

  static async sendConfirmationEmail(emailData: EmailData): Promise<ApiResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/send-email/send-confirmation-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData),
      });

      return await this.handleResponse<ApiResponse>(response);
    } catch (error) {
      console.error('Error sending confirmation email:', error);
      throw error;
    }
  }

  static async scheduleMeeting(meetingData: MeetingData): Promise<ApiResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/schedule-meeting`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(meetingData),
      });

      return await this.handleResponse<ApiResponse>(response);
    } catch (error) {
      console.error('Error scheduling meeting:', error);
      throw error;
    }
  }
}

// Export individual functions for backward compatibility
export const fetchMessages = ApiService.fetchMessages;
export const postMessage = ApiService.postMessage;
export const saveUser = ApiService.saveUser;
export const sendUGProgramEmail = ApiService.sendUGProgramEmail;
export const sendGermanProgramEmail = ApiService.sendGermanProgramEmail;
export const sendConfirmationEmail = ApiService.sendConfirmationEmail;
export const scheduleMeeting = ApiService.scheduleMeeting;

export default ApiService;
