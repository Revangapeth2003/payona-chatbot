import { Message, User, ApiResponse, EmailData, MeetingData } from '../types';

// Fixed: Change port from 5000 to 3000 to match your backend
const API_BASE_URL = 'http://localhost:3000/api';

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

  // Fixed: Handle backend response structure properly
  static async postMessage(message: { text: string; sender: 'bot' | 'user'; sessionId?: string }): Promise<Message | null> {
    try {
      console.log('Posting message to:', `${API_BASE_URL}/messages`);
      console.log('Message data:', message);
      
      const response = await fetch(`${API_BASE_URL}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      const result: ApiResponse<Message> = await this.handleResponse(response);
      
      // Fixed: Handle backend response structure
      if (result.success && result.data) {
        return {
          _id: result.data._id || Date.now().toString(),
          text: result.data.text || message.text,
          sender: result.data.sender || message.sender,
          sessionId: result.data.sessionId || message.sessionId,
          timestamp: result.data.timestamp || new Date().toISOString()
        };
      }
      
      console.log('Backend response:', result);
      return null;
    } catch (error) {
      console.error('Error posting message:', error);
      return null;
    }
  }

  static async saveUser(userData: Partial<User>): Promise<ApiResponse<User>> {
    try {
      console.log('Saving user data to backend:', userData);
      
      // Fixed: Send data in format backend expects
      const response = await fetch(`${API_BASE_URL}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionEmail: userData.email, // Backend expects sessionEmail
          ...userData
        }),
      });

      const result = await this.handleResponse<ApiResponse<User>>(response);
      console.log('User save response:', result);
      return result;
    } catch (error) {
      console.error('Error saving user:', error);
      throw error;
    }
  }

  static async sendUGProgramEmail(emailData: EmailData): Promise<ApiResponse> {
    try {
      console.log('Sending UG program email:', emailData);
      
      const response = await fetch(`${API_BASE_URL}/send-email/send-ug-program-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData),
      });

      const result = await this.handleResponse<ApiResponse>(response);
      console.log('Email send response:', result);
      return result;
    } catch (error) {
      console.error('Error sending UG program email:', error);
      throw error;
    }
  }

  static async sendGermanProgramEmail(emailData: EmailData): Promise<ApiResponse> {
    try {
      console.log('Sending German program email:', emailData);
      
      const response = await fetch(`${API_BASE_URL}/send-email/send-german-program-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData),
      });

      const result = await this.handleResponse<ApiResponse>(response);
      console.log('Email send response:', result);
      return result;
    } catch (error) {
      console.error('Error sending German program email:', error);
      throw error;
    }
  }

  static async sendConfirmationEmail(emailData: EmailData): Promise<ApiResponse> {
    try {
      console.log('Sending confirmation email:', emailData);
      
      const response = await fetch(`${API_BASE_URL}/send-email/send-confirmation-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData),
      });

      const result = await this.handleResponse<ApiResponse>(response);
      console.log('Confirmation email response:', result);
      return result;
    } catch (error) {
      console.error('Error sending confirmation email:', error);
      throw error;
    }
  }

  static async scheduleMeeting(meetingData: MeetingData): Promise<ApiResponse> {
    try {
      console.log('Scheduling meeting:', meetingData);
      
      const response = await fetch(`${API_BASE_URL}/schedule-meeting`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(meetingData),
      });

      const result = await this.handleResponse<ApiResponse>(response);
      console.log('Meeting schedule response:', result);
      return result;
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
