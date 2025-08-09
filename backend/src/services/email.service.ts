import nodemailer from 'nodemailer';
import { emailConfig, emailTemplates } from '../config/email';

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    // Fix: Use createTransport (not createTransporter)
    this.transporter = nodemailer.createTransport(emailConfig);
  }

  async sendGermanProgramEmail(data: {
    name: string;
    email: string;
    phone: string;
    message: string;
  }): Promise<void> {
    try {
      const { subject, template } = emailTemplates.germanProgram;
      
      const mailOptions = {
        from: emailConfig.auth.user,
        to: process.env.ADMIN_EMAIL || emailConfig.auth.user,
        subject,
        html: template(data)
      };

      await this.transporter.sendMail(mailOptions);
      console.log('✅ German program email sent successfully');
    } catch (error) {
      console.error('❌ Error sending German program email:', error);
      throw error;
    }
  }

  async sendUGProgramEmail(data: {
    name: string;
    email: string;
    phone: string;
    program: string;
    message: string;
  }): Promise<void> {
    try {
      const { subject, template } = emailTemplates.ugProgram;
      
      const mailOptions = {
        from: emailConfig.auth.user,
        to: process.env.ADMIN_EMAIL || emailConfig.auth.user,
        subject,
        html: template(data)
      };

      await this.transporter.sendMail(mailOptions);
      console.log('✅ UG program email sent successfully');
    } catch (error) {
      console.error('❌ Error sending UG program email:', error);
      throw error;
    }
  }
}
