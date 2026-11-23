import { Injectable, Logger } from '@nestjs/common';

import { IActiveUser } from '../../auth/interface/payload.interface';
import { FindAllCustomersQueryDto } from '../../customers/dto/find-all-customers-query.dto';
import { CustomersService } from '../../customers/services/customers.service';
import { ProjectPageOptionsDto } from '../../projects/dto/project-page-options.dto';
import { ProjectsService } from '../../projects/projects.service';
import { ServicePageOptionsDto } from '../../services/dto/service-page-options.dto';
import { ServicesService } from '../../services/services/services.service';
import { FilterTaskDto } from '../../tasks/dto/filter-task.dto';
import { TasksService } from '../../tasks/tasks.service';
import { UserPageOptionsDto } from '../../users/dto/user-page-options.dto';
import { UsersService } from '../../users/users.service';
import { GlobalSearchQueryDto } from '../dto/global-search-query.dto';
import {
  GlobalSearchResult,
  SearchItem,
} from '../interfaces/global-search.interface';

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

  constructor(
    private readonly projectsService: ProjectsService,
    private readonly tasksService: TasksService,
    private readonly customersService: CustomersService,
    private readonly usersService: UsersService,
    private readonly servicesService: ServicesService,
  ) {}

  async search(
    query: GlobalSearchQueryDto,
    user?: IActiveUser,
  ): Promise<GlobalSearchResult> {
    const q = query.q.trim();
    const limit = query.limit ?? 5;
    const role = (user?.role ?? '').toLowerCase();
    const canSearchPeople = ['admin', 'manager', 'leader'].includes(role);
    const hideAdmins = role === 'manager' || role === 'leader';

    const projectQuery = Object.assign(new ProjectPageOptionsDto(), {
      q,
      take: limit,
    });
    const taskQuery = Object.assign(new FilterTaskDto(), { q, take: limit });
    const customerQuery = Object.assign(new FindAllCustomersQueryDto(), {
      search: q,
      take: limit,
      includeContacts: false,
    });
    const userQuery = Object.assign(new UserPageOptionsDto(), {
      q,
      // Pedimos más para poder descartar admins sin quedarnos cortos.
      take: hideAdmins ? Math.min(limit * 4, 50) : limit,
    });
    const serviceQuery = Object.assign(new ServicePageOptionsDto(), {
      q,
      take: limit,
    });

    // Cada dominio falla de forma independiente: un módulo caído no rompe
    // los demás grupos del buscador.
    const settled = await Promise.allSettled([
      this.projectsService.findAll(projectQuery, user),
      this.tasksService.findAll(taskQuery, user),
      canSearchPeople
        ? this.customersService.findAllCustomers(customerQuery)
        : Promise.resolve(null),
      canSearchPeople
        ? this.usersService.findAll(userQuery)
        : Promise.resolve(null),
      this.servicesService.findAll(serviceQuery),
    ]);

    return {
      projects: this.unwrap(settled[0], 'projects', (page) =>
        page.records.slice(0, limit).map((project) => ({
          id: project.id,
          title: project.title,
          subtitle: project.customer_name || project.description || undefined,
          meta: project.status,
        })),
      ),
      tasks: this.unwrap(settled[1], 'tasks', (page) =>
        page.records.slice(0, limit).map((task) => ({
          id: task.id,
          title: task.title || task.description,
          subtitle: task.project?.title || task.service?.name || undefined,
          meta: task.status,
        })),
      ),
      customers: this.unwrap(settled[2], 'customers', (page) =>
        page.records.slice(0, limit).map((customer) => ({
          id: customer.id,
          title: customer.name,
          subtitle:
            [customer.rif, customer.city, customer.country]
              .filter(Boolean)
              .join(' · ') || undefined,
        })),
      ),
      users: this.unwrap(settled[3], 'users', (page) =>
        page.records
          .filter(
            (candidate) =>
              !hideAdmins ||
              (candidate.role?.name ?? '').toLowerCase() !== 'admin',
          )
          .slice(0, limit)
          .map((candidate) => ({
            id: candidate.id,
            title:
              candidate.profile?.full_name ||
              [candidate.profile?.name, candidate.profile?.lastName]
                .filter(Boolean)
                .join(' ')
                .trim() ||
              candidate.email,
            subtitle: candidate.email,
            meta: candidate.role?.name,
          })),
      ),
      services: this.unwrap(settled[4], 'services', (page) =>
        page.records.slice(0, limit).map((service) => ({
          id: service.id,
          title: service.name,
          subtitle: service.description || undefined,
          meta: service.category?.name,
        })),
      ),
    };
  }

  private unwrap<T>(
    result: PromiseSettledResult<T | null>,
    label: string,
    mapper: (value: T) => SearchItem[],
  ): SearchItem[] {
    if (result.status === 'rejected') {
      const reason = result.reason;
      this.logger.error(
        `Global search failed for "${label}": ${
          reason instanceof Error ? reason.message : String(reason)
        }`,
        reason instanceof Error ? reason.stack : undefined,
      );
      return [];
    }

    return result.value ? mapper(result.value) : [];
  }
}
