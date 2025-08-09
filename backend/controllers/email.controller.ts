import { Request, Response } from 'express';
import { ChatService } from '../src/services/chat.service';

export class EmailController {
  private chatService: ChatService;

  constructor() {
    this.chatService = new ChatService();
  }

  sendGermanProgramEmail = async (req: Request, res: Response): Promise<void> => {
    try {
      const { name, email, phone, message } = req.body;
      
      if (!name || !email || !message) {
        res.status(400).json({ error: 'Name, email, and message are required' });
        return;
      }

      const success = await this.chatService.sendGermanProgramEmail({
        name,
        email,
        phone,
        message
      });

      if (success) {
        res.json({ success: true, message: 'Email sent successfully' });
      } else {
        res.status(500).json({ success: false, error: 'Failed to send email' });
      }
    } catch (error) {
      console.error('Error sending German program email:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  };

  sendUGProgramEmail = async (req: Request, res: Response): Promise<void> => {
    try {
      const { name, email, phone, program, message } = req.body;
      
      if (!name || !email || !program || !message) {
        res.status(400).json({ error: 'Name, email, program, and message are required' });
        return;
      }

      const success = await this.chatService.sendUGProgramEmail({
        name,
        email,
        phone,
        program,
        message
      });

      if (success) {
        res.json({ success: true, message: 'Email sent successfully' });
      } else {
        res.status(500).json({ success: false, error: 'Failed to send email' });
      }
    } catch (error) {
      console.error('Error sending UG program email:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  };
}
