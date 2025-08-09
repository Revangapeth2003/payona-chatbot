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
    required: [true, 'Message text is required'],
    trim: true,
    maxlength: [10000, 'Message text cannot exceed 10000 characters']
  },
  sender: {
    type: String,
    enum: ['user', 'bot'],
    required: [true, 'Sender is required']
  },
  sessionId: {
    type: String,
    required: [true, 'Session ID is required'],
    index: true,
    trim: true
  },
  step: {
    type: Number,
    default: 0,
    min: 0
  },
  messageIndex: {
    type: Number,
    default: 0,
    min: 0
  },
  timestamp: {
    type: Date,
    default: Date.now,
    required: true
  }
}, {
  timestamps: true, // Adds createdAt and updatedAt automatically
  collection: 'messages' // Explicit collection name
});

// Compound indexes for better query performance
MessageSchema.index({ sessionId: 1, timestamp: 1 });
MessageSchema.index({ sessionId: 1, step: 1, messageIndex: 1 });
MessageSchema.index({ sender: 1, timestamp: 1 });

// Pre-save middleware for logging
MessageSchema.pre('save', function(next) {
  console.log(`💾 Saving message: ${this.sender} - "${this.text.substring(0, 50)}..." to session ${this.sessionId}`);
  next();
});

// Post-save middleware for confirmation
MessageSchema.post('save', function(doc) {
  console.log(`✅ Message saved successfully with ID: ${doc._id}`);
});

export default mongoose.model<IMessage>('Message', MessageSchema);
