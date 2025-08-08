import mongoose, { Schema } from 'mongoose';
import { IMessage } from '../types';

const MessageSchema: Schema<IMessage> = new Schema({
  text: {
    type: String,
    required: true
  },
  sender: {
    type: String,
    enum: ['bot', 'user'],
    required: true
  },
  sessionId: {
    type: String,
    default: () => new mongoose.Types.ObjectId().toString()
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  step: {
    type: Number,
    required: false
  }
});

export default mongoose.model<IMessage>('Message', MessageSchema);
