import mongoose, { Document, Schema } from 'mongoose';

// Export the interface directly as a named export
export interface IMessage extends Document {
  _id: mongoose.Types.ObjectId;
  content: string;
  sender: string;
  recipient: string;
  timestamp: Date;
  isRead: boolean;
}

const MessageSchema: Schema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
    trim: true
  },
  sender: {
    type: String,
    required: true
  },
  recipient: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  isRead: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Create the model
const MessageModel = mongoose.model<IMessage>('Message', MessageSchema);

// Default export the model
export default MessageModel;
