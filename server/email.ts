import sgMail from '@sendgrid/mail';
import nodemailer from 'nodemailer';
import { logger } from './logger';

// Email configuration
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587', 10);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@sacma.edu.vn';
const FROM_NAME = process.env.FROM_NAME || 'SACMA Du Học';

// Initialize SendGrid if API key is available
if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

// Create nodemailer transporter for fallback
const createTransporter = () => {
  if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
    return nodemailer.createTransporter({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });
  }
  return null;
};

interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

// Email templates
const templates = {
  adminInvite: (setupUrl: string, inviterName: string): EmailTemplate => ({
    subject: 'Lời mời tham gia hệ thống SACMA - Du Học Hàn Quốc',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1E3A8A;">Chào mừng bạn đến với SACMA!</h2>
        <p>Bạn đã được <strong>${inviterName}</strong> mời tham gia hệ thống quản lý du học SACMA với vai trò Admin.</p>
        <p>Vui lòng click vào nút bên dưới để thiết lập mật khẩu và kích hoạt tài khoản:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${setupUrl}" 
             style="background-color: #2563EB; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Thiết lập tài khoản
          </a>
        </div>
        <p style="color: #666; font-size: 14px;">Link này sẽ hết hạn sau 24 giờ. Nếu bạn không yêu cầu tài khoản này, vui lòng bỏ qua email.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="color: #999; font-size: 12px;">
          SACMA - Hệ thống quản lý du học Hàn Quốc<br>
          Email: support@sacma.edu.vn | Hotline: 1900-xxxx
        </p>
      </div>
    `,
    text: `Chào mừng bạn đến với SACMA!\n\nBạn đã được ${inviterName} mời tham gia hệ thống quản lý du học SACMA.\n\nVui lòng truy cập link sau để thiết lập mật khẩu: ${setupUrl}\n\nLink này sẽ hết hạn sau 24 giờ.`,
  }),

  passwordReset: (resetUrl: string): EmailTemplate => ({
    subject: 'Yêu cầu đặt lại mật khẩu - SACMA',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1E3A8A;">Đặt lại mật khẩu</h2>
        <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.</p>
        <p>Vui lòng click vào nút bên dưới để đặt lại mật khẩu:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" 
             style="background-color: #2563EB; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Đặt lại mật khẩu
          </a>
        </div>
        <p style="color: #666; font-size: 14px;">Link này sẽ hết hạn sau 1 giờ. Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email.</p>
      </div>
    `,
    text: `Yêu cầu đặt lại mật khẩu\n\nVui lòng truy cập: ${resetUrl}\n\nLink hết hạn sau 1 giờ.`,
  }),

  notification: (title: string, message: string, actionUrl?: string): EmailTemplate => ({
    subject: title,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1E3A8A;">${title}</h2>
        <p>${message}</p>
        ${actionUrl ? `
        <div style="text-align: center; margin: 30px 0;">
          <a href="${actionUrl}" 
             style="background-color: #2563EB; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Xem chi tiết
          </a>
        </div>
        ` : ''}
      </div>
    `,
    text: `${title}\n\n${message}${actionUrl ? `\n\nXem chi tiết: ${actionUrl}` : ''}`,
  }),
};

// Send email function
export async function sendEmail(
  to: string,
  template: EmailTemplate,
  options: { cc?: string[]; bcc?: string[]; attachments?: any[] } = {}
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const msg = {
    to,
    from: { email: FROM_EMAIL, name: FROM_NAME },
    subject: template.subject,
    text: template.text,
    html: template.html,
    ...options,
  };

  try {
    // Try SendGrid first
    if (SENDGRID_API_KEY) {
      const response = await sgMail.send(msg);
      logger.info('Email sent via SendGrid', { to, subject: template.subject });
      return { success: true, messageId: response[0]?.headers['x-message-id'] };
    }

    // Fallback to SMTP
    const transporter = createTransporter();
    if (transporter) {
      const info = await transporter.sendMail(msg);
      logger.info('Email sent via SMTP', { to, subject: template.subject, messageId: info.messageId });
      return { success: true, messageId: info.messageId };
    }

    // No email service configured
    logger.warn('No email service configured', { to, subject: template.subject });
    return { success: false, error: 'No email service configured' };
  } catch (error) {
    logger.error('Failed to send email', { to, subject: template.subject, error: (error as Error).message });
    return { success: false, error: (error as Error).message };
  }
}

// Send admin invite email
export async function sendAdminInviteEmail(
  to: string,
  setupUrl: string,
  inviterName: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const template = templates.adminInvite(setupUrl, inviterName);
  return sendEmail(to, template);
}

// Send password reset email
export async function sendPasswordResetEmail(
  to: string,
  resetUrl: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const template = templates.passwordReset(resetUrl);
  return sendEmail(to, template);
}

// Send notification email
export async function sendNotificationEmail(
  to: string,
  title: string,
  message: string,
  actionUrl?: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const template = templates.notification(title, message, actionUrl);
  return sendEmail(to, template);
}

// Test email configuration
export async function testEmailConfig(): Promise<{ configured: boolean; provider?: string; error?: string }> {
  if (SENDGRID_API_KEY) {
    return { configured: true, provider: 'SendGrid' };
  }
  if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
    return { configured: true, provider: 'SMTP' };
  }
  return { configured: false, error: 'No email service configured' };
}
