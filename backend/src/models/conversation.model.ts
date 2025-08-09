import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IConversation extends Document {
  userId?: mongoose.Types.ObjectId;
  sessionId: string;
  state: any;
  isTyping: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ConversationSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    sessionId: { type: String, required: true, unique: true },
    state: { type: Schema.Types.Mixed, default: {} },
    isTyping: { type: Boolean, default: false }
  },
  { timestamps: true }
);

ConversationSchema.index({ sessionId: 1 });
ConversationSchema.index({ userId: 1 });

export const Conversation: Model<IConversation> = mongoose.model<IConversation>(
  'Conversation',
  ConversationSchema
);
