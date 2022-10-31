import type { IdType, RowType } from './crud.type';

import { CrudOperationsOpts } from './crud-operations.interface';

import { MysqlCrudOperations } from './mysql-crud-operations';
import { MongoCrudOperations, Schema } from './mongo-crud-operations';

export class CrudOperations<ID extends IdType = number, ROW extends RowType = RowType> {
  public static create<ID extends IdType = number, ROW extends RowType = RowType>(opts: CrudOperationsOpts<ID, ROW>) {
    if ('knex' in opts) return new MysqlCrudOperations<ID, ROW>(opts);
    if ('mongo' in opts) return new MongoCrudOperations<ID, ROW>(opts);
    throw new Error('연결할 서비스가 없습니다.');
  }
}
