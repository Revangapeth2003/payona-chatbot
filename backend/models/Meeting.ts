import mongoose, { Schema } from 'mongoose';
import { IMeeting } from '../types';

const MeetingSchema: Schema<IMeeting> = new Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  date: {
    type: String,
    required: true
  },
  time: {
    type: String,
    required: true
  },
  timeSlot: {
    type: String,
    required: true
  },
  meetLink: String,
  status: {
    type: String,
    enum: ['scheduled', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model<IMeeting>('Meeting', MeetingSchema);
