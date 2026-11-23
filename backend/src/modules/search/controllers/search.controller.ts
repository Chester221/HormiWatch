import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import type { IActiveUser } from '../../auth/interface/payload.interface';
import { CurrentUser } from '../../auth/decorator/current-user.decorator';
import { GlobalSearchQueryDto } from '../dto/global-search-query.dto';
import { GlobalSearchResult } from '../interfaces/global-search.interface';
import { SearchService } from '../services/search.service';

@Controller('search')
@ApiTags('Search')
@ApiBearerAuth()
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get('candidates')
  @ApiOperation({
    summary: 'Catálogo ligero para búsqueda fuzzy en el frontend',
  })
  @ApiOkResponse({ description: 'Hasta 50 ítems por categoría, sin término de búsqueda.' })
  candidates(@CurrentUser() user: IActiveUser): Promise<GlobalSearchResult> {
    return this.searchService.candidates(user);
  }

  @Get()
  @ApiOperation({
    summary:
      'Búsqueda global agrupada por proyectos, tareas, clientes, usuarios y servicios',
  })
  @ApiOkResponse({
    description:
      'Resultados agrupados. Un grupo puede venir vacío si su dominio falló.',
  })
  search(
    @Query() query: GlobalSearchQueryDto,
    @CurrentUser() user: IActiveUser,
  ): Promise<GlobalSearchResult> {
    return this.searchService.search(query, user);
  }
}
