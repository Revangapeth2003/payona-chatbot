import mongoose, { Schema, model } from 'mongoose';
import { IUser, IMessage, IConversation } from '../types';

const messageSchema = new Schema<IMessage>({
  text: {
    type: String,
    required: true
  },
  sender: {
    type: String,
    enum: ['user', 'bot'],
    required: true
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

const conversationSchema = new Schema<IConversation>({
  sessionId: {
    type: String,
    required: true,
    default: () => new Date().toISOString()
  },
  messages: [messageSchema],
  userInfo: {
    name: { type: String },
    age: { type: String },
    email: { type: String },
    purpose: { type: String },
    qualification: { type: String },
    ugMajor: { type: String },
    workExperience: { type: String },
    experienceYears: { type: String },
    preferredCountry: { type: String },
    currentFlow: { type: String }
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  emailSent: {
    type: Boolean,
    default: false
  },
  meetingScheduled: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const userSchema = new Schema<IUser>({
  sessionEmail: {
    type: String,
    required: true,
    unique: true
  },
  conversations: [conversationSchema]
}, {
  timestamps: true
});

export default model<IUser>('User', userSchema);
