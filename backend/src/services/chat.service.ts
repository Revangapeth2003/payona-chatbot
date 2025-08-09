import mongoose from 'mongoose';
import { Conversation, IConversation } from '../models/conversation.model';
import { Message, IMessage } from '../models/message.model';
// Assuming a User model exists for the createUser method
// import { User, IUser } from '../models/user.model';

// This class contains the core business logic for the chat.
export class ChatService {

    /**
     * Finds a conversation by session ID, or creates a new one if it doesn't exist.
     */
    public async findOrCreateConversation(sessionId: string): Promise<IConversation> {
        // First, try to find the conversation.
        let conversation = await Conversation.findOne({ sessionId });

        // If it doesn't exist, create a new one.
        if (!conversation) {
            conversation = new Conversation({
                sessionId: sessionId,
                state: { initialStep: true } // Initialize with a default state
            });
            await conversation.save();
        }
        return conversation;
    }

    /**
     * Retrieves all messages for a given conversation ID, sorted by creation time.
     */
    public async getMessages(conversationId: string): Promise<IMessage[]> {
        // Check if the provided ID is a valid MongoDB ObjectId to prevent errors.
        if (!mongoose.Types.ObjectId.isValid(conversationId)) {
            console.warn(`Invalid conversationId format: ${conversationId}`);
            return []; // Return an empty array for invalid IDs
        }

        // Find all messages linked to the conversation and sort them chronologically.
        return Message.find({ conversationId: new mongoose.Types.ObjectId(conversationId) }).sort({ createdAt: 'asc' });
    }
    
    /**
     * Creates a new user. (Placeholder logic)
     */
    public async createUser(userData: any): Promise<any> {
        console.log("Creating user with data:", userData);
        // In a real application, you would save the user to the database:
        // const user = new User(userData);
        // await user.save();
        // return user;

        // Returning mock data for now.
        return { id: `user_${Date.now()}`, ...userData };
    }
}
