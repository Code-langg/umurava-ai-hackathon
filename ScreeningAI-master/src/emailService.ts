import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  private getTransporter(): nodemailer.Transporter {
    if (!this.transporter) {
      // Check if real SMTP credentials are provided
      const smtpHost = process.env.SMTP_HOST;
      const smtpPort = process.env.SMTP_PORT;
      const smtpUser = process.env.SMTP_USER;
      const smtpPass = process.env.SMTP_PASS;

      if (smtpHost && smtpPort && smtpUser && smtpPass) {
        // Use real SMTP
        this.transporter = nodemailer.createTransport({
          host: smtpHost,
          port: parseInt(smtpPort),
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: smtpUser,
            pass: smtpPass
          }
        });
      } else {
        // For development, use Ethereal (fake SMTP service)
        // You can get real credentials from https://ethereal.email
        this.transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: process.env.ETHEREAL_USER || 'your-ethereal-user@ethereal.email',
            pass: process.env.ETHEREAL_PASS || 'your-ethereal-pass'
          }
        });
      }
    }

    return this.transporter!;
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    try {
      const transporter = this.getTransporter();
      const info = await transporter.sendMail({
        from: '"Hireloop" <noreply@hireloop.com>',
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text
      });

      console.log('Email sent successfully:', info.messageId);
      console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
    } catch (error) {
      console.error('Failed to send email (this is normal in development):', error);
      // Don't throw error in development - just log it
      console.log('For development: Email would be sent to:', options.to);
      console.log('Subject:', options.subject);
    }
  }

  async sendPasswordResetEmail(email: string, resetToken: string): Promise<void> {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:8081'}/reset-password?token=${resetToken}`;

    // For development, log the reset link to console
    console.log(`\n=== PASSWORD RESET LINK ===`);
    console.log(`Email: ${email}`);
    console.log(`Reset URL: ${resetUrl}`);
    console.log(`Token: ${resetToken}`);
    console.log(`===========================\n`);

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Reset Your Password</h2>
        <p>You requested a password reset for your Hireloop account.</p>
        <p>Click the button below to reset your password:</p>
        <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px; margin: 16px 0;">Reset Password</a>
        <p>If the button doesn't work, copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #666;">${resetUrl}</p>
        <p>This link will expire in 15 minutes.</p>
        <p>If you didn't request this reset, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">This email was sent by Hireloop AI Talent Screening.</p>
      </div>
    `;

    const text = `
      Reset Your Password

      You requested a password reset for your Hireloop account.

      Click this link to reset your password: ${resetUrl}

      This link will expire in 15 minutes.

      If you didn't request this reset, please ignore this email.

      This email was sent by Hireloop AI Talent Screening.
    `;

    await this.sendEmail({
      to: email,
      subject: 'Reset Your Hireloop Password',
      html,
      text
    });
  }
}

export const emailService = new EmailService();