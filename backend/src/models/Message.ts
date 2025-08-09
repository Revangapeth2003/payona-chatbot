import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage extends Document {
  text: string;
  sender: 'user' | 'bot';
  sessionId: string;
  step?: number;
  messageIndex?: number;
  timestamp: Date;
}

const MessageSchema: Schema = new Schema({
  text: {
    type: String,
    required: true
  },
  sender: {
    type: String,
    enum: ['user', 'bot'],
    required: true
  },
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  step: {
    type: Number,
    default: 0
  },
  messageIndex: {
    type: Number,
    default: 0
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient querying
MessageSchema.index({ sessionId: 1, timestamp: 1 });
MessageSchema.index({ sessionId: 1, step: 1, messageIndex: 1 });

export default mongoose.model<IMessage>('Message', MessageSchema);
