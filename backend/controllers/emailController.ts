import { Request, Response } from 'express';
import nodemailer from 'nodemailer';
import { EmailData, ApiResponse } from '../types';

// Create the transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

export const sendUGProgramEmail = async (req: Request, res: Response) => {
  try {
    const emailData: EmailData = req.body;
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: 'team@payanaoverseas.com',
      subject: `New UG Program Application - ${emailData.name}`,
      html: `
        <h2>New UG Program Application</h2>
        <p><strong>Name:</strong> ${emailData.name}</p>
        <p><strong>Age:</strong> ${emailData.age}</p>
        <p><strong>Email:</strong> ${emailData.email}</p>
        <p><strong>Qualification:</strong> ${emailData.qualification}</p>
        <p><strong>UG Major:</strong> ${emailData.ugMajor}</p>
        <p><strong>Work Experience:</strong> ${emailData.workExperience}</p>
        ${emailData.experienceYears ? `<p><strong>Experience Years:</strong> ${emailData.experienceYears}</p>` : ''}
        <p><strong>German Language Ready:</strong> ${emailData.germanLanguageUG}</p>
        <p><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
      `
    };

    await transporter.sendMail(mailOptions);
    
    const response: ApiResponse = {
      success: true,
      message: 'UG Program email sent successfully',
      data: { timestamp: new Date().toISOString(), email: emailData.email }
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error sending UG program email:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to send email' 
    });
  }
};

export const sendGermanProgramEmail = async (req: Request, res: Response) => {
  try {
    const emailData: EmailData = req.body;
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: 'team@payanaoverseas.com',
      subject: `New German Program Application - ${emailData.name}`,
      html: `
        <h2>New German Program Application</h2>
        <p><strong>Name:</strong> ${emailData.name}</p>
        <p><strong>Age:</strong> ${emailData.age}</p>
        <p><strong>Email:</strong> ${emailData.email}</p>
        <p><strong>Purpose:</strong> ${emailData.purpose}</p>
        <p><strong>Passport:</strong> ${emailData.passport}</p>
        <p><strong>Resume:</strong> ${emailData.resume}</p>
        <p><strong>Qualification:</strong> ${emailData.qualification}</p>
        <p><strong>Experience:</strong> ${emailData.experience}</p>
        <p><strong>Interested in Categories:</strong> ${emailData.interestedInCategories}</p>
        <p><strong>German Language:</strong> ${emailData.germanLanguage}</p>
        <p><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
      `
    };

    await transporter.sendMail(mailOptions);
    
    const response: ApiResponse = {
      success: true,
      message: 'German Program email sent successfully',
      data: { timestamp: new Date().toISOString(), email: emailData.email }
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error sending German program email:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to send email' 
    });
  }
};

export const sendConfirmationEmail = async (req: Request, res: Response) => {
  try {
    const { name, email, programType }: EmailData = req.body;
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: `Application Confirmation - ${programType}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0066cc;">Application Confirmation</h2>
          <p>Dear <strong>${name}</strong>,</p>
          <p>Thank you for your interest in our <strong>${programType}</strong>!</p>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">✅ What's Next?</h3>
            <ul>
              <li>Our team has received your application details</li>
              <li>We will review your profile within 24 hours</li>
              <li>You'll receive a follow-up email with next steps</li>
              <li>Our counselor will contact you personally</li>
            </ul>
          </div>
          
          <p>If you have any immediate questions, please reply to this email or call us at <strong>+91 9003619777</strong>.</p>
          
          <br>
          <p>Best regards,<br><strong>PayanaOverseas Team</strong></p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    
    const response: ApiResponse = {
      success: true,
      message: 'Confirmation email sent to user',
      data: { timestamp: new Date().toISOString(), email }
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error sending confirmation email to user:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to send confirmation email' 
    });
  }
};
