import express, { Request, Response, Router } from 'express';
import nodemailer, { Transporter } from 'nodemailer';
import { EmailData } from '../../types';

const router: Router = express.Router();

// Email configuration
const transporter: Transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Send UG Program Email
router.post('/send-ug-program-email', async (req: Request, res: Response) => {
  try {
    const emailData: EmailData = req.body;
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: 'info@payanaoverseas.com',
      cc: emailData.email,
      subject: `New UG Program Inquiry - ${emailData.name}`,
      html: `
        <h2>New UG Program Inquiry</h2>
        <p><strong>Name:</strong> ${emailData.name}</p>
        <p><strong>Age:</strong> ${emailData.age}</p>
        <p><strong>Email:</strong> ${emailData.email}</p>
        <p><strong>Program Type:</strong> ${emailData.programType}</p>
        <p><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
      `
    };
    
    await transporter.sendMail(mailOptions);
    
    res.json({
      success: true,
      message: 'Email sent successfully',
      data: { timestamp: new Date() }
    });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to send email' 
    });
  }
});

// Send German Program Email
router.post('/send-german-program-email', async (req: Request, res: Response) => {
  try {
    const emailData: EmailData = req.body;
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: 'info@payanaoverseas.com',
      cc: emailData.email,
      subject: `New German Program Inquiry - ${emailData.name}`,
      html: `
        <h2>New German Program Inquiry</h2>
        <p><strong>Name:</strong> ${emailData.name}</p>
        <p><strong>Age:</strong> ${emailData.age}</p>
        <p><strong>Email:</strong> ${emailData.email}</p>
        <p><strong>Program Type:</strong> ${emailData.programType}</p>
        <p><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
      `
    };
    
    await transporter.sendMail(mailOptions);
    
    res.json({
      success: true,
      message: 'Email sent successfully',
      data: { timestamp: new Date() }
    });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to send email' 
    });
  }
});

// Send Confirmation Email
router.post('/send-confirmation-email', async (req: Request, res: Response) => {
  try {
    const emailData: EmailData = req.body;
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: emailData.userEmail || emailData.email,
      subject: `Thank you for your inquiry - Payana Overseas`,
      html: `
        <h2>Thank you for contacting Payana Overseas!</h2>
        <p>Dear ${emailData.name},</p>
        <p>Thank you for your interest in our ${emailData.programType} services.</p>
        <p>Our team will contact you shortly.</p>
      `
    };
    
    await transporter.sendMail(mailOptions);
    
    res.json({
      success: true,
      message: 'Confirmation email sent successfully'
    });
  } catch (error) {
    console.error('Error sending confirmation email:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to send confirmation email' 
    });
  }
});

export default router;
