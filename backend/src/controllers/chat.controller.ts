import { Request, Response } from 'express';
import { ChatService } from '../services/chat.service';

// This class handles the HTTP requests and calls the appropriate service methods.
export class ChatController {
    private chatService: ChatService;

    constructor() {
        this.chatService = new ChatService();
    }

    // Handles the GET /conversations/:sessionId route
    public getConversation = async (req: Request, res: Response): Promise<void> => {
        try {
            const { sessionId } = req.params;
            // The controller now calls the correct service method.
            const conversation = await this.chatService.findOrCreateConversation(sessionId);
            res.status(200).json(conversation);
        } catch (error) {
            console.error("Error in getConversation:", error);
            res.status(500).json({ message: 'Error fetching or creating conversation', error });
        }
    };

    // Handles the GET /conversations/:conversationId/messages route
    public getMessages = async (req: Request, res: Response): Promise<void> => {
        try {
            const { conversationId } = req.params;
            const messages = await this.chatService.getMessages(conversationId);
            res.status(200).json(messages);
        } catch (error) {
            console.error("Error in getMessages:", error);
            res.status(500).json({ message: 'Error fetching messages', error });
        }
    };

    // Handles the POST /users route
    public createUser = async (req: Request, res: Response): Promise<void> => {
        try {
            const user = await this.chatService.createUser(req.body);
            res.status(201).json(user);
        } catch (error) {
            console.error("Error in createUser:", error);
            res.status(500).json({ message: 'Error creating user', error });
        }
    };
}
