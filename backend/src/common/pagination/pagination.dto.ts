import { ApiProperty } from '@nestjs/swagger';
import { PageMeta } from './metadata';

export class PageDto<T> {
  @ApiProperty({ isArray: true })
  readonly records: T[];

  @ApiProperty()
  readonly meta: PageMeta;

  constructor(records: T[], meta: PageMeta) {
    this.records = records;
    this.meta = meta;
  }
}