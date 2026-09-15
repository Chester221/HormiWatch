import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { Project } from './entities/project.entity';
import { ProjectPageOptionsDto } from './dto/project-page-options.dto';
import { PageDto } from '../../common/pagination/pagination.dto';
import { PageMeta } from '../../common/pagination/metadata';
import { User } from '../users/entities/user.entity';
import { Role } from '../auth/enums/roles.enum';
import { IActiveUser } from '../auth/interface/payload.interface';
import { CustomerContact } from '../customers/entities/customer_contact.entity';
import { UsersService } from '../users/users.service';
import { ProjectResponseDto } from './dto/project-response.dto';
import { ProjectUserResponseDto } from './dto/project-user-response.dto';
import { plainToInstance } from 'class-transformer';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ProjectAssignedEvent } from 'src/mails/events/project-assigned.event';
import { ProjectUnassignedEvent } from 'src/mails/events/project-unassigned.event';

@Injectable()
export class ProjectsService {
  private readonly logger = new Logger(ProjectsService.name);

  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(CustomerContact)
    private readonly customerContactRepository: Repository<CustomerContact>,
    private readonly usersService: UsersService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(
    createProjectDto: CreateProjectDto,
  ): Promise<ProjectResponseDto> {
    const {
      projectLeaderId,
      technicianIds,
      customerContactId,
      ...projectData
    } = createProjectDto;

    this.logger.log(`Creating new project: ${projectData.title}`);

    // 1. Validate Project Leader (Manager)
    const leader = await this.userRepository.findOne({
      where: { id: projectLeaderId },
      relations: ['role', 'profile'],
    });

    if (!leader) {
      throw new NotFoundException(
        `Project Leader with ID ${projectLeaderId} not found`,
      );
    }

    const roleName = leader.role?.name?.toLowerCase() || '';
    if (roleName !== 'manager' && roleName !== 'admin') {
      throw new BadRequestException(
        `User ${leader.email} is not a Manager or Admin. Current role: ${leader.role.name}. Only Managers/Admins can be Project Leaders.`,
      );
    }

    // 2. Validate Technicians
    let technicians: User[] = [];
    if (technicianIds && technicianIds.length > 0) {
      technicians = await this.userRepository.find({
        where: { id: In(technicianIds) },
        relations: ['role', 'profile'],
      });

      if (technicians.length !== technicianIds.length) {
        throw new NotFoundException('One or more technicians not found');
      }

      for (const tech of technicians) {
        const techRole = tech.role?.name?.toLowerCase() || '';
        if (techRole !== 'technician' && techRole !== 'employee') {
          throw new BadRequestException(
            `User ${tech.email} is not a Technician or Employee. Current role: ${tech.role?.name}`,
          );
        }
      }
    }

    // 3. Validate Customer Contact
    const customerContact = await this.customerContactRepository.findOne({
      where: { id: customerContactId },
    });

    if (!customerContact) {
      this.logger.warn(
        `Customer Contact with ID ${customerContactId} not found`,
      );
      throw new NotFoundException(
        `Customer Contact with ID ${customerContactId} not found`,
      );
    }

    // 4. Create Project
    const project = this.projectRepository.create({
      ...projectData,
      projectLeader: leader,
      technicians: technicians,
      customerContact: customerContact,
    });

    const savedProject = await this.projectRepository.save(project);
    this.logger.log(`Project created successfully with ID: ${savedProject.id}`);

    // Emit Assignment Events
    if (savedProject.technicians && savedProject.technicians.length > 0) {
      for (const tech of savedProject.technicians) {
        if (tech.email) {
          this.eventEmitter.emit(
            'project.assigned',
            new ProjectAssignedEvent(
              tech.email,
              tech.profile?.name || 'Technician',
              savedProject.title,
              savedProject.description || 'No description provided',
              savedProject.id,
              savedProject.startDate?.toString(),
              savedProject.poolHours,
            ),
          );
        }
      }
    }

    return this.mapToResponseDto(savedProject);
  }

  async findAll(
    pageOptionsDto: ProjectPageOptionsDto,
    user?: IActiveUser,
  ): Promise<PageDto<ProjectResponseDto>> {
    this.logger.log('Fetching projects with filters');
    const queryBuilder = this.projectRepository.createQueryBuilder('project');

    // ✅ INCLUIR TODAS LAS RELACIONES NECESARIAS
    queryBuilder
      .leftJoinAndSelect('project.projectLeader', 'projectLeader')
      .leftJoinAndSelect('projectLeader.profile', 'leaderProfile')
      .leftJoinAndSelect('projectLeader.role', 'leaderRole')
      .leftJoinAndSelect('project.technicians', 'technicians')
      .leftJoinAndSelect('technicians.profile', 'techProfile')
      .leftJoinAndSelect('technicians.role', 'techRole')
      .leftJoinAndSelect('project.customerContact', 'customerContact')
      .leftJoinAndSelect('customerContact.customer', 'customer')
      .leftJoinAndSelect('project.tasks', 'tasks');

    if (pageOptionsDto.status) {
      queryBuilder.andWhere('project.status = :status', {
        status: pageOptionsDto.status,
      });
    }

    if (pageOptionsDto.leaderId) {
      queryBuilder.andWhere('projectLeader.id = :leaderId', {
        leaderId: pageOptionsDto.leaderId,
      });
    }

    if (pageOptionsDto.technicianId) {
      queryBuilder.andWhere('technicians.id = :technicianId', {
        technicianId: pageOptionsDto.technicianId,
      });
    }

    if (this.isTechnician(user)) {
      queryBuilder.andWhere('technicians.id = :userId', {
        userId: user.userId,
      });
    }

    if (pageOptionsDto.q) {
      queryBuilder.andWhere('project.title LIKE :q', {
        q: `%${pageOptionsDto.q}%`,
      });
    }

    queryBuilder
      .orderBy('project.createdAt', pageOptionsDto.order)
      .skip(pageOptionsDto.skip)
      .take(pageOptionsDto.take);

    const itemCount = await queryBuilder.getCount();
    const { entities } = await queryBuilder.getRawAndEntities();

    const pageMetaDto = new PageMeta(pageOptionsDto, itemCount);

    // ✅ MAPEAR CON LOS DATOS COMPLETOS
    const dtos = entities.map((entity) => {
      const dto = this.mapToResponseDto(entity);
      
      // ✅ AGREGAR DATOS DEL CLIENTE
      if (entity.customerContact?.customer) {
        dto.customer_id = entity.customerContact.customer.id;
        dto.customer_name = entity.customerContact.customer.name;
        dto.contact_name = entity.customerContact.name;
        dto.contact_email = entity.customerContact.email;
      }
      
      // ✅ AGREGAR DATOS DEL LÍDER
      if (entity.projectLeader) {
        dto.leader_email = entity.projectLeader.email;
        dto.leader_name = entity.projectLeader.profile?.name || entity.projectLeader.email;
      }
      
      return dto;
    });

    return new PageDto(dtos, pageMetaDto);
  }

  async findOne(
    id: string,
    user?: IActiveUser,
  ): Promise<ProjectResponseDto> {
    const project = await this.projectRepository.findOne({
      where: { id },
      relations: [
        'projectLeader',
        'projectLeader.profile',
        'projectLeader.role',
        'technicians',
        'technicians.profile',
        'technicians.role',
        'tasks',
        'customerContact',
        'customerContact.customer',
      ],
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }

    if (this.isTechnician(user)) {
      const isMember =
        project.technicians?.some((t) => t.id === user.userId) ||
        project.projectLeader?.id === user.userId;
      if (!isMember) {
        throw new ForbiddenException(
          'You do not have access to this project',
        );
      }
    }

    return this.mapToResponseDto(project);
  }

  async update(
    id: string,
    updateProjectDto: UpdateProjectDto,
  ): Promise<ProjectResponseDto> {
    this.logger.log(`Updating project with ID: ${id}`);
    const project = await this.projectRepository.findOne({
      where: { id },
      relations: ['projectLeader', 'technicians'],
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }

    const { projectLeaderId, technicianIds, customerContactId, ...updateData } =
      updateProjectDto;

    // Update Scalar fields
    Object.assign(project, updateData);

    // Update Relations
    if (projectLeaderId) {
      const leader = await this.userRepository.findOne({
        where: { id: projectLeaderId },
        relations: ['role'],
      });
      if (!leader)
        throw new NotFoundException(
          `Project Leader with ID ${projectLeaderId} not found`,
        );
      
      const roleName = leader.role?.name?.toLowerCase() || '';
      if (roleName !== 'manager' && roleName !== 'admin') {
        throw new BadRequestException(
          `User ${leader.email} is not a Manager or Admin. Current role: ${leader.role?.name}`
        );
      }
      project.projectLeader = leader;
    }

    // Capture old technicians for event diffing
    const oldTechnicians = project.technicians || [];

    if (technicianIds) {
      const technicians = await this.userRepository.find({
        where: { id: In(technicianIds) },
        relations: ['role', 'profile'],
      });
      if (technicians.length !== technicianIds.length) {
        throw new NotFoundException('One or more technicians not found');
      }
      
      for (const tech of technicians) {
        const techRole = tech.role?.name?.toLowerCase() || '';
        if (techRole !== 'technician' && techRole !== 'employee') {
          throw new BadRequestException(
            `User ${tech.email} is not a Technician or Employee. Current role: ${tech.role?.name}`,
          );
        }
      }
      project.technicians = technicians;

      // Handle Events
      const oldTechIds = oldTechnicians.map((t) => t.id);
      const newTechIds = technicians.map((t) => t.id);

      // Added Technicians
      const addedTechs = technicians.filter((t) => !oldTechIds.includes(t.id));
      for (const tech of addedTechs) {
        if (tech.email) {
          this.eventEmitter.emit(
            'project.assigned',
            new ProjectAssignedEvent(
              tech.email,
              tech.profile?.name || 'Technician',
              project.title,
              project.description || 'No description provided',
              project.id,
              project.startDate?.toString(),
              project.poolHours,
            ),
          );
        }
      }

      // Removed Technicians
      const removedTechs = oldTechnicians.filter(
        (t) => !newTechIds.includes(t.id),
      );
      for (const tech of removedTechs) {
        if (tech.email) {
          this.eventEmitter.emit(
            'project.unassigned',
            new ProjectUnassignedEvent(
              tech.email,
              tech.profile?.name || 'Technician',
              project.title,
              project.id,
            ),
          );
        }
      }
    }

    if (customerContactId) {
      const contact = await this.customerContactRepository.findOne({
        where: { id: customerContactId },
      });
      if (!contact)
        throw new NotFoundException(
          `Customer Contact with ID ${customerContactId} not found`,
        );
      project.customerContact = contact;
    }

    const savedProject = await this.projectRepository.save(project);

    // Refresh to get full relations for DTO mapping
    return this.findOne(savedProject.id);
  }

  async remove(id: string): Promise<void> {
    this.logger.log(`Soft deleting project with ID: ${id}`);
    const deleteResult = await this.projectRepository.softDelete({ id });
    if (deleteResult.affected === 0) {
      this.logger.warn(`Project with ID ${id} not found for deletion`);
      throw new NotFoundException(`Project with ID ${id} not found`);
    }
  }

  async restore(id: string): Promise<ProjectResponseDto> {
    this.logger.log(`Restoring project with ID: ${id}`);
    const restoreResult = await this.projectRepository.restore({ id });
    if (restoreResult.affected === 0) {
      this.logger.warn(`Project with ID ${id} not found for restoration`);
      throw new NotFoundException(`Project with ID ${id} not found`);
    }
    return this.findOne(id);
  }

  private isTechnician(user?: IActiveUser): user is IActiveUser {
    return !!user && String(user.role).toLowerCase() === 'technician';
  }

  async findLeaders(): Promise<User[]> {
    return this.usersService.findManagers();
  }

  async findTechnicians(): Promise<User[]> {
    return this.usersService.findTechnicians();
  }

  private mapToResponseDto(project: Project): ProjectResponseDto {
    const dto = plainToInstance(ProjectResponseDto, project, {
      excludeExtraneousValues: true,
    });

    if (project.projectLeader) {
      dto.projectLeader = this.mapUserToProjectUserDto(project.projectLeader);
    }

    if (project.technicians) {
      dto.technicians = project.technicians.map((t) =>
        this.mapUserToProjectUserDto(t),
      );
    }

    // Calculated property from entity getter
    dto.poolHoursWorked = project.poolHoursWorked;

    // ✅ AGREGAR DATOS DEL CLIENTE Y CONTACTO
    if (project.customerContact) {
      if (project.customerContact.customer) {
        dto.customer_id = project.customerContact.customer.id;
        dto.customer_name = project.customerContact.customer.name;
      }
      dto.contact_name = project.customerContact.name;
      dto.contact_email = project.customerContact.email;
    }

    // ✅ AGREGAR DATOS DEL LÍDER
    if (project.projectLeader) {
      dto.leader_email = project.projectLeader.email;
      dto.leader_name = project.projectLeader.profile?.name || project.projectLeader.email;
    }

    return dto;
  }

  private mapUserToProjectUserDto(user: User): ProjectUserResponseDto {
    return {
      id: user.id,
      name: user.profile?.name,
      lastName: user.profile?.lastName,
      role: user.role?.name,
      position: user.profile?.position,
      idCard: user.profile?.idCard,
      profilePicture: user.profile?.profilePicture,
      metadata: {
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        deletedAt: user.deletedAt,
      },
    } as ProjectUserResponseDto;
  }
}