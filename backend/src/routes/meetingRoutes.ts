import express from 'express';
import { scheduleMeeting } from '../controllers/meetingController';

const router = express.Router();

router.post('/schedule-meeting', scheduleMeeting);

export default router;
