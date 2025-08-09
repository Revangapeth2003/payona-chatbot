import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const createConversation = async (userId: string, sessionId: string) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/conversations`, { userId, sessionId });
    return response.data;
  } catch (error) {
    console.error('Error creating conversation:', error);
    throw error;
  }
};

export const getConversation = async (sessionId: string) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/conversations/${sessionId}`);
    return response.data;
  } catch (error) {
    console.error('Error getting conversation:', error);
    throw error;
  }
};

export const getMessages = async (conversationId: string) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/conversations/${conversationId}/messages`);
    return response.data;
  } catch (error) {
    console.error('Error getting messages:', error);
    throw error;
  }
};

export const sendGermanProgramEmail = async (emailData: any) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/send-german-program-email`, emailData);
    return response.data;
  } catch (error) {
    console.error('Error sending German program email:', error);
    throw error;
  }
};

export const sendUGProgramEmail = async (emailData: any) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/send-ug-program-email`, emailData);
    return response.data;
  } catch (error) {
    console.error('Error sending UG program email:', error);
    throw error;
  }
};