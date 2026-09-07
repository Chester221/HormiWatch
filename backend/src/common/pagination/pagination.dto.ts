import { PageMeta } from './metadata';

export class PageDto<T> {
  readonly records: T[];
  readonly meta: PageMeta<any>;

  constructor(records: T[], meta: PageMeta<any>) {
    this.records = records;
    this.meta = meta;
  }
}
