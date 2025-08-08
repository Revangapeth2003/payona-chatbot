import express from 'express';
import { getMessages, saveMessage } from '../controllers/messageController';

const router = express.Router();

router.get('/messages', getMessages);
router.post('/messages', saveMessage);

export default router;
