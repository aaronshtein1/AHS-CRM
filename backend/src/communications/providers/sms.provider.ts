import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface SmsSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface SmsPayload {
  to: string;
  body: string;
}

@Injectable()
export class SmsProvider {
  private readonly logger = new Logger(SmsProvider.name);
  private twilioClient: any = null;

  constructor(private readonly configService: ConfigService) {
    this.initializeTwilio();
  }

  private initializeTwilio() {
    const accountSid = this.configService.get('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get('TWILIO_AUTH_TOKEN');

    if (accountSid && authToken) {
      try {
        // Dynamic import to avoid issues if twilio is not installed
        const twilio = require('twilio');
        this.twilioClient = twilio(accountSid, authToken);
        this.logger.log('Twilio client configured');
      } catch (error) {
        this.logger.warn('Twilio package not available - SMS will be stubbed');
      }
    } else {
      this.logger.warn('Twilio not configured - SMS will be logged only');
    }
  }

  async send(payload: SmsPayload): Promise<SmsSendResult> {
    const from = this.configService.get('TWILIO_PHONE_NUMBER', '+1234567890');

    this.logger.log(`Sending SMS to ${payload.to}`);

    // If Twilio is configured, send real SMS
    if (this.twilioClient) {
      try {
        const message = await this.twilioClient.messages.create({
          body: payload.body,
          from,
          to: payload.to,
        });

        this.logger.log(`SMS sent: ${message.sid}`);

        return {
          success: true,
          messageId: message.sid,
        };
      } catch (error: any) {
        this.logger.error(`Failed to send SMS: ${error.message}`);
        return {
          success: false,
          error: error.message,
        };
      }
    }

    // Stub mode - just log and return success
    this.logger.log('[STUB] SMS would be sent:');
    this.logger.log(`  To: ${payload.to}`);
    this.logger.log(`  Body: ${payload.body}`);

    return {
      success: true,
      messageId: `stub-sms-${Date.now()}`,
    };
  }

  // Webhook handler for delivery status updates
  async handleWebhook(data: {
    MessageSid: string;
    MessageStatus: string;
    ErrorCode?: string;
  }): Promise<void> {
    this.logger.log(`SMS status update: ${data.MessageSid} -> ${data.MessageStatus}`);
    // In a real implementation, update the communication record
  }
}
