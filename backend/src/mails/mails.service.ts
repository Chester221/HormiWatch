import { Injectable, Inject, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Handlebars from 'handlebars';
import { join } from 'path';
import { readFile } from 'fs/promises';
import * as mailProviderInterface from './interfaces/mail-provider.interface';
import { SendMailDto } from './dto/send-mail.dto';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(
    @Inject(mailProviderInterface.MAIL_PROVIDER)
    private readonly mailProvider: mailProviderInterface.IMailProvider,
    private readonly configService: ConfigService,
  ) {}

  async sendMail(sendMailDto: SendMailDto) {
    try {
      const { to, subject, template, context, attachments } = sendMailDto;

      // Inject global variables like frontend URL
      const finalContext = {
        ...context,
        url: this.configService.get<string>('FRONTEND_URL') || '#',
      };

      const html = await this.compileTemplate(template, finalContext);

      await this.mailProvider.sendMail({
        to,
        subject,
        template: html,
        context: finalContext,
        attachments,
      });

      return { success: true, message: 'Email sent successfully' };
    } catch (error: any) {
      this.logger.error(`Failed to send email: ${error.message}`, error.stack);
      throw error;
    }
  }

  private async compileTemplate(
    templateName: string,
    context: Record<string, any>,
  ): Promise<string> {
    const templatePath = join(
      process.cwd(),
      'src',
      'mails',
      'mail_templates',
      `${templateName}.hbs`,
    );

    try {
      const source = await readFile(templatePath, 'utf8');
      const compiled = Handlebars.compile(source);
      return compiled(context);
    } catch (error: any) {
      this.logger.error(
        `Error compiling template ${templateName}: ${error.message}`,
      );
      throw new Error(`Template ${templateName} not found or invalid.`);
    }
  }
}
