import express from 'express';
import { 
  sendUGProgramEmail, 
  sendGermanProgramEmail, 
  sendConfirmationEmail 
} from '../controllers/emailController';

const router = express.Router();

router.post('/send-email/send-ug-program-email', sendUGProgramEmail);
router.post('/send-email/send-german-program-email', sendGermanProgramEmail);
router.post('/send-email/send-confirmation-email', sendConfirmationEmail);

export default router;
