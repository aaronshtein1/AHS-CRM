import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface EmailPayload {
  to: string;
  subject: string;
  body: string;
  html?: string;
}

@Injectable()
export class EmailProvider {
  private readonly logger = new Logger(EmailProvider.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(private readonly configService: ConfigService) {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    const host = this.configService.get('SMTP_HOST');
    const port = this.configService.get('SMTP_PORT');
    const user = this.configService.get('SMTP_USER');
    const pass = this.configService.get('SMTP_PASS');

    if (host && port) {
      this.transporter = nodemailer.createTransport({
        host,
        port: parseInt(port, 10),
        secure: port === '465',
        auth: user && pass ? { user, pass } : undefined,
      });

      this.logger.log('Email transporter configured');
    } else {
      this.logger.warn('SMTP not configured - emails will be logged only');
    }
  }

  async send(payload: EmailPayload): Promise<EmailSendResult> {
    const from = this.configService.get('EMAIL_FROM', 'noreply@patientcrm.com');

    this.logger.log(`Sending email to ${payload.to}: ${payload.subject}`);

    // If SMTP is configured, send real email
    if (this.transporter) {
      try {
        const info = await this.transporter.sendMail({
          from,
          to: payload.to,
          subject: payload.subject,
          text: payload.body,
          html: payload.html || payload.body.replace(/\n/g, '<br>'),
        });

        this.logger.log(`Email sent: ${info.messageId}`);

        return {
          success: true,
          messageId: info.messageId,
        };
      } catch (error: any) {
        this.logger.error(`Failed to send email: ${error.message}`);
        return {
          success: false,
          error: error.message,
        };
      }
    }

    // Stub mode - just log and return success
    this.logger.log('[STUB] Email would be sent:');
    this.logger.log(`  To: ${payload.to}`);
    this.logger.log(`  Subject: ${payload.subject}`);
    this.logger.log(`  Body: ${payload.body.substring(0, 100)}...`);

    return {
      success: true,
      messageId: `stub-${Date.now()}`,
    };
  }

  async verifyConnection(): Promise<boolean> {
    if (!this.transporter) {
      return false;
    }

    try {
      await this.transporter.verify();
      return true;
    } catch {
      return false;
    }
  }
}
