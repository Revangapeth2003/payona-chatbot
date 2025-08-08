import { Request, Response } from 'express';
import Message from '../models/Message';
import { ApiResponse } from '../types';

export const getMessages = async (req: Request, res: Response): Promise<void> => {
  try {
    const messages = await Message.find().sort({ timestamp: 1 });
    const response: ApiResponse = {
      success: true,
      count: messages.length,
      data: messages
    };
    res.json(response);
    return; // Fixed: Explicit return
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch messages' 
    });
    return; // Fixed: Explicit return
  }
};

// Fixed: Added explicit return statements
export const saveMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { text, sender, sessionId } = req.body;
    
    if (!text || !sender) {
      res.status(400).json({ 
        success: false, 
        error: 'Text and sender are required' 
      });
      return; // Fixed: Explicit return
    }

    const message = new Message({ 
      text, 
      sender,
      sessionId: sessionId || new Date().toISOString()
    });
    const savedMessage = await message.save();
    
    res.status(201).json({
      success: true,
      message: 'Message saved successfully',
      data: savedMessage
    });
    return; // Fixed: Explicit return
  } catch (error) {
    console.error('Error saving message:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to save message' 
    });
    return; // Fixed: Explicit return
  }
};
