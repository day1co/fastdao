import type { IdType, RowType } from './crud.type';

import { MysqlCrudOperationsOpts, MongoCrudOperationsOpts, CrudOperationsOpts } from './crud-operations.interface';

import { MysqlCrudOperations } from './mysql-crud-operations';
import { MongoCrudOperations, Schema } from './mongo-crud-operations';

export class CrudOperations<ID extends IdType = number, ROW extends RowType = RowType> {
  public static create<ID extends IdType = number, ROW extends RowType = RowType>(opts: CrudOperationsOpts<ID, ROW>) {
    if ('knex' in opts) return new MysqlCrudOperations<ID, ROW>(opts);
    if ('mongo' in opts) return new MongoCrudOperations<ID, ROW>(opts);
    throw Error('연결할 서비스가 없습니다.');
  }
  protected crud: null | MysqlCrudOperations | MongoCrudOperations;
  constructor(opts: CrudOperationsOpts<ID, ROW>) {
    this.crud = null;
  }
}

// class SelectOps<ID extends IdType = number, ROW extends RowType = RowType> implements SelectOperations<ID, ROW> {
//   protected selectOps: MysqlCrudOperations | MongoCrudOperations;
//   constructor(curdOps: CrudOperations) {
//     this.selectOps = curdOps;
//   }
//   select(
//     filter?: CrudFilter<ID, ROW> | undefined,
//     sorts?: Sort[] | undefined,
//     relations?: Relation[] | undefined
//   ): Promise<ROW[]> {
//     return this.selectOps.select(filter, sorts, relations);
//   }
//   count(filter?: CrudFilter<ID, ROW> | undefined): Promise<number> {
//     return this.selectOps.count(filter);
//   }
//   selectFirst(
//     filter?: CrudFilter<ID, ROW> | undefined,
//     sorts?: Sort[] | undefined,
//     relations?: Relation[] | undefined
//   ): Promise<ROW | undefined> {
//     return this.selectOps.selectFirst(filter, sorts, relations);
//   }
//   exist(filter?: CrudFilter<ID, ROW> | undefined): Promise<boolean> {
//     return this.selectOps.exist(filter);
//   }
//   selectById(id: ID, relations?: Relation[] | undefined): Promise<ROW | undefined> {
//     return this.selectOps.exist(id, relations);
//   }
// }
