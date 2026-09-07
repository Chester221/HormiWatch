import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { IMailProvider } from '../interfaces/mail-provider.interface';
import { IMailOptions } from '../interfaces/mail-options.interface';

@Injectable()
export class NodemailerProvider implements IMailProvider {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(NodemailerProvider.name);

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('smtp.host'),
      port: this.configService.get<number>('smtp.port'),
      secure: this.configService.get<boolean>('smtp.secure'),
      auth: {
        user: this.configService.get<string>('smtp.auth.user'),
        pass: this.configService.get<string>('smtp.auth.pass'),
      },
    });
  }

  async sendMail(options: IMailOptions): Promise<void> {
    try {
      const from = this.configService.get<string>('smtp.from');
      await this.transporter.sendMail({
        from: `"${from}" <${this.configService.get<string>('smtp.auth.user')}>`, // Fallback or customize
        to: options.to,
        subject: options.subject,
        html: options.template, // In this context, 'template' passed to provider is already the compiled HTML
        attachments: options.attachments,
      });
      this.logger.log(`Email sent to ${options.to}`);
    } catch (error: any) {
      this.logger.error(
        `Error sending email using Nodemailer: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
