import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { MailService } from '../mails.service';
import { WelcomeMailEvent } from '../events/welcome-mail.event';
import { ProjectAssignedEvent } from '../events/project-assigned.event';
import { ProjectUnassignedEvent } from '../events/project-unassigned.event';

@Injectable()
export class EmailListener {
  private readonly logger = new Logger(EmailListener.name);

  constructor(private readonly mailService: MailService) {}

  @OnEvent('user.welcome')
  async handleWelcomeEmail(event: WelcomeMailEvent) {
    this.logger.log(`Sending welcome email to ${event.email}`);
    await this.mailService.sendMail({
      to: event.email,
      subject: 'Bienvenido a HormiWatch',
      template: 'welcome',
      context: {
        name: event.name,
        lastName: event.lastName,
        year: event.year, // Or dynamic new Date().getFullYear() if preferred
      },
    });
  }

  @OnEvent('project.assigned')
  async handleProjectAssignedEmail(event: ProjectAssignedEvent) {
    this.logger.log(`Sending project assignment email to ${event.email}`);
    await this.mailService.sendMail({
      to: event.email,
      subject: 'Nueva Asignación de Proyecto',
      template: 'project-assignment',
      context: {
        name: event.name,
        projectName: event.projectName,
        projectDescription: event.projectDescription,
        projectId: event.projectId,
        startDate: event.startDate,
        poolHours: event.poolHours,
      },
    });
  }

  @OnEvent('project.unassigned')
  async handleProjectUnassignedEmail(event: ProjectUnassignedEvent) {
    this.logger.log(`Sending project unassignment email to ${event.email}`);
    await this.mailService.sendMail({
      to: event.email,
      subject: 'Desasignación de Proyecto',
      template: 'project-unassignment',
      context: {
        name: event.name,
        projectName: event.projectName,
        projectId: event.projectId, // Though not strictly used in current template
      },
    });
  }
}
