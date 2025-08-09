import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IMessage extends Document {
  conversationId: mongoose.Types.ObjectId;
  sender: 'user' | 'bot';
  text: string;
  metadata?: {
    type?: string;
    data?: any;
  };
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema: Schema = new Schema(
  {
    conversationId: { 
      type: Schema.Types.ObjectId, 
      ref: 'Conversation', 
      required: true 
    },
    sender: { 
      type: String, 
      enum: ['user', 'bot'], 
      required: true 
    },
    text: { 
      type: String, 
      required: true 
    },
    metadata: {
      type: { type: String },
      data: { type: Schema.Types.Mixed }
    }
  },
  { timestamps: true }
);

MessageSchema.index({ conversationId: 1, createdAt: 1 });

export const Message: Model<IMessage> = mongoose.model<IMessage>(
  'Message',
  MessageSchema
);
