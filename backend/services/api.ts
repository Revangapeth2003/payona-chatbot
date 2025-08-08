const API_BASE_URL = 'http://localhost:3000/api';

export const postMessage = async (messageData: any) => {
  try {
    const response = await fetch(`${API_BASE_URL}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messageData)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error: unknown) { // Fixed: Explicitly type error as unknown
    console.error('Error posting message:', error);
    throw error; // Fixed: Just throw the error, don't return it
  }
};
