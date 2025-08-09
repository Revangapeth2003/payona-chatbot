import { Request, Response } from 'express';
import { ChatService } from '../services/chat.service';

// This class will handle all incoming requests from the routes.
export class ChatController {
    private chatService: ChatService;

    constructor() {
        this.chatService = new ChatService();
    }

    // Handles request to get or create a conversation
    public getConversation = async (req: Request, res: Response): Promise<void> => {
        try {
            const { sessionId } = req.params;
            const conversation = await this.chatService.findOrCreateConversation(sessionId);
            res.status(200).json(conversation);
        } catch (error) {
            res.status(500).json({ message: 'Error fetching conversation', error });
        }
    };

    // Handles request to get messages for a conversation
    public getMessages = async (req: Request, res: Response): Promise<void> => {
        try {
            const { conversationId } = req.params;
            const messages = await this.chatService.getMessages(conversationId);
            res.status(200).json(messages);
        } catch (error) {
            res.status(500).json({ message: 'Error fetching messages', error });
        }
    };
}
