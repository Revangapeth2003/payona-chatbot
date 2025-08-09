import { Router } from 'express';
import { ChatController } from '../controllers/chat.controller';

const router = Router();
const chatController = new ChatController();

// Test route
router.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'Backend is running!' });
});

// Use the controller to handle the logic
router.get('/conversations/:sessionId', chatController.getConversation);
router.get('/conversations/:conversationId/messages', chatController.getMessages);

export default router;
