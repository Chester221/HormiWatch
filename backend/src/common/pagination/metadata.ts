import { PageOptionsDto } from './pagination-options.dto';

export class PageMeta<T extends PageOptionsDto> {
  readonly page: number;
  readonly take: number;
  readonly skip: number;
  readonly itemCount: number;
  readonly pageCount: number;
  readonly hasPreviousPage: boolean;
  readonly hasNextPage: boolean;

  constructor(pageOptionsDto: T, itemCount: number) {
    this.page = pageOptionsDto.page;
    this.take = pageOptionsDto.take;
    this.skip = pageOptionsDto.skip;
    this.itemCount = itemCount;
    this.pageCount = Math.ceil(this.itemCount / this.take);
    this.hasPreviousPage = this.page > 1;
    this.hasNextPage = this.page < this.pageCount;
  }
}
