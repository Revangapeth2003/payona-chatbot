import { Message, User, ApiResponse, EmailData, MeetingData } from '../types';

const API_BASE_URL = 'http://localhost:5000/api';

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

  static async postMessage(message: { text: string; sender: 'bot' | 'user'; sessionId?: string }): Promise<Message | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      return await this.handleResponse<Message>(response);
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

// Export individual functions
export const postMessage = ApiService.postMessage;
export const saveUser = ApiService.saveUser;
export const sendUGProgramEmail = ApiService.sendUGProgramEmail;
export const sendGermanProgramEmail = ApiService.sendGermanProgramEmail;
export const sendConfirmationEmail = ApiService.sendConfirmationEmail;
export const scheduleMeeting = ApiService.scheduleMeeting;

export default ApiService;
