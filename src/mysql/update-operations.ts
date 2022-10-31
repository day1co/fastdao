import { Knex } from 'knex';
import type { IdType, RowType } from '../crud.type';

import { CrudFilter, MysqlCrudOperationsOpts, UpdateOperations } from '../crud-operations.interface';
import { Extensions } from './extensions';

export class UpdateOps<ID extends IdType = number, ROW extends RowType = RowType>
  extends Extensions<ID, ROW>
  implements UpdateOperations<ID, ROW>
{
  public readonly knex: Knex | Knex.Transaction;
  public readonly knexReplica: Knex | Knex.Transaction;

  constructor(opts: MysqlCrudOperationsOpts<ID, ROW>) {
    super(opts); // table, idColumn, created(updated)AtColumn : support extends
    this.knex = opts.knex;
    this.knexReplica = opts.knexReplica || opts.knex;
  }

  //---------------------------------------------------------
  // UpdateOperation

  async updateById(id: ID, data: Partial<ROW>): Promise<number> {
    return this.knex(this.table).where(this.idColumn, id).update(data);
  }

  async update(filter: CrudFilter<ID, ROW>, data: Partial<ROW>): Promise<number> {
    return this.knex(this.table)
      .modify((queryBuilder) => {
        this.applyFilter(queryBuilder, filter);
      })
      .update(data);
  }
}
