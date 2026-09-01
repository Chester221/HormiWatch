import { Controller, Post, Body } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { MailService } from './mails.service';
import { SendMailDto } from './dto/send-mail.dto';
import { SkipAuth } from 'src/modules/auth/decorator/skipAuth.decorator';

@ApiBearerAuth()
@ApiTags('Mails')
@Controller('mails')
export class MailsController {
  constructor(private readonly mailsService: MailService) {}

  @Post('send')
  @SkipAuth()
  @ApiOperation({ summary: 'Send an email using a template' })
  @ApiResponse({ status: 201, description: 'Email sent successfully.' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  async sendMail(@Body() sendMailDto: SendMailDto) {
    return await this.mailsService.sendMail(sendMailDto);
  }
}
