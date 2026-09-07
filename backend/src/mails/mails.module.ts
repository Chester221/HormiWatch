import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MailService } from './mails.service';
import { MailsController } from './mails.controller';
import { MAIL_PROVIDER } from './interfaces/mail-provider.interface';
import { NodemailerProvider } from './providers/nodemailer.provider';
import { EmailListener } from './listeners/email.listener';
import smtpConfig from '../config/smtp.config';

@Module({
  imports: [ConfigModule.forFeature(smtpConfig)],
  controllers: [MailsController],
  providers: [
    MailService,
    EmailListener,
    {
      provide: MAIL_PROVIDER,
      useClass: NodemailerProvider,
    },
  ],
  exports: [MailService],
})
export class MailsModule {}
