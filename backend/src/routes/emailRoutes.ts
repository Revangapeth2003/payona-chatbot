import express from 'express';
import { 
  sendUGProgramEmailRoute, 
  sendGermanProgramEmailRoute, 
  sendConfirmationEmailRoute 
} from '../controllers/emailController';

const router = express.Router();

// Add logging middleware
router.use((req, res, next) => {
  console.log(`📧 Email Route: ${req.method} ${req.path}`);
  next();
});

// Email routes with proper error handling
router.post('/send-email/send-ug-program-email', async (req, res, next) => {
  try {
    await sendUGProgramEmailRoute(req, res);
  } catch (error) {
    next(error);
  }
});

router.post('/send-email/send-german-program-email', async (req, res, next) => {
  try {
    await sendGermanProgramEmailRoute(req, res);
  } catch (error) {
    next(error);
  }
});

router.post('/send-email/send-confirmation-email', async (req, res, next) => {
  try {
    await sendConfirmationEmailRoute(req, res);
  } catch (error) {
    next(error);
  }
});

// Test route
router.get('/email/test', (req, res) => {
  console.log('📧 Email test route hit');
  res.json({
    success: true,
    message: 'Email routes are working!',
    timestamp: new Date().toISOString()
  });
});

export default router;
