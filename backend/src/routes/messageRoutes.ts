import express from 'express';
import { processConversation, initializeChat, getAllMessages, getSessionStats } from '../controllers/messageController';

const router = express.Router();

// Logging middleware
router.use((req, res, next) => {
  console.log(`📨 Message Route: ${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

// Progressive conversation routes
router.post('/conversation/init', initializeChat);
router.post('/conversation/process', processConversation);

// Message retrieval routes
router.get('/messages/:sessionId?', getAllMessages);

// Database verification route
router.get('/session/:sessionId/stats', getSessionStats);

// Test route
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Message routes are working!',
    timestamp: new Date().toISOString()
  });
});

export default router;
