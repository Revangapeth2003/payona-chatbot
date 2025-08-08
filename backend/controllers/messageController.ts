import { Request, Response } from 'express';
import Message from '../models/Message';

export const getMessages = async (req: Request, res: Response) => {
  try {
    const messages = await Message.find().sort({ timestamp: 1 });
    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
};

export const saveMessage = async (req: Request, res: Response) => {
  try {
    const { text, sender } = req.body;
    
    if (!text || !sender) {
      return res.status(400).json({ error: 'Text and sender are required' });
    }

    const message = new Message({ text, sender });
    const savedMessage = await message.save();
    
    res.status(201).json(savedMessage);
  } catch (error) {
    console.error('Error saving message:', error);
    res.status(500).json({ error: 'Failed to save message' });
  }
};
