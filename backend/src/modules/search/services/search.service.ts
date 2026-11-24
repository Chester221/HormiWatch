import { Injectable, Logger } from '@nestjs/common';

import { PageDto } from '../../../common/pagination/pagination.dto';
import type { IActiveUser } from '../../auth/interface/payload.interface';
import type { Customer } from '../../customers/entities/customer.entity';
import { FindAllCustomersQueryDto } from '../../customers/dto/find-all-customers-query.dto';
import { CustomersService } from '../../customers/services/customers.service';
import { ProjectPageOptionsDto } from '../../projects/dto/project-page-options.dto';
import type { ProjectResponseDto } from '../../projects/dto/project-response.dto';
import { ProjectsService } from '../../projects/projects.service';
import { ServicePageOptionsDto } from '../../services/dto/service-page-options.dto';
import type { ServiceResponseDto } from '../../services/dto/service-response.dto';
import { ServicesService } from '../../services/services/services.service';
import { FilterTaskDto } from '../../tasks/dto/filter-task.dto';
import type { Task } from '../../tasks/entities/task.entity';
import { TasksService } from '../../tasks/tasks.service';
import { UserPageOptionsDto } from '../../users/dto/user-page-options.dto';
import type { UserResponseDto } from '../../users/dto/user-response.dto';
import { UsersService } from '../../users/users.service';
import { GlobalSearchQueryDto } from '../dto/global-search-query.dto';
import {
  GlobalSearchResult,
  SearchItem,
} from '../interfaces/global-search.interface';

type Visibility = {
  canSearchPeople: boolean;
  hideAdmins: boolean;
};

type SearchSettled = [
  PromiseSettledResult<PageDto<ProjectResponseDto>>,
  PromiseSettledResult<PageDto<Task>>,
  PromiseSettledResult<PageDto<Customer> | null>,
  PromiseSettledResult<PageDto<UserResponseDto> | null>,
  PromiseSettledResult<PageDto<ServiceResponseDto>>,
];

const resolveVisibility = (role?: string): Visibility => {
  const normalized = (role ?? '').toLowerCase();
  return {
    canSearchPeople: ['admin', 'manager', 'leader'].includes(normalized),
    hideAdmins: normalized === 'manager' || normalized === 'leader',
  };
};

const mapProject = (project: ProjectResponseDto): SearchItem => ({
  id: project.id,
  title: project.title,
  subtitle: project.customer_name || project.description || undefined,
  meta: project.status,
});

const mapTask = (task: Task): SearchItem => ({
  id: task.id,
  title: task.title || task.description,
  subtitle: task.project?.title || task.service?.name || undefined,
  meta: task.status,
});

const mapCustomer = (customer: Customer): SearchItem => ({
  id: customer.id,
  title: customer.name,
  subtitle:
    [customer.rif, customer.city, customer.country]
      .filter(Boolean)
      .join(' · ') || undefined,
});

const mapUser = (
  candidate: UserResponseDto,
  hideAdmins: boolean,
): SearchItem | null => {
  if (
    hideAdmins &&
    (candidate.role?.name ?? '').toLowerCase() === 'admin'
  ) {
    return null;
  }

  return {
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
  };
};

const mapService = (service: ServiceResponseDto): SearchItem => ({
  id: service.id,
  title: service.name,
  subtitle: service.description || undefined,
  meta: service.category?.name,
});

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
    const visibility = resolveVisibility(user?.role);
    const settled = await this.queryAll(
      query.q.trim(),
      query.limit ?? 5,
      visibility,
      undefined,
      user,
    );
    return this.mapAll(settled, query.limit ?? 5, visibility);
  }

  /** Catálogo ligero para el filtrado fuzzy del frontend. Sin `q`, una sola vez por sesión. */
  async candidates(user?: IActiveUser): Promise<GlobalSearchResult> {
    const visibility = resolveVisibility(user?.role);
    const settled = await this.queryAll(
      null,
      50,
      visibility,
      'DESC',
      user,
    );
    return this.mapAll(settled, 50, visibility);
  }

  private buildQueries(
    q: string | null,
    limit: number,
    visibility: Visibility,
    order?: 'ASC' | 'DESC',
  ) {
    const direction: Record<string, unknown> = order ? { order } : {};

    const projectQuery = Object.assign(new ProjectPageOptionsDto(), {
      ...(q ? { q, matchRelations: true, rankByPrefix: true } : {}),
      take: limit,
      ...direction,
    });
    const taskQuery = Object.assign(new FilterTaskDto(), {
      ...(q ? { q, matchRelations: true, rankByPrefix: true } : {}),
      take: limit,
      ...direction,
    });
    const customerQuery = Object.assign(new FindAllCustomersQueryDto(), {
      ...(q ? { search: q, rankByPrefix: true } : {}),
      take: limit,
      includeContacts: false,
      ...direction,
    });
    const userQuery = Object.assign(new UserPageOptionsDto(), {
      ...(q ? { q, rankByPrefix: true } : {}),
      // Pedimos más para poder descartar admins sin quedarnos cortos.
      take: visibility.hideAdmins ? Math.min(limit * 4, 100) : limit,
      ...direction,
    });
    const serviceQuery = Object.assign(new ServicePageOptionsDto(), {
      ...(q ? { q, rankByPrefix: true } : {}),
      take: limit,
      ...direction,
    });

    return { projectQuery, taskQuery, customerQuery, userQuery, serviceQuery };
  }

  private async queryAll(
    q: string | null,
    limit: number,
    visibility: Visibility,
    order?: 'ASC' | 'DESC',
    user?: IActiveUser,
  ): Promise<SearchSettled> {
    const { projectQuery, taskQuery, customerQuery, userQuery, serviceQuery } =
      this.buildQueries(q, limit, visibility, order);

    return (await Promise.allSettled([
      this.projectsService.findAll(projectQuery, user),
      this.tasksService.findAll(taskQuery, user),
      visibility.canSearchPeople
        ? this.customersService.findAllCustomers(customerQuery)
        : Promise.resolve(null),
      visibility.canSearchPeople
        ? this.usersService.findAll(userQuery)
        : Promise.resolve(null),
      this.servicesService.findAll(serviceQuery),
    ])) as SearchSettled;
  }

  private mapAll(
    settled: SearchSettled,
    limit: number,
    visibility: Visibility,
  ): GlobalSearchResult {
    return {
      projects: this.mapCategory(settled[0], 'projects', limit, mapProject),
      tasks: this.mapCategory(settled[1], 'tasks', limit, mapTask),
      customers: this.mapCategory(settled[2], 'customers', limit, mapCustomer),
      users: this.mapCategory(settled[3], 'users', limit, (candidate) =>
        mapUser(candidate, visibility.hideAdmins),
      ),
      services: this.mapCategory(settled[4], 'services', limit, mapService),
    };
  }

  private mapCategory<T>(
    result: PromiseSettledResult<PageDto<T> | null>,
    label: string,
    limit: number,
    mapper: (record: T) => SearchItem | null,
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

    const items: SearchItem[] = [];
    for (const record of result.value?.records ?? []) {
      const item = mapper(record);
      if (item) items.push(item);
      if (items.length >= limit) break;
    }
    return items;
  }
}
