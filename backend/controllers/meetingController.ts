import { Request, Response } from 'express';
import { google } from 'googleapis';
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({  // Fixed: createTransport (not createTransporter)
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

export const scheduleMeeting = async (req: Request, res: Response) => {
  try {
    const { name, email, date, time, timeSlot } = req.body;
    
    // Input validation
    if (!name || !email || !date || !timeSlot) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: name, email, date, or timeSlot'
      });
    }

    // Generate Google Meet link (simplified version)
    const meetLink = `https://meet.google.com/new`;
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: `Meeting Scheduled - PayanaOverseas Consultation`,
      html: `
        <h2>Meeting Confirmation</h2>
        <p>Dear ${name},</p>
        <p>Your consultation meeting has been scheduled:</p>
        <p><strong>Date:</strong> ${date}</p>
        <p><strong>Time:</strong> ${timeSlot}</p>
        <p><strong>Meeting Link:</strong> <a href="${meetLink}">${meetLink}</a></p>
        <p>Our team will contact you shortly to confirm the details.</p>
        <br>
        <p>Best regards,<br>PayanaOverseas Team</p>
      `
    };

    await transporter.sendMail(mailOptions);
    
    res.json({
      success: true,
      message: 'Meeting scheduled successfully',
      data: { email, date, meetLink }
    });
  } catch (error) {
    console.error('Error scheduling meeting:', error);
    res.status(500).json({ success: false, message: 'Failed to schedule meeting' });
  }
};
