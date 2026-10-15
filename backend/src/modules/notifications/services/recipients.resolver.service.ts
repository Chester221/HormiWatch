import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Not, Repository } from 'typeorm';
import { User } from 'src/modules/users/entities/user.entity';
import { Role } from 'src/modules/role/entities/role.entity';
import { Project } from 'src/modules/projects/entities/project.entity';
import { Task } from 'src/modules/tasks/entities/task.entity';
import { NotificationAudience } from '../events/notification.event';
import { Role as RoleEnum } from 'src/modules/auth/enums/roles.enum';

@Injectable()
export class NotificationRecipientsResolver {
  private readonly logger = new Logger(NotificationRecipientsResolver.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,
    @InjectRepository(Project)
    private readonly projectRepo: Repository<Project>,
  ) {}

  async resolve(audiences: NotificationAudience[]): Promise<string[]> {
    const userIds = new Set<string>();
    for (const aud of audiences) {
      switch (aud.type) {
        case 'users':
          aud.userIds.forEach((id) => userIds.add(id));
          break;
        case 'roles':
          await this.resolveByRoles(aud.roles, userIds);
          break;
        case 'project':
          await this.resolveByProject(aud, userIds);
          break;
      }
    }
    return Array.from(userIds);
  }

  private async resolveByRoles(roles: string[], userIds: Set<string>) {
    const normalized = roles.map((r) => r.toLowerCase());
    const roleEntities = await this.roleRepo.find();
    const roleIds = roleEntities
      .filter((r) => normalized.includes((r.name || '').toLowerCase()))
      .map((r) => r.id);
    if (roleIds.length === 0) return;
    const users = await this.userRepo.find({
      where: { role: { id: In(roleIds) }, isActive: true },
      select: ['id'],
    });
    users.forEach((u) => userIds.add(u.id));
  }

  private async resolveByProject(
    aud: {
      type: 'project';
      projectId: string;
      includeLeader?: boolean;
      includeTechnicians?: boolean;
      includeAdmins?: boolean;
    },
    userIds: Set<string>,
  ) {
    const project = await this.projectRepo.findOne({
      where: { id: aud.projectId },
      relations: ['projectLeader', 'technicians'],
    });
    if (!project) return;

    if (aud.includeLeader !== false && project.projectLeader?.id) {
      const leader = await this.userRepo.findOne({
        where: { id: project.projectLeader.id, isActive: true },
        select: ['id'],
      });
      if (leader) userIds.add(leader.id);
    }
    if (aud.includeTechnicians !== false && project.technicians?.length) {
      const techIds = project.technicians.map((t) => t.id);
      const activeTechs = await this.userRepo.find({
        where: { id: In(techIds), isActive: true },
        select: ['id'],
      });
      activeTechs.forEach((t) => userIds.add(t.id));
    }
    if (aud.includeAdmins) {
      const adminUsers = await this.userRepo
        .createQueryBuilder('u')
        .leftJoin('u.role', 'r')
        .where('LOWER(r.name)=:name', { name: RoleEnum.admin.toLowerCase() })
        .andWhere('u.isActive = true')
        .select(['u.id'])
        .getMany();
      adminUsers.forEach((u) => userIds.add(u.id));
    }
  }
}
