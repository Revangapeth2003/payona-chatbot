import { Request, Response } from 'express';
import nodemailer from 'nodemailer';
import Meeting from '../models/Meeting';
import { MeetingData, ApiResponse } from '../../types';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Fixed: Added explicit return statements
export const scheduleMeeting = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, date, time, timeSlot }: MeetingData = req.body;
    
    // Input validation
    if (!name || !email || !date || !timeSlot) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: name, email, date, or timeSlot'
      });
      return; // Fixed: Explicit return
    }

    // Generate Google Meet link
    const meetLink = `https://meet.google.com/new`;
    
    // Save meeting to database
    const meeting = new Meeting({
      name,
      email,
      date,
      time,
      timeSlot,
      meetLink,
      status: 'scheduled'
    });
    
    const savedMeeting = await meeting.save();
    
    // Send email notification
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: `Meeting Scheduled - PayanaOverseas Consultation`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0066cc;">Meeting Confirmation</h2>
          <p>Dear <strong>${name}</strong>,</p>
          <p>Your consultation meeting has been scheduled successfully:</p>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>📅 Date:</strong> ${date}</p>
            <p><strong>🕒 Time:</strong> ${timeSlot}</p>
            <p><strong>🔗 Meeting Link:</strong> <a href="${meetLink}" style="color: #0066cc;">${meetLink}</a></p>
          </div>
          
          <p>Our team will contact you shortly to confirm the details and provide any additional information.</p>
          <br>
          <p>Best regards,<br><strong>PayanaOverseas Team</strong></p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    
    const response: ApiResponse = {
      success: true,
      message: 'Meeting scheduled successfully',
      data: { 
        meetingId: savedMeeting._id,
        email, 
        date, 
        timeSlot,
        meetLink 
      }
    };
    
    res.json(response);
    return; // Fixed: Explicit return
  } catch (error) {
    console.error('Error scheduling meeting:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to schedule meeting' 
    });
    return; // Fixed: Explicit return
  }
};
